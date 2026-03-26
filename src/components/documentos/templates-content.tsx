"use client";

import {
  FileText, Download, Eye, Copy, Star, Search,
  BookOpen, Scale, HardHat, Building2, ClipboardList, FileCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function downloadTemplate(t: Template) {
  const content = [
    "=".repeat(60),
    `CONSTRUTECH PRO — TEMPLATE DE DOCUMENTO`,
    "=".repeat(60),
    "",
    `Título: ${t.title}`,
    `Categoria: ${t.category}`,
    `Referência Legal: ${t.lei}`,
    `Páginas estimadas: ${t.pages}`,
    `Tags: ${t.tags.join(", ")}`,
    "",
    "-".repeat(60),
    "DESCRIÇÃO",
    "-".repeat(60),
    t.description,
    "",
    "-".repeat(60),
    "MODELO DO DOCUMENTO",
    "-".repeat(60),
    "",
    "[RAZÃO SOCIAL DA EMPRESA]",
    "CNPJ: ___.___.___/____-__",
    "Endereço: _______________________________________",
    "Telefone: (__)________-____  E-mail: ____________",
    "",
    `À [NOME DO ÓRGÃO LICITANTE]`,
    `Ref.: ${t.title}`,
    `Edital/Processo nº: ____________ — ____________`,
    "",
    `Conforme ${t.lei}, a empresa [RAZÃO SOCIAL], por`,
    "seu representante legal abaixo assinado, vem respeitosamente:",
    "",
    "[CONTEÚDO ESPECÍFICO DO DOCUMENTO]",
    "",
    "____________________________________________",
    "[Local], __ de ____________ de 20__.",
    "",
    "____________________________________________",
    "[Nome do Representante Legal]",
    "[Cargo]",
    "[CPF: ___.___.___-__]",
    "",
    "=".repeat(60),
    "Documento gerado pelo ConstruTech Pro",
    `www.construtech.pro — ${new Date().toLocaleDateString("pt-BR")}`,
    "=".repeat(60),
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  lei: string;
  pages: number;
  featured: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

const TEMPLATES: Template[] = [
  {
    id: "1",
    title: "Proposta Comercial — Pregão Eletrônico",
    description: "Modelo completo de proposta para PE, com planilha de preços, declarações e documentos de habilitação conforme Lei 14.133/2021.",
    category: "Proposta",
    tags: ["Pregão", "Lei 14.133", "Habilitação"],
    lei: "Lei 14.133/2021",
    pages: 12,
    featured: true,
    icon: FileText,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "2",
    title: "Proposta Comercial — Concorrência",
    description: "Modelo de proposta para Concorrência Pública com envelope de documentação técnica e preço separados.",
    category: "Proposta",
    tags: ["Concorrência", "Lei 14.133", "Técnica"],
    lei: "Lei 14.133/2021",
    pages: 18,
    featured: true,
    icon: Building2,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "3",
    title: "Declaração de Habilitação Jurídica",
    description: "Declaração padronizada de habilitação jurídica, regularidade fiscal e trabalhista para licitações públicas.",
    category: "Declaração",
    tags: ["Habilitação", "Jurídica", "Fiscal"],
    lei: "Art. 68 — Lei 14.133/2021",
    pages: 3,
    featured: false,
    icon: Scale,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    id: "4",
    title: "Planilha Orçamentária SINAPI",
    description: "Planilha de composição de custos com referência ao SINAPI, incluindo BDI, encargos sociais e cronograma físico-financeiro.",
    category: "Orçamento",
    tags: ["SINAPI", "BDI", "Cronograma"],
    lei: "Acórdão TCU 2622/2013",
    pages: 8,
    featured: true,
    icon: ClipboardList,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    id: "5",
    title: "Atestado de Capacidade Técnica",
    description: "Modelo de atestado de capacidade técnica para empresas construtoras, com campo para vistos do CREA.",
    category: "Atestado",
    tags: ["CREA", "Capacidade Técnica", "CAT"],
    lei: "Lei 14.133/2021",
    pages: 2,
    featured: false,
    icon: HardHat,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    id: "6",
    title: "Recurso Administrativo",
    description: "Modelo de recurso administrativo para impugnação de edital ou contestação de decisão em fase de habilitação.",
    category: "Recurso",
    tags: ["Recurso", "Impugnação", "Edital"],
    lei: "Art. 165 — Lei 14.133/2021",
    pages: 5,
    featured: false,
    icon: BookOpen,
    iconColor: "text-red-600",
    iconBg: "bg-red-50 dark:bg-red-950/30",
  },
  {
    id: "7",
    title: "Impugnação de Edital",
    description: "Peça de impugnação de edital com fundamentos jurídicos, prazo e endereçamento ao órgão licitante.",
    category: "Recurso",
    tags: ["Impugnação", "Prazo", "Fundamentação"],
    lei: "Art. 164 — Lei 14.133/2021",
    pages: 4,
    featured: false,
    icon: BookOpen,
    iconColor: "text-red-600",
    iconBg: "bg-red-50 dark:bg-red-950/30",
  },
  {
    id: "8",
    title: "Checklist de Habilitação",
    description: "Lista completa de documentos exigidos para habilitação em licitações de obras e serviços de engenharia.",
    category: "Checklist",
    tags: ["Checklist", "Habilitação", "Obras"],
    lei: "Lei 14.133/2021",
    pages: 2,
    featured: false,
    icon: FileCheck,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
];

const CATEGORIES = ["Todos", "Proposta", "Declaração", "Orçamento", "Atestado", "Recurso", "Checklist"];

export function TemplatesContent() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = category === "Todos" || t.category === category;
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const featured = filtered.filter((t) => t.featured);
  const rest = filtered.filter((t) => !t.featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Modelos prontos para licitações — Lei 14.133/2021 e Lei 8.666/93
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
          <Star className="w-3.5 h-3.5 text-yellow-500" />
          {TEMPLATES.length} templates disponíveis
        </div>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                category === cat
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <h2 className="text-sm font-semibold text-foreground">Em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((t) => (
              <TemplateCard key={t.id} template={t} onPreview={setPreviewId} />
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {rest.length > 0 && (
        <div>
          {featured.length > 0 && (
            <h2 className="text-sm font-semibold text-foreground mb-3">Outros Templates</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((t) => (
              <TemplateCard key={t.id} template={t} onPreview={setPreviewId} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum template encontrado</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Tente outro termo de busca</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewId && (
        <PreviewModal
          template={TEMPLATES.find((t) => t.id === previewId)!}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}

function TemplateCard({
  template: t,
  onPreview,
}: {
  template: Template;
  onPreview: (id: string) => void;
}) {
  const Icon = t.icon;
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow group">
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", t.iconBg)}>
          <Icon className={cn("w-5 h-5", t.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{t.title}</h3>
            {t.featured && <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t.lei}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{t.description}</p>

      <div className="flex flex-wrap gap-1">
        {t.tags.map((tag) => (
          <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">{t.pages} {t.pages === 1 ? "página" : "páginas"}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(t.id)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Pré-visualizar
          </button>
          <button
            onClick={() => downloadTemplate(t)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ template: t, onClose }: { template: Template; onClose: () => void }) {
  const Icon = t.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", t.iconBg)}>
              <Icon className={cn("w-4 h-4", t.iconColor)} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-foreground text-sm">{t.title}</h2>
              <p className="text-xs text-muted-foreground">{t.lei} · {t.pages} páginas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descrição</h3>
            <p className="text-sm text-foreground leading-relaxed">{t.description}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categorias e Tags</h3>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{t.category}</span>
              {t.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pré-visualização</h3>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs text-muted-foreground space-y-1.5">
              <p className="font-bold text-foreground">[EMPRESA] — {t.title.toUpperCase()}</p>
              <p>CNPJ: ___.___.___/____-__</p>
              <p>Referente à licitação: ___________________</p>
              <p>Órgão licitante: _________________________</p>
              <p className="border-t border-border pt-1.5 mt-1.5">
                Conforme {t.lei}, a empresa declara / propõe / atesta...
              </p>
              <p className="text-muted-foreground/60 italic">
                [Conteúdo completo disponível após download — {t.pages} páginas]
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => downloadTemplate(t)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Template
          </button>
          <button className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
