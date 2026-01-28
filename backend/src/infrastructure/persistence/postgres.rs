use crate::domain::entities::{Block, BlockData, Page};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;
use serde_json::Value;

// DTOs for Database Mapping to keep Domain entities pure if strict separation is needed,
// but for now since our entities are simple and sqlx can map to them with some help or direct DTOs,
// we will use the previously defined struct shape but handle the JSONB mapping manually or via sqlx help.

// We will implement a simple Repository struct
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
            r#"SELECT id, title, parent_id FROM pages WHERE id = $1"#
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

    pub async fn create_page(&self, page: &Page) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"INSERT INTO pages (id, title, parent_id) VALUES ($1, $2, $3)"#
        )
        .bind(page.id)
        .bind(&page.title)
        .bind(page.parent_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_blocks_for_page(&self, page_id: Uuid) -> Result<Vec<Block>, sqlx::Error> {
        // We need to retrieve the JSONB data and map it to BlockData enum
        // sqlx::query_as! has trouble with complex types without type overrides, 
        // so we use query_as and a custom DTO or manual mapping.
        // Let's use a DTO for the DB row.
        
        #[derive(FromRow)]
        struct BlockRow {
            id: Uuid,
            page_id: Uuid,
            data: Value, // serde_json::Value
        }

        let rows = sqlx::query_as::<_, BlockRow>(
            r#"SELECT id, page_id, data FROM blocks WHERE page_id = $1"#
        )
        .bind(page_id)
        .fetch_all(&self.pool)
        .await?;

        let blocks = rows.into_iter().map(|row| {
            let block_data: BlockData = serde_json::from_value(row.data).unwrap_or_else(|_| BlockData::Text("Error parsing block data".to_string()));
            Block {
                id: row.id,
                page_id: row.page_id,
                data: block_data,
            }
        }).collect();

        Ok(blocks)
    }

    pub async fn create_block(&self, block: &Block) -> Result<(), sqlx::Error> {
        let data_json = serde_json::to_value(&block.data).unwrap();
        sqlx::query(
            r#"INSERT INTO blocks (id, page_id, data) VALUES ($1, $2, $3)"#
        )
        .bind(block.id)
        .bind(block.page_id)
        .bind(data_json)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
