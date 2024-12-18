use actix_web::{HttpResponse, Responder};
use serde_json::json;
use sqlx::{PgPool, Row};
use std::str::FromStr;

use crate::media::models::{Media, MediaStatus, MediaType};

/// Repository for handling media-related database operations
pub struct MediaRepository {
    pool: PgPool,
}

impl MediaRepository {
    /// Creates a new MediaRepository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Helper function to convert database row to Media struct
    fn row_to_media(&self, row: sqlx::postgres::PgRow) -> Result<Media, HttpResponse> {
        Ok(Media {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            file_url: row.get("file_url"),
            media_type: MediaType::from_str(&row.get("media_type").unwrap_or_default())
                .map_err(|e| HttpResponse::BadRequest().json(json!({ "error": e.to_string() })))?,
            youtube_id: row.get("youtube_id"),
            is_live: row.get("is_live").unwrap_or(false),
            duration: row.get("duration"),
            thumbnail_url: row.get("thumbnail_url"),
            views_count: row.get("views_count"),
            status: MediaStatus::from_str(&row.get("status").unwrap_or_default())
                .map_err(|e| HttpResponse::BadRequest().json(json!({ "error": e.to_string() })))?,
            uploaded_by: row.get("uploaded_by"),
            created_at: row.get("created_at").unwrap_or_default().date(),
            updated_at: row.get("updated_at").unwrap_or_default().date(),
            series_order: row.get("series_order"),
        })
    }

    /// Creates a new media entry in the database
    pub async fn create_media(&self, media: &Media) -> impl Responder {
        match sqlx::query!(
            r#"
            INSERT INTO media (
                title, description, file_url, media_type,
                youtube_id, is_live, duration, thumbnail_url,
                views_count, status, uploaded_by, series_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#,
            media.title, media.description, media.file_url,
            media.media_type.to_string(), media.youtube_id,
            media.is_live, media.duration, media.thumbnail_url,
            media.views_count, media.status.to_string(),
            media.uploaded_by, media.series_order
        )
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => match self.row_to_media(row) {
                Ok(media) => HttpResponse::Ok().json(media),
                Err(response) => response,
            },
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to create media: {}", e)
            }))
        }
    }

    /// Retrieves a media entry by ID
    pub async fn get_media(&self, id: i32) -> impl Responder {
        match sqlx::query!("SELECT * FROM media WHERE id = $1", id)
            .fetch_optional(&self.pool)
            .await
        {
            Ok(Some(row)) => match self.row_to_media(row) {
                Ok(media) => HttpResponse::Ok().json(media),
                Err(response) => response,
            },
            Ok(None) => HttpResponse::NotFound().json(json!({
                "error": "Media not found"
            })),
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to fetch media: {}", e)
            }))
        }
    }

    /// Updates an existing media entry
    pub async fn update_media(&self, id: i32, media: &Media) -> impl Responder {
        match sqlx::query!(
            r#"
            UPDATE media SET
                title = $1, description = $2, is_live = $3,
                media_type = $4, status = $5, file_url = $6,
                thumbnail_url = $7, series_order = $8
            WHERE id = $9
            RETURNING *
            "#,
            media.title, media.description, media.is_live,
            media.media_type.to_string(), media.status.to_string(),
            media.file_url, media.thumbnail_url, media.series_order, id
        )
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => match self.row_to_media(row) {
                Ok(media) => HttpResponse::Ok().json(media),
                Err(response) => response,
            },
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to update media: {}", e)
            }))
        }
    }

    /// Deletes a media entry by ID
    pub async fn delete_media(&self, id: i32) -> impl Responder {
        match sqlx::query!("DELETE FROM media WHERE id = $1", id)
            .execute(&self.pool)
            .await
        {
            Ok(_) => HttpResponse::Ok().json(json!({
                "message": "Media deleted successfully"
            })),
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to delete media: {}", e)
            }))
        }
    }

    /// Retrieves all media entries, ordered by creation date
    pub async fn get_all_media(&self) -> impl Responder {
        match sqlx::query!("SELECT * FROM media ORDER BY created_at DESC")
            .fetch_all(&self.pool)
            .await
        {
            Ok(rows) => {
                let media_result: Result<Vec<Media>, _> = rows
                    .into_iter()
                    .map(|row| self.row_to_media(row))
                    .collect();

                match media_result {
                    Ok(media) => HttpResponse::Ok().json(media),
                    Err(response) => response,
                }
            }
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to fetch media: {}", e)
            }))
        }
    }

    /// Searches for media entries by title
    pub async fn search_media(&self, search_query: String) -> impl Responder {
        let search_pattern = format!("%{}%", search_query);
        match sqlx::query!(
            "SELECT * FROM media WHERE title ILIKE $1 ORDER BY created_at DESC",
            search_pattern
        )
        .fetch_all(&self.pool)
        .await
        {
            Ok(rows) => {
                let media_result: Result<Vec<Media>, _> = rows
                    .into_iter()
                    .map(|row| self.row_to_media(row))
                    .collect();

                match media_result {
                    Ok(media) => HttpResponse::Ok().json(media),
                    Err(response) => response,
                }
            }
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to search media: {}", e)
            }))
        }
    }
}