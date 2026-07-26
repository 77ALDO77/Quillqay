use std::{env, fmt, net::SocketAddr, str::FromStr};

#[derive(Clone)]
pub struct Config {
    pub database: DatabaseConfig,
    pub server: ServerConfig,
    pub storage: StorageConfig,
    pub security: SecurityConfig,
    pub limits: LimitsConfig,
}

#[derive(Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Clone)]
pub struct ServerConfig {
    pub bind_addr: SocketAddr,
    pub allowed_origin: String,
}

#[derive(Clone)]
pub struct StorageConfig {
    pub endpoint: String,
    pub region: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub content_bucket: String,
    pub assets_bucket: String,
    pub force_path_style: bool,
    pub request_timeout_seconds: u64,
}

#[derive(Clone)]
pub struct SecurityConfig {
    pub cookie_name: String,
    pub cookie_secure: bool,
    pub session_ttl_hours: u64,
}

#[derive(Clone)]
pub struct LimitsConfig {
    pub document_max_bytes: usize,
    pub document_max_blocks: usize,
}

#[derive(Debug)]
pub struct ConfigError(String);

impl fmt::Display for ConfigError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

impl std::error::Error for ConfigError {}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let config = Self {
            database: DatabaseConfig {
                url: required("DATABASE_URL")?,
                max_connections: parse("DATABASE_MAX_CONNECTIONS", 5)?,
            },
            server: ServerConfig {
                bind_addr: parse("BIND_ADDR", SocketAddr::from(([0, 0, 0, 0], 3000)))?,
                allowed_origin: required("ALLOWED_ORIGIN")?,
            },
            storage: StorageConfig {
                endpoint: required("S3_ENDPOINT")?,
                region: required("S3_REGION")?,
                access_key_id: required("S3_ACCESS_KEY_ID")?,
                secret_access_key: required("S3_SECRET_ACCESS_KEY")?,
                content_bucket: required("S3_CONTENT_BUCKET")?,
                assets_bucket: required("S3_ASSETS_BUCKET")?,
                force_path_style: parse("S3_FORCE_PATH_STYLE", true)?,
                request_timeout_seconds: parse("S3_REQUEST_TIMEOUT_SECONDS", 5)?,
            },
            security: SecurityConfig {
                cookie_name: value_or("SESSION_COOKIE_NAME", "quillqay_session"),
                cookie_secure: parse("SESSION_COOKIE_SECURE", true)?,
                session_ttl_hours: parse("SESSION_TTL_HOURS", 168)?,
            },
            limits: LimitsConfig {
                document_max_bytes: parse("DOCUMENT_MAX_BYTES", 1_048_576)?,
                document_max_blocks: parse("DOCUMENT_MAX_BLOCKS", 2_000)?,
            },
        };

        config.validate()?;
        Ok(config)
    }

    fn validate(&self) -> Result<(), ConfigError> {
        if self.database.max_connections == 0 {
            return Err(ConfigError(
                "DATABASE_MAX_CONNECTIONS must be greater than zero".into(),
            ));
        }
        if !matches!(
            self.server.allowed_origin.split_once("://"),
            Some(("http" | "https", host)) if !host.is_empty()
        ) {
            return Err(ConfigError(
                "ALLOWED_ORIGIN must be an absolute http(s) origin".into(),
            ));
        }
        if !matches!(
            self.storage.endpoint.split_once("://"),
            Some(("http" | "https", host)) if !host.is_empty()
        ) {
            return Err(ConfigError(
                "S3_ENDPOINT must be an absolute http(s) URL".into(),
            ));
        }
        if self.storage.content_bucket == self.storage.assets_bucket {
            return Err(ConfigError(
                "S3_CONTENT_BUCKET and S3_ASSETS_BUCKET must be different".into(),
            ));
        }
        if self.storage.request_timeout_seconds == 0 {
            return Err(ConfigError(
                "S3_REQUEST_TIMEOUT_SECONDS must be greater than zero".into(),
            ));
        }
        for (name, bucket) in [
            ("S3_CONTENT_BUCKET", &self.storage.content_bucket),
            ("S3_ASSETS_BUCKET", &self.storage.assets_bucket),
        ] {
            if !valid_bucket_name(bucket) {
                return Err(ConfigError(format!("{name} is not a valid S3 bucket name")));
            }
        }
        if self.security.cookie_name.trim().is_empty() {
            return Err(ConfigError("SESSION_COOKIE_NAME must not be empty".into()));
        }
        if self.security.session_ttl_hours == 0 {
            return Err(ConfigError(
                "SESSION_TTL_HOURS must be greater than zero".into(),
            ));
        }
        if self.limits.document_max_bytes == 0 || self.limits.document_max_blocks == 0 {
            return Err(ConfigError(
                "document limits must be greater than zero".into(),
            ));
        }
        Ok(())
    }
}

fn required(name: &str) -> Result<String, ConfigError> {
    env::var(name)
        .ok()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| ConfigError(format!("{name} must be set")))
}

fn value_or(name: &str, default: &str) -> String {
    env::var(name).unwrap_or_else(|_| default.to_owned())
}

fn parse<T>(name: &str, default: T) -> Result<T, ConfigError>
where
    T: FromStr,
    T::Err: fmt::Display,
{
    match env::var(name) {
        Ok(value) => value
            .parse()
            .map_err(|error| ConfigError(format!("{name} is invalid: {error}"))),
        Err(env::VarError::NotPresent) => Ok(default),
        Err(error) => Err(ConfigError(format!("{name} is invalid: {error}"))),
    }
}

fn valid_bucket_name(bucket: &str) -> bool {
    (3..=63).contains(&bucket.len())
        && bucket
            .bytes()
            .all(|byte| {
                byte.is_ascii_lowercase()
                    || byte.is_ascii_digit()
                    || matches!(byte, b'.' | b'-')
            })
        && bucket
            .as_bytes()
            .first()
            .is_some_and(u8::is_ascii_alphanumeric)
        && bucket
            .as_bytes()
            .last()
            .is_some_and(u8::is_ascii_alphanumeric)
}

#[cfg(test)]
mod tests {
    use super::valid_bucket_name;

    #[test]
    fn validates_s3_bucket_names() {
        assert!(valid_bucket_name("quillqay-content"));
        assert!(!valid_bucket_name("Quillqay-content"));
        assert!(!valid_bucket_name("-invalid"));
        assert!(!valid_bucket_name("ab"));
    }
}
