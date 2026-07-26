use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub display_name: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug)]
pub struct UserWithPassword {
    pub user: User,
    pub password_hash: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub color: String,
    pub tags: Vec<String>,
    pub document_count: i64,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug)]
pub struct NewProject {
    pub owner_id: Uuid,
    pub title: String,
    pub description: String,
    pub color: String,
    pub tags: Vec<String>,
}

#[derive(Clone, Debug, Default)]
pub struct ProjectChanges {
    pub title: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub current_version: i64,
    pub current_object_key: Option<String>,
    pub current_checksum: Option<String>,
    pub current_size_bytes: Option<i64>,
    pub last_checkpoint_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug)]
pub struct NewDocument {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentVersion {
    pub id: Uuid,
    pub document_id: Uuid,
    pub version: i64,
    pub object_key: String,
    pub checksum: String,
    pub size_bytes: i64,
    pub is_checkpoint: bool,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Debug)]
pub struct PendingDocumentVersion {
    pub id: Uuid,
    pub object_key: String,
    pub checksum: String,
    pub size_bytes: i64,
    pub created_by: Uuid,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EditorDocument {
    pub schema_version: u32,
    pub editor: String,
    pub time: i64,
    pub version: String,
    pub blocks: Vec<EditorBlock>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct EditorBlock {
    pub id: String,
    #[serde(rename = "type")]
    pub block_type: String,
    pub data: Value,
}

#[derive(Clone, Debug)]
pub struct StorageCleanupJob {
    pub id: Uuid,
    pub bucket: String,
    pub object_key: String,
    pub attempts: i32,
}
