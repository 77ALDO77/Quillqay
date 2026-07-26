use crate::{
    application::documents::{DocumentDetail, RevisionDetail},
    domain::entities::{Document, DocumentVersion, EditorDocument},
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
pub struct DocumentPath {
    project_id: Uuid,
    document_id: Uuid,
}

#[derive(Deserialize)]
pub struct RevisionPath {
    project_id: Uuid,
    document_id: Uuid,
    revision_id: Uuid,
}

#[derive(Deserialize)]
pub struct CreateDocumentRequest {
    title: String,
}

#[derive(Deserialize)]
pub struct UpdateDocumentRequest {
    title: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDocumentRequest {
    base_version: i64,
    content: EditorDocument,
}

pub async fn list_documents(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
) -> Result<Json<Vec<Document>>, ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    Ok(Json(state.document_service.list(user.id, project_id).await?))
}

pub async fn create_document(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    project_id: Result<Path<Uuid>, PathRejection>,
    payload: Result<Json<CreateDocumentRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<Document>), ApiError> {
    let Path(project_id) = project_id.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    let document = state
        .document_service
        .create(user.id, project_id, payload.title)
        .await?;
    Ok((StatusCode::CREATED, Json(document)))
}

pub async fn get_document(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<DocumentPath>, PathRejection>,
) -> Result<Json<DocumentDetail>, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    Ok(Json(
        state
            .document_service
            .get(user.id, path.project_id, path.document_id)
            .await?,
    ))
}

pub async fn update_document(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<DocumentPath>, PathRejection>,
    payload: Result<Json<UpdateDocumentRequest>, JsonRejection>,
) -> Result<Json<Document>, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    Ok(Json(
        state
            .document_service
            .rename(
                user.id,
                path.project_id,
                path.document_id,
                payload.title,
            )
            .await?,
    ))
}

pub async fn save_document_content(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<DocumentPath>, PathRejection>,
    payload: Result<Json<SaveDocumentRequest>, JsonRejection>,
) -> Result<Json<DocumentVersion>, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    let Json(payload) = payload.map_err(ApiError::from)?;
    Ok(Json(
        state
            .document_service
            .save(
                user.id,
                path.project_id,
                path.document_id,
                payload.base_version,
                payload.content,
            )
            .await?,
    ))
}

pub async fn delete_document(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<DocumentPath>, PathRejection>,
) -> Result<StatusCode, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    state
        .document_service
        .delete(user.id, path.project_id, path.document_id)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn restore_document(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<DocumentPath>, PathRejection>,
) -> Result<Json<Document>, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    Ok(Json(
        state
            .document_service
            .restore(user.id, path.project_id, path.document_id)
            .await?,
    ))
}

pub async fn list_revisions(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<DocumentPath>, PathRejection>,
) -> Result<Json<Vec<DocumentVersion>>, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    Ok(Json(
        state
            .document_service
            .list_revisions(user.id, path.project_id, path.document_id)
            .await?,
    ))
}

pub async fn get_revision(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<RevisionPath>, PathRejection>,
) -> Result<Json<RevisionDetail>, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    Ok(Json(
        state
            .document_service
            .get_revision(
                user.id,
                path.project_id,
                path.document_id,
                path.revision_id,
            )
            .await?,
    ))
}

pub async fn restore_revision(
    State(state): State<Arc<AppState>>,
    CurrentUser(user): CurrentUser,
    path: Result<Path<RevisionPath>, PathRejection>,
) -> Result<Json<DocumentVersion>, ApiError> {
    let Path(path) = path.map_err(ApiError::from)?;
    Ok(Json(
        state
            .document_service
            .restore_revision(
                user.id,
                path.project_id,
                path.document_id,
                path.revision_id,
            )
            .await?,
    ))
}
