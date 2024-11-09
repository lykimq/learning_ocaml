use actix_cors::Cors;
use actix_web::{
    web::{self},
    App, HttpServer,
};
use dotenv::dotenv;
use sqlx::PgPool;
use std::env;

mod events;
mod google_calendar;
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
    let google_calendar_data = google_calendar::google_calendar_data(pool.clone());

    // Create the HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone())) // Clone the pool for each instance
            .app_data(google_calendar_data.clone()) // Pass the GoogleCalendar struct
            .wrap(
                Cors::default()
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
                    .route("/register", web::post().to(users::register_user_handler))
                    .route("/{id}/edit", web::put().to(users::update_user_handler))
                    .route("/{id}", web::delete().to(users::delete_user_handler))
                    .route("/admin/list", web::get().to(users::get_all_users_handler)),
            )
            // Events
            .service(
                web::scope("/events")
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
                    .route(
                        "/sync_google_calendar/{user_id}",
                        web::post().to(events::send_event_to_google_calendar_handler),
                    ),
            )

        // Other routes
    })
    .bind(format!("127.0.0.1:{}", backend_port))? // Use the backend port from .env
    .run()
    .await
}
