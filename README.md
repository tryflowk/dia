# 🎯 DIA

Produtividade gamificada. Planeje seu dia, execute o plano, pontue e evolua.

## Stack

- **React 18** + Vite
- **Supabase** (PostgreSQL + Auth + RLS)
- **PWA** — instalável no celular
- Deploy gratuito na **Vercel**

## Setup

### 1. Supabase (gratuito)

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** e cole o conteúdo de `supabase-schema.sql` — clique **Run**
4. Vá em **Authentication → Settings** e desmarque "Enable email confirmations" (para testes)
5. Vá em **Settings → API** e copie a **Project URL** e a **anon public key**

### 2. Configurar o app

```bash
cp .env.example .env
```

Edite o `.env` com os valores do Supabase:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Rodar local

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`

### 4. Deploy na Vercel (gratuito)

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta GitHub
2. Importe o repositório
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique **Deploy**

## Funcionalidades

- ✅ Login/cadastro com email e senha (sincroniza entre dispositivos)
- ✅ Criação de tarefas com 6 categorias, urgência, importância e chatice
- ✅ Projetos com cores para organizar tarefas
- ✅ Planejamento diário com sugestões inteligentes
- ✅ Edição de plano do dia (adicionar/remover tarefas, trocar sapo)
- ✅ Reabrir dia fechado para correções
- ✅ Marcação de sapo do dia (🐸)
- ✅ Reordenação por drag-and-drop
- ✅ Fechamento do dia com cálculo de pontuação
- ✅ Score acumulado, níveis e badges
- ✅ Calendário heatmap de performance
- ✅ Confetti em dias de alta performance
- ✅ PWA — funciona offline e instala no celular
- ✅ Row Level Security — dados isolados por usuário

## Pontuação

| Componente | Pontos |
|---|---|
| Exercício no dia | +0.3 |
| Sapo concluído | +0.3 |
| Taxa de conclusão × 0.4 | até +0.4 |
| Bônus 6/6 categorias | +1.0 |
| **Máximo diário** | **2.0** |
