//! Notification Service Module
//! Handles all email notifications related to donations and recurring donations

use anyhow::Result;
use rust_decimal::Decimal;
use lettre::{
    AsyncSmtpTransport,
    AsyncTransport,
    Message,
    transport::smtp::authentication::Credentials,
    message::{header, MultiPart, SinglePart},
    Tokio1Executor,
};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use crate::email::{EmailConfig, EmailStatus, create_mailer};

/// Service for handling all donation-related notifications
pub struct NotificationService {
    email_client: AsyncSmtpTransport<Tokio1Executor>,
    admin_email: String,
    from_email: String,
    pool: PgPool,
}

/// Donation summary for email notifications
#[derive(Debug)]
pub struct DonationSummary {
    pub total_payments: i32,
    pub total_amount: Decimal,
    pub currency: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub cancellation_reason: Option<String>,
}

impl NotificationService {
    /// Creates a new NotificationService instance
    ///
    /// # Arguments
    /// * `admin_email` - Email address for admin notifications
    /// * `from_email` - Email address used as sender
    /// * `pool` - Database connection pool
    pub async fn new(
        admin_email: String,
        from_email: String,
        pool: PgPool
    ) -> Result<Self> {
        let config = EmailConfig::from_env();
        let email_client =
        create_mailer(&config).await?;

        Ok(Self {
            email_client,
            admin_email,
            from_email,
            pool,
        })
    }

    // ============= Payment Success Notifications =============

    /// Sends a notification for successful payment retry
    pub async fn send_payment_retry_success_notification(
        &self,
        user_id: i32,
        currency: &str,
        amount: Decimal
    ) -> Result<()> {
        let user_email = self.get_user_email(user_id).await?;

        let email = Message::builder()
            .from(self.from_email.parse()?)
            .to(user_email.parse()?)
            .subject("Recurring Donation Payment Successful")
            .header(header::ContentType::TEXT_HTML)
            .body(format!(
                "Your recurring donation payment of {} {} has been successfully processed.",
                currency, amount
            ))?;

        self.email_client.send(email).await?;
        self.log_email_sent(
            user_id,
            &user_email,
            "Recurring Donation Payment Successful",
            &format!("Your recurring donation payment of {} {} has been successfully processed.", currency, amount),
            EmailStatus::Sent,
            None
        ).await?;
        Ok(())
    }

    /// Sends a notification for successful donation
    pub async fn send_donation_success_notification(
        &self,
        user_id: i32,
        rsvp_id: i32,
        currency: &str,
        amount: Decimal,
        is_recurring: bool
    ) -> Result<()> {
        let user_email = self.get_user_email(user_id).await?;
        let subject = if is_recurring {
            "Recurring Donation Setup Successful"
        } else {
            "Donation Successful"
        };

        let html_content = format!(
            r#"<html><body>
                <h2>Donation Confirmation</h2>
                <p>Thank you for your {} donation of {} {}.</p>
                <p>Best regards,<br>Church Donations Team</p>
            </body></html>"#,
            if is_recurring { "recurring" } else { "one-time" },
            currency,
            amount
        );

        let email = Message::builder()
            .from(self.from_email.parse()?)
            .to(user_email.parse()?)
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(header::ContentType::TEXT_PLAIN)
                            .body(format!(
                                "Thank you for your {} donation of {} {}.",
                                if is_recurring { "recurring" } else { "one-time" },
                                currency,
                                amount
                            ))
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(header::ContentType::TEXT_HTML)
                            .body(html_content.clone())
                    ),
            )?;

        match self.email_client.send(email).await {
            Ok(_) => {
                self.log_email_sent(
                    rsvp_id,
                    &user_email,
                    subject,
                    &html_content,
                    EmailStatus::Sent,
                    None
                ).await?;
                Ok(())
            },
            Err(e) => {
                self.log_email_sent(
                    rsvp_id,
                    &user_email,
                    subject,
                    &html_content,
                    EmailStatus::Failed,
                    Some(&e.to_string())
                ).await?;
                Err(anyhow::anyhow!("Failed to send email: {}", e))
            }
        }
    }

    // ============= Helper Functions =============

    /// Gets the user's email from the database
    async fn get_user_email(&self, user_id: i32) -> Result<String> {
        let user = sqlx::query!(
            r#"
            SELECT email
            FROM users
            WHERE id = $1
            "#,
            user_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to fetch user email: {}", e))?;

        Ok(user.email)
    }

    /// Logs sent emails to the database
    async fn log_email_sent(
        &self,
        rsvp_id: i32,
        recipient: &str,
        subject: &str,
        body: &str,
        status: EmailStatus,
        error_message: Option<&str>
    ) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO email_logs
            (rsvp_id, email_to, email_from, subject, body, status, error_message, sent_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            "#,
            rsvp_id,
            recipient,
            self.from_email,
            subject,
            body,
            status as EmailStatus,
            error_message,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

