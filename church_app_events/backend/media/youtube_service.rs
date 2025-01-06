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
use lazy_static::lazy_static;
use std::sync::Mutex;

#[derive(Debug, Deserialize, Serialize)]
pub struct PageInfo {
    pub total_results: u64,
    pub results_per_page: u64,
}

/// Response structure for YouTube API requests containing a list of items and pagination token
#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeResponse {
    pub kind: String,
    pub etag: String,
    pub page_info: PageInfo,
    pub items: Vec<YouTubeItem>,
    pub next_page_token: Option<String>,
}


#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeChannel {
    pub kind: String,
    pub etag: String,
    pub id: String,
    pub snippet: ChannelSnippet,
}


#[derive(Debug, Deserialize, Serialize)]
pub struct ChannelSnippet {
    pub title: String,
    pub description: String,
    pub custom_url: Option<String>,
    pub published_at: String,
    pub thumbnails: Thumbnails,
    pub localized: Option<Localized>,
    pub country: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Thumbnails {
    pub default: Thumbnail,
    pub medium: Thumbnail,
    pub high: Thumbnail,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Thumbnail {
    pub url: String,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Localized {
    pub title: String,
    pub description: String,
}

/// Represents a single YouTube resource item (video, playlist, etc.)
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct YouTubeItem {
    pub kind: String,
    pub etag: String,
    pub id: YouTubeId,
    pub snippet: YouTubeSnippet,
}

/// YouTube resource identifier

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct YouTubeId {
    #[serde(rename = "videoId")]
    pub video_id: String,
    pub kind: Option<String>,
}

/// Thumbnail information for a YouTube resource
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct YouTubeThumbnails {
    pub default: YouTubeThumbnail,
}

/// YouTube resource snippet containing metadata
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct YouTubeSnippet {
    pub title: String,
    pub description: String,
    pub thumbnails: YouTubeThumbnails,
}

/// YouTube thumbnail information
#[derive(Debug, Deserialize, Serialize, Clone)]
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

#[derive(Debug, Deserialize, Serialize)]
pub struct YouTubeChannelResponse {
    pub kind: String,
    pub etag: String,
    pub page_info: PageInfo,
    pub items: Vec<YouTubeChannel>,
}

lazy_static! {
    static ref YOUTUBE_SERVICE: Mutex<Option<YouTubeService>> = Mutex::new(None);
}

impl YouTubeService {
    /// Creates or returns the existing YouTubeService instance
    pub fn get_instance(
        api_key: String,
        channel_id: String,
        rate_limiter: Arc<RateLimiter>,
        cache: Arc<Cache>
    ) -> Self {
        let mut service = YOUTUBE_SERVICE.lock().unwrap();

        if service.is_none() {
            println!("Creating new YouTube service instance");
            *service = Some(Self {
                client: Client::new(),
                api_key,
                channel_id,
                rate_limiter,
                cache,
            });
        }

        service.as_ref().unwrap().clone()
    }

    // Remove the new() function or make it private
    fn new(
        api_key: String,
        channel_id: String,
        rate_limiter: Arc<RateLimiter>,
        cache: Arc<Cache>
    ) -> Self {
        println!("Initializing YouTube service with API key: {}", api_key);
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
                // Transform the videos into the expected format
                let transformed_videos: Vec<serde_json::Value> = response.videos.clone()
                    .into_iter()
                    .map(|video| {
                        json!({
                            "youtube_id": video.id.video_id,
                            "title": video.snippet.title,
                            "description": video.snippet.description,
                            "thumbnail_url": video.snippet.thumbnails.default.url,
                            "duration": null
                        })
                    })
                    .collect();

                // Cache the response
                if let Err(e) = self.cache.set(&cache_key, &response, Duration::from_secs(300)).await {
                    eprintln!("Failed to cache YouTube response: {}", e);
                }

                HttpResponse::Ok().json(transformed_videos)
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
    pub async fn validate_channel_id(&self, channel_id: &str) -> HttpResponse {
        println!("=== Starting Channel ID Validation ===");
        println!("Channel ID to validate: {}", channel_id);
        println!("Using API key: {}", self.api_key);

        if !channel_id.starts_with("UC") {
            let error_msg = format!("Invalid channel ID format: {}", channel_id);
            println!("{}", error_msg);
            return HttpResponse::BadRequest().json(json!({
                "error": error_msg
            }));
        }

        let url = format!(
            "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&id={}&key={}",
            channel_id,
            self.api_key
        );

        println!("Making request to YouTube API...");

        match self.client.get(&url).send().await {
            Ok(response) => {
                println!("Response status: {}", response.status());

                if !response.status().is_success() {
                    let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                    println!("YouTube API error: {}", error_text);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "YouTube API error",
                        "details": error_text
                    }));
                }

                let response_text = response.text().await.unwrap_or_default();
                println!("Response body: {}", response_text);

                match serde_json::from_str::<YouTubeChannelResponse>(&response_text) {
                    Ok(channel_info) => {
                        if channel_info.items.is_empty() {
                            println!("No channel found");
                            return HttpResponse::NotFound().json(json!({
                                "error": "Channel not found"
                            }));
                        }

                        println!("Channel validation successful");
                        HttpResponse::Ok().json(json!({
                            "status": "success",
                            "channel": channel_info.items[0]
                        }))
                    }
                    Err(e) => {
                        println!("Failed to parse response: {}", e);
                        HttpResponse::InternalServerError().json(json!({
                            "error": "Failed to parse YouTube API response",
                            "details": e.to_string(),
                            "response": response_text
                        }))
                    }
                }
            }
            Err(e) => {
                println!("Request failed: {}", e);
                HttpResponse::InternalServerError().json(json!({
                    "error": "Failed to contact YouTube API",
                    "details": e.to_string()
                }))
            }
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
