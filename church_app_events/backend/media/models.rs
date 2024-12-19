use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "media_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Youtube,
    Mp4,
    LiveStream,
    Postcast,
    Audio,
}

impl std::fmt::Display for MediaType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MediaType::Youtube => write!(f, "youtube"),
            MediaType::Mp4 => write!(f, "mp4"),
            MediaType::LiveStream => write!(f, "live_stream"),
            MediaType::Postcast => write!(f, "postcast"),
            MediaType::Audio => write!(f, "audio"),
        }
    }
}

impl std::str::FromStr for MediaType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "youtube" => Ok(MediaType::Youtube),
            "mp4" => Ok(MediaType::Mp4),
            "live_stream" => Ok(MediaType::LiveStream),
            "postcast" => Ok(MediaType::Postcast),
            "audio" => Ok(MediaType::Audio),
            _ => Err(format!("Invalid media type: {}", s)),
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum MediaStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

impl std::fmt::Display for MediaStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MediaStatus::Pending => write!(f, "pending"),
            MediaStatus::Processing => write!(f, "processing"),
            MediaStatus::Completed => write!(f, "completed"),
            MediaStatus::Failed => write!(f, "failed"),
        }
    }
}

impl std::str::FromStr for MediaStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "pending" => Ok(MediaStatus::Pending),
            "processing" => Ok(MediaStatus::Processing),
            "completed" => Ok(MediaStatus::Completed),
            "failed" => Ok(MediaStatus::Failed),
            _ => Err(format!("Invalid media status: {}", s)),
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct Media {
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
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub series_order: Option<i32>,
}

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
