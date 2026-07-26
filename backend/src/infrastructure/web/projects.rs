use crate::{
    domain::entities::{Project, ProjectChanges},
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
pub struct CreateProjectRequest {
    title: String,
    description: Option<String>,
    color: Option<String>,
    tags: Option<Vec<String>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectRequest {
    title: Option<String>,
    description: Option<String>,
    color: Option<String>,
    tags: Option<Vec<String>>,
}

pub async fn list_projects(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
) -> Result<Json<Vec<Project>>, ApiError> {
    Ok(Json(state.project_service.list(user.id).await?))
}

pub async fn create_project(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    payload: Result<Json<CreateProjectRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<Project>), ApiError> {
    let Json(payload) = payload.map_err(ApiError::from)?;
    let project = state
        .project_service
        .create(
            user.id,
            payload.title,
            payload.description,
            payload.color,
            payload.tags,
        )
        .await?;
    Ok((StatusCode::CREATED, Json(project)))
}

pub async fn get_project(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
) -> Result<Json<Project>, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    Ok(Json(
        state.project_service.get(user.id, project_id).await?,
    ))
}

pub async fn update_project(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
    payload: Result<Json<UpdateProjectRequest>, JsonRejection>,
) -> Result<Json<Project>, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let project = state
        .project_service
        .update(
            user.id,
            project_id,
            ProjectChanges {
                title: payload.title,
                description: payload.description,
                color: payload.color,
                tags: payload.tags,
            },
        )
        .await?;
    Ok(Json(project))
}

pub async fn delete_project(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
) -> Result<StatusCode, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    state.project_service.delete(user.id, project_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn restore_project(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
) -> Result<Json<Project>, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    Ok(Json(
        state.project_service.restore(user.id, project_id).await?,
    ))
}
