//! A collection of node-specific RPC methods.
//! Substrate provides the `sc-rpc` crate, which defines the core RPC layer
//! used by Substrate nodes. This file extends those RPC definitions with
//! capabilities that are specific to this project's runtime configuration.

#![warn(missing_docs)]

use crate::data_sources::DataSources;
use authority_selection_inherents::{
	AuthoritySelectionInputs, CandidateValidationApi, CommitteeMember,
};
use jsonrpsee::RpcModule;
use pallet_block_producer_fees_rpc::*;
use pallet_block_producer_metadata_rpc::*;
use pallet_session_validator_management_rpc::*;
use pallet_sidechain_rpc::*;
use partner_chains_demo_runtime::{
	AccountId, Balance, Nonce,
	opaque::{Block, SessionKeys},
};
use partner_chains_demo_runtime::{BlockNumber, BlockProducerMetadataType, CrossChainPublic, Hash};
use sc_consensus_grandpa::{
	FinalityProofProvider, GrandpaJustificationStream, SharedAuthoritySet, SharedVoterState,
};
use sc_consensus_grandpa_rpc::{Grandpa, GrandpaApiServer};
use sc_rpc::SubscriptionTaskExecutor;
use sc_transaction_pool_api::TransactionPool;
use sidechain_domain::ScEpochNumber;
use sidechain_domain::mainchain_epoch::MainchainEpochConfig;
use sp_api::ProvideRuntimeApi;
use sp_block_builder::BlockBuilder;
use sp_blockchain::{Error as BlockChainError, HeaderBackend, HeaderMetadata};
use sp_session_validator_management_query::SessionValidatorManagementQuery;
use std::sync::Arc;
use time_source::TimeSource;

// Frontier Imports (Locked Mode)
use fc_rpc::{
	Eth, EthApiServer, Net, NetApiServer, Web3, Web3ApiServer,
	EthFilter, EthFilterApiServer, EthPubSub, EthPubSubApiServer,
};
use fc_rpc::{EthBlockDataCacheTask, EthConfig};
use fc_rpc_core::types::{FeeHistoryCache, FeeHistoryCacheLimit, FilterPool};
use fc_storage::{StorageOverride, StorageOverrideHandler};
use fp_rpc::{ConvertTransaction, ConvertTransactionRuntimeApi, EthereumRuntimeRPCApi};
use sc_client_api::backend::{Backend, StorageProvider};
use sc_network_sync::SyncingService;
use sp_api::CallApiAt;
use sp_inherents::CreateInherentDataProviders;
use sp_runtime::traits::Block as BlockT;

/// Extra dependencies for GRANDPA
pub struct GrandpaDeps<B> {
	/// Voting round info.
	pub shared_voter_state: SharedVoterState,
	/// Authority set info.
	pub shared_authority_set: SharedAuthoritySet<Hash, BlockNumber>,
	/// Receives notifications about justification events from Grandpa.
	pub justification_stream: GrandpaJustificationStream<Block>,
	/// Executor to drive the subscription manager in the Grandpa RPC handler.
	pub subscription_executor: SubscriptionTaskExecutor,
	/// Finality proof provider.
	pub finality_provider: Arc<FinalityProofProvider<B, Block>>,
}

/// Full client dependencies.
pub struct FullDeps<C, P, B, T, CIDP> {
	/// The client instance to use.
	pub client: Arc<C>,
	/// Transaction pool instance.
	pub pool: Arc<P>,
	/// GRANDPA specific dependencies.
	pub grandpa: GrandpaDeps<B>,
	/// Data sources.
	pub data_sources: DataSources,
	/// Source of system time
	pub time_source: Arc<T>,

    // --- Frontier Dependencies (Template Aligned) ---
	/// Frontier Backend.
	pub frontier_backend: Arc<dyn fc_api::Backend<Block>>,
	/// Storage Overrides.
	pub overrides: Arc<dyn StorageOverride<Block>>,
	/// Network service
	pub network: Arc<dyn sc_network::service::traits::NetworkService>,
	/// Syncing service
	pub sync: Arc<SyncingService<Block>>,
    /// Block Data Cache
    pub block_data_cache: Arc<EthBlockDataCacheTask<Block>>,
    /// Filter Pool
    pub filter_pool: Option<FilterPool>,
    /// Fee History Cache
    pub fee_history_cache: FeeHistoryCache,
    /// Fee History Cache Limit
    pub fee_history_cache_limit: FeeHistoryCacheLimit,
    /// Execute Gas Limit Multiplier
    pub execute_gas_limit_multiplier: u64,
    /// Forced Parent Hashes
    pub forced_parent_hashes: Option<std::collections::BTreeMap<Hash, Hash>>,
    /// Pending Create Inherent Data Providers
    pub pending_create_inherent_data_providers: CIDP,
}

pub struct DefaultEthConfig<C, BE>(std::marker::PhantomData<(C, BE)>);

impl<C, BE> fc_rpc::EthConfig<Block, C> for DefaultEthConfig<C, BE>
where
	C: StorageProvider<Block, BE> + Sync + Send + 'static,
	BE: Backend<Block> + 'static,
{
	type EstimateGasAdapter = ();
	type RuntimeStorageOverride =
		fc_rpc::frontier_backend_client::SystemAccountId20StorageOverride<Block, C, BE>;
}


/// Instantiate all full RPC extensions.
pub fn create_full<C, P, B, T, BE, CIDP>(
	deps: FullDeps<C, P, B, T, CIDP>,
	subscription_task_executor: SubscriptionTaskExecutor,
    pubsub_notification_sinks: Arc<
		fc_mapping_sync::EthereumBlockNotificationSinks<
			fc_mapping_sync::EthereumBlockNotification<Block>,
		>,
	>,
) -> Result<RpcModule<()>, Box<dyn std::error::Error + Send + Sync>>
where
    // Substrate Bounds
	C: ProvideRuntimeApi<Block>,
	C: HeaderBackend<Block> + HeaderMetadata<Block, Error = BlockChainError> + 'static,
	C: Send + Sync + 'static,
	C::Api: substrate_frame_rpc_system::AccountNonceApi<Block, AccountId, Nonce>,
	C::Api: pallet_transaction_payment_rpc::TransactionPaymentRuntimeApi<Block, Balance>,
	C::Api: BlockBuilder<Block>,
	C::Api: sp_consensus_aura::AuraApi<Block, sp_consensus_aura::sr25519::AuthorityId>,
	C::Api: sidechain_slots::SlotApi<Block>,
	C::Api: sp_sidechain::GetGenesisUtxo<Block>,
	C::Api: sp_sidechain::GetSidechainStatus<Block>,
	C::Api: sp_block_producer_fees::BlockProducerFeesApi<Block, AccountId>,
	C::Api: sp_block_producer_metadata::BlockProducerMetadataApi<Block, BlockProducerMetadataType>,
	C::Api: sp_session_validator_management::SessionValidatorManagementApi<
			Block,
			CommitteeMember<CrossChainPublic, SessionKeys>,
			AuthoritySelectionInputs,
			ScEpochNumber,
		>,
	C::Api: CandidateValidationApi<Block>,
    // Frontier Bounds
	C::Api: EthereumRuntimeRPCApi<Block>,
	C::Api: fp_rpc::ConvertTransactionRuntimeApi<Block>,
	C: CallApiAt<Block>,
	C: StorageProvider<Block, BE>,
    C: sc_client_api::BlockchainEvents<Block>,
    // Generic Bounds
	P: TransactionPool<Block = Block, Hash = Hash> + 'static,
	B: sc_client_api::Backend<Block> + Send + Sync + 'static, // Existing B generic (actually this conflicts, see note below)
    // Wait, B is sc_client_api::Backend in original signature, but usually B is BlockT.
    // In original code: pub fn create_full<C, P, B, T>. Here B was Backend! 
    // Template uses B for BlockT. 
    // I should rename B to BE for Backend to avoid confusion, or fix generics map.
    // Original: B: sc_client_api::Backend<Block>.
    // So generic B is THE BACKEND. Generic Block is `Block` (concrete).
    // So BE in template corresponds to B in original code.
    // I will use BE for Backend to be clear, and remove the old 'B'.
	BE: Backend<Block> + 'static, 
    BE::State: sc_client_api::backend::StateBackend<sp_runtime::traits::HashingFor<Block>>,
	T: TimeSource + Send + Sync + 'static,
    CIDP: CreateInherentDataProviders<Block, ()> + Send + 'static,
{
	use pallet_transaction_payment_rpc::{TransactionPayment, TransactionPaymentApiServer};
	use substrate_frame_rpc_system::{System, SystemApiServer};

	let mut module = RpcModule::new(());
	let FullDeps { 
        client, 
        pool, 
        grandpa, 
        data_sources, 
        time_source, 
        frontier_backend, 
        overrides, 
        network, 
        sync,
        block_data_cache,
        fee_history_cache,
        fee_history_cache_limit,
        execute_gas_limit_multiplier,
        forced_parent_hashes,
        pending_create_inherent_data_providers,
        filter_pool
    } = deps;

	module.merge(System::new(client.clone(), pool.clone()).into_rpc())?;
	module.merge(TransactionPayment::new(client.clone()).into_rpc())?;
	module.merge(
		Grandpa::new(
			grandpa.subscription_executor,
			grandpa.shared_authority_set.clone(),
			grandpa.shared_voter_state,
			grandpa.justification_stream,
			grandpa.finality_provider,
		)
		.into_rpc(),
	)?;

    // Partner Chains RPCs
    module.merge(
        pallet_sidechain_rpc::SidechainRpc::new(
			client.clone(),
			MainchainEpochConfig::read_from_env().unwrap(),
			data_sources.sidechain_rpc.clone(),
			time_source.clone(),
		)
		.into_rpc(),
    )?;
    module.merge(
        pallet_session_validator_management_rpc::SessionValidatorManagementRpc::new(Arc::new(
			SessionValidatorManagementQuery::new(
				client.clone(),
				data_sources.authority_selection.clone(),
			)
		)).into_rpc(),
    )?;
    module.merge(
        pallet_block_producer_fees_rpc::BlockProducerFeesRpc::new(client.clone()).into_rpc(),
    )?;
    module.merge(
        pallet_block_producer_metadata_rpc::BlockProducerMetadataRpc::new(client.clone()).into_rpc(),
    )?;


	// --- Frontier RPCs ---
	let no_tx_converter: Option<fp_rpc::NoTransactionConverter> = None;

	module.merge(
		Eth::<Block, C, P, fp_rpc::NoTransactionConverter, BE, CIDP, DefaultEthConfig<C, BE>>::new(
			client.clone(),
			pool.clone(),
            no_tx_converter,
			sync.clone(),
			vec![], // signers
			overrides.clone(),
			frontier_backend.clone(),
			true, // is_authority
			block_data_cache.clone(),
			fee_history_cache,
			fee_history_cache_limit,
			execute_gas_limit_multiplier,
            forced_parent_hashes,
            pending_create_inherent_data_providers,
            None, // pending_consensus_data_provider (Aura not fully integrated here for pending yet?)
                  // Template passes Some(Box::new(AuraConsensusDataProvider::new(client.clone())))
                  // If I pass None, it might work if strict bound allows Option.
                  // Bound for Eth::new is Option<Box<dyn ConsensusDataProvider<B>>>. So None is fine.
		)
		.replace_config::<DefaultEthConfig<C, BE>>()
		.into_rpc(),
	)?;

    module.merge(
        Net::new(
            client.clone(),
            network.clone(),
            true,
        )
        .into_rpc(),
    )?;

    module.merge(Web3::new(client.clone()).into_rpc())?;

    // EthPubSub, EthFilter not added yet to keep it minimal as requested? 
    // "Phase E3 – RPC wiring ONLY." includes PubSub/Filter usually.
    // But objective says "eth_*, net_*, web3_*".
    // I'll add EthFilter and EthPubSub to be complete if possible.
    // Needs subscription_task_executor and pubsub_notification_sinks arguments.
    // I added them to function signature!

    if let Some(filter_pool) = filter_pool {
        module.merge(
            EthFilter::new(
                client.clone(),
                frontier_backend.clone(),
                pool.clone(),
                filter_pool,
                500_usize, // max stored filters
                1000, // max past logs
                block_data_cache.clone(),
            )
            .into_rpc(),
        )?;
    }
    
    module.merge(
        EthPubSub::new(
            pool.clone(),
            client.clone(),
            sync.clone(),
            subscription_task_executor,
            overrides.clone(),
            pubsub_notification_sinks.clone(),
        )
        .into_rpc(),
    )?;


	Ok(module)
}
