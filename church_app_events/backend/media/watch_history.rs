use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Deserialize, Serialize, Clone, FromRow, PartialEq)]
pub struct WatchHistory {
    pub id: i32,
    pub user_id: i32,
    pub media_id: i32,
    pub watched_duration: i32,
    pub completed: bool,
    pub last_watched_at: NaiveDateTime,
}

impl WatchHistory {
    // Create a new watch history instance
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

    // Updates the watch duration and completion status
    pub fn update_progress(&mut self, watched_duration: i32, completed: bool) {
        self.watched_duration = watched_duration;
        self.completed = completed;
        self.last_watched_at = chrono::Utc::now().naive_utc();
    }

    // Check if the media has been completed
    pub fn is_completed(&self) -> bool {
        self.completed
    }

    // Gets the watch duration in minutes
    pub fn get_watch_duration_minutes(&self) -> i32 {
        self.watched_duration / 60
    }

    // Gets the watch duration in hours
    pub fn get_watch_duration_hours(&self) -> i32 {
        self.watched_duration / 3600
    }

    // Calculates the percentage of the media that has been watched
    // Returns None if media duration is 0 or less
    pub fn get_watch_percentage(&self, media_duration: i32) -> Option<i32> {
        if media_duration <= 0 {
            return None;
        }
        // Calculate the percentage using 100.0 instead of 100
        Some((self.watched_duration as f32 / media_duration as f32 * 100.0) as i32)
    }

    // Check if the watch history is recent (within last 24h)
    pub fn is_recent(&self) -> bool {
        let now = chrono::Utc::now().naive_utc();
        let last_24h = now - chrono::Duration::hours(24);
        self.last_watched_at > last_24h
    }

    // Returns time elapsed since the last watch
    pub fn time_since_last_watch(&self) -> chrono::Duration {
        let now = chrono::Utc::now().naive_utc();
        now - self.last_watched_at
    }

    // Gets the remaining duration to watch
    pub fn get_remaining_duration(&self, media_duration: i32) -> i32 {
        if media_duration <= self.watched_duration {
            return 0;
        }
        media_duration - self.watched_duration
    }

    // Formats the watch duration into a human-readable string
    pub fn format_watch_duration(&self) -> String {
        let hours = self.get_watch_duration_hours();
        let minutes = self.get_watch_duration_minutes();
        let seconds = self.watched_duration % 60;

        match (hours, minutes, seconds) {
            (0, 0, s) if s > 0 => format!("{}s", s),
            (0, m, s) if m > 0 => format!("{}m {}s", m, s),
            (h, m, s) if h > 0 => format!("{}h {}m {}s", h, m, s),
            _ => "0s".to_string(),
        }
    }
}

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
