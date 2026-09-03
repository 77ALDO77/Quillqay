use crate::{
    domain::entities::Note,
    AppState,
};
use axum::{
    extract::{
        rejection::{JsonRejection, PathRejection},
        Path, State,
    },
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use super::{auth::CurrentUser, error::ApiError};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteRequest {
    pub text: String,
    pub color: Option<String>,
    pub pinned: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteRequest {
    pub text: Option<String>,
    pub color: Option<String>,
    pub pinned: Option<bool>,
}

pub async fn list_notes(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
) -> Result<Json<Vec<Note>>, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    Ok(Json(state.note_service.list(user.id, project_id).await?))
}

pub async fn create_note(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
    payload: Result<Json<CreateNoteRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<Note>), ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let note = state
        .note_service
        .create(
            user.id,
            project_id,
            payload.text,
            payload.color,
            payload.pinned,
        )
        .await?;
    Ok((StatusCode::CREATED, Json(note)))
}

pub async fn update_note(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<(Uuid, Uuid)>, PathRejection>,
    payload: Result<Json<UpdateNoteRequest>, JsonRejection>,
) -> Result<Json<Note>, ApiError> {
    let Path((project_id, note_id)) = path.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let note = state
        .note_service
        .update(
            user.id,
            project_id,
            note_id,
            payload.text,
            payload.color,
            payload.pinned,
        )
        .await?;
    Ok(Json(note))
}

pub async fn delete_note(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<(Uuid, Uuid)>, PathRejection>,
) -> Result<StatusCode, ApiError> {
    let Path((project_id, note_id)) = path.map_err(ApiError::from)?;
    state.note_service.delete(user.id, project_id, note_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
