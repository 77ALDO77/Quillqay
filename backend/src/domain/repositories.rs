use crate::domain::entities::{Block, Page};
use crate::domain::errors::DomainError;
use async_trait::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait PageRepository: Send + Sync {
    async fn get_page(&self, id: Uuid) -> Result<Option<Page>, DomainError>;
    async fn get_all_pages(&self) -> Result<Vec<Page>, DomainError>;
    async fn create_page(&self, title: String) -> Result<Page, DomainError>;
    async fn get_blocks_for_page(&self, page_id: Uuid) -> Result<Vec<Block>, DomainError>;
    async fn save_page_content(&self, page_id: Uuid, title: String, blocks: Vec<Block>) -> Result<(), DomainError>;
    async fn delete_page(&self, id: Uuid) -> Result<(), DomainError>;
}
