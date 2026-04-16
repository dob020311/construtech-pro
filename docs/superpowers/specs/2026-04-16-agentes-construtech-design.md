# Design: Agentes de Desenvolvimento e Manutenção — ConstrutechPro

**Data:** 2026-04-16  
**Status:** Aprovado pelo usuário  
**Abordagem:** Onda B — desenvolvimento em ondas prioritárias + crons de manutenção

---

## Visão Geral

Dois tipos de agentes são criados:

1. **Agentes de Desenvolvimento** — Claude agents em worktrees isolados, cada um construindo um módulo completo
2. **Agentes de Manutenção** — Crons agendados que garantem qualidade e disponibilidade da plataforma

---

## Onda 1 — Agentes de Desenvolvimento Paralelos

### Agente 1: Medição de Obra

**Objetivo:** Módulo completo de boletim de medição (BM) vinculado ao orçamento.

**Arquivos a criar:**
- `src/app/medicao/page.tsx` — lista de medições com filtro por orçamento
- `src/app/medicao/[id]/page.tsx` — editor de medição
- `src/components/medicao/medicao-content.tsx`
- `src/components/medicao/medicao-editor.tsx`
- `src/server/routers/medicao.ts` — tRPC router

**Schema Prisma existente:** `Medicao`, `MedicaoItem` (já migrado)

**Funcionalidades:**
- Criar medição vinculada a um orçamento (número sequencial automático)
- Puxar itens das etapas do orçamento (OrcamentoItem → MedicaoItem)
- Preencher `quantityPrev` (previsto) e `quantityMeasured` (medido) por item
- Calcular % executado por etapa e total
- Workflow de status: PENDING → IN_PROGRESS → SUBMITTED → APPROVED → PAID
- Listagem com filtro por orçamento, status, período

**tRPC endpoints:**
- `medicao.list` — lista com paginação + filtros
- `medicao.create` — cria BM e importa itens do orçamento
- `medicao.get` — busca com itens
- `medicao.updateItem` — atualiza qtd medida
- `medicao.updateStatus` — avança status
- `medicao.delete` — exclui (soft: apenas PENDING)

---

### Agente 2: Compras e Cotações

**Objetivo:** Módulo de solicitação de compra, cotação de fornecedores e geração de pedido.

**Arquivos a criar:**
- `src/app/compras/page.tsx` — lista de compras
- `src/app/compras/[id]/page.tsx` — detalhe da compra
- `src/components/compras/compras-content.tsx`
- `src/components/compras/compra-detail.tsx`
- `src/server/routers/compras.ts`

**Schema Prisma existente:** `Compra`, `CompraItem`, `Cotacao` (já migrado)

**Funcionalidades:**
- Criar compra manual ou importar itens de um orçamento
- Adicionar itens com descrição, unidade, quantidade, preço estimado, categoria (ABC)
- Adicionar cotações de fornecedores (nome, contato, valor total, validade)
- Selecionar cotação vencedora (`selected: true`)
- Workflow: DRAFT → QUOTING → APPROVED → ORDERED → PARTIALLY_DELIVERED → DELIVERED
- Listagem com filtro por status e orçamento vinculado

**tRPC endpoints:**
- `compras.list`, `compras.get`, `compras.create`, `compras.update`
- `compras.addItem`, `compras.updateItem`, `compras.deleteItem`
- `compras.addCotacao`, `compras.selectCotacao`, `compras.deleteCotacao`
- `compras.updateStatus`, `compras.delete`

---

### Agente 3: Diário de Obra

**Objetivo:** Registro diário de campo por obra/orçamento.

**Arquivos a criar:**
- `src/app/diario-obra/page.tsx` — lista com filtro por data/obra
- `src/app/diario-obra/new/page.tsx` — formulário de novo registro
- `src/app/diario-obra/[id]/page.tsx` — visualização/edição
- `src/components/diario-obra/diario-content.tsx`
- `src/components/diario-obra/diario-form.tsx`
- `src/server/routers/diario.ts`

**Schema Prisma existente:** `DiarioObra` (já migrado)

**Funcionalidades:**
- Selecionar obra/orçamento vinculado
- Campos: data, turno (manhã/tarde/noite/dia completo), clima, nº de funcionários
- Texto livre: descrição das atividades, ocorrências, materiais utilizados, equipamentos
- Listagem com filtro por período e orçamento
- Visualização em lista cronológica por obra

**tRPC endpoints:**
- `diario.list`, `diario.get`, `diario.create`, `diario.update`, `diario.delete`

---

## Onda 2 — Após conclusão da Onda 1

### Agente 4: Planejamento (Cronograma)
- Timeline visual com tarefas, dependências, % progresso
- Vinculado ao orçamento (PlanejamentoTask schema)
- Gantt chart simplificado

### Agente 5: Relatórios
- Dashboard financeiro: orçado vs medido vs gasto
- Gráficos por etapa, por período
- Exportação PDF

---

## Crons de Manutenção

| Nome | Schedule | Ação |
|------|----------|------|
| TypeScript Guard | Diário 08h | `npx tsc --noEmit` — reporta erros de tipo |
| Deploy Health Monitor | A cada 6h | GET `https://www.construtechpro.com` — verifica HTTP 200 |
| Code Quality Weekly | Seg 09h | Revisa commits da semana: console.log, TODO/FIXME, imports não usados |

---

## Padrões de Implementação

Todos os agentes seguem os padrões do projeto existente:
- **Auth:** `getServerSession` em server components, `protectedProcedure` em tRPC
- **UI:** shadcn/ui components, Tailwind CSS, padrão visual dos módulos existentes (orcamentos, crm)
- **Estado:** `useState` + tRPC queries/mutations com `useUtils()` para invalidação
- **Formulários:** modais com confirmação, sem bibliotecas de form adicionais
- **TypeScript:** zero erros em `npx tsc --noEmit` antes de commitar
