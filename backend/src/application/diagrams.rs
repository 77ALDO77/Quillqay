use crate::{
    domain::{
        entities::{Diagram, DiagramChanges, NewDiagram},
        errors::DomainError,
        repositories::DiagramRepository,
    },
    infrastructure::persistence::postgres::PostgresRepository,
};
use serde_json::Value;
use uuid::Uuid;

const MAX_TITLE_LENGTH: usize = 255;
const VALID_DIAGRAM_TYPES: [&str; 4] = ["db", "flowchart", "architecture", "whiteboard"];

#[derive(Clone)]
pub struct DiagramService {
    repository: PostgresRepository,
}

impl DiagramService {
    pub fn new(repository: PostgresRepository) -> Self {
        Self { repository }
    }

    pub async fn list(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        diagram_type: Option<&str>,
    ) -> Result<Vec<Diagram>, DomainError> {
        self.repository
            .list_diagrams(owner_id, project_id, diagram_type)
            .await
    }

    pub async fn create(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        title: String,
        diagram_type: String,
        content: Option<Value>,
    ) -> Result<Diagram, DomainError> {
        let validated_title = validate_title(title)?;
        let validated_type = validate_diagram_type(diagram_type)?;
        let content_val = content.unwrap_or_else(|| serde_json::json!({}));

        let diagram = NewDiagram {
            id: Uuid::new_v4(),
            project_id,
            title: validated_title,
            diagram_type: validated_type,
            content: content_val,
        };

        self.repository
            .create_diagram(owner_id, diagram)
            .await?
            .ok_or(DomainError::NotFound("project"))
    }

    pub async fn get(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        diagram_id: Uuid,
    ) -> Result<Diagram, DomainError> {
        self.repository
            .get_diagram(owner_id, project_id, diagram_id)
            .await?
            .ok_or(DomainError::NotFound("diagram"))
    }

    pub async fn update(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        diagram_id: Uuid,
        title: Option<String>,
        content: Option<Value>,
    ) -> Result<Diagram, DomainError> {
        let validated_title = match title {
            Some(t) => Some(validate_title(t)?),
            None => None,
        };

        let changes = DiagramChanges {
            title: validated_title,
            content,
        };

        self.repository
            .update_diagram(owner_id, project_id, diagram_id, changes)
            .await?
            .ok_or(DomainError::NotFound("diagram"))
    }

    pub async fn delete(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        diagram_id: Uuid,
    ) -> Result<(), DomainError> {
        let deleted = self
            .repository
            .delete_diagram(owner_id, project_id, diagram_id)
            .await?;
        if deleted {
            Ok(())
        } else {
            Err(DomainError::NotFound("diagram"))
        }
    }
}

fn validate_title(raw: String) -> Result<String, DomainError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(DomainError::Validation("diagram title cannot be empty".to_owned()));
    }
    if trimmed.len() > MAX_TITLE_LENGTH {
        return Err(DomainError::Validation(format!(
            "diagram title cannot exceed {MAX_TITLE_LENGTH} characters"
        )));
    }
    Ok(trimmed.to_owned())
}

fn validate_diagram_type(raw: String) -> Result<String, DomainError> {
    let trimmed = raw.trim().to_lowercase();
    if !VALID_DIAGRAM_TYPES.contains(&trimmed.as_str()) {
        return Err(DomainError::Validation(format!(
            "invalid diagram type: '{trimmed}'. Allowed types: {:?}",
            VALID_DIAGRAM_TYPES
        )));
    }
    Ok(trimmed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_diagram_title_and_type() {
        assert!(validate_title("".to_string()).is_err());
        assert!(validate_title("   ".to_string()).is_err());
        assert_eq!(validate_title("  My Diagram  ".to_string()).unwrap(), "My Diagram");

        assert!(validate_diagram_type("invalid".to_string()).is_err());
        assert_eq!(validate_diagram_type("DB".to_string()).unwrap(), "db");
        assert_eq!(validate_diagram_type("flowchart".to_string()).unwrap(), "flowchart");
    }
}
