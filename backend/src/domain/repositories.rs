use crate::domain::{
    entities::{
        Document, DocumentVersion, NewDocument, NewProject, PendingDocumentVersion, Project,
        ProjectChanges, StorageCleanupJob, User, UserWithPassword,
    },
    errors::DomainError,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_user_by_email(
        &self,
        email: &str,
    ) -> Result<Option<UserWithPassword>, DomainError>;
    async fn find_user_by_session_hash(
        &self,
        token_hash: &[u8],
    ) -> Result<Option<User>, DomainError>;
    async fn create_session(
        &self,
        user_id: Uuid,
        token_hash: &[u8],
        expires_at: DateTime<Utc>,
    ) -> Result<(), DomainError>;
    async fn delete_session(&self, token_hash: &[u8]) -> Result<(), DomainError>;
}

#[async_trait]
pub trait ProjectRepository: Send + Sync {
    async fn list_projects(&self, owner_id: Uuid) -> Result<Vec<Project>, DomainError>;
    async fn create_project(&self, project: NewProject) -> Result<Project, DomainError>;
    async fn get_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        include_deleted: bool,
    ) -> Result<Option<Project>, DomainError>;
    async fn update_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        changes: ProjectChanges,
    ) -> Result<Option<Project>, DomainError>;
    async fn soft_delete_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<bool, DomainError>;
    async fn restore_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Option<Project>, DomainError>;
}

#[async_trait]
pub trait DocumentRepository: Send + Sync {
    async fn list_documents(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Vec<Document>, DomainError>;
    async fn create_document(
        &self,
        owner_id: Uuid,
        document: NewDocument,
    ) -> Result<Option<Document>, DomainError>;
    async fn get_document(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        include_deleted: bool,
    ) -> Result<Option<Document>, DomainError>;
    async fn update_document_title(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        title: String,
    ) -> Result<Option<Document>, DomainError>;
    async fn soft_delete_document(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<bool, DomainError>;
    async fn restore_document(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<Option<Document>, DomainError>;
    async fn commit_document_version(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        base_version: i64,
        pending: PendingDocumentVersion,
    ) -> Result<DocumentVersion, DomainError>;
    async fn list_document_checkpoints(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<Vec<DocumentVersion>, DomainError>;
    async fn get_document_version(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<Option<DocumentVersion>, DomainError>;
    async fn record_storage_cleanup(
        &self,
        bucket: &str,
        object_key: &str,
        reason: &str,
        last_error: Option<&str>,
    ) -> Result<(), DomainError>;
    async fn claim_storage_cleanup_jobs(
        &self,
        limit: i64,
    ) -> Result<Vec<StorageCleanupJob>, DomainError>;
    async fn complete_storage_cleanup_job(&self, job_id: Uuid) -> Result<(), DomainError>;
    async fn fail_storage_cleanup_job(
        &self,
        job_id: Uuid,
        error: &str,
    ) -> Result<(), DomainError>;
}
