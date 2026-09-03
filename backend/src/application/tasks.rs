use crate::{
    domain::{
        entities::{NewTask, Task, TaskChanges},
        errors::DomainError,
        repositories::TaskRepository,
    },
    infrastructure::persistence::postgres::PostgresRepository,
};
use uuid::Uuid;

const MAX_TASK_TITLE_LENGTH: usize = 200;
const MAX_TASK_DESCRIPTION_LENGTH: usize = 2_000;

#[derive(Clone)]
pub struct TaskService {
    repository: PostgresRepository,
}

impl TaskService {
    pub fn new(repository: PostgresRepository) -> Self {
        Self { repository }
    }

    pub async fn list(&self, owner_id: Uuid, project_id: Uuid) -> Result<Vec<Task>, DomainError> {
        self.repository.list_tasks(owner_id, project_id).await
    }

    pub async fn create(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        title: String,
        description: Option<String>,
        priority: Option<String>,
        status: Option<String>,
        order_index: Option<i32>,
    ) -> Result<Task, DomainError> {
        let task = NewTask {
            id: Uuid::new_v4(),
            project_id,
            title: validate_title(title)?,
            description: validate_description(description.unwrap_or_default())?,
            status: validate_status(status.unwrap_or_else(|| "todo".to_owned()))?,
            priority: validate_priority(priority.unwrap_or_else(|| "medium".to_owned()))?,
            order_index: order_index.unwrap_or(0),
        };

        self.repository
            .create_task(owner_id, task)
            .await?
            .ok_or(DomainError::NotFound("project"))
    }

    pub async fn update(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        task_id: Uuid,
        title: Option<String>,
        description: Option<String>,
        status: Option<String>,
        priority: Option<String>,
        order_index: Option<i32>,
    ) -> Result<Task, DomainError> {
        let validated_title = match title {
            Some(t) => Some(validate_title(t)?),
            None => None,
        };
        let validated_desc = match description {
            Some(d) => Some(validate_description(d)?),
            None => None,
        };
        let validated_status = match status {
            Some(s) => Some(validate_status(s)?),
            None => None,
        };
        let validated_priority = match priority {
            Some(p) => Some(validate_priority(p)?),
            None => None,
        };

        let changes = TaskChanges {
            title: validated_title,
            description: validated_desc,
            status: validated_status,
            priority: validated_priority,
            order_index,
        };

        self.repository
            .update_task(owner_id, project_id, task_id, changes)
            .await?
            .ok_or(DomainError::NotFound("task"))
    }

    pub async fn delete(
        &self,
        owner_id: Uuid,
        project_id: Uuid,
        task_id: Uuid,
    ) -> Result<(), DomainError> {
        let deleted = self.repository.delete_task(owner_id, project_id, task_id).await?;
        if deleted {
            Ok(())
        } else {
            Err(DomainError::NotFound("task"))
        }
    }
}

fn validate_title(raw: String) -> Result<String, DomainError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(DomainError::Validation("task title cannot be empty".to_owned()));
    }
    if trimmed.len() > MAX_TASK_TITLE_LENGTH {
        return Err(DomainError::Validation(format!(
            "task title cannot exceed {MAX_TASK_TITLE_LENGTH} characters"
        )));
    }
    Ok(trimmed.to_owned())
}

fn validate_description(raw: String) -> Result<String, DomainError> {
    let trimmed = raw.trim();
    if trimmed.len() > MAX_TASK_DESCRIPTION_LENGTH {
        return Err(DomainError::Validation(format!(
            "task description cannot exceed {MAX_TASK_DESCRIPTION_LENGTH} characters"
        )));
    }
    Ok(trimmed.to_owned())
}

fn validate_status(raw: String) -> Result<String, DomainError> {
    let normalized = raw.trim().to_lowercase();
    match normalized.as_str() {
        "todo" | "in-progress" | "done" => Ok(normalized),
        _ => Err(DomainError::Validation(
            "status must be one of: todo, in-progress, done".to_owned(),
        )),
    }
}

fn validate_priority(raw: String) -> Result<String, DomainError> {
    let normalized = raw.trim().to_lowercase();
    match normalized.as_str() {
        "low" | "medium" | "high" => Ok(normalized),
        _ => Err(DomainError::Validation(
            "priority must be one of: low, medium, high".to_owned(),
        )),
    }
}
