"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "EMAIL_NOT_VERIFIED" || result.error.includes("EMAIL_NOT_VERIFIED")) {
          setError("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
        } else {
          setError("Email ou senha incorretos. Verifique suas credenciais.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(218,35%,8%)] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-heading font-bold text-lg leading-tight">ConstruTech</p>
            <p className="text-[hsl(215,20%,55%)] text-sm">Pro</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
            Gestão completa
            <br />
            de licitações
            <br />
            <span className="text-primary">públicas</span>
          </h1>
          <p className="text-[hsl(215,20%,65%)] text-lg leading-relaxed">
            Do edital à proposta final. Controle todo o processo licitatório com inteligência artificial e automação.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Análise automática de editais com IA",
              "Planilha orçamentária profissional (SINAPI/SICRO/ORSE-SE/SEINFRA)",
              "CRM completo para gestão do pipeline",
              "RPA para captura automática de editais",
              "Gestão documental com alertas de validade",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p className="text-[hsl(215,20%,75%)] text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[hsl(215,20%,45%)] text-xs">
          Conforme Lei 14.133/2021 e Lei 8.666/93
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg leading-tight">ConstruTech Pro</p>
            </div>
          </div>

          <h2 className="text-2xl font-heading font-bold mb-1">Bem-vindo de volta</h2>
          <p className="text-muted-foreground mb-8">Entre com suas credenciais para acessar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="seu@email.com"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    "transition-colors bg-background",
                    errors.email ? "border-destructive" : "border-border"
                  )}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    "transition-colors bg-background",
                    errors.password ? "border-destructive" : "border-border"
                  )}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
                "bg-primary text-white hover:bg-primary-700 active:bg-primary-900",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-4 text-right">
            <Link href="/esqueci-senha" className="text-sm text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/registro" className="text-primary font-medium hover:underline">
                Solicite acesso
              </Link>
            </p>
          </div>

          {/* Demo credentials — dev only */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Credenciais de demonstração:</p>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">admin@construtech.com</span> — Administrador
                </p>
                <p className="text-xs text-muted-foreground">
                  Senha: <span className="font-mono">demo123</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
