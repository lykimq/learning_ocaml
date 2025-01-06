use anyhow::Result;
use redis::{Client, AsyncCommands};
use std::time::Duration;

/// RateLimiter handles request rate limiting using Redis
pub struct RateLimiter {
    client: Client,
    window: Duration,
    max_requests: i32,
}

impl RateLimiter {
    /// Creates a new RateLimiter instance
    ///
    /// # Arguments
    /// * `client` - Redis client instance
    /// * `window` - Time window for rate limiting
    /// * `max_requests` - Maximum allowed requests within window
    pub fn new_with_client(client: Client, window: Duration, max_requests: i32) -> Self {
        Self { client, window, max_requests }
    }

    /// Checks if a request from an IP should be rate limited
    ///
    /// # Arguments
    /// * `ip` - IP address to check
    ///
    /// # Returns
    /// * `Ok(true)` if request is allowed
    /// * `Ok(false)` if rate limit exceeded
    pub async fn check_rate_limit(&self, ip: &str) -> Result<bool> {
        let mut conn = self.client.get_async_connection().await?;

        match conn.get::<_, Option<String>>(ip).await? {
            Some(count) => {
                let count: i32 = count.parse()?;
                if count >= self.max_requests {
                    Ok(false)
                } else {
                    let _ : i64 =
                    conn.incr(ip, 1).await?;
                    Ok(true)
                }
            }
            None => {
               let _ : () =
                conn.set_ex(ip, "0", self.window.as_secs() as usize).await?;
                Ok(true)
            }
        }
    }
}

