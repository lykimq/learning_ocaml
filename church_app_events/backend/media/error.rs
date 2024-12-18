use actix_web::{error::ResponseError, http::StatusCode, HttpResponse};
use derive_more::{Display, Error};
use sqlx::Error as SqlxError;
use std::convert::From;
use std::error::Error as StdError;

#[derive(Debug)]
pub struct ErrorMessage(String);

impl std::fmt::Display for ErrorMessage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl StdError for ErrorMessage {}

impl From<&str> for ErrorMessage {
    fn from(message: &str) -> Self {
        ErrorMessage(message.to_string())
    }
}

// AppError: Main error enum that handles various types of application errors:
// - Database errors (from SQLx)
// - HTTP-related errors (404, 401, 400, etc.)
// - Business logic errors (validation, rate limiting, etc.)

#[derive(Debug, Display, Error)]
pub enum AppError {
    #[display(fmt = "Database error: {}", _0)]
    DatabaseError(SqlxError),

    #[display(fmt = "Not found: {}", _0)]
    NotFound(ErrorMessage),

    #[display(fmt = "Unauthorized: {}", _0)]
    Unauthorized(ErrorMessage),

    #[display(fmt = "Bad request: {}", _0)]
    BadRequest(ErrorMessage),

    #[display(fmt = "Validation error: {}", _0)]
    ValidationError(ErrorMessage),

    #[display(fmt = "Forbidden: {}", _0)]
    Forbidden(ErrorMessage),

    #[display(fmt = "Conflict: {}", _0)]
    Conflict(ErrorMessage),

    #[display(fmt = "Rate limit exceeded: {}", _0)]
    RateLimitExceeded(ErrorMessage),

    #[display(fmt = "Service unavailable: {}", _0)]
    ServiceUnavailable(ErrorMessage),

    #[display(fmt = "Internal server error: {}", _0)]
    InternalServerError(ErrorMessage),

    #[display(fmt = "External service error: {}", _0)]
    ExternalServiceError(ErrorMessage),

    #[display(fmt = "Invalid media type: {}", _0)]
    InvalidMediaType(ErrorMessage),

    #[display(fmt = "Invalid media status: {}", _0)]
    InvalidMediaStatus(ErrorMessage),

    #[display(fmt = "External API error: {}", _0)]
    ExternalApiError(ErrorMessage),

    #[display(fmt = "Parse error: {}", _0)]
    ParseError(ErrorMessage),

    #[display(fmt = "Cache error: {}", _0)]
    CacheError(ErrorMessage),
}

impl ResponseError for AppError {
    // Converts errors into HTTP responses with:
    // - Appropriate status code
    // - JSON body containing error details
    // - Structured error type for frontend handling

    fn error_response(&self) -> HttpResponse {
        let error_response = serde_json::json!({
            "error": {
                "code": self.status_code().as_u16(),
                "message": self.to_string(),
                "type": match self {
                    AppError::DatabaseError(_) => "DATABASE_ERROR",
                    AppError::NotFound(ErrorMessage(_)) => "NOT_FOUND",
                    AppError::Unauthorized(ErrorMessage(_)) => "UNAUTHORIZED",
                    AppError::BadRequest(ErrorMessage(_)) => "BAD_REQUEST",
                    AppError::ValidationError(ErrorMessage(_)) => "VALIDATION_ERROR",
                    AppError::Forbidden(ErrorMessage(_)) => "FORBIDDEN",
                    AppError::Conflict(ErrorMessage(_)) => "CONFLICT",
                    AppError::RateLimitExceeded(ErrorMessage(_)) => "RATE_LIMIT_EXCEEDED",
                    AppError::ServiceUnavailable(ErrorMessage(_)) => "SERVICE_UNAVAILABLE",
                    AppError::InternalServerError(ErrorMessage(_)) => "INTERNAL_SERVER_ERROR",
                    AppError::ExternalServiceError(ErrorMessage(_)) => "EXTERNAL_SERVICE_ERROR",
                    AppError::InvalidMediaType(_) => "INVALID_MEDIA_TYPE",
                    AppError::InvalidMediaStatus(_) => "INVALID_MEDIA_STATUS",
                    AppError::ExternalApiError(ErrorMessage(_)) => "EXTERNAL_API_ERROR",
                    AppError::ParseError(ErrorMessage(_)) => "PARSE_ERROR",
                    AppError::CacheError(ErrorMessage(_)) => "CACHE_ERROR",
                }
            }
        });

        HttpResponse::build(self.status_code()).json(error_response)
    }

    fn status_code(&self) -> StatusCode {
        match self {
            AppError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::ValidationError(_) => StatusCode::UNPROCESSABLE_ENTITY,
            AppError::Forbidden(_) => StatusCode::FORBIDDEN,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::RateLimitExceeded(_) => StatusCode::TOO_MANY_REQUESTS,
            AppError::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            AppError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ExternalServiceError(_) => StatusCode::BAD_GATEWAY,
            AppError::InvalidMediaType(_) => StatusCode::BAD_REQUEST,
            AppError::InvalidMediaStatus(_) => StatusCode::BAD_REQUEST,
            AppError::ExternalApiError(_) => StatusCode::BAD_REQUEST,
            AppError::ParseError(_) => StatusCode::BAD_REQUEST,
            AppError::CacheError(_) => StatusCode::BAD_REQUEST,
        }
    }
}

// Implement From trait for common error conversions
impl From<SqlxError> for AppError {
    // Converts database errors into appropriate AppErrors
    // - Maps RowNotFound to NotFound
    // - Handles specific Postgres error codes
    // (23505: unique violation, 23503: foreign key violation)
    // - Wraps other DB errors as DatabaseError

    fn from(error: SqlxError) -> Self {
        match error {
            SqlxError::RowNotFound => AppError::NotFound("Resource not found".into()),
            SqlxError::Database(db_error) => {
                if let Some(code) = db_error.code() {
                    match code.as_ref() {
                        "23505" => AppError::Conflict("Resource already exists".into()),
                        "23503" => {
                            AppError::BadRequest("Referenced resource does not exist".into())
                        }
                        _ => AppError::DatabaseError(SqlxError::Database(db_error)),
                    }
                } else {
                    AppError::DatabaseError(SqlxError::Database(db_error))
                }
            }
            _ => AppError::DatabaseError(error),
        }
    }
}

// Helper methods for creating errors
impl AppError {
    // Helper methods to create specific error types
    // Each method takes a message that can be converted to String
    // Example: AppError::not_found("User not found")
    //         AppError::unauthorized("Invalid token")

    pub fn not_found(message: impl Into<String>) -> Self {
        AppError::NotFound(ErrorMessage(message.into()))
    }

    pub fn database_error(message: impl Into<String>) -> Self {
        AppError::DatabaseError(SqlxError::Protocol(message.into()))
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        AppError::Unauthorized(ErrorMessage(message.into()))
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        AppError::BadRequest(ErrorMessage(message.into()))
    }

    pub fn validation_error(message: impl Into<String>) -> Self {
        AppError::ValidationError(ErrorMessage(message.into()))
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        AppError::Forbidden(ErrorMessage(message.into()))
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        AppError::Conflict(ErrorMessage(message.into()))
    }

    pub fn rate_limit_exceeded(message: impl Into<String>) -> Self {
        AppError::RateLimitExceeded(ErrorMessage(message.into()))
    }

    pub fn service_unavailable(message: impl Into<String>) -> Self {
        AppError::ServiceUnavailable(ErrorMessage(message.into()))
    }

    pub fn internal_error(message: impl Into<String>) -> Self {
        AppError::InternalServerError(ErrorMessage(message.into()))
    }

    pub fn external_service_error(message: impl Into<String>) -> Self {
        AppError::ExternalServiceError(ErrorMessage(message.into()))
    }

    pub fn invalid_media_type(message: impl Into<String>) -> Self {
        AppError::InvalidMediaType(ErrorMessage(message.into()))
    }

    pub fn invalid_media_status(message: impl Into<String>) -> Self {
        AppError::InvalidMediaStatus(ErrorMessage(message.into()))
    }

    pub fn external_api_error(message: impl Into<String>) -> Self {
        AppError::ExternalApiError(ErrorMessage(message.into()))
    }

    pub fn parse_error(message: impl Into<String>) -> Self {
        AppError::ParseError(ErrorMessage(message.into()))
    }

    pub fn cache_error(message: impl Into<String>) -> Self {
        AppError::CacheError(ErrorMessage(message.into()))
    }
}

// Add conversion from String errors (from MediaType::from_str and MediaStatus::from_str)
impl From<String> for ErrorMessage {
    fn from(message: String) -> Self {
        ErrorMessage(message)
    }
}
