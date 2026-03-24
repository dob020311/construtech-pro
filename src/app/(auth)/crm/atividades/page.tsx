import { Suspense } from "react";
import { AtividadesContent } from "@/components/crm/atividades-content";

export default function AtividadesPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="skeleton h-96 rounded-xl" />
    </div>}>
      <AtividadesContent />
    </Suspense>
  );
}
