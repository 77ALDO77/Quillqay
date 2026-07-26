use crate::domain::{
    entities::{
        Document, DocumentVersion, NewDocument, NewProject, PendingDocumentVersion, Project,
        ProjectChanges, StorageCleanupJob, User, UserWithPassword,
    },
    errors::DomainError,
    repositories::{DocumentRepository, ProjectRepository, UserRepository},
};
use async_trait::async_trait;
use chrono::{DateTime, Duration, Utc};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Clone)]
pub struct PostgresRepository {
    pool: PgPool,
}

impl PostgresRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct UserRow {
    id: Uuid,
    email: String,
    password_hash: Option<String>,
    display_name: Option<String>,
    status: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl UserRow {
    fn into_user(self) -> User {
        User {
            id: self.id,
            email: self.email,
            display_name: self.display_name,
            status: self.status,
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }
}

#[derive(FromRow)]
struct ProjectRow {
    id: Uuid,
    title: String,
    description: String,
    color: String,
    tags: Vec<String>,
    document_count: i64,
    deleted_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(FromRow)]
struct DocumentRow {
    id: Uuid,
    project_id: Uuid,
    title: String,
    current_version: i64,
    current_object_key: Option<String>,
    current_checksum: Option<String>,
    current_size_bytes: Option<i64>,
    last_checkpoint_at: Option<DateTime<Utc>>,
    deleted_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<DocumentRow> for Document {
    fn from(row: DocumentRow) -> Self {
        Self {
            id: row.id,
            project_id: row.project_id,
            title: row.title,
            current_version: row.current_version,
            current_object_key: row.current_object_key,
            current_checksum: row.current_checksum,
            current_size_bytes: row.current_size_bytes,
            last_checkpoint_at: row.last_checkpoint_at,
            deleted_at: row.deleted_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(FromRow)]
struct DocumentVersionRow {
    id: Uuid,
    document_id: Uuid,
    version: i64,
    object_key: String,
    checksum: String,
    size_bytes: i64,
    is_checkpoint: bool,
    created_by: Uuid,
    created_at: DateTime<Utc>,
}

#[derive(FromRow)]
struct StorageCleanupJobRow {
    id: Uuid,
    bucket: String,
    object_key: String,
    attempts: i32,
}

impl From<StorageCleanupJobRow> for StorageCleanupJob {
    fn from(row: StorageCleanupJobRow) -> Self {
        Self {
            id: row.id,
            bucket: row.bucket,
            object_key: row.object_key,
            attempts: row.attempts,
        }
    }
}

impl From<DocumentVersionRow> for DocumentVersion {
    fn from(row: DocumentVersionRow) -> Self {
        Self {
            id: row.id,
            document_id: row.document_id,
            version: row.version,
            object_key: row.object_key,
            checksum: row.checksum,
            size_bytes: row.size_bytes,
            is_checkpoint: row.is_checkpoint,
            created_by: row.created_by,
            created_at: row.created_at,
        }
    }
}

impl From<ProjectRow> for Project {
    fn from(row: ProjectRow) -> Self {
        Self {
            id: row.id,
            title: row.title,
            description: row.description,
            color: row.color,
            tags: row.tags,
            document_count: row.document_count,
            deleted_at: row.deleted_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

const PROJECT_SELECT: &str = r#"
    SELECT
        p.id,
        p.title,
        p.description,
        p.color,
        p.tags,
        COUNT(d.id) FILTER (WHERE d.deleted_at IS NULL) AS document_count,
        p.deleted_at,
        p.created_at,
        p.updated_at
    FROM projects p
    LEFT JOIN documents d ON d.project_id = p.id
"#;

const DOCUMENT_SELECT: &str = r#"
    SELECT
        d.id,
        d.project_id,
        d.title,
        d.current_version,
        d.current_object_key,
        d.current_checksum,
        d.current_size_bytes,
        d.last_checkpoint_at,
        d.deleted_at,
        d.created_at,
        d.updated_at
    FROM documents d
    INNER JOIN projects p ON p.id = d.project_id
"#;

const DOCUMENT_VERSION_SELECT: &str = r#"
    SELECT
        v.id,
        v.document_id,
        v.version,
        v.object_key,
        v.checksum,
        v.size_bytes,
        v.is_checkpoint,
        v.created_by,
        v.created_at
    FROM document_versions v
    INNER JOIN documents d ON d.id = v.document_id
    INNER JOIN projects p ON p.id = d.project_id
"#;

#[async_trait]
impl UserRepository for PostgresRepository {
    async fn find_user_by_email(
        &self,
        email: &str,
    ) -> Result<Option<UserWithPassword>, DomainError> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            SELECT
                id, email, password_hash, display_name, status, created_at, updated_at
            FROM users
            WHERE LOWER(email) = LOWER($1) AND status = 'active'
            "#,
        )
        .bind(email)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.and_then(|row| {
            let password_hash = row.password_hash.clone()?;
            Some(UserWithPassword {
                user: row.into_user(),
                password_hash,
            })
        }))
    }

    async fn find_user_by_session_hash(
        &self,
        token_hash: &[u8],
    ) -> Result<Option<User>, DomainError> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            SELECT
                u.id,
                u.email,
                NULL::TEXT AS password_hash,
                u.display_name,
                u.status,
                u.created_at,
                u.updated_at
            FROM users u
            INNER JOIN sessions s ON s.user_id = u.id
            WHERE
                s.token_hash = $1
                AND s.expires_at > NOW()
                AND u.status = 'active'
            "#,
        )
        .bind(token_hash)
        .fetch_optional(&self.pool)
        .await?;

        if row.is_some() {
            sqlx::query("UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = $1")
                .bind(token_hash)
                .execute(&self.pool)
                .await?;
        }

        Ok(row.map(UserRow::into_user))
    }

    async fn create_session(
        &self,
        user_id: Uuid,
        token_hash: &[u8],
        expires_at: DateTime<Utc>,
    ) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            INSERT INTO sessions (id, user_id, token_hash, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(token_hash)
        .bind(expires_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn delete_session(&self, token_hash: &[u8]) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM sessions WHERE token_hash = $1")
            .bind(token_hash)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

#[async_trait]
impl ProjectRepository for PostgresRepository {
    async fn list_projects(&self, owner_id: Uuid) -> Result<Vec<Project>, DomainError> {
        let query = format!(
            "{PROJECT_SELECT}
             WHERE p.owner_id = $1 AND p.deleted_at IS NULL
             GROUP BY p.id
             ORDER BY p.updated_at DESC"
        );
        let rows = sqlx::query_as::<_, ProjectRow>(&query)
            .bind(owner_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(Project::from).collect())
    }

    async fn create_project(&self, project: NewProject) -> Result<Project, DomainError> {
        let project_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO projects (id, owner_id, title, description, color, tags)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(project_id)
        .bind(project.owner_id)
        .bind(project.title)
        .bind(project.description)
        .bind(project.color)
        .bind(project.tags)
        .execute(&self.pool)
        .await?;

        self.get_project(project.owner_id, project_id, false)
            .await?
            .ok_or(DomainError::NotFound("project"))
    }

    async fn get_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        include_deleted: bool,
    ) -> Result<Option<Project>, DomainError> {
        let deleted_filter = if include_deleted {
            ""
        } else {
            "AND p.deleted_at IS NULL"
        };
        let query = format!(
            "{PROJECT_SELECT}
             WHERE p.owner_id = $1 AND p.id = $2 {deleted_filter}
             GROUP BY p.id"
        );
        let row = sqlx::query_as::<_, ProjectRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(Project::from))
    }

    async fn update_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        changes: ProjectChanges,
    ) -> Result<Option<Project>, DomainError> {
        let result = sqlx::query(
            r#"
            UPDATE projects
            SET
                title = COALESCE($3, title),
                description = COALESCE($4, description),
                color = COALESCE($5, color),
                tags = COALESCE($6, tags),
                updated_at = NOW()
            WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
            "#,
        )
        .bind(project_id)
        .bind(owner_id)
        .bind(changes.title)
        .bind(changes.description)
        .bind(changes.color)
        .bind(changes.tags)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }
        self.get_project(owner_id, project_id, false).await
    }

    async fn soft_delete_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<bool, DomainError> {
        let result = sqlx::query(
            r#"
            UPDATE projects
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
            "#,
        )
        .bind(project_id)
        .bind(owner_id)
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected() == 1)
    }

    async fn restore_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Option<Project>, DomainError> {
        let result = sqlx::query(
            r#"
            UPDATE projects
            SET deleted_at = NULL, updated_at = NOW()
            WHERE id = $1 AND owner_id = $2 AND deleted_at IS NOT NULL
            "#,
        )
        .bind(project_id)
        .bind(owner_id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }
        self.get_project(owner_id, project_id, false).await
    }
}

#[async_trait]
impl DocumentRepository for PostgresRepository {
    async fn list_documents(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Vec<Document>, DomainError> {
        let query = format!(
            "{DOCUMENT_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND p.deleted_at IS NULL
               AND d.deleted_at IS NULL
             ORDER BY d.updated_at DESC"
        );
        let rows = sqlx::query_as::<_, DocumentRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(Document::from).collect())
    }

    async fn create_document(
        &self,
        owner_id: Uuid,
        document: NewDocument,
    ) -> Result<Option<Document>, DomainError> {
        let result = sqlx::query(
            r#"
            INSERT INTO documents (id, project_id, title)
            SELECT $1, p.id, $3
            FROM projects p
            WHERE p.id = $2 AND p.owner_id = $4 AND p.deleted_at IS NULL
            "#,
        )
        .bind(document.id)
        .bind(document.project_id)
        .bind(document.title)
        .bind(owner_id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }
        self.get_document(owner_id, document.project_id, document.id, false)
            .await
    }

    async fn get_document(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        include_deleted: bool,
    ) -> Result<Option<Document>, DomainError> {
        let deleted_filter = if include_deleted {
            ""
        } else {
            "AND d.deleted_at IS NULL"
        };
        let query = format!(
            "{DOCUMENT_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND d.id = $3
               AND p.deleted_at IS NULL
               {deleted_filter}"
        );
        let row = sqlx::query_as::<_, DocumentRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .bind(document_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(Document::from))
    }

    async fn update_document_title(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        title: String,
    ) -> Result<Option<Document>, DomainError> {
        let result = sqlx::query(
            r#"
            UPDATE documents d
            SET title = $4, updated_at = NOW()
            FROM projects p
            WHERE d.id = $3
              AND d.project_id = $2
              AND p.id = d.project_id
              AND p.owner_id = $1
              AND p.deleted_at IS NULL
              AND d.deleted_at IS NULL
            "#,
        )
        .bind(owner_id)
        .bind(project_id)
        .bind(document_id)
        .bind(title)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }
        self.get_document(owner_id, project_id, document_id, false)
            .await
    }

    async fn soft_delete_document(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<bool, DomainError> {
        let result = sqlx::query(
            r#"
            UPDATE documents d
            SET deleted_at = NOW(), updated_at = NOW()
            FROM projects p
            WHERE d.id = $3
              AND d.project_id = $2
              AND p.id = d.project_id
              AND p.owner_id = $1
              AND p.deleted_at IS NULL
              AND d.deleted_at IS NULL
            "#,
        )
        .bind(owner_id)
        .bind(project_id)
        .bind(document_id)
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected() == 1)
    }

    async fn restore_document(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<Option<Document>, DomainError> {
        let result = sqlx::query(
            r#"
            UPDATE documents d
            SET deleted_at = NULL, updated_at = NOW()
            FROM projects p
            WHERE d.id = $3
              AND d.project_id = $2
              AND p.id = d.project_id
              AND p.owner_id = $1
              AND p.deleted_at IS NULL
              AND d.deleted_at IS NOT NULL
            "#,
        )
        .bind(owner_id)
        .bind(project_id)
        .bind(document_id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }
        self.get_document(owner_id, project_id, document_id, false)
            .await
    }

    async fn commit_document_version(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        base_version: i64,
        pending: PendingDocumentVersion,
    ) -> Result<DocumentVersion, DomainError> {
        let mut transaction = self.pool.begin().await?;
        let current = sqlx::query_as::<_, (i64, Option<DateTime<Utc>>)>(
            r#"
            SELECT d.current_version, d.last_checkpoint_at
            FROM documents d
            INNER JOIN projects p ON p.id = d.project_id
            WHERE p.owner_id = $1
              AND p.id = $2
              AND d.id = $3
              AND p.deleted_at IS NULL
              AND d.deleted_at IS NULL
            FOR UPDATE
            "#,
        )
        .bind(owner_id)
        .bind(project_id)
        .bind(document_id)
        .fetch_optional(&mut *transaction)
        .await?
        .ok_or(DomainError::NotFound("document"))?;

        if current.0 != base_version {
            return Err(DomainError::DocumentVersionConflict);
        }

        let now = Utc::now();
        let is_checkpoint = current
            .1
            .is_none_or(|last| now.signed_duration_since(last) >= Duration::minutes(5));
        let version = current.0 + 1;

        let row = sqlx::query_as::<_, DocumentVersionRow>(
            r#"
            INSERT INTO document_versions (
                id, document_id, version, object_key, checksum, size_bytes,
                is_checkpoint, created_by, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING
                id, document_id, version, object_key, checksum, size_bytes,
                is_checkpoint, created_by, created_at
            "#,
        )
        .bind(pending.id)
        .bind(document_id)
        .bind(version)
        .bind(&pending.object_key)
        .bind(&pending.checksum)
        .bind(pending.size_bytes)
        .bind(is_checkpoint)
        .bind(pending.created_by)
        .bind(now)
        .fetch_one(&mut *transaction)
        .await?;

        sqlx::query(
            r#"
            UPDATE documents
            SET
                current_version = $2,
                current_object_key = $3,
                current_checksum = $4,
                current_size_bytes = $5,
                last_checkpoint_at = CASE WHEN $6 THEN $7 ELSE last_checkpoint_at END,
                updated_at = $7
            WHERE id = $1
            "#,
        )
        .bind(document_id)
        .bind(version)
        .bind(&pending.object_key)
        .bind(&pending.checksum)
        .bind(pending.size_bytes)
        .bind(is_checkpoint)
        .bind(now)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;
        Ok(row.into())
    }

    async fn list_document_checkpoints(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<Vec<DocumentVersion>, DomainError> {
        let query = format!(
            "{DOCUMENT_VERSION_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND d.id = $3
               AND p.deleted_at IS NULL
               AND d.deleted_at IS NULL
               AND v.is_checkpoint = TRUE
             ORDER BY v.created_at DESC"
        );
        let rows = sqlx::query_as::<_, DocumentVersionRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .bind(document_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(DocumentVersion::from).collect())
    }

    async fn get_document_version(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<Option<DocumentVersion>, DomainError> {
        let query = format!(
            "{DOCUMENT_VERSION_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND d.id = $3
               AND v.id = $4
               AND p.deleted_at IS NULL
               AND d.deleted_at IS NULL"
        );
        let row = sqlx::query_as::<_, DocumentVersionRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .bind(document_id)
            .bind(version_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(DocumentVersion::from))
    }

    async fn record_storage_cleanup(
        &self,
        bucket: &str,
        object_key: &str,
        reason: &str,
        last_error: Option<&str>,
    ) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            INSERT INTO storage_cleanup_jobs (
                id, bucket, object_key, reason, last_error
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (bucket, object_key) DO UPDATE
            SET
                reason = EXCLUDED.reason,
                last_error = EXCLUDED.last_error,
                next_attempt_at = NOW(),
                updated_at = NOW()
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(bucket)
        .bind(object_key)
        .bind(reason)
        .bind(last_error)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn claim_storage_cleanup_jobs(
        &self,
        limit: i64,
    ) -> Result<Vec<StorageCleanupJob>, DomainError> {
        let rows = sqlx::query_as::<_, StorageCleanupJobRow>(
            r#"
            UPDATE storage_cleanup_jobs
            SET
                attempts = attempts + 1,
                next_attempt_at = NOW() + INTERVAL '5 minutes',
                updated_at = NOW()
            WHERE id IN (
                SELECT id
                FROM storage_cleanup_jobs
                WHERE completed_at IS NULL AND next_attempt_at <= NOW()
                ORDER BY next_attempt_at
                FOR UPDATE SKIP LOCKED
                LIMIT $1
            )
            RETURNING id, bucket, object_key, attempts
            "#,
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(StorageCleanupJob::from).collect())
    }

    async fn complete_storage_cleanup_job(&self, job_id: Uuid) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            UPDATE storage_cleanup_jobs
            SET completed_at = NOW(), last_error = NULL, updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(job_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn fail_storage_cleanup_job(
        &self,
        job_id: Uuid,
        error: &str,
    ) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            UPDATE storage_cleanup_jobs
            SET last_error = $2, updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(job_id)
        .bind(error)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
