CREATE TABLE IF NOT EXISTS diagrams (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    diagram_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagrams_project_id ON diagrams(project_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_project_type ON diagrams(project_id, diagram_type);
