import { Suspense } from "react";
import { ValidadesContent } from "@/components/documentos/validades-content";

export const metadata = { title: "Validades de Documentos | ConstruTech Pro" };

export default function ValidadesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-56 bg-muted rounded" />
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    }>
      <ValidadesContent />
    </Suspense>
  );
}
