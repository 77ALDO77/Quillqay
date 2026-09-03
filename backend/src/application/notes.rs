use crate::{
    domain::{
        entities::{NewNote, Note, NoteChanges},
        errors::DomainError,
        repositories::NoteRepository,
    },
    infrastructure::persistence::postgres::PostgresRepository,
};
use uuid::Uuid;

const MAX_NOTE_TEXT_LENGTH: usize = 10_000;

#[derive(Clone)]
pub struct NoteService {
    repository: PostgresRepository,
}

impl NoteService {
    pub fn new(repository: PostgresRepository) -> Self {
        Self { repository }
    }

    pub async fn list(&self, owner_id: Uuid, project_id: Uuid) -> Result<Vec<Note>, DomainError> {
        self.repository.list_notes(owner_id, project_id).await
    }

    pub async fn create(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        text: String,
        color: Option<String>,
        pinned: Option<bool>,
    ) -> Result<Note, DomainError> {
        let note = NewNote {
            id: Uuid::new_v4(),
            project_id,
            text: validate_text(text)?,
            color: validate_color(color.unwrap_or_else(|| "primary".to_owned()))?,
            pinned: pinned.unwrap_or(false),
        };

        self.repository
            .create_note(owner_id, note)
            .await?
            .ok_or(DomainError::NotFound("project"))
    }

    pub async fn update(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        note_id: Uuid,
        text: Option<String>,
        color: Option<String>,
        pinned: Option<bool>,
    ) -> Result<Note, DomainError> {
        let validated_text = match text {
            Some(t) => Some(validate_text(t)?),
            None => None,
        };
        let validated_color = match color {
            Some(c) => Some(validate_color(c)?),
            None => None,
        };

        let changes = NoteChanges {
            text: validated_text,
            color: validated_color,
            pinned,
        };

        self.repository
            .update_note(owner_id, project_id, note_id, changes)
            .await?
            .ok_or(DomainError::NotFound("note"))
    }

    pub async fn delete(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        note_id: Uuid,
    ) -> Result<(), DomainError> {
        let deleted = self.repository.delete_note(owner_id, project_id, note_id).await?;
        if deleted {
            Ok(())
        } else {
            Err(DomainError::NotFound("note"))
        }
    }
}

fn validate_text(raw: String) -> Result<String, DomainError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(DomainError::Validation("note text cannot be empty".to_owned()));
    }
    if trimmed.len() > MAX_NOTE_TEXT_LENGTH {
        return Err(DomainError::Validation(format!(
            "note text cannot exceed {MAX_NOTE_TEXT_LENGTH} bytes"
        )));
    }
    Ok(trimmed.to_owned())
}

fn validate_color(raw: String) -> Result<String, DomainError> {
    let normalized = raw.trim().to_lowercase();
    match normalized.as_str() {
        "primary" | "secondary" | "tertiary" => Ok(normalized),
        _ => Err(DomainError::Validation(
            "color must be one of: primary, secondary, tertiary".to_owned(),
        )),
    }
}
