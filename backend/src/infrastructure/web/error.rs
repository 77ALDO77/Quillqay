use crate::domain::errors::DomainError;
use axum::{
    extract::rejection::{JsonRejection, PathRejection},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

pub struct ApiError {
    status: StatusCode,
    code: String,
    message: String,
}

#[derive(Serialize)]
struct ErrorEnvelope {
    error: ErrorBody,
}

#[derive(Serialize)]
struct ErrorBody {
    code: String,
    message: String,
}

impl From<DomainError> for ApiError {
    fn from(error: DomainError) -> Self {
        match error {
            DomainError::InvalidCredentials => Self::new(
                StatusCode::UNAUTHORIZED,
                "invalid_credentials",
                "Invalid email or password",
            ),
            DomainError::Unauthorized => Self::new(
                StatusCode::UNAUTHORIZED,
                "authentication_required",
                "Authentication is required",
            ),
            DomainError::InvalidOrigin => Self::new(
                StatusCode::FORBIDDEN,
                "invalid_origin",
                "The request origin is not allowed",
            ),
            DomainError::NotFound(resource) => Self::new(
                StatusCode::NOT_FOUND,
                format!("{resource}_not_found"),
                format!("The requested {resource} was not found"),
            ),
            DomainError::Validation(message) => {
                Self::new(StatusCode::BAD_REQUEST, "invalid_request", message)
            }
            DomainError::RateLimited => Self::new(
                StatusCode::TOO_MANY_REQUESTS,
                "login_rate_limited",
                "Too many login attempts; try again later",
            ),
            DomainError::DocumentVersionConflict => Self::new(
                StatusCode::CONFLICT,
                "document_version_conflict",
                "The document has a newer version",
            ),
            DomainError::CorruptDocumentContent => {
                tracing::error!("stored document content failed validation");
                Self::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "document_content_corrupt",
                    "The stored document content could not be read",
                )
            }
            DomainError::Storage(error) => {
                tracing::warn!(error = %error, "object storage operation failed");
                Self::new(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "storage_unavailable",
                    "Document storage is temporarily unavailable",
                )
            }
            DomainError::Database(error) => {
                tracing::error!(error = %error, "database operation failed");
                Self::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "An internal error occurred",
                )
            }
        }
    }
}

impl From<JsonRejection> for ApiError {
    fn from(_error: JsonRejection) -> Self {
        Self::new(
            StatusCode::BAD_REQUEST,
            "invalid_json",
            "The request body is not valid JSON",
        )
    }
}

impl From<PathRejection> for ApiError {
    fn from(_error: PathRejection) -> Self {
        Self::new(
            StatusCode::BAD_REQUEST,
            "invalid_path",
            "A path parameter is invalid",
        )
    }
}

impl ApiError {
    fn new(
        status: StatusCode,
        code: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self {
            status,
            code: code.into(),
            message: message.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ErrorEnvelope {
                error: ErrorBody {
                    code: self.code,
                    message: self.message,
                },
            }),
        )
            .into_response()
    }
}
