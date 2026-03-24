import { Suspense } from "react";
import { ConfiguracoesContent } from "@/components/configuracoes/configuracoes-content";

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-96 rounded-xl" />
    </div>}>
      <ConfiguracoesContent />
    </Suspense>
  );
}
