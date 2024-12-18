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
mod homegrouprsvp;
mod user;
mod serving;
mod servingrsvp;
mod media {
    pub mod config;
    pub mod error;
    pub mod models;
    pub mod media_repository;
    pub mod cache;
    pub mod rate_limiter;
    pub mod youtube_service;
    pub mod watch_history;


}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    println!("Environment variables loaded");
    println!("Connected to the database");

    // Read DATABASE_URL and BACKEND_PORT from environment variables
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let backend_port = env::var("BACKEND_PORT").expect("BACKEND_PORT must be set");
    let frontend_port = env::var("FRONTEND_PORT").expect("FRONTEND_PORT must be set");

    // GET API URLS from the environment variables
    let web_url = env::var("API_URL_WEB").expect("API_URL_WEB must be set");
    let ios_url = env::var("API_URL_IOS").expect("API_URL_IOS must be set");
    let android_url = env::var("API_URL_ANDROID").expect("API_URL_ANDROID must be set");

    // Connect to the PostgreSQL database
    let pool = PgPool::connect(&database_url).await.unwrap();


       HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone())) // Clone the pool for each instance
            .wrap(
                Cors::default()
                    .allowed_origin(&format!("http://localhost:{}", frontend_port))
                    .allowed_origin(&web_url)
                    .allowed_origin(&ios_url)
                    .allowed_origin(&android_url)
                    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                    .allowed_headers(vec!["Content-Type", "Authorization", "Accept", "Origin"])
                    .expose_headers(vec!["Content-Length"])
                    .supports_credentials()
                    .max_age(3600),
            )
            .wrap(user::AuthMiddleware)
            // Authentication routes
            .service(
                web::scope("/auth")
                    .route("/login", web::post().to(user::login))
                    .route("/logout", web::post().to(user::logout))
            )
            // Authentication routes (existing admin routes)
            .service(
                web::scope("/admin/users")
                    .route("/add", web::post().to(user::add_user))
                    .route("/edit/{id}", web::put().to(user::update_user))
                    .route("/{id}", web::delete().to(user::delete_user))
                    .route("/search", web::get().to(user::search_users))
                    .route("/list", web::get().to(user::get_all_users))
                    .route("/{id}", web::get().to(user::get_user))
                    .route("/email/{email}", web::get().to(user::get_user_by_email))
                    .route("/username/{username}", web::get().to(user::get_user_by_username))
                    .route("/verify-password", web::post().to(user::verify_password))
            )
            // Events
            .service(
                web::scope("/admin/events")
                    .route("/add", web::post().to(events::add_event))
                    .route("/edit/{id}", web::put().to(events::update_event))
                    .route("/{id}", web::delete().to(events::delete_event))
                    .route("/search", web::get().to(events::search_events))
                    .route("/list", web::get().to(events::get_all_events))
                    .route("/past", web::get().to(events::get_past_events))
                    .route("/current", web::get().to(events::get_current_events))
                    .route("/future", web::get().to(events::get_future_events))
                    .route(
                        "/current_future",
                        web::get().to(events::get_current_future_events),
                    )
                    .service(
                        web::scope("/rsvp")
                            .route("/confirm/{id}", web::post().to(eventrsvp::confirm_rsvp))
                            .route("/decline/{id}", web::post().to(eventrsvp::decline_rsvp))
                            .route("/search", web::get().to(eventrsvp::search_rsvps))
                            .route("/add", web::post().to(eventrsvp::create_rsvp))
                            .route("/edit/{id}", web::put().to(eventrsvp::update_rsvp))
                            .route("/{id}", web::delete().to(eventrsvp::delete_rsvp))
                            .route("/list", web::get().to(eventrsvp::get_all_rsvps))
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
                    .route("/{id}", web::delete().to(homegroup::delete_home_group))
                    .route("/search", web::get().to(homegroup::search_home_groups))
                    .route("/list", web::get().to(homegroup::get_all_home_groups))
                    .route("/{id}", web::get().to(homegroup::get_home_group))
                    .service(
                        web::scope("/rsvp")
                            .route("/add", web::post().to(homegrouprsvp::create_registration))
                            .route("/edit/{id}", web::put().to(homegrouprsvp::update_registration))
                            .route("/{id}", web::delete().to(homegrouprsvp::delete_registration))
                            .route("/list", web::get().to(homegrouprsvp::get_all_registrations))
                            .route("/group/{home_group_id}", web::get().to(homegrouprsvp::get_registrations_by_group))
                            .route("/email/{email}", web::get().to(homegrouprsvp::get_registrations_by_email))
                            .route("/confirm/{id}", web::post().to(homegrouprsvp::confirm_registration))
                            .route("/decline/{id}", web::post().to(homegrouprsvp::decline_registration))
                            .route("/search", web::get().to(homegrouprsvp::search_registrations))
                            .service(
                                web::scope("/email")
                                    .route("/send-confirmation", web::post().to(email::send_homegroup_rsvp_email))
                                    .route("/send-decline", web::post().to(email::send_homegroup_decline_email))
                            )
                    )
            )
            // User Event RSVPs
            .service(
                web::scope("events/rsvp")
                    .route("/add", web::post().to(eventrsvp::create_rsvp))
                    .route("/edit/{id}", web::put().to(eventrsvp::update_rsvp))
                    .route("/{id}", web::delete().to(eventrsvp::delete_rsvp))
                    .route("/list", web::get().to(eventrsvp::get_all_rsvps))
                    .route("/email/{email}", web::get().to(eventrsvp::get_rsvps_by_email))
                    .route("/event/{event_id}", web::get().to(eventrsvp::get_rsvps_by_event))
            )
            // Serving routes
            .service(
                web::scope("admin/servings")
                    .route("/add", web::post().to(serving::add_serving))
                    .route("/edit/{id}", web::put().to(serving::update_serving))
                    .route("/{id}", web::delete().to(serving::delete_serving))
                    .route("/list", web::get().to(serving::get_all_servings))
                    .route("/{id}", web::get().to(serving::get_serving))
                    .route("/search", web::get().to(serving::search_servings))
                    .service(
                        web::scope("/rsvp")
                        .route("/confirm/{id}", web::post().to(servingrsvp::confirm_serving_rsvp))
                        .route("/decline/{id}", web::post().to(servingrsvp::decline_serving_rsvp))
                        .service(
                            web::scope("/email")
                            .route("/send-confirmation", web::post().to(email::send_serving_rsvp_email))
                            .route("/send-decline", web::post().to(email::send_serving_decline_email))
                        )
                    )
            )
            .service(
                // User Serving RSVPs
                web::scope("/servings/rsvp")
                    .route("/add", web::post().to(servingrsvp::create_serving_rsvp))
                    .route("/edit/{id}", web::put().to(servingrsvp::update_serving_rsvp))
                    .route("/{id}", web::delete().to(servingrsvp::delete_serving_rsvp))
                    .route("/list", web::get().to(servingrsvp::get_all_serving_rsvps))
                    .route("/search", web::get().to(servingrsvp::search_serving_rsvp))

            )
        // Other routes
    })
    .bind(&format!("0.0.0.0:{}", backend_port))?
    .run()
    .await

}
