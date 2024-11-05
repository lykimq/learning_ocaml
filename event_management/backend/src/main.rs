use actix_web::{web, App, HttpServer, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use dotenv::dotenv;
use std::env;
mod login;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    // Read DATABASE_URL and BACKEND_PORT from environment variables
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let backend_port = env::var("BACKEND_PORT").expect("BACKEND_PORT must be set");

    let pool = PgPool::connect(&database_url).await.unwrap();

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            // Call Login
            .route("/login", web::post().to(login::login))
    })
    .bind(format!("127.0.0.1:{}", backend_port))? // Use the backend port from .env
    .run()
    .await
}
