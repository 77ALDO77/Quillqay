use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use tokio::sync::broadcast;
use futures::{sink::SinkExt, stream::StreamExt};
use uuid::Uuid;
use serde_json::json;

use crate::AppState;
use crate::infrastructure::persistence::postgres::PostgresRepository;
use crate::domain::entities::{Page, Block, BlockData};

pub async fn health_check() -> &'static str {
    "OK"
}

// Handler using the repository
pub async fn get_pages_demo(
    State(state): State<Arc<AppState>>,
) -> Json<serde_json::Value> {
    let repo = PostgresRepository::new(state.pool.clone());
    
    // For demo purposes, we will try to fetch a specific page or create some data if empty
    // Ideally we would take a page_id as parameter.
    // Here we just replicate the previous mock behavior but "prepared" to use DB.
    
    let page_id = Uuid::new_v4();
    
    // In a real scenario:
    // let page = repo.get_page(page_id).await.unwrap();
    // let blocks = repo.get_blocks_for_page(page_id).await.unwrap();

    let demo_page = Page {
        id: page_id,
        title: "My First Note (Refactored)".to_string(),
        parent_id: None,
    };

    let demo_block = Block {
        id: Uuid::new_v4(),
        page_id,
        data: BlockData::Header { 
            level: 1, 
            text: "Welcome to Quillqay (Refactored)".to_string() 
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

// WebSocket Handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

// Handle individual websocket connection
async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    
    // Subscribe to the broadcast channel
    let mut rx = state.tx.subscribe();

    // Spawn a task to forward broadcast messages to this client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages
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
