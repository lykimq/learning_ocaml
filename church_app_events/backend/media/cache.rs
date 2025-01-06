use anyhow::Result;
use redis::{AsyncCommands, Client};
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Cache struct that wraps a Redis client for handling caching operations
#[derive(Clone)]
pub struct Cache {
    client: Client,
}

impl Cache {
    /// Creates a new Cache instance
    ///
    /// # Arguments
    /// * `client` - Redis client instance
    ///
    /// # Returns
    /// * `Result<Cache>` - New cache instance or error
    pub fn new_with_client(client: Client) -> Self {
        Self { client }
    }

    /// Gets an async connection from the client
    async fn get_connection(&self) -> Result<redis::aio::Connection> {
        Ok(self.client.get_async_connection().await?)
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
        let mut conn = self.get_connection().await?;
        let serialized = serde_json::to_string(value)?;
        let _: () = conn.set_ex(key, serialized, expiry.as_secs() as usize).await?;
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
        let mut conn = self.get_connection().await?;
        let value: Option<String> = conn.get(key).await?;

        Ok(match value {
            Some(serialized) => Some(serde_json::from_str(&serialized)?),
            None => None,
        })
    }
}


