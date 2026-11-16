-- Migração: códigos de barras (interno do lote e externos do fornecedor)
-- Sistema AgroStock - TCC 2026
-- Executar este script no banco de dados almoxarifado
-- NÃO apagar dados existentes. NÃO recriar tabelas que já existem.
-- Compatível com registros antigos (código interno pode ser NULL).

-- ========================================
-- Tabela: codigos_fornecedores
-- Armazena códigos de barras externos (fornecedores/fabricantes) associados a produtos.
-- Relacionamento: 1 produto pode ter vários códigos de fornecedores (1:N).
-- ========================================
CREATE TABLE IF NOT EXISTS codigos_fornecedores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produto_id INT UNSIGNED NOT NULL,
    codigo_barras VARCHAR(100) NOT NULL,
    tipo_codigo VARCHAR(50) NULL,
    origem VARCHAR(100) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_codigos_fornecedores_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_codigo_barras_fornecedor (codigo_barras),
    INDEX idx_codigos_fornecedores_produto (produto_id),
    INDEX idx_codigos_fornecedores_codigo (codigo_barras)
) ENGINE=InnoDB;

-- ========================================
-- Tabela: lotes
-- Adicionar código de barras interno exclusivo para cada lote.
-- Relacionamento: 1 lote possui 1 código interno (1:1).
-- Registros antigos permanecem com código interno NULL (compatibilidade).
-- ========================================
ALTER TABLE lotes
    ADD COLUMN IF NOT EXISTS codigo_barras_interno VARCHAR(50) NULL AFTER numero_lote;

-- Índice UNIQUE para o código interno do lote (permite múltiplos NULLs para registros antigos).
-- O código interno é obrigatoriamente exclusivo por lote. Registros antigos mantêm o código
-- como NULL (permitindo múltiplos NULLs no índice UNIQUE do MySQL/MariaDB).
-- Se o índice já existir (execução anterior), este comando pode falhar; isso é esperado e
-- não impede o restante da migração. Executar manualmente se necessário:
--   CREATE UNIQUE INDEX uk_lotes_codigo_barras_interno ON lotes(codigo_barras_interno);
CREATE UNIQUE INDEX uk_lotes_codigo_barras_interno ON lotes(codigo_barras_interno);
