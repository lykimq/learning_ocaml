//! Recurring Donation Module
//!
//! This module defines the core types and implementations for recurring donations:
//! - Donation frequency definitions
//! - Recurring donation structure
//! - Payment scheduling logic
//! - Status management
//! - Activity validation

use chrono::{DateTime, Duration, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use super::payment_method::PaymentMethodType;
use crate::donation::donation::DonationStatus;

// ============= Type Definitions =============

/// Defines the frequency of recurring donations
///
/// Used to determine when the next payment should be processed
/// and how often donations should recur.
#[derive(Debug, Serialize, Deserialize, sqlx::Type, PartialEq, Clone)]
#[sqlx(type_name = "donation_frequency", rename_all = "lowercase")]
pub enum DonationFrequency {
    /// One-time donation, no recurrence
    OneTime,

    /// Processes every day
    Daily,

    /// Processes every week
    Weekly,

    /// Processes every month
    Monthly,

    /// Processes every three months
    Quarterly,

    /// Processes every year
    Yearly,
}

/// Represents a recurring donation setup
///
/// Tracks all aspects of a recurring donation including:
/// - Payment details
/// - Schedule information
/// - Processing status
/// - Payment history
#[derive(Debug, Deserialize, Serialize, sqlx::FromRow, PartialEq)]
pub struct RecurringDonation {
    /// Unique identifier for the recurring donation
    pub id: i32,

    /// ID of the user who set up the donation
    pub user_id: i32,

    /// Amount to charge for each recurring payment
    pub amount: Decimal,

    /// Three-letter currency code (e.g., USD, EUR)
    pub currency: String,

    /// Current status of the recurring donation
    pub status: DonationStatus,

    /// How often the donation should recur
    pub frequency: DonationFrequency,

    /// Payment method used for processing
    pub payment_method: PaymentMethodType,

    /// When the recurring donation begins
    pub start_date: DateTime<Utc>,

    /// When the next payment should be processed
    pub next_payment_date: DateTime<Utc>,

    /// Optional end date for the recurring series
    pub end_date: Option<DateTime<Utc>>,

    /// Optional limit on total number of payments
    pub total_payments_count: Option<i32>,

    /// Number of payments successfully processed
    pub completed_payments_count: i32,

    /// When the last payment was processed
    pub last_payment_date: Option<DateTime<Utc>>,

    /// When the recurring donation was created
    pub created_at: DateTime<Utc>,

    /// When the recurring donation was last updated
    pub updated_at: DateTime<Utc>,
}

// ============= Implementation =============

impl Default for RecurringDonation {
    /// Creates a new recurring donation with default values
    fn default() -> Self {
        Self {
            id: 0,
            user_id: 0,
            amount: Decimal::new(0, 0),
            currency: "USD".to_string(),
            status: DonationStatus::Pending,
            frequency: DonationFrequency::Monthly,
            payment_method: PaymentMethodType::CreditCard,
            start_date: Utc::now(),
            next_payment_date: Utc::now(),
            end_date: None,
            total_payments_count: None,
            completed_payments_count: 0,
            last_payment_date: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

impl RecurringDonation {
    /// Creates a new recurring donation with specified values
    ///
    /// # Arguments
    /// * `user_id` - ID of the donor
    /// * `amount` - Amount to charge per payment
    /// * `currency` - Currency code
    /// * `frequency` - How often to process payments
    /// * `payment_method` - Method to use for charging
    /// * `start_date` - When to begin processing
    pub fn new(
        user_id: i32,
        amount: Decimal,
        currency: String,
        frequency: DonationFrequency,
        payment_method: PaymentMethodType,
        start_date: DateTime<Utc>,
    ) -> Self {
        Self {
            user_id,
            amount,
            currency,
            frequency,
            payment_method,
            start_date,
            next_payment_date: start_date,
            ..Default::default()
        }
    }

    /// Calculates the next payment date based on frequency
    ///
    /// Handles different intervals and edge cases:
    /// - Daily: Adds 24 hours
    /// - Weekly: Adds 7 days
    /// - Monthly: Adds one month, handling month boundaries
    /// - Quarterly: Adds three months
    /// - Yearly: Adds one year
    /// - OneTime: Returns current next payment date
    pub fn calculate_next_payment_date(&self) -> DateTime<Utc> {
        match self.frequency {
            DonationFrequency::Daily => self.next_payment_date + Duration::days(1),

            DonationFrequency::Weekly => self.next_payment_date + Duration::weeks(1),

            DonationFrequency::Monthly => {
                // Handle month boundaries correctly
                let next = self.next_payment_date.naive_utc();
                let next = next
                    .checked_add_months(chrono::Months::new(1))
                    .unwrap_or(next);
                DateTime::<Utc>::from_naive_utc_and_offset(next, Utc)
            }

            DonationFrequency::Quarterly => {
                let next = self.next_payment_date.naive_utc();
                let next = next
                    .checked_add_months(chrono::Months::new(3))
                    .unwrap_or(next);
                DateTime::<Utc>::from_naive_utc_and_offset(next, Utc)
            }

            DonationFrequency::Yearly => {
                let next = self.next_payment_date.naive_utc();
                let next = next
                    .checked_add_months(chrono::Months::new(12))
                    .unwrap_or(next);
                DateTime::<Utc>::from_naive_utc_and_offset(next, Utc)
            }

            DonationFrequency::OneTime => self.next_payment_date,
        }
    }

    /// Checks if the recurring donation is currently active
    ///
    /// A donation is considered active if:
    /// 1. Status is valid for processing
    /// 2. End date hasn't been reached (if set)
    /// 3. Payment count hasn't reached limit (if set)
    pub fn is_active(&self) -> bool {
        // Check status is valid for processing
        let valid_status = matches!(
            self.status,
            DonationStatus::Pending
                | DonationStatus::Completed
                | DonationStatus::Refunded
                | DonationStatus::Cancelled
        );

        // Check end date hasn't been reached
        let before_end_date = self.end_date.map_or(true, |end_date| end_date > Utc::now());

        // Check payment count hasn't reached limit
        let under_payment_limit = self
            .total_payments_count
            .map_or(true, |total| total > self.completed_payments_count);

        valid_status && before_end_date && under_payment_limit
    }
}
