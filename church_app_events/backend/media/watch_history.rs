use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Represents a user's watch history entry for a media item
#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct WatchHistory {
    pub id: i32,                        // Unique identifier
    pub user_id: i32,                   // User who watched the media
    pub media_id: i32,                  // Media that was watched
    pub watched_duration: i32,          // Duration watched in seconds
    pub completed: bool,                // Whether the media was completed
    pub last_watched_at: NaiveDateTime, // Last watch timestamp
}

impl WatchHistory {
    // Constructor
    //------------

    /// Creates a new watch history instance with provided values
    pub fn new(
        id: i32,
        user_id: i32,
        media_id: i32,
        watched_duration: i32,
        completed: bool,
        last_watched_at: NaiveDateTime,
    ) -> Self {
        Self {
            id,
            user_id,
            media_id,
            watched_duration,
            completed,
            last_watched_at,
        }
    }

    // State Management
    //----------------

    /// Updates the watch progress and sets last_watched_at to current time
    pub fn update_progress(&mut self, watched_duration: i32, completed: bool) {
        self.watched_duration = watched_duration;
        self.completed = completed;
        self.last_watched_at = chrono::Utc::now().naive_utc();
    }

    /// Checks if the media has been marked as completed
    pub fn is_completed(&self) -> bool {
        self.completed
    }

    // Duration Calculations
    //--------------------

    /// Converts watch duration from seconds to minutes
    pub fn get_watch_duration_minutes(&self) -> i32 {
        self.watched_duration / 60
    }

    /// Converts watch duration from seconds to hours
    pub fn get_watch_duration_hours(&self) -> i32 {
        self.watched_duration / 3600
    }

    /// Calculates percentage of media watched
    /// Returns None if media_duration is invalid (0 or negative)
    pub fn get_watch_percentage(&self, media_duration: i32) -> Option<i32> {
        if media_duration <= 0 {
            return None;
        }
        Some((self.watched_duration as f32 / media_duration as f32 * 100.0) as i32)
    }

    /// Calculates remaining duration to watch
    /// Returns 0 if media is fully watched
    pub fn get_remaining_duration(&self, media_duration: i32) -> i32 {
        if media_duration <= self.watched_duration {
            return 0;
        }
        media_duration - self.watched_duration
    }

    // Time-based Queries
    //-----------------

    /// Checks if the watch history entry is from the last 24 hours
    pub fn is_recent(&self) -> bool {
        let now = chrono::Utc::now().naive_utc();
        let last_24h = now - chrono::Duration::hours(24);
        self.last_watched_at > last_24h
    }

    /// Calculates time elapsed since last watch
    pub fn time_since_last_watch(&self) -> chrono::Duration {
        let now = chrono::Utc::now().naive_utc();
        now - self.last_watched_at
    }

    // Formatting
    //----------

    /// Formats watch duration into human-readable string (e.g., "1h 30m 45s")
    pub fn format_watch_duration(&self) -> String {
        let hours = self.get_watch_duration_hours();
        let minutes = self.get_watch_duration_minutes() % 60;
        let seconds = self.watched_duration % 60;

        match (hours, minutes, seconds) {
            (0, 0, s) if s > 0 => format!("{}s", s),
            (0, m, s) if m > 0 => format!("{}m {}s", m, s),
            (h, m, s) if h > 0 => format!("{}h {}m {}s", h, m, s),
            _ => "0s".to_string(),
        }
    }
}

/// Default implementation for creating a new empty watch history
impl Default for WatchHistory {
    fn default() -> Self {
        Self {
            id: 0,
            user_id: 0,
            media_id: 0,
            watched_duration: 0,
            completed: false,
            last_watched_at: chrono::Utc::now().naive_utc(),
        }
    }
}
