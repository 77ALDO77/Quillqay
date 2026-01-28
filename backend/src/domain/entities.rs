use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", content = "data")]
pub enum BlockData {
    Text(String),
    Header { level: u8, text: String },
    Code { lang: String, code: String },
    Todo { task: String, completed: bool },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Block {
    pub id: Uuid,
    pub page_id: Uuid,
    pub data: BlockData,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Page {
    pub id: Uuid,
    pub title: String,
    pub parent_id: Option<Uuid>,
}
