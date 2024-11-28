use actix_web::{web, HttpResponse, Responder};
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

#[derive(Deserialize, Serialize)]
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

#[derive(Debug, Deserialize)]
pub struct EventSearchParams{
    text: Option<String>,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
    start_time: Option<NaiveTime>,
    end_time: Option<NaiveTime>,
    category: Option<String>,
    date_filter: Option<String>,
    limit: Option<i32>,
    offset: Option<i32>,
}

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

pub async fn search_events(
    pool: web::Data<PgPool>,
    params: web::Query<EventSearchParams>
) -> impl Responder {
    // Get current date for relative date calculations
    let current_date = chrono::Utc::now().date_naive();

    // Handle date range logic
    let (effective_start_date, effective_end_date) = match (params.start_date, params.end_date) {
        // Case 1: Both dates provided - validate and use them
        (Some(start), Some(end)) => {
            if end < start {
                return HttpResponse::BadRequest().json("End date cannot be earlier than start date");
            }
            (start, end)
        },
        // Case 2: Only start date - search from start date to 30 days ahead
        (Some(start), None) => {
            let default_end = start + chrono::Duration::days(30);
            (start, default_end)
        },
        // Case 3: Only end date - search from 30 days before to end date
        (None, Some(end)) => {
            let default_start = end - chrono::Duration::days(30);
            (default_start, end)
        },
        // Case 4: No dates provided - use predefined filters or default to upcoming events
        (None, None) => {
            (
                current_date - chrono::Duration::days(30),  // Default to last 30 days
                current_date + chrono::Duration::days(30)   // and next 30 days
            )
        }
    };

    let mut query = sqlx::QueryBuilder::new(
        "SELECT id, event_title, event_date, event_time, address, description, created_at, updated_at
         FROM events WHERE 1=1"
    );

    // Common search filters
    if let Some(text) = &params.text {
        let search_pattern = format!("%{}%", text);
        query.push(" AND (event_title ILIKE ");
        query.push_bind(search_pattern.clone());
        query.push(" OR description ILIKE ");
        query.push_bind(search_pattern.clone());
        query.push(" OR address ILIKE ");
        query.push_bind(search_pattern);
        query.push(")");
    }

    // Add predefined date range filters
    match params.date_filter.as_deref() {
        Some("today") => {
            query.push(" AND event_date = ");
            query.push_bind(current_date);
        },
        Some("tomorrow") => {
            query.push(" AND event_date = ");
            query.push_bind(current_date + chrono::Duration::days(1));
        },
        Some("this_week") => {
            let week_end = current_date + chrono::Duration::days(7);
            query.push(" AND event_date >= ");
            query.push_bind(current_date);
            query.push(" AND event_date <= ");
            query.push_bind(week_end);
        },
        Some("upcoming") => {
            query.push(" AND event_date >= ");
            query.push_bind(current_date);
        },
        Some("past") => {
            query.push(" AND event_date < ");
            query.push_bind(current_date);
        },
        // Custom date range using effective dates
        None => {
            query.push(" AND event_date >= ");
            query.push_bind(effective_start_date);
            query.push(" AND event_date <= ");
            query.push_bind(effective_end_date);
        },
        _ => {}
    }

    // Time range if provided
    if let Some(start_time) = params.start_time {
        query.push(" AND event_time >= ");
        query.push_bind(start_time);
    }

    if let Some(end_time) = params.end_time {
        query.push(" AND event_time <= ");
        query.push_bind(end_time);
    }

    // Category filter
    if let Some(category) = &params.category {
        query.push(" AND category = ");
        query.push_bind(category.clone());
    }

    // Add smart sorting based on search context
    if params.date_filter == Some("past".to_string()) {
        query.push(" ORDER BY event_date DESC, event_time DESC"); // Past events newest first
    } else {
        query.push(" ORDER BY event_date ASC, event_time ASC"); // Future events soonest first
    }

    // Add pagination
    if let (Some(limit), Some(offset)) = (params.limit, params.offset) {
        query.push(" LIMIT ");
        query.push_bind(limit);
        query.push(" OFFSET ");
        query.push_bind(offset);
    }

    // Execute query
    let query = query.build_query_as::<Event>();
    match query.fetch_all(pool.get_ref()).await {
        Ok(events) => HttpResponse::Ok().json(events),
        Err(err) => {
            eprintln!("Search error: {}", err);
            HttpResponse::InternalServerError().json("Failed to search events")
        }
    }
}

