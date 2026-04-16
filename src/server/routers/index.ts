import { createTRPCRouter } from "../trpc";
import { licitacaoRouter } from "./licitacao";
import { orcamentoRouter } from "./orcamento";
import { documentoRouter } from "./documento";
import { crmRouter } from "./crm";
import { userRouter } from "./user";
import { rpaRouter } from "./rpa";
import { searchRouter } from "./search";
import { diarioObraRouter } from "./diarioObra";
import { medicaoRouter } from "./medicao";
import { planejamentoRouter } from "./planejamento";
import { comprasRouter } from "./compras";
import { cdeRouter } from "./cde";
import { basePrecoRouter } from "./basePreco";
import { relatoriosRouter } from "./relatorios";

export const appRouter = createTRPCRouter({
  licitacao: licitacaoRouter,
  orcamento: orcamentoRouter,
  documento: documentoRouter,
  crm: crmRouter,
  user: userRouter,
  rpa: rpaRouter,
  search: searchRouter,
  diarioObra: diarioObraRouter,
  medicao: medicaoRouter,
  planejamento: planejamentoRouter,
  compras: comprasRouter,
  cde: cdeRouter,
  basePreco: basePrecoRouter,
  relatorios: relatoriosRouter,
});

export type AppRouter = typeof appRouter;
