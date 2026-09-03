use crate::domain::{
    entities::{
        Document, DocumentVersion, NewDocument, NewNote, NewProject, NewTask, Note, NoteChanges,
        PendingDocumentVersion, Project, ProjectChanges, StorageCleanupJob, Task, TaskChanges,
        User, UserWithPassword,
    },
    errors::DomainError,
    repositories::{
        DocumentRepository, NoteRepository, ProjectRepository, TaskRepository, UserRepository,
    },
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

#[derive(FromRow)]
struct NoteRow {
    id: Uuid,
    project_id: Uuid,
    text: String,
    color: String,
    pinned: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<NoteRow> for Note {
    fn from(row: NoteRow) -> Self {
        Self {
            id: row.id,
            project_id: row.project_id,
            text: row.text,
            color: row.color,
            pinned: row.pinned,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(FromRow)]
struct TaskRow {
    id: Uuid,
    project_id: Uuid,
    title: String,
    description: String,
    status: String,
    priority: String,
    order_index: i32,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<TaskRow> for Task {
    fn from(row: TaskRow) -> Self {
        Self {
            id: row.id,
            project_id: row.project_id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            order_index: row.order_index,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
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

const NOTE_SELECT: &str = r#"
    SELECT n.id, n.project_id, n.text, n.color, n.pinned, n.created_at, n.updated_at
    FROM notes n
    INNER JOIN projects p ON p.id = n.project_id
"#;

const TASK_SELECT: &str = r#"
    SELECT t.id, t.project_id, t.title, t.description, t.status, t.priority, t.order_index, t.created_at, t.updated_at
    FROM tasks t
    INNER JOIN projects p ON p.id = t.project_id
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

#[async_trait]
impl NoteRepository for PostgresRepository {
    async fn list_notes(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Vec<Note>, DomainError> {
        let query = format!(
            "{NOTE_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND p.deleted_at IS NULL
             ORDER BY n.pinned DESC, n.updated_at DESC"
        );
        let rows = sqlx::query_as::<_, NoteRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(Note::from).collect())
    }

    async fn create_note(
        &self,
        owner_id: Uuid,
        note: NewNote,
    ) -> Result<Option<Note>, DomainError> {
        let result = sqlx::query(
            r#"
            INSERT INTO notes (id, project_id, text, color, pinned)
            SELECT $1, p.id, $3, $4, $5
            FROM projects p
            WHERE p.id = $2 AND p.owner_id = $6 AND p.deleted_at IS NULL
            "#,
        )
        .bind(note.id)
        .bind(note.project_id)
        .bind(note.text)
        .bind(note.color)
        .bind(note.pinned)
        .bind(owner_id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        self.get_note(owner_id, note.project_id, note.id).await
    }

    async fn get_note(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        note_id: Uuid,
    ) -> Result<Option<Note>, DomainError> {
        let query = format!(
            "{NOTE_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND n.id = $3
               AND p.deleted_at IS NULL"
        );
        let row = sqlx::query_as::<_, NoteRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .bind(note_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(Note::from))
    }

    async fn update_note(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        note_id: Uuid,
        changes: NoteChanges,
    ) -> Result<Option<Note>, DomainError> {
        let current = match self.get_note(owner_id, project_id, note_id).await? {
            Some(note) => note,
            None => return Ok(None),
        };

        let new_text = changes.text.unwrap_or(current.text);
        let new_color = changes.color.unwrap_or(current.color);
        let new_pinned = changes.pinned.unwrap_or(current.pinned);

        sqlx::query(
            r#"
            UPDATE notes
            SET text = $1, color = $2, pinned = $3, updated_at = NOW()
            WHERE id = $4 AND project_id = $5
            "#,
        )
        .bind(new_text)
        .bind(new_color)
        .bind(new_pinned)
        .bind(note_id)
        .bind(project_id)
        .execute(&self.pool)
        .await?;

        self.get_note(owner_id, project_id, note_id).await
    }

    async fn delete_note(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        note_id: Uuid,
    ) -> Result<bool, DomainError> {
        let result = sqlx::query(
            r#"
            DELETE FROM notes n
            USING projects p
            WHERE n.project_id = p.id
              AND p.id = $1
              AND p.owner_id = $2
              AND n.id = $3
              AND p.deleted_at IS NULL
            "#,
        )
        .bind(project_id)
        .bind(owner_id)
        .bind(note_id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}

#[async_trait]
impl TaskRepository for PostgresRepository {
    async fn list_tasks(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Vec<Task>, DomainError> {
        let query = format!(
            "{TASK_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND p.deleted_at IS NULL
             ORDER BY t.order_index ASC, t.updated_at DESC"
        );
        let rows = sqlx::query_as::<_, TaskRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(Task::from).collect())
    }

    async fn create_task(
        &self,
        owner_id: Uuid,
        task: NewTask,
    ) -> Result<Option<Task>, DomainError> {
        let result = sqlx::query(
            r#"
            INSERT INTO tasks (id, project_id, title, description, status, priority, order_index)
            SELECT $1, p.id, $3, $4, $5, $6, $7
            FROM projects p
            WHERE p.id = $2 AND p.owner_id = $8 AND p.deleted_at IS NULL
            "#,
        )
        .bind(task.id)
        .bind(task.project_id)
        .bind(task.title)
        .bind(task.description)
        .bind(task.status)
        .bind(task.priority)
        .bind(task.order_index)
        .bind(owner_id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        self.get_task(owner_id, task.project_id, task.id).await
    }

    async fn get_task(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        task_id: Uuid,
    ) -> Result<Option<Task>, DomainError> {
        let query = format!(
            "{TASK_SELECT}
             WHERE p.owner_id = $1
               AND p.id = $2
               AND t.id = $3
               AND p.deleted_at IS NULL"
        );
        let row = sqlx::query_as::<_, TaskRow>(&query)
            .bind(owner_id)
            .bind(project_id)
            .bind(task_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(Task::from))
    }

    async fn update_task(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        task_id: Uuid,
        changes: TaskChanges,
    ) -> Result<Option<Task>, DomainError> {
        let current = match self.get_task(owner_id, project_id, task_id).await? {
            Some(task) => task,
            None => return Ok(None),
        };

        let new_title = changes.title.unwrap_or(current.title);
        let new_desc = changes.description.unwrap_or(current.description);
        let new_status = changes.status.unwrap_or(current.status);
        let new_priority = changes.priority.unwrap_or(current.priority);
        let new_order = changes.order_index.unwrap_or(current.order_index);

        sqlx::query(
            r#"
            UPDATE tasks
            SET title = $1, description = $2, status = $3, priority = $4, order_index = $5, updated_at = NOW()
            WHERE id = $6 AND project_id = $7
            "#,
        )
        .bind(new_title)
        .bind(new_desc)
        .bind(new_status)
        .bind(new_priority)
        .bind(new_order)
        .bind(task_id)
        .bind(project_id)
        .execute(&self.pool)
        .await?;

        self.get_task(owner_id, project_id, task_id).await
    }

    async fn delete_task(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        task_id: Uuid,
    ) -> Result<bool, DomainError> {
        let result = sqlx::query(
            r#"
            DELETE FROM tasks t
            USING projects p
            WHERE t.project_id = p.id
              AND p.id = $1
              AND p.owner_id = $2
              AND t.id = $3
              AND p.deleted_at IS NULL
            "#,
        )
        .bind(project_id)
        .bind(owner_id)
        .bind(task_id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}


