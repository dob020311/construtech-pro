import { Suspense } from "react";
import type { Metadata } from "next";
import { LicitacoesContent } from "@/components/licitacoes/licitacoes-content";
import { LicitacoesListSkeleton } from "@/components/licitacoes/licitacoes-skeleton";

export const metadata: Metadata = {
  title: "Licitações",
};

export default function LicitacoesPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<LicitacoesListSkeleton />}>
        <LicitacoesContent />
      </Suspense>
    </div>
  );
}
