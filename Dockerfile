FROM rust:1.65 AS chef
WORKDIR /app
RUN cargo install cargo-chef 

FROM chef AS planner
COPY . .
RUN cargo chef prepare  --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM gcr.io/distroless/cc-debian11 AS runtime
COPY --from=builder /app/target/release/bookish-telegram /usr/local/bin/app
ENTRYPOINT ["/usr/local/bin/app"]
