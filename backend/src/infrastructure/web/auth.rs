use crate::{domain::entities::User, AppState};
use async_trait::async_trait;
use axum::{
    extract::{rejection::JsonRejection, FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::IntoResponse,
    Json,
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use serde::Deserialize;
use std::sync::Arc;
use time::Duration;

use super::error::ApiError;

#[derive(Deserialize)]
pub struct LoginRequest {
    email: String,
    password: String,
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
    payload: Result<Json<LoginRequest>, JsonRejection>,
) -> Result<(CookieJar, Json<User>), ApiError> {
    let Json(payload) = payload.map_err(ApiError::from)?;
    let (user, token) = state
        .auth_service
        .login(&payload.email, &payload.password)
        .await?;

    let cookie = Cookie::build((state.cookie.name.clone(), token))
        .http_only(true)
        .same_site(SameSite::Lax)
        .secure(state.cookie.secure)
        .path("/")
        .max_age(Duration::hours(state.cookie.ttl_hours as i64))
        .build();

    Ok((jar.add(cookie), Json(user)))
}

pub async fn logout(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
) -> Result<(CookieJar, StatusCode), ApiError> {
    if let Some(cookie) = jar.get(&state.cookie.name) {
        state.auth_service.logout(cookie.value()).await?;
    }

    let removal = Cookie::build(state.cookie.name.clone()).path("/").build();
    Ok((jar.remove(removal), StatusCode::NO_CONTENT))
}

pub async fn me(current_user: CurrentUser) -> Json<User> {
    Json(current_user.0)
}

pub struct CurrentUser(pub User);

#[async_trait]
impl FromRequestParts<Arc<AppState>> for CurrentUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        let token = jar
            .get(&state.cookie.name)
            .map(Cookie::value)
            .ok_or(crate::domain::errors::DomainError::Unauthorized)?;
        let user = state.auth_service.authenticate(token).await?;
        Ok(Self(user))
    }
}

impl IntoResponse for CurrentUser {
    fn into_response(self) -> axum::response::Response {
        Json(self.0).into_response()
    }
}
