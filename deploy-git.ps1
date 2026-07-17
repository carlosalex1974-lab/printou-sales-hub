# Script de Automatização de Git e Preparação para o Deploy
# Printou Sales Hub

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "🚀 Automatizador de Deploy - Printou Sales Hub" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Verificar se o Git está instalado
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não encontrado no seu sistema!" -ForegroundColor Red
    Write-Host "Por favor, instale o Git (https://git-scm.com) para continuar." -ForegroundColor Yellow
    Exit
}

# 2. Inicializar repositório Git
if (!(Test-Path .git)) {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Gray
    git init
} else {
    Write-Host "📦 Repositório Git já existente." -ForegroundColor Gray
}

# Criar .gitignore se não existir
if (!(Test-Path .gitignore)) {
    Write-Host "📄 Criando arquivo .gitignore..." -ForegroundColor Gray
    @("node_modules/", "dist/", "data/db.json", ".env", ".DS_Store") | Out-File -FilePath .gitignore -Encoding utf8
}

# 3. Adicionar arquivos e fazer commit
Write-Host "💾 Salvando alterações locais (Commit)..." -ForegroundColor Gray
git add .
git commit -m "feat: setup de producao unificado e modulo de seguranca"

# 4. Solicitar URL do GitHub
Write-Host ""
Write-Host "------------------------------------------------------" -ForegroundColor Yellow
Write-Host "Agora crie um repositório vazio no seu GitHub:" -ForegroundColor White
Write-Host "1. Acesse: https://github.com/new" -ForegroundColor Gray
Write-Host "2. Dê o nome de 'printou-sales-hub'" -ForegroundColor Gray
Write-Host "3. Deixe como Privado ou Público e clique em 'Create Repository'" -ForegroundColor Gray
Write-Host "------------------------------------------------------" -ForegroundColor Yellow
Write-Host ""

$gitUrl = Read-Host "Cole aqui a URL do seu repositório do GitHub (ex: https://github.com/seu-usuario/printou-sales-hub.git)"

if ($gitUrl -trim -eq "") {
    Write-Host "❌ URL inválida. O script foi cancelado." -ForegroundColor Red
    Exit
}

# 5. Vincular remote e subir código
Write-Host "🔗 Vinculando repositório remoto..." -ForegroundColor Gray
git remote remove origin 2>$null
git remote add origin $gitUrl
git branch -M main

Write-Host "⬆️ Enviando código para o GitHub..." -ForegroundColor Yellow
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "🎉 Código enviado com sucesso para o GitHub!" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "Próximo passo na Nuvem (Render.com):" -ForegroundColor White
    Write-Host "1. Acesse https://dashboard.render.com e faça login." -ForegroundColor Gray
    Write-Host "2. Clique em 'New +' e selecione 'Web Service'." -ForegroundColor Gray
    Write-Host "3. Conecte o repositório 'printou-sales-hub' que acabamos de criar." -ForegroundColor Gray
    Write-Host "4. Use as configurações:" -ForegroundColor Gray
    Write-Host "   - Command Build: npm run build" -ForegroundColor Gray
    Write-Host "   - Command Start: npm start" -ForegroundColor Gray
    Write-Host "5. Pronto! O Render gerará seu link público automaticamente." -ForegroundColor Gray
    Write-Host "======================================================" -ForegroundColor Green
} else {
    Write-Host "❌ Ocorreu um erro ao subir o código. Verifique se o repositório existe e se você tem permissão de acesso." -ForegroundColor Red
}
