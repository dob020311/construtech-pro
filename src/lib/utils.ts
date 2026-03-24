import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ -";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Vencido há ${Math.abs(diffDays)} dia(s)`;
  if (diffDays === 0) return "Vence hoje";
  if (diffDays === 1) return "Vence amanhã";
  if (diffDays <= 7) return `Vence em ${diffDays} dias`;
  if (diffDays <= 30) return `Vence em ${Math.ceil(diffDays / 7)} semana(s)`;
  return formatDate(date);
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const MODALITY_LABELS: Record<string, string> = {
  PREGAO_ELETRONICO: "Pregão Eletrônico",
  PREGAO_PRESENCIAL: "Pregão Presencial",
  CONCORRENCIA: "Concorrência",
  TOMADA_PRECOS: "Tomada de Preços",
  CONVITE: "Convite",
  CONCURSO: "Concurso",
  DIALOGO_COMPETITIVO: "Diálogo Competitivo",
  RDC: "RDC",
};

export const STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: "Identificada",
  ANALYZING: "Analisando",
  GO: "Decisão GO",
  NO_GO: "Decisão NO-GO",
  BUDGETING: "Orçando",
  PROPOSAL_SENT: "Proposta Enviada",
  WON: "Ganhou",
  LOST: "Perdeu",
  CANCELED: "Cancelada",
};

export const STATUS_COLORS: Record<string, string> = {
  IDENTIFIED: "bg-slate-100 text-slate-700 border-slate-200",
  ANALYZING: "bg-blue-100 text-blue-700 border-blue-200",
  GO: "bg-green-100 text-green-700 border-green-200",
  NO_GO: "bg-red-100 text-red-700 border-red-200",
  BUDGETING: "bg-amber-100 text-amber-700 border-amber-200",
  PROPOSAL_SENT: "bg-purple-100 text-purple-700 border-purple-200",
  WON: "bg-emerald-100 text-emerald-700 border-emerald-200",
  LOST: "bg-red-100 text-red-800 border-red-200",
  CANCELED: "bg-gray-100 text-gray-600 border-gray-200",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  BUDGETEER: "Orçamentista",
  ANALYST: "Analista",
};
