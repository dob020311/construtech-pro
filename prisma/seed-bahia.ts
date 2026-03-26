import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COMPANY_ID = "cmn5a6wt800005iey1q067gf8";

const orgaos = [
  // ── GOVERNO DO ESTADO DA BAHIA ──────────────────────────────────
  { name: "Governo do Estado da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.bahia.ba.gov.br" },
  { name: "SEINFRA – Sec. de Infraestrutura", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.seinfra.ba.gov.br" },
  { name: "SEDUR – Sec. de Desenvolvimento Urbano", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.sedur.ba.gov.br" },
  { name: "SESAB – Sec. da Saúde do Estado da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.saude.ba.gov.br" },
  { name: "SEC – Sec. da Educação da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.educacao.ba.gov.br" },
  { name: "SEMA – Sec. do Meio Ambiente da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.meioambiente.ba.gov.br" },
  { name: "SEFAZ – Sec. da Fazenda da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.sefaz.ba.gov.br" },
  { name: "SEPLANTEC – Sec. de Planejamento", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.seplan.ba.gov.br" },
  { name: "SETUR – Sec. de Turismo da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.turismo.ba.gov.br" },
  { name: "SECULT – Sec. de Cultura da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.cultura.ba.gov.br" },
  { name: "SSP – Sec. de Segurança Pública da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.ssp.ba.gov.br" },
  { name: "SAGRI – Sec. de Agricultura da Bahia", cnpj: "13.937.073/0001-46", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.agricultura.ba.gov.br" },

  // ── EMPRESAS ESTATAIS BAHIA ──────────────────────────────────────
  { name: "EMBASA – Empresa Baiana de Águas e Saneamento", cnpj: "15.138.043/0001-04", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.embasa.ba.gov.br" },
  { name: "CERB – Companhia de Engenharia Ambiental", cnpj: "14.310.038/0001-25", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.cerb.ba.gov.br" },
  { name: "CONDER – Cia. de Desenvolvimento Urbano", cnpj: "16.605.803/0001-83", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.conder.ba.gov.br" },
  { name: "BAHIAGÁS – Cia. de Gás da Bahia", cnpj: "43.512.603/0001-20", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.bahiagas.com.br" },
  { name: "DESENBAHIA – Agência de Fomento", cnpj: "00.529.397/0001-79", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.desenbahia.ba.gov.br" },
  { name: "AGERBA – Agência Est. de Regulação de Serviços Públicos", cnpj: "04.196.064/0001-56", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.agerba.ba.gov.br" },
  { name: "INEMA – Instituto do Meio Ambiente e Recursos Hídricos", cnpj: "17.179.072/0001-00", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.inema.ba.gov.br" },
  { name: "BAHIATURSA – Empresa de Turismo da Bahia", cnpj: "15.143.208/0001-64", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.bahiatursa.ba.gov.br" },
  { name: "PRODEB – Centro de Tecnologia da Informação", cnpj: "14.310.039/0001-70", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.prodeb.ba.gov.br" },
  { name: "COFIC – Polo Industrial de Camaçari", cnpj: "34.595.227/0001-96", type: "ESTADUAL", city: "Camaçari", portalUrl: "https://www.cofic.org.br" },
  { name: "BANEB – Banco do Estado da Bahia (BB)", cnpj: "", type: "ESTADUAL", city: "Salvador", portalUrl: "" },
  { name: "BAHIA PESCA – Empresa Baiana de Pesca", cnpj: "16.798.551/0001-30", type: "ESTADUAL", city: "Salvador", portalUrl: "" },

  // ── ÓRGÃOS FEDERAIS NA BAHIA ─────────────────────────────────────
  { name: "DNIT – Departamento Nacional de Infraestrutura de Transportes (SR-05/BA)", cnpj: "04.892.706/0006-27", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.gov.br/dnit" },
  { name: "CODEVASF – 5ª Superintendência Regional (BA)", cnpj: "00.399.857/0001-43", type: "FEDERAL", city: "Juazeiro", portalUrl: "https://www.codevasf.gov.br" },
  { name: "CHESF – Companhia Hidro Elétrica do São Francisco", cnpj: "07.606.560/0001-44", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.chesf.gov.br" },
  { name: "Marinha do Brasil – 2ª Distrito Naval (Salvador)", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.marinha.mil.br" },
  { name: "Exército Brasileiro – 6ª Região Militar (BA)", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.eb.mil.br" },
  { name: "IBAMA – Superintendência na Bahia", cnpj: "03.648.042/0006-44", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.ibama.gov.br" },
  { name: "FUNAI – Bahia", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.funai.gov.br" },
  { name: "INCRA – Superintendência Regional da Bahia", cnpj: "00.375.972/0010-62", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.gov.br/incra" },
  { name: "CEF – Caixa Econômica Federal (BA)", cnpj: "00.360.305/5263-64", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.caixa.gov.br" },
  { name: "Banco do Brasil (BA)", cnpj: "00.000.000/0001-91", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.bb.com.br" },
  { name: "ANTT – Superintendência Regional Bahia", cnpj: "04.898.488/0001-77", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.antt.gov.br" },
  { name: "TCU – Secretaria de Controle Externo BA", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://portal.tcu.gov.br" },
  { name: "CGU – Controladoria-Geral (Regional BA)", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.gov.br/cgu" },
  { name: "Receita Federal – 6ª Região Fiscal (BA)", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.gov.br/receitafederal" },
  { name: "FNDE – Fundo Nacional de Desenvolvimento da Educação (BA)", cnpj: "00.378.257/0001-81", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.fnde.gov.br" },
  { name: "MS – Ministério da Saúde (SCTIE/BA)", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.gov.br/saude" },

  // ── UNIVERSIDADES E INSTITUTOS FEDERAIS ─────────────────────────
  { name: "UFBA – Universidade Federal da Bahia", cnpj: "15.180.714/0001-04", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.ufba.br" },
  { name: "UEFS – Universidade Estadual de Feira de Santana", cnpj: "20.478.237/0001-14", type: "ESTADUAL", city: "Feira de Santana", portalUrl: "https://www.uefs.br" },
  { name: "UFRB – Universidade Federal do Recôncavo da Bahia", cnpj: "07.655.800/0001-72", type: "FEDERAL", city: "Cruz das Almas", portalUrl: "https://www.ufrb.edu.br" },
  { name: "UNIVASF – Universidade Federal do Vale do São Francisco", cnpj: "05.440.725/0001-34", type: "FEDERAL", city: "Juazeiro", portalUrl: "https://www.univasf.edu.br" },
  { name: "IFBA – Instituto Federal da Bahia", cnpj: "10.764.307/0001-00", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.ifba.edu.br" },
  { name: "IF Baiano – Instituto Federal Baiano", cnpj: "10.764.308/0001-55", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.ifbaiano.edu.br" },
  { name: "UNEB – Universidade do Estado da Bahia", cnpj: "14.597.203/0001-21", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.uneb.br" },
  { name: "UESC – Universidade Estadual de Santa Cruz", cnpj: "47.669.289/0001-08", type: "ESTADUAL", city: "Ilhéus", portalUrl: "https://www.uesc.br" },
  { name: "UESB – Universidade Estadual do Sudoeste da Bahia", cnpj: "14.337.585/0001-00", type: "ESTADUAL", city: "Vitória da Conquista", portalUrl: "https://www.uesb.edu.br" },
  { name: "UFOB – Universidade Federal do Oeste da Bahia", cnpj: "20.327.402/0001-66", type: "FEDERAL", city: "Barreiras", portalUrl: "https://www.ufob.edu.br" },

  // ── PREFEITURAS – CAPITAIS E PRINCIPAIS CIDADES ──────────────────
  { name: "Prefeitura de Salvador", cnpj: "13.927.801/0001-89", type: "MUNICIPAL", city: "Salvador", portalUrl: "https://www.salvador.ba.gov.br/licitacoes" },
  { name: "Prefeitura de Feira de Santana", cnpj: "14.105.704/0001-60", type: "MUNICIPAL", city: "Feira de Santana", portalUrl: "https://www.feiradesantana.ba.gov.br" },
  { name: "Prefeitura de Vitória da Conquista", cnpj: "14.313.619/0001-23", type: "MUNICIPAL", city: "Vitória da Conquista", portalUrl: "https://www.pmvc.ba.gov.br" },
  { name: "Prefeitura de Camaçari", cnpj: "14.105.006/0001-11", type: "MUNICIPAL", city: "Camaçari", portalUrl: "https://www.camacari.ba.gov.br" },
  { name: "Prefeitura de Itabuna", cnpj: "14.105.741/0001-21", type: "MUNICIPAL", city: "Itabuna", portalUrl: "https://www.itabuna.ba.gov.br" },
  { name: "Prefeitura de Ilhéus", cnpj: "14.105.736/0001-04", type: "MUNICIPAL", city: "Ilhéus", portalUrl: "https://www.ilheus.ba.gov.br" },
  { name: "Prefeitura de Juazeiro", cnpj: "14.105.752/0001-20", type: "MUNICIPAL", city: "Juazeiro", portalUrl: "https://www.juazeiro.ba.gov.br" },
  { name: "Prefeitura de Lauro de Freitas", cnpj: "14.105.760/0001-36", type: "MUNICIPAL", city: "Lauro de Freitas", portalUrl: "https://www.lauro.ba.gov.br" },
  { name: "Prefeitura de Barreiras", cnpj: "14.104.310/0001-01", type: "MUNICIPAL", city: "Barreiras", portalUrl: "https://www.barreiras.ba.gov.br" },
  { name: "Prefeitura de Jequié", cnpj: "14.105.748/0001-40", type: "MUNICIPAL", city: "Jequié", portalUrl: "https://www.jequie.ba.gov.br" },
  { name: "Prefeitura de Alagoinhas", cnpj: "14.104.048/0001-48", type: "MUNICIPAL", city: "Alagoinhas", portalUrl: "https://www.alagoinhas.ba.gov.br" },
  { name: "Prefeitura de Bauru de Itapetinga", cnpj: "", type: "MUNICIPAL", city: "Itapetinga", portalUrl: "" },
  { name: "Prefeitura de Teixeira de Freitas", cnpj: "16.359.580/0001-31", type: "MUNICIPAL", city: "Teixeira de Freitas", portalUrl: "" },
  { name: "Prefeitura de Porto Seguro", cnpj: "14.105.835/0001-40", type: "MUNICIPAL", city: "Porto Seguro", portalUrl: "https://www.portoseguro.ba.gov.br" },
  { name: "Prefeitura de Paulo Afonso", cnpj: "14.105.823/0001-06", type: "MUNICIPAL", city: "Paulo Afonso", portalUrl: "" },
  { name: "Prefeitura de Simões Filho", cnpj: "14.105.876/0001-64", type: "MUNICIPAL", city: "Simões Filho", portalUrl: "" },
  { name: "Prefeitura de Candeias", cnpj: "14.104.622/0001-30", type: "MUNICIPAL", city: "Candeias", portalUrl: "" },
  { name: "Prefeitura de Eunápolis", cnpj: "14.105.719/0001-61", type: "MUNICIPAL", city: "Eunápolis", portalUrl: "" },
  { name: "Prefeitura de Serrinha", cnpj: "14.105.869/0001-92", type: "MUNICIPAL", city: "Serrinha", portalUrl: "" },
  { name: "Prefeitura de Valença", cnpj: "14.105.905/0001-77", type: "MUNICIPAL", city: "Valença", portalUrl: "" },
  { name: "Prefeitura de Santo Antônio de Jesus", cnpj: "14.105.855/0001-37", type: "MUNICIPAL", city: "Santo Antônio de Jesus", portalUrl: "" },
  { name: "Prefeitura de Cruz das Almas", cnpj: "14.105.688/0001-80", type: "MUNICIPAL", city: "Cruz das Almas", portalUrl: "" },
  { name: "Prefeitura de Senhor do Bonfim", cnpj: "14.105.863/0001-25", type: "MUNICIPAL", city: "Senhor do Bonfim", portalUrl: "" },

  // ── CÂMARAS MUNICIPAIS ───────────────────────────────────────────
  { name: "Câmara Municipal de Salvador", cnpj: "13.927.843/0001-60", type: "MUNICIPAL", city: "Salvador", portalUrl: "https://www.cms.ba.gov.br" },
  { name: "Câmara Municipal de Feira de Santana", cnpj: "14.124.415/0001-71", type: "MUNICIPAL", city: "Feira de Santana", portalUrl: "" },
  { name: "Câmara Municipal de Vitória da Conquista", cnpj: "16.535.981/0001-19", type: "MUNICIPAL", city: "Vitória da Conquista", portalUrl: "" },

  // ── TRIBUNAL E ÓRGÃOS JUDICIÁRIOS ────────────────────────────────
  { name: "TCE-BA – Tribunal de Contas do Estado da Bahia", cnpj: "13.521.539/0001-00", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.tce.ba.gov.br" },
  { name: "TJ-BA – Tribunal de Justiça da Bahia", cnpj: "13.937.172/0001-15", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.tjba.jus.br" },
  { name: "TRF1 – Seção Judiciária da Bahia", cnpj: "", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.jfba.jus.br" },
  { name: "TRT5 – Tribunal Regional do Trabalho 5ª Região (BA)", cnpj: "02.581.641/0001-80", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.trt5.jus.br" },
  { name: "TRE-BA – Tribunal Regional Eleitoral da Bahia", cnpj: "05.068.984/0001-11", type: "FEDERAL", city: "Salvador", portalUrl: "https://www.tre-ba.jus.br" },
  { name: "MPE-BA – Ministério Público do Estado da Bahia", cnpj: "14.963.601/0001-13", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.mpba.mp.br" },

  // ── SETOR PRIVADO / CONSTRUTORAS BAHIA ──────────────────────────
  { name: "OAS S/A – Construtora (Salvador)", cnpj: "01.800.338/0001-10", type: "PRIVADO", city: "Salvador", portalUrl: "https://www.oas.com.br" },
  { name: "Odebrecht Engenharia e Construção (BA)", cnpj: "03.939.556/0001-04", type: "PRIVADO", city: "Salvador", portalUrl: "https://www.novonorte.com" },
  { name: "Queiroz Galvão Construções (BA)", cnpj: "02.088.905/0001-65", type: "PRIVADO", city: "Salvador", portalUrl: "https://www.queirozgalvao.com" },
  { name: "Construtora Enesa (Salvador)", cnpj: "", type: "PRIVADO", city: "Salvador", portalUrl: "" },
  { name: "CFL Engenharia (Salvador)", cnpj: "", type: "PRIVADO", city: "Salvador", portalUrl: "" },
  { name: "GPE – Grupo Paulista de Engenharia (BA)", cnpj: "", type: "PRIVADO", city: "Salvador", portalUrl: "" },
  { name: "Andrade Gutierrez (BA)", cnpj: "17.262.197/0001-30", type: "PRIVADO", city: "Salvador", portalUrl: "https://www.agconstrucoes.com.br" },

  // ── CONSÓRCIOS E ENTIDADES ───────────────────────────────────────
  { name: "BAHIAINVESTE – Agência de Promoção de Investimentos", cnpj: "", type: "ESTADUAL", city: "Salvador", portalUrl: "https://www.bahiainveste.ba.gov.br" },
  { name: "SINDUSCON-BA – Sindicato da Construção Civil", cnpj: "15.140.840/0001-55", type: "ASSOCIAÇÃO", city: "Salvador", portalUrl: "https://www.sinduscon-ba.com.br" },
  { name: "CREA-BA – Conselho Regional de Engenharia e Agronomia", cnpj: "13.507.817/0001-95", type: "CONSELHO", city: "Salvador", portalUrl: "https://www.crea-ba.org.br" },
  { name: "CAU-BA – Conselho de Arquitetura e Urbanismo da Bahia", cnpj: "14.906.536/0001-73", type: "CONSELHO", city: "Salvador", portalUrl: "https://www.caubr.gov.br" },
  { name: "SEBRAE-BA – Serviço de Apoio às Micro e Pequenas Empresas", cnpj: "03.648.980/0001-50", type: "SERVIÇO", city: "Salvador", portalUrl: "https://www.ba.sebrae.com.br" },
  { name: "FIEB – Federação das Indústrias do Estado da Bahia", cnpj: "15.139.477/0001-28", type: "FEDERAÇÃO", city: "Salvador", portalUrl: "https://www.fieb.org.br" },
  { name: "SENAI-BA – Serviço Nacional de Aprendizagem Industrial", cnpj: "03.773.745/0001-65", type: "SERVIÇO", city: "Salvador", portalUrl: "https://www.ba.senai.br" },
];

async function main() {
  // Find company
  const company = await prisma.company.findUnique({ where: { id: COMPANY_ID } });
  if (!company) { console.error("Empresa não encontrada"); process.exit(1); }

  let inserted = 0;
  let skipped = 0;

  for (const org of orgaos) {
    try {
      const exists = await prisma.organization.findFirst({
        where: { name: org.name, companyId: COMPANY_ID },
      });
      if (exists) { skipped++; continue; }

      await prisma.organization.create({
        data: {
          name: org.name,
          cnpj: org.cnpj || null,
          type: org.type,
          state: "BA",
          city: org.city,
          portalUrl: org.portalUrl || null,
          companyId: COMPANY_ID,
        },
      });
      inserted++;
    } catch (e) {
      console.error(`Erro ao inserir: ${org.name}`, e);
    }
  }

  console.log(`✅ ${inserted} órgãos inseridos | ${skipped} já existiam`);
  console.log(`📊 Total de órgãos da Bahia: ${inserted + skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
