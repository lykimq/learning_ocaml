//! Donation Receipt Module
//!
//! Handles donation receipts for tax purposes and record keeping

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;

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
}

// ============= Implementation =============

impl ReceiptRepository {
    /// Creates a new ReceiptRepository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
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
}
