//! Donation Service Module
//!
//! This module handles all business logic for donations including:
//! - One-time donations processing
//! - Recurring donation management
//! - Payment processing and validation
//! - Currency conversion
//! - Notification handling
//! - Statistics and reporting

use anyhow::Result;
use chrono::{DateTime, Duration as ChronoDuration, Utc, TimeZone};
use rust_decimal::prelude::Zero;
use rust_decimal::Decimal;
use super::currency_service::CurrencyService;
use crate::donation::donation::{Donation, DonationStatus};
use crate::donation::recurring_donation::{DonationFrequency, RecurringDonation};
use crate::donation::notification_service::NotificationService;
use crate::donation::payment_method::{PaymentMethod, PaymentMethodType};
use crate::donation::payment_method_service::PaymentMethodService;
use crate::donation::donation_repository::{DonationRepository, DonationSearchQuery, DonationStatistics};

// ============= Type Definitions =============

/// Core service for handling all donation-related operations
pub struct DonationService {
    donation_repository: DonationRepository,
    payment_method_service: PaymentMethodService,
    notification_service: NotificationService,
    currency_service: CurrencyService,
}

impl DonationService {
    /// Creates a new DonationService instance with required dependencies
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

    // ============= One-Time Donation Methods =============

    /// Processes a one-time donation with payment validation and processing
    ///
    /// # Arguments
    /// * `donation` - The donation details to process
    /// * `payment_token` - Token for payment processing
    ///
    /// # Returns
    /// * `Result<Donation>` - Processed donation or error
    pub async fn process_donation(
        &self,
        mut donation: Donation,
        payment_token: String,
    ) -> Result<Donation> {
        // Convert currency and calculate USD equivalent
        self.process_currency_conversion(&mut donation).await?;

        // Process payment through payment service
        let payment = self.payment_method_service
            .process_payment(&payment_token, donation.amount)
            .await?;

        // Update donation with payment results
        donation.transaction_id = Some(payment.transaction_id);
        donation.status = if payment.success {
            DonationStatus::Completed
        } else {
            DonationStatus::Failed
        };

        // Save to database
        let donation = self.donation_repository
            .create_donation(&donation)
            .await?;

        // Send success notification if applicable
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


    // Get donation by id
    pub async fn get_donation(&self, id: i32) -> Result<Donation> {
        let donation = self.donation_repository.get_donation(id).await?;

        donation.ok_or_else(|| anyhow::anyhow!("Donation not found"))
    }

    // Get donation statistics
    pub async fn get_donation_statistics(&self) -> Result<DonationStatistics> {
        self.donation_repository.get_donation_statistics().await
    }

    // Get donation by tax year
    pub async fn get_donations_by_tax_year(&self, tax_year: i32) -> Result<Vec<Donation>> {
        let start_date = Utc.with_ymd_and_hms(tax_year, 1, 1, 0, 0, 0).unwrap();
        let end_date = Utc.with_ymd_and_hms(tax_year, 12, 31, 23, 59, 59).unwrap();


        self.donation_repository.get_donations_by_tax_year(start_date, end_date).await
    }


    /// Retrieves donation history for a specific user
    pub async fn get_user_donation_history(&self, user_id: i32) -> Result<Vec<Donation>> {
        self.donation_repository.get_user_donations(user_id).await
    }

    /// Searches donations based on provided criteria
    pub async fn search_donations(&self, query: DonationSearchQuery) -> Result<Vec<Donation>> {
        let page = query.page.unwrap_or(1);
        let per_page = query.per_page.unwrap_or(20);
        let offset = (page - 1) * per_page;

        self.donation_repository
            .search_donations(query, offset as i64, per_page as i64)
            .await
    }

    // ============= Recurring Donation Methods =============


    // Create a new recurring donation
    pub async fn create_recurring_donation(
        &self,
        recurring_donation: RecurringDonation,
        payment_token: String
    ) -> Result<RecurringDonation> {
        // Validate payment method
        let payment_method = PaymentMethod::validate_payment_method(
            &payment_token,
            PaymentMethodType::CreditCard
        ).await?;

        self.payment_method_service.store_payment_method(payment_method, &payment_token).await?;

        // Create the recurring donation
        self.donation_repository.create_recurring_donation(&recurring_donation).await?;

        // Schedule the next payment
        self.schedule_next_payment(&recurring_donation).await?;

        // Send confirmation notification
        self.notification_service
            .send_donation_success_notification(
                recurring_donation.user_id,
                recurring_donation.id,
                &recurring_donation.currency,
                recurring_donation.amount,
                true
            )
            .await?;

        Ok(recurring_donation)
    }

    /// Sets up a new recurring donation subscription
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
            .store_payment_method(payment_method, &payment_token)
            .await?;

        // Initialize recurring donation
        let mut new_recurring_donation = recurring_donation;
        new_recurring_donation.payment_method = stored_payment_method.payment_type;
        new_recurring_donation.next_payment_date = self.calculate_next_payment_date(
            Utc::now(),
            &new_recurring_donation.frequency
        );
        new_recurring_donation.status = DonationStatus::Completed;
        new_recurring_donation.completed_payments_count = 0;
        new_recurring_donation.start_date = Utc::now();

        // Validate donation parameters
        self.validate_recurring_donation(&new_recurring_donation)?;

        // Save and schedule next payment
        let saved_donation = self.donation_repository
            .create_recurring_donation(&new_recurring_donation)
            .await?;

        self.schedule_next_payment(&saved_donation).await?;

        // Send confirmation notification
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

    // Get recurring donation by id
    pub async fn get_recurring_donation(&self, id: i32) -> Result<RecurringDonation> {
        self.donation_repository.get_recurring_donation(id).await
    }

    // Get recurring donation by tax year
    pub async fn get_recurring_donations_by_tax_year(&self, tax_year: i32) -> Result<Vec<RecurringDonation>> {
        let start_date = Utc.with_ymd_and_hms(tax_year, 1, 1, 0, 0, 0).unwrap();
        let end_date = Utc.with_ymd_and_hms(tax_year + 1, 1, 1, 0, 0, 0).unwrap();

        self.donation_repository.get_recurring_donations_by_tax_year(start_date, end_date).await
    }

    /// Updates the status of a recurring donation
    pub async fn update_recurring_donation_status(
        &self,
        id: i32,
        status: DonationStatus
    ) -> Result<RecurringDonation> {
        // Get current donation
        let donation = self.donation_repository
            .get_recurring_donation(id)
            .await?;

        // Validate status transition
        self.validate_recurring_status_transition(&donation.status, &status)?;

        // Update status
        let updated_donation = self.donation_repository
            .update_recurring_donation_status(id, status)
            .await?;

        // Handle status-specific actions
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

    // ============= Helper Methods =============

    /// Processes recurring payments that are due
    async fn process_recurring_payment(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        // Verify donation is still active
        if recurring_donation.status != DonationStatus::Completed {
            return Ok(());
        }

        // Create new donation instance for this payment
        let donation = Donation {
            user_id: Some(recurring_donation.user_id),
            amount: recurring_donation.amount,
            currency: recurring_donation.currency.clone(),
            payment_method: recurring_donation.payment_method.clone(),
            status: DonationStatus::Pending,
            created_at: Utc::now(),
            ..Default::default()
        };

        // Process the payment
        let processed_donation = self.process_donation(
            donation,
            recurring_donation.payment_method.to_string()
        ).await?;

        // Handle payment result
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

    /// Calculates the next payment date based on frequency
    pub fn calculate_next_payment_date(
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

    /// Validates recurring donation parameters
   pub fn validate_recurring_donation(&self, donation: &RecurringDonation) -> Result<()> {
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

    /// Validates status transitions for recurring donations
    pub fn validate_recurring_status_transition(
        &self,
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

    /// Processes currency conversion for donations
    async fn process_currency_conversion(&self, donation: &mut Donation) -> Result<()> {
        let currency = self.currency_service.get_currency(&donation.currency).await?;
        donation.converted_amount_usd = currency.to_usd(donation.amount);
        Ok(())
    }


    // Update the payment count for a recurring donation
    pub async fn update_recurring_donation_payment_count(&self, id: i32, count: i32) -> Result<RecurringDonation> {
        self.donation_repository.update_recurring_donation_payment_count(id, count).await
    }

    // ============= Private Helper Methods =============

    /// Schedules the next payment for a recurring donation
    pub async fn schedule_next_payment(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        let next_payment_date = self.calculate_next_payment_date(
            recurring_donation.next_payment_date,
            &recurring_donation.frequency
        );

        self.donation_repository
            .update_next_payment_date(recurring_donation.id, next_payment_date)
            .await?;

        Ok(())
    }

    /// Marks a recurring donation as completed
    pub async fn complete_recurring_donation(&self, donation_id: i32) -> Result<()> {
        self.donation_repository
            .update_recurring_donation_status(donation_id, DonationStatus::Completed)
            .await?;
        Ok(())
    }

    /// Handles failed recurring payments
    pub async fn handle_failed_recurring_payment(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        self.donation_repository
            .update_recurring_donation_status(recurring_donation.id, DonationStatus::Failed)
            .await?;
        Ok(())
    }

    /// Cancels all scheduled payments for a recurring donation
    pub async fn cancel_scheduled_payments(&self, recurring_donation: &RecurringDonation) -> Result<()> {
        self.donation_repository
            .cancel_recurring_donation(recurring_donation.id)
            .await?;
        Ok(())
    }
}
