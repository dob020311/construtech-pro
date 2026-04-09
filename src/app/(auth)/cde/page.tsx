import { Suspense } from "react";
import { CdeContent } from "@/components/cde/cde-content";

export const metadata = { title: "CDE | ConstruTech Pro" };

export default function CdePage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      }
    >
      <CdeContent />
    </Suspense>
  );
}
