use actix_web::{web, App, HttpServer, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use dotenv::dotenv;
use std::env;
use actix_cors::Cors;

mod login;
mod users;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    // Read DATABASE_URL and BACKEND_PORT from environment variables
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let backend_port = env::var("BACKEND_PORT").expect("BACKEND_PORT must be set");

    // Connect to the PostgreSQL database
    let pool = PgPool::connect(&database_url).await.unwrap();

    // Create the HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone())) // Clone the pool for each instance
            .wrap(Cors::default()
                .allowed_origin("http://localhost:3000")
                .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
                .allowed_headers(vec!["Content-Type", "Authorization"])
                .max_age(3600))
            .route("/register", web::post().to(users::register_user_handler))
            .route("/admin/users", web::get().to(users::get_all_users_handler))
            .route("/login", web::post().to(login::login))
    })
    .bind(format!("127.0.0.1:{}", backend_port))? // Use the backend port from .env
    .run()
    .await
}
