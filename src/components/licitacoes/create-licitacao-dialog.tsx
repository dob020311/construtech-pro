"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Modality } from "@prisma/client";
import { MODALITY_LABELS } from "@/lib/utils";

const schema = z.object({
  number: z.string().min(1, "Número é obrigatório"),
  modality: z.nativeEnum(Modality),
  object: z.string().min(3, "Objeto deve ter ao menos 3 caracteres"),
  organ: z.string().min(2, "Órgão é obrigatório"),
  estimatedValue: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  segment: z.string().optional(),
  closingDate: z.string().optional(),
  portalUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateLicitacaoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateLicitacaoDialog({ open, onClose }: CreateLicitacaoDialogProps) {
  const utils = trpc.useUtils();
  const { mutate, isPending } = trpc.licitacao.create.useMutation({
    onSuccess: () => {
      toast.success("Licitação criada com sucesso!");
      utils.licitacao.list.invalidate();
      utils.licitacao.getStats.invalidate();
      onClose();
      reset();
    },
    onError: (err) => {
      toast.error(err.message ?? "Erro ao criar licitação");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      modality: "PREGAO_ELETRONICO",
    },
  });

  function onSubmit(data: FormData) {
    mutate({
      number: data.number,
      modality: data.modality,
      object: data.object,
      organ: data.organ,
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue.replace(/\./g, "").replace(",", ".")) : undefined,
      state: data.state || undefined,
      city: data.city || undefined,
      segment: data.segment || undefined,
      closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
      portalUrl: data.portalUrl || undefined,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg">Nova Licitação</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Número do Edital *</label>
              <input
                {...register("number")}
                placeholder="PE 001/2024"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  errors.number ? "border-destructive" : "border-border"
                )}
              />
              {errors.number && <p className="text-xs text-destructive">{errors.number.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Modalidade *</label>
              <select
                {...register("modality")}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
              >
                {Object.entries(MODALITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Objeto *</label>
            <textarea
              {...register("object")}
              placeholder="Descrição do objeto da licitação..."
              rows={2}
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none",
                errors.object ? "border-destructive" : "border-border"
              )}
            />
            {errors.object && <p className="text-xs text-destructive">{errors.object.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Órgão Licitante *</label>
            <input
              {...register("organ")}
              placeholder="Prefeitura Municipal de..."
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                errors.organ ? "border-destructive" : "border-border"
              )}
            />
            {errors.organ && <p className="text-xs text-destructive">{errors.organ.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <input
                {...register("state")}
                placeholder="SP"
                maxLength={2}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prazo de Entrega</label>
              <input
                {...register("closingDate")}
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Valor Estimado (R$)</label>
              <input
                {...register("estimatedValue")}
                placeholder="500.000,00"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Segmento</label>
              <input
                {...register("segment")}
                placeholder="Obras Civis"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL do Portal</label>
            <input
              {...register("portalUrl")}
              placeholder="https://..."
              type="url"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { onClose(); reset(); }}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Criar Licitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
