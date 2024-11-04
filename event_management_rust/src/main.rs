use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use sqlx::PgPool;
use std::env;

mod users; // Import your users module

// Function to create the HTTP server
pub async fn run_server(
    pool: PgPool,
    frontend_port: String,
    backend_port: u16,
) -> std::io::Result<()> {
    println!("Connected to the database");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(
                Cors::default()
                    .allowed_origin(&format!("http://localhost:{}", frontend_port))
                    .allowed_methods(vec!["POST", "GET", "PUT", "DELETE", "OPTIONS"])
                    .allowed_headers(vec!["Content-Type", "Authorization"])
                    .max_age(3600),
            )
            .route("/register", web::post().to(users::register_user_handler))
            .route("/users", web::get().to(users::get_all_users_handler))
            .route("users/{id}/edit", web::put().to(users::update_user_handler))
            .route("users/{id}", web::delete().to(users::delete_user_handler))
    })
    .bind(format!("127.0.0.1:{}", backend_port))?
    .run()
    .await
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok(); // Load environment variables from .env file
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let frontend_port: String = env::var("FRONTEND_PORT").expect("FRONTEND_PORT not set");
    let backend_port: u16 = env::var("BACKEND_PORT")
        .expect("BACKEND_PORT not set")
        .parse()
        .expect("BACKEND_PORT must be a valid number");

    // Establish connection pool
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to create pool.");

    // Run the server
    run_server(pool, frontend_port, backend_port).await
}
