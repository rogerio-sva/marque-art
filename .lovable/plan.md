
## Plano: Sistema de Login para Equipe

Como a ferramenta é apenas para sua equipe, vamos criar um sistema fechado: somente pessoas que já têm conta podem acessar. Não haverá página de cadastro público -- você cadastra os membros manualmente pelo backend.

### O que será criado

**1. Página de Login**
- Tela simples com email e senha
- Sem opção de "criar conta" (acesso fechado)
- Opção de "Esqueci minha senha" para recuperação

**2. Página de Redefinir Senha** (`/reset-password`)
- Para quando alguém esquece a senha
- Recebe o link por email e define nova senha

**3. Proteção das rotas**
- Toda a aplicação fica protegida: só acessa quem está logado
- Quem não está logado é redirecionado para o login
- Botão de logout no header

**4. Cadastro de membros da equipe**
- Você cadastra os usuários da equipe diretamente pelo painel do backend
- Não existe cadastro público, garantindo que só sua equipe acesse

---

### Detalhes Técnicos

**Novos arquivos:**
- `src/pages/Login.tsx` -- formulário de login (email + senha) e link "Esqueci minha senha"
- `src/pages/ResetPassword.tsx` -- formulário para definir nova senha após receber link por email
- `src/components/auth/ProtectedRoute.tsx` -- componente que verifica sessão e redireciona para `/login` se não autenticado
- `src/hooks/useAuth.ts` -- hook com `onAuthStateChange` + `getSession` para gerenciar estado de autenticação

**Alterações em arquivos existentes:**
- `src/App.tsx` -- adicionar rotas `/login` e `/reset-password`, envolver rotas protegidas com `ProtectedRoute`
- `src/components/layout/AppHeader.tsx` -- adicionar botão de logout

**Fluxo:**
1. Usuário acessa qualquer rota -> `ProtectedRoute` verifica sessão
2. Sem sessão -> redireciona para `/login`
3. Login com email/senha -> redireciona para `/`
4. "Esqueci minha senha" -> envia email com link para `/reset-password`
5. Logout -> limpa sessão e volta para `/login`

**Importante:** Como não terá cadastro público, os usuários da equipe precisam ser criados por você no painel do backend. Depois de implementar, te mostro como fazer isso.
