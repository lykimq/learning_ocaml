use dotenv::dotenv;
use sqlx::PgPool;
use std::env;

mod users; // Import your users module

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
    users::run_server(pool, frontend_port, backend_port).await
}
