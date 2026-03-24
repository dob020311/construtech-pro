import { Suspense } from "react";
import { EmpresasContent } from "@/components/crm/empresas-content";

export default function EmpresasPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="skeleton h-96 rounded-xl" />
    </div>}>
      <EmpresasContent />
    </Suspense>
  );
}
