"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Puzzle, Zap, Droplets, Building2, BarChart3, FileBox,
  CheckCircle2, ChevronDown, ChevronUp, Download, ExternalLink,
  Cpu, Star, ArrowRight,
} from "lucide-react";

interface PluginFeature {
  title: string;
  description: string;
}

interface Plugin {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  compatible: string[];
  features: PluginFeature[];
  highlights: string[];
}

const PLUGINS: Plugin[] = [
  {
    id: "construbim",
    name: "ConstruBIM",
    tagline: "Quantitativos automáticos do Civil 3D para o orçamento",
    description:
      "Converta seu projeto de infraestrutura em um orçamento ágil e preciso. Importe arquivos DWG, XML ou XLSX do Civil 3D© e obtenha quantitativos exatos na nuvem, sem manipulação manual de dados.",
    category: "Infraestrutura",
    icon: <Puzzle className="w-6 h-6" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    badge: "Civil 3D©",
    compatible: ["Civil 3D©", "DWG", "XML", "XLSX"],
    highlights: [
      "Importação automática de projetos",
      "Quantitativos exatos na nuvem",
      "Atualizações em minutos",
      "Colaboração entre projetistas e orçamentistas",
    ],
    features: [
      {
        title: "Eficiência descomplicada",
        description:
          "Importe facilmente os dados do seu projeto a partir de arquivos DWG, XML ou XLSX, e deixe o ConstruBIM convertê-los automaticamente em quantitativos na nuvem.",
      },
      {
        title: "Agilidade em cliques",
        description:
          "Interface intuitiva que vincula cada elemento do projeto de infraestrutura ao orçamento, gerando quantitativos de forma ágil e precisa.",
      },
      {
        title: "Colaboração sem dependência",
        description:
          "Conquiste autonomia na criação de orçamentos eficientes para projetos de infraestrutura civil e redefina a colaboração entre projetistas e orçamentistas.",
      },
      {
        title: "Atualizações em minutos",
        description:
          "Seu projeto mudou? Atualize os quantitativos com poucos cliques, sem manipulação manual em planilhas, reduzindo custos operacionais.",
      },
    ],
  },
  {
    id: "eletrico",
    name: "Construtech Elétrico",
    tagline: "Projetos elétricos de baixa tensão em minutos",
    description:
      "Elimine tarefas repetitivas em projetos elétricos de baixa tensão. Desde a modelagem dos eletrodutos até a exportação de quantitativos — tudo em poucos cliques no principal plugin de integração com Revit©.",
    category: "Elétrico",
    icon: <Zap className="w-6 h-6" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    badge: "Revit©",
    compatible: ["Revit©", "BIM"],
    highlights: [
      "Modelagem automática de eletrodutos",
      "Tags automáticas por circuito",
      "Quantitativos de fiação",
      "Conformidade com concessionárias",
    ],
    features: [
      {
        title: "Economize tempo",
        description:
          "Simplifique seu trabalho, desde a modelagem dos eletrodutos até a exportação de quantitativos, definindo padrões de entrada de acordo com cada concessionária de energia.",
      },
      {
        title: "Automatize processos manuais",
        description:
          "Otimize a construção de conduítes, defina as melhores rotas e automatize o processo de colocação de tags, reduzindo o trabalho de horas a poucos segundos.",
      },
      {
        title: "Documentação BIM fácil",
        description:
          "Além da rápida construção de conduítes e lançamento de tags automáticas, simplifica e agiliza a elaboração de projetos elétricos de baixa tensão no Revit©.",
      },
      {
        title: "Faça mais em menos tempo",
        description:
          "Crie e edite identificadores informativos de fiação em poucos cliques, remova e edite circuitos existentes com eficiência máxima.",
      },
    ],
  },
  {
    id: "hidraulico",
    name: "Construtech Hidráulico",
    tagline: "Projetos hidrossanitários em BIM sem complicações",
    description:
      "Plugin Revit© para dimensionamento da pressão da água, diâmetro de tubulações e criação de tubos com inclinação correta para sistemas de esgoto. Conforme as NBRs brasileiras.",
    category: "Hidrossanitário",
    icon: <Droplets className="w-6 h-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    badge: "Revit©",
    compatible: ["Revit©", "BIM", "NBR"],
    highlights: [
      "Dimensionamento conforme NBRs",
      "Água quente, fria e esgoto",
      "Cálculo automático de pressão",
      "Relatórios XLSX detalhados",
    ],
    features: [
      {
        title: "Adeus ao trabalho manual",
        description:
          "Elimine a necessidade de conferência de tabelas Excel para dimensionamento da pressão da água e conclua seu projeto hidrossanitário em minutos.",
      },
      {
        title: "Trabalhe com assertividade",
        description:
          "Detecte e corrija o nivelamento e as tubulações com facilidade. Elabore e edite cada sistema de maneira independente com visualização simplificada.",
      },
      {
        title: "Conforme as NBRs",
        description:
          "Dimensionamento e cálculo automático da pressão em total conformidade com as normas brasileiras, ajustando automaticamente aos valores mínimos e máximos.",
      },
      {
        title: "Custos em insights",
        description:
          "Explore relatórios personalizados em formato XLSX para monitorar os custos da obra e maximizar os resultados do seu empreendimento.",
      },
    ],
  },
  {
    id: "estrutural",
    name: "Construtech Estrutural",
    tagline: "Detalhamento estrutural automatizado no Revit — nova fase 2.0",
    description:
      "O Construtech Estrutural 2.0 transforma dados estruturais vindos do cálculo em um modelo inteligente, editável e pronto para detalhamento no Revit©, conectando cálculo, projeto executivo, planejamento e orçamento.",
    category: "Estrutural",
    icon: <Building2 className="w-6 h-6" />,
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-800/20",
    borderColor: "border-slate-200 dark:border-slate-700",
    badge: "v2.0 Novo",
    compatible: ["Revit©", "TQS©", "IFC", "BIM"],
    highlights: [
      "IFC → modelo BIM nativo Revit",
      "Importação do TQS©",
      "Armaduras convertidas automaticamente",
      "BIM 3D, 4D e 5D",
    ],
    features: [
      {
        title: "Do IFC ao modelo BIM de verdade",
        description:
          "O IFC deixa de ser apenas apoio visual e passa a ser o ponto de partida do projeto executivo. O plugin constrói automaticamente elementos estruturais nativos, geometrias posicionadas e armaduras prontas para edição.",
      },
      {
        title: "Mais produtividade, menos repetição",
        description:
          "Simplifica e acelera a criação de detalhes das armações: elevações e cortes de vigas, plantas de lajes, detalhes de pilares e fundações.",
      },
      {
        title: "Importação fácil do TQS©",
        description:
          "Importa dados do projeto estrutural do TQS© para detalhar armaduras em peças de concreto armado, mantendo conexão dinâmica com o modelo BIM.",
      },
      {
        title: "Atualizações dinâmicas e confiáveis",
        description:
          "Ao gerar elevações, seções e detalhes finais, as informações permanecem atualizadas conforme o modelo BIM é modificado, sem necessidade de reconstruir manualmente.",
      },
    ],
  },
  {
    id: "construbi",
    name: "ConstruBI",
    tagline: "Dados BIM em eficiência operacional no Power BI©",
    description:
      "Interaja com os dados de seus modelos BIM no Power BI© para obter controle visual e intuitivo. Visualize o que foi orçado, planejado ou construído em painéis interativos acessíveis de qualquer lugar.",
    category: "Business Intelligence",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    badge: "Power BI©",
    compatible: ["Power BI©", "IFC", "BIM"],
    highlights: [
      "Dashboards BIM interativos",
      "Importação de múltiplos IFCs",
      "Sem codificação necessária",
      "Acesso mobile e web",
    ],
    features: [
      {
        title: "Entenda sua obra visualmente",
        description:
          "Projetistas, orçamentistas e encarregados podem visualizar o que foi orçado, planejado ou construído, além de cronogramas de obra em painéis interativos.",
      },
      {
        title: "Arraste e solte seus dados BIM",
        description:
          "Sem codificação, interface intuitiva de arrastar e soltar para tomar decisões baseadas em dados BIM, visualizando diretamente no Power BI©.",
      },
      {
        title: "Explore seus modelos BIM",
        description:
          "Importe múltiplos modelos IFC, inclusive federados, com filtros, zoom, rotação livre e cortes em qualquer plano para visualização interna.",
      },
      {
        title: "Integre inteligência ao negócio",
        description:
          "Visualize diretamente no modelo os custos associados a insumos, mão de obra e equipamentos, e crie dashboards personalizados com esses dados.",
      },
    ],
  },
  {
    id: "orcabi",
    name: "OrçaBI",
    tagline: "Extração automática de quantitativos BIM para orçamentos 5D",
    description:
      "Plugin Revit© para importar projetos BIM e obter quantitativos exatos, alimentando automaticamente uma memória de cálculo eficiente na nuvem. Orçamento SINAPI completo em poucos minutos.",
    category: "Orçamento BIM",
    icon: <FileBox className="w-6 h-6" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    badge: "BIM 5D",
    compatible: ["Revit©", "SINAPI", "BIM", "IFC"],
    highlights: [
      "Orçamento SINAPI automático",
      "Quantitativos exatos do Revit",
      "Auditoria automática do modelo",
      "Atualizações dinâmicas",
    ],
    features: [
      {
        title: "Libere-se da planilha",
        description:
          "Importe seu projeto BIM no Revit© para o OrçaBI e obtenha quantitativos exatos, alimentando automaticamente uma memória de cálculo na nuvem, sem manipulação manual.",
      },
      {
        title: "Colaboração sem interferências",
        description:
          "Defina as etapas da obra em cada disciplina e facilite o trabalho de diferentes usuários no orçamento sem interferências.",
      },
      {
        title: "Atualizações dinâmicas",
        description:
          "Mantenha seu orçamento constantemente atualizado por meio de atualizações dinâmicas alinhadas aos critérios de orçamentação definidos por você.",
      },
      {
        title: "Auditoria automática",
        description:
          "O OrçaBI faz uma varredura no modelo, comparando-o com o orçamento e entrega relatório detalhado com os itens não orçados ou não vinculados.",
      },
    ],
  },
];

const CATEGORIES = ["Todos", "Infraestrutura", "Elétrico", "Hidrossanitário", "Estrutural", "Business Intelligence", "Orçamento BIM"];

export function PluginsContent() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  const filtered = activeCategory === "Todos"
    ? PLUGINS
    : PLUGINS.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold">Plugins & Integrações</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Expanda o poder da plataforma com plugins BIM para Revit©, Civil 3D© e Power BI©.
        </p>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Plugins disponíveis", value: "6", icon: <Puzzle className="w-4 h-4" /> },
          { label: "Softwares compatíveis", value: "5+", icon: <Cpu className="w-4 h-4" /> },
          { label: "Normas suportadas", value: "NBR / TCU / SINAPI", icon: <CheckCircle2 className="w-4 h-4" /> },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="text-primary">{s.icon}</div>
            <div>
              <p className="font-heading font-bold text-base">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plugin cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((plugin) => {
          const isExpanded = expandedPlugin === plugin.id;
          return (
            <div
              key={plugin.id}
              className={cn(
                "bg-card border rounded-xl overflow-hidden transition-all",
                plugin.borderColor
              )}
            >
              {/* Card header */}
              <div className={cn("px-5 pt-5 pb-4", plugin.bgColor)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-white/70 dark:bg-black/20", plugin.color)}>
                      {plugin.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-base">{plugin.name}</h3>
                        {plugin.badge && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold bg-white/60 dark:bg-black/20", plugin.color)}>
                            {plugin.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plugin.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Compatible badges */}
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {plugin.compatible.map((c) => (
                    <span key={c} className="text-xs px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded border border-white/30 dark:border-black/20 font-mono">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{plugin.description}</p>

                {/* Highlights */}
                <div className="grid grid-cols-2 gap-1.5">
                  {plugin.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Expandable features */}
                <button
                  onClick={() => setExpandedPlugin(isExpanded ? null : plugin.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors w-full"
                >
                  {isExpanded ? (
                    <><ChevronUp className="w-3.5 h-3.5" />Ocultar funcionalidades</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" />Ver todas as funcionalidades ({plugin.features.length})</>
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-3 border-t border-border pt-3">
                    {plugin.features.map((f) => (
                      <div key={f.title}>
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          {f.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-4 leading-relaxed">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="flex gap-2 pt-1 border-t border-border">
                  <button className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}>
                    <Download className="w-3.5 h-3.5" />
                    Instalar Plugin
                  </button>
                  <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Documentação
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration note */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Integração nativa com ConstruTech Pro</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Todos os plugins se integram diretamente à plataforma — quantitativos importados alimentam automaticamente os orçamentos,
              dados BIM ficam disponíveis no Planejamento e Medição, e relatórios são exportados para o módulo de Relatórios.
              Uma plataforma unificada, do projeto ao controle de obra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
