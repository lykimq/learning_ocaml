use actix_web::{web, HttpResponse, Responder};
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

use crate::google_calendar::GoogleCalendar;
use crate::users::{get_user_from_db, User}; // Adjust if `get_user_from_db` is in a different module

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Event {
    pub id: i32,
    pub event_title: String,
    pub event_day: NaiveDate,
    pub event_time: NaiveTime,
    pub address: String,
    pub content: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Deserialize)]
pub struct NewEvent {
    pub event_title: String,
    pub event_day: NaiveDate,
    pub event_time: NaiveTime,
    pub address: String,
    pub content: String,
}

#[derive(Deserialize)]
pub struct EditEvent {
    pub event_title: Option<String>,
    pub event_day: Option<String>,
    pub event_time: Option<String>,
    pub address: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
struct EventRecord {
    id: i32,
    event_title: String,
    event_day: NaiveDate,
    event_time: NaiveTime,
    address: String,
}

#[derive(Debug, Serialize)]
struct EventResponse {
    id: i32,
    event_title: String,
    event_day: NaiveDate,
    event_time: NaiveTime,
    address: String,
    content: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEventRequest {
    event_title: Option<String>,
    event_day: Option<NaiveDate>,
    event_time: Option<NaiveTime>,
    address: Option<String>,
    content: Option<String>,
}

pub async fn add_event(pool: web::Data<PgPool>, new_event: web::Json<NewEvent>) -> impl Responder {
    let event = sqlx::query_as!(
        Event,
        "INSERT INTO events (event_title, event_day, event_time, address, content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, event_title, event_day, event_time, address, content, created_at, updated_at",
        new_event.event_title,
        new_event.event_day,
        new_event.event_time,
        new_event.address,
        new_event.content
    )
    .fetch_one(pool.get_ref())
    .await;

    match event {
        Ok(event) => HttpResponse::Ok().json(event),
        Err(err) => HttpResponse::InternalServerError().body(format!("Error: {}", err)),
    }
}

pub async fn get_all_events(pool: web::Data<PgPool>) -> impl Responder {
    let events = sqlx::query_as!(
        Event,
        "SELECT id, event_title, event_day, event_time, address, content, created_at, updated_at FROM events"
    )
    .fetch_all(pool.get_ref())
    .await;

    match events {
        Ok(event) => HttpResponse::Ok().json(event),
        Err(err) => HttpResponse::InternalServerError().body(format!("Error: {}", err)),
    }
}

pub async fn get_past_events(pool: web::Data<PgPool>) -> impl Responder {
    // Use `date_naive()` to get the current date as `NaiveDate`
    let current_date = Utc::now().date_naive();

    // Fetch past events, deserializing directly into `EventRecord`
    let events = sqlx::query_as!(
        EventRecord,  // Use the custom struct here
        "SELECT id, event_title, event_day, event_time, address FROM events WHERE event_day < $1 ORDER BY event_day DESC, event_time DESC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    HttpResponse::Ok().json(events)
}

pub async fn get_current_events(pool: web::Data<PgPool>) -> impl Responder {
    let current_date = chrono::Utc::now().date_naive();
    let events = sqlx::query_as!(
        EventRecord,
        "SELECT id, event_title, event_day, event_time, address FROM events WHERE event_day = $1 ORDER BY event_time DESC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    HttpResponse::Ok().json(events)
}

pub async fn get_future_events(pool: web::Data<PgPool>) -> impl Responder {
    let current_date = chrono::Utc::now().date_naive();
    let events = sqlx::query_as!(
        EventRecord,
        "SELECT id, event_title, event_day, event_time, address FROM events WHERE event_day > $1 ORDER BY event_day ASC, event_time ASC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    HttpResponse::Ok().json(events)
}

pub async fn get_current_future_events(pool: web::Data<PgPool>) -> impl Responder {
    let current_date = chrono::Utc::now().date_naive();

    // Get current events
    let current_events = sqlx::query_as!(
        EventRecord,
        "SELECT id, event_title, event_day, event_time, address FROM events WHERE event_day = $1 ORDER BY event_time DESC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    // Get future events
    let future_events = sqlx::query_as!(
        EventRecord,
        "SELECT id, event_title, event_day, event_time, address FROM events WHERE event_day > $1 ORDER BY event_day ASC, event_time ASC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    // Combine both current and future events into one list
    let combined_events = [current_events, future_events].concat();

    HttpResponse::Ok().json(combined_events)
}

pub async fn delete_event(pool: web::Data<PgPool>, event_id: web::Path<i32>) -> impl Responder {
    let event_id = event_id.into_inner();
    let result = sqlx::query!("DELETE FROM events WHERE id = $1", event_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json("Event deleted successfully."),
        Err(err) => HttpResponse::InternalServerError().json(format!("Error: {}", err)),
    }
}

pub async fn update_event(
    pool: web::Data<PgPool>,
    event_id: web::Path<i32>,
    update_request: web::Json<UpdateEventRequest>,
) -> impl Responder {
    let event_id = event_id.into_inner();
    let update_request = update_request.into_inner();

    // Prepare SQL query for updating the event
    let result = sqlx::query!(
        r#"
        UPDATE events
        SET
            event_title = COALESCE($1, event_title),
            event_day = COALESCE($2, event_day),
            event_time = COALESCE($3, event_time),
            address = COALESCE($4, address),
            content = COALESCE($5, content),
            updated_at = NOW()
        WHERE id = $6
        RETURNING id, event_title, event_day, event_time, address, content
        "#,
        update_request.event_title,
        update_request.event_day,
        update_request.event_time,
        update_request.address,
        update_request.content,
        event_id
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(event) => HttpResponse::Ok().json(EventResponse {
            id: event.id,
            event_title: event.event_title,
            event_day: event.event_day,
            event_time: event.event_time,
            address: event.address,
            content: event.content,
        }),
        Err(_) => HttpResponse::InternalServerError().body("Error updating event"),
    }
}

// Send event to google calendar handler
pub async fn send_event_to_google_calendar_handler(
    pool: web::Data<PgPool>,
    event_id: web::Path<i32>,
    user_email: web::Query<String>,
) -> impl Responder {
    let event = sqlx::query_as!(
         Event,
        "SELECT id, event_title, event_day, event_time, address, content, created_at, updated_at FROM events WHERE id = $1",
        event_id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match event {
        Ok(event) => {
            let user_email_str = user_email.into_inner();

            let user = sqlx::query_as!(
                User,
                "SELECT id, username, email, google_access_token, google_refresh_token FROM users WHERE email = $1",
                user_email_str
            )
            .fetch_one(pool.get_ref())
            .await;

            match user {
                Ok(user) => {
                    // Initialize GoogleCalendar instance with the pool
                    let google_calendar = GoogleCalendar::new(pool.get_ref().clone());
                    // Send event to Google Calendar
                    match google_calendar
                        .send_event_to_google_calendar(user.id, &event)
                        .await
                    {
                        Ok(_) => HttpResponse::Ok().json("Event sent to Google Calendar."),
                        Err(e) => HttpResponse::InternalServerError().json(format!("Error: {}", e)),
                    }
                }
                Err(e) => HttpResponse::NotFound().json(format!("User not found: {}", e)),
            }
        }
        Err(_) => HttpResponse::NotFound().json("Event not found."),
    }
}
