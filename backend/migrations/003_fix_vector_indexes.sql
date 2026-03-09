/**
 * Migration: Fix vector indexes
 * Remove problematic combined indexes and keep only vector indexes
 */

-- Drop the problematic combined indexes
DROP INDEX IF EXISTS memories_user_embedding_idx;
DROP INDEX IF EXISTS tasks_user_embedding_idx;

-- Keep only the HNSW vector indexes (these are fine)
-- Already exist from 002_add_vector_support.sql:
-- CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories USING hnsw (embedding vector_cosine_ops);
-- CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING hnsw (embedding vector_cosine_ops);

-- Add regular btree index on user_id (separate from embedding)
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories (user_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id);

COMMENT ON INDEX memories_embedding_idx IS 'HNSW index for fast vector similarity search on memories';
COMMENT ON INDEX tasks_embedding_idx IS 'HNSW index for fast vector similarity search on tasks';
COMMENT ON INDEX memories_user_id_idx IS 'Fast lookup by user_id';
COMMENT ON INDEX tasks_user_id_idx IS 'Fast lookup by user_id';
