-- Remove a coluna de níveis de acesso sem apagar usuários ou movimentações.
-- Execute uma única vez em bancos já existentes.
USE almoxarifado;

SET @coluna_nivel_existe = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME = 'nivel_acesso'
);

SET @sql_migracao = IF(
    @coluna_nivel_existe > 0,
    'ALTER TABLE usuarios DROP COLUMN nivel_acesso',
    'SELECT ''A coluna nivel_acesso já foi removida.'' AS resultado'
);

PREPARE stmt_migracao FROM @sql_migracao;
EXECUTE stmt_migracao;
DEALLOCATE PREPARE stmt_migracao;
