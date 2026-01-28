use serde::{Deserialize, Serialize};
use uuid::Uuid;

// EditorJS Block Structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Block {
    pub id: String, // EditorJS IDs are strings
    #[serde(rename = "type")]
    pub block_type: String,
    pub data: serde_json::Value,
}

// Page Entity
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Page {
    pub id: Uuid,
    pub title: String,
    pub parent_id: Option<Uuid>,
}
