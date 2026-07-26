use crate::{
    domain::{
        entities::{
            Document, DocumentVersion, EditorBlock, EditorDocument, NewDocument,
            PendingDocumentVersion,
        },
        errors::DomainError,
        repositories::{DocumentRepository, ProjectRepository},
        storage::{ContentMetadata, ObjectStorage},
    },
    infrastructure::persistence::postgres::PostgresRepository,
};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{collections::HashSet, sync::Arc};
use uuid::Uuid;

const MAX_TITLE_LENGTH: usize = 200;
const MAX_BLOCK_ID_LENGTH: usize = 128;
const MAX_BLOCK_TYPE_LENGTH: usize = 64;

#[derive(Clone)]
pub struct DocumentService {
    repository: PostgresRepository,
    storage: Arc<dyn ObjectStorage>,
    max_document_bytes: usize,
    max_blocks: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentDetail {
    pub document: Document,
    pub content: EditorDocument,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevisionDetail {
    pub revision: DocumentVersion,
    pub content: EditorDocument,
}

impl DocumentService {
    pub fn new(
        repository: PostgresRepository,
        storage: Arc<dyn ObjectStorage>,
        max_document_bytes: usize,
        max_blocks: usize,
    ) -> Self {
        Self {
            repository,
            storage,
            max_document_bytes,
            max_blocks,
        }
    }

    pub async fn list(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Vec<Document>, DomainError> {
        self.ensure_project(owner_id, project_id).await?;
        self.repository.list_documents(owner_id, project_id).await
    }

    pub async fn create(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        title: String,
    ) -> Result<Document, DomainError> {
        let title = validate_title(title)?;
        self.repository
            .create_document(
                owner_id,
                NewDocument {
                    id: Uuid::new_v4(),
                    project_id,
                    title,
                },
            )
            .await?
            .ok_or(DomainError::NotFound("project"))
    }

    pub async fn get(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<DocumentDetail, DomainError> {
        let document = self
            .repository
            .get_document(owner_id, project_id, document_id, false)
            .await?
            .ok_or(DomainError::NotFound("document"))?;
        let content = match document.current_object_key.as_deref() {
            Some(key) => self.read_content(key, document.current_checksum.as_deref()).await?,
            None => empty_editor_document(),
        };
        Ok(DocumentDetail { document, content })
    }

    pub async fn rename(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        title: String,
    ) -> Result<Document, DomainError> {
        self.repository
            .update_document_title(
                owner_id,
                project_id,
                document_id,
                validate_title(title)?,
            )
            .await?
            .ok_or(DomainError::NotFound("document"))
    }

    pub async fn delete(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<(), DomainError> {
        if self
            .repository
            .soft_delete_document(owner_id, project_id, document_id)
            .await?
        {
            Ok(())
        } else {
            Err(DomainError::NotFound("document"))
        }
    }

    pub async fn restore(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<Document, DomainError> {
        self.repository
            .restore_document(owner_id, project_id, document_id)
            .await?
            .ok_or(DomainError::NotFound("document"))
    }

    pub async fn save(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        base_version: i64,
        content: EditorDocument,
    ) -> Result<DocumentVersion, DomainError> {
        if base_version < 0 {
            return Err(DomainError::Validation(
                "baseVersion must be zero or greater".into(),
            ));
        }
        validate_editor_document(&content, self.max_blocks)?;
        let body = serde_json::to_vec(&content)
            .map_err(|_| DomainError::Validation("document content is not valid JSON".into()))?;
        if body.len() > self.max_document_bytes {
            return Err(DomainError::Validation(format!(
                "document content must not exceed {} bytes",
                self.max_document_bytes
            )));
        }

        let version_id = Uuid::new_v4();
        let object_key = object_key(project_id, document_id, base_version + 1, version_id);
        let checksum = checksum(&body);
        self.storage
            .put_content(
                &object_key,
                body,
                ContentMetadata {
                    checksum: checksum.clone(),
                    schema_version: content.schema_version,
                },
            )
            .await?;

        let result = self
            .repository
            .commit_document_version(
                owner_id,
                project_id,
                document_id,
                base_version,
                PendingDocumentVersion {
                    id: version_id,
                    object_key: object_key.clone(),
                    checksum,
                    size_bytes: content_size(&content)?,
                    created_by: owner_id,
                },
            )
            .await;

        if let Err(error) = &result {
            if let Err(cleanup_error) = self
                .repository
                .record_storage_cleanup(
                    self.storage.content_bucket(),
                    &object_key,
                    "document_version_commit_failed",
                    Some(&error.to_string()),
                )
                .await
            {
                tracing::error!(
                    error = %cleanup_error,
                    object_key,
                    "failed to schedule orphaned object cleanup"
                );
            }
        }
        result
    }

    pub async fn list_revisions(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<Vec<DocumentVersion>, DomainError> {
        self.ensure_document(owner_id, project_id, document_id).await?;
        self.repository
            .list_document_checkpoints(owner_id, project_id, document_id)
            .await
    }

    pub async fn get_revision(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        revision_id: Uuid,
    ) -> Result<RevisionDetail, DomainError> {
        let revision = self
            .repository
            .get_document_version(owner_id, project_id, document_id, revision_id)
            .await?
            .filter(|revision| revision.is_checkpoint)
            .ok_or(DomainError::NotFound("revision"))?;
        let content = self
            .read_content(&revision.object_key, Some(&revision.checksum))
            .await?;
        Ok(RevisionDetail { revision, content })
    }

    pub async fn restore_revision(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
        revision_id: Uuid,
    ) -> Result<DocumentVersion, DomainError> {
        let detail = self
            .get_revision(owner_id, project_id, document_id, revision_id)
            .await?;
        let document = self
            .ensure_document(owner_id, project_id, document_id)
            .await?;
        self.save(
            owner_id,
            project_id,
            document_id,
            document.current_version,
            detail.content,
        )
        .await
    }

    async fn ensure_project(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<(), DomainError> {
        self.repository
            .get_project(owner_id, project_id, false)
            .await?
            .map(|_| ())
            .ok_or(DomainError::NotFound("project"))
    }

    async fn ensure_document(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        document_id: Uuid,
    ) -> Result<Document, DomainError> {
        self.repository
            .get_document(owner_id, project_id, document_id, false)
            .await?
            .ok_or(DomainError::NotFound("document"))
    }

    async fn read_content(
        &self,
        object_key: &str,
        expected_checksum: Option<&str>,
    ) -> Result<EditorDocument, DomainError> {
        let body = self.storage.get_content(object_key).await?;
        if body.len() > self.max_document_bytes
            || expected_checksum.is_some_and(|expected| checksum(&body) != expected)
        {
            return Err(DomainError::CorruptDocumentContent);
        }
        let content: EditorDocument =
            serde_json::from_slice(&body).map_err(|_| DomainError::CorruptDocumentContent)?;
        validate_editor_document(&content, self.max_blocks)
            .map_err(|_| DomainError::CorruptDocumentContent)?;
        Ok(content)
    }
}

fn empty_editor_document() -> EditorDocument {
    EditorDocument {
        schema_version: 1,
        editor: "editorjs".into(),
        time: 0,
        version: "2.30".into(),
        blocks: Vec::new(),
    }
}

fn validate_title(title: String) -> Result<String, DomainError> {
    let title = title.trim().to_owned();
    let length = title.chars().count();
    if length == 0 || length > MAX_TITLE_LENGTH {
        return Err(DomainError::Validation(format!(
            "title must contain between 1 and {MAX_TITLE_LENGTH} characters"
        )));
    }
    Ok(title)
}

fn validate_editor_document(
    content: &EditorDocument,
    max_blocks: usize,
) -> Result<(), DomainError> {
    if content.schema_version != 1 {
        return Err(DomainError::Validation(
            "schemaVersion must currently be 1".into(),
        ));
    }
    if content.editor != "editorjs" {
        return Err(DomainError::Validation("editor must be editorjs".into()));
    }
    if content.time < 0 {
        return Err(DomainError::Validation(
            "document time must be zero or greater".into(),
        ));
    }
    if content.version.is_empty() || content.version.len() > 32 {
        return Err(DomainError::Validation(
            "editor version must contain between 1 and 32 characters".into(),
        ));
    }
    if content.blocks.len() > max_blocks {
        return Err(DomainError::Validation(format!(
            "document must not contain more than {max_blocks} blocks"
        )));
    }

    let mut block_ids = HashSet::with_capacity(content.blocks.len());
    for block in &content.blocks {
        validate_block(block, &mut block_ids)?;
    }
    Ok(())
}

fn validate_block(
    block: &EditorBlock,
    block_ids: &mut HashSet<String>,
) -> Result<(), DomainError> {
    if block.id.is_empty() || block.id.len() > MAX_BLOCK_ID_LENGTH {
        return Err(DomainError::Validation(format!(
            "block ids must contain between 1 and {MAX_BLOCK_ID_LENGTH} characters"
        )));
    }
    if !block_ids.insert(block.id.clone()) {
        return Err(DomainError::Validation(
            "block ids must be unique within a document".into(),
        ));
    }
    if block.block_type.is_empty() || block.block_type.len() > MAX_BLOCK_TYPE_LENGTH {
        return Err(DomainError::Validation(format!(
            "block types must contain between 1 and {MAX_BLOCK_TYPE_LENGTH} characters"
        )));
    }
    if !block.data.is_object() {
        return Err(DomainError::Validation(
            "each block data field must be a JSON object".into(),
        ));
    }
    Ok(())
}

fn object_key(
    project_id: Uuid,
    document_id: Uuid,
    version: i64,
    version_id: Uuid,
) -> String {
    format!(
        "projects/{project_id}/documents/{document_id}/versions/{version}-{version_id}.json"
    )
}

fn checksum(body: &[u8]) -> String {
    let digest = Sha256::digest(body);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn content_size(content: &EditorDocument) -> Result<i64, DomainError> {
    let size = serde_json::to_vec(content)
        .map_err(|_| DomainError::Validation("document content is not valid JSON".into()))?
        .len();
    i64::try_from(size)
        .map_err(|_| DomainError::Validation("document content is too large".into()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn valid_document() -> EditorDocument {
        EditorDocument {
            schema_version: 1,
            editor: "editorjs".into(),
            time: 1,
            version: "2.30".into(),
            blocks: vec![EditorBlock {
                id: "first".into(),
                block_type: "paragraph".into(),
                data: json!({"text": "Hello"}),
            }],
        }
    }

    #[test]
    fn accepts_valid_editorjs_content() {
        assert!(validate_editor_document(&valid_document(), 10).is_ok());
    }

    #[test]
    fn rejects_duplicate_block_ids() {
        let mut content = valid_document();
        content.blocks.push(content.blocks[0].clone());
        assert!(matches!(
            validate_editor_document(&content, 10),
            Err(DomainError::Validation(_))
        ));
    }

    #[test]
    fn builds_scoped_immutable_object_keys() {
        let project_id = Uuid::nil();
        let document_id = Uuid::from_u128(1);
        let version_id = Uuid::from_u128(2);
        assert_eq!(
            object_key(project_id, document_id, 3, version_id),
            format!(
                "projects/{project_id}/documents/{document_id}/versions/3-{version_id}.json"
            )
        );
    }

    #[test]
    fn checksum_is_stable_sha256_hex() {
        assert_eq!(
            checksum(b"hello"),
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    }
}
