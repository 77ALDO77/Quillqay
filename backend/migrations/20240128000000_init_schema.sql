-- Enable UUID extension if not already enabled (though we can generate UUIDs in app)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY,
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE, -- Hierarchical structure
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    data JSONB NOT NULL, -- Stores BlockData enum as JSON: {"type": "Text", "data": "..."}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- typically you might want an 'order' or 'rank' column for sorting blocks
);

CREATE INDEX idx_pages_parent_id ON pages(parent_id);
CREATE INDEX idx_blocks_page_id ON blocks(page_id);
