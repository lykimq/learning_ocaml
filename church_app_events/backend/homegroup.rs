use actix_web::{web, HttpResponse, Responder};
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Serialize, Deserialize};
use sqlx::{PgPool, FromRow};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct HomeGroup {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub created_by: i32,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub language: Option<String>,
    pub profile_picture: Option<String>,
    pub max_capacity: Option<i32>,
    pub meeting_time: Option<NaiveTime>,
    pub meeting_day: Option<NaiveDate>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateHomeGroupRequest {
    pub name: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub language: Option<String>,
    pub profile_picture: Option<String>,
    pub max_capacity: Option<i32>,
    pub meeting_time: Option<NaiveTime>,
    pub meeting_day: Option<NaiveDate>,
    pub created_by: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateHomeGroupRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub location: Option<String>,
    pub language: Option<String>,
    pub profile_picture: Option<String>,
    pub max_capacity: Option<i32>,
    pub meeting_time: Option<NaiveTime>,
    pub meeting_day: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub name: Option<String>,
    pub location: Option<String>,
    pub language: Option<String>,
}

// Create a new home group
pub async fn add_home_group(
    pool: web::Data<PgPool>,
    home_group: web::Json<CreateHomeGroupRequest>,
) -> impl Responder {

    let result = sqlx::query_as!(
        HomeGroup,
        r#"INSERT INTO homegroups
         (name, description, location, language, profile_picture,
         max_capacity, meeting_time, meeting_day, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *"#,
        home_group.name,
        home_group.description,
        home_group.location,
        home_group.language,
        home_group.profile_picture,
        home_group.max_capacity,
        home_group.meeting_time,
        home_group.meeting_day,
        home_group.created_by
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(home_group) => HttpResponse::Ok().json(home_group),
        Err(e) => {
            eprintln!("Error creating home group: {}", e);
            HttpResponse::InternalServerError().json("Failed to create home group")
        }
    }
}

// Get all home groups
pub async fn get_all_home_groups(
    pool: web::Data<PgPool>,
) -> impl Responder {

    let result = sqlx::query_as!(
        HomeGroup,
        r#"SELECT * FROM homegroups"#
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(home_groups) => HttpResponse::Ok().json(home_groups),
        Err(e) => {
            eprintln!("Error getting home groups: {}", e);
            HttpResponse::InternalServerError().json("Failed to get home groups")
        }
    }
}

// Get a home group by id
pub async fn get_home_group(
    pool: web::Data<PgPool>,
    id: web::Path<i32>,
) -> impl Responder {

    let result = sqlx::query_as!(
        HomeGroup,
        r#"SELECT * FROM homegroups WHERE id = $1"#,
        id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(home_group)) => HttpResponse::Ok().json(home_group),
        Ok(None) => HttpResponse::NotFound().json("Home group not found"),
        Err(e) => {
            eprintln!("Error getting home group: {}", e);
            HttpResponse::InternalServerError().json("Failed to get home group")
        }
    }
}

// Update a home group
pub async fn update_home_group(
    pool: web::Data<PgPool>,
    id: web::Path<i32>,
    request: web::Json<UpdateHomeGroupRequest>,
) -> impl Responder {
    let result = sqlx::query_as!(
        HomeGroup,
        r#"
        UPDATE homegroups
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            location = COALESCE($3, location),
            language = COALESCE($4, language),
            profile_picture = COALESCE($5, profile_picture),
            max_capacity = COALESCE($6, max_capacity),
            meeting_time = COALESCE($7, meeting_time),
            meeting_day = COALESCE($8, meeting_day),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 RETURNING *"#,
           request.name,
           request.description,
           request.location,
           request.language,
           request.profile_picture,
           request.max_capacity,
           request.meeting_time,
           request.meeting_day,
           id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(home_group) => HttpResponse::Ok().json(home_group),
        Err(e) => {
            eprintln!("Error updating home group: {}", e);
            HttpResponse::InternalServerError().json("Failed to update home group")
        }
    }
}

// Delete a home group
pub async fn delete_home_group(
    pool: web::Data<PgPool>,
    id: web::Path<i32>,
) -> impl Responder {

    let result = sqlx::query!(
        r#"DELETE FROM homegroups WHERE id = $1"#,
        id.into_inner()
    )
    .fetch_optional (pool.get_ref())
    .await;

    match result {
        Ok(Some(_)) => HttpResponse::Ok().json("Home group deleted"),
        Ok(None) => HttpResponse::NotFound().json("Home group not found"),
        Err(e) => {
            eprintln!("Error deleting home group: {}", e);
            HttpResponse::InternalServerError().json("Failed to delete home group")
        }
    }
}

// Search for a home group
pub async fn search_home_groups(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
) -> impl Responder {

    let mut sql = String::from(
        r#"
        SELECT * FROM homegroups WHERE 1 = 1
        "#
    );

    let mut bindings = vec![];


    if let Some(name) = &query.name {
        sql.push_str(" AND LOWER(name) LIKE LOWER($1)");
        bindings.push(format!("%{}%", name));
    }


    if let Some(location) = &query.location {
        let param_num = bindings.len() + 1;
        sql.push_str(&format!(" AND LOWER(location) LIKE LOWER(${})", param_num));
        bindings.push(format!("%{}%", location));

    }

    if let Some(language) = &query.language {
        let param_num = bindings.len() + 1;
        sql.push_str(&format!(" AND LOWER(language) LIKE LOWER(${})", param_num));
        bindings.push(format!("%{}%", language));
    }

    sql.push_str(" ORDER BY created_at DESC");

    let mut query = sqlx::query_as::<_, HomeGroup>(&sql);

    for binding in bindings {
        query = query.bind(binding);
    }

    let result = query.fetch_all(pool.get_ref()).await;

    match result {
        Ok(home_groups) => HttpResponse::Ok().json(home_groups),
        Err(e) => {
            eprintln!("Error searching home groups: {}", e);
            HttpResponse::InternalServerError().json("Failed to search home groups")
        }
    }
}
