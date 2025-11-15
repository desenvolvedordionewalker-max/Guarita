-- apply_fix_qcd2d49.sql
-- Aplica correção para linhas de `public.puxe_viagens` da placa QCD2D49
-- Estratégia (segura e específica):
-- 1) Faz BACKUP das linhas afetadas para tabela auditável
-- 2) Em transação, atualiza apenas as linhas da placa QCD2D49 onde
--    hora_saida < hora_chegada (ou tempo_unidade_min negativo) e
--    updated_at parece plausível (maior que hora_chegada e < 24h)
-- 3) Recalcula `tempo_unidade_min` a partir de (hora_saida - hora_chegada)
-- Observação: cole e execute este arquivo no SQL editor do Supabase.

-- -------- PREVIEW (opcional) --------
SELECT id, placa, hora_chegada, hora_saida, tempo_unidade_min, created_at, updated_at
FROM public.puxe_viagens
WHERE placa = 'QCD2D49'
  AND (
    (hora_chegada IS NOT NULL AND hora_saida IS NOT NULL AND hora_saida < hora_chegada)
    OR (
      tempo_unidade_min IS NOT NULL
      AND (tempo_unidade_min::text ~ '^-?[0-9]+(\.[0-9]+)?$')
      AND (tempo_unidade_min::numeric < 0)
    )
  )
ORDER BY hora_chegada DESC
LIMIT 200;

-- -------- BACKUP --------
CREATE TABLE IF NOT EXISTS public.puxe_viagens_qcd2d49_bad_backup AS
SELECT *, now() AS backup_created_at
FROM public.puxe_viagens pv
WHERE pv.placa = 'QCD2D49'
  AND (
    (pv.hora_chegada IS NOT NULL AND pv.hora_saida IS NOT NULL AND pv.hora_saida < pv.hora_chegada)
    OR (
      pv.tempo_unidade_min IS NOT NULL
      AND (pv.tempo_unidade_min::text ~ '^-?[0-9]+(\.[0-9]+)?$')
      AND (pv.tempo_unidade_min::numeric < 0)
    )
  );

SELECT count(*) AS rows_backed_up FROM public.puxe_viagens_qcd2d49_bad_backup;

-- -------- APPLY (EXECUTE when ready) --------
BEGIN;

WITH candidates AS (
  SELECT id, placa, hora_chegada, hora_saida, created_at, updated_at,
    CASE WHEN updated_at > hora_chegada AND (updated_at - hora_chegada) < interval '24 hours' THEN updated_at ELSE NULL END AS proposed_saida
  FROM public.puxe_viagens
  WHERE placa = 'QCD2D49'
    AND hora_chegada IS NOT NULL
    AND hora_saida IS NOT NULL
    AND hora_saida < hora_chegada
), to_update AS (
  SELECT * FROM candidates WHERE proposed_saida IS NOT NULL
), updated AS (
  UPDATE public.puxe_viagens pv
  SET hora_saida = t.proposed_saida,
      tempo_unidade_min = ROUND(EXTRACT(EPOCH FROM (t.proposed_saida - t.hora_chegada))/60)::numeric,
      updated_at = now()
  FROM to_update t
  WHERE pv.id = t.id
  RETURNING pv.id, pv.placa
)
SELECT count(*) AS rows_updated FROM updated;

COMMIT;

-- -------- Verificação pós-aplica --------
SELECT id, placa, hora_chegada, hora_saida, tempo_unidade_min, created_at, updated_at
FROM public.puxe_viagens
WHERE placa = 'QCD2D49'
ORDER BY hora_chegada DESC
LIMIT 200;

-- FIM
