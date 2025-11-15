**Instruções (Português): Corrigir `data` em `puxe_viagens`**

- **Objetivo:** Corrigir linhas com `data = '2025-11-13'` que na verdade pertencem ao dia `2025-11-14` devido a diferenças de timezone/armazenamento.
- **Fluxo recomendado:** Execute o preview SQL, verifique resultados, crie backup (o apply SQL já faz backup), então rode o script de aplicação se tudo estiver correto.

Arquivos adicionados:
- `sql/fix_puxe_viagens_preview.sql` — mostra as datas computadas (UTC -> America/Sao_Paulo e local).
- `sql/fix_puxe_viagens_apply.sql` — cria backup, atualiza `data` e instala trigger para prevenir regressões.
- `scripts/run_fix_puxe.ps1` — script PowerShell para executar os SQLs usando `psql` ou `supabase` CLI.

Como usar (resumido):
1. Abrir PowerShell na raiz do projeto.
2. Opcional: revisar o arquivo `sql/fix_puxe_viagens_preview.sql` no editor.
3. Executar:

```powershell
.\scripts\run_fix_puxe.ps1
```

4. Se solicitado, informe a connection URI do PostgreSQL (ou deixe em branco para usar `supabase CLI`).
5. Confirme antes de aplicar as alterações.

Observações:
- O trigger criado interpreta `hora_chegada` como UTC; se sua aplicação já grava horários locais, ajuste a função no SQL para usar `NEW.hora_chegada::date`.
- Faça rollback a partir da tabela `public.puxe_viagens_backup_20251114` se necessário.
