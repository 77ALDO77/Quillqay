use crate::AppState;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::Serialize;
use std::sync::Arc;

pub async fn health_check() -> &'static str {
    "OK"
}

#[derive(Serialize)]
pub struct ReadinessResponse {
    status: &'static str,
    checks: ReadinessResponseChecks,
}

#[derive(Serialize)]
struct ReadinessResponseChecks {
    postgres: &'static str,
    storage: &'static str,
}

pub async fn readiness_check(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<ReadinessResponse>) {
    let checks = state.readiness_service.check().await;
    let status = if checks.is_ready() {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        status,
        Json(ReadinessResponse {
            status: if checks.is_ready() {
                "ready"
            } else {
                "not_ready"
            },
            checks: ReadinessResponseChecks {
                postgres: check_label(checks.postgres),
                storage: check_label(checks.storage),
            },
        }),
    )
}

fn check_label(healthy: bool) -> &'static str {
    if healthy {
        "ok"
    } else {
        "error"
    }
}

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
        while let Ok(message) = rx.recv().await {
            if sender.send(Message::Text(message)).await.is_err() {
                break;
            }
        }
    });

    let mut receive_task = tokio::spawn(async move {
        while let Some(Ok(message)) = receiver.next().await {
            tracing::debug!(?message, "received websocket message");
        }
    });

    tokio::select! {
        _ = (&mut send_task) => receive_task.abort(),
        _ = (&mut receive_task) => send_task.abort(),
    };
}
