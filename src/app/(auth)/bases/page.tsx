import { Suspense } from "react";
import { BasesContent } from "@/components/bases/bases-content";

export const metadata = { title: "Bases de Preços | ConstruTech Pro" };

export default function BasesPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      }
    >
      <BasesContent />
    </Suspense>
  );
}
