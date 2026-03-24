import { Suspense } from "react";
import { DocumentosContent } from "@/components/documentos/documentos-content";

export default function DocumentosPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
      <div className="skeleton h-96 rounded-xl" />
    </div>}>
      <DocumentosContent />
    </Suspense>
  );
}
