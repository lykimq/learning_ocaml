use actix_web::{post, put, delete, get, web, HttpResponse, Responder};
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct Event {
    pub id: i32,
    pub event_title: String,
    pub event_date: NaiveDate,
    pub event_time: NaiveTime,
    pub address: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Deserialize)]
pub struct NewEvent {
    pub event_title: String,
    pub event_date: NaiveDate,
    pub event_time: NaiveTime,
    pub address: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
struct EventRecord {
    id: i32,
    event_title: String,
    event_date: NaiveDate,
    event_time: NaiveTime,
    address: Option<String>,
}

#[derive(Debug, Serialize)]
struct EventResponse {
    id: i32,
    event_title: String,
    event_date: NaiveDate,
    event_time: NaiveTime,
    address: Option<String>,
    description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEventRequest {
    event_title: Option<String>,
    event_date: Option<NaiveDate>,
    event_time: Option<NaiveTime>,
    address: Option<String>,
    description: Option<String>,
}


#[post("/admin/events")]
pub async fn add_event(
    pool: web::Data<PgPool>,
    new_event: web::Json<NewEvent>,
) -> impl Responder {

    let result = sqlx::query!(
        "INSERT INTO events (event_title, event_date, event_time, address, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, event_title, event_date, event_time, address, description, created_at, updated_at",
        new_event.event_title,
        new_event.event_date,
        new_event.event_time,
        new_event.address,
        new_event.description
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(row) => {
            // Map the row to Event and return it as JSON
            let event = Event {
                id: row.id,
                event_title: row.event_title,
                event_date: row.event_date,
                event_time: row.event_time,
                address: row.address,
                description: row.description,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };
            HttpResponse::Ok().json(event)
        }
        Err(err) => HttpResponse::InternalServerError().body(format!("Error: {}", err)),
    }
}

#[get("/admin/events")]
pub async fn get_all_events(pool: web::Data<PgPool>) -> impl Responder {
    // Fetch all events from the database
    let result = sqlx::query_as!(
        Event,
        "SELECT id, event_title, event_date, event_time, address, description, created_at, updated_at FROM events"
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(events) => {
            // Return a list of events as JSON
            HttpResponse::Ok().json(events)
        }
        Err(err) => HttpResponse::InternalServerError().body(format!("Error: {}", err)),
    }
}

pub async fn get_past_events(pool: web::Data<PgPool>) -> impl Responder {
    // Use `date_naive()` to get the current date as `NaiveDate`
    let current_date = Utc::now().date_naive();

    // Fetch past events, deserializing directly into `EventRecord`
    let events = sqlx::query!(
        "SELECT id, event_title, event_date, event_time, address FROM events WHERE event_date < $1 ORDER BY event_date DESC, event_time DESC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    let event_records: Vec<EventRecord> = events.into_iter().map(|row| EventRecord {
        id: row.id,
        event_title: row.event_title,
        event_date: row.event_date,
        event_time: row.event_time,
        address: row.address,
        }).collect();

    HttpResponse::Ok().json(event_records)
}


pub async fn get_current_events(pool: web::Data<PgPool>) -> impl Responder {
    let current_date = chrono::Utc::now().date_naive();
    let events = sqlx::query!(
        "SELECT id, event_title, event_date, event_time, address FROM events WHERE event_date = $1 ORDER BY event_time DESC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    let event_records: Vec<EventRecord> = events.into_iter().map(|row| EventRecord {
        id: row.id,
        event_title: row.event_title,
        event_date: row.event_date,
        event_time: row.event_time,
        address: row.address,
        }).collect();

    HttpResponse::Ok().json(event_records)
}

pub async fn get_future_events(pool: web::Data<PgPool>) -> impl Responder {
    let current_date = chrono::Utc::now().date_naive();
    let events = sqlx::query!(
        "SELECT id, event_title, event_date, event_time, address FROM events WHERE event_date > $1 ORDER BY event_date ASC, event_time ASC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    let event_records: Vec<EventRecord> = events.into_iter().map(|row| EventRecord {
        id: row.id,
        event_title: row.event_title,
        event_date: row.event_date,
        event_time: row.event_time,
        address: row.address,
        }).collect();

    HttpResponse::Ok().json(event_records)
}

pub async fn get_current_future_events(pool: web::Data<PgPool>) -> impl Responder {
    let current_date = Utc::now().date_naive();

    // Get current events
    let current_events = sqlx::query!(
        "SELECT id, event_title, event_date, event_time, address FROM events WHERE event_date = $1 ORDER BY event_time DESC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    // Get future events
    let future_events = sqlx::query!(
        "SELECT id, event_title, event_date, event_time, address FROM events WHERE event_date > $1 ORDER BY event_date ASC, event_time ASC",
        current_date
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_else(|_| Vec::new());

    // Map the current events into EventRecord
    let current_event_records: Vec<EventRecord> = current_events.into_iter().map(|row| EventRecord {
        id: row.id,
        event_title: row.event_title,
        event_date: row.event_date,
        event_time: row.event_time,
        address: row.address,
    }).collect();

    // Map the future events into EventRecord
    let future_event_records: Vec<EventRecord> = future_events.into_iter().map(|row| EventRecord {
        id: row.id,
        event_title: row.event_title,
        event_date: row.event_date,
        event_time: row.event_time,
        address: row.address,
    }).collect();

    // Combine the events into one vector
    let combined_events = [current_event_records, future_event_records].concat();

    // Return the combined events as JSON
    HttpResponse::Ok().json(combined_events)
}


#[delete("/admin/events/:id")]
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

#[put("/admin/events/:id")]
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
            event_date = COALESCE($2, event_date),
            event_time = COALESCE($3, event_time),
            address = COALESCE($4, address),
            description = COALESCE($5, description),
            updated_at = NOW()
        WHERE id = $6
        RETURNING id, event_title, event_date, event_time, address, description
        "#,
        update_request.event_title,
        update_request.event_date,
        update_request.event_time,
        update_request.address,
        update_request.description,
        event_id
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(event) => HttpResponse::Ok().json(EventResponse {
            id: event.id,
            event_title: event.event_title,
            event_date: event.event_date,
            event_time: event.event_time,
            address: event.address,
            description: event.description,
        }),
        Err(_) => HttpResponse::InternalServerError().body("Error updating event"),
    }
}

