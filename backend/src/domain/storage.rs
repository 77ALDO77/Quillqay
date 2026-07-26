use async_trait::async_trait;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("object storage operation failed: {0}")]
    Operation(String),
}

#[derive(Clone, Debug)]
pub struct ContentMetadata {
    pub checksum: String,
    pub schema_version: u32,
}

#[async_trait]
pub trait ObjectStorage: Send + Sync {
    fn content_bucket(&self) -> &str;
    async fn check_health(&self) -> Result<(), StorageError>;
    async fn put_content(
        &self,
        key: &str,
        body: Vec<u8>,
        metadata: ContentMetadata,
    ) -> Result<(), StorageError>;
    async fn get_content(&self, key: &str) -> Result<Vec<u8>, StorageError>;
    async fn delete_content(&self, key: &str) -> Result<(), StorageError>;
}
