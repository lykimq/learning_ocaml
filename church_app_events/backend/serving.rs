
use actix_web::{web, HttpResponse, Responder};
use chrono::{NaiveDateTime};
use serde::{Serialize, Deserialize};
use sqlx::{PgPool, FromRow};


#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Serving {
    pub id: i32,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub created_by: i32,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at : Option <NaiveDateTime>
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateServingRequest{
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub created_by: i32
}

#[derive(Debug, Deserialize)]
pub struct UpdateServingRequest{
    pub title: Option<String>,
    pub description: Option<String>,
    pub location: Option<String>
}

// Create a new serving

pub async fn add_serving(
    pool: web::Data<PgPool>,
    serving: web::Json<CreateServingRequest>
) -> impl Responder {
    let result =
    sqlx::query_as!(
        Serving,
        r#"INSERT INTO serving (title, description, location, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *"#,
        serving.title,
        serving.description,
        serving.location,
        serving.created_by
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(serving) => HttpResponse::Ok().json(serving),
        Err(e) => {
            eprint!("Error creating serving: {}", e);
            HttpResponse::InternalServerError().json("Failed to create serving")
        }
    }
}

// Get all servings
pub async fn get_all_servings (
    pool: web::Data<PgPool>
) -> impl Responder {
    let result = sqlx::query_as!(
        Serving,
        r#"SELECT * FROM serving"#
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(serving) => HttpResponse::Ok().json(serving),
        Err(e) =>{
            eprint!("Error getting serving: {}", e);
            HttpResponse::InternalServerError().json("Failed to get servings")
        }
    }
}

// Get a serving by id
pub async fn get_serving(
    pool: web::Data<PgPool>,
    id: web::Path<i32>
) -> impl Responder {
    let result = sqlx::query_as!(
        Serving,
        r#"SELECT * FROM serving WHERE id = $1"#,
        id.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some (serving)) => HttpResponse::Ok().json(serving),
        Ok (None) => HttpResponse::NotFound().json("Serving not found"),
        Err(e) => {
            eprint!("Error getting serving: {}", e);
            HttpResponse::InternalServerError().json("Failed to get serving")
        }
    }
}

// Update a serving
pub async fn update_serving(
    pool: web::Data<PgPool>,
    id: web::Path<i32>,
    request: web::Json<UpdateServingRequest>
) -> impl Responder {
    let result = sqlx::query_as!(
        Serving,
        r#"
        UPDATE serving
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            location = COALESCE($3, location),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 RETURNING *"#,
        request.title,
        request.description,
        request.location,
        id.into_inner()
    )
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(serving) => HttpResponse::Ok().json(serving),
        Err(e) => {
            eprint!("Error updating serving: {}", e);
            HttpResponse::InternalServerError().json("Failed to update serving")
        }
    }
}

// Delete a serving

pub async fn delete_serving (
    pool: web::Data<PgPool>,
    id: web::Path<i32>
) -> impl Responder {
    let result = sqlx::query_as!(
        Serving,
        r#"DELETE FROM serving WHERE id = $1"#,
        id.into_inner()
    )
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json("Serving deleted"),
        Err(e) => {
            eprint!("Error deleting serving: {}", e);
            HttpResponse::InternalServerError().json("Failed to delete serving")
        }
    }
}


#[derive(Debug, Deserialize)]
pub struct SearchQuery{
    pub title: Option<String>,
    pub location: Option<String>
}

// Search for servings
pub async fn search_servings(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>
) -> impl Responder {
    let mut sql = String::from(
        r#"
        SELECT * FROM serving WHERE 1 = 1"#
    );

    let mut bindings = vec![];

    if let Some(title) = &query.title{
        sql.push_str(" AND LOWER(title) LIKE LOWER($1)");
        bindings.push(format!("%{}%", title))
    }

    if let Some(location) = &query.location{
        let param_num = bindings.len() + 1;
        sql.push_str(&format!(" AND LOWER(location) LIKE LOWER(${})", param_num));
        bindings.push(format!("%{}%", location))
    }

    sql.push_str(" ORDER BY created_by DESC");

    let mut query = sqlx::query_as::<_, Serving>(&sql);

    for binding in bindings{
        query = query.bind(binding)
    }

    let result = query.fetch_all(pool.get_ref()).await;

    match result {
        Ok(servings) => HttpResponse::Ok().json(servings),
        Err(e) => {
            eprint!("Error searching servings: {}", e);
            HttpResponse::InternalServerError().json("Failed to search servings")
        }
    }
}