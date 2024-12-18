use actix_web::{HttpResponse, Responder, ResponseError};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{FromRow, PgPool};


use crate::{
    media::error::AppError,
    media::watch_history::WatchHistory,
    media::models::{Media, MediaStatus, MediaType},
};

/// Request structure for updating watch progress
#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct UpdateWatchProgressRequest {
    pub watched_duration: i32,
    pub completed: bool,
    pub last_watched_at: NaiveDateTime,
}

/// Response structure for watch history data
#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct WatchHistoryResponse {
    pub watch_history: WatchHistory,
    pub total_watched_time: i32,
    pub total_watched_videos: i32,
    pub total_watched_minutes: i32,
    pub total_watched_hours: i32,
    pub total_watched_days: i32,
    pub total_watched_weeks: i32,
    pub total_watched_months: i32,
    pub total_watched_years: i32,
    pub total_completed: i32,
}

/// Structure combining watch history with media details
#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct WatchHistoryWithMedia {
    pub id: i32,
    pub user_id: i32,
    pub media_id: i32,
    pub watched_duration: i32,
    pub completed: bool,
    pub last_watched_at: NaiveDateTime,
    pub title: String,
    pub description: Option<String>,
    pub media_type: MediaType,
    pub status: MediaStatus,
    pub file_url: String,
    pub duration: i32,
}

/// Repository for handling watch history operations in the database
pub struct WatchHistoryRepository {
    pool: PgPool,
}

impl WatchHistoryRepository {
    /// Creates a new instance of WatchHistoryRepository
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // CRUD Operations
    //--------------

    /// Updates or creates a watch progress entry for a specific media item
    /// Handles completion status based on watch duration (90% threshold)
    pub async fn update_watch_progress(
        &self,
        user_id: i32,
        media_id: i32,
        request: UpdateWatchProgressRequest,
    ) -> impl Responder {
        // Validate input parameters
        if request.watched_duration < 0 {
            return AppError::bad_request("Watch duration cannot be negative").error_response();
        }

        // First verify media exists and get its duration
        let media_result = sqlx::query!(
            r#"
            SELECT duration, status
            FROM media
            WHERE id = $1 AND status != 'deleted'
            "#,
            media_id
        )
        .fetch_optional(&self.pool)
        .await;

        match media_result {
            Ok(Some(media)) => {
                // Calculate completion status
                let completed = if let Some(duration) = media.duration {
                    request.watched_duration >= duration * 90 / 100
                } else {
                    request.completed
                };

                // Begin transaction
                let mut tx = match self.pool.begin().await {
                    Ok(tx) => tx,
                    Err(e) => {
                        eprintln!("Failed to start transaction: {}", e);
                        return AppError::database_error(e.to_string()).error_response();
                    }
                };

                // Update watch history
                let watch_history_result = sqlx::query_as!(
                    WatchHistory,
                    r#"
                    INSERT INTO watch_history
                        (user_id, media_id, watched_duration, completed, last_watched_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (user_id, media_id) DO UPDATE SET
                        watched_duration = GREATEST(watch_history.watched_duration, EXCLUDED.watched_duration),
                        completed = EXCLUDED.completed,
                        last_watched_at = EXCLUDED.last_watched_at
                    RETURNING
                        id as "id!: i32",
                        user_id as "user_id!: i32",
                        media_id as "media_id!: i32",
                        watched_duration as "watched_duration!: i32",
                        completed as "completed!: bool",
                        last_watched_at as "last_watched_at!: NaiveDateTime"
                    "#,
                    user_id,
                    media_id,
                    request.watched_duration,
                    completed,
                    request.last_watched_at
                )
                .fetch_one(&mut tx)
                .await;

                match watch_history_result {
                    Ok(watch_history) => {
                        // Commit transaction
                        if let Err(e) = tx.commit().await {
                            eprintln!("Failed to commit transaction: {}", e);
                            return AppError::database_error(e.to_string()).error_response();
                        }
                        HttpResponse::Ok().json(watch_history)
                    }
                    Err(e) => {
                        eprintln!("Database error: {}", e);
                        AppError::database_error(e.to_string()).error_response()
                    }
                }
            }
            Ok(None) => {
                eprintln!("Media not found or deleted: {}", media_id);
                AppError::not_found("Media not found or has been deleted").error_response()
            }
            Err(e) => {
                eprintln!("Database error while checking media: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }

    /// Deletes watch history entries for a user
    /// If media_id is provided, only deletes that specific entry
    pub async fn delete_watch_history(
        &self,
        user_id: i32,
        media_id: Option<i32>,
    ) -> impl Responder {
        let result = sqlx::query!(
            r#"
            WITH deleted AS (
                DELETE FROM watch_history
                WHERE user_id = $1 AND ($2::int IS NULL OR media_id = $2)
                RETURNING 1
            )
            SELECT EXISTS (SELECT 1 FROM deleted) as "exists!"
            "#,
            user_id,
            media_id
        )
        .fetch_one(&self.pool)
        .await;

        match result {
            Ok(record) => {
                if record.exists {
                    HttpResponse::Ok().json("Watch history deleted successfully")
                } else {
                    AppError::not_found("No watch history found to delete").error_response()
                }
            }
            Err(e) => {
                eprintln!("Failed to delete watch history: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }

    /// Removes watch history entries older than the specified date
    pub async fn cleanup_old_watch_history(
        &self,
        user_id: i32,
        older_than: NaiveDateTime,
    ) -> impl Responder {
        match sqlx::query!(
            "DELETE FROM watch_history
            WHERE user_id = $1
            AND last_watched_at < $2",
            user_id,
            older_than
        )
        .execute(&self.pool)
        .await
        {
            Ok(deleted) => HttpResponse::Ok()
                .json(format!("Deleted {} watch history entries", deleted.rows_affected())),
            Err(e) => {
                eprintln!("Failed to cleanup history: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }

    // Query Operations
    //---------------

    /// Retrieves complete watch history for a user with aggregated statistics
    pub async fn get_user_watch_history(&self, user_id: i32) -> impl Responder {
        let result = sqlx::query_as!(
            WatchHistoryWithMedia,
            r#"
            SELECT
                wh.id as "id!",
                wh.user_id as "user_id!",
                wh.media_id as "media_id!",
                wh.watched_duration as "watched_duration!",
                wh.completed as "completed!",
                wh.last_watched_at as "last_watched_at!",
                m.title as "title!",
                m.description,
                m.media_type as "media_type!: MediaType",
                m.status as "status!: MediaStatus",
                m.file_url as "file_url!",
                m.duration as "duration!"
            FROM watch_history wh
            JOIN media m ON wh.media_id = m.id
            WHERE wh.user_id = $1
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await;

        match result {
            Ok(watch_history) => {
                if watch_history.is_empty() {
                    return HttpResponse::Ok().json(WatchHistoryResponse::default());
                }

                let total_watched_time: i32 = watch_history[0].watched_duration;

                let response = WatchHistoryResponse {
                    watch_history: WatchHistory {
                        id: watch_history[0].id,
                        user_id: watch_history[0].user_id,
                        media_id: watch_history[0].media_id,
                        watched_duration: watch_history[0].watched_duration,
                        completed: watch_history[0].completed,
                        last_watched_at: watch_history[0].last_watched_at,
                    },
                    total_watched_time,
                    total_watched_videos: watch_history.len() as i32,
                    total_watched_minutes: total_watched_time / 60,
                    total_watched_hours: total_watched_time / 3600,
                    total_watched_days: total_watched_time / (3600 * 24),
                    total_watched_weeks: total_watched_time / (3600 * 24 * 7),
                    total_watched_months: total_watched_time / (3600 * 24 * 30),
                    total_watched_years: total_watched_time / (3600 * 24 * 365),
                    total_completed: watch_history.iter().filter(|w| w.completed).count() as i32,
                };

                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                eprintln!("Failed to fetch watch history: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }

    /// Gets the most recent watch history entries with pagination
    pub async fn get_recent_watch_history(
        &self,
        user_id: i32,
        limit: i32,
        offset: i64,
    ) -> impl Responder {
        if limit <= 0 || limit > 100 {
            return AppError::bad_request("Limit must be between 1 and 100").error_response();
        }

        if offset < 0 {
            return AppError::bad_request("Offset cannot be negative").error_response();
        }

        let result = sqlx::query_as!(
            WatchHistoryWithMedia,
            r#"
            SELECT
                wh.id as "id!",
                wh.user_id as "user_id!",
                wh.media_id as "media_id!",
                wh.watched_duration as "watched_duration!",
                wh.completed as "completed!",
                wh.last_watched_at as "last_watched_at!",
                m.title as "title!",
                m.description,
                m.media_type as "media_type!: MediaType",
                m.status as "status!: MediaStatus",
                m.file_url as "file_url!",
                m.duration as "duration!"
            FROM watch_history wh
            JOIN media m ON wh.media_id = m.id
            WHERE wh.user_id = $1
                AND m.status != 'deleted'
            ORDER BY wh.last_watched_at DESC
            LIMIT $2 OFFSET $3
            "#,
            user_id,
            limit as i64,
            offset
        )
        .fetch_all(&self.pool)
        .await;

        match result {
            Ok(history) => {
                if history.is_empty() && offset == 0 {
                    return HttpResponse::Ok().json(Vec::<WatchHistoryWithMedia>::new());
                }
                if history.is_empty() {
                    return AppError::not_found("No more watch history entries").error_response();
                }
                HttpResponse::Ok().json(history)
            }
            Err(e) => {
                eprintln!("Failed to fetch recent watch history: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }

    /// Retrieves watch progress for a specific media item
    pub async fn get_media_watch_progress(
        &self,
        user_id: i32,
        media_id: i32,
    ) -> impl Responder {
        let result = sqlx::query_as!(
            WatchHistoryWithMedia,
            r#"
            SELECT
                wh.id as "id!",
                wh.user_id as "user_id!",
                wh.media_id as "media_id!",
                wh.watched_duration as "watched_duration!",
                wh.completed as "completed!",
                wh.last_watched_at as "last_watched_at!",
                m.title as "title!",
                m.description,
                m.media_type as "media_type!: MediaType",
                m.status as "status!: MediaStatus",
                m.file_url as "file_url!",
                m.duration as "duration!" /* no comma here */
            FROM watch_history wh
            JOIN media m ON wh.media_id = m.id
            WHERE wh.user_id = $1
                AND wh.media_id = $2
                AND m.status != 'deleted'
            "#,
            user_id,
            media_id
        )
        .fetch_optional(&self.pool)
        .await;

        match result {
            Ok(Some(progress)) => HttpResponse::Ok().json(progress),
            Ok(None) => AppError::not_found("No watch history found for this media").error_response(),
            Err(e) => {
                eprintln!("Failed to fetch media watch progress: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }

    // Analytics Operations
    //------------------

    /// Gets watch history statistics for a specific time period
    /// Includes total watch time, completed videos, etc.
    pub async fn get_watch_history_stats(
        &self,
        user_id: i32,
        start_date: NaiveDateTime,
        end_date: NaiveDateTime,
    ) -> impl Responder {
        if start_date >= end_date {
            return AppError::bad_request("Start date must be before end date").error_response();
        }

        let result = sqlx::query!(
            r#"
            SELECT
                COUNT(*) as total_watched_videos,
                SUM(watched_duration) as total_duration,
                COUNT(CASE WHEN completed THEN 1 END) as completed_videos
            FROM watch_history
            WHERE user_id = $1
            AND last_watched_at BETWEEN $2 AND $3
            "#,
            user_id,
            start_date,
            end_date
        )
        .fetch_one(&self.pool)
        .await;

        match result {
            Ok(stats) => {
                let total_duration = stats.total_duration.unwrap_or(0);
                let response = WatchHistoryResponse {
                    watch_history: WatchHistory::default(),
                    total_watched_time: total_duration as i32,
                    total_watched_videos: stats.total_watched_videos.unwrap_or(0) as i32,
                    total_watched_minutes: total_duration as i32 / 60,
                    total_watched_hours: total_duration as i32 / 3600,
                    total_watched_days: total_duration as i32 / (3600 * 24),
                    total_watched_weeks: total_duration as i32 / (3600 * 24 * 7),
                    total_watched_months: total_duration as i32 / (3600 * 24 * 30),
                    total_watched_years: total_duration as i32 / (3600 * 24 * 365),
                    total_completed: stats.completed_videos.unwrap_or(0) as i32,
                };

                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                eprintln!("Failed to fetch watch history stats: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }

    /// Retrieves summary statistics of user's watch history
    /// Includes total videos, active days, average daily watch time
    pub async fn get_watch_history_summary(
        &self,
        user_id: i32,
    ) -> impl Responder {
        let result = sqlx::query!(
            r#"
            SELECT
                COUNT(*) as total_videos,
                SUM(watched_duration) as total_duration,
                COUNT(CASE WHEN completed THEN 1 END) as completed_videos,
                MAX(last_watched_at) as last_watched,
                COUNT(DISTINCT DATE(last_watched_at)) as active_days
            FROM watch_history
            WHERE user_id = $1
            "#,
            user_id
        )
        .fetch_one(&self.pool)
        .await;

        match result {
            Ok(summary) => {
                let response = json!({
                    "total_videos": summary.total_videos,
                    "total_duration": summary.total_duration.unwrap_or(0),
                    "completed_videos": summary.completed_videos,
                    "last_watched": summary.last_watched,
                    "active_days": summary.active_days,
                    "average_daily_watch": summary.total_duration.unwrap_or(0) /
                        std::cmp::max(summary.active_days.unwrap_or(1), 1)
                });
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                eprintln!("Failed to fetch watch history summary: {}", e);
                AppError::database_error(e.to_string()).error_response()
            }
        }
    }
}

// Implement Default for WatchHistoryResponse
impl Default for WatchHistoryResponse {
    fn default() -> Self {
        Self {
            watch_history: WatchHistory::default(),
            total_watched_time: 0,
            total_watched_videos: 0,
            total_watched_minutes: 0,
            total_watched_hours: 0,
            total_watched_days: 0,
            total_watched_weeks: 0,
            total_watched_months: 0,
            total_watched_years: 0,
            total_completed: 0,
        }
    }
}
