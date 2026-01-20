// This file is part of Substrate.

// Copyright (C) Parity Technologies (UK) Ltd.
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use crate::{
	AccountId, BalancesConfig, GovernedMapConfig, RuntimeGenesisConfig, SudoConfig,
	test_helper_pallet,
};
use alloc::{vec, vec::Vec};
use alloc::collections::BTreeMap;
use serde_json::Value;
use sp_consensus_aura::sr25519::AuthorityId as AuraId;
use sp_consensus_grandpa::AuthorityId as GrandpaId;
use sp_genesis_builder::{self, PresetId};
use sp_keyring::Sr25519Keyring;
use fp_evm::GenesisAccount;
use ethereum_types::{H160, U256};

// Returns the genesis config presets populated with given parameters.
fn testnet_genesis(
	initial_authorities: Vec<(AuraId, GrandpaId)>,
	endowed_accounts: Vec<AccountId>,
	root: AccountId,
) -> Value {
	let config = RuntimeGenesisConfig {
		balances: BalancesConfig {
			balances: endowed_accounts
				.iter()
				.cloned()
				.map(|k| (k, 1u128 << 60))
				.collect::<Vec<_>>(),
			dev_accounts: None,
		},
		aura: pallet_aura::GenesisConfig {
			authorities: initial_authorities.iter().map(|x| x.0.clone()).collect::<Vec<_>>(),
		},
		grandpa: pallet_grandpa::GenesisConfig {
			authorities: initial_authorities.iter().map(|x| (x.1.clone(), 1)).collect::<Vec<_>>(),
			..Default::default()
		},
		sudo: SudoConfig { key: Some(root) },
		test_helper_pallet: test_helper_pallet::GenesisConfig {
			participation_data_release_period:
				test_helper_pallet::DEFAULT_PARTICIPATION_DATA_RELEASE_PERIOD,
			_phantom: core::marker::PhantomData,
		},
		system: Default::default(),
		transaction_payment: Default::default(),
		sidechain: Default::default(),
		session_committee_management: Default::default(),
		pallet_session: Default::default(),
		session: Default::default(),
		governed_map: GovernedMapConfig {
			main_chain_scripts: Some(sp_governed_map::MainChainScriptsV1::default()),
			..Default::default()
		},
		bridge: Default::default(),
		// EVM genesis configs
		ethereum: Default::default(),
		evm: pallet_evm::GenesisConfig {
			accounts: {
				let mut map = BTreeMap::new();
				// Foundry/Anvil dev account 1: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
				// Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
				map.insert(
					H160([0xf3, 0x9F, 0xd6, 0xe5, 0x1a, 0xad, 0x88, 0xF6, 0xF4, 0xce,
					      0x6a, 0xB8, 0x82, 0x72, 0x79, 0xcf, 0xfF, 0xb9, 0x22, 0x66]),
					GenesisAccount {
						balance: U256::from(10_000_000_000_000_000_000_000_000_000u128),
						code: Default::default(),
						nonce: Default::default(),
						storage: Default::default(),
					},
				);
				// Foundry/Anvil dev account 2: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
				// Private key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
				map.insert(
					H160([0x70, 0x99, 0x79, 0x70, 0xC5, 0x18, 0x12, 0xdc, 0x3A, 0x01,
					      0x0C, 0x7d, 0x01, 0xb5, 0x0e, 0x0d, 0x17, 0xdc, 0x79, 0xC8]),
					GenesisAccount {
						balance: U256::from(10_000_000_000_000_000_000_000_000_000u128),
						code: Default::default(),
						nonce: Default::default(),
						storage: Default::default(),
					},
				);
				// Foundry/Anvil dev account 3: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
				// Private key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
				map.insert(
					H160([0x3C, 0x44, 0xCd, 0xDd, 0xB6, 0xa9, 0x00, 0xfa, 0x2b, 0x58,
					      0x5d, 0xd2, 0x99, 0xe0, 0x3d, 0x12, 0xFA, 0x42, 0x93, 0xBC]),
					GenesisAccount {
						balance: U256::from(10_000_000_000_000_000_000_000_000_000u128),
						code: Default::default(),
						nonce: Default::default(),
						storage: Default::default(),
					},
				);
				map
			},
			..Default::default()
		},
	};

	serde_json::to_value(config).expect("Could not build genesis config.")
}

/// Return the development genesis config.
pub fn development_config_genesis() -> Value {
	testnet_genesis(
		vec![(
			sp_keyring::Sr25519Keyring::Alice.public().into(),
			sp_keyring::Ed25519Keyring::Alice.public().into(),
		)],
		vec![
			Sr25519Keyring::Alice.to_account_id(),
			Sr25519Keyring::Bob.to_account_id(),
			Sr25519Keyring::AliceStash.to_account_id(),
			Sr25519Keyring::BobStash.to_account_id(),
		],
		sp_keyring::Sr25519Keyring::Alice.to_account_id(),
	)
}

/// Return the local genesis config preset.
pub fn local_config_genesis() -> Value {
	testnet_genesis(
		vec![
			(
				sp_keyring::Sr25519Keyring::Alice.public().into(),
				sp_keyring::Ed25519Keyring::Alice.public().into(),
			),
			(
				sp_keyring::Sr25519Keyring::Bob.public().into(),
				sp_keyring::Ed25519Keyring::Bob.public().into(),
			),
		],
		Sr25519Keyring::iter()
			.filter(|v| v != &Sr25519Keyring::One && v != &Sr25519Keyring::Two)
			.map(|v| v.to_account_id())
			.collect::<Vec<_>>(),
		Sr25519Keyring::Alice.to_account_id(),
	)
}

/// Provides the JSON representation of predefined genesis config for given `id`.
pub fn get_preset(id: &PresetId) -> Option<Vec<u8>> {
	let patch = match id.as_ref() {
		sp_genesis_builder::DEV_RUNTIME_PRESET => development_config_genesis(),
		sp_genesis_builder::LOCAL_TESTNET_RUNTIME_PRESET => local_config_genesis(),
		_ => return None,
	};
	Some(
		serde_json::to_string(&patch)
			.expect("serialization to json is expected to work. qed.")
			.into_bytes(),
	)
}

/// List of supported presets.
pub fn preset_names() -> Vec<PresetId> {
	vec![
		PresetId::from(sp_genesis_builder::DEV_RUNTIME_PRESET),
		PresetId::from(sp_genesis_builder::LOCAL_TESTNET_RUNTIME_PRESET),
	]
}
