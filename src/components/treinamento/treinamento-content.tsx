"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, CheckCircle2, Circle, ChevronRight, ChevronLeft,
  LayoutDashboard, FileText, Calculator, Users, Bot, FolderOpen,
  BarChart3, Settings, Trophy, Lightbulb, HelpCircle, X, Check,
  PlayCircle, Lock, Star, GraduationCap, Zap, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────── */
interface Quiz {
  question: string;
  options: string[];
  correct: number;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string[];
  tips?: string[];
  quiz?: Quiz;
}

interface Module {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  lessons: Lesson[];
}

/* ── Course Data ────────────────────────────────────────────────────── */
const MODULES: Module[] = [
  {
    id: "introducao",
    title: "Primeiros Passos",
    icon: LayoutDashboard,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    lessons: [
      {
        id: "visao-geral",
        title: "Bem-vindo ao ConstruTech Pro",
        duration: "3 min",
        content: [
          "O ConstruTech Pro é uma plataforma completa de gestão de licitações públicas criada especialmente para construtoras, empreiteiras e empresas de engenharia.",
          "Com ele você centraliza todo o processo licitatório: do monitoramento de editais até a entrega da proposta final, passando por orçamentos, CRM e gestão documental.",
          "O sistema foi desenvolvido em conformidade com a Lei 14.133/2021 (Nova Lei de Licitações) e a Lei 8.666/93, garantindo que seus processos estejam sempre dentro da legalidade.",
        ],
        tips: [
          "Acesse o sistema diariamente para não perder prazos importantes.",
          "Configure alertas de e-mail em Configurações → Notificações.",
        ],
      },
      {
        id: "interface",
        title: "Conhecendo a Interface",
        duration: "4 min",
        content: [
          "A interface é dividida em três áreas principais: a barra lateral esquerda (navegação), a barra superior (perfil e ações rápidas) e a área central (conteúdo).",
          "Na barra lateral você encontra todos os módulos: Dashboard, Licitações, Orçamentos, CRM, Automações RPA, Documentos, Relatórios e Configurações.",
          "A barra lateral pode ser recolhida clicando na seta (◀) para ganhar mais espaço na tela. Clique novamente (▶) para expandir.",
          "No canto superior direito ficam seu avatar, nome e acesso rápido ao perfil. Clique para editar suas informações.",
        ],
        tips: [
          "Use o atalho de recolher a sidebar em telas menores para ter mais espaço.",
          "Clique no logo ConstruTech Pro para voltar sempre ao Dashboard.",
        ],
        quiz: {
          question: "Onde fica o botão para recolher a barra lateral?",
          options: [
            "No canto superior direito da tela",
            "Na própria barra lateral, representado por uma seta (◀)",
            "No menu de configurações",
            "No dashboard principal",
          ],
          correct: 1,
        },
      },
      {
        id: "dashboard",
        title: "O Dashboard",
        duration: "4 min",
        content: [
          "O Dashboard é sua central de controle. Ele exibe um resumo de tudo que está acontecendo: licitações em andamento, orçamentos pendentes, documentos vencendo e atividades recentes.",
          "Os cards no topo mostram os totais mais importantes: total de licitações, orçamentos ativos, documentos e valor total em propostas.",
          "O gráfico de pipeline mostra a distribuição das licitações por fase: Prospecção, Qualificação, Proposta, Negociação, Ganho e Perdido.",
          "A seção de alertas destaca ações urgentes: documentos vencendo, prazos próximos e licitações sem orçamento vinculado.",
        ],
        tips: [
          "Verifique o Dashboard toda manhã antes de começar o trabalho.",
          "Clique em qualquer card para ir direto à lista filtrada.",
        ],
      },
    ],
  },
  {
    id: "licitacoes",
    title: "Licitações",
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    lessons: [
      {
        id: "o-que-e",
        title: "Entendendo o Módulo",
        duration: "3 min",
        content: [
          "O módulo de Licitações é o coração do sistema. Aqui você cadastra, analisa e acompanha todas as oportunidades de licitação da sua empresa.",
          "Cada licitação tem: número do edital, órgão licitante, modalidade (Pregão, Concorrência, Tomada de Preços, etc.), data de abertura, status e valor estimado.",
          "Os status disponíveis são: Prospecção, Qualificação, Proposta, Negociação, Ganho e Perdido. Eles refletem o progresso da licitação no seu pipeline.",
          "A análise por IA (Claude) lê o edital em PDF ou texto e extrai automaticamente: requisitos de habilitação, prazos, critérios de julgamento e pontos de atenção.",
        ],
        tips: [
          "Use tags para organizar licitações por segmento (Pavimentação, Obras Civis, etc.).",
          "Vincule sempre um orçamento a cada licitação para rastrear a rentabilidade.",
        ],
      },
      {
        id: "cadastrar",
        title: "Cadastrando uma Licitação",
        duration: "5 min",
        content: [
          "Clique em 'Nova Licitação' no canto superior direito da lista de licitações.",
          "Preencha os campos obrigatórios: Título, Número do Edital, Órgão Licitante e Data de Abertura.",
          "Selecione a Modalidade correta: Pregão Eletrônico, Pregão Presencial, Concorrência, Tomada de Preços, Convite, Leilão ou RDC.",
          "Informe o Valor Estimado do contrato — isso é fundamental para os relatórios de pipeline e taxa de sucesso.",
          "Adicione o link do edital e faça upload dos documentos. O sistema aceita PDF, Word e imagens.",
          "Clique em 'Salvar' e a licitação aparecerá na lista com status 'Prospecção' por padrão.",
        ],
        tips: [
          "Preencha o campo 'Objeto' de forma clara — ele aparece nos relatórios e no CRM.",
          "Use o campo 'Observações' para registrar informações importantes que não têm campo específico.",
        ],
        quiz: {
          question: "Qual é o status padrão de uma licitação recém-cadastrada?",
          options: ["Qualificação", "Proposta", "Prospecção", "Negociação"],
          correct: 2,
        },
      },
      {
        id: "analise-ia",
        title: "Análise de Edital com IA",
        duration: "5 min",
        content: [
          "Na página de detalhes de uma licitação, clique em 'Analisar com IA' para ativar o assistente Claude.",
          "Cole o texto do edital ou descreva o que precisa ser analisado no campo de texto.",
          "A IA extrai automaticamente: requisitos de habilitação jurídica, fiscal, técnica e econômica; prazos de entrega; critérios de julgamento; e condições especiais.",
          "O resultado é apresentado de forma estruturada com os pontos críticos destacados. Salve a análise para consultar depois.",
          "Você também pode fazer perguntas específicas: 'Quais certidões são exigidas?' ou 'Qual é o critério de desempate?'.",
        ],
        tips: [
          "Quanto mais completo o texto do edital, melhor a análise da IA.",
          "Use a análise para preparar o checklist de habilitação antes de montar a proposta.",
        ],
      },
    ],
  },
  {
    id: "orcamentos",
    title: "Orçamentos",
    icon: Calculator,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    lessons: [
      {
        id: "criar",
        title: "Criando um Orçamento",
        duration: "5 min",
        content: [
          "Acesse Orçamentos no menu lateral e clique em 'Novo Orçamento'.",
          "Dê um nome descritivo ao orçamento (ex: 'Pavimentação Av. Central — Prefeitura SP') e selecione a licitação vinculada.",
          "Defina o BDI (Bonificação e Despesas Indiretas) — o padrão do mercado público é entre 22% e 28%.",
          "Configure os Encargos Sociais conforme o regime tributário da sua empresa (Simples Nacional, Lucro Presumido, etc.).",
          "Clique em 'Criar' para abrir o editor de orçamento completo.",
        ],
        tips: [
          "Sempre vincule o orçamento a uma licitação para facilitar o rastreamento.",
          "O BDI pode ser ajustado por item caso algum serviço tenha margem diferente.",
        ],
      },
      {
        id: "capitulos",
        title: "Capítulos e Itens",
        duration: "6 min",
        content: [
          "O orçamento é organizado em Capítulos (grandes grupos de serviço) e Itens dentro de cada capítulo.",
          "Para criar um capítulo, clique em '+ Capítulo' e dê um nome (ex: '1 - Serviços Preliminares', '2 - Terraplanagem').",
          "Dentro de cada capítulo, clique em '+ Item' para adicionar serviços. Preencha: descrição, unidade, quantidade e preço unitário.",
          "No campo 'Referência' informe o código SINAPI, SICRO, ORSE-SE ou SEINFRA correspondente (ex: SINAPI 74209/001).",
          "O sistema calcula automaticamente o total por item (quantidade × preço unitário) e o total do capítulo.",
          "O resumo do orçamento com BDI, encargos e total geral aparece no painel direito em tempo real.",
        ],
        tips: [
          "Organize os capítulos na mesma ordem da planilha exigida no edital.",
          "Use a referência SINAPI/ORSE-SE para justificar cada preço na proposta.",
        ],
        quiz: {
          question: "Como o sistema calcula o total de um item do orçamento?",
          options: [
            "Preço unitário + BDI",
            "Quantidade × Preço unitário",
            "Quantidade + Preço unitário + Encargos",
            "Preço unitário ÷ BDI",
          ],
          correct: 1,
        },
      },
      {
        id: "exportar",
        title: "Exportando e Compartilhando",
        duration: "3 min",
        content: [
          "Com o orçamento pronto, clique em 'Exportar' no canto superior direito do editor.",
          "Escolha o formato: PDF (formatado para apresentação) ou Excel (para edições e memórias de cálculo).",
          "O PDF inclui capa, resumo por capítulo, planilha de serviços com referências e totais com BDI.",
          "A análise de IA do orçamento identifica preços inconsistentes, serviços faltando e oportunidades de otimização do BDI.",
        ],
        tips: [
          "Exporte sempre em PDF antes de submeter a proposta para ter uma versão oficial arquivada.",
          "Use a análise de IA para revisar o orçamento antes da entrega.",
        ],
      },
    ],
  },
  {
    id: "crm",
    title: "CRM",
    icon: Users,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    lessons: [
      {
        id: "pipeline",
        title: "Pipeline de Oportunidades",
        duration: "5 min",
        content: [
          "O Pipeline é uma visualização em kanban (colunas) que mostra todas as licitações organizadas por fase.",
          "As fases são: Prospecção → Qualificação → Proposta → Negociação → Ganho / Perdido.",
          "Para mover uma licitação entre fases, selecione a licitação no menu suspenso e clique em 'Adicionar ao Funil' na fase correta.",
          "Cada card do pipeline mostra: nome da licitação, valor estimado, órgão e data de abertura.",
          "Clique no X de qualquer card para remover do funil sem excluir a licitação.",
        ],
        tips: [
          "Revise o pipeline semanalmente para manter as fases atualizadas.",
          "Foque seus recursos nas licitações que estão em 'Proposta' — elas têm prazo imediato.",
        ],
      },
      {
        id: "contatos",
        title: "Gerenciando Contatos",
        duration: "4 min",
        content: [
          "Em CRM → Contatos você cadastra pessoas: fiscais de contrato, pregoeiros, diretores de órgãos e parceiros.",
          "Cada contato tem: nome, cargo, e-mail, telefone, empresa vinculada e observações.",
          "Use a busca para encontrar contatos rapidamente pelo nome ou empresa.",
          "Manter contatos atualizados é fundamental para comunicação rápida durante o processo licitatório.",
        ],
        tips: [
          "Vincule o contato à organização (órgão público) para facilitar o relacionamento.",
          "Registre as preferências e histórico de cada contato no campo observações.",
        ],
        quiz: {
          question: "Para que serve o módulo de Contatos no CRM?",
          options: [
            "Apenas para clientes que já compraram",
            "Cadastrar pregoeiros, fiscais, diretores e parceiros relacionados às licitações",
            "Somente fornecedores de materiais",
            "Controlar funcionários da empresa",
          ],
          correct: 1,
        },
      },
      {
        id: "atividades",
        title: "Registrando Atividades",
        duration: "3 min",
        content: [
          "Em CRM → Atividades você registra interações: reuniões, ligações, e-mails, visitas técnicas e anotações.",
          "Cada atividade tem: tipo, título, descrição, data e licitação vinculada.",
          "O histórico de atividades é fundamental para rastrear o relacionamento com órgãos e o andamento de cada processo.",
          "Use o filtro por licitação para ver todo o histórico de interações de uma oportunidade específica.",
        ],
        tips: [
          "Registre toda reunião ou contato importante imediatamente após acontecer.",
          "Use o campo descrição para anotar decisões tomadas e próximos passos.",
        ],
      },
    ],
  },
  {
    id: "rpa",
    title: "Automações RPA",
    icon: Bot,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    lessons: [
      {
        id: "o-que-e-rpa",
        title: "O que é RPA?",
        duration: "3 min",
        content: [
          "RPA (Robotic Process Automation) são agentes automatizados que executam tarefas repetitivas no lugar da equipe.",
          "No ConstruTech Pro, os agentes RPA monitoram portais de licitação 24 horas por dia, 7 dias por semana, e importam editais relevantes automaticamente.",
          "Existem 3 tipos de agente: (1) Busca de Editais — monitora portais e importa novas licitações; (2) Atualização de Preços — consulta tabelas SINAPI/ORSE-SE/SEINFRA; (3) Alerta de Documentos — avisa sobre certidões vencendo.",
          "Os agentes executam em horários programados e enviam relatórios por e-mail ao final de cada execução.",
        ],
        tips: [
          "Configure pelo menos um agente de busca de editais para nunca perder oportunidades.",
          "O agente de documentos é fundamental para não perder prazos de certidões.",
        ],
      },
      {
        id: "configurar-rpa",
        title: "Configurando Agentes",
        duration: "5 min",
        content: [
          "Acesse Automações RPA no menu e clique em '+ Novo Agente'.",
          "Escolha o tipo de agente e dê um nome descritivo (ex: 'Monitor Licitações SP').",
          "Configure os parâmetros: palavras-chave de busca (ex: 'pavimentação', 'obras'), portais a monitorar e horário de execução.",
          "Ative o agente com o botão 'Ativo/Pausado'. Agentes ativos executam automaticamente no horário configurado.",
          "Na lista de agentes você vê: status (ativo/pausado), última execução, próxima execução e total de itens encontrados.",
        ],
        tips: [
          "Use palavras-chave específicas do seu segmento para evitar resultados irrelevantes.",
          "Configure o horário de execução para madrugada e receba o relatório de manhã.",
        ],
        quiz: {
          question: "Quais são os 3 tipos de agente RPA disponíveis?",
          options: [
            "Busca, Análise e Exportação",
            "Busca de Editais, Atualização de Preços e Alerta de Documentos",
            "Monitoramento, Cadastro e Relatório",
            "Importação, Exportação e Backup",
          ],
          correct: 1,
        },
      },
    ],
  },
  {
    id: "documentos",
    title: "Documentos",
    icon: FolderOpen,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    lessons: [
      {
        id: "repositorio",
        title: "Repositório de Documentos",
        duration: "4 min",
        content: [
          "Em Documentos → Repositório você armazena todos os documentos da empresa: certidões, registros, alvarás, balanços e contratos.",
          "Para enviar um documento, clique em 'Novo Documento', selecione o tipo, faça o upload do arquivo e informe a data de validade.",
          "Os tipos de documento incluem: Certidão Federal, Estadual, Municipal, Trabalhista, FGTS, Registro CREA, Balanço Patrimonial, Contrato Social e Outros.",
          "Use a busca e os filtros por tipo e status para encontrar documentos rapidamente durante a montagem de propostas.",
        ],
        tips: [
          "Sempre informe a data de validade — ela ativa os alertas automáticos.",
          "Mantenha sempre uma cópia atualizada de todas as certidões no repositório.",
        ],
      },
      {
        id: "validades",
        title: "Alertas de Validade",
        duration: "3 min",
        content: [
          "Em Documentos → Validades você tem uma visão geral de todos os documentos organizados por prazo de vencimento.",
          "O sistema usa um código de cores: Verde (mais de 30 dias), Amarelo (entre 8 e 30 dias), Laranja (1 a 7 dias) e Vermelho (vencido).",
          "O agente RPA de documentos envia automaticamente um e-mail para os administradores quando documentos estão próximos do vencimento.",
          "Clique em qualquer documento para ver os detalhes e fazer upload de uma versão renovada.",
        ],
        tips: [
          "Configure alertas para 30 dias antes do vencimento para ter tempo hábil de renovar.",
          "Documente certidões assim que forem emitidas para não perder o prazo.",
        ],
        quiz: {
          question: "O que significa a cor laranja nos alertas de validade?",
          options: [
            "Documento vencido",
            "Mais de 30 dias restantes",
            "Documento vence em 1 a 7 dias",
            "Documento em análise",
          ],
          correct: 2,
        },
      },
      {
        id: "templates",
        title: "Templates de Documentos",
        duration: "3 min",
        content: [
          "Em Documentos → Templates você acessa modelos prontos de documentos comuns em licitações.",
          "Os templates disponíveis incluem: Declaração de Idoneidade, Declaração de Menor, Proposta Comercial, Carta de Credenciamento e outros.",
          "Para usar um template, clique em 'Usar Template', preencha as variáveis (nome da empresa, CNPJ, dados do responsável) e baixe o documento preenchido.",
          "Você pode criar seus próprios templates em Word/PDF e salvá-los no sistema para reutilização.",
        ],
        tips: [
          "Mantenha os templates atualizados com os dados da empresa (endereço, CNPJ, representante legal).",
          "Revise sempre antes de usar — cada edital pode ter exigências específicas.",
        ],
      },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: BarChart3,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    lessons: [
      {
        id: "tipos",
        title: "Tipos de Relatório",
        duration: "4 min",
        content: [
          "O módulo de Relatórios oferece análises completas do desempenho da empresa em licitações.",
          "Relatório de Performance: taxa de sucesso (licitações ganhas vs participadas), evolução mensal e valor total contratado.",
          "Relatório de Pipeline: valor em cada fase do funil, tempo médio em cada etapa e previsão de receita.",
          "Relatório de Documentos: status de todas as certidões, alertas de vencimento e histórico de renovações.",
          "Relatório Financeiro: orçamentos emitidos, valores propostos e diferença entre estimado e realizado.",
        ],
        tips: [
          "Gere o relatório de performance mensalmente para acompanhar a taxa de sucesso.",
          "Use o relatório de pipeline em reuniões de planejamento estratégico.",
        ],
        quiz: {
          question: "O que o Relatório de Performance mostra?",
          options: [
            "Apenas as licitações perdidas",
            "Taxa de sucesso, evolução mensal e valor total contratado",
            "Somente os documentos vencidos",
            "Lista de todos os fornecedores",
          ],
          correct: 1,
        },
      },
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    icon: Settings,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-900/20",
    lessons: [
      {
        id: "perfil",
        title: "Meu Perfil",
        duration: "3 min",
        content: [
          "Em Configurações → Meu Perfil você atualiza seu nome e foto de perfil (avatar).",
          "O nome atualizado aparece imediatamente na barra superior após salvar.",
          "Para alterar sua senha, use o fluxo 'Esqueci minha senha' na tela de login — por segurança não é possível alterar direto no perfil.",
        ],
        tips: [
          "Mantenha seu perfil atualizado para identificação nas atividades do CRM.",
        ],
      },
      {
        id: "empresa",
        title: "Dados da Empresa",
        duration: "3 min",
        content: [
          "Em Configurações → Empresa você atualiza os dados cadastrais: nome, CNPJ, endereço, telefone, e-mail corporativo e segmentos de atuação.",
          "Os segmentos de atuação (ex: Obras Civis, Pavimentação, Saneamento) são usados nos filtros e nos relatórios.",
          "O e-mail corporativo é usado como remetente padrão para notificações e alertas.",
        ],
        tips: [
          "Mantenha o CNPJ atualizado — ele é usado para gerar certidões e documentos.",
          "Informe todos os segmentos de atuação para que o RPA encontre editais relevantes.",
        ],
      },
      {
        id: "usuarios",
        title: "Gerenciando Usuários",
        duration: "4 min",
        content: [
          "Em Configurações → Usuários (apenas Administradores) você gerencia os membros da equipe.",
          "Os perfis disponíveis são: Administrador (acesso total), Gerente (sem configurações), Orçamentista (foco em orçamentos) e Analista (somente leitura).",
          "Para adicionar um usuário, clique em '+ Novo Usuário', preencha nome, e-mail, senha e selecione o perfil.",
          "Usuários criados pelo administrador já têm o e-mail verificado e podem fazer login imediatamente.",
          "Para excluir, clique no ícone de lixeira — mas atenção: você não pode excluir sua própria conta.",
        ],
        tips: [
          "Crie usuários com o mínimo de permissão necessária (princípio do menor privilégio).",
          "Treine cada membro da equipe neste curso antes de liberar o acesso.",
        ],
        quiz: {
          question: "Qual perfil tem acesso total ao sistema, incluindo Configurações?",
          options: ["Analista", "Orçamentista", "Gerente", "Administrador"],
          correct: 3,
        },
      },
      {
        id: "billing",
        title: "Plano e Billing",
        duration: "3 min",
        content: [
          "Em Configurações → Plano & Billing você visualiza seu plano atual e pode fazer upgrade.",
          "Os planos disponíveis são: Free (grátis), Starter (R$ 69/mês) e Pro (R$ 99/mês).",
          "Para fazer upgrade, clique em 'Assinar [plano]' — você será direcionado ao checkout seguro do Stripe.",
          "O pagamento é processado com cartão de crédito. A cobrança é mensal e pode ser cancelada a qualquer momento.",
          "Após o pagamento, o plano é ativado imediatamente e os limites são ampliados.",
        ],
        tips: [
          "Comece com o Free para conhecer o sistema e faça upgrade quando precisar de mais recursos.",
          "O plano Pro inclui usuários ilimitados e licitações ilimitadas — ideal para equipes.",
        ],
      },
    ],
  },
];

/* ── Helpers ────────────────────────────────────────────────────────── */
const STORAGE_KEY = "construtech_treinamento_v1";

interface Progress {
  completedLessons: string[]; // lessonId[]
  quizAnswers: Record<string, number>; // lessonId → selectedOption
}

function loadProgress(): Progress {
  if (typeof window === "undefined") return { completedLessons: [], quizAnswers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Progress) : { completedLessons: [], quizAnswers: {} };
  } catch {
    return { completedLessons: [], quizAnswers: {} };
  }
}

function saveProgress(p: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function totalLessons(): number {
  return MODULES.reduce((acc, m) => acc + m.lessons.length, 0);
}

/* ── Main Component ─────────────────────────────────────────────────── */
export function TreinamentoContent() {
  const [progress, setProgress] = useState<Progress>({ completedLessons: [], quizAnswers: {} });
  const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);
  const [activeLessonId, setActiveLessonId] = useState(MODULES[0].lessons[0].id);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const activeModule = MODULES.find((m) => m.id === activeModuleId)!;
  const activeLesson = activeModule.lessons.find((l) => l.id === activeLessonId)!;
  const completed = progress.completedLessons.length;
  const total = totalLessons();
  const pct = Math.round((completed / total) * 100);

  // When switching lesson, reset quiz state
  function goToLesson(moduleId: string, lessonId: string) {
    setActiveModuleId(moduleId);
    setActiveLessonId(lessonId);
    setQuizSelected(null);
    setQuizSubmitted(false);
  }

  function markComplete() {
    const key = `${activeModuleId}/${activeLessonId}`;
    if (progress.completedLessons.includes(key)) return;
    const updated = { ...progress, completedLessons: [...progress.completedLessons, key] };
    setProgress(updated);
    saveProgress(updated);
    if (updated.completedLessons.length === total) setShowCertificate(true);
    else goNext();
  }

  function submitQuiz() {
    if (quizSelected === null) return;
    setQuizSubmitted(true);
    const key = `${activeModuleId}/${activeLessonId}`;
    const updated = {
      ...progress,
      quizAnswers: { ...progress.quizAnswers, [key]: quizSelected },
    };
    setProgress(updated);
    saveProgress(updated);
  }

  function goNext() {
    const modIdx = MODULES.findIndex((m) => m.id === activeModuleId);
    const lesIdx = activeModule.lessons.findIndex((l) => l.id === activeLessonId);
    if (lesIdx < activeModule.lessons.length - 1) {
      goToLesson(activeModuleId, activeModule.lessons[lesIdx + 1].id);
    } else if (modIdx < MODULES.length - 1) {
      const nextMod = MODULES[modIdx + 1];
      goToLesson(nextMod.id, nextMod.lessons[0].id);
    }
  }

  function goPrev() {
    const modIdx = MODULES.findIndex((m) => m.id === activeModuleId);
    const lesIdx = activeModule.lessons.findIndex((l) => l.id === activeLessonId);
    if (lesIdx > 0) {
      goToLesson(activeModuleId, activeModule.lessons[lesIdx - 1].id);
    } else if (modIdx > 0) {
      const prevMod = MODULES[modIdx - 1];
      goToLesson(prevMod.id, prevMod.lessons[prevMod.lessons.length - 1].id);
    }
  }

  const isFirst = activeModuleId === MODULES[0].id && activeLessonId === MODULES[0].lessons[0].id;
  const isLast =
    activeModuleId === MODULES[MODULES.length - 1].id &&
    activeLessonId === MODULES[MODULES.length - 1].lessons[MODULES[MODULES.length - 1].lessons.length - 1].id;
  const lessonKey = `${activeModuleId}/${activeLessonId}`;
  const isDone = progress.completedLessons.includes(lessonKey);

  /* ── Certificate Modal ── */
  if (showCertificate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
        <div className="max-w-lg w-full bg-card border-2 border-primary rounded-2xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Parabéns!</h1>
          <p className="text-muted-foreground mb-6">
            Você concluiu o treinamento completo do <strong>ConstruTech Pro</strong>.
            Agora você está pronto para usar o sistema com total eficiência.
          </p>
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-7 h-7 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
            <GraduationCap className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="font-medium text-foreground">Certificado de Conclusão</p>
            <p>ConstruTech Pro — Treinamento Completo</p>
            <p>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <button
            onClick={() => setShowCertificate(false)}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Voltar ao Treinamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-72 flex-shrink-0 border-r border-border bg-muted/20 overflow-y-auto">
        {/* Progress header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Progresso do Curso</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{completed} de {total} aulas</span>
            <span className="font-semibold text-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct === 100 && (
            <button
              onClick={() => setShowCertificate(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors font-medium"
            >
              <Trophy className="w-3.5 h-3.5" /> Ver Certificado
            </button>
          )}
        </div>

        {/* Modules list */}
        <nav className="p-3 space-y-1">
          {MODULES.map((mod) => {
            const modCompleted = mod.lessons.filter((l) =>
              progress.completedLessons.includes(`${mod.id}/${l.id}`)
            ).length;
            const isActiveModule = mod.id === activeModuleId;
            const Icon = mod.icon;

            return (
              <div key={mod.id}>
                <button
                  onClick={() => goToLesson(mod.id, mod.lessons[0].id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    isActiveModule
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", mod.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", mod.color)} />
                  </div>
                  <span className="flex-1 truncate">{mod.title}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {modCompleted}/{mod.lessons.length}
                  </span>
                </button>

                {isActiveModule && (
                  <ul className="mt-1 ml-9 space-y-0.5">
                    {mod.lessons.map((les) => {
                      const lesKey = `${mod.id}/${les.id}`;
                      const lesCompleted = progress.completedLessons.includes(lesKey);
                      const isActiveLesson = les.id === activeLessonId;
                      return (
                        <li key={les.id}>
                          <button
                            onClick={() => goToLesson(mod.id, les.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-left",
                              isActiveLesson
                                ? "bg-primary text-white"
                                : lesCompleted
                                ? "text-emerald-600 hover:bg-muted"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {lesCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{les.title}</span>
                            <span className="text-[10px] opacity-60">{les.duration}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <span className={cn("px-2 py-0.5 rounded-full font-medium", activeModule.bg, activeModule.color)}>
              {activeModule.title}
            </span>
            <ChevronRight className="w-3 h-3" />
            <span>{activeLesson.title}</span>
          </div>

          {/* Lesson header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-heading font-bold mb-1">{activeLesson.title}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <PlayCircle className="w-3.5 h-3.5" /> {activeLesson.duration} de leitura
                </span>
                {isDone && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-8">
            {activeLesson.content.map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground">
                {para}
              </p>
            ))}
          </div>

          {/* Tips */}
          {activeLesson.tips && activeLesson.tips.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">Dicas Práticas</span>
              </div>
              <ul className="space-y-2">
                {activeLesson.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quiz */}
          {activeLesson.quiz && (
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Verificação de Conhecimento</span>
              </div>
              <p className="text-sm font-medium mb-4">{activeLesson.quiz.question}</p>
              <div className="space-y-2 mb-4">
                {activeLesson.quiz.options.map((opt, i) => {
                  const isCorrect = i === activeLesson.quiz!.correct;
                  const isSelected = quizSelected === i;
                  return (
                    <button
                      key={i}
                      disabled={quizSubmitted}
                      onClick={() => !quizSubmitted && setQuizSelected(i)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                        quizSubmitted
                          ? isCorrect
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"
                            : isSelected
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-border text-muted-foreground opacity-50"
                          : isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold",
                          quizSubmitted && isCorrect ? "border-emerald-500 bg-emerald-500 text-white" :
                          quizSubmitted && isSelected ? "border-destructive bg-destructive text-white" :
                          isSelected ? "border-primary bg-primary text-white" : "border-border"
                        )}>
                          {quizSubmitted && isCorrect ? <Check className="w-3 h-3" /> :
                           quizSubmitted && isSelected && !isCorrect ? <X className="w-3 h-3" /> :
                           String.fromCharCode(65 + i)}
                        </div>
                        {opt}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!quizSubmitted ? (
                <button
                  disabled={quizSelected === null}
                  onClick={submitQuiz}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  Confirmar Resposta
                </button>
              ) : (
                <div className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  quizSelected === activeLesson.quiz.correct ? "text-emerald-600" : "text-destructive"
                )}>
                  {quizSelected === activeLesson.quiz.correct ? (
                    <><CheckCircle2 className="w-4 h-4" /> Correto! Ótimo trabalho.</>
                  ) : (
                    <><AlertCircle className="w-4 h-4" /> A resposta correta está destacada em verde.</>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={goPrev}
              disabled={isFirst}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            {!isDone ? (
              <button
                onClick={markComplete}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLast ? "Concluir Curso" : "Marcar como Concluída"}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={isLast}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
