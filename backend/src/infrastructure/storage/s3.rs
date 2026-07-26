use crate::{
    config::StorageConfig,
    domain::storage::{ContentMetadata, ObjectStorage, StorageError},
};
use async_trait::async_trait;
use aws_sdk_s3::{
    config::{
        retry::RetryConfig,
        timeout::TimeoutConfig,
        Credentials, Region,
    },
    primitives::ByteStream,
    Client,
};
use std::time::Duration;

#[derive(Clone)]
pub struct S3ObjectStorage {
    client: Client,
    content_bucket: String,
    assets_bucket: String,
}

impl S3ObjectStorage {
    pub fn new(config: &StorageConfig) -> Self {
        let credentials = Credentials::new(
            config.access_key_id.clone(),
            config.secret_access_key.clone(),
            None,
            None,
            "quillqay-config",
        );
        let sdk_config = aws_sdk_s3::Config::builder()
            .behavior_version_latest()
            .region(Region::new(config.region.clone()))
            .credentials_provider(credentials)
            .endpoint_url(config.endpoint.clone())
            .force_path_style(config.force_path_style)
            .retry_config(RetryConfig::standard().with_max_attempts(1))
            .timeout_config(
                TimeoutConfig::builder()
                    .connect_timeout(Duration::from_secs(2))
                    .operation_timeout(Duration::from_secs(config.request_timeout_seconds))
                    .build(),
            )
            .build();

        Self {
            client: Client::from_conf(sdk_config),
            content_bucket: config.content_bucket.clone(),
            assets_bucket: config.assets_bucket.clone(),
        }
    }

    async fn check_bucket(&self, bucket: &str) -> Result<(), StorageError> {
        self.client
            .head_bucket()
            .bucket(bucket)
            .send()
            .await
            .map_err(storage_error)?;
        Ok(())
    }
}

#[async_trait]
impl ObjectStorage for S3ObjectStorage {
    fn content_bucket(&self) -> &str {
        &self.content_bucket
    }

    async fn check_health(&self) -> Result<(), StorageError> {
        self.check_bucket(&self.content_bucket).await?;
        self.check_bucket(&self.assets_bucket).await
    }

    async fn put_content(
        &self,
        key: &str,
        body: Vec<u8>,
        metadata: ContentMetadata,
    ) -> Result<(), StorageError> {
        self.client
            .put_object()
            .bucket(&self.content_bucket)
            .key(key)
            .content_type("application/json")
            .metadata("checksum", metadata.checksum)
            .metadata("schema-version", metadata.schema_version.to_string())
            .body(ByteStream::from(body))
            .send()
            .await
            .map_err(storage_error)?;
        Ok(())
    }

    async fn get_content(&self, key: &str) -> Result<Vec<u8>, StorageError> {
        let output = self
            .client
            .get_object()
            .bucket(&self.content_bucket)
            .key(key)
            .send()
            .await
            .map_err(storage_error)?;
        let body = output.body.collect().await.map_err(storage_error)?;
        Ok(body.into_bytes().to_vec())
    }

    async fn delete_content(&self, key: &str) -> Result<(), StorageError> {
        self.client
            .delete_object()
            .bucket(&self.content_bucket)
            .key(key)
            .send()
            .await
            .map_err(storage_error)?;
        Ok(())
    }
}

fn storage_error(error: impl std::fmt::Display) -> StorageError {
    StorageError::Operation(error.to_string())
}
