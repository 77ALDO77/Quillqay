-- The pages/blocks schema was experimental and contains no production data.
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS pages;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled'))
);

CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email));

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE projects (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'primary',
    tags TEXT[] NOT NULL DEFAULT '{}',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX projects_owner_id_idx ON projects (owner_id);
CREATE INDEX projects_updated_at_idx ON projects (updated_at DESC);
CREATE INDEX projects_deleted_at_idx ON projects (deleted_at);

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    current_version BIGINT NOT NULL DEFAULT 0,
    current_object_key TEXT,
    current_checksum TEXT,
    current_size_bytes BIGINT,
    last_checkpoint_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT documents_project_id_id_unique UNIQUE (project_id, id),
    CONSTRAINT documents_current_version_nonnegative CHECK (current_version >= 0),
    CONSTRAINT documents_current_size_nonnegative CHECK (
        current_size_bytes IS NULL OR current_size_bytes >= 0
    )
);

CREATE INDEX documents_project_id_idx ON documents (project_id);
CREATE INDEX documents_updated_at_idx ON documents (updated_at DESC);
CREATE INDEX documents_deleted_at_idx ON documents (deleted_at);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version BIGINT NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    checksum TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    is_checkpoint BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT document_versions_document_version_unique UNIQUE (document_id, version),
    CONSTRAINT document_versions_version_positive CHECK (version > 0),
    CONSTRAINT document_versions_size_nonnegative CHECK (size_bytes >= 0)
);

CREATE INDEX document_versions_document_created_idx
    ON document_versions (document_id, created_at DESC);
CREATE INDEX document_versions_document_checkpoint_idx
    ON document_versions (document_id, is_checkpoint);

CREATE TABLE storage_cleanup_jobs (
    id UUID PRIMARY KEY,
    bucket TEXT NOT NULL,
    object_key TEXT NOT NULL,
    reason TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT storage_cleanup_jobs_object_unique UNIQUE (bucket, object_key),
    CONSTRAINT storage_cleanup_jobs_attempts_nonnegative CHECK (attempts >= 0)
);

CREATE INDEX storage_cleanup_jobs_pending_idx
    ON storage_cleanup_jobs (next_attempt_at)
    WHERE completed_at IS NULL;
