use crate::domain::entities::{Block, Page};
use crate::domain::errors::DomainError;
use crate::domain::repositories::PageRepository;
use async_trait::async_trait;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;
use serde_json::Value;

pub struct PostgresRepository {
    pool: PgPool,
}

impl PostgresRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PageRepository for PostgresRepository {
    async fn get_page(&self, page_id: Uuid) -> Result<Option<Page>, DomainError> {
        #[derive(FromRow)]
        struct PageRow {
            id: Uuid,
            title: String,
            parent_id: Option<Uuid>,
        }

        let row = sqlx::query_as::<_, PageRow>(
            "SELECT id, title, parent_id FROM pages WHERE id = $1"
        )
        .bind(page_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| Page {
            id: r.id,
            title: r.title,
            parent_id: r.parent_id,
        }))
    }

    async fn get_blocks_for_page(&self, page_id: Uuid) -> Result<Vec<Block>, DomainError> {
        #[derive(FromRow)]
        struct BlockRow {
            id: String,
            data: Value,
        }

        let rows = sqlx::query_as::<_, BlockRow>(
            "SELECT id, data FROM blocks WHERE page_id = $1"
        )
        .bind(page_id)
        .fetch_all(&self.pool)
        .await?;

        let blocks = rows.into_iter().map(|row| {
            let val = &row.data;
            let block_type = val.get("type").and_then(|t| t.as_str()).unwrap_or("paragraph").to_string();
            let inner_data = val.get("data").cloned().unwrap_or(Value::Null);

            Block {
                id: row.id,
                block_type,
                data: inner_data
            }
        }).collect();

        Ok(blocks)
    }

    async fn save_page_content(&self, page_id: Uuid, title: String, blocks: Vec<Block>) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await?;

        sqlx::query("UPDATE pages SET title = $1 WHERE id = $2")
            .bind(&title)
            .bind(page_id)
            .execute(&mut *tx)
            .await?;

        sqlx::query("DELETE FROM blocks WHERE page_id = $1")
            .bind(page_id)
            .execute(&mut *tx)
            .await?;

        for block in blocks {
            let combined_data = serde_json::json!({
                "type": block.block_type,
                "data": block.data
            });

            sqlx::query("INSERT INTO blocks (id, page_id, data) VALUES ($1, $2, $3)")
                .bind(block.id)
                .bind(page_id)
                .bind(combined_data)
                .execute(&mut *tx)
                .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    async fn create_page(&self, title: String) -> Result<Page, DomainError> {
        let id = Uuid::new_v4();
        sqlx::query("INSERT INTO pages (id, title) VALUES ($1, $2)")
            .bind(id)
            .bind(&title)
            .execute(&self.pool)
            .await?;
            
        Ok(Page { id, title, parent_id: None })
    }
    
    async fn get_all_pages(&self) -> Result<Vec<Page>, DomainError> {
        #[derive(FromRow)]
        struct PageRow {
            id: Uuid,
            title: String,
            parent_id: Option<Uuid>,
        }

        let rows = sqlx::query_as::<_, PageRow>("SELECT id, title, parent_id FROM pages")
            .fetch_all(&self.pool)
            .await?;
            
        Ok(rows.into_iter().map(|r| Page {
            id: r.id,
            title: r.title,
            parent_id: r.parent_id,
        }).collect())
    }

    async fn delete_page(&self, id: Uuid) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM pages WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
