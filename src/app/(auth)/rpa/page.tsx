import { Suspense } from "react";
import { RpaContent } from "@/components/rpa/rpa-content";

export default function RpaPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><div key={i} className="skeleton h-28 rounded-xl"/>)}</div>
      <div className="skeleton h-64 rounded-xl" />
    </div>}>
      <RpaContent />
    </Suspense>
  );
}
