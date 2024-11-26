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

// Then the public handler functions
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
        Err(e) => HttpResponse::InternalServerError().json(format!("Failed to send email: {}", e))
    }
}

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
        Err(e) => HttpResponse::InternalServerError().json(format!("Failed to send email: {}", e))
    }
}
