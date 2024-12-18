use redis::{Client, AsyncCommands};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use anyhow::Result;

/// Cache struct that wraps a Redis client for handling caching operations

pub struct Cache {
    client: Client,
}

impl Cache {

     /// Creates a new Cache instance
    ///
    /// # Arguments
    /// * `url` - Redis connection URL (e.g., "redis://127.0.0.1:6379")
    ///
    /// # Returns
    /// * `Result<Cache>` - New cache instance or error

    pub fn new(url: &str) -> Result<Self> {
        let client = Client::open(url)?;
        Ok(Self { client })
    }

       /// Sets a value in the cache with serialization
    ///
    /// # Arguments
    /// * `key` - Cache key to store the value under
    /// * `value` - Value to be serialized and stored
    /// * `expiry` - Time-to-live (TTL) duration for the cached item
    ///
    /// # Type Parameters
    /// * `T` - Any type that implements Serialize
    ///
    /// # Returns
    /// * `Result<()>` - Success or error

    pub async fn set<T: Serialize>(&self, key: &str, value: &T, expiry: Duration) -> Result<()> {

        let mut conn = self.client.get_async_connection().await?;
        let serialized = serde_json::to_string(value)?;
        // set_ex automatically sets the expiration time in seconds
        conn.set_ex(key, serialized, expiry.as_secs() as usize).await?;
        Ok(())
    }


     /// Retrieves and deserializes a value from the cache
    ///
    /// # Arguments
    /// * `key` - Cache key to retrieve
    ///
    /// # Type Parameters
    /// * `T` - Any type that implements Deserialize
    ///
    /// # Returns
    /// * `Result<Option<T>>` - Deserialized value if found, None if not found, or error
    pub async fn get<T: for<'de> Deserialize<'de>>(&self, key: &str) -> Result<Option<T>> {
        let mut conn = self.client.get_async_connection().await?;
        let value: Option<String> = conn.get(key).await?;

        match value {
            Some(serialized) => {
                let deserialized = serde_json::from_str(&serialized)?;
                Ok(Some(deserialized))
            }
            None => Ok(None),
        }
    }
}


