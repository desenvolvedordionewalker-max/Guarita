-- Aplicação: backup, UPDATEs e trigger para corrigir a coluna `data` em public.puxe_viagens
-- ATENÇÃO: execute apenas depois de revisar o resultado do arquivo `fix_puxe_viagens_preview.sql`.

-- 1) Criar backup das linhas afetadas
CREATE TABLE IF NOT EXISTS public.puxe_viagens_backup_20251114 AS
SELECT *, now() AS backup_created_at
FROM public.puxe_viagens
WHERE data = '2025-11-13';

-- 2) Verificação rápida do backup
SELECT count(*) AS rows_backed_up FROM public.puxe_viagens_backup_20251114;

-- 3) UPDATE principal: usar hora_chegada interpretada como UTC -> converter para America/Sao_Paulo
UPDATE public.puxe_viagens
SET data = (((hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date)
WHERE data = '2025-11-13'
  AND (((hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) IS NOT NULL
  AND (((hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) <> data;

-- 4) UPDATE fallback: linhas sem hora_chegada — usar created_at interpretado como UTC
UPDATE public.puxe_viagens
SET data = (((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date)
WHERE data = '2025-11-13'
  AND hora_chegada IS NULL
  AND (((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) IS NOT NULL
  AND (((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) <> data;

-- 5) Verificação: quantas linhas agora aparecem com data = 2025-11-14
SELECT count(*) AS rows_with_20251114 FROM public.puxe_viagens WHERE data = '2025-11-14';

-- 6) Criar trigger para prevenir futuros erros: definir data a partir de hora_chegada (interpretada como UTC)
CREATE OR REPLACE FUNCTION public.set_data_from_hora_chegada()
RETURNS trigger AS $$
BEGIN
  IF NEW.hora_chegada IS NOT NULL THEN
    NEW.data := (((NEW.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date);
  ELSE
    NEW.data := (((now() AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_data_from_hora ON public.puxe_viagens;
CREATE TRIGGER trg_set_data_from_hora
BEFORE INSERT OR UPDATE ON public.puxe_viagens
FOR EACH ROW
EXECUTE FUNCTION public.set_data_from_hora_chegada();

-- 7) Recomendações: após executar, verifique algumas linhas manualmente com SELECTs.
-- Aplicação segura e abrangente para corrigir a coluna `data` em public.puxe_viagens
-- O objetivo: corrigir linhas onde a data atual armazenada (em `data`) difere da
-- data obtida a partir de `hora_chegada` (interpretada como UTC e convertida para
-- America/Sao_Paulo) ou, quando `hora_chegada` for NULL, a partir de `created_at`.

-- INSTRUÇÕES RÁPIDAS:
-- 1) Rode a seção PREVIEW (abaixo) no Supabase SQL editor para revisar as linhas afetadas.
-- 2) Se o preview mostrar o que você espera, rode a seção BACKUP (cria tabela de backup).
-- 3) Rode a seção DRY-RUN (aqui a operação é feita dentro de uma transação e termina com ROLLBACK).
--    Se o número de linhas atualizadas no DRY-RUN corresponder ao esperado, troque o
--    ROLLBACK por COMMIT para aplicar as alterações.
-- 4) Opcional: rode a seção TRIGGER para garantir que futuras inserções/updates tenham `data` correta.

-- =============================================================
-- PREVIEW: quantas linhas teriam a 'data' diferente da data convertida (UTC -> America/Sao_Paulo)
-- =============================================================
SELECT
  count(*) AS rows_mismatched
FROM public.puxe_viagens pv
WHERE (
    ((pv.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date IS NOT NULL
    AND ((pv.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date <> pv.data
  )
  OR (
    pv.hora_chegada IS NULL
    AND ((pv.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date IS NOT NULL
    AND ((pv.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date <> pv.data
  );

-- Amostra (mostra a data atual e as datas convertidas propostas)
SELECT id, data AS current_data, hora_chegada, created_at,
       (((hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) AS hora_chegada_local_date,
       (((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) AS created_at_local_date
FROM public.puxe_viagens pv
WHERE (
    ((pv.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date IS NOT NULL
    AND ((pv.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date <> pv.data
  )
  OR (
    pv.hora_chegada IS NULL
    AND ((pv.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date IS NOT NULL
    AND ((pv.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date <> pv.data
  )
ORDER BY id
LIMIT 200;

-- =============================================================
-- BACKUP: cria uma tabela de backup apenas com as linhas afetadas
-- =============================================================
-- Altere o nome da tabela de backup se quiser evitar sobrescrever backups anteriores.
CREATE TABLE IF NOT EXISTS public.puxe_viagens_backup_20251114 AS
SELECT *, now() AS backup_created_at
FROM public.puxe_viagens pv
WHERE (
    ((pv.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date IS NOT NULL
    AND ((pv.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date <> pv.data
  )
  OR (
    pv.hora_chegada IS NULL
    AND ((pv.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date IS NOT NULL
    AND ((pv.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date <> pv.data
  );

-- Ver quantas linhas foram salvas no backup
SELECT count(*) AS rows_backed_up FROM public.puxe_viagens_backup_20251114;

-- =============================================================
-- DRY-RUN (transação): aplica UPDATEs e retorna quantas linhas seriam atualizadas.
-- No final há um ROLLBACK; substitua por COMMIT; para efetivar.
-- =============================================================
BEGIN;

WITH computed AS (
  SELECT id,
    COALESCE(
      ((hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date,
      ((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date
    ) AS new_date
  FROM public.puxe_viagens
),
updated AS (
  UPDATE public.puxe_viagens pv
  SET data = c.new_date
  FROM computed c
  WHERE pv.id = c.id
    AND c.new_date IS NOT NULL
    AND pv.data IS DISTINCT FROM c.new_date
  RETURNING pv.id
)
SELECT count(*) AS rows_would_be_updated FROM updated;

-- Se o resultado acima estiver correto para você, substitua o ROLLBACK por COMMIT
ROLLBACK;

-- =============================================================
-- TRIGGER: função que define `data` com base em `hora_chegada` (interpretação UTC)
-- Rode esta seção se quiser garantir que novas inserções/updates mantenham `data` coerente.
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_data_from_hora_chegada()
RETURNS trigger AS $$
BEGIN
  IF NEW.hora_chegada IS NOT NULL THEN
    NEW.data := (((NEW.hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date);
  ELSE
    NEW.data := (((now() AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_data_from_hora ON public.puxe_viagens;
CREATE TRIGGER trg_set_data_from_hora
BEFORE INSERT OR UPDATE ON public.puxe_viagens
FOR EACH ROW
EXECUTE FUNCTION public.set_data_from_hora_chegada();

-- Recomendações finais: após aplicar (COMMIT), rode alguns SELECTs manuais para validar:
-- SELECT id, data, hora_chegada, created_at FROM public.puxe_viagens WHERE id IN (..);
-- E verifique se a UI agora exibe a data correta.
