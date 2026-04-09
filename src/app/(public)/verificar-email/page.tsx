"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link inválido. Verifique o e-mail recebido.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json() as Promise<{ success?: boolean; error?: string }>)
      .then((json) => {
        if (json.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(json.error ?? "Erro ao verificar e-mail.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erro de conexão. Tente novamente.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg">ConstruTech Pro</span>
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold mb-2">Verificando seu e-mail...</h2>
            <p className="text-muted-foreground">Aguarde um momento.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">E-mail confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              Sua conta está ativa. Agora é só entrar e começar a usar o ConstruTech Pro.
            </p>
            <Link
              href="/login"
              className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Fazer login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-destructive" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">Link inválido</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block border border-border px-6 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition-colors"
            >
              Voltar ao login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
