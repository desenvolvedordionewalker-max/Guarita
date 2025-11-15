<#
  Script PowerShell para automatizar: executa o preview, mostra o resultado,
  pergunta confirmação ao usuário e (se confirmado) executa o arquivo de aplicação.

  Uso:
    - Abra PowerShell na raiz do projeto (onde este script está localizado)
    - Execute: `pwsh .\scripts\run_fix_puxe.ps1`  (ou use powershell.exe se preferir)

  Requisitos:
    - `psql` instalado e disponível no PATH, ou
    - supabase CLI autenticada (alternativa mostrada abaixo).
#>
Clear-Host
Write-Host "== Correção automática: puxe_viagens data (2025-11-13 -> 2025-11-14) ==" -ForegroundColor Cyan

$previewFile = "./sql/fix_puxe_viagens_preview.sql"
$applyFile = "./sql/fix_puxe_viagens_apply.sql"

function Ask-ConnectionString {
    Write-Host "Informe a connection URI do PostgreSQL (ex: postgresql://user:password@host:port/dbname)" -NoNewline
    Write-Host "`nOu pressione Enter para usar supabase CLI (se estiver autenticado)." -ForegroundColor Yellow
    $conn = Read-Host "Connection URI (ou deixe vazio)"
    return $conn
}

$connUri = Ask-ConnectionString

if ($connUri -ne "") {
    # Verifica psql
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psql) {
        Write-Host "Comando 'psql' não encontrado no PATH. Instale psql ou use a supabase CLI." -ForegroundColor Red
        exit 1
    }

    Write-Host "Executando PREVIEW (não modifica DB)..." -ForegroundColor Green
    psql $connUri -f $previewFile

    $confirm = Read-Host "Deseja aplicar as alterações (backup + updates + trigger)? (s/N)"
    if ($confirm -match '^[sS]') {
        Write-Host "Aplicando alterações..." -ForegroundColor Yellow
        psql $connUri -f $applyFile
        Write-Host "Concluído. Verifique os resultados na aplicação e no banco." -ForegroundColor Green
    } else {
        Write-Host "Aborted. Nenhuma alteração foi feita." -ForegroundColor Cyan
    }
} else {
    Write-Host "Você escolheu usar supabase CLI. Executando apenas preview (requer supabase autenticado)." -ForegroundColor Green
    # rodar preview via supabase (se disponível)
    $sup = Get-Command supabase -ErrorAction SilentlyContinue
    if (-not $sup) {
        Write-Host "Supabase CLI não encontrado no PATH. Instale/autorize ou forneça a connection URI." -ForegroundColor Red
        exit 1
    }

    Write-Host "Executando PREVIEW com supabase..." -ForegroundColor Green
    supabase db query --file $previewFile

    $confirm = Read-Host "Deseja aplicar as alterações com supabase CLI? (s/N)"
    if ($confirm -match '^[sS]') {
        Write-Host "Aplicando alterações com supabase CLI..." -ForegroundColor Yellow
        supabase db query --file $applyFile
        Write-Host "Concluído. Verifique os resultados na aplicação e no banco." -ForegroundColor Green
    } else {
        Write-Host "Aborted. Nenhuma alteração foi feita." -ForegroundColor Cyan
    }
}
