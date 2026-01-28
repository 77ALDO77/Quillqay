use axum::{
    routing::get,
    Json, Router,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use serde_json::json;
use uuid::Uuid;

mod models;
use models::{Page, Block, BlockData};

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

    // Router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/pages", get(get_pages_demo))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(pool);

    // Start Server
    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("Listening on {}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

// Mock handler returning the structure as defined in Task 1
async fn get_pages_demo() -> Json<serde_json::Value> {
    let page_id = Uuid::new_v4();
    
    let demo_page = Page {
        id: page_id,
        title: "My First Note".to_string(),
        parent_id: None,
    };

    let demo_block = Block {
        id: Uuid::new_v4(),
        page_id,
        data: BlockData::Header { 
            level: 1, 
            text: "Welcome to Quillqay".to_string() 
        },
    };

    let demo_todo = Block {
        id: Uuid::new_v4(),
        page_id,
        data: BlockData::Todo { 
            task: "Implement frontend".to_string(), 
            completed: false 
        },
    };

    Json(json!({
        "data": {
            "page": demo_page,
            "blocks": [demo_block, demo_todo]
        }
    }))
}
