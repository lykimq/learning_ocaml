use serde::Deserialize;

#[derive(Deserialize)]
pub struct Config {
    pub database_url: String,
    pub youtube_api_key: String,
    pub youtube_channel_id: String,
    pub server_port: u16,
    pub redis_url: String,
    pub rate_limit_window: u64,
    pub rate_limit_max_requests: i32,
}

impl Config {
    pub fn from_env() -> Self {
        envy::from_env().expect("Failed to read configuration from environment variables")
    }
}
