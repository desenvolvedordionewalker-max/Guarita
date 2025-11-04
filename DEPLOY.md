# 🚀 Deploy do Sistema Guarita v2.0

## Status Atual
✅ **Código commitado no GitHub**  
✅ **Build de produção gerado**  
✅ **Sistema pronto para deploy**

## 📦 Repositório
https://github.com/dionewalkerinvestimentos-blip/guarita

## 🛠️ Opções de Deploy

### 1. Vercel (Recomendado - Gratuito)

#### Deploy Automático:
1. Acesse: https://vercel.com/dione-luis-walkers-projects
2. Clique em "Add New..." → "Project"
3. Importe o repositório: `dionewalkerinvestimentos-blip/guarita`
4. Configure as variáveis de ambiente:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```
5. Clique em "Deploy"
6. ✅ Deploy automático concluído!

#### Link direto para import:
https://vercel.com/new/clone?repository-url=https://github.com/dionewalkerinvestimentos-blip/guarita

### 2. Netlify (Alternativo - Gratuito)

1. Acesse [netlify.com](https://netlify.com)
2. Conecte com GitHub
3. Selecione o repositório `Guarita`
4. Configurações:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Adicione as variáveis de ambiente
6. Deploy!

### 3. Deploy Manual (Qualquer Servidor)

```bash
# 1. Clone o repositório
git clone https://github.com/desenvolvedordionewalker-max/Guarita.git
cd Guarita

# 2. Instale dependências
npm install

# 3. Configure .env
echo "VITE_SUPABASE_URL=sua_url" > .env
echo "VITE_SUPABASE_ANON_KEY=sua_chave" >> .env

# 4. Build para produção
npm run build

# 5. Upload dos arquivos da pasta 'dist/' para seu servidor
```

## 🔧 Variáveis de Ambiente Necessárias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## ✅ Funcionalidades Implementadas

- ✅ Dashboard com contadores corretos
- ✅ Puxe de algodão com campo Talhão
- ✅ Carregamento otimizado
- ✅ Modo TV melhorado
- ✅ Controle de veículos flexível
- ✅ Upload de fotos unificado

## 📊 Próximos Passos (v2.1)

- [ ] Sistema de letras maiúsculas
- [ ] Reset automático à meia-noite
- [ ] Click para lançar saída

## 🆘 Suporte

Para problemas de deploy, verifique:
1. Variáveis de ambiente configuradas
2. Conexão com Supabase
3. Logs de build/deploy