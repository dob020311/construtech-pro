import { MedicaoDetalhe } from "@/components/medicao/medicao-detalhe";

export default function MedicaoDetalhePage({ params }: { params: { id: string } }) {
  return <MedicaoDetalhe id={params.id} />;
}
