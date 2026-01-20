FROM docker.io/paritytech/ci-unified:latest AS builder

# Copy the entire context (parent dir containing partner-chains and frontier)
COPY . /source

# Set workdir to the partner-chains repo
WORKDIR /source/partner-chains

ENV RUSTUP_HOME="/source/partner-chains/docker-build/rustup-home"
ENV CARGO_HOME="/source/partner-chains/docker-build/cargo-home"

RUN cargo build --release --target-dir=docker-build/target && \
	mkdir -p /partner-chains-node && \
	cp docker-build/target/release/partner-chains-demo-node /partner-chains-node/partner-chains-demo-node
