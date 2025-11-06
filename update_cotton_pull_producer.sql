-- Script para atualizar produtor de "Santa Luzia" para "Bom Futuro" em cotton_pull
-- Execute este script no Supabase SQL Editor

-- 1. Verificar registros que serão atualizados
SELECT 
    id, 
    date, 
    producer, 
    plate, 
    rolls 
FROM cotton_pull 
WHERE producer = 'Santa Luzia'
ORDER BY date DESC;

-- 2. Atualizar todos os registros com produtor "Santa Luzia" para "Bom Futuro"
UPDATE cotton_pull
SET producer = 'Bom Futuro'
WHERE producer = 'Santa Luzia';

-- 3. Verificar resultado da atualização
SELECT 
    producer,
    COUNT(*) as total_registros
FROM cotton_pull
GROUP BY producer
ORDER BY producer;

-- Mensagem de sucesso
SELECT 'Produtor atualizado de "Santa Luzia" para "Bom Futuro" em todos os registros!' as status;
