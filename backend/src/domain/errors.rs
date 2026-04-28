use axum::http::StatusCode;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("Page not found: {0}")]
    PageNotFound(String),

    #[error("Invalid page data: {0}")]
    InvalidPageData(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),
}

impl DomainError {
    pub fn status_code(&self) -> StatusCode {
        match self {
            DomainError::PageNotFound(_) => StatusCode::NOT_FOUND,
            DomainError::InvalidPageData(_) => StatusCode::BAD_REQUEST,
            DomainError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            DomainError::SerializationError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl From<sqlx::Error> for DomainError {
    fn from(err: sqlx::Error) -> Self {
        DomainError::DatabaseError(err.to_string())
    }
}

impl From<serde_json::Error> for DomainError {
    fn from(err: serde_json::Error) -> Self {
        DomainError::SerializationError(err.to_string())
    }
}
