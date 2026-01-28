use axum::{
    routing::get,
    Router,
};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::sync::Arc;
use tokio::sync::broadcast;

mod domain;
mod infrastructure;

use infrastructure::web::handlers::{health_check, get_pages_demo, ws_handler};

// State shared across the application
pub struct AppState {
    pub pool: PgPool,
    pub tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables if .env exists
    let _ = dotenvy::dotenv();

    // Setup Tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "quillqay_backend=debug,tower_http=debug".into())
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Database Connection
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Initialize Broadcast Channel
    let (tx, _rx) = broadcast::channel(100);

    let app_state = Arc::new(AppState { pool, tx });

    // Router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/pages", get(get_pages_demo))
        .route("/ws", get(ws_handler))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    // Start Server
    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("Listening on {}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
