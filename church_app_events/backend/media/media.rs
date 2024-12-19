use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use actix_web::{web, HttpResponse, Responder};
use crate::media::{
    models::{Media, MediaType, MediaStatus, MediaUpdateRequest},
    media_repository::MediaRepository,
    watch_history_repository::{WatchHistoryRepository, UpdateWatchProgressRequest},
};

// ===== Data Structures =====

/// Represents the response structure for media endpoints
#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct MediaResponse {
    pub id: i32,
    pub title: String,
    pub description: Option<String>,
    pub file_url: String,
    pub media_type: MediaType,
    pub youtube_id: Option<String>,
    pub is_live: bool,
    pub duration: Option<i32>,
    pub thumbnail_url: Option<String>,
    pub views_count: Option<i32>,
    pub status: MediaStatus,
    pub uploaded_by: i32,
    pub created_at: NaiveDate,
    pub updated_at: NaiveDate,
    pub series_order: Option<i32>,
}

/// Search request parameters for media
#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct SearchMediaRequest {
    pub query: String,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

// ===== Media CRUD Operations =====

/// Creates a new media entry
pub async fn create_media(pool: web::Data<PgPool>, media: web::Json<Media>) -> impl Responder {
    let media_repository = MediaRepository::new(pool.get_ref().clone());
    match media_repository.create_media(&media).await {
        Ok(media) => HttpResponse::Created().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

/// Updates an existing media entry
pub async fn update_media(pool: web::Data<PgPool>, id: web::Path<i32>, request: web::Json<MediaUpdateRequest>) -> impl Responder {
    let media_repository = MediaRepository::new(pool.get_ref().clone());
    match media_repository.update_media(id.into_inner(), &request).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

/// Deletes a media entry
pub async fn delete_media(pool: web::Data<PgPool>, id: web::Path<i32>) -> impl Responder {
    let media_repository = MediaRepository::new(pool.get_ref().clone());
    match media_repository.delete_media(id.into_inner()).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

// ===== Media Retrieval Operations =====

/// Retrieves a single media entry by ID
pub async fn get_media(pool: web::Data<PgPool>, id: web::Path<i32>) -> impl Responder {
    let media_repository = MediaRepository::new(pool.get_ref().clone());
    match media_repository.get_media(id.into_inner()).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::NotFound().json(e.to_string()),
    }
}

/// Retrieves all media entries
pub async fn get_all_media(pool: web::Data<PgPool>) -> impl Responder {
    let media_repository = MediaRepository::new(pool.get_ref().clone());
    match media_repository.get_all_media().await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

/// Searches media based on query parameters
pub async fn search_media(pool: web::Data<PgPool>, request: web::Query<SearchMediaRequest>) -> impl Responder {
    let media_repository = MediaRepository::new(pool.get_ref().clone());
    match media_repository.search_media(request.query.clone()).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

// ===== Watch History Operations =====

/// Retrieves watch history for a specific user
pub async fn get_user_watch_history(pool: web::Data<PgPool>, user_id: web::Path<i32>) -> impl Responder {
    let watch_history_repository = WatchHistoryRepository::new(pool.get_ref().clone());
    match watch_history_repository.get_user_watch_history(user_id.into_inner()).await {
        Ok(history) => HttpResponse::Ok().json(history),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

/// Updates watch progress for a user's media
pub async fn update_user_watch_history(
    pool: web::Data<PgPool>,
    user_id: web::Path<i32>,
    media_id: web::Path<i32>,
    watch_history: web::Json<UpdateWatchProgressRequest>
) -> impl Responder {
    let watch_history_repository = WatchHistoryRepository::new(pool.get_ref().clone());
    match watch_history_repository.update_watch_progress(
        user_id.into_inner(),
        media_id.into_inner(),
        watch_history.into_inner()
    ).await {
        Ok(history) => HttpResponse::Ok().json(history),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

/// Deletes watch history for a user (optionally for specific media)
pub async fn delete_user_watch_history(
    pool: web::Data<PgPool>,
    user_id: web::Path<i32>,
    media_id: Option<web::Path<i32>>
) -> impl Responder {
    let watch_history_repository = WatchHistoryRepository::new(pool.get_ref().clone()       );
    match watch_history_repository.delete_watch_history(user_id.into_inner(), media_id.map(|id| id.into_inner())).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

// ===== Data Conversion =====

/// Converts Media model to MediaResponse
impl From<Media> for MediaResponse {
    fn from(media: Media) -> Self {
        MediaResponse {
            id: media.id,
            title: media.title,
            description: media.description,
            file_url: media.file_url,
            media_type: media.media_type,
            youtube_id: media.youtube_id,
            is_live: media.is_live,
            duration: media.duration,
            thumbnail_url: media.thumbnail_url,
            views_count: media.views_count,
            status: media.status,
            uploaded_by: media.uploaded_by,
            created_at: media.created_at.date(),
            updated_at: media.updated_at.date(),
            series_order: media.series_order,
        }
    }
}

