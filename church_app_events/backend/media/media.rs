use chrono::{NaiveDate};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use crate::media::models::{Media, MediaType, MediaStatus};
use crate::media::media_repository::MediaRepository;
use crate::media::models::MediaUpdateRequest;
use crate::media::watch_history_repository::UpdateWatchProgressRequest;
use actix_web::{web, HttpResponse, Responder};
use crate::media::watch_history_repository::WatchHistoryRepository;


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


pub async fn create_media(pool: PgPool, media: &Media) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.create_media(media).await {
        Ok(media) => HttpResponse::Created().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn update_media(pool: PgPool, id: i32, request: &MediaUpdateRequest) -> impl Responder {
    let media_repository = MediaRepository::new(pool);

    match media_repository.update_media(id, request).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn delete_media(pool: PgPool, id: i32) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.delete_media(id).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn get_media(pool: PgPool, id: i32) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.get_media(id).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::NotFound().json(e.to_string()),
    }
}

pub async fn get_all_media(pool: PgPool) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.get_all_media().await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

/*
pub async fn check_live_stream(
    pool: &PgPool,
    video_id: &str,
    api_key: String,
    channel_id: String,
    rate_limiter: Arc<RateLimiter>,
    cache: Arc<Cache>
) -> impl Responder {
    let youtube_service = YouTubeService::new(
        api_key,
        channel_id,
        rate_limiter,
        cache
    );

    match youtube_service.check_live_stream(video_id).await {
        Ok(is_live) => HttpResponse::Ok().json(is_live),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}*/

pub async fn get_user_watch_history(pool: PgPool, user_id: i32) -> impl Responder {
    let watch_history_repository = WatchHistoryRepository::new(pool);
    match watch_history_repository.get_user_watch_history(user_id).await {
        Ok(history) => HttpResponse::Ok().json(history),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn update_user_watch_history(pool: PgPool,
    user_id: i32,
    media_id: i32,
    watch_history: UpdateWatchProgressRequest) -> impl Responder {
    let watch_history_repository = WatchHistoryRepository::new(pool);
    match watch_history_repository.update_watch_progress(
        user_id,
        media_id,
        watch_history
    ).await {
        Ok(history) => HttpResponse::Ok().json(history),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn delete_user_watch_history(pool: PgPool, user_id: i32, media_id: Option<i32>) -> impl Responder {
    let watch_history_repository = WatchHistoryRepository::new(pool);
    match watch_history_repository.delete_watch_history(user_id, media_id).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct SearchMediaRequest {
    pub query: String,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

pub async fn search_media(pool: PgPool, request: &SearchMediaRequest) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.search_media(request.query.clone()).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}


/*
pub async fn increment_views(pool: PgPool, id: i32) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.increment_views(id).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn get_media_by_type(pool: &PgPool, media_type: MediaType) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.get_media_by_type(media_type).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn get_user_media(pool: &PgPool, user_id: i32) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.get_user_media(user_id).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn update_media_status(pool: &PgPool, id: i32, status: MediaStatus) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.update_media_status(id, status).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn get_series_media(pool: &PgPool) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.get_series_media().await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn get_latest_media(pool: &PgPool, limit: i32) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
    match media_repository.get_latest_media(limit).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

pub async fn get_popular_media(pool: &PgPool, limit: i32) -> impl Responder {
    let media_repository = MediaRepository::new(pool);
        match media_repository.get_popular_media(limit).await {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}
*/

// Convert Media to MediaResponse
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

