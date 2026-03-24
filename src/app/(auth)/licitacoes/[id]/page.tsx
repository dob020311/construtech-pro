import { Suspense } from "react";
import { LicitacaoDetalhe } from "@/components/licitacoes/licitacao-detalhe";

export default function LicitacaoDetalhePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-64 rounded" />
      <div className="skeleton h-4 w-96 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>}>
      <LicitacaoDetalhe id={params.id} />
    </Suspense>
  );
}
