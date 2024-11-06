use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use sqlx::PgPool;
use std::env;

mod login;
mod users;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    println!("Connected to the database");

    // Read DATABASE_URL and BACKEND_PORT from environment variables
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let backend_port = env::var("BACKEND_PORT").expect("BACKEND_PORT must be set");
    let frontend_port = env::var("FRONTEND_PORT").expect("FRONTEND_PORT must be set");

    // Connect to the PostgreSQL database
    let pool = PgPool::connect(&database_url).await.unwrap();

    // Create the HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone())) // Clone the pool for each instance
            .wrap(
                Cors::default()
                    // TODO: call from env and have an option to be any port and the default is 3000
                    .allowed_origin(&format!("http://localhost:{}", frontend_port))
                    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                    .allowed_headers(vec!["Content-Type", "Authorization"])
                    .max_age(3600),
            )
            // Authentication routes
            .service(
                web::scope("/auth")
                    .route("/login", web::post().to(login::login_handler))
                    .route("/signup", web::post().to(login::signup_handler)),
            )
            // Users
            .service(
                web::scope("/users")
                    .route("/register", web::post().to(users::register_user_handler)),
            )
            // Other routes
            .route("/admin/users", web::get().to(users::get_all_users_handler))
    })
    .bind(format!("127.0.0.1:{}", backend_port))? // Use the backend port from .env
    .run()
    .await
}
