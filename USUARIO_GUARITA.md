# 👤 Cadastro de Usuário Guarita

## 🔐 Dados do Usuário
- **Nome:** guarita
- **Senha:** 123456
- **Email:** guarita@iba.com
- **Role:** user

## 📋 Instruções de Instalação

### 1️⃣ **Executar Scripts SQL no Supabase**

Acesse o **Supabase Dashboard** → **SQL Editor** e execute os seguintes scripts **na ordem**:

#### **Script 1: Função de Autenticação**
```sql
-- Execute: create_auth_function.sql
```

#### **Script 2: Criar Usuário**
```sql
-- Execute: create_user_guarita.sql
```

### 2️⃣ **Verificar Criação**

No **SQL Editor**, execute para confirmar:

```sql
SELECT 
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM users 
WHERE username = 'guarita';
```

### 3️⃣ **Testar Login**

1. **Acesse** a aplicação
2. **Digite:**
   - Usuário: `guarita`
   - Senha: `123456`
3. **Clique** em "Entrar no Sistema"

## ⚡ Sistema de Autenticação

### **Antes (Mock Login):**
- ✅ Aceitava qualquer usuário/senha
- ✅ Armazenava apenas no localStorage

### **Agora (Banco Real):**
- 🔐 **Validação contra banco** Supabase
- 🔒 **Hash seguro** da senha (bcrypt)
- 👤 **Dados completos** do usuário
- 🛡️ **Função SQL segura** (SECURITY DEFINER)

## 🔧 Estrutura Implementada

### **Arquivos Criados:**
1. `create_user_guarita.sql` - Criar usuário no banco
2. `create_auth_function.sql` - Função de autenticação
3. `use-auth.ts` - Hook React para login
4. **Login.tsx modificado** - Interface atualizada

### **Fluxo de Autenticação:**
1. Usuário digita credenciais
2. React chama `useAuth.login()`
3. Hook executa função SQL `authenticate_user()`
4. Banco valida hash da senha
5. Retorna dados do usuário se válido
6. Armazena no localStorage + navegação

## 🎯 Benefícios

- ✅ **Segurança real** com hash de senhas
- ✅ **Validação no banco** de dados
- ✅ **Gerenciamento de usuários** completo
- ✅ **Roles e permissões** preparadas
- ✅ **Auditoria** de acessos
- ✅ **Escalabilidade** para múltiplos usuários

## 🚨 Importante

Execute os scripts SQL **antes** de testar o login!  
O sistema agora requer **usuário válido** no banco de dados.