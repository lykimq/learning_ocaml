use actix_web::{web, HttpResponse, Responder};
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool, Row};

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

#[derive(Debug, Serialize)]
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

pub async fn edit_event(
    pool: web::Data<PgPool>,
    event_id: web::Path<i32>,
    edited_event: web::Json<EditEvent>,
) -> impl Responder {
    let _event_id = event_id.into_inner();
    let mut update_query = "UPDATE events SET".to_string();
    let mut params = Vec::new();
    let mut param_index = 1;

    if let Some(event_title) = &edited_event.event_title {
        update_query.push_str(&format!(" event_title = ${},", param_index));
        params.push(event_title);
        param_index += 1;
    }
    if let Some(event_day) = &edited_event.event_day {
        update_query.push_str(&format!(" event_day = ${},", param_index));
        params.push(event_day);
        param_index += 1;
    }
    if let Some(event_time) = &edited_event.event_time {
        update_query.push_str(&format!(" event_time = ${},", param_index));
        params.push(event_time);
        param_index += 1;
    }
    if let Some(address) = &edited_event.address {
        update_query.push_str(&format!(" address = ${},", param_index));
        params.push(address);
        param_index += 1;
    }
    if let Some(content) = &edited_event.content {
        update_query.push_str(&format!(" content = ${},", param_index));
        params.push(content);
        param_index += 1;
    }

    // Remove the trailing comma and add the WHERE clause
    update_query.pop();
    update_query.push_str(&format!(
        " WHERE id = ${} RETURNING id, event_title, event_day, event_time, address, content",
        param_index
    ));

    let result = sqlx::query(&update_query).fetch_one(pool.get_ref()).await;

    match result {
        Ok(row) => {
            let event = EventResponse {
                id: row.get("id"),
                event_title: row.get("event_title"),
                event_day: row.get("event_day"),
                event_time: row.get("event_time"),
                address: row.get("address"),
                content: row.get("content"), // Include content in response
            };
            HttpResponse::Ok().json(event)
        }
        Err(err) => HttpResponse::InternalServerError().json(format!("Error: {}", err)),
    }
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
