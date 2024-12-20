use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::media::error::AppError;
use chrono::{DateTime, Utc};
use actix_web::{HttpResponse, Responder};
use std::time::Duration;
use std::sync::Arc;
use crate::media::rate_limiter::RateLimiter;
use crate::media::cache::Cache;
use serde_json::json;

/// Response structure for YouTube API requests containing a list of items and pagination token
#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeResponse {
    pub items: Vec<YouTubeItem>,
    pub next_page_token: Option<String>,
}

/// Represents a single YouTube resource item (video, playlist, etc.)
#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeItem {
    pub id: YouTubeId,
    pub snippet: YouTubeSnippet,
}

/// YouTube resource identifier

#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeId {
    pub video_id: String,
}

/// Thumbnail information for a YouTube resource
#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeThumbnails {
    pub default: YouTubeThumbnail,
}

/// YouTube resource snippet containing metadata
#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeSnippet {
    pub title: String,
    pub description: String,
    pub thumbnails: YouTubeThumbnails,
}

/// YouTube thumbnail information
#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeThumbnail {
    pub url: String,
}

/// YouTube service struct containing client, API key, channel ID, rate limiter, and cache
#[derive(Clone)]
pub struct YouTubeService {
    client: Client,
    api_key: String,
    channel_id: String,
    rate_limiter: Arc<RateLimiter>,
    cache: Arc<Cache>,
}


#[derive(Debug, Deserialize, Serialize)]
pub struct YoutubeSnippet {
    pub title: String,
    pub description: String,
    pub thumbnails: YouTubeThumbnails,
    pub published_at: DateTime<Utc>,
    pub live_broadcast_content: String, // "live" or "upcoming" or "none"
}


#[derive(Debug, Deserialize, Serialize)]
pub struct ChannelVideosResponse {
    pub videos: Vec<YouTubeItem>,
    pub next_page_token: Option<String>,
}


impl YouTubeService {
    // === Initialization ===

    /// Creates a new YouTubeService instance
    pub fn new(api_key: String,
        channel_id: String,
        rate_limiter: Arc<RateLimiter>,
        cache: Arc<Cache>) -> Self {
        Self {
            client: Client::new(),
            api_key,
            channel_id,
            rate_limiter,
            cache,
        }
    }

    // === Core Video Fetching Methods ===

    /// Fetches all videos from a YouTube channel with pagination support
    pub async fn fetch_all_videos(&self, page_token: Option<String>) -> Result<ChannelVideosResponse, AppError> {
        let url = format!(
            "https://www.googleapis.com/youtube/v3/search?channelId={}&key={}&part=snippet&order=date&maxResults=50&type=video{}",
            self.channel_id,
            self.api_key,
            page_token.map_or(String::new(), |token| format!("&pageToken={}", token))
        );

        let response = self.client.get(url)
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(e.to_string().into()))?;

        let videos = response.json::<YouTubeResponse>()
            .await
            .map_err(|e| AppError::ParseError(e.to_string().into()))?;

        Ok(ChannelVideosResponse {
            videos: videos.items,
            next_page_token: videos.next_page_token // Use the token from response
        })
    }

    /// Fetches current live streams from the channel
    pub async fn get_all_live_streams(&self) -> Result<Vec<YouTubeItem>, AppError> {
        let url = format!(
            "https://www.googleapis.com/youtube/v3/search?channelId={}&key={}&part=snippet&order=date&maxResults=50&type=video&eventType=live",
            self.channel_id,
            self.api_key
        );

        let response = self.client.get(url)
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(e.to_string().into()))?;

        let live_streams: YouTubeResponse = response.json()
            .await
            .map_err(|e| AppError::ParseError(e.to_string().into()))?;

        Ok(live_streams.items)
    }

    // === HTTP Endpoint Handlers ===

    /// HTTP endpoint for fetching channel videos with caching and rate limiting
    pub async fn get_channel_videos(&self, page_token: Option<String>) -> impl Responder {

        // Check rate limit
        let rate_limit_key = format!("rate_limit:{}", self.channel_id);
        if !self.rate_limiter.check_rate_limit(&rate_limit_key).await.unwrap_or(false) {
            return HttpResponse::TooManyRequests().json("Rate limit exceeded");
        }

        // Try cache first
        let cache_key = format!("youtube_videos:{}:{}",
            self.channel_id, page_token.as_deref().unwrap_or_default());
        if let Ok(Some(cached_data)) =
        self.cache.get::<ChannelVideosResponse>(&cache_key).await {
            return HttpResponse::Ok().json(cached_data);
        }

        // Fetch videos using the reusable function
        match self.fetch_all_videos(page_token.clone()).await {
            Ok(response) => {
                // Cache the response for 5 minutes
                if let Err(e) = self.cache.set(&cache_key, &response, Duration::from_secs(300)).await {
                    eprintln!("Failed to cache YouTube response: {}", e);
                }
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                eprintln!("Failed to fetch YouTube videos: {}", e);
                HttpResponse::InternalServerError().json("Failed to fetch videos from YouTube")
            }
        }
    }

    /// HTTP endpoint for fetching live streams
    pub async fn get_all_live_streams_handler(&self) -> impl Responder {
        match self.get_all_live_streams().await {
            Ok(live_streams) => HttpResponse::Ok().json(live_streams),
            Err(_) => HttpResponse::InternalServerError().json("Failed to fetch live streams from YouTube")
        }
    }

    /// HTTP endpoint for fetching upcoming live streams and premieres
    pub async fn get_upcoming_live_streams(&self) -> impl Responder {
        let url = format!("https://www.googleapis.com/youtube/v3/search?channelId={}&key={}&part=snippet&order=date&maxResults=50&type=video&eventType=upcoming",
        self.channel_id,
        self.api_key);

        match self.client.get(url).send().await {
            Ok(response) => {
                let upcoming_streams: YouTubeResponse = match response.json().await {
                    Ok(streams) => streams,
                    Err(_) => return HttpResponse::InternalServerError().json("Failed to fetch upcoming streams from YouTube")
                };

                HttpResponse::Ok().json(upcoming_streams.items)
            }
            Err(_) => HttpResponse::InternalServerError().json("Failed to fetch upcoming streams from YouTube")
        }
    }

    // === Channel Management Methods ===

    /// Validates and extracts YouTube channel ID
    pub async fn validate_channel_id(&self, channel_id_or_url: &str) -> HttpResponse {
        let url = format!("https://www.googleapis.com/youtube/v3/channels?part=id&id={}&key={}", channel_id_or_url, self.api_key);

        match self.client.get(url).send().await {
            Ok(response) => {
                let channel_info: YouTubeResponse = match response.json().await {
                    Ok(info) => info,
                    Err(_) => return HttpResponse::InternalServerError().json("Failed to fetch channel information from YouTube")
                };

                HttpResponse::Ok().json(channel_info.items)
            }
            Err(_) => HttpResponse::InternalServerError().json("Failed to fetch channel information from YouTube")
        }
    }

    /// Resolves custom YouTube URLs to channel IDs
    pub async fn resolve_custom_url(&self, custom_url: &str) -> HttpResponse {
        let username = match custom_url.split('/').last() {
            Some(username) => username,
            None => return HttpResponse::BadRequest().json("Invalid YouTube URL")
        };

        let url = format!(
            "https://www.googleapis.com/youtube/v3/channels?key={}&forUsername={}&part=id",
            self.api_key,
            username
        );

        match self.client.get(url).send().await {
            Ok(response) => {
                let channel_info: YouTubeResponse = match response.json().await {
                    Ok(info) => info,
                    Err(_) => return HttpResponse::InternalServerError().json("Failed to fetch channel information from YouTube")
                };

                HttpResponse::Ok().json(channel_info.items)
            }
            Err(_) => HttpResponse::InternalServerError().json("Failed to fetch channel information from YouTube")
        }
    }

    // === Background Tasks and Sync ===

    /// Starts background synchronization task
    pub async fn start_background_sync_handler(&self) -> impl Responder {
        let self_clone = self.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(3600));// 1 hour
            loop {
                interval.tick().await;
                if let Err(e) = self_clone.sync_channel_data().await {
                    eprintln!("Background sync failed to fetch videos from YouTube: {}", e);
                }
            }
        });

        HttpResponse::Ok().json(json!({
            "status": "success",
            "message": "Background sync started successfully"
        }))
    }


    /// Synchronizes channel data (videos and live streams)
    async fn sync_channel_data(&self) -> Result<(), AppError> {
        // Fetch and update videos
        let videos = self.fetch_all_videos(None).await
        .map_err(|e| AppError::ExternalApiError(e.to_string().into()))?;

        // update cache
        self.cache.set(&format!("youtube_videos:{}", self.channel_id),
        &videos,
        Duration::from_secs(300)).await
        .map_err(|e| AppError::CacheError(e.to_string().into()))?;

        // Fetch and update live streams
        let live_streams = self.get_all_live_streams().await
        .map_err(|e| AppError::ExternalApiError(e.to_string().into()))?;
        self.cache.set(&format!("youtube_live_streams:{}", self.channel_id),
        &live_streams,
        Duration::from_secs(300)).await
        .map_err(|e| AppError::CacheError(e.to_string().into()))?;

        Ok(())
    }

    // HTTP endpoint to manually trigger a sync
    pub async fn trigger_sync(&self) -> impl Responder {
        if let Err(e) = self.sync_channel_data().await {
            eprintln!("Failed to trigger sync: {}", e);
            HttpResponse::InternalServerError().json("Failed to trigger sync")
        } else {
            HttpResponse::Ok().json("Sync triggered")
        }
    }

    // Get sync status and last sync time
    pub async fn get_sync_status(&self) -> impl Responder {
        let cache_key = format!("youtube_sync_status:{}", self.channel_id);

        match self.cache.get::<DateTime<Utc>>(&cache_key).await {
            Ok(Some(last_sync)) => HttpResponse::Ok().json(json!({
                "status": "success",
                "last_sync": last_sync.to_rfc3339(),
                "next_sync": (last_sync + chrono::Duration::hours(1)).to_rfc3339()
            })),
            _ => HttpResponse::Ok().json(json!({
                "status": "error",
                "message": "No sync status available",
                "last_sync": null,
                "next_sync": null
            }))
        }
    }
}

