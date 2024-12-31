//! Donation Types Module
//!
//! This module defines the core types and enums used throughout the donation system.
//! It includes:
//! - One-time donation types
//! - Recurring donation types
//! - Payment method types
//! - Status enums
//! - Currency handling

use super::payment_method::PaymentMethodType;
use actix_web::cookie::time::Duration;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Type;
use std::str::FromStr;

// ============= Status Enums =============

/// Status of a donation
///
/// Represents the current state of a donation in the system.
#[derive(Debug, Serialize, Deserialize, sqlx::Type, PartialEq, Clone, Copy)]
#[sqlx(type_name = "donation_status", rename_all = "lowercase")]
pub enum DonationStatus {
    /// Payment is being processed
    Pending,
    /// Payment was successful
    Completed,
    /// Payment failed
    Failed,
    /// Payment was refunded
    Refunded,
    /// Donation was cancelled before processing
    Cancelled,
}

impl std::fmt::Display for DonationStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.to_string())
    }
}

impl FromStr for DonationStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(Self::Pending),
            "completed" => Ok(Self::Completed),
            "failed" => Ok(Self::Failed),
            "refunded" => Ok(Self::Refunded),
            "cancelled" => Ok(Self::Cancelled),
            _ => Err(anyhow::anyhow!("Invalid donation status: {}", s)),
        }
    }
}

/// Frequency of recurring donations
///
/// Defines how often a recurring donation should be processed.
#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "donation_frequency", rename_all = "lowercase")]
pub enum DonationFrequency {
    /// Single donation, no recurrence
    OneTime,
    /// Repeats every day
    Daily,
    /// Repeats every week
    Weekly,
    /// Repeats every month
    Monthly,
    /// Repeats every three months
    Quarterly,
    /// Repeats every year
    Yearly,
}

// ============= Core Types =============

/// One-time donation
///
/// Represents a single donation transaction in the system.
#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct Donation {
    /// Unique identifier
    pub id: i32,
    /// Donation amount in specified currency
    pub amount: Decimal,
    /// Currency code (e.g., USD, EUR)
    pub currency: String,
    /// Current status of the donation
    #[sqlx(rename = "status")]
    pub status: DonationStatus,
    /// Payment method used
    #[sqlx(rename = "payment_method")]
    pub payment_method: PaymentMethodType,
    /// External payment processor transaction ID
    pub transaction_id: Option<String>,
    /// Name of the donor (optional for anonymous)
    pub donor_name: Option<String>,
    /// Email of the donor
    pub donor_email: Option<String>,
    /// Phone number of the donor
    pub donor_phone: Option<String>,
    /// Associated user ID if donor is registered
    pub user_id: Option<i32>,
    /// Optional message from donor
    pub message: Option<String>,
    /// Whether the donation is anonymous
    pub is_anonymous: bool,
    /// Amount converted to USD for reporting
    pub converted_amount_usd: Decimal,
    /// IP address of the donor
    pub ip_address: Option<String>,
    /// Country code derived from IP or payment info
    pub country_code: Option<String>,
    /// When the donation was created
    pub created_at: DateTime<Utc>,
    /// When the donation was last updated
    pub updated_at: DateTime<Utc>,
}

/// Recurring donation
///
/// Represents a recurring donation setup with scheduled payments.
#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct RecurringDonation {
    /// Unique identifier
    pub id: i32,
    /// User ID
    pub user_id: i32,
    /// Amount to be charged each time
    pub amount: Decimal,
    /// Currency code (3 letters)
    pub currency: String,
    /// Current status of the recurring donation
    pub status: DonationStatus,
    /// How often the donation should be processed
    pub frequency: DonationFrequency,
    /// Payment method to use
    pub payment_method: PaymentMethodType,
    /// When the recurring donation starts
    pub start_date: DateTime<Utc>,
    /// When the next payment should be processed
    pub next_payment_date: DateTime<Utc>,
    /// Optional end date for the recurring donation
    pub end_date: Option<DateTime<Utc>>,
    /// Total number of payments to process (optional)
    pub total_payments_count: Option<i32>,
    /// Number of successful payments processed
    pub completed_payments_count: i32,
    /// When the last payment was processed
    pub last_payment_date: Option<DateTime<Utc>>,
    /// When the recurring donation was created
    pub created_at: DateTime<Utc>,
    /// When the recurring donation was last updated
    pub updated_at: DateTime<Utc>,
}

// ============= Implementation Blocks =============

impl Default for Donation {
    fn default() -> Self {
        Self {
            id: 0,
            amount: Decimal::new(0, 0),
            currency: "USD".to_string(),
            status: DonationStatus::Pending,
            payment_method: PaymentMethodType::CreditCard,
            transaction_id: None,
            donor_name: None,
            donor_email: None,
            donor_phone: None,
            user_id: None,
            message: None,
            is_anonymous: false,
            converted_amount_usd: Decimal::new(0, 0),
            ip_address: None,
            country_code: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

impl Donation {
    /// Creates a new donation with default values
    pub fn new(amount: Decimal, currency: String) -> Self {
        Self {
            amount,
            currency,
            ..Default::default()
        }
    }

    /// Checks if the donation is tax deductible
    pub fn is_tax_deductible(&self) -> bool {
        // Implementation depends on local tax laws
        true
    }

    /// Calculates the tax deductible amount
    pub fn tax_deductible_amount(&self) -> Decimal {
        // Implementation depends on local tax laws
        self.amount
    }
}

// Recurring Donation

impl Default for RecurringDonation {
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
    /// Creates a new recurring donation with default values
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

    // Calculate next payment date based on frequency
    pub fn calculate_next_payment_date(&self) -> DateTime<Utc> {
        use chrono::Duration;

        match self.frequency {
            DonationFrequency::Daily => self.next_payment_date + Duration::days(1),

            DonationFrequency::Weekly => self.next_payment_date + Duration::weeks(1),

            DonationFrequency::Monthly =>
            // Add one month, handling month boundaries
            {
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

    // Check if the recurring donation is active
    pub fn is_active(&self) -> bool {
        matches!(
            self.status,
            DonationStatus::Pending
                | DonationStatus::Completed
                | DonationStatus::Refunded
                | DonationStatus::Cancelled
        ) && self.end_date.map_or(true, |end_date| end_date > Utc::now())
            && self
                .total_payments_count
                .map_or(true, |total_payments_count| {
                    total_payments_count > self.completed_payments_count
                })
    }
}

// ============= Donation Summary =============

/// Summary of a donation
#[derive(Debug, Serialize, Deserialize)]
pub struct DonationSummary {
    pub id: i32,
    pub amount: Decimal,
    pub currency: String,
    pub status: DonationStatus,
}
