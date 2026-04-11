# 🎯 DIA

**Transforme sua produtividade em um jogo.** Planeje seu dia, execute o plano, pontue e evolua — todos os dias.

🌐 **[Acesse agora → dia-tryflowks-projects.vercel.app](https://dia-tryflowks-projects.vercel.app/)**

---

## Como funciona

O DIA é um app de produtividade gamificada que te ajuda a criar o hábito de planejar e executar seu dia com consistência.

### 1. 📋 Planeje
Crie tarefas no backlog organizadas por **6 categorias** (Exercício, Tarefa Chata, Brain In, Brain Out, Brain Wave, Social). No início do dia (ou na noite anterior), monte seu plano selecionando as tarefas, definindo a ordem e escolhendo seu **sapo do dia** 🐸 — aquela tarefa chata que você precisa encarar primeiro.

### 2. ⚡ Execute
Acompanhe seu progresso ao longo do dia. Marque tarefas como concluídas e veja sua pontuação subir em tempo real.

### 3. 🏆 Evolua
Ao fechar o dia, ganhe pontos baseados no que completou. Acumule score, suba de nível e desbloqueie badges.

---

## Pontuação

| Componente | Pontos |
|---|---|
| Exercício no dia | +0.3 |
| Sapo concluído 🐸 | +0.3 |
| Taxa de conclusão × 0.4 | até +0.4 |
| Bônus 6/6 categorias | +1.0 |
| **Máximo diário** | **2.0** |

## Níveis

| Nível | Score | Emblema |
|---|---|---|
| Iniciante | 0 — 49 | 🌱 |
| Consistente | 50 — 149 | ⚡ |
| Estrategista | 150 — 299 | 🎯 |
| Comandante | 300 — 499 | 🔥 |
| Lenda | 500+ | 👑 |

---

## Funcionalidades

- **Planejamento diário** com sugestões inteligentes, reordenação drag-and-drop e horários automáticos
- **Criação rápida de tarefas** direto no planejamento
- **6 categorias** para equilibrar seu dia (corpo, mente, social, tarefas chatas...)
- **Projetos** com cores para organizar tarefas por contexto
- **Sapo do dia** 🐸 — priorize a tarefa mais difícil
- **Google Calendar** — veja seus compromissos e importe como tarefas
- **Pontuação e níveis** — gamificação que motiva consistência
- **Badges** — conquistas por marcos alcançados
- **Calendário heatmap** — visualize sua performance ao longo do tempo
- **Sync em tempo real** — alterações refletem instantaneamente entre dispositivos
- **PWA** — instale no celular como um app nativo
- **Dados privados** — Row Level Security, cada usuário só vê o que é seu

---

## Tech Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Deploy | Vercel |
| Estilo | CSS-in-JS inline |
| Fonte | Outfit + JetBrains Mono |

---

## Desenvolvimento

### Setup local

```bash
# 1. Clone o repositório
git clone https://github.com/tryflowk/dia.git
cd dia

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Rode o dev server
npm run dev
```

### Variáveis de ambiente

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

<p align="center">
  Feito com 🧡 por <a href="https://github.com/tryflowk">tryflowk</a>
</p>
