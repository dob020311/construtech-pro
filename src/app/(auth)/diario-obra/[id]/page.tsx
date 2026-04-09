import { DiarioObraDetalhe } from "@/components/diario-obra/diario-obra-detalhe";

export default function DiarioObraDetalhePage({ params }: { params: { id: string } }) {
  return <DiarioObraDetalhe id={params.id} />;
}
