use crate::{domain::errors::DomainError, AppState};
use axum::{
    body::Body,
    extract::{Request, State},
    http::Method,
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::sync::Arc;

use super::error::ApiError;

pub async fn validate_origin(
    State(state): State<Arc<AppState>>,
    request: Request<Body>,
    next: Next,
) -> Response {
    if matches!(
        *request.method(),
        Method::GET | Method::HEAD | Method::OPTIONS
    ) {
        return next.run(request).await;
    }

    let origin_is_valid = request
        .headers()
        .get(axum::http::header::ORIGIN)
        .is_some_and(|origin| state.is_origin_allowed(origin));

    if !origin_is_valid {
        return ApiError::from(DomainError::InvalidOrigin).into_response();
    }

    next.run(request).await
}
