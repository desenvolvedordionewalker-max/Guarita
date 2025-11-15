-- Preview das datas calculadas para linhas com data = '2025-11-13'
-- Execute este arquivo primeiro para verificar os resultados antes de aplicar mudanças.

SELECT
  id,
  placa,
  data AS stored_date,
  hora_chegada,
  created_at,
  (((hora_chegada AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) AS date_from_hora_as_utc,
  (hora_chegada::date) AS date_from_hora_as_local,
  (((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date) AS date_from_created_as_utc
FROM public.puxe_viagens
WHERE data = '2025-11-13'
ORDER BY hora_chegada NULLS LAST;

-- Interprete os resultados e confirme se 'date_from_hora_as_utc' deve ser aplicado.
