//! Recurring Donation Service Module
//!
//! This module handles all recurring donation operations including:
//! - Setting up new recurring donations
//! - Processing scheduled payments
//! - Managing donation status
//! - Payment scheduling and tracking
//! - Currency conversion

use anyhow::Result;
use chrono::{Utc};
use rust_decimal::Decimal;
use sqlx::{PgPool, Row};

use crate::donation::donation::{DonationStatus, Donation};
use crate::donation::donation_service::DonationService;
use crate::donation::recurring_donation::RecurringDonation;
use super::payment_method::{PaymentMethod, PaymentMethodType};
use super::payment_method_service::PaymentMethodService;
use super::notification_service::NotificationService;
use std::str::FromStr;

pub struct RecurringDonationService {
    pool: PgPool,
    payment_method_service: PaymentMethodService,
    notification_service: NotificationService,
    donation_service: DonationService,
}

// ============= Core Recurring Donation Operations =============

/// Sets up a new recurring donation with payment method validation
///
/// # Process Flow:
/// 1. Validate payment method
/// 2. Store payment info for future use
/// 3. Calculate initial payment schedule
/// 4. Create donation record
/// 5. Schedule first payment
/// 6. Send confirmation

impl RecurringDonationService {
pub async fn setup_recurring_donation(
    &self,
    recurring_donation: RecurringDonation,
    payment_token: String
) -> Result<RecurringDonation> {
    // Validate payment method
    let payment_method = PaymentMethod::validate_payment_method(
        &payment_token,
        PaymentMethodType::CreditCard
    ).await?;

    // Store payment method for future use
    let stored_payment_method = self.payment_method_service
        .store_payment_method(
            payment_method,
            &payment_token
        ).await?;

    // Calculate next payment date
    let next_payment_date = self.donation_service.calculate_next_payment_date(
        Utc::now(),
        &recurring_donation.frequency
    );

    // Prepare donation record
    let mut new_recurring_donation = recurring_donation;
    new_recurring_donation.payment_method = stored_payment_method.payment_type;
    new_recurring_donation.next_payment_date = next_payment_date;
    new_recurring_donation.status = DonationStatus::Completed;
    new_recurring_donation.completed_payments_count = 0;
    new_recurring_donation.start_date = Utc::now();

    // Validate donation details
    self.donation_service.validate_recurring_donation(&new_recurring_donation)?;

    // Save to database
    let saved_donation = self.donation_service.create_recurring_donation(new_recurring_donation, payment_token).await?;

    // Schedule next payment
    self.donation_service.schedule_next_payment(&saved_donation).await?;

    // Send confirmation
    self.notification_service
        .send_donation_success_notification(
            saved_donation.user_id,
            saved_donation.id,
            &saved_donation.currency,
            saved_donation.amount,
            true
        )
        .await?;

    Ok(saved_donation)
}

// ============= Payment Processing =============

/// Processes the next scheduled payment for a recurring donation
///
/// # Steps:
/// 1. Verify donation is active
/// 2. Create new donation instance
/// 3. Process payment
/// 4. Update payment count
/// 5. Check payment limits
/// 6. Schedule next payment or complete series
async fn process_recurring_payment(&self, recurring_donation: &RecurringDonation) -> Result<()> {
    // Skip if not active
    if recurring_donation.status != DonationStatus::Completed {
        return Ok(());
    }

    // Create new donation instance
    let donation = Donation {
        user_id: Some(recurring_donation.user_id),
        amount: recurring_donation.amount,
        currency: recurring_donation.currency.clone(),
        payment_method: recurring_donation.payment_method.clone(),
        status: DonationStatus::Pending,
        created_at: Utc::now(),
        ..Default::default()
    };

    // Process payment
    let processed_donation = self.donation_service.process_donation(
        donation,
        recurring_donation.payment_method.to_string()
    ).await?;

    // Handle successful payment
    if processed_donation.status == DonationStatus::Completed {
        let new_count = recurring_donation.completed_payments_count + 1;

        // Update payment count
        self.donation_service.update_recurring_donation_payment_count(
                recurring_donation.id,
                new_count
            )
            .await?;

        // Check if series is complete
        if let Some(total) = recurring_donation.total_payments_count {
            if new_count >= total {
                self.donation_service.complete_recurring_donation(recurring_donation.id).await?;
                return Ok(());
            }
        }

        // Schedule next payment
        self.donation_service.schedule_next_payment(recurring_donation).await?;
    } else {
        // Handle failed payment
        self.donation_service.handle_failed_recurring_payment(recurring_donation).await?;
    }

    Ok(())
}

// ============= Status Management =============

/// Updates the status of a recurring donation with validation
///
/// # Arguments
/// * `id` - Donation ID
/// * `status` - New status to set
///
/// # Returns
/// Updated donation record
pub async fn update_recurring_donation_status(
    &self,
    id: i32,
    status: DonationStatus
) -> Result<RecurringDonation> {
    // Get current donation
    let donation = self.donation_service
        .get_recurring_donation(id)
        .await?;

    // Validate status transition
    self.donation_service.validate_recurring_status_transition(&donation.status, &status)?;

    // Update status
    let updated_donation = self.donation_service
        .update_recurring_donation_status(id, status)
        .await?;

    // Handle status-specific actions
    match &status {
        DonationStatus::Cancelled => {
            self.donation_service.cancel_scheduled_payments(&updated_donation).await?;
        }
        DonationStatus::Completed => {
            if donation.status == DonationStatus::Pending {
                self.donation_service.schedule_next_payment(&updated_donation).await?;
            }
        }
        _ => {}
    }

    Ok(updated_donation)
}

// ============= Validation Methods =============

/// Validates a recurring donation's basic parameters
///
/// # Checks:
/// - Positive donation amount
/// - Valid payment count (if specified)
/// - Currency validity
fn validate_recurring_donation(&self, donation: &RecurringDonation) -> Result<()> {
    // Validate amount
    if donation.amount <= Decimal::ZERO {
        return Err(anyhow::anyhow!("Donation amount must be positive"));
    }

    // Validate payment count if specified
    if let Some(total) = donation.total_payments_count {
        if total <= 0 {
            return Err(anyhow::anyhow!("Total payments count must be positive"));
        }
    }

    Ok(())
}

/// Validates status transitions for recurring donations
///
/// # Arguments
/// * `current` - Current donation status
/// * `new` - Proposed new status
///
/// # Returns
/// * `Ok(())` if transition is valid
/// * `Err` with message if invalid
fn validate_recurring_status_transition(
    current: &DonationStatus,
    new: &DonationStatus
) -> Result<()> {
    match (current, new) {
        // Valid transitions from Pending
        (DonationStatus::Pending, DonationStatus::Completed) |
        (DonationStatus::Pending, DonationStatus::Failed) |
        (DonationStatus::Pending, DonationStatus::Refunded) |
        (DonationStatus::Pending, DonationStatus::Cancelled) => Ok(()),

        // Valid transitions from Completed
        (DonationStatus::Completed, DonationStatus::Refunded) |
        (DonationStatus::Completed, DonationStatus::Cancelled) => Ok(()),

        // Valid transitions from Failed
        (DonationStatus::Failed, DonationStatus::Completed) |
        (DonationStatus::Failed, DonationStatus::Cancelled) => Ok(()),

        // Invalid transitions
        _ => Err(anyhow::anyhow!(
            "Invalid status transition from {:?} to {:?}",
            current,
            new
        ))
    }
}

// ============= Database Operations =============

/// Creates a new recurring donation in the database
///
/// # Arguments
/// * `recurring_donation` - Donation to create
///
/// # Returns
/// Created donation with database-generated fields
pub async fn create_recurring_donation(
    &self,
    recurring_donation: &RecurringDonation
) -> Result<RecurringDonation> {
    let result = sqlx::query(
        r#"
        INSERT INTO recurring_donations (
            user_id, amount, currency, frequency, payment_method,
            status, start_date, next_payment_date, end_date,
            total_payments_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        "#
    )
    .bind(recurring_donation.user_id)
    .bind(recurring_donation.amount)
    .bind(&recurring_donation.currency)
    .bind(&recurring_donation.frequency)
    .bind(recurring_donation.payment_method.to_string())
    .bind(recurring_donation.status.to_string())
    .bind(recurring_donation.start_date)
    .bind(recurring_donation.next_payment_date)
    .bind(recurring_donation.end_date)
    .bind(recurring_donation.total_payments_count)
    .fetch_one(&self.pool)
    .await?;

    self.map_to_recurring_donation(result)
}

/// Updates payment count for a recurring donation
///
/// # Arguments
/// * `id` - Donation ID
/// * `count` - New payment count
pub async fn update_recurring_donation_payment_count(
    &self,
    id: i32,
    count: i32
) -> Result<RecurringDonation> {
    let result = sqlx::query(
        r#"
        UPDATE recurring_donations
        SET
            completed_payments_count = $1,
            last_payment_date = NOW(),
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
        "#
    )
    .bind(count)
    .bind(id)
    .fetch_one(&self.pool)
    .await?;

    self.map_to_recurring_donation(result)
}

/// Retrieves a specific recurring donation
pub async fn get_recurring_donation(&self, id: i32) -> Result<RecurringDonation> {
    let result = sqlx::query(
        r#"
        SELECT *
        FROM recurring_donations
        WHERE id = $1
        "#
    )
    .bind(id)
    .fetch_one(&self.pool)
    .await?;

    self.map_to_recurring_donation(result)
}

/// Retrieves all donations associated with a recurring donation
pub async fn get_donations_by_recurring_id(&self, recurring_id: i32) -> Result<Vec<Donation>> {
    let rows = sqlx::query(
        r#"
        SELECT *
        FROM donations
        WHERE recurring_donation_id = $1
        ORDER BY created_at DESC
        "#
    )
    .bind(recurring_id)
    .fetch_all(&self.pool)
    .await?;

    let mut donations = Vec::new();
    for row in rows {
        donations.push(self.map_to_donation(row)?);
    }

    Ok(donations)
}

// ============= Helper Methods =============
/// Maps a database row to a RecurringDonation struct

fn map_to_recurring_donation(&self, row: sqlx::postgres::PgRow) -> Result<RecurringDonation> {
    let recurring_donation = RecurringDonation {
        id: row.try_get("id")?,
        user_id: row.try_get("user_id")?,
        amount: row.try_get("amount")?,
        currency: row.try_get("currency")?,
        frequency: row.try_get("frequency")?,
        payment_method: PaymentMethodType::from_str(&row.try_get::<String, _>("payment_method")?)?,
        status: DonationStatus::from_str(&row.try_get::<String, _>("status")?)?,
        start_date: row.try_get("start_date")?,
        next_payment_date: row.try_get("next_payment_date")?,
        end_date: row.try_get("end_date")?,
        total_payments_count: row.try_get("total_payments_count")?,
        completed_payments_count: row.try_get("completed_payments_count")?,
        last_payment_date: row.try_get("last_payment_date")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?
    };

    Ok(recurring_donation)
}

/// Maps a database row to a Donation struct
fn map_to_donation(&self, row: sqlx::postgres::PgRow) -> Result<Donation> {
    Ok(Donation {
        id: row.try_get("id")?,
        amount: row.try_get("amount")?,
        currency: row.try_get("currency")?,
        status: DonationStatus::from_str(&row.try_get::<String, _>("status")?)?,
        payment_method: PaymentMethodType::from_str(&row.try_get::<String, _>("payment_method")?)?,
        transaction_id: row.try_get("transaction_id")?,
        donor_name: row.try_get("donor_name")?,
        donor_email: row.try_get("donor_email")?,
        donor_phone: row.try_get("donor_phone")?,
        user_id: row.try_get("user_id")?,
        message: row.try_get("message")?,
        is_anonymous: row.try_get("is_anonymous")?,
        converted_amount_usd: row.try_get("converted_amount_usd")?,
        ip_address: row.try_get("ip_address")?,
        country_code: row.try_get("country_code")?,
        created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?
        })
    }
}

