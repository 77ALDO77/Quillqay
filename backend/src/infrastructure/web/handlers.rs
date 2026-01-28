use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State, Path},
    response::IntoResponse,
    Json,
    http::StatusCode,
};
use std::sync::Arc;
use tokio::sync::broadcast;
use futures::{sink::SinkExt, stream::StreamExt};
use uuid::Uuid;
use serde::Deserialize;
use serde_json::json;

use crate::AppState;
use crate::infrastructure::persistence::postgres::PostgresRepository;
use crate::domain::entities::{Block, Page};

pub async fn health_check() -> &'static str {
    "OK"
}

// --- Pages CRUD ---

#[derive(Deserialize)]
pub struct CreatePageRequest {
    title: String,
}

pub async fn create_page_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreatePageRequest>,
) -> Result<Json<Page>, StatusCode> {
    let repo = PostgresRepository::new(state.pool.clone());
    
    match repo.create_page(payload.title).await {
        Ok(page) => Ok(Json(page)),
        Err(e) => {
            tracing::error!("Failed to create page: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_all_pages_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Page>>, StatusCode> {
    let repo = PostgresRepository::new(state.pool.clone());
    
    match repo.get_all_pages().await {
        Ok(pages) => Ok(Json(pages)),
        Err(e) => {
            tracing::error!("Failed to fetch pages: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_page_handler(
    Path(id): Path<Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let repo = PostgresRepository::new(state.pool.clone());
    
    let page = repo.get_page(id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    if let Some(page) = page {
        let blocks = repo.get_blocks_for_page(id).await.unwrap_or(vec![]);
        
        // Return combined structure expected by frontend (Page interface)
        // Frontend expects: { id, title, blocks: [] }
        Ok(Json(json!({
            "id": page.id,
            "title": page.title,
            "parent_id": page.parent_id,
            "blocks": blocks
        })))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

#[derive(Deserialize)]
pub struct UpdatePageRequest {
    title: String,
    blocks: Vec<Block>,
}

pub async fn update_page_handler(
    Path(id): Path<Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdatePageRequest>,
) -> Result<StatusCode, StatusCode> {
    let repo = PostgresRepository::new(state.pool.clone());
    
    match repo.save_page_content(id, payload.title, payload.blocks).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => {
            tracing::error!("Failed to update page: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// --- WebSocket ---

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            tracing::debug!("Received message: {:?}", msg);
        }
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
