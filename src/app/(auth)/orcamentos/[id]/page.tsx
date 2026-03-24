import type { Metadata } from "next";
import { OrcamentoEditor } from "@/components/orcamentos/orcamento-editor";

export const metadata: Metadata = { title: "Editor de Orçamento" };

export default function OrcamentoPage({ params }: { params: { id: string } }) {
  return <OrcamentoEditor id={params.id} />;
}
