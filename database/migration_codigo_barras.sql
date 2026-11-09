-- Migração: adicionar coluna codigo_barras à tabela produtos
-- Executar este script no banco de dados almoxarifado

ALTER TABLE produtos
ADD COLUMN codigo_barras VARCHAR(50) NULL AFTER descricao,
ADD INDEX idx_produtos_codigo_barras (codigo_barras);

-- Atualizar produtos de exemplo com códigos de barras (EAN-13)
UPDATE produtos SET codigo_barras = '7891234567890' WHERE id = 1;
UPDATE produtos SET codigo_barras = '7891234567891' WHERE id = 2;
UPDATE produtos SET codigo_barras = '7891234567892' WHERE id = 3;
UPDATE produtos SET codigo_barras = '7891234567893' WHERE id = 4;
UPDATE produtos SET codigo_barras = '7891234567894' WHERE id = 5;
UPDATE produtos SET codigo_barras = '7891234567895' WHERE id = 6;
