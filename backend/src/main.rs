use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use axum::{
    http::{header, HeaderValue, Method},
    middleware,
    routing::{get, patch, post, put},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

mod config;
mod application;
mod domain;
mod infrastructure;

use application::{
    auth::AuthService, documents::DocumentService, notes::NoteService, projects::ProjectService,
    readiness::ReadinessService, storage_cleanup::StorageCleanupService,
};
use config::Config;
use domain::storage::{ContentMetadata, ObjectStorage};
use infrastructure::{
    persistence::postgres::PostgresRepository,
    storage::s3::S3ObjectStorage,
    web::{
        auth::{login, logout, me},
        documents::{
            create_document, delete_document, get_document, get_revision, list_documents,
            list_revisions, restore_document, restore_revision, save_document_content,
            update_document,
        },
        handlers::{health_check, readiness_check, ws_handler},
        middleware::validate_origin,
        notes::{create_note, delete_note, list_notes, update_note},
        projects::{
            create_project, delete_project, get_project, list_projects, restore_project,
            update_project,
        },
    },
};

#[derive(Clone)]
pub struct SessionCookieConfig {
    pub name: String,
    pub secure: bool,
    pub ttl_hours: u64,
}

pub struct AppState {
    pub auth_service: AuthService,
    pub project_service: ProjectService,
    pub document_service: DocumentService,
    pub note_service: NoteService,
    pub readiness_service: ReadinessService,
    pub storage: Arc<dyn ObjectStorage>,
    pub cookie: SessionCookieConfig,
    pub allowed_origin: HeaderValue,
    pub tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let _ = dotenvy::dotenv();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "quillqay_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env()?;

    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    match std::env::args().nth(1).as_deref() {
        Some("migrate") => {
            sqlx::migrate!("./migrations").run(&pool).await?;
            tracing::info!("database migrations completed");
            return Ok(());
        }
        Some("bootstrap-admin") => {
            bootstrap_admin(&pool).await?;
            return Ok(());
        }
        Some("storage-smoke-test") => {
            let storage = S3ObjectStorage::new(&config.storage);
            storage_smoke_test(&storage).await?;
            return Ok(());
        }
        Some("cleanup-storage") => {
            let storage: Arc<dyn ObjectStorage> =
                Arc::new(S3ObjectStorage::new(&config.storage));
            let cleanup =
                StorageCleanupService::new(PostgresRepository::new(pool), storage);
            let processed = cleanup.run_once().await?;
            tracing::info!(processed, "storage cleanup batch completed");
            return Ok(());
        }
        Some(command) => return Err(format!("unknown command: {command}").into()),
        None => {}
    }

    let storage: Arc<dyn ObjectStorage> = Arc::new(S3ObjectStorage::new(&config.storage));
    let readiness_service = ReadinessService::new(pool.clone(), storage.clone());
    let repository = PostgresRepository::new(pool);
    let auth_service = AuthService::new(
        repository.clone(),
        config.security.session_ttl_hours,
    );
    let project_service = ProjectService::new(repository.clone());
    let note_service = NoteService::new(repository.clone());
    let document_service = DocumentService::new(
        repository.clone(),
        storage.clone(),
        config.limits.document_max_bytes,
        config.limits.document_max_blocks,
    );
    let cleanup_service = StorageCleanupService::new(repository, storage.clone());
    let allowed_origin = config.server.allowed_origin.parse::<HeaderValue>()?;
    let (tx, _receiver) = broadcast::channel(100);

    let app_state = Arc::new(AppState {
        auth_service,
        project_service,
        document_service,
        note_service,
        readiness_service,
        storage,
        cookie: SessionCookieConfig {
            name: config.security.cookie_name.clone(),
            secure: config.security.cookie_secure,
            ttl_hours: config.security.session_ttl_hours,
        },
        allowed_origin: allowed_origin.clone(),
        tx,
    });

    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::exact(allowed_origin))
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::ACCEPT, header::CONTENT_TYPE]);

    let api = Router::new()
        .route("/auth/login", post(login))
        .route("/auth/logout", post(logout))
        .route("/auth/me", get(me))
        .route("/projects", get(list_projects).post(create_project))
        .route(
            "/projects/:project_id",
            get(get_project)
                .patch(update_project)
                .delete(delete_project),
        )
        .route("/projects/:project_id/restore", post(restore_project))
        .route(
            "/projects/:project_id/notes",
            get(list_notes).post(create_note),
        )
        .route(
            "/projects/:project_id/notes/:note_id",
            patch(update_note).delete(delete_note),
        )
        .route(
            "/projects/:project_id/documents",
            get(list_documents).post(create_document),
        )
        .route(
            "/projects/:project_id/documents/:document_id",
            get(get_document)
                .patch(update_document)
                .delete(delete_document),
        )
        .route(
            "/projects/:project_id/documents/:document_id/content",
            put(save_document_content),
        )
        .route(
            "/projects/:project_id/documents/:document_id/restore",
            post(restore_document),
        )
        .route(
            "/projects/:project_id/documents/:document_id/revisions",
            get(list_revisions),
        )
        .route(
            "/projects/:project_id/documents/:document_id/revisions/:revision_id",
            get(get_revision),
        )
        .route(
            "/projects/:project_id/documents/:document_id/revisions/:revision_id/restore",
            post(restore_revision),
        )
        .route_layer(middleware::from_fn_with_state(
            app_state.clone(),
            validate_origin,
        ));

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/ready", get(readiness_check))
        .route("/ws", get(ws_handler))
        .nest("/api/v1", api)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(app_state);

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
        interval.tick().await;
        loop {
            interval.tick().await;
            if let Err(error) = cleanup_service.run_once().await {
                tracing::warn!(error = %error, "storage cleanup batch failed");
            }
        }
    });

    let listener = tokio::net::TcpListener::bind(config.server.bind_addr).await?;
    tracing::info!("listening on {}", config.server.bind_addr);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn storage_smoke_test(
    storage: &dyn ObjectStorage,
) -> Result<(), Box<dyn std::error::Error>> {
    let key = format!("health/storage-smoke-{}.json", Uuid::new_v4());
    let expected = br#"{"status":"ok"}"#.to_vec();

    storage
        .put_content(
            &key,
            expected.clone(),
            ContentMetadata {
                checksum: "smoke-test".into(),
                schema_version: 1,
            },
        )
        .await?;
    let result = storage.get_content(&key).await;
    let cleanup_result = storage.delete_content(&key).await;

    let actual = result?;
    cleanup_result?;
    if actual != expected {
        return Err("storage smoke test returned unexpected content".into());
    }

    tracing::info!("storage smoke test completed");
    Ok(())
}

async fn bootstrap_admin(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let email = required_admin_env("ADMIN_EMAIL")?.trim().to_lowercase();
    let password = required_admin_env("ADMIN_PASSWORD")?;
    let display_name = std::env::var("ADMIN_DISPLAY_NAME")
        .ok()
        .filter(|name| !name.trim().is_empty());

    if !email.contains('@') {
        return Err("ADMIN_EMAIL must be a valid email address".into());
    }
    if password.chars().count() < 12 {
        return Err("ADMIN_PASSWORD must contain at least 12 characters".into());
    }

    let password_hash = Argon2::default()
        .hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng))
        .map_err(|error| format!("failed to hash administrator password: {error}"))?
        .to_string();

    let inserted = sqlx::query(
        r#"
        INSERT INTO users (id, email, password_hash, display_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(&email)
    .bind(password_hash)
    .bind(display_name)
    .execute(pool)
    .await?
    .rows_affected();

    if inserted == 1 {
        tracing::info!("initial administrator created");
    } else {
        tracing::info!("initial administrator already exists");
    }

    Ok(())
}

fn required_admin_env(name: &str) -> Result<String, Box<dyn std::error::Error>> {
    std::env::var(name)
        .ok()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("{name} must be set").into())
}
