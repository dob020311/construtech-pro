import { CompraDetalhe } from "@/components/compras/compra-detalhe";

export default function CompraDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return <CompraDetalhe id={params.id} />;
}
