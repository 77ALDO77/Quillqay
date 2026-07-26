use thiserror::Error;
use crate::domain::storage::StorageError;

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("invalid email or password")]
    InvalidCredentials,
    #[error("authentication is required")]
    Unauthorized,
    #[error("the request origin is not allowed")]
    InvalidOrigin,
    #[error("{0} was not found")]
    NotFound(&'static str),
    #[error("{0}")]
    Validation(String),
    #[error("too many login attempts")]
    RateLimited,
    #[error("the document has a newer version")]
    DocumentVersionConflict,
    #[error("stored document content is invalid")]
    CorruptDocumentContent,
    #[error("object storage is unavailable")]
    Storage(#[source] StorageError),
    #[error("database operation failed")]
    Database(#[source] sqlx::Error),
}

impl From<sqlx::Error> for DomainError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error)
    }
}

impl From<StorageError> for DomainError {
    fn from(error: StorageError) -> Self {
        Self::Storage(error)
    }
}
