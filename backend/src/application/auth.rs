use crate::{
    domain::{entities::User, errors::DomainError, repositories::UserRepository},
    infrastructure::persistence::postgres::PostgresRepository,
};
use argon2::{
    password_hash::{rand_core::OsRng, rand_core::RngCore, PasswordHash, PasswordVerifier},
    Argon2,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use chrono::{Duration, Utc};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, VecDeque},
    sync::Arc,
    time::{Duration as StdDuration, Instant},
};
use tokio::sync::Mutex;

const TOKEN_BYTES: usize = 32;
const MAX_LOGIN_ATTEMPTS: usize = 5;
const LOGIN_WINDOW: StdDuration = StdDuration::from_secs(60);

#[derive(Clone)]
pub struct AuthService {
    repository: PostgresRepository,
    session_ttl_hours: u64,
    login_attempts: Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
}

impl AuthService {
    pub fn new(repository: PostgresRepository, session_ttl_hours: u64) -> Self {
        Self {
            repository,
            session_ttl_hours,
            login_attempts: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn login(&self, email: &str, password: &str) -> Result<(User, String), DomainError> {
        let normalized_email = email.trim().to_lowercase();
        if normalized_email.is_empty() || password.is_empty() {
            return Err(DomainError::InvalidCredentials);
        }

        self.record_login_attempt(&normalized_email).await?;

        let Some(user_with_password) = self
            .repository
            .find_user_by_email(&normalized_email)
            .await?
        else {
            return Err(DomainError::InvalidCredentials);
        };

        let password_hash = user_with_password.password_hash;
        let password = password.to_owned();
        let password_valid = tokio::task::spawn_blocking(move || {
            let parsed_hash = PasswordHash::new(&password_hash).ok()?;
            Argon2::default()
                .verify_password(password.as_bytes(), &parsed_hash)
                .ok()
        })
        .await
        .map_err(|_| DomainError::InvalidCredentials)?
        .is_some();

        if !password_valid {
            return Err(DomainError::InvalidCredentials);
        }

        self.clear_login_attempts(&normalized_email).await;

        let mut token_bytes = [0_u8; TOKEN_BYTES];
        OsRng.fill_bytes(&mut token_bytes);
        let token = URL_SAFE_NO_PAD.encode(token_bytes);
        let token_hash = hash_token(&token);
        let expires_at = Utc::now() + Duration::hours(self.session_ttl_hours as i64);

        self.repository
            .create_session(user_with_password.user.id, &token_hash, expires_at)
            .await?;

        Ok((user_with_password.user, token))
    }

    pub async fn authenticate(&self, token: &str) -> Result<User, DomainError> {
        if token.is_empty() {
            return Err(DomainError::Unauthorized);
        }

        self.repository
            .find_user_by_session_hash(&hash_token(token))
            .await?
            .ok_or(DomainError::Unauthorized)
    }

    pub async fn logout(&self, token: &str) -> Result<(), DomainError> {
        if !token.is_empty() {
            self.repository.delete_session(&hash_token(token)).await?;
        }
        Ok(())
    }

    async fn record_login_attempt(&self, key: &str) -> Result<(), DomainError> {
        let now = Instant::now();
        let mut attempts_by_account = self.login_attempts.lock().await;
        let attempts = attempts_by_account.entry(key.to_owned()).or_default();

        while attempts
            .front()
            .is_some_and(|attempt| now.duration_since(*attempt) >= LOGIN_WINDOW)
        {
            attempts.pop_front();
        }

        if attempts.len() >= MAX_LOGIN_ATTEMPTS {
            return Err(DomainError::RateLimited);
        }

        attempts.push_back(now);
        Ok(())
    }

    async fn clear_login_attempts(&self, key: &str) {
        self.login_attempts.lock().await.remove(key);
    }
}

pub fn hash_token(token: &str) -> [u8; 32] {
    Sha256::digest(token.as_bytes()).into()
}

#[cfg(test)]
mod tests {
    use super::{hash_token, AuthService};
    use crate::{
        domain::errors::DomainError,
        infrastructure::persistence::postgres::PostgresRepository,
    };
    use sqlx::postgres::PgPoolOptions;

    #[test]
    fn token_hash_is_stable_and_not_plaintext() {
        let first = hash_token("secret-token");
        let second = hash_token("secret-token");

        assert_eq!(first, second);
        assert_ne!(first.as_slice(), b"secret-token");
    }

    #[tokio::test]
    async fn limits_repeated_login_attempts() {
        let pool = PgPoolOptions::new()
            .connect_lazy("postgres://quillqay:test@localhost/quillqay")
            .unwrap();
        let service = AuthService::new(PostgresRepository::new(pool), 168);

        for _ in 0..5 {
            service
                .record_login_attempt("admin@example.com")
                .await
                .unwrap();
        }

        assert!(matches!(
            service.record_login_attempt("admin@example.com").await,
            Err(DomainError::RateLimited)
        ));
    }
}
