-- Script de criação da tabela de transações
-- Execute este comando no console SQL do seu projeto Neon

CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  tipo TEXT,
  valor NUMERIC,
  estabelecimento TEXT,
  data TIMESTAMP,
  descricao_original TEXT,
  raw TEXT,
  hash TEXT UNIQUE,
  categoria TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index para busca rápida por hash
CREATE INDEX IF NOT EXISTS idx_transacoes_hash ON transacoes(hash);
