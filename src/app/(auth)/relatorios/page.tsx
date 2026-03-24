import { Suspense } from "react";
import { RelatoriosContent } from "@/components/relatorios/relatorios-content";

export const metadata = { title: "Relatórios | ConstruTech Pro" };

export default function RelatoriosPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    }>
      <RelatoriosContent />
    </Suspense>
  );
}
