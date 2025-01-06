use sqlx::{PgPool, Row};
use std::str::FromStr;
use chrono::NaiveDateTime;

use crate::media::models::{Media, MediaStatus, MediaType, MediaUpdateRequest};
use crate::media::error::{AppError, ErrorMessage};

#[derive(sqlx::FromRow)]
struct MediaRow {
    id: i32,
    title: String,
    description: Option<String>,
    file_url: String,
    media_type: String,
    youtube_id: Option<String>,
    is_live: bool,
    duration: Option<i32>,
    thumbnail_url: Option<String>,
    views_count: i32,
    status: String,
    uploaded_by: i32,
    created_at: NaiveDateTime,
    updated_at: NaiveDateTime,
    series_order: Option<i32>,
}

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
    fn row_to_media(&self, row: sqlx::postgres::PgRow) -> Result<Media, AppError> {
        Ok(Media {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            file_url: row.get::<String, _>("file_url"),
            media_type: MediaType::from_str(row.get::<Option<&str>, _>("media_type").unwrap_or_default())
                .map_err(|e| AppError::BadRequest(ErrorMessage::from(e.as_str())))?,
            youtube_id: row.get::<Option<String>, _>("youtube_id"),
            is_live: row.get::<bool, _>("is_live"),
            duration: row.get::<Option<i32>, _>("duration"),
            thumbnail_url: row.get::<Option<String>, _>("thumbnail_url"),
            views_count: Some(row.get("views_count")),
            status: MediaStatus::from_str(row.get::<Option<&str>, _>("status").unwrap_or_default())
                .map_err(|e| AppError::BadRequest(ErrorMessage::from(e.as_str())))?,
            uploaded_by: row.get("uploaded_by"),
            created_at: row.get::<NaiveDateTime, _>("created_at"),
            updated_at: row.get::<NaiveDateTime, _>("updated_at"),
            series_order: row.get("series_order"),
        })
    }

    /// Creates a new media entry in the database
    pub async fn create_media(&self, media: &Media) -> Result<Media, AppError> {
        let row = sqlx::query(r#"
            INSERT INTO media (
                title, description, file_url, media_type,
                youtube_id, is_live, duration, thumbnail_url,
                views_count, status, uploaded_by, series_order,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        "#)
        .bind(media.title.clone())
        .bind(media.description.clone())
        .bind(media.file_url.clone())
        .bind(media.media_type.to_string())
        .bind(media.youtube_id.clone())
        .bind(media.is_live)
        .bind(media.duration)
        .bind(media.thumbnail_url.clone())
        .bind(media.views_count.unwrap_or_default())
        .bind(media.status.to_string())
        .bind(media.uploaded_by)
        .bind(media.series_order)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

        self.row_to_media(row)
            .map_err(|e| AppError::BadRequest(ErrorMessage::from(e.to_string())))
    }

    /// Retrieves a media entry by ID
    pub async fn get_media(&self, id: i32) -> Result<Media, AppError> {
        match sqlx::query("SELECT * FROM media WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
        {
            Ok(Some(row)) => self.row_to_media(row),
            Ok(None) => Err(AppError::NotFound(ErrorMessage::from("Media not found"))),
            Err(e) => Err(AppError::DatabaseError(e)),
        }
    }

    /// Updates an existing media entry
    pub async fn update_media(&self, id: i32, request: &MediaUpdateRequest) -> Result<Media, AppError> {
        let row = sqlx::query(
            r#"
            UPDATE media SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                is_live = COALESCE($3, is_live),
                media_type = COALESCE($4, media_type),
                status = COALESCE($5, status),
                file_url = COALESCE($6, file_url),
                thumbnail_url = COALESCE($7, series_order),
                series_order = COALESCE($8, series_order)
            WHERE id = $9
            RETURNING *
            "#
        )
        .bind(request.title.as_ref())
        .bind(request.description.as_ref())
        .bind(request.is_live)
        .bind(request.media_type.as_ref().map(|t| t.to_string()))
        .bind(request.status.as_ref().map(|s| s.to_string()))
        .bind(request.file_url.as_ref())
        .bind(request.thumbnail_url.as_ref())
        .bind(request.series_order)
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

        self.row_to_media(row)
            .map_err(|e| AppError::BadRequest(ErrorMessage::from(e.to_string())))
    }

    /// Deletes a media entry by ID
    pub async fn delete_media(&self, id: i32) -> Result<(), AppError> {
        match sqlx::query!("DELETE FROM media WHERE id = $1", id)
            .execute(&self.pool)
            .await
        {
            Ok(_) => Ok(()),
            Err(e) => Err(AppError::DatabaseError(e)),
        }
    }

    /// Retrieves all media entries, ordered by creation date
    pub async fn get_all_media(&self) -> Result<Vec<Media>, AppError> {
        match sqlx::query("SELECT * FROM media ORDER BY created_at DESC")
            .fetch_all(&self.pool)
            .await
        {
            Ok(rows) => {
                let media_result: Result<Vec<Media>, _> = rows
                    .into_iter()
                    .map(|row| self.row_to_media(row))
                    .collect();
                media_result
            }
            Err(e) => Err(AppError::DatabaseError(e))
        }
    }

    /// Searches for media entries by title
    pub async fn search_media(&self, search_query: String) -> Result<Vec<Media>, AppError> {
        let search_pattern = format!("%{}%", search_query);
        match sqlx::query("SELECT * FROM media WHERE title ILIKE $1 ORDER BY created_at DESC")
            .bind(search_pattern)
            .fetch_all(&self.pool)
            .await
        {
            Ok(rows) => {
                let media_result: Result<Vec<Media>, _> = rows
                    .into_iter()
                    .map(|row| self.row_to_media(row))
                    .collect();
                media_result
            }
            Err(e) => Err(AppError::DatabaseError(e))
        }
    }
}
