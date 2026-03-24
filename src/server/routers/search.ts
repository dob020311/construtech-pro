import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(z.object({ q: z.string().min(2).max(100) }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;
      const q = input.q.trim();

      const [licitacoes, orcamentos, documentos, contatos] = await Promise.all([
        ctx.prisma.licitacao.findMany({
          where: {
            companyId,
            OR: [
              { number: { contains: q, mode: "insensitive" } },
              { object: { contains: q, mode: "insensitive" } },
              { organ: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, number: true, object: true, organ: true, status: true },
          take: 5,
        }),
        ctx.prisma.orcamento.findMany({
          where: {
            companyId,
            name: { contains: q, mode: "insensitive" },
          },
          select: { id: true, name: true, status: true, totalWithBdi: true },
          take: 5,
        }),
        ctx.prisma.document.findMany({
          where: {
            companyId,
            name: { contains: q, mode: "insensitive" },
          },
          select: { id: true, name: true, type: true, status: true },
          take: 4,
        }),
        ctx.prisma.contact.findMany({
          where: {
            companyId,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true, role: true },
          take: 3,
        }),
      ]);

      return { licitacoes, orcamentos, documentos, contatos };
    }),
});
