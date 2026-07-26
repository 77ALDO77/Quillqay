use crate::domain::storage::ObjectStorage;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct ReadinessService {
    pool: PgPool,
    storage: Arc<dyn ObjectStorage>,
}

pub struct ReadinessChecks {
    pub postgres: bool,
    pub storage: bool,
}

impl ReadinessChecks {
    pub fn is_ready(&self) -> bool {
        self.postgres && self.storage
    }
}

impl ReadinessService {
    pub fn new(pool: PgPool, storage: Arc<dyn ObjectStorage>) -> Self {
        Self { pool, storage }
    }

    pub async fn check(&self) -> ReadinessChecks {
        let database_check = sqlx::query_scalar::<_, i32>("SELECT 1").fetch_one(&self.pool);
        let storage_check = self.storage.check_health();
        let (database_result, storage_result) = tokio::join!(database_check, storage_check);

        if let Err(error) = &database_result {
            tracing::warn!(error = %error, "readiness database check failed");
        }
        if let Err(error) = &storage_result {
            tracing::warn!(error = %error, "readiness storage check failed");
        }

        ReadinessChecks {
            postgres: database_result.is_ok(),
            storage: storage_result.is_ok(),
        }
    }
}
