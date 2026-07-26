use crate::{
    domain::{repositories::DocumentRepository, storage::ObjectStorage},
    infrastructure::persistence::postgres::PostgresRepository,
};
use std::sync::Arc;

#[derive(Clone)]
pub struct StorageCleanupService {
    repository: PostgresRepository,
    storage: Arc<dyn ObjectStorage>,
}

impl StorageCleanupService {
    pub fn new(repository: PostgresRepository, storage: Arc<dyn ObjectStorage>) -> Self {
        Self {
            repository,
            storage,
        }
    }

    pub async fn run_once(&self) -> Result<usize, crate::domain::errors::DomainError> {
        let jobs = self.repository.claim_storage_cleanup_jobs(50).await?;
        let count = jobs.len();

        for job in jobs {
            if job.bucket != self.storage.content_bucket() {
                self.repository
                    .fail_storage_cleanup_job(job.id, "unsupported storage bucket")
                    .await?;
                continue;
            }

            match self.storage.delete_content(&job.object_key).await {
                Ok(()) => {
                    self.repository
                        .complete_storage_cleanup_job(job.id)
                        .await?;
                    tracing::info!(
                        job_id = %job.id,
                        object_key = job.object_key,
                        attempts = job.attempts,
                        "orphaned storage object deleted"
                    );
                }
                Err(error) => {
                    self.repository
                        .fail_storage_cleanup_job(job.id, &error.to_string())
                        .await?;
                    tracing::warn!(
                        job_id = %job.id,
                        error = %error,
                        attempts = job.attempts,
                        "storage cleanup job will be retried"
                    );
                }
            }
        }

        Ok(count)
    }
}
