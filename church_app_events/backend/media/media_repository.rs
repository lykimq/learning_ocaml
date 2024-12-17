use sqlx::PgPool;
use crate::media::models::{Media, MediaStatus, MediaType};
use actix_web::{HttpResponse, Responder};
use serde_json::json;
use std::str::FromStr;

pub struct MediaRepository {
    pool: PgPool,
}

impl MediaRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_media(&self, media: &Media) -> impl Responder {
        match sqlx::query!(
            "INSERT INTO media
            (title, description, file_url, media_type,
            youtube_id, is_live, duration, thumbnail_url,
            views_count, status, uploaded_by, series_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *",
            media.title,
            media.description,
            media.file_url,
            media.media_type.to_string(),
            media.youtube_id,
            media.is_live,
            media.duration,
            media.thumbnail_url,
            media.views_count,
            media.status.to_string(),
            media.uploaded_by,
            media.series_order
        ).fetch_one(&self.pool).await {
            Ok(row) => {
                let media = Media {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    file_url: row.file_url,
                    media_type: match MediaType::from_str(&row.media_type.unwrap_or_default()) {
                        Ok(t) => t,
                        Err(e) => return HttpResponse::BadRequest().json(json!({
                            "error": e.to_string()
                        })),
                    },
                    youtube_id: row.youtube_id,
                    is_live: row.is_live.unwrap_or(false),
                    duration: row.duration,
                    thumbnail_url: row.thumbnail_url,
                    views_count: row.views_count,
                    status: match MediaStatus::from_str(&row.status.unwrap_or_default()) {
                        Ok(t) => t,
                        Err(e) => return HttpResponse::BadRequest().json(json!({
                            "error": e.to_string()
                        })),
                    },
                    uploaded_by: row.uploaded_by,
                    created_at: row.created_at.unwrap_or_default().date(),
                    updated_at: row.updated_at.unwrap_or_default().date(),
                    series_order: row.series_order,
                };
                HttpResponse::Ok().json(media)
            }
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to create media: {}", e)
            }))
        }
    }

    pub async fn get_media(&self, id: i32) -> impl Responder {
        match sqlx::query!(
            "SELECT * FROM media WHERE id = $1",
            id
        ).fetch_optional(&self.pool).await {
            Ok(Some(row)) => {
                let media = Media {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    file_url: row.file_url,
                    media_type: match MediaType::from_str(&row.media_type.unwrap_or_default()) {
                        Ok(t) => t,
                        Err(e) => return HttpResponse::BadRequest().json(json!({
                            "error": e.to_string()
                        })),
                    },
                    youtube_id: row.youtube_id,
                    is_live: row.is_live.unwrap_or(false),
                    duration: row.duration,
                    thumbnail_url: row.thumbnail_url,
                    views_count: row.views_count,
                    status: match MediaStatus::from_str(&row.status.unwrap_or_default()) {
                        Ok(t) => t,
                        Err(e) => return HttpResponse::BadRequest().json(json!({
                            "error": e.to_string()
                        })),
                    },
                    uploaded_by: row.uploaded_by,
                    created_at: row.created_at.unwrap_or_default().date(),
                    updated_at: row.updated_at.unwrap_or_default().date(),
                    series_order: row.series_order,
                };
                HttpResponse::Ok().json(media)
            }
            Ok(None) => HttpResponse::NotFound().json(json!({
                "error": "Media not found"
            })),
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to fetch media: {}", e)
            }))
        }
    }

    pub async fn update_media(&self, id: i32, media: &Media) -> impl Responder {
        match sqlx::query!(
            "UPDATE media SET
            title = $1,
            description = $2,
            is_live = $3,
            media_type = $4,
            status = $5,
            file_url = $6,
            thumbnail_url = $7,
            series_order = $8
            WHERE id = $9
            RETURNING *",
            media.title,
            media.description,
            media.is_live,
            media.media_type.to_string(),
            media.status.to_string(),
            media.file_url,
            media.thumbnail_url,
            media.series_order,
            id
        ).fetch_one(&self.pool).await {
            Ok(row) => {
                let updated_media = Media {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    file_url: row.file_url,
                    media_type: match MediaType::from_str(&row.media_type.unwrap_or_default()) {
                        Ok(t) => t,
                        Err(e) => return HttpResponse::BadRequest().json(json!({
                            "error": e.to_string()
                        })),
                    },
                    youtube_id: row.youtube_id,
                    is_live: row.is_live.unwrap_or(false),
                    duration: row.duration,
                    thumbnail_url: row.thumbnail_url,
                    views_count: row.views_count,
                    status: match MediaStatus::from_str(&row.status.unwrap_or_default()) {
                        Ok(t) => t,
                        Err(e) => return HttpResponse::BadRequest().json(json!({
                            "error": e.to_string()
                        })),
                    },
                    uploaded_by: row.uploaded_by,
                    created_at: row.created_at.unwrap_or_default().date(),
                    updated_at: row.updated_at.unwrap_or_default().date(),
                    series_order: row.series_order,
                };
                HttpResponse::Ok().json(updated_media)
            }
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to update media: {}", e)
            }))
        }
    }

    pub async fn delete_media(&self, id: i32) -> impl Responder {
        match sqlx::query!("DELETE FROM media WHERE id = $1", id)
            .execute(&self.pool)
            .await {
                Ok(_) => HttpResponse::Ok().json(json!({
                    "message": "Media deleted successfully"
                })),
                Err(e) => HttpResponse::InternalServerError().json(json!({
                    "error": format!("Failed to delete media: {}", e)
                }))
            }
    }

    pub async fn get_all_media(&self) -> impl Responder {
        match sqlx::query!(
            "SELECT * FROM media ORDER BY created_at DESC"
        ).fetch_all(&self.pool).await {
            Ok(rows) => {
                let media_result: Result<Vec<Media>, String> = rows.into_iter().map(|row| {
                    let media_type = MediaType::from_str(&row.media_type.unwrap_or_default())
                        .map_err(|e| e.to_string())?;
                    let status = MediaStatus::from_str(&row.status.unwrap_or_default())
                        .map_err(|e| e.to_string())?;

                    Ok(Media {
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        file_url: row.file_url,
                        media_type,
                        youtube_id: row.youtube_id,
                        is_live: row.is_live.unwrap_or(false),
                        duration: row.duration,
                        thumbnail_url: row.thumbnail_url,
                        views_count: row.views_count,
                        status,
                        uploaded_by: row.uploaded_by,
                        created_at: row.created_at.unwrap_or_default().date(),
                        updated_at: row.updated_at.unwrap_or_default().date(),
                        series_order: row.series_order,
                    })
                }).collect();

                match media_result {
                    Ok(media) => HttpResponse::Ok().json(media),
                    Err(e) => HttpResponse::BadRequest().json(json!({ "error": e }))
                }
            }
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to fetch media: {}", e)
            }))
        }
    }

    pub async fn search_media(&self, search_query: String) -> impl Responder {
        let search_pattern = format!("%{}%", search_query);
        match sqlx::query!(
            "SELECT * FROM media WHERE title ILIKE $1 ORDER BY created_at DESC",
            search_pattern
        ).fetch_all(&self.pool).await {
            Ok(rows) => {
                let media_result: Result<Vec<Media>, String> = rows.into_iter().map(|row| {
                    let media_type = MediaType::from_str(&row.media_type.unwrap_or_default())
                        .map_err(|e| e.to_string())?;
                    let status = MediaStatus::from_str(&row.status.unwrap_or_default())
                        .map_err(|e| e.to_string())?;

                    Ok(Media {
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        file_url: row.file_url,
                        media_type,
                        youtube_id: row.youtube_id,
                        is_live: row.is_live.unwrap_or(false),
                        duration: row.duration,
                        thumbnail_url: row.thumbnail_url,
                        views_count: row.views_count,
                        status,
                        uploaded_by: row.uploaded_by,
                        created_at: row.created_at.unwrap_or_default().date(),
                        updated_at: row.updated_at.unwrap_or_default().date(),
                        series_order: row.series_order,
                    })
                }).collect();

                match media_result {
                    Ok(media) => HttpResponse::Ok().json(media),
                    Err(e) => HttpResponse::BadRequest().json(json!({ "error": e }))
                }
            }
            Err(e) => HttpResponse::InternalServerError().json(json!({
                "error": format!("Failed to search media: {}", e)
            }))
        }
    }


}