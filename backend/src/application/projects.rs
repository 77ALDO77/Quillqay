use crate::{
    domain::{
        entities::{NewProject, Project, ProjectChanges},
        errors::DomainError,
        repositories::ProjectRepository,
    },
    infrastructure::persistence::postgres::PostgresRepository,
};
use std::collections::HashSet;
use uuid::Uuid;

const MAX_TITLE_LENGTH: usize = 120;
const MAX_DESCRIPTION_LENGTH: usize = 2_000;
const MAX_TAGS: usize = 10;
const MAX_TAG_LENGTH: usize = 32;

#[derive(Clone)]
pub struct ProjectService {
    repository: PostgresRepository,
}

impl ProjectService {
    pub fn new(repository: PostgresRepository) -> Self {
        Self { repository }
    }

    pub async fn list(&self, owner_id: Uuid) -> Result<Vec<Project>, DomainError> {
        self.repository.list_projects(owner_id).await
    }

    pub async fn create(
        &self,
        owner_id: Uuid,
        title: String,
        description: Option<String>,
        color: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<Project, DomainError> {
        let project = NewProject {
            owner_id,
            title: validate_title(title)?,
            description: validate_description(description.unwrap_or_default())?,
            color: validate_color(color.unwrap_or_else(|| "primary".to_owned()))?,
            tags: validate_tags(tags.unwrap_or_default())?,
        };

        self.repository.create_project(project).await
    }

    pub async fn get(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Project, DomainError> {
        self.repository
            .get_project(owner_id, project_id, false)
            .await?
            .ok_or(DomainError::NotFound("project"))
    }

    pub async fn update(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        mut changes: ProjectChanges,
    ) -> Result<Project, DomainError> {
        if changes.title.is_none()
            && changes.description.is_none()
            && changes.color.is_none()
            && changes.tags.is_none()
        {
            return Err(DomainError::Validation(
                "at least one project field must be provided".into(),
            ));
        }

        changes.title = changes.title.map(validate_title).transpose()?;
        changes.description = changes
            .description
            .map(validate_description)
            .transpose()?;
        changes.color = changes.color.map(validate_color).transpose()?;
        changes.tags = changes.tags.map(validate_tags).transpose()?;

        self.repository
            .update_project(owner_id, project_id, changes)
            .await?
            .ok_or(DomainError::NotFound("project"))
    }

    pub async fn delete(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<(), DomainError> {
        if self
            .repository
            .soft_delete_project(owner_id, project_id)
            .await?
        {
            Ok(())
        } else {
            Err(DomainError::NotFound("project"))
        }
    }

    pub async fn restore(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
    ) -> Result<Project, DomainError> {
        self.repository
            .restore_project(owner_id, project_id)
            .await?
            .ok_or(DomainError::NotFound("project"))
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

fn validate_description(description: String) -> Result<String, DomainError> {
    let description = description.trim().to_owned();
    if description.chars().count() > MAX_DESCRIPTION_LENGTH {
        return Err(DomainError::Validation(format!(
            "description must contain at most {MAX_DESCRIPTION_LENGTH} characters"
        )));
    }
    Ok(description)
}

fn validate_color(color: String) -> Result<String, DomainError> {
    let color = color.trim().to_lowercase();
    if !matches!(color.as_str(), "primary" | "secondary" | "tertiary") {
        return Err(DomainError::Validation(
            "color must be primary, secondary, or tertiary".into(),
        ));
    }
    Ok(color)
}

fn validate_tags(tags: Vec<String>) -> Result<Vec<String>, DomainError> {
    if tags.len() > MAX_TAGS {
        return Err(DomainError::Validation(format!(
            "a project can have at most {MAX_TAGS} tags"
        )));
    }

    let mut seen = HashSet::new();
    let mut normalized = Vec::with_capacity(tags.len());
    for tag in tags {
        let tag = tag.trim().to_owned();
        if tag.is_empty() || tag.chars().count() > MAX_TAG_LENGTH {
            return Err(DomainError::Validation(format!(
                "tags must contain between 1 and {MAX_TAG_LENGTH} characters"
            )));
        }
        if seen.insert(tag.to_lowercase()) {
            normalized.push(tag);
        }
    }

    Ok(normalized)
}

#[cfg(test)]
mod tests {
    use super::{validate_color, validate_tags, validate_title};

    #[test]
    fn normalizes_project_input() {
        assert_eq!(validate_title("  Project  ".into()).unwrap(), "Project");
        assert_eq!(validate_color("PRIMARY".into()).unwrap(), "primary");
        assert_eq!(
            validate_tags(vec!["Rust".into(), " rust ".into()]).unwrap(),
            vec!["Rust"]
        );
    }

    #[test]
    fn rejects_invalid_project_input() {
        assert!(validate_title(" ".into()).is_err());
        assert!(validate_color("red".into()).is_err());
        assert!(validate_tags(vec!["".into()]).is_err());
    }
}
