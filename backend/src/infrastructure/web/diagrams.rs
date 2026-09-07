use crate::{
    domain::{entities::Diagram, events::RealtimeEvent},
    AppState,
};
use axum::{
    extract::{
        rejection::{JsonRejection, PathRejection},
        Path, Query, State,
    },
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use super::{auth::CurrentUser, error::ApiError};

#[derive(Deserialize)]
pub struct DiagramFilterParams {
    #[serde(rename = "type")]
    pub diagram_type: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDiagramRequest {
    pub title: String,
    pub diagram_type: String,
    pub content: Option<serde_json::Value>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDiagramRequest {
    pub title: Option<String>,
    pub content: Option<serde_json::Value>,
}

pub async fn list_diagrams(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
    Query(query): Query<DiagramFilterParams>,
) -> Result<Json<Vec<Diagram>>, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    let diagrams = state
        .diagram_service
        .list(user.id, project_id, query.diagram_type.as_deref())
        .await?;
    Ok(Json(diagrams))
}

pub async fn create_diagram(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
    payload: Result<Json<CreateDiagramRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<Diagram>), ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let diagram = state
        .diagram_service
        .create(
            user.id,
            project_id,
            payload.title,
            payload.diagram_type,
            payload.content,
        )
        .await?;

    let event = RealtimeEvent::new(
        "diagram:created",
        project_id,
        diagram.id,
        serde_json::to_value(&diagram).unwrap_or_default(),
    );
    if let Ok(json) = event.to_json_string() {
        let _ = state.tx.send(json);
    }

    Ok((StatusCode::CREATED, Json(diagram)))
}

pub async fn get_diagram(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<(Uuid, Uuid)>, PathRejection>,
) -> Result<Json<Diagram>, ApiError> {
    let Path((project_id, diagram_id)) = path.map_err(ApiError::from)?;
    let diagram = state
        .diagram_service
        .get(user.id, project_id, diagram_id)
        .await?;
    Ok(Json(diagram))
}

pub async fn update_diagram(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<(Uuid, Uuid)>, PathRejection>,
    payload: Result<Json<UpdateDiagramRequest>, JsonRejection>,
) -> Result<Json<Diagram>, ApiError> {
    let Path((project_id, diagram_id)) = path.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let diagram = state
        .diagram_service
        .update(user.id, project_id, diagram_id, payload.title, payload.content)
        .await?;

    let event = RealtimeEvent::new(
        "diagram:updated",
        project_id,
        diagram.id,
        serde_json::to_value(&diagram).unwrap_or_default(),
    );
    if let Ok(json) = event.to_json_string() {
        let _ = state.tx.send(json);
    }

    Ok(Json(diagram))
}

pub async fn delete_diagram(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<(Uuid, Uuid)>, PathRejection>,
) -> Result<StatusCode, ApiError> {
    let Path((project_id, diagram_id)) = path.map_err(ApiError::from)?;
    state
        .diagram_service
        .delete(user.id, project_id, diagram_id)
        .await?;

    let event = RealtimeEvent::new(
        "diagram:deleted",
        project_id,
        diagram_id,
        serde_json::Value::Null,
    );
    if let Ok(json) = event.to_json_string() {
        let _ = state.tx.send(json);
    }

    Ok(StatusCode::NO_CONTENT)
}
