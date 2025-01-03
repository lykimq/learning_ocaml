//! Donation Repository Module
//! Handles all database operations for donations and recurring donations

use sqlx::{Row, PgPool};
use anyhow::Result;
use crate::donation::donation::{Donation, DonationStatus};
use crate::donation::recurring_donation::RecurringDonation;
use crate::donation::payment_method::PaymentMethodType;
use std::str::FromStr;
use serde::{Deserialize, Serialize}  ;
use chrono::{ DateTime, Utc};
use rust_decimal::Decimal;


/// Repository for handling donation-related database operations
pub struct DonationRepository {
   pub pool: PgPool,
}
/// Search parameters for querying donations
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

// Donation statistics/// Aggregated donation statistics
#[derive(Debug, Serialize)]
pub struct DonationStatistics {
    pub total_amount: Decimal,
    pub total_count: i64,
    pub average_amount: Decimal,
    pub currency_breakdown: Vec<CurrencyStats>,
    pub status_breakdown: Vec<StatusStats>,
    pub monthly_totals: Vec<MonthlyStats>,
}


/// Statistics broken down by currency
#[derive(Debug, Serialize)]
pub struct CurrencyStats {
    pub currency: String,
    pub total_amount: Decimal,
    pub count: i64,
}

/// Statistics broken down by donation status
#[derive(Debug, Serialize)]
pub struct StatusStats {
    pub status: DonationStatus,
    pub count: i64,
}

/// Monthly donation statistics
#[derive(Debug, Serialize)]
pub struct MonthlyStats {
    pub month: DateTime<Utc>,
    pub total_amount: Decimal,
    pub count: i64,
}

impl DonationRepository {
    /// Creates a new DonationRepository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ============= One-Time Donation Operations =============

    /// Creates a new donation record in the database
    pub async fn create_donation(&self, donation: &Donation) -> Result<Donation> {
        let result = sqlx::query(
            r#"
            INSERT INTO donations
            (amount, currency, status, payment_method, transaction_id,
             donor_name, donor_email, donor_phone, user_id, message,
             is_anonymous, converted_amount_usd, ip_address, country_code,
             created_at, updated_at)
            VALUES ($1, $2, $3::text, $4::text, $5, $6, $7, $8, $9, $10,
                   $11, $12, $13, $14, $15, $16)
            RETURNING *;
            "#)
            .bind(&donation.amount)
            .bind(donation.currency.clone())
            .bind(donation.status.to_string())
            .bind(donation.payment_method.to_string())
            .bind(&donation.transaction_id)
            .bind(&donation.donor_name)
            .bind(&donation.donor_email)
            .bind(&donation.donor_phone)
            .bind(donation.user_id)
            .bind(&donation.message)
            .bind(donation.is_anonymous)
            .bind(donation.converted_amount_usd)
            .bind(&donation.ip_address)
            .bind(&donation.country_code)
            .bind(donation.created_at)
            .bind(donation.updated_at)
            .fetch_one(&self.pool)
            .await?;

        Ok(Donation {
            id: result.get("id"),
            amount: result.get("amount"),
            currency: result.get("currency"),
            status: DonationStatus::from_str(&result.get::<String, _>("status"))?,
            payment_method: PaymentMethodType::from_str(&result.get::<String, _>("payment_method"))?,
            transaction_id: result.get("transaction_id"),
            donor_name: result.get("donor_name"),
            donor_email: result.get("donor_email"),
            donor_phone: result.get("donor_phone"),
            user_id: result.get("user_id"),
            message: result.get("message"),
            is_anonymous: result.get("is_anonymous"),
            converted_amount_usd: result.get("converted_amount_usd"),
            ip_address: result.get("ip_address"),
            country_code: result.get("country_code"),
            created_at: result.get("created_at"),
            updated_at: result.get("updated_at")
        })
    }

    /// Retrieves a specific donation by ID
    pub async fn get_donation(&self, id: i32) -> Result<Option<Donation>> {
        let result = sqlx::query(
            r#"
            SELECT id, amount, currency, status, payment_method, transaction_id,
                   donor_name, donor_email, donor_phone, user_id, message,
                   is_anonymous, converted_amount_usd, ip_address, country_code,
                   created_at, updated_at
            FROM donations
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match result {
            Some(row) => Ok(Some(Donation {
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
            })),
            None => Ok(None)
        }
    }

        /// Retrieves all donations for a specific user
        pub async fn get_user_donations(&self, user_id: i32) -> Result<Vec<Donation>> {
            let rows = sqlx::query(
                r#"
                SELECT id, amount, currency, status, payment_method, transaction_id,
                       donor_name, donor_email, donor_phone, user_id, message,
                       is_anonymous, converted_amount_usd, ip_address, country_code,
                       created_at, updated_at
                FROM donations
                WHERE user_id = $1
                ORDER BY created_at DESC
                "#
            )
            .bind(user_id)
            .fetch_all(&self.pool)
            .await?;

            let mut donations = Vec::new();
            for row in rows {
                donations.push(Donation {
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
                });
            }

            Ok(donations)
        }


        // Get donation by tax year
        pub async fn get_donations_by_tax_year(&self, start_date: DateTime<Utc>, end_date: DateTime<Utc>) -> Result<Vec<Donation>> {
            let rows = sqlx::query(
                r#"
                SELECT * FROM donations WHERE created_at >= $1 AND created_at <= $2
                ORDER BY created_at DESC
                "#
            )
            .bind(start_date)
            .bind(end_date)
            .fetch_all(&self.pool)
            .await?;

            let mut donations = Vec::new();
            for row in rows {
                donations.push(Donation {
                    id: row.get("id"),
                    amount: row.get("amount"),
                    currency: row.get("currency"),
                    status: DonationStatus::from_str(&row.get::<String, _>("status"))?,
                    payment_method: PaymentMethodType::from_str(&row.get::<String, _>("payment_method"))?,
                    transaction_id: row.get("transaction_id"),
                    donor_name: row.get("donor_name"),
                    donor_email: row.get("donor_email"),
                    donor_phone: row.get("donor_phone"),
                    user_id: row.get("user_id"),
                    message: row.get("message"),
                    is_anonymous: row.get("is_anonymous"),
                    converted_amount_usd: row.get("converted_amount_usd"),
                    ip_address: row.get("ip_address"),
                    country_code: row.get("country_code"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at")
                });
            }

            Ok(donations)
    }

        // Get donation statistics
        pub async fn get_donation_statistics(&self) -> Result<DonationStatistics> {
            let result = sqlx::query(
                r#"
                SELECT SUM(amount) AS total_amount, COUNT(*) AS total_donations
                FROM donations
                "#
            )
            .fetch_one(&self.pool)
            .await?;

            let total_amount: Decimal = result.try_get("total_amount")?;
            let total_count: i64 = result.try_get("total_count")?;
            let average_amount = total_amount / Decimal::from(total_count);

            let currency_rows = sqlx::query(
                r#"
                SELECT currency, SUM(amount) AS total_amount, COUNT(*) AS total_count
                FROM donations
                GROUP BY currency
                "#
            )
            .fetch_all(&self.pool)
            .await?;

            let status_rows = sqlx::query(
                r#"
                SELECT status, COUNT(*) AS total_count
                FROM donations
                GROUP BY status
                "#
            )
            .fetch_all(&self.pool)
            .await?;

            let monthly_rows = sqlx::query(
                r#"
                SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS total_amount, COUNT(*) AS total_count
                FROM donations
                GROUP BY month
                ORDER BY month
                "#
            )
            .fetch_all(&self.pool)
            .await?;

            let currency_breakdown: Vec<CurrencyStats> = currency_rows
                .into_iter()
                .map(|row| CurrencyStats {
                    currency: row.get("currency"),
                    total_amount: row.get("total_amount"),
                    count: row.get("total_count"),
                })
                .collect();

            let status_breakdown: Vec<StatusStats> = status_rows
                .into_iter()
                .map(|row| StatusStats {
                    status: DonationStatus::from_str(&row.get::<String, _>("status")).unwrap(),
                    count: row.get("total_count"),
                })
                .collect();

            let monthly_totals: Vec<MonthlyStats> = monthly_rows
                .into_iter()
                .map(|row| MonthlyStats {
                    month: row.get("month"),
                    total_amount: row.get("total_amount"),
                    count: row.get("total_count"),
                })
                .collect();

            Ok(DonationStatistics {
                total_amount: total_amount,
                total_count: total_count,
                average_amount: average_amount,
                currency_breakdown: currency_breakdown,
                status_breakdown: status_breakdown,
                monthly_totals: monthly_totals
            })
        }

        /// Updates donations for a user with latest information
        pub async fn update_donations(&self, user_id: i32) -> Result<Vec<Donation>> {
            let rows = sqlx::query(
                r#"
                SELECT id, amount, currency, status, payment_method, transaction_id,
                       donor_name, donor_email, donor_phone, user_id, message,
                       is_anonymous, converted_amount_usd, ip_address, country_code,
                       created_at, updated_at
                FROM donations
                WHERE user_id = $1
                ORDER BY created_at DESC
                "#
            )
            .bind(user_id)
            .fetch_all(&self.pool)
            .await?;

            let mut donations = Vec::new();
            for row in rows {
                donations.push(Donation {
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
                });
            }

            Ok(donations)
        }

    /// Updates the status of a donation
    pub async fn update_donation_status(&self, id: i32, status: DonationStatus) -> Result<Donation> {
        let result = sqlx::query(
            r#"
            UPDATE donations
            SET status = $1::text, updated_at = NOW()
            WHERE id = $2
            RETURNING id, amount, currency, status, payment_method, transaction_id,
                      donor_name, donor_email, donor_phone, user_id, message,
                      is_anonymous, converted_amount_usd, ip_address, country_code,
                      created_at, updated_at
            "#
        )
        .bind(status.to_string())
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(Donation {
            id: result.try_get("id")?,
            amount: result.try_get("amount")?,
            currency: result.try_get("currency")?,
            status: DonationStatus::from_str(&result.try_get::<String, _>("status")?)?,
            payment_method: PaymentMethodType::from_str(&result.try_get::<String, _>("payment_method")?)?,
            transaction_id: result.try_get("transaction_id")?,
            donor_name: result.try_get("donor_name")?,
            donor_email: result.try_get("donor_email")?,
            donor_phone: result.try_get("donor_phone")?,
            user_id: result.try_get("user_id")?,
            message: result.try_get("message")?,
            is_anonymous: result.try_get("is_anonymous")?,
            converted_amount_usd: result.try_get("converted_amount_usd")?,
            ip_address: result.try_get("ip_address")?,
            country_code: result.try_get("country_code")?,
            created_at: result.try_get("created_at")?,
            updated_at: result.try_get("updated_at")?
        })
    }

    // Search donations
    pub async fn search_donations(
        &self,
        query: DonationSearchQuery,
        offset: i64,
        limit: i64
    ) -> Result<Vec<Donation>> {
        let rows = sqlx::query(
            r#"
            SELECT * FROM donations
            WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            AND ($2::timestamptz IS NULL OR created_at <= $2)
            AND ($3::decimal IS NULL OR amount >= $3)
            AND ($4::decimal IS NULL OR amount <= $4)
            AND ($5::donation_status IS NULL OR status = $5)
            AND ($6::text IS NULL OR currency = $6)
            ORDER BY created_at DESC
            LIMIT $7 OFFSET $8
            "#
        )
        .bind(query.start_date)
        .bind(query.end_date)
        .bind(query.min_amount)
        .bind(query.max_amount)
        .bind(query.status)
        .bind(query.currency)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut donations = Vec::new();
        for row in rows {
            donations.push(Donation {
                id: row.get("id"),
                amount: row.get("amount"),
                currency: row.get("currency"),
                status: DonationStatus::from_str(&row.get::<String, _>("status"))?,
                payment_method: PaymentMethodType::from_str(&row.get::<String, _>("payment_method"))?,
                transaction_id: row.get("transaction_id"),
                donor_name: row.get("donor_name"),
                donor_email: row.get("donor_email"),
                donor_phone: row.get("donor_phone"),
                user_id: row.get("user_id"),
                message: row.get("message"),
                is_anonymous: row.get("is_anonymous"),
                converted_amount_usd: row.get("converted_amount_usd"),
                ip_address: row.get("ip_address"),
                country_code: row.get("country_code"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at")
            });
        }

        Ok(donations)
    }

    /////////////////////////////////////////////////////////////
    // ============= Recurring Donation Operations =============//
    /////////////////////////////////////////////////////////////


    /// Creates a new recurring donation record
    pub async fn create_recurring_donation(&self, recurring_donation: &RecurringDonation) -> Result<RecurringDonation> {
        let result = sqlx::query(
            r#"
            INSERT INTO recurring_donations
            (user_id, amount, currency, frequency, payment_method, status,
             start_date, next_payment_date, end_date, total_payments_count)
            VALUES ($1, $2, $3, $4, $5::text, $6::text, $7, $8, $9, $10)
            RETURNING *
            "#,
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

        Ok(RecurringDonation {
            id: result.try_get("id")?,
            user_id: result.try_get("user_id")?,
            amount: result.try_get("amount")?,
            currency: result.try_get("currency")?,
            frequency: result.try_get("frequency")?,
            payment_method: PaymentMethodType::from_str(&result.try_get::<String, _>("payment_method")?)?,
            status: DonationStatus::from_str(&result.try_get::<String, _>("status")?)?,
            start_date: result.try_get("start_date")?,
            next_payment_date: result.try_get("next_payment_date")?,
            end_date: result.try_get("end_date")?,
            total_payments_count: result.try_get("total_payments_count")?,
            completed_payments_count: result.try_get("completed_payments_count")?,
            last_payment_date: result.try_get("last_payment_date")?,
            created_at: result.try_get("created_at")?,
            updated_at: result.try_get("updated_at")?
        })
    }


    // Get recurring donations by tax year
    pub async fn get_recurring_donations_by_tax_year(&self, start_date: DateTime<Utc>, end_date: DateTime<Utc>) -> Result<Vec<RecurringDonation>> {
        let rows = sqlx::query(
            r#"
            SELECT * FROM recurring_donations WHERE created_at >= $1 AND created_at <= $2
            ORDER BY created_at DESC
            "#
        )
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&self.pool)
        .await?;

        let mut recurring_donations = Vec::new();
        for row in rows {
            recurring_donations.push(RecurringDonation {
                id: row.get("id"),
                user_id: row.get("user_id"),
                amount: row.get("amount"),
                currency: row.get("currency"),
                frequency: row.get("frequency"),
                payment_method: PaymentMethodType::from_str(&row.get::<String, _>("payment_method")).unwrap(),
                status: DonationStatus::from_str(&row.get::<String, _>("status")).unwrap(),
                start_date: row.get("start_date"),
                next_payment_date: row.get("next_payment_date"),
                end_date: row.get("end_date"),
                total_payments_count: row.get("total_payments_count"),
                completed_payments_count: row.get("completed_payments_count"),
                last_payment_date: row.get("last_payment_date"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at")
            });
        }

        Ok(recurring_donations)

    }

      /// Updates the payment count for a recurring donation
      pub async fn update_recurring_donation_payment_count(
        &self,
        id: i32,
        count: i32
    ) -> Result<RecurringDonation> {
        let result = sqlx::query(
            r#"
            UPDATE recurring_donations
            SET completed_payments_count = $1,
                last_payment_date = NOW(),
                updated_at = NOW()
            WHERE id = $2
            RETURNING id, user_id, amount, currency, frequency, payment_method, status,
                      start_date, next_payment_date, end_date, total_payments_count,
                      completed_payments_count, last_payment_date, created_at, updated_at
            "#
        )
        .bind(count)
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(RecurringDonation {
            id: result.try_get("id")?,
            user_id: result.try_get("user_id")?,
            amount: result.try_get("amount")?,
            currency: result.try_get("currency")?,
            frequency: result.try_get("frequency")?,
            payment_method: PaymentMethodType::from_str(&result.try_get::<String, _>("payment_method").unwrap())?,
            status: DonationStatus::from_str(&result.try_get::<String, _>("status").unwrap())?,
            start_date: result.try_get("start_date")?,
            next_payment_date: result.try_get("next_payment_date")?,
            end_date: result.try_get("end_date")?,
            total_payments_count: result.try_get("total_payments_count")?,
            completed_payments_count: result.try_get("completed_payments_count")?,
            last_payment_date: result.try_get("last_payment_date")?,
            created_at: result.try_get("created_at")?,
            updated_at: result.try_get("updated_at")?
        })
    }

    /// Retrieves a specific recurring donation
    pub async fn get_recurring_donation(&self, id: i32) -> Result<RecurringDonation> {
        let result = sqlx::query(
            r#"
            SELECT id, user_id, amount, currency, frequency, payment_method, status,
                   start_date, next_payment_date, end_date, total_payments_count,
                   completed_payments_count, last_payment_date, created_at, updated_at
            FROM recurring_donations
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(RecurringDonation {
            id: result.try_get("id")?,
            user_id: result.try_get("user_id")?,
            amount: result.try_get("amount")?,
            currency: result.try_get("currency")?,
            frequency: result.try_get("frequency")?,
            payment_method: PaymentMethodType::from_str(&result.try_get::<String, _>("payment_method").unwrap())?,
            status: DonationStatus::from_str(&result.try_get::<String, _>("status").unwrap())?,
            start_date: result.try_get("start_date")?,
            next_payment_date: result.try_get("next_payment_date")?,
            end_date: result.try_get("end_date")?,
            total_payments_count: result.try_get("total_payments_count")?,
            completed_payments_count: result.try_get("completed_payments_count")?,
            last_payment_date: result.try_get("last_payment_date")?,
            created_at: result.try_get("created_at")?,
            updated_at: result.try_get("updated_at")?
        })
    }

    /// Retrieves all donations associated with a recurring donation
    pub async fn get_donations_by_recurring_id(&self, recurring_id: i32) -> Result<Vec<Donation>> {
        let rows = sqlx::query(
            r#"
            SELECT id, amount, currency, status, payment_method, transaction_id,
                   donor_name, donor_email, donor_phone, user_id, message,
                   is_anonymous, converted_amount_usd, ip_address, country_code,
                   created_at, updated_at
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
            donations.push(Donation {
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
            });
        }

        Ok(donations)
    }


    // Update next payment date
    pub async fn update_next_payment_date(&self,
        id: i32,
        next_payment_date: DateTime<Utc>) -> Result<RecurringDonation> {
        let result = sqlx::query(
            r#"
            UPDATE recurring_donations
            SET next_payment_date = $1, updated_at = $2
            WHERE id = $2
            RETURNING id, user_id, amount, currency, frequency, payment_method, status,
                      start_date, next_payment_date, end_date, total_payments_count,
                      completed_payments_count, last_payment_date, created_at, updated_at
            "#
        )
        .bind(next_payment_date)
        .bind(Utc::now())
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(RecurringDonation {
            id: result.try_get("id")?,
            user_id: result.try_get("user_id")?,
            amount: result.try_get("amount")?,
            currency: result.try_get("currency")?,
            frequency: result.try_get("frequency")?,
            payment_method: PaymentMethodType::from_str(&result.try_get::<String, _>("payment_method")?)?,
            status: DonationStatus::from_str(&result.try_get::<String, _>("status")?)?,
            start_date: result.try_get("start_date")?,
            next_payment_date: result.try_get("next_payment_date")?,
            end_date: result.try_get("end_date")?,
            total_payments_count: result.try_get("total_payments_count")?,
            completed_payments_count: result.try_get("completed_payments_count")?,
            last_payment_date: result.try_get("last_payment_date")?,
            created_at: result.try_get("created_at")?,
            updated_at: result.try_get("updated_at")?
        })
    }

    /// Updates the status of a recurring donation
    pub async fn update_recurring_donation_status(
        &self,
        id: i32,
        status: DonationStatus
    ) -> Result<RecurringDonation> {
        let result = sqlx::query(
            r#"
            UPDATE recurring_donations
            SET status = $1::text, updated_at = NOW()
            WHERE id = $2
            RETURNING id, user_id, amount, currency, frequency, payment_method, status,
                      start_date, next_payment_date, end_date, total_payments_count,
                      completed_payments_count, last_payment_date, created_at, updated_at
            "#
        )
        .bind(status.to_string())
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(RecurringDonation {
            id: result.try_get("id")?,
            user_id: result.try_get("user_id")?,
            amount: result.try_get("amount")?,
            currency: result.try_get("currency")?,
            frequency: result.try_get("frequency")?,
            payment_method: PaymentMethodType::from_str(&result.try_get::<String, _>("payment_method").unwrap())?,
            status: DonationStatus::from_str(&result.try_get::<String, _>("status").unwrap())?,
            start_date: result.try_get("start_date")?,
            next_payment_date: result.try_get("next_payment_date")?,
            end_date: result.try_get("end_date")?,
            total_payments_count: result.try_get("total_payments_count")?,
            completed_payments_count: result.try_get("completed_payments_count")?,
            last_payment_date: result.try_get("last_payment_date")?,
            created_at: result.try_get("created_at")?,
            updated_at: result.try_get("updated_at")?
        })
    }

    // Cancel recurring donation
    pub async fn cancel_recurring_donation(&self, id: i32) -> Result<RecurringDonation> {
        let result = sqlx::query(
            r#"
            UPDATE recurring_donations
            SET status = 'Cancelled', updated_at = $2
            WHERE id = $1
            RETURNING id, user_id, amount, currency, frequency, payment_method, status,
                      start_date, next_payment_date, end_date, total_payments_count,
                      completed_payments_count, last_payment_date, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(Utc::now())
        .fetch_one(&self.pool)
        .await?;

        Ok(RecurringDonation {
            id: result.try_get("id")?,
            user_id: result.try_get("user_id")?,
            amount: result.try_get("amount")?,
            currency: result.try_get("currency")?,
            frequency: result.try_get("frequency")?,
            payment_method: PaymentMethodType::from_str(&result.try_get::<String, _>("payment_method").unwrap())?,
            status: DonationStatus::from_str(&result.try_get::<String, _>("status").unwrap())?,
            start_date: result.try_get("start_date")?,
            next_payment_date: result.try_get("next_payment_date")?,
            end_date: result.try_get("end_date")?,
            total_payments_count: result.try_get("total_payments_count")?,
            completed_payments_count: result.try_get("completed_payments_count")?,
            last_payment_date: result.try_get("last_payment_date")?,
            created_at: result.try_get("created_at")?,
            updated_at: result.try_get("updated_at")?
        })
    }



}