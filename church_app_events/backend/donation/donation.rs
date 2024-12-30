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
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::Type;

// ============= Status Enums =============

/// Status of a donation
///
/// Represents the current state of a donation in the system.
#[derive(Debug, Serialize, Deserialize, Type)]
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
#[derive(Debug, Serialize, Deserialize)]
pub struct Donation {
    /// Unique identifier
    pub id: i32,
    /// Donation amount in specified currency
    pub amount: Decimal,
    /// Currency code (e.g., USD, EUR)
    pub currency: String,
    /// Current status of the donation
    pub status: DonationStatus,
    /// Payment method used
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
    pub country: Option<String>,
    /// When the donation was created
    pub created_at: DateTime<Utc>,
    /// When the donation was last updated
    pub updated_at: DateTime<Utc>,
}

/// Recurring donation
///
/// Represents a recurring donation setup with scheduled payments.
#[derive(Debug, Serialize, Deserialize)]
pub struct RecurringDonation {
    /// Unique identifier
    pub id: i32,
    /// Amount to be charged each time
    pub amount: Decimal,
    /// Currency code
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
    /// Total number of donations to process (optional)
    pub total_donations: Option<i32>,
    /// Number of successful donations processed
    pub completed_donations: i32,
    /// When the last donation was processed
    pub last_donation_date: Option<DateTime<Utc>>,
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
            country: None,
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
