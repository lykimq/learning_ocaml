use actix_cors::Cors;
use actix_web::{
    web::{self},
    App, HttpServer,
};
use dotenv::dotenv;
use sqlx::PgPool;
use std::env;

mod events;
mod eventrsvp;
mod email;
mod homegroup;

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
                    .route("/search", web::get().to(events::search_events))
                    .service(
                        web::scope("/rsvp")
                            .route("/confirm/{id}", web::post().to(eventrsvp::confirm_rsvp))
                            .route("/decline/{id}", web::post().to(eventrsvp::decline_rsvp))
                            .route("/search", web::get().to(eventrsvp::search_rsvps))
                            .route("/list", web::get().to(eventrsvp::get_all_rsvps))
                            .route("/add", web::post().to(eventrsvp::create_rsvp))
                            .route("/edit/{id}", web::put().to(eventrsvp::update_rsvp))
                            .route("/{id}", web::delete().to(eventrsvp::delete_rsvp))
                            .route("/email/{email}", web::get().to(eventrsvp::get_rsvps_by_email))
                            .route("/event/{event_id}", web::get().to(eventrsvp::get_rsvps_by_event))
                            .service(
                                web::scope("/email")
                                    .route("/send-confirmation", web::post().to(email::send_confirmation_email))
                                    .route("/send-decline", web::post().to(email::send_decline_email))
                            )
                    )
            )
            // Add home group routes
            .service(
                web::scope("/admin/home_group")
                    .route("/add", web::post().to(homegroup::add_home_group))
                    .route("/edit/{id}", web::put().to(homegroup::update_home_group))
                    .route("/list", web::get().to(homegroup::get_all_home_groups))
                    .route("/{id}", web::get().to(homegroup::get_home_group))
                    .route("/{id}", web::delete().to(homegroup::delete_home_group))
                    .route("/search", web::get().to(homegroup::search_home_groups))
            )
            // Event RSVPs
            .service(
                web::scope("events/rsvp")
                    .route("/add", web::post().to(eventrsvp::create_rsvp))
                    .route("/edit/{id}", web::put().to(eventrsvp::update_rsvp))
                    .route("/list", web::get().to(eventrsvp::get_all_rsvps))
                    .route("/{id}", web::delete().to(eventrsvp::delete_rsvp))
                    .route("/email/{email}", web::get().to(eventrsvp::get_rsvps_by_email))
                    .route("/event/{event_id}", web::get().to(eventrsvp::get_rsvps_by_event))
            )
            // Add a separate scope for email operations

        // Other routes
    })
    .bind(&format!("0.0.0.0:{}", backend_port))?
    .run()
    .await

}
