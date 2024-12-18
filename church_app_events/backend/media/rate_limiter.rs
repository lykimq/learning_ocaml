use redis::{Client, AsyncCommands};
use std::time::Duration;
use anyhow::Result;

pub struct RateLimiter {
    client: Client,
    window: Duration,
    max_requests: i32,
}

impl RateLimiter {
    pub fn new(url: &str, window: Duration, max_requests: i32) -> Result<Self> {
        let client = Client::open(url)?;
        Ok(Self {
            client,
            window,
            max_requests,
        })
    }

    pub async fn check_rate_limit(&self, ip: &str) -> Result<bool> {
        let mut conn = self.client.get_async_connection().await?;
        let current: Option<String> = conn.get(ip).await?;

        match current {
            Some(count) => {
                let count: i32 = count.parse()?;
                if count >= self.max_requests {
                    Ok(false)
                } else {
                    conn.incr(ip, 1).await?;
                    Ok(true)
                }
            }
            None => {
                conn.set_ex(ip, "0", self.window.as_secs() as usize).await?;
                Ok(true)
            }
        }
    }
}

