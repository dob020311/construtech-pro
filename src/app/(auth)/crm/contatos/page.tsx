import { Suspense } from "react";
import { ContatosContent } from "@/components/crm/contatos-content";

export default function ContatosPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="skeleton h-96 rounded-xl" />
    </div>}>
      <ContatosContent />
    </Suspense>
  );
}
