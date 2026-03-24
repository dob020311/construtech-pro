import type { Metadata } from "next";
import { OrcamentosContent } from "@/components/orcamentos/orcamentos-content";

export const metadata: Metadata = { title: "Orçamentos" };

export default function OrcamentosPage() {
  return <OrcamentosContent />;
}
