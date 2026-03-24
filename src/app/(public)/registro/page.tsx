"use client";

import { Building2, Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

const schema = z.object({
  companyName: z.string().min(3, "Nome da empresa muito curto"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegistroPage() {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    // In production, this would call a registration API
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Solicitação enviada! Entraremos em contato em breve.");
    setSubmitted(true);
    console.log("Registration data:", data);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-2">Solicitação enviada!</h2>
          <p className="text-muted-foreground mb-6">
            Nossa equipe analisará sua solicitação e entrará em contato em até 24h.
          </p>
          <Link href="/login" className="text-primary font-medium hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-lg leading-tight">ConstruTech Pro</p>
            <p className="text-xs text-muted-foreground">Solicitar acesso</p>
          </div>
        </div>

        <h2 className="text-xl font-heading font-bold mb-1">Criar conta</h2>
        <p className="text-sm text-muted-foreground mb-6">Preencha os dados da sua empresa para solicitar acesso</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome da Empresa *</label>
            <input {...register("companyName")} placeholder="Construtora XYZ Ltda." className={cn("w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.companyName ? "border-destructive" : "border-border")} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">CNPJ *</label>
            <input {...register("cnpj")} placeholder="00.000.000/0001-00" className={cn("w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.cnpj ? "border-destructive" : "border-border")} />
            {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Seu Nome *</label>
              <input {...register("name")} placeholder="João Silva" className={cn("w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.name ? "border-destructive" : "border-border")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telefone</label>
              <input {...register("phone")} placeholder="(11) 9xxxx-xxxx" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email *</label>
            <input {...register("email")} type="email" placeholder="seu@email.com" className={cn("w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.email ? "border-destructive" : "border-border")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha *</label>
              <input {...register("password")} type="password" placeholder="••••••••" className={cn("w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.password ? "border-destructive" : "border-border")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirmar Senha *</label>
              <input {...register("confirmPassword")} type="password" placeholder="••••••••" className={cn("w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.confirmPassword ? "border-destructive" : "border-border")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Solicitar Acesso
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
