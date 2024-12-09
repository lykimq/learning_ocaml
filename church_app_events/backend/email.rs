use lettre::{
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport,
    Message,
    message::{header, MultiPart, SinglePart},
};
use sqlx::PgPool;
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::env;


#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "email_status", rename_all = "lowercase")]
pub enum EmailStatus {
    Pending,
    Sent,
    Failed,
}

pub struct EmailConfig {
    smtp_username: String,
    smtp_password: String,
    smtp_server: String,
    from_email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmailRequest {
    pub rsvp_id: i32,
    pub email: String,
    pub event_id: i32,
}

impl EmailConfig {
    pub fn from_env() -> Self {
        Self {
            smtp_username: env::var("SMTP_USERNAME").expect("SMTP_USERNAME must be set"),
            smtp_password: env::var("SMTP_PASSWORD").expect("SMTP_PASSWORD must be set"),
            smtp_server: env::var("SMTP_SERVER").expect("SMTP_SERVER must be set"),
            from_email: env::var("FROM_EMAIL").expect("FROM_EMAIL must be set"),
        }
    }
}

async fn get_event_details(pool: &PgPool, event_id: i32) -> Result<(String, String, String), sqlx::Error> {
    let event = sqlx::query!(
        r#"
        SELECT event_title, event_date, event_time
        FROM events
        WHERE id = $1
        "#,
        event_id
    )
    .fetch_one(pool)
    .await?;

    Ok((
        event.event_title,
        event.event_date.to_string(),
        event.event_time.to_string(),
    ))
}

async fn create_mailer(
    config: &EmailConfig,
) -> Result<AsyncSmtpTransport<lettre::Tokio1Executor>, lettre::transport::smtp::Error> {
    let creds = Credentials::new(
        config.smtp_username.clone(),
        config.smtp_password.clone(),
    );

    Ok(AsyncSmtpTransport::<lettre::Tokio1Executor>::relay(&config.smtp_server)?
        .credentials(creds)
        .build())
}

async fn send_confirmation_email_internal(
    pool: &PgPool,
    rsvp_id: i32,
    email: &str,
    event_id: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get event details
    let (event_title, event_date, event_time) = get_event_details(pool, event_id).await?;

    let config = EmailConfig::from_env();
    let mailer = create_mailer(&config).await?;

    // Create email content
    let html_content = format!(
        r#"
        <html>
            <body>
                <h2>Event Confirmation</h2>
                <p>Thank you for confirming your attendance to {event_title}!</p>
                <p>Event Details:</p>
                <ul>
                    <li>Date: {event_date}</li>
                    <li>Time: {event_time}</li>
                </ul>
                <p>We look forward to seeing you there!</p>
                <p>Best regards,<br>Church Events Team</p>
            </body>
        </html>
        "#
    );

    let text_content = format!(
        "Thank you for confirming your attendance to {}!\n\n\
        Event Details:\n\
        Date: {}\n\
        Time: {}\n\n\
        We look forward to seeing you there!\n\n\
        Best regards,\n\
        Church Events Team",
        event_title, event_date, event_time
    );

    // Create the email message
    let email_message = Message::builder()
        .from(config.from_email.parse()?)
        .to(email.parse()?)
        .subject(format!("Confirmation: {}", event_title))
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(text_content)
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(html_content.clone())
                ),
        )?;

    // Send the email
    mailer.send(email_message).await?;

    // After sending the email successfully, log it
    sqlx::query!(
        r#"
        INSERT INTO email_logs
        (rsvp_id, email_to, email_from, subject, body, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP)
        "#,
        rsvp_id,
        email,
        config.from_email,
        format!("Confirmation: {}", event_title),
        html_content,
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn send_decline_email_internal(
    pool: &PgPool,
    rsvp_id: i32,
    email: &str,
    event_id: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get event details
    let (event_title, event_date, event_time) = get_event_details(pool, event_id).await?;

    let config = EmailConfig::from_env();
    let mailer = create_mailer(&config).await?;

    // Create email content
    let html_content = format!(
        r#"
        <html>
            <body>
                <h2>Event Response Received</h2>
                <p>We've received your response that you won't be able to attend {event_title}.</p>
                <p>Event Details:</p>
                <ul>
                    <li>Date: {event_date}</li>
                    <li>Time: {event_time}</li>
                </ul>
                <p>We hope to see you at future events!</p>
                <p>Best regards,<br>Church Events Team</p>
            </body>
        </html>
        "#
    );

    let text_content = format!(
        "We've received your response that you won't be able to attend {}.\n\n\
        Event Details:\n\
        Date: {}\n\
        Time: {}\n\n\
        We hope to see you at future events!\n\n\
        Best regards,\n\
        Church Events Team",
        event_title, event_date, event_time
    );

    // Create the email message
    let email_message = Message::builder()
        .from(config.from_email.parse()?)
        .to(email.parse()?)
        .subject(format!("Response Received: {}", event_title))
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(text_content)
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(html_content.clone())
                ),
        )?;

    // Send the email
    mailer.send(email_message).await?;

    // After sending the email successfully, log it
    sqlx::query!(
        r#"
        INSERT INTO email_logs
        (rsvp_id, email_to, email_from, subject, body, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP)
        "#,
        rsvp_id,
        email,
        config.from_email,
        format!("Response Received: {}", event_title),
        html_content,
    )
    .execute(pool)
    .await?;

    Ok(())
}



// Send confirmation email to EVENT RSVP
pub async fn send_confirmation_email(
    pool: web::Data<PgPool>,
    req: web::Json<EmailRequest>,
) -> impl Responder {
    match send_confirmation_email_internal(
        &pool,
        req.rsvp_id,
        &req.email,
        req.event_id
    ).await {
        Ok(_) => HttpResponse::Ok().json("Email sent successfully"),
        Err(e) =>
         HttpResponse::InternalServerError().json(format!("Failed to send email: {}", e))
    }
}

// Send decline email to EVENT RSVP
pub async fn send_decline_email(
    pool: web::Data<PgPool>,
    req: web::Json<EmailRequest>,
) -> impl Responder {
    match send_decline_email_internal(
        &pool,
        req.rsvp_id,
        &req.email,
        req.event_id
    ).await {
        Ok(_) => HttpResponse::Ok().json("Email sent successfully"),
        Err(e) =>
         HttpResponse::InternalServerError().json(format!("Failed to send email: {}", e))
    }
}

// HOME GROUP RSVP EMAIL

#[derive(Debug, Serialize, Deserialize)]
pub struct HomeGroupEmailRequest {
    pub email: String,
    pub name: String,
    pub home_group_id: i32,
    pub rsvp_id: i32,
}


// Send confirmation email to home group RSVP

async fn send_homegroup_rsvp_email_internal(
    pool: &PgPool,
    email: &str,
    home_group_id: i32,
    name: &str,
    rsvp_id: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get home group details
    let home_group = sqlx::query!(
        r#"
        SELECT name, location
        FROM homegroups
        WHERE id = $1
        "#,
        home_group_id
    )
    .fetch_one(pool)
    .await?;

    let config = EmailConfig::from_env();
    let mailer = create_mailer(&config).await?;

    // Create email content
    let html_content = format!(
        r#"
        <html>
            <body>
                <h2>Home Group RSVP Confirmation</h2>
                <p>Dear {}</p>
                <p>Thank you for your RSVP to the home group: {}!</p>
                <p>Location: {}</p>
                <p>We look forward to seeing you there!</p>
                <p>Best regards,<br>Church Events Team</p>
            </body>
        </html>
        "#,
        name,
        home_group.name,
        home_group.location.as_ref().unwrap_or(&"TBA".to_string())
    );

    let text_content = format!(
        "Dear {},\n\n\
        Thank you for your RSVP to the home group: {}!\n\n\
        Location: {}\n\n\
        We look forward to seeing you there!\n\n\
        Best regards,\n\
        Church Events Team",
        name,
        home_group.name,
        home_group.location.as_ref().unwrap_or(&"TBA".to_string())
    );

    // Create the email message
    let email_message = Message::builder()
        .from(config.from_email.parse()?)
        .to(email.parse()?)
        .subject(format!("RSVP Confirmation: {}", home_group.name))
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(text_content)
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(html_content.clone())
                ),
        )?;

    // Send the email
    mailer.send(email_message).await?;
    // After sending the email successfully, log it
    sqlx::query!(
        r#"
        INSERT INTO email_logs
        (rsvp_id, email_to, email_from, subject, body, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP)
        "#,
        rsvp_id,
        email,
        config.from_email,
        format!("RSVP Confirmation: {}", home_group.name),
        html_content,
    )
    .execute(pool)
    .await?;

    Ok(())
}

// Send confirmation email to home group RSVP
pub async fn send_homegroup_rsvp_email(
    pool: web::Data<PgPool>,
    req: web::Json<HomeGroupEmailRequest>,
) -> impl Responder {
    match send_homegroup_rsvp_email_internal(
        &pool,
        &req.email,
        req.home_group_id,
        &req.name,
        req.rsvp_id,
    ).await {
        Ok(_) => HttpResponse::Ok().json("Home group RSVP email sent successfully"),
        Err(e) =>
        HttpResponse::InternalServerError().json(format!("Failed to send home group RSVP email: {}", e))
    }
}

async fn send_homegroup_decline_email_internal(
    pool: &PgPool,
    email: &str,
    home_group_id: i32,
    name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get home group details
    let home_group = sqlx::query!(
        r#"
        SELECT name, location
        FROM homegroups
        WHERE id = $1
        "#,
        home_group_id
    )
    .fetch_one(pool)
    .await?;

    let config = EmailConfig::from_env();
    let mailer = create_mailer(&config).await?;

    // Create email content
    let html_content = format!(
        r#"
        <html>
            <body>
                <h2>Home Group Response Received</h2>
                <p>Dear {}</p>
                <p>We've received your response that you won't be able to attend the home group: {}!</p>
                <p>Location: {}</p>
                <p>We hope to see you at future home group meetings!</p>
                <p>Best regards,<br>
                Church Events Team</p>
            </body>
        </html>
        "#,
        name,
        home_group.name,
        home_group.location.as_ref().unwrap_or(&"TBA".to_string())
    );

    let text_content = format!(
        "Dear {},\n\n\
        We've received your response that you won't be able to attend the home group: {}!\n\n\
        Location: {}\n\n\
        We hope to see you at future home group meetings!\n\n\
        Best regards,\n\
        Church Events Team",
        name,
        home_group.name,
        home_group.location.as_ref().unwrap_or(&"TBA".to_string())
    );

    // Create the email message
    let email_message = Message::builder()
        .from(config.from_email.parse()?)
        .to(email.parse()?)
        .subject(format!("Response Received: {}", home_group.name))
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(text_content)
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(html_content.clone())
                ),
        )?;

    // Send the email
    mailer.send(email_message).await?;

    // After sending the email successfully, log it
    sqlx::query!(
        r#"
        INSERT INTO email_logs
        (email_to, email_from, subject, body, status, sent_at)
        VALUES ($1, $2, $3, $4, 'sent', CURRENT_TIMESTAMP)
        "#,
        email,
        config.from_email,
        format!("Response Received: {}", home_group.name),
        html_content,
    )
    .execute(pool)
    .await?;

    Ok(())
}

// Send decline email to home group RSVP
pub async fn send_homegroup_decline_email(
    pool: web::Data<PgPool>,
    req: web::Json<HomeGroupEmailRequest>,
) -> impl Responder {
    match send_homegroup_decline_email_internal(
        &pool,
        &req.email,
        req.home_group_id,
        &req.name
    ).await {
        Ok(_) => HttpResponse::Ok().json("Home group decline email sent successfully"),
        Err(e) =>
            HttpResponse::InternalServerError().json(format!("Failed to send home group decline email: {}", e))
    }
}

// SERVING RSVP EMAIL

#[derive(Debug, Serialize, Deserialize)]
pub struct ServingRsvpEmailRequest {
    pub email: String,
    pub name: String,
    pub serving_id: i32,
    pub rsvp_id: i32,
    pub user_id: Option<i32>,
    pub phone: Option<String>,
}

// Send confirmation email for serving sign-up
async fn send_serving_rsvp_email_internal(
    pool: &PgPool,
    email: &str,
    serving_id: i32,
    name: &str,
    rsvp_id: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get serving details
    let servingrsvps = sqlx::query!(
        r#"
        SELECT name
        FROM servingrsvps
        WHERE id = $1
        "#,
        serving_id
    )
    .fetch_one(pool)
    .await?;

    let config = EmailConfig::from_env();
    let mailer = create_mailer(&config).await?;

    // Create email content
    let html_content = format!(
        r#"
        <html>
            <body>
                <h2>Serving RSVP Confirmation</h2>
                <p>Dear {}</p>
                <p>Thank you for signing up to serve: {}!</p>
                <p>We look forward to serving with you!</p>
                <p>Best regards,<br>Church Events Team</p>
            </body>
        </html>
        "#,
        name,
        servingrsvps.name
    );

    let text_content = format!(
        "Dear {},\n\n\
        Thank you for signing up to serve: {}!\n\n\
        We look forward to serving with you!\n\n\
        Best regards,\n\
        Church Events Team",
        name,
        servingrsvps.name
    );

    // Create the email message
    let email_message = Message::builder()
        .from(config.from_email.parse()?)
        .to(email.parse()?)
        .subject(format!("Serving RSVP Confirmation: {}", servingrsvps.name))
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(text_content)
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(html_content.clone())
                ),
        )?;

    // Send the email
    mailer.send(email_message).await?;

    // After sending the email successfully, log it
    sqlx::query!(
        r#"
        INSERT INTO email_logs
        (rsvp_id, email_to, email_from, subject, body, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP)
        "#,
        rsvp_id,
        email,
        config.from_email,
        format!("Serving RSVP Confirmation: {}", servingrsvps.name),
        html_content,
    )
    .execute(pool)
    .await?;

    Ok(())
}

// Send confirmation email for serving sign-up
pub async fn send_serving_rsvp_email(
    pool: web::Data<PgPool>,
    req: web::Json<ServingRsvpEmailRequest>,
) -> impl Responder {
    // First, sign up the user for serving
    if let Err(e) = rsvp_for_serving(
        &pool,
        req.user_id.expect("User ID must be provided"),
        req.serving_id,
        &req.email,
        &req.name,
        req.phone.as_deref(),
    ).await {
        return HttpResponse::InternalServerError().json(format!("Failed to rsvp for serving: {}", e));
    }

    // Then, send the confirmation email
    match send_serving_rsvp_email_internal(
        &pool,
        &req.email,
        req.serving_id,
        &req.name,
        req.rsvp_id,
    ).await {
        Ok(_) => HttpResponse::Ok().json("Serving RSVP email sent successfully"),
        Err(e) =>
            HttpResponse::InternalServerError().json(format!("Failed to send serving RSVP email: {}", e))
    }
}

// Send decline email for serving RSVP
async fn send_serving_decline_email_internal(
    pool: &PgPool,
    email: &str,
    serving_id: i32,
    name: &str,
    rsvp_id: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get serving details by joining with the serving table
    let serving = sqlx::query!(
        r#"
        SELECT name
        FROM servingrsvps
        WHERE id = $1
        "#,
        serving_id
    )
    .fetch_one(pool)
    .await?;

    let config = EmailConfig::from_env();
    let mailer = create_mailer(&config).await?;

    // Update email content to use serving_name
    let html_content = format!(
        r#"
        <html>
            <body>
                <h2>Serving RSVP Response Received</h2>
                <p>Dear {}</p>
                <p>We've received your response that you won't be able to serve: {}!</p>
                <p>We hope to see you at future serving opportunities!</p>
                <p>Best regards,<br>
                Church Events Team</p>
            </body>
        </html>
        "#,
        name,
        serving.name
    );

    let text_content = format!(
        "Dear {},\n\n\
        We've received your response that you won't be able to serve: {}!\n\n\
        We hope to see you at future serving opportunities!\n\n\
        Best regards,\n\
        Church Events Team",
        name,
        serving.name
    );

    // Create the email message
    let email_message = Message::builder()
        .from(config.from_email.parse()?)
        .to(email.parse()?)
        .subject(format!("Response Received: {}", serving.name))
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(text_content)
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(html_content.clone())
                ),
        )?;

    // Send the email
    mailer.send(email_message).await?;

    // After sending the email successfully, log it
    sqlx::query!(
        r#"
        INSERT INTO email_logs
        (rsvp_id, email_to, email_from, subject, body, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, 'sent', CURRENT_TIMESTAMP)
        "#,
        rsvp_id,
        email,
        config.from_email,
        format!("Serving RSVP Response Received: {}", serving.name),
        html_content,
    )
    .execute(pool)
    .await?;

    Ok(())
}

// Send decline email for serving sign-up
pub async fn send_serving_decline_email(
    pool: web::Data<PgPool>,
    req: web::Json<ServingRsvpEmailRequest>,
) -> impl Responder {
    match send_serving_decline_email_internal(
        &pool,
        &req.email,
        req.serving_id,
        &req.name,
        req.rsvp_id,
    ).await {
        Ok(_) => HttpResponse::Ok().json("Serving decline email sent successfully"),
        Err(e) =>
            HttpResponse::InternalServerError().json(format!("Failed to send serving decline email: {}", e))
    }
}

// Add this function to handle the sign-up process
async fn rsvp_for_serving(
    pool: &PgPool,
    user_id: i32,
    serving_id: i32,
    email: &str,
    name: &str,
    phone: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    // Insert the response into the servingrsvps table
    sqlx::query!(
        r#"
        INSERT INTO public.servingrsvps
        (user_id, serving_id, email, name, phone, rsvp_status, rsvp_date)
        VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP)
        "#,
        user_id,
        serving_id,
        email,
        name,
        phone
    )
    .execute(pool)
    .await?;

    Ok(())
}