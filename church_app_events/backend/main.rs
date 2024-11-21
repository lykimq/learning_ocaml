use actix_cors::Cors;
use actix_web::{
    web::{self},
    App, HttpServer,
};
use dotenv::dotenv;
use sqlx::PgPool;
use std::env;

mod events;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    println!("Connected to the database");

    // Read DATABASE_URL and BACKEND_PORT from environment variables
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let backend_port = env::var("BACKEND_PORT").expect("BACKEND_PORT must be set");
    let frontend_port = env::var("FRONTEND_PORT").expect("FRONTEND_PORT must be set");


       // Connect to the PostgreSQL database
       let pool = PgPool::connect(&database_url).await.unwrap();

        // Determine whether we are running in the Android emulator or web
        let server_address = if cfg!(target_os = "android") {
            // Use 10.0.2.2 for the Android emulator
            format!("http://10.0.2.2:{}", backend_port)
        } else if cfg!(target_os = "ios") {
            // Use the local IP address for physical iOS devices
            // Use localhost for iOS simulator (on macOS), or configure a local IP address for physical devices
            let local_ip = "127.0.0.1"; // Hardcode this for testing or get it programmatically
            format!("http://{}:{}", local_ip, backend_port)
        } else {
            // Use 127.0.0.1 for web browsers
            format!("127.0.0.1:{}", backend_port)
        };

       HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone())) // Clone the pool for each instance
            .wrap(
                Cors::default()
                    .allowed_origin(&format!("http://localhost:{}", frontend_port))
                    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                    .allowed_headers(vec!["Content-Type", "Authorization"])
                    .max_age(3600),
            )
            // Authentication routes
            // Users
            // Events
            .service(
                web::scope("/admin/events")
                    .route("/add", web::post().to(events::add_event))
                    .route("/edit/{id}", web::put().to(events::update_event))
                    .route("/list", web::get().to(events::get_all_events))
                    .route("/past", web::get().to(events::get_past_events))
                    .route("/current", web::get().to(events::get_current_events))
                    .route("/future", web::get().to(events::get_future_events))
                    .route(
                        "/current_future",
                        web::get().to(events::get_current_future_events),
                    )
                    .route("/{id}", web::delete().to(events::delete_event))
            )

        // Other routes
    })
    .bind(server_address)? // Use the backend port from .env
    .run()
    .await

}
