//! Donation Receipt Module
//!
//! Handles donation receipts for tax purposes and record keeping

use chrono::{DateTime, Datelike, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;

use crate::donation::donation_service::DonationService;
use crate::donation::notification_service::NotificationService;

// ============= Types =============

/// Represents a donation receipt
#[derive(Debug, Serialize, Deserialize)]
pub struct DonationReceipt {
    /// Unique identifier
    pub id: i32,
    /// Associated one-time donation ID
    pub donation_id: Option<i32>,
    /// Associated recurring donation ID
    pub recurring_donation_id: Option<i32>,
    /// Unique receipt number
    pub receipt_number: String,
    /// When the receipt was issued
    pub issued_date: DateTime<Utc>,
    /// Tax year for the receipt
    pub tax_year: i32,
    /// When the receipt was created
    pub created_at: DateTime<Utc>,
}

/// Repository for receipt operations
pub struct ReceiptRepository {
    pool: PgPool,
    donation_service: DonationService,
    notification_service: NotificationService,
}

// ============= Implementation =============

impl ReceiptRepository {
    /// Creates a new ReceiptRepository instance
    pub fn new(pool: PgPool, donation_service: DonationService, notification_service: NotificationService) -> Self {
        Self { pool, donation_service, notification_service }
    }

    /// Generates a unique receipt number
    fn generate_receipt_number(&self, tax_year: i32) -> String {
        format!("{}-{}", tax_year, Uuid::new_v4().simple())
    }

    /// Creates a new receipt for a one-time donation
    pub async fn create_donation_receipt(
        &self,
        donation_id: i32,
        tax_year: i32
    ) -> Result<DonationReceipt> {
        let receipt_number = self.generate_receipt_number(tax_year);

        let receipt = sqlx::query_as!(
            DonationReceipt,
            r#"
            INSERT INTO donation_receipts
            (donation_id, receipt_number, issued_date, tax_year)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
            RETURNING
                id, donation_id, recurring_donation_id,
                receipt_number,
                issued_date as "issued_date!: DateTime<Utc>",
                tax_year,
                created_at as "created_at!: DateTime<Utc>"
            "#,
            donation_id,
            receipt_number,
            tax_year
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(receipt)
    }


    /// Gets receipts for a donation
    pub async fn get_donation_receipts(
        &self,
        donation_id: i32
    ) -> Result<Vec<DonationReceipt>> {
        let receipts = sqlx::query_as!(
            DonationReceipt,
            r#"
            SELECT
                id, donation_id, recurring_donation_id,
                receipt_number,
                issued_date as "issued_date!: DateTime<Utc>",
                tax_year,
                created_at as "created_at!: DateTime<Utc>"
            FROM donation_receipts
            WHERE donation_id = $1
            ORDER BY issued_date DESC
            "#,
            donation_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(receipts)
    }

    /// Gets a receipt by its number
    pub async fn get_receipt_by_number(
        &self,
        receipt_number: &str
    ) -> Result<Option<DonationReceipt>> {
        let receipt = sqlx::query_as!(
            DonationReceipt,
            r#"
            SELECT
                id, donation_id, recurring_donation_id,
                receipt_number,
                issued_date as "issued_date!: DateTime<Utc>",
                tax_year,
                created_at as "created_at!: DateTime<Utc>"
            FROM donation_receipts
            WHERE receipt_number = $1
            "#,
            receipt_number
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(receipt)
    }

    /// Gets all receipts for a tax year
    pub async fn get_receipts_by_tax_year(
        &self,
        tax_year: i32
    ) -> Result<Vec<DonationReceipt>> {
        let receipts = sqlx::query_as!(
            DonationReceipt,
            r#"
            SELECT
                id, donation_id, recurring_donation_id,
                receipt_number,
                issued_date as "issued_date!: DateTime<Utc>",
                tax_year,
                created_at as "created_at!: DateTime<Utc>"
            FROM donation_receipts
            WHERE tax_year = $1
            ORDER BY issued_date DESC
            "#,
            tax_year
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(receipts)
    }

    ///////////////////////////////////////////////////////////
    /// ============= Recurring Donation Receipts =============
    ///////////////////////////////////////////////////////////

    /// Creates a new receipt for a recurring donation
    pub async fn create_recurring_donation_receipt(
        &self,
        recurring_donation_id: i32,
        tax_year: i32
    ) -> Result<DonationReceipt> {
        let receipt_number = self.generate_receipt_number(tax_year);

        let receipt = sqlx::query_as!(
            DonationReceipt,
            r#"
            INSERT INTO donation_receipts
            (recurring_donation_id, receipt_number, issued_date, tax_year)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
            RETURNING
                id, donation_id, recurring_donation_id,
                receipt_number,
                issued_date as "issued_date!: DateTime<Utc>",
                tax_year,
                created_at as "created_at!: DateTime<Utc>"
            "#,
            recurring_donation_id,
            receipt_number,
            tax_year
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(receipt)
    }


    // Generate a receipt for a recurring donation
    pub async fn generate_recurring_donation_receipt(
        &self,
        recurring_donation_id: i32,
        tax_year: i32,
        user_id: i32
    ) -> Result<DonationReceipt> {

        // verify that the recurring donation exists
        let recurring_donation = self.donation_service.get_recurring_donation(recurring_donation_id).await?;

        if recurring_donation.user_id != user_id {
            return Err(anyhow::anyhow!("You are not authorized to generate receipts for this recurring donation"));
        }

        // Create a receipt for the recurring donation
        let receipt = self.create_recurring_donation_receipt(recurring_donation_id, tax_year).await?;

        // Send the receipt notification
        self.notification_service.send_donation_success_notification(
            recurring_donation.user_id,
            receipt.id,
            recurring_donation.currency.as_str(),
            recurring_donation.amount,
            true
        ).await?;

        Ok(receipt)
    }

    /// Gets receipts for a recurring donation
    pub async fn get_recurring_donation_receipts(
        &self,
        recurring_donation_id: i32
    ) -> Result<Vec<DonationReceipt>> {
        let receipts = sqlx::query_as!(
            DonationReceipt,
            r#"
            SELECT
                id, donation_id, recurring_donation_id,
                receipt_number,
                issued_date as "issued_date!: DateTime<Utc>",
                tax_year,
                created_at as "created_at!: DateTime<Utc>"
            FROM donation_receipts
            WHERE recurring_donation_id = $1
            ORDER BY issued_date DESC
            "#,
            recurring_donation_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(receipts)
    }


    ///////////////////////////////////////////////////////////
    /// ============= Admin Receipts =============
    ///////////////////////////////////////////////////////////

    /// Generates annual receipts for all donations (Admin only)
    pub async fn generate_annual_receipts(
        &self,
        tax_year: i32
    ) -> Result<Vec<DonationReceipt>> {

        let mut receipts = Vec::new();

        // Get all donations for the tax year
        let donations = self.donation_service.get_donations_by_tax_year(tax_year).await?;

        // Generate receipts for one-time donations
        for donation in donations {
            if let Ok(receipt) = self.create_donation_receipt(donation.id, tax_year).await {
                receipts.push(receipt);
            }
        }

        // Get all recurring donations for the tax year
        let recurring_donations = self.donation_service.get_recurring_donations_by_tax_year(tax_year).await?;

        // Generate receipts for recurring donations
        for recurring_donation in recurring_donations {
            if let Ok(receipt) = self.create_recurring_donation_receipt(recurring_donation.id, tax_year).await {
                receipts.push(receipt);
            }
        }


        Ok(receipts)
    }
}
