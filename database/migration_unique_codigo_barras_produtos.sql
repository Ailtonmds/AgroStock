-- Migração: garantir restrição UNIQUE na coluna codigo_barras da tabela produtos
-- Sistema AgroStock - TCC 2026
--
-- OBJETIVO: Impedir códigos de barras duplicados na tabela produtos,
-- garantindo integridade no cadastro e leitura de códigos de barras.
--
-- REGRAS:
--  - A coluna codigo_barras já existe (VARCHAR(50), NULL), criada pela
--    migration_codigo_barras.sql.
--  - Índices UNIQUE no MariaDB/MySQL permitem múltiplos valores NULL,
--    portanto produtos sem código de barras (NULL) continuam permitidos.
--  - NÃO apagar tabelas, colunas ou registros existentes.
--  - Esta migração é idempotente: executá-la mais de vezes não causa erro.
--
-- ANTES DE EXECUTAR:
--  - Verificar que não existam valores duplicados não-nulos em
--    produtos.codigo_barras. Caso existam, tratá-los (remover ou diferenciar)
--    antes de criar o índice UNIQUE, caso contrário a criação falhará.
--    Consulta de verificação:
--      SELECT codigo_barras, COUNT(*) AS qtd
--      FROM produtos
--      WHERE codigo_barras IS NOT NULL
--      GROUP BY codigo_barras
--      HAVING qtd > 1;
--
-- EXECUÇÃO:
--   mariadb -u USUARIO -pSENHA almoxarifado < migration_unique_codigo_barras_produtos.sql
--   ou via phpMyAdmin / cliente MySQL.

-- Verificar duplicados antes (retornar vazio = OK):
-- SELECT codigo_barras, COUNT(*) AS qtd FROM produtos WHERE codigo_barras IS NOT NULL GROUP BY codigo_barras HAVING qtd > 1;

-- Remover índice não-UNIQUE antigo (se existir) para evitar conflito de nomes.
-- MariaDB: ignorar erro caso o índice não exista.
SET @nomeIndice = (
    SELECT INDEX_NAME FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'produtos'
      AND INDEX_NAME = 'idx_produtos_codigo_barras'
      AND NON_UNIQUE = 1
    LIMIT 1
);

SET @sql = IFNULL(CONCAT('ALTER TABLE produtos DROP INDEX ', @nomeIndice), 'SELECT "Índice idx_produtos_codigo_barras não existe, nada a remover" AS aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índice UNIQUE (ignorar se já existir com este nome)
SET @existeUnique = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'produtos'
      AND INDEX_NAME = 'uk_produtos_codigo_barras'
      AND NON_UNIQUE = 0
    LIMIT 1
);

SET @sql = IF(@existeUnique = 0,
    'ALTER TABLE produtos ADD UNIQUE KEY uk_produtos_codigo_barras (codigo_barras)',
    'SELECT "Índice uk_produtos_codigo_barras já existe" AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Comentário: após esta migração, qualquer tentativa de inserir/atualizar
-- um codigo_barras duplicado (não-nulo) será rejeitada pelo banco com erro
-- de duplicidade (codigo SQL 23000). O backend trata esse erro e exibe
-- mensagem amigável ao usuário.
