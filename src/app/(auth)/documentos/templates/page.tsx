import { Suspense } from "react";
import { TemplatesContent } from "@/components/documentos/templates-content";

export const metadata = { title: "Templates de Documentos | ConstruTech Pro" };

export default function TemplatesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-56 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl" />)}
        </div>
      </div>
    }>
      <TemplatesContent />
    </Suspense>
  );
}
