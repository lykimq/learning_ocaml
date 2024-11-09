use crate::events::Event;
use crate::users::User;
use actix_web::web::Data;
use oauth2::basic::BasicClient;
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use reqwest::Client;
use serde::Serialize;
use sqlx::PgPool;
use std::env;

#[derive(Serialize)]
pub struct GoogleCalendarEvent {
    pub summary: String,
    pub description: String,
    pub start_time: String,
    pub end_time: String,
}

pub struct GoogleCalendar {
    client: BasicClient,
    pool: PgPool,
}

impl GoogleCalendar {
    pub fn new(pool: PgPool) -> Self {
        let client_id =
            ClientId::new(env::var("GOOGLE_CLIENT_ID").expect("GOOGLE_CLIENT_ID not set"));
        let client_secret = ClientSecret::new(
            env::var("GOOGLE_CLIENT_SECRET").expect("GOOGLE_CLIENT_SECRET not set"),
        );
        let auth_url =
            AuthUrl::new("https://accounts.google.com/o/oauth2/auth".to_string()).unwrap();
        let token_url = TokenUrl::new("https://oauth2.googleapis.com/token".to_string()).unwrap();
        let redirect_url =
            RedirectUrl::new(env::var("GOOGLE_REDIRECT_URI").expect("GOOGLE_REDIRECT_URI not set"))
                .unwrap();

        let client = BasicClient::new(client_id, Some(client_secret), auth_url, Some(token_url))
            .set_redirect_uri(redirect_url);

        GoogleCalendar { client, pool }
    }

    // Fetch user's Google tokens from the database
    async fn get_user_tokens(&self, user_id: i32) -> Result<User, sqlx::Error> {
        let query = "SELECT id, username, email, google_access_token, google_refresh_token FROM users WHERE id = $1";
        let row = sqlx::query_as::<_, User>(query)
            .bind(user_id)
            .fetch_one(&self.pool)
            .await?;

        Ok(row)
    }

    // Send event to Google Calendar using the user's access token
    pub async fn send_event_to_google_calendar(
        &self,
        user_id: i32,
        event: &Event,
    ) -> Result<(), String> {
        let user = self
            .get_user_tokens(user_id)
            .await
            .map_err(|_| "Failed to fetch user token")?;

        if let Some(access_token) = user.google_access_token {
            let google_event = GoogleCalendarEvent {
                summary: event.event_title.clone(),
                description: event.content.clone(),
                start_time: format!("{}T{}:00", event.event_day, event.event_time),
                end_time: format!("{}T{}:00", event.event_day, event.event_time),
            };

            let client = Client::new();

            let res = client
                .post("https://www.googleapis.com/calendar/v3/calendars/primary/events")
                .bearer_auth(access_token)
                .json(&google_event)
                .send()
                .await;

            match res {
                Ok(resp) if resp.status().is_success() => Ok(()),
                Ok(resp) => Err(format!("Google Calendar API error: {}", resp.status())),
                Err(e) => Err(format!("Request error: {}", e)),
            }
        } else {
            Err("No Google access token found for user".into())
        }
    }
}

pub fn google_calendar_data(pool: PgPool) -> Data<GoogleCalendar> {
    Data::new(GoogleCalendar::new(pool))
}
