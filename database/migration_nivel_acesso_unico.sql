-- Migração: unificar nível de acesso em um único tipo de usuário
-- Sistema AgroStock - TCC 2026
--
-- OBJETIVO: Eliminar a distinção entre "admin" e "operador", deixando
--           somente um tipo de usuário ("usuario") na tabela usuarios.
--
-- REGRAS:
--  - Altera a coluna nivel_acesso de ENUM('admin','operador') para ENUM('usuario').
--  - Atualiza registros existentes que tenham 'admin' ou 'operador' para 'usuario'.
--  - NÃO apagar tabelas, colunas ou registros.
--  * ATENÇÃO: esta migração só pode ser executada se não houver registros com
--    valores de nivel_acesso fora de 'admin'/'operador' (caso contrário o ALTER
--    TABLE falhará). O valor padrão passa a ser 'usuario'.
--
-- EXECUÇÃO:
--   mariadb -u USUARIO -pSENHA almoxarifado < migration_nivel_acesso_unico.sql
--   ou via phpMyAdmin / cliente MySQL.

-- 1. Atualizar registros existentes para o valor único 'usuario'
UPDATE usuarios SET nivel_acesso = 'usuario' WHERE nivel_acesso IN ('admin', 'operador');

-- 2. Alterar a coluna para aceitar somente o valor 'usuario'
ALTER TABLE usuarios MODIFY COLUMN nivel_acesso ENUM('usuario') NOT NULL DEFAULT 'usuario';
