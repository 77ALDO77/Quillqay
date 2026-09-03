CREATE TABLE notes (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'primary',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT notes_color_check CHECK (color IN ('primary', 'secondary', 'tertiary'))
);

CREATE INDEX notes_project_id_idx ON notes (project_id);
CREATE INDEX notes_project_pinned_updated_idx ON notes (project_id, pinned DESC, updated_at DESC);
