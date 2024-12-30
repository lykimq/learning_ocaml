use chrono::{DateTime, Utc};
use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use serde::{Serialize};

/// Donation receipt
///
/// Generated for tax purposes and record keeping.
#[derive(Debug, Serialize)]
pub struct DonationReceipt {
    /// Unique identifier
    pub id: i32,
    /// Associated one-time donation ID (optional)
    pub donation_id: Option<i32>,
    /// Associated recurring donation ID (optional)
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

impl ReceiptRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn generate_receipt_number(&self, tax_year: i32) -> String {
        format!("{}-{}", tax_year, Uuid::new_v4().simple())
    }

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
