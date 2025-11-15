-- fix_puxe_viagens_hora_saida_fix.sql
-- Corrige linhas em public.puxe_viagens onde `hora_saida` é anterior a `hora_chegada`
-- Estratégia segura:
-- 1) PREVIEW — mostra as linhas potencialmente afetadas
-- 2) BACKUP  — cria uma tabela de backup das linhas afetadas
-- 3) DRY-RUN — dentro de transação mostra quantas linhas seriam atualizadas e exemplos (ROLLBACK ao final)
-- 4) APPLY   — efetiva as alterações (substitua ROLLBACK por COMMIT quando validar)
-- Regra de correção aplicada nas UPDATEs:
--   - Se hora_saida < hora_chegada E updated_at > hora_chegada E (updated_at - hora_chegada) < 24 horas
--     => definir hora_saida = updated_at
--   - Recalcular tempo_unidade_min = round(extract(epoch from (hora_saida - hora_chegada))/60)
--   - Não tocar em linhas que já tenham hora_saida plausível
-- RISCO: alteramos timestamps de saída — por isso há BACKUP explícito.

-- =============================================================
-- PREVIEW: quais linhas têm hora_saida < hora_chegada OU tempo_unidade_min negativo
-- =============================================================
SELECT id, placa, hora_chegada, hora_saida, tempo_unidade_min, created_at, updated_at
FROM public.puxe_viagens
WHERE (
  (hora_chegada IS NOT NULL AND hora_saida IS NOT NULL AND hora_saida < hora_chegada)
  OR (NULLIF(tempo_unidade_min,'')::numeric IS NOT NULL AND (NULLIF(tempo_unidade_min,'')::numeric < 0))
)
ORDER BY placa, hora_chegada
LIMIT 200;

-- EXEMPLO (mostra somente os ids problemáticos):
SELECT id FROM public.puxe_viagens
WHERE (hora_saida IS NOT NULL AND hora_chegada IS NOT NULL AND hora_saida < hora_chegada)
LIMIT 100;

-- =============================================================
-- BACKUP: grava linhas afetadas em tabela de backup (ajuste o nome se necessário)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.puxe_viagens_bad_horasaida_backup_20251115 AS
SELECT *, now() AS backup_created_at
FROM public.puxe_viagens pv
WHERE (
  (pv.hora_chegada IS NOT NULL AND pv.hora_saida IS NOT NULL AND pv.hora_saida < pv.hora_chegada)
  OR (NULLIF(pv.tempo_unidade_min,'')::numeric IS NOT NULL AND (NULLIF(pv.tempo_unidade_min,'')::numeric < 0))
);

SELECT count(*) AS rows_backed_up FROM public.puxe_viagens_bad_horasaida_backup_20251115;

-- =============================================================
-- DRY-RUN: dentro de transação, calcula quantas linhas seriam atualizadas e mostra amostra
-- (no final ROLLBACK; substitua por COMMIT para aplicar)
-- =============================================================
BEGIN;

WITH candidates AS (
  SELECT id, placa, hora_chegada, hora_saida, created_at, updated_at,
    CASE WHEN updated_at > hora_chegada AND (updated_at - hora_chegada) < interval '24 hours' THEN updated_at ELSE NULL END AS proposed_saida
  FROM public.puxe_viagens
  WHERE hora_chegada IS NOT NULL AND hora_saida IS NOT NULL AND hora_saida < hora_chegada
)
, to_update AS (
  SELECT * FROM candidates WHERE proposed_saida IS NOT NULL
)
-- quantas seriam atualizadas
SELECT count(*) AS rows_would_be_updated FROM to_update;

-- amostra: id, placa, hora_chegada, hora_saida_old, proposed_saida, old_tempo, new_tempo (min)
SELECT id, placa, hora_chegada, hora_saida AS hora_saida_old, proposed_saida,
  tempo_unidade_min,
  ROUND(EXTRACT(EPOCH FROM (proposed_saida - hora_chegada))/60)::integer AS new_tempo_min
FROM to_update
ORDER BY placa
LIMIT 200;

-- ROLLBACK para não aplicar no dry-run
ROLLBACK;

-- =============================================================
-- APPLY: Se o DRY-RUN estiver OK, rode esta seção (REMOVA o ROLLBACK e use COMMIT)
-- =============================================================
-- BEGIN;
--
-- WITH candidates AS (
--   SELECT id, placa, hora_chegada, hora_saida, created_at, updated_at,
--     CASE WHEN updated_at > hora_chegada AND (updated_at - hora_chegada) < interval '24 hours' THEN updated_at ELSE NULL END AS proposed_saida
--   FROM public.puxe_viagens
--   WHERE hora_chegada IS NOT NULL AND hora_saida IS NOT NULL AND hora_saida < hora_chegada
-- )
-- , to_update AS (
--   SELECT * FROM candidates WHERE proposed_saida IS NOT NULL
-- )
-- , updated AS (
--   UPDATE public.puxe_viagens pv
--   SET hora_saida = t.proposed_saida,
--       tempo_unidade_min = ROUND(EXTRACT(EPOCH FROM (t.proposed_saida - t.hora_chegada))/60)::numeric,
--       updated_at = now()
--   FROM to_update t
--   WHERE pv.id = t.id
--   RETURNING pv.id
-- )
-- SELECT count(*) AS rows_updated FROM updated;
--
-- COMMIT;

-- =============================================================
-- Pós-aplica (verificação): mostrar linhas atualizadas/afetadas hoje
-- =============================================================
SELECT id, placa, hora_chegada, hora_saida, tempo_unidade_min, created_at, updated_at
FROM public.puxe_viagens
WHERE id IN (SELECT id FROM public.puxe_viagens_bad_horasaida_backup_20251115 LIMIT 100);

-- Recomendações:
-- 1) Rode a seção PREVIEW e verifique as linhas listadas.
-- 2) Rode a seção BACKUP (já criada automaticamente acima) e confirme o COUNT.
-- 3) Execute a seção DRY-RUN e confirme o número de linhas e a amostra.
-- 4) Se estiver satisfeito, descomente a seção APPLY (BEGIN...COMMIT) e execute-a.
-- 5) Depois verifique a UI e os cálculos do frontend.

-- Observação: este script é conservador e só atualiza linhas em que `updated_at` está > `hora_chegada`
-- e a diferença é menor que 24 horas — ajuste esses limites se necessário.
