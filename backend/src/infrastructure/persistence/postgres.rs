use crate::domain::entities::{Block, Page};
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

    pub async fn get_page(&self, page_id: Uuid) -> Result<Option<Page>, sqlx::Error> {
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
    
    // ... (rest of the file remains, skipping to get_all_pages)

    // You must manually locate get_all_pages since replace_file_content needs exact context.
    // I will split this into two replacements if needed, but I can probably put the struct definition at module level?
    // No, local structs are fine.
    
    // Wait, replace_file_content works on chunks. I need to replace get_page AND get_all_pages.
    // I already have get_blocks_for_page implemented correctly with manual mapping.

    // Let's replace get_page first.


    pub async fn get_blocks_for_page(&self, page_id: Uuid) -> Result<Vec<Block>, sqlx::Error> {
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

    pub async fn save_page_content(&self, page_id: Uuid, title: String, blocks: Vec<Block>) -> Result<(), sqlx::Error> {
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

    pub async fn create_page(&self, title: String) -> Result<Page, sqlx::Error> {
        let id = Uuid::new_v4();
        sqlx::query("INSERT INTO pages (id, title) VALUES ($1, $2)")
            .bind(id)
            .bind(&title)
            .execute(&self.pool)
            .await?;
            
        Ok(Page { id, title, parent_id: None })
    }
    
    pub async fn get_all_pages(&self) -> Result<Vec<Page>, sqlx::Error> {
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
}
