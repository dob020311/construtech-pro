import { createTRPCRouter, protectedProcedure } from "../trpc";

export const rpaRouter = createTRPCRouter({
  listJobs: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.rpaJob.findMany({
      where: { companyId: ctx.session.user.companyId },
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
