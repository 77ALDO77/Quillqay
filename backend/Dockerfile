# Builder stage
FROM rust:slim-bookworm as builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Create a dummy project to cache dependencies
RUN cargo new --bin backend
WORKDIR /usr/src/app/backend

# Copy manifests
COPY Cargo.toml ./

# Build dependencies only (caching step)
RUN cargo build --release
RUN rm src/*.rs

# Copy source code and sqlx data
COPY src ./src
COPY migrations ./migrations
# Critical requirement for offline build
COPY sqlx-data.json .

# Set offline mode for sqlx
ENV SQLX_OFFLINE=true

# Build the actual application
# Remove the dummy build artifact to force rebuild of the main app
RUN rm ./target/release/deps/qillqay_backend*
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /usr/src/app/backend/target/release/qillqay-backend .

# Expose port
EXPOSE 3000

# Run the binary
CMD ["./qillqay-backend"]
