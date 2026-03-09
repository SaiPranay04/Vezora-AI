/**
 * Migration: Add pgvector support for semantic search
 * Adds embedding columns to memories and tasks tables
 */

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to memories table
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Add embedding column to tasks table (for semantic task search)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Create indexes for fast vector similarity search
-- Using HNSW (Hierarchical Navigable Small World) for best performance
CREATE INDEX IF NOT EXISTS memories_embedding_idx 
ON memories USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS tasks_embedding_idx 
ON tasks USING hnsw (embedding vector_cosine_ops);

-- Add index on user_id + embedding for multi-user scenarios
CREATE INDEX IF NOT EXISTS memories_user_embedding_idx 
ON memories (user_id) INCLUDE (embedding);

CREATE INDEX IF NOT EXISTS tasks_user_embedding_idx 
ON tasks (user_id) INCLUDE (embedding);

COMMENT ON COLUMN memories.embedding IS 'Voyage AI embedding vector (1024 dimensions) for semantic search';
COMMENT ON COLUMN tasks.embedding IS 'Voyage AI embedding vector (1024 dimensions) for semantic task search';
