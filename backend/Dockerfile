FROM rust:slim-bookworm AS builder

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

RUN cargo new --bin backend
WORKDIR /usr/src/app/backend

COPY Cargo.toml ./
COPY Cargo.lock ./

RUN cargo build --release
RUN rm src/*.rs

COPY src ./src
COPY migrations ./migrations
COPY sqlx-data.json .

ENV SQLX_OFFLINE=true

RUN rm ./target/release/deps/qillqay_backend*
RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libssl3 ca-certificates curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/backend/target/release/qillqay-backend .

EXPOSE 3000

CMD ["./qillqay-backend"]
