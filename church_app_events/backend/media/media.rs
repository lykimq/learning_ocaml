use chrono::{NaiveDate};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool, Row};
use crate::media::error::AppError;
use crate::media::watch_history_repository::WatchHistoryRepository;
use crate::media::watch_history::WatchHistory;
use crate::media::models::{Media, MediaType, MediaStatus};
use crate::media::media_repository::MediaRepository;


#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct MediaUpdateRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub is_live: Option<bool>,
    pub duration: Option<i32>,
    pub thumbnail_url: Option<String>,
    pub views_count: Option<i32>,
    pub status: Option<MediaStatus>,
    pub uploaded_by: Option<i32>,
    pub youtube_id: Option<String>,
    pub media_type: Option<MediaType>,
    pub file_url: Option<String>,
    pub series_order: Option<i32>,
}

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

pub async fn create_media(pool: &PgPool, media: &Media) -> Result<Media, AppError> {
    let media_repository = MediaRepository::new(pool);
    media_repository.create_media(media).await
}

pub async fn update_media(pool: &PgPool, id: i32, media: &MediaUpdateRequest) -> Result<Media, AppError> {
    let media_repository = MediaRepository::new(pool);
    media_repository.update_media(id, media).await
}

pub async fn delete_media(pool: &PgPool, id: i32) -> Result<(), AppError> {
    let media_repository = MediaRepository::new(pool);
    media_repository.delete_media(id).await
}

pub async fn get_media(pool: &PgPool, id: i32) -> Result<Media, AppError> {
    let media_repository = MediaRepository::new(pool);
    media_repository.get_media(id).await
}

pub async fn get_all_media(pool: &PgPool) -> Result<Vec<Media>, AppError> {
    let media_repository = MediaRepository::new(pool);
    media_repository.get_all_media().await
}

pub async fn check_live_stream(pool: &PgPool, video_id: &str) -> Result<YouTubeItem, AppError> {
    let youtube_service = YouTubeService::new(pool);
    youtube_service.check_live_stream(video_id).await
}

pub async fn get_user_watch_history(pool: &PgPool, user_id: i32) -> Result<Vec<WatchHistory>, AppError> {
    let watch_history_repository = WatchHistoryRepository::new(pool);
    watch_history_repository.get_user_watch_history(user_id).await
}

pub async fn update_user_watch_history(pool: &PgPool, user_id: i32, watch_history: &WatchHistoryUpdateRequest) -> Result<WatchHistory, AppError> {
    let watch_history_repository = WatchHistoryRepository::new(pool);
    watch_history_repository.update_user_watch_history(user_id, watch_history).await
}

pub async fn delete_user_watch_history(pool: &PgPool, user_id: i32, media_id: i32) -> Result<(), AppError> {
    let watch_history_repository = WatchHistoryRepository::new(pool);
    watch_history_repository.delete_user_watch_history(user_id, media_id).await
}

#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct SearchMediaRequest {
    pub query: String,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

pub async fn search_media(pool: &PgPool, request: &SearchMediaRequest) -> Result<Vec<Media>, AppError> {
    let media_repository = MediaRepository::new(pool);
    media_repository.search_media(request).await
}
