"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormData = z.infer<typeof schema>;

export default function EsqueciSenhaPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json() as { error?: string };
    if (!res.ok) {
      setServerError(json.error ?? "Erro ao enviar e-mail.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-2">Verifique seu e-mail</h2>
          <p className="text-muted-foreground mb-6">
            Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
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
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-lg leading-tight">ConstruTech Pro</p>
            <p className="text-xs text-muted-foreground">Recuperação de senha</p>
          </div>
        </div>

        <h2 className="text-xl font-heading font-bold mb-1">Esqueceu sua senha?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                {...register("email")}
                type="email"
                placeholder="seu@email.com"
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-background",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                  errors.email ? "border-destructive" : "border-border"
                )}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar link de recuperação
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
