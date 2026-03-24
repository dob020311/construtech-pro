import { createTRPCRouter } from "../trpc";
import { licitacaoRouter } from "./licitacao";
import { orcamentoRouter } from "./orcamento";
import { documentoRouter } from "./documento";
import { crmRouter } from "./crm";
import { userRouter } from "./user";
import { rpaRouter } from "./rpa";
import { searchRouter } from "./search";

export const appRouter = createTRPCRouter({
  licitacao: licitacaoRouter,
  orcamento: orcamentoRouter,
  documento: documentoRouter,
  crm: crmRouter,
  user: userRouter,
  rpa: rpaRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
