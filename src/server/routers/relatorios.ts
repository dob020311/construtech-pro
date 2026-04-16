import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const relatoriosRouter = createTRPCRouter({
  resumoGeral: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;

    const [
      orcamentos,
      medicoes,
      compras,
      licitacoes,
    ] = await Promise.all([
      ctx.prisma.orcamento.findMany({
        where: { companyId },
        select: { id: true, status: true, totalWithBdi: true },
      }),
      ctx.prisma.medicao.findMany({
        where: { companyId },
        select: {
          id: true,
          status: true,
          items: { select: { quantityMeasured: true, unitPrice: true } },
        },
      }),
      ctx.prisma.compra.findMany({
        where: { companyId },
        select: {
          id: true,
          status: true,
          cotacoes: { select: { totalValue: true, selected: true } },
        },
      }),
      ctx.prisma.licitacao.findMany({
        where: { companyId },
        select: { id: true, status: true },
      }),
    ]);

    // Orçamentos aggregates
    const totalOrcamentos = orcamentos.length;
    const valorTotalOrcado = orcamentos.reduce(
      (sum, o) => sum + Number(o.totalWithBdi),
      0
    );
    const orcamentosPorStatus = Object.entries(
      orcamentos.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }));

    // Medições aggregates
    const totalMedicoes = medicoes.length;
    const valorTotalMedido = medicoes.reduce(
      (sum, m) =>
        sum +
        m.items.reduce(
          (s, i) => s + Number(i.quantityMeasured) * Number(i.unitPrice),
          0
        ),
      0
    );
    const medicoesPorStatus = Object.entries(
      medicoes.reduce<Record<string, number>>((acc, m) => {
        acc[m.status] = (acc[m.status] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }));

    // Compras aggregates
    const totalCompras = compras.length;
    const valorTotalCompras = compras.reduce(
      (sum, c) =>
        sum +
        c.cotacoes
          .filter((cot) => cot.selected)
          .reduce((s, cot) => s + Number(cot.totalValue), 0),
      0
    );
    const comprasPorStatus = Object.entries(
      compras.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = (acc[c.status] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }));

    // Licitações aggregates
    const totalLicitacoes = licitacoes.length;
    const licitacoesGanhas = licitacoes.filter((l) => l.status === "WON").length;

    return {
      totalOrcamentos,
      valorTotalOrcado,
      totalMedicoes,
      valorTotalMedido,
      totalCompras,
      valorTotalCompras,
      totalLicitacoes,
      licitacoesGanhas,
      orcamentosPorStatus,
      medicoesPorStatus,
      comprasPorStatus,
    };
  }),

  resumoOrcamento: protectedProcedure
    .input(z.object({ orcamentoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.orcamentoId, companyId },
        select: {
          name: true,
          totalWithBdi: true,
          bdiPercentage: true,
          status: true,
          chapters: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              items: {
                select: {
                  id: true,
                  totalPrice: true,
                },
              },
            },
          },
          compras: {
            select: { id: true, number: true, name: true, status: true },
          },
        },
      });

      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      // Fetch all MedicaoItems that belong to orcamentoItems in this orcamento
      const orcamentoItemIds = orcamento.chapters.flatMap((ch) =>
        ch.items.map((it) => it.id)
      );

      const medicaoItems = await ctx.prisma.medicaoItem.findMany({
        where: { orcamentoItemId: { in: orcamentoItemIds } },
        select: {
          orcamentoItemId: true,
          quantityMeasured: true,
          unitPrice: true,
        },
      });

      // Build a map: orcamentoItemId → valorMedido
      const medidoByItem = medicaoItems.reduce<Record<string, number>>(
        (acc, mi) => {
          acc[mi.orcamentoItemId] =
            (acc[mi.orcamentoItemId] ?? 0) +
            Number(mi.quantityMeasured) * Number(mi.unitPrice);
          return acc;
        },
        {}
      );

      // Build chapters summary
      const chapters = orcamento.chapters.map((ch) => {
        const valorOrcado = ch.items.reduce(
          (s, it) => s + Number(it.totalPrice),
          0
        );
        const valorMedido = ch.items.reduce(
          (s, it) => s + (medidoByItem[it.id] ?? 0),
          0
        );
        const percentExecutado =
          valorOrcado > 0 ? (valorMedido / valorOrcado) * 100 : 0;
        return {
          name: ch.name,
          valorOrcado,
          valorMedido,
          percentExecutado,
        };
      });

      const totalOrcado = Number(orcamento.totalWithBdi);
      const totalMedido = chapters.reduce((s, c) => s + c.valorMedido, 0);
      const percentualGeral =
        totalOrcado > 0 ? (totalMedido / totalOrcado) * 100 : 0;

      return {
        orcamento: {
          name: orcamento.name,
          totalWithBdi: Number(orcamento.totalWithBdi),
          bdiPercentage: Number(orcamento.bdiPercentage),
          status: orcamento.status,
        },
        chapters,
        totalOrcado,
        totalMedido,
        percentualGeral,
        comprasVinculadas: orcamento.compras.map((c) => ({
          number: c.number,
          name: c.name,
          status: c.status,
        })),
      };
    }),
});
