//! Donation Service Module
//! Handles all business logic for donations and recurring donations

use std::sync::Arc;

use anyhow::Result;
use rust_decimal::Decimal;
use chrono::{DateTime, Utc, Duration as ChronoDuration};
use serde::{Deserialize, Serialize};
use super::currency_service::CurrencyService;
use crate::donation::donation::{Donation, DonationStatus, RecurringDonation, DonationFrequency};
use crate::donation::payment_method::{PaymentMethodType, PaymentMethod};
use crate::donation::notification_service::NotificationService;
use crate::donation::donation_repository::DonationRepository;
use rust_decimal::prelude::Zero;
use crate::donation::payment_method_service::PaymentMethodService;

// ============= Service Types =============

/// Service for handling all donation-related operations
pub struct DonationService {
    donation_repository: DonationRepository,
    payment_method_service: PaymentMethodService,
    notification_service: NotificationService,
    currency_service: CurrencyService,
}

/// Query parameters for searching donations
#[derive(Debug, Deserialize)]
pub struct DonationSearchQuery {
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub min_amount: Option<Decimal>,
    pub max_amount: Option<Decimal>,
    pub status: Option<DonationStatus>,
    pub currency: Option<String>,
    pub donor_email: Option<String>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

/// Statistics about donations
#[derive(Debug, Serialize)]
pub struct DonationStatistics {
    pub total_amount: Decimal,
    pub total_count: i64,
    pub average_amount: Decimal,
    pub currency_breakdown: Vec<CurrencyStats>,
    pub status_breakdown: Vec<StatusStats>,
    pub monthly_totals: Vec<MonthlyStats>,
}

#[derive(Debug, Serialize)]
pub struct CurrencyStats {
    pub currency: String,
    pub total_amount: Decimal,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct StatusStats {
    pub status: DonationStatus,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct MonthlyStats {
    pub month: DateTime<Utc>,
    pub total_amount: Decimal,
    pub count: i64,
}

impl DonationService {
    /// Creates a new DonationService instance
    pub fn new(
        donation_repository: DonationRepository,
        payment_method_service: PaymentMethodService,
        notification_service: NotificationService,
        currency_service: CurrencyService,
    ) -> Self {
        Self {
            donation_repository,
            payment_method_service,
            notification_service,
            currency_service,
        }
    }

    // ============= One-Time Donation Operations =============

    /// Processes a one-time donation
    ///
    /// # Arguments
    /// * `donation` - The donation to process
    /// * `payment_token` - Token for payment processing
    pub async fn process_donation(
        &self,
        mut donation: Donation,
        payment_token: String,
    ) -> Result<Donation> {
        // Process currency conversion
        self.process_currency_conversion(&mut donation).await?;

        // Process payment
        let payment = self.payment_method_service
            .process_payment(&payment_token, donation.amount)
            .await?;

        // Update donation with payment result
        donation.transaction_id = Some(payment.transaction_id);
        donation.status = if payment.success {
            DonationStatus::Completed
        } else {
            DonationStatus::Failed
        };

        // Save donation
        let donation = self.donation_repository
            .create_donation(&donation)
            .await?;

        // Send notification
        if donation.status == DonationStatus::Completed {
            self.notification_service
                .send_donation_success_notification(
                    donation.user_id.unwrap(),
                    donation.id,
                    &donation.currency,
                    donation.amount,
                    false
                )
                .await?;
        }

        Ok(donation)
    }

    // ============= Recurring Donation Operations =============

    /// Sets up a new recurring donation
    ///
    /// # Arguments
    /// * `recurring_donation` - The recurring donation details
    /// * `payment_token` - Token for payment method validation
    pub async fn setup_recurring_donation(
        &self,
        recurring_donation: RecurringDonation,
        payment_token: String
    ) -> Result<RecurringDonation> {
        // 1. Validate the payment method
        let payment_method = PaymentMethod::validate_payment_method(&payment_token, PaymentMethodType::CreditCard)
            .await?;

        // 2. Store the payment method for future use
        let stored_payment_method = self.payment_method_service
            .store_payment_method(payment_method)
            .await?;

        // 3. Calculate the next payment date
        let next_payment_date = self.calculate_next_payment_date(
            Utc::now(),
            &recurring_donation.frequency
        );

        // 4. Create the recurring donation record
        let mut new_recurring_donation = recurring_donation;
        new_recurring_donation.payment_method = stored_payment_method.payment_type;
        new_recurring_donation.next_payment_date = next_payment_date;
        new_recurring_donation.status = DonationStatus::Completed;
        new_recurring_donation.completed_payments_count = 0;
        new_recurring_donation.start_date = Utc::now();

        // 5. Validate donation amount and currency
        self.validate_recurring_donation(&new_recurring_donation)?;

        // 6. Save to database
        let saved_donation = self.donation_repository
            .create_recurring_donation(&new_recurring_donation)
            .await?;

        // 7. Schedule the next payment
        self.schedule_next_payment(&saved_donation).await?;

        // 8. Send confirmation notification
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

    /// Processes the next scheduled payment for a recurring donation
    async fn process_recurring_payment(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        // 1. Verify donation is still active
        if recurring_donation.status != DonationStatus::Completed {
            return Ok(());
        }

        // 2. Create a new donation instance
        let donation = Donation {
            user_id: Some(recurring_donation.user_id),
            amount: recurring_donation.amount,
            currency: recurring_donation.currency.clone(),
            payment_method: recurring_donation.payment_method.clone(),
            status: DonationStatus::Pending,
            created_at: Utc::now(),
            ..Default::default()
        };

        // 3. Process the payment
        let processed_donation = self.process_donation(
            donation,
            recurring_donation.payment_method.to_string()
        ).await?;

        // 4. Handle the payment result
        if processed_donation.status == DonationStatus::Completed {
            let new_count = recurring_donation.completed_payments_count + 1;

            // Update payment count
            self.donation_repository
                .update_recurring_donation_payment_count(
                    recurring_donation.id,
                    new_count
                )
                .await?;

            // Check if we've reached the total payments limit
            if let Some(total) = recurring_donation.total_payments_count {
                if new_count >= total {
                    self.complete_recurring_donation(recurring_donation.id).await?;
                    return Ok(());
                }
            }

            // Schedule next payment
            self.schedule_next_payment(recurring_donation).await?;
        } else {
            // Handle failed payment
            self.handle_failed_recurring_payment(recurring_donation).await?;
        }

        Ok(())
    }

    // ============= Status Management =============

    /// Updates the status of a recurring donation
    pub async fn update_recurring_donation_status(
        &self,
        id: i32,
        status: DonationStatus
    ) -> Result<RecurringDonation> {
        // 1. Get current donation
        let donation = self.donation_repository
            .get_recurring_donation(id)
            .await?;

        // 2. Validate status transition
        self.validate_recurring_status_transition(&donation.status, &status)?;

        // 3. Update status
        let updated_donation = self.donation_repository
            .update_recurring_donation_status(id, status)
            .await?;

        // 4. Handle status-specific actions
        let status = status.clone();
        match &status {
            DonationStatus::Cancelled => {
                self.cancel_scheduled_payments(&updated_donation).await?;
            }
            DonationStatus::Completed => {
                if donation.status == DonationStatus::Pending {
                    self.schedule_next_payment(&updated_donation).await?;
                }
            }
            _ => {}
        }

        Ok(updated_donation)
    }

    // ============= Query Operations =============

    /// Retrieves donation history for a user
    pub async fn get_user_donation_history(&self, user_id: i32) -> Result<Vec<Donation>> {
        self.donation_repository.get_user_donations(user_id).await
    }

    /// Searches donations based on criteria
    pub async fn search_donations(&self, query: DonationSearchQuery) -> Result<Vec<Donation>> {
        let page = query.page.unwrap_or(1);
        let per_page = query.per_page.unwrap_or(20);
        let offset = (page - 1) * per_page;

        let donations = sqlx::query_as!(
            Donation,
            r#"
            SELECT
                id,
                amount,
                currency,
                status as "status: DonationStatus",
                payment_method as "payment_method: PaymentMethodType",
                transaction_id,
                donor_name,
                donor_email,
                donor_phone,
                user_id,
                message,
                COALESCE(is_anonymous, false) as "is_anonymous!: bool",
                converted_amount_usd,
                ip_address,
                country_code,
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>"
            FROM donations
            WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            AND ($2::timestamptz IS NULL OR created_at <= $2)
            AND ($3::decimal IS NULL OR amount >= $3)
            AND ($4::decimal IS NULL OR amount <= $4)
            AND ($5::donation_status IS NULL OR status = $5)
            AND ($6::text IS NULL OR currency = $6)
            AND ($7::text IS NULL OR donor_email = $7)
            ORDER BY created_at DESC
            LIMIT $8 OFFSET $9
            "#,
            query.start_date,
            query.end_date,
            query.min_amount,
            query.max_amount,
            query.status as _,
            query.currency,
            query.donor_email,
            per_page as i64,
            offset as i64
        )
        .fetch_all(&self.donation_repository.pool)
        .await?;

        Ok(donations)
    }

    // ============= Helper Functions =============

    /// Validates a recurring donation
    fn validate_recurring_donation(&self, donation: &RecurringDonation) -> Result<()> {
        if donation.amount <= Decimal::zero() {
            return Err(anyhow::anyhow!("Donation amount must be positive"));
        }

        if let Some(total) = donation.total_payments_count {
            if total <= 0 {
                return Err(anyhow::anyhow!("Total payments count must be positive"));
            }
        }

        Ok(())
    }

    /// Validates recurring donation status transitions
    fn validate_recurring_status_transition(
        &self,
        current: &DonationStatus,
        new: &DonationStatus
    ) -> Result<()> {

        match (current, new) {
            // Pending to Completed, Failed, Refunded, or Cancelled
            (DonationStatus::Pending, DonationStatus::Completed) => Ok(()),
            (DonationStatus::Pending, DonationStatus::Failed) => Ok(()),
            (DonationStatus::Pending, DonationStatus::Refunded) => Ok(()),
            (DonationStatus::Pending, DonationStatus::Cancelled) => Ok(()),

            // From Completed, can only be Refuned or Cancelled
            (DonationStatus::Completed, DonationStatus::Refunded) => Ok(()),
            (DonationStatus::Completed, DonationStatus::Cancelled) => Ok(()),

            // From Failed, can retry (back to Completed) or Cancelled
            (DonationStatus::Failed, DonationStatus::Completed) => Ok(()),
            (DonationStatus::Failed, DonationStatus::Cancelled) => Ok(()),

            // Terminal states - no transitions allowed from Refunded or Cancelled

            _ => Err(anyhow::anyhow!(
                "Invalid status transition from {:?} to {:?}",
                current,
                new
            ))
        }
    }

    /// Calculates the next payment date based on frequency
    fn calculate_next_payment_date(
        &self,
        current: DateTime<Utc>,
        frequency: &DonationFrequency
    ) -> DateTime<Utc> {
        match frequency {
            DonationFrequency::OneTime => current,
            DonationFrequency::Daily => current + ChronoDuration::days(1),
            DonationFrequency::Weekly => current + ChronoDuration::weeks(1),
            DonationFrequency::Monthly => current + ChronoDuration::days(30),
            DonationFrequency::Quarterly => current + ChronoDuration::days(90),
            DonationFrequency::Yearly => current + ChronoDuration::days(365),
        }
    }

    // Schedule next payment
    async fn schedule_next_payment(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        let next_payment_date =
         self.calculate_next_payment_date(
            recurring_donation.next_payment_date,
            &recurring_donation.frequency
        );

        sqlx::query!(
            r#"
            UPDATE recurring_donations
            SET next_payment_date = $1
            WHERE id = $2
            "#,
            next_payment_date.naive_utc(),
            recurring_donation.id
        )
        .execute(&self.donation_repository.pool)
        .await?;

        Ok(())
    }

    // Complete recurring donation
    async fn complete_recurring_donation(&self, donation_id: i32) -> Result<()> {

        sqlx::query!(
            r#"
            UPDATE recurring_donations
            SET status = 'completed'
            WHERE id = $1
            "#,
            donation_id
        )
        .execute(&self.donation_repository.pool)
        .await?;

        Ok(())
    }

    // Handle failed recurring payment
    async fn handle_failed_recurring_payment(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE recurring_donations
            SET status = 'failed'
            WHERE id = $1
            "#,
            recurring_donation.id
        )
        .execute(&self.donation_repository.pool)
        .await?;

        Ok(())
    }


    // Cancel scheduled payments
    async fn cancel_scheduled_payments(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE recurring_donations
            SET status = 'cancelled',
                next_payment_date = NULL
            WHERE id = $1
            "#,
            recurring_donation.id
        )
        .execute(&self.donation_repository.pool)
        .await?;

        Ok(())
    }

    /// Processes currency conversion
    async fn process_currency_conversion(&self, donation: &mut Donation) -> Result<()> {
        let currency = self.currency_service.get_currency(&donation.currency).await?;
        donation.converted_amount_usd = currency.to_usd(donation.amount);
        Ok(())
    }
}