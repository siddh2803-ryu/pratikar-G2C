-- Pratikar Supabase Postgres + pgvector Schema
-- Conforms to Technology Stack & Architecture §8 and PRD §12
-- Single cascade deletion: deleting an analysis removes every derived row (Tech Stack §7.7)

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Root Entity: Analysis Session
CREATE TABLE IF NOT EXISTS analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('processing', 'complete', 'failed')),
    language TEXT NOT NULL DEFAULT 'en',
    expires_at TIMESTAMPTZ NOT NULL
);

-- 2. Document Entity
CREATE TABLE IF NOT EXISTS document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('letter', 'policy')),
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 1
);

-- 3. Structured Claim Record (PRD §12)
CREATE TABLE IF NOT EXISTS claim_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL UNIQUE REFERENCES analysis(id) ON DELETE CASCADE,
    insurer_name TEXT NOT NULL,
    policy_number TEXT,
    claim_reference TEXT,
    claim_amount NUMERIC(12, 2),
    rejection_date DATE NOT NULL,
    stated_ground TEXT NOT NULL,
    cited_clause_ref TEXT,
    policy_inception_date DATE,
    continuous_months INTEGER
);

-- 4. Policy Chunks with vector embeddings
CREATE TABLE IF NOT EXISTS policy_chunk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL CHECK (page_number >= 1),
    char_start INTEGER NOT NULL,
    char_end INTEGER NOT NULL,
    text TEXT NOT NULL,
    embedding vector(384) -- pgvector 384-dim embedding
);

-- 5. Rule Results (Path A Deterministic Evaluation)
CREATE TABLE IF NOT EXISTS rule_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL,
    provision_ref TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('pass', 'fail', 'not_applicable')),
    explanation TEXT NOT NULL
);

-- 6. Verdict Entity
CREATE TABLE IF NOT EXISTS verdict (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL UNIQUE REFERENCES analysis(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('strong', 'moderate', 'weak')),
    summary TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Evidence Items (The Evidence Trail, PRD FR-07)
CREATE TABLE IF NOT EXISTS evidence_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verdict_id UUID NOT NULL REFERENCES verdict(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('policy_span', 'provision')),
    policy_chunk_id UUID REFERENCES policy_chunk(id) ON DELETE SET NULL,
    page_number INTEGER,
    provision_ref TEXT,
    source_text TEXT NOT NULL,
    ordinal INTEGER NOT NULL
);

-- 8. Generated Documents
CREATE TABLE IF NOT EXISTS generated_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('gro_letter', 'grounds_request')),
    language TEXT NOT NULL DEFAULT 'en',
    storage_path TEXT NOT NULL
);

-- Indexes for vector similarity and cascade performance
CREATE INDEX IF NOT EXISTS idx_policy_chunk_embedding ON policy_chunk USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_document_analysis_id ON document(analysis_id);
CREATE INDEX IF NOT EXISTS idx_rule_result_analysis_id ON rule_result(analysis_id);
CREATE INDEX IF NOT EXISTS idx_evidence_item_verdict_id ON evidence_item(verdict_id);
CREATE INDEX IF NOT EXISTS idx_generated_doc_analysis_id ON generated_document(analysis_id);
