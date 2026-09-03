use crate::{
    domain::entities::Task,
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
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub status: Option<String>,
    pub order_index: Option<i32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub order_index: Option<i32>,
}

pub async fn list_tasks(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
) -> Result<Json<Vec<Task>>, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    Ok(Json(state.task_service.list(user.id, project_id).await?))
}

pub async fn create_task(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
    payload: Result<Json<CreateTaskRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<Task>), ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let task = state
        .task_service
        .create(
            user.id,
            project_id,
            payload.title,
            payload.description,
            payload.priority,
            payload.status,
            payload.order_index,
        )
        .await?;
    Ok((StatusCode::CREATED, Json(task)))
}

pub async fn update_task(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<(Uuid, Uuid)>, PathRejection>,
    payload: Result<Json<UpdateTaskRequest>, JsonRejection>,
) -> Result<Json<Task>, ApiError> {
    let Path((project_id, task_id)) = path.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let task = state
        .task_service
        .update(
            user.id,
            project_id,
            task_id,
            payload.title,
            payload.description,
            payload.status,
            payload.priority,
            payload.order_index,
        )
        .await?;
    Ok(Json(task))
}

pub async fn delete_task(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<(Uuid, Uuid)>, PathRejection>,
) -> Result<StatusCode, ApiError> {
    let Path((project_id, task_id)) = path.map_err(ApiError::from)?;
    state.task_service.delete(user.id, project_id, task_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
