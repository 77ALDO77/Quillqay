use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealtimeEvent {
    pub event: String,
    pub project_id: Uuid,
    pub entity_id: Uuid,
    #[serde(default, skip_serializing_if = "serde_json::Value::is_null")]
    pub payload: serde_json::Value,
}

impl RealtimeEvent {
    pub fn new(
        event: impl Into<String>,
        project_id: Uuid,
        entity_id: Uuid,
        payload: serde_json::Value,
    ) -> Self {
        Self {
            event: event.into(),
            project_id,
            entity_id,
            payload,
        }
    }

    pub fn to_json_string(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }
}
