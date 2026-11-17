-- Migração: criar tabela de histórico de leituras do scanner
-- Sistema AgroStock - TCC 2026
--
-- OBJETIVO: Registrar tentativas de leitura de código de barras feitas
-- pelo leitor USB/Bluetooth, separadamente do histórico oficial de
-- movimentações de estoque. Uma leitura não significa necessariamente
-- uma movimentação.
--
-- TABELA: historico_leituras_scanner
--  - codigo_lido: código bruto lido pelo scanner (VARCHAR, preserva zeros)
--  - produto_id: produto identificado (NULL se não encontrado)
--  - resultado: 'sucesso', 'nao_encontrado', 'invalido', 'erro_comunicacao'
--  - tela_origem: 'entrada', 'saida', 'produtos', etc.
--  - usuario_id: usuário logado (se houver autenticação)
--  - lido_em: data e horário da leitura
--
-- NÃO misturar com a tabela movimentacoes (entrada/saída de estoque).
--
-- EXECUÇÃO:
--   mariadb -u USUARIO -pSENHA almoxarifado < migration_historico_leituras_scanner.sql

CREATE TABLE IF NOT EXISTS historico_leituras_scanner (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_lido VARCHAR(100) NOT NULL,
    produto_id INT UNSIGNED NULL,
    resultado ENUM('sucesso','nao_encontrado','invalido','erro_comunicacao') NOT NULL,
    tela_origem VARCHAR(50) NOT NULL,
    usuario_id INT UNSIGNED NULL,
    lido_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hist_leituras_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    CONSTRAINT fk_hist_leituras_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_hist_leituras_codigo (codigo_lido),
    INDEX idx_hist_leituras_resultado (resultado),
    INDEX idx_hist_leituras_lido_em (lido_em),
    INDEX idx_hist_leituras_tela (tela_origem)
) ENGINE=InnoDB;

-- Comentário: esta tabela armazena apenas tentativas de leitura do scanner.
-- Não afeta o estoque nem o histórico oficial de movimentações.
