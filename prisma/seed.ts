import { PrismaClient, Modality, LicitacaoStatus, DocumentType, PipelineStage, ActivityType, RpaJobType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Create Company
  const company = await prisma.company.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      name: "Construtora Horizonte Ltda.",
      cnpj: "12.345.678/0001-90",
      address: "Rua das Construções, 1234, São Paulo - SP",
      phone: "(11) 3456-7890",
      email: "contato@construtorahorizonte.com.br",
      segments: ["Obras Civis", "Pavimentação", "Saneamento", "Edificações Públicas"],
    },
  });

  console.log("✅ Empresa criada:", company.name);

  // Create Users
  const passwordHash = await bcrypt.hash("demo123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@construtech.com" },
    update: {},
    create: {
      name: "Carlos Mendes",
      email: "admin@construtech.com",
      passwordHash,
      role: "ADMIN",
      companyId: company.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "gerente@construtech.com" },
    update: {},
    create: {
      name: "Ana Paula Silva",
      email: "gerente@construtech.com",
      passwordHash,
      role: "MANAGER",
      companyId: company.id,
    },
  });

  const orcamentista = await prisma.user.upsert({
    where: { email: "orcamento@construtech.com" },
    update: {},
    create: {
      name: "Roberto Santos",
      email: "orcamento@construtech.com",
      passwordHash,
      role: "BUDGETEER",
      companyId: company.id,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analista@construtech.com" },
    update: {},
    create: {
      name: "Fernanda Costa",
      email: "analista@construtech.com",
      passwordHash,
      role: "ANALYST",
      companyId: company.id,
    },
  });

  console.log("✅ Usuários criados");

  // Create Organizations
  const orgs = await Promise.all([
    prisma.organization.upsert({
      where: { id: "org-prefsp" },
      update: {},
      create: {
        id: "org-prefsp",
        name: "Prefeitura Municipal de São Paulo",
        cnpj: "43.702.478/0001-19",
        type: "Municipal",
        state: "SP",
        city: "São Paulo",
        portalUrl: "https://www.prefeitura.sp.gov.br/cidade/secretarias/licitacoes",
        companyId: company.id,
      },
    }),
    prisma.organization.upsert({
      where: { id: "org-dersp" },
      update: {},
      create: {
        id: "org-dersp",
        name: "DER-SP — Departamento de Estradas e Rodagem",
        cnpj: "46.536.752/0001-82",
        type: "Estadual",
        state: "SP",
        city: "São Paulo",
        portalUrl: "https://www.der.sp.gov.br",
        companyId: company.id,
      },
    }),
    prisma.organization.upsert({
      where: { id: "org-sabesp" },
      update: {},
      create: {
        id: "org-sabesp",
        name: "SABESP — Cia. de Saneamento Básico do Estado de SP",
        cnpj: "43.776.517/0001-80",
        type: "Estadual",
        state: "SP",
        city: "São Paulo",
        companyId: company.id,
      },
    }),
    prisma.organization.upsert({
      where: { id: "org-dnit" },
      update: {},
      create: {
        id: "org-dnit",
        name: "DNIT — Departamento Nacional de Infraestrutura de Transportes",
        cnpj: "04.892.707/0001-00",
        type: "Federal",
        state: "DF",
        city: "Brasília",
        companyId: company.id,
      },
    }),
    prisma.organization.upsert({
      where: { id: "org-prefrj" },
      update: {},
      create: {
        id: "org-prefrj",
        name: "Prefeitura Municipal do Rio de Janeiro",
        cnpj: "42.498.733/0001-48",
        type: "Municipal",
        state: "RJ",
        city: "Rio de Janeiro",
        companyId: company.id,
      },
    }),
  ]);

  console.log("✅ Organizações criadas");

  // Create Licitacoes
  const licitacoesData = [
    {
      number: "PE 042/2024",
      modality: "PREGAO_ELETRONICO" as Modality,
      object: "Pavimentação e recapeamento asfáltico de vias urbanas no bairro Vila Mariana",
      organ: "Prefeitura Municipal de São Paulo",
      organId: orgs[0].id,
      status: "BUDGETING" as LicitacaoStatus,
      estimatedValue: 4850000,
      closingDate: new Date("2024-04-15"),
      state: "SP",
      city: "São Paulo",
      segment: "Pavimentação",
      stage: "BUDGETING" as PipelineStage,
      probability: 70,
    },
    {
      number: "CC 008/2024",
      modality: "CONCORRENCIA" as Modality,
      object: "Construção de ponte sobre o Rio Pinheiros na Via Expressa Sul — comprimento 180m",
      organ: "DER-SP",
      organId: orgs[1].id,
      status: "ANALYZING" as LicitacaoStatus,
      estimatedValue: 28500000,
      closingDate: new Date("2024-05-10"),
      state: "SP",
      city: "São Paulo",
      segment: "Obras Civis",
      stage: "ANALYSIS" as PipelineStage,
      probability: 40,
    },
    {
      number: "TP 019/2024",
      modality: "TOMADA_PRECOS" as Modality,
      object: "Ampliação da Estação de Tratamento de Esgoto ETE Barueri — Fase III",
      organ: "SABESP",
      organId: orgs[2].id,
      status: "GO" as LicitacaoStatus,
      estimatedValue: 12300000,
      closingDate: new Date("2024-04-28"),
      state: "SP",
      city: "Barueri",
      segment: "Saneamento",
      stage: "DECISION" as PipelineStage,
      probability: 55,
    },
    {
      number: "PE 0156/2024",
      modality: "PREGAO_ELETRONICO" as Modality,
      object: "Recuperação e manutenção de rodovias federais BR-116 e BR-374 trecho SP/PR",
      organ: "DNIT",
      organId: orgs[3].id,
      status: "PROPOSAL_SENT" as LicitacaoStatus,
      estimatedValue: 67800000,
      proposedValue: 65200000,
      closingDate: new Date("2024-03-30"),
      state: "SP",
      segment: "Pavimentação",
      stage: "PROPOSAL" as PipelineStage,
      probability: 60,
    },
    {
      number: "PE 033/2024",
      modality: "PREGAO_ELETRONICO" as Modality,
      object: "Construção de creche municipal com capacidade para 200 alunos — Zona Norte",
      organ: "Prefeitura Municipal de São Paulo",
      organId: orgs[0].id,
      status: "WON" as LicitacaoStatus,
      estimatedValue: 3200000,
      proposedValue: 3050000,
      closingDate: new Date("2024-02-20"),
      state: "SP",
      city: "São Paulo",
      segment: "Edificações Públicas",
      stage: "RESULT" as PipelineStage,
      probability: 100,
    },
    {
      number: "CC 002/2024",
      modality: "CONCORRENCIA" as Modality,
      object: "Implantação de sistema de esgotamento sanitário no Município de Ribeirão Preto",
      organ: "Prefeitura Municipal de Ribeirão Preto",
      status: "LOST" as LicitacaoStatus,
      estimatedValue: 18500000,
      proposedValue: 17900000,
      closingDate: new Date("2024-02-05"),
      state: "SP",
      city: "Ribeirão Preto",
      segment: "Saneamento",
      stage: "RESULT" as PipelineStage,
      probability: 0,
    },
    {
      number: "PE 087/2024",
      modality: "PREGAO_ELETRONICO" as Modality,
      object: "Construção de unidade básica de saúde (UBS) com 12 consultórios — Jacarepaguá",
      organ: "Prefeitura Municipal do Rio de Janeiro",
      organId: orgs[4].id,
      status: "IDENTIFIED" as LicitacaoStatus,
      estimatedValue: 2800000,
      closingDate: new Date("2024-05-25"),
      state: "RJ",
      city: "Rio de Janeiro",
      segment: "Edificações Públicas",
      stage: "PROSPECTING" as PipelineStage,
      probability: 30,
    },
    {
      number: "TP 011/2024",
      modality: "TOMADA_PRECOS" as Modality,
      object: "Reforma e ampliação do Mercado Municipal Central — área de 2.400 m²",
      organ: "Prefeitura Municipal de São Paulo",
      organId: orgs[0].id,
      status: "ANALYZING" as LicitacaoStatus,
      estimatedValue: 5600000,
      closingDate: new Date("2024-06-01"),
      state: "SP",
      city: "São Paulo",
      segment: "Edificações Públicas",
      stage: "ANALYSIS" as PipelineStage,
      probability: 45,
    },
    {
      number: "CC 014/2024",
      modality: "CONCORRENCIA" as Modality,
      object: "Construção de viaduto na Avenida Brasil altura do km 14 — estrutura em concreto",
      organ: "DER-SP",
      organId: orgs[1].id,
      status: "BUDGETING" as LicitacaoStatus,
      estimatedValue: 35000000,
      closingDate: new Date("2024-07-15"),
      state: "SP",
      city: "São Paulo",
      segment: "Obras Civis",
      stage: "BUDGETING" as PipelineStage,
      probability: 65,
    },
    {
      number: "PE 205/2024",
      modality: "PREGAO_ELETRONICO" as Modality,
      object: "Manutenção de parques e áreas verdes municipais — 142 pontos da cidade",
      organ: "Prefeitura Municipal de São Paulo",
      organId: orgs[0].id,
      status: "GO" as LicitacaoStatus,
      estimatedValue: 1900000,
      closingDate: new Date("2024-04-20"),
      state: "SP",
      city: "São Paulo",
      segment: "Obras Civis",
      stage: "DECISION" as PipelineStage,
      probability: 50,
    },
    {
      number: "PE 066/2024",
      modality: "PREGAO_ELETRONICO" as Modality,
      object: "Pavimentação de estradas vicinais no interior — 45 km de vias rurais",
      organ: "DER-SP",
      organId: orgs[1].id,
      status: "IDENTIFIED" as LicitacaoStatus,
      estimatedValue: 8900000,
      closingDate: new Date("2024-06-10"),
      state: "SP",
      segment: "Pavimentação",
      stage: "PROSPECTING" as PipelineStage,
      probability: 25,
    },
    {
      number: "RDC 003/2024",
      modality: "RDC" as Modality,
      object: "Construção do Hospital Regional de Sorocaba — 450 leitos — Fase II",
      organ: "Governo do Estado de São Paulo",
      status: "ANALYZING" as LicitacaoStatus,
      estimatedValue: 185000000,
      closingDate: new Date("2024-08-30"),
      state: "SP",
      city: "Sorocaba",
      segment: "Edificações Públicas",
      stage: "ANALYSIS" as PipelineStage,
      probability: 20,
    },
  ];

  const createdLicitacoes = [];

  for (const data of licitacoesData) {
    const { stage, probability, proposedValue, ...licitacaoData } = data as typeof data & { proposedValue?: number };

    const existing = await prisma.licitacao.findFirst({
      where: { number: data.number, companyId: company.id },
    });

    if (!existing) {
      const licitacao = await prisma.licitacao.create({
        data: {
          ...licitacaoData,
          proposedValue: proposedValue ?? null,
          fullObject: licitacaoData.object + " — Conforme especificações técnicas do edital e projeto básico aprovado.",
          aiScore: Math.random() * 40 + 60,
          companyId: company.id,
          judgmentCriteria: Math.random() > 0.3 ? "Menor Preço" : "Técnica e Preço",
        },
      });

      await prisma.pipelineEntry.create({
        data: {
          licitacaoId: licitacao.id,
          stage,
          probability,
          value: licitacaoData.estimatedValue ?? null,
        },
      });

      // Assign users
      await prisma.licitacaoAssignment.create({
        data: {
          licitacaoId: licitacao.id,
          userId: manager.id,
          role: "Gerente",
        },
      });

      if (Math.random() > 0.5) {
        await prisma.licitacaoAssignment.create({
          data: {
            licitacaoId: licitacao.id,
            userId: orcamentista.id,
            role: "Orçamentista",
          },
        });
      }

      createdLicitacoes.push(licitacao);
    }
  }

  console.log(`✅ ${createdLicitacoes.length} Licitações criadas`);

  // Create sample Orcamento
  const firstLicitacao = createdLicitacoes.find((l) => licitacoesData.find((d) => d.status === "BUDGETING" && d.number === l.number));

  if (firstLicitacao) {
    const existing = await prisma.orcamento.findFirst({
      where: { licitacaoId: firstLicitacao.id },
    });

    if (!existing) {
      const orcamento = await prisma.orcamento.create({
        data: {
          name: `Orçamento — ${firstLicitacao.number}`,
          licitacaoId: firstLicitacao.id,
          status: "IN_PROGRESS",
          bdiPercentage: 25,
          bdiConfig: {
            administracaoCentral: 4,
            seguroGarantia: 0.8,
            risco: 1.27,
            despesasFinanceiras: 1.23,
            lucro: 7.4,
            pis: 0.65,
            cofins: 3,
            iss: 3,
            cprb: 3.5,
          },
          companyId: company.id,
        },
      });

      // Create chapters
      const capitulosData = [
        {
          code: "01",
          name: "SERVIÇOS PRELIMINARES",
          order: 1,
          items: [
            { code: "01.001", description: "Mobilização e desmobilização de canteiro", unit: "vb", qty: 1, price: 45000 },
            { code: "01.002", description: "Placa de obra padrão PMSP", unit: "un", qty: 2, price: 850 },
            { code: "01.003", description: "Locação topográfica de obra", unit: "m²", qty: 12500, price: 2.8 },
          ],
        },
        {
          code: "02",
          name: "TERRAPLENAGEM",
          order: 2,
          items: [
            { code: "02.001", description: "Escavação mecânica de material de 1ª categoria", unit: "m³", qty: 4800, price: 18.5 },
            { code: "02.002", description: "Aterro compactado com material de jazida (90% Proctor)", unit: "m³", qty: 3200, price: 42.0 },
            { code: "02.003", description: "Bota-fora de material excedente até 5km", unit: "m³", qty: 1600, price: 28.0 },
          ],
        },
        {
          code: "03",
          name: "PAVIMENTAÇÃO ASFÁLTICA",
          order: 3,
          items: [
            { code: "03.001", description: "Sub-base estabilizada granulometricamente (e=15cm)", unit: "m²", qty: 12500, price: 28.5 },
            { code: "03.002", description: "Base em brita graduada estabilizada (BGS) e=15cm", unit: "m²", qty: 12500, price: 35.0 },
            { code: "03.003", description: "Imprimação com CM-30 — taxa 1,0 l/m²", unit: "m²", qty: 12500, price: 6.5 },
            { code: "03.004", description: "Pintura de ligação com RR-1C — taxa 0,8 l/m²", unit: "m²", qty: 12500, price: 4.2 },
            { code: "03.005", description: "CBUQ — camada de rolamento e=5cm faixa C", unit: "t", qty: 2187, price: 385.0 },
          ],
        },
        {
          code: "04",
          name: "DRENAGEM",
          order: 4,
          items: [
            { code: "04.001", description: "Escavação manual para drenos e valetas", unit: "m³", qty: 450, price: 68.0 },
            { code: "04.002", description: "Tubo de concreto armado DN=600mm classe PA2", unit: "m", qty: 320, price: 285.0 },
            { code: "04.003", description: "Caixa de inspeção 60×60 em alvenaria", unit: "un", qty: 28, price: 1250.0 },
            { code: "04.004", description: "Sarjeta de concreto moldada in loco", unit: "m", qty: 1850, price: 72.0 },
          ],
        },
        {
          code: "05",
          name: "SINALIZAÇÃO",
          order: 5,
          items: [
            { code: "05.001", description: "Sinalização horizontal — tachão bidirecional", unit: "un", qty: 480, price: 28.0 },
            { code: "05.002", description: "Pintura de faixa de pedestres (termoplástica)", unit: "m²", qty: 320, price: 85.0 },
            { code: "05.003", description: "Placa de sinalização vertical padrão CONTRAN", unit: "un", qty: 45, price: 380.0 },
          ],
        },
      ];

      let totalValue = 0;

      for (const capData of capitulosData) {
        const chapter = await prisma.orcamentoChapter.create({
          data: {
            code: capData.code,
            name: capData.name,
            order: capData.order,
            orcamentoId: orcamento.id,
          },
        });

        for (let i = 0; i < capData.items.length; i++) {
          const item = capData.items[i];
          const totalPrice = item.qty * item.price;
          totalValue += totalPrice;

          await prisma.orcamentoItem.create({
            data: {
              code: item.code,
              description: item.description,
              unit: item.unit,
              quantity: item.qty,
              unitPrice: item.price,
              totalPrice,
              source: "SINAPI",
              sourceCode: `SINAPI-${Math.floor(Math.random() * 90000) + 10000}`,
              order: i + 1,
              chapterId: chapter.id,
            },
          });
        }
      }

      const totalWithBdi = totalValue * 1.25;
      await prisma.orcamento.update({
        where: { id: orcamento.id },
        data: { totalValue, totalWithBdi },
      });

      console.log(`✅ Orçamento criado: R$ ${totalValue.toLocaleString("pt-BR")} (R$ ${totalWithBdi.toLocaleString("pt-BR")} c/ BDI)`);
    }
  }

  // Create Documents
  const documentsData = [
    { name: "Certidão Negativa Federal", type: "CERTIDAO_FEDERAL" as DocumentType, daysToExpiry: 90 },
    { name: "Certidão FGTS", type: "CERTIDAO_FGTS" as DocumentType, daysToExpiry: 25 },
    { name: "Certidão INSS/CND", type: "CERTIDAO_INSS" as DocumentType, daysToExpiry: 180 },
    { name: "Certidão Trabalhista", type: "CERTIDAO_TRABALHISTA" as DocumentType, daysToExpiry: 60 },
    { name: "Certidão Estadual SP", type: "CERTIDAO_ESTADUAL" as DocumentType, daysToExpiry: -5 },
    { name: "Balanço Patrimonial 2023", type: "BALANCO_PATRIMONIAL" as DocumentType, daysToExpiry: 365 },
    { name: "Contrato Social (última alteração)", type: "CONTRATO_SOCIAL" as DocumentType, daysToExpiry: -1 },
    { name: "Alvará de Funcionamento", type: "ALVARA" as DocumentType, daysToExpiry: 45 },
    { name: "Registro CREA-SP", type: "REGISTRO_CREA" as DocumentType, daysToExpiry: 200 },
    { name: "Atestado Capacidade Técnica — Pavimentação 50.000m²", type: "ATESTADO_CAPACIDADE" as DocumentType, daysToExpiry: 730 },
    { name: "Atestado Capacidade Técnica — Saneamento", type: "ATESTADO_CAPACIDADE" as DocumentType, daysToExpiry: 730 },
    { name: "Certidão Municipal SP", type: "CERTIDAO_MUNICIPAL" as DocumentType, daysToExpiry: 15 },
  ];

  let docsCreated = 0;
  for (const docData of documentsData) {
    const existing = await prisma.document.findFirst({
      where: { name: docData.name, companyId: company.id },
    });

    if (!existing) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + docData.daysToExpiry);

      const status = docData.daysToExpiry < 0 ? "EXPIRED" : docData.daysToExpiry <= 30 ? "EXPIRING" : "VALID";

      await prisma.document.create({
        data: {
          name: docData.name,
          type: docData.type,
          category: ["CERTIDAO_FEDERAL", "CERTIDAO_ESTADUAL", "CERTIDAO_MUNICIPAL", "CERTIDAO_FGTS", "CERTIDAO_INSS", "CERTIDAO_TRABALHISTA"].includes(docData.type) ? "Certidões" : "Documentos Técnicos",
          fileKey: `documents/${company.id}/${Date.now()}-${docData.name.toLowerCase().replace(/\s/g, "-")}.pdf`,
          fileSize: Math.floor(Math.random() * 500000) + 50000,
          mimeType: "application/pdf",
          expirationDate,
          status,
          companyId: company.id,
        },
      });
      docsCreated++;
    }
  }

  console.log(`✅ ${docsCreated} Documentos criados`);

  // Create Activities
  const activityTitles = [
    { type: "NOTE" as ActivityType, title: "Análise do edital concluída", description: "Edital analisado pela IA. Identificados 23 requisitos técnicos e 18 documentos necessários." },
    { type: "STATUS_CHANGE" as ActivityType, title: "Status alterado para Orçando", description: "Decisão GO tomada após análise de viabilidade técnica e econômica." },
    { type: "DOCUMENT_UPLOAD" as ActivityType, title: "Certidão FGTS renovada", description: "Documento atualizado com validade de 30 dias." },
    { type: "TASK" as ActivityType, title: "Planilha orçamentária revisada", description: "Revisão completa dos quantitativos e preços unitários do SINAPI." },
    { type: "EMAIL" as ActivityType, title: "Pedido de esclarecimento enviado", description: "Questionamento sobre especificações técnicas do item 5.3 do edital." },
    { type: "MEETING" as ActivityType, title: "Visita técnica ao local", description: "Vistoria realizada com engenheiro responsável. Relatório em elaboração." },
    { type: "SYSTEM" as ActivityType, title: "RPA capturou novo edital", description: "Edital PE 087/2024 identificado automaticamente pelo sistema de automação." },
    { type: "TASK" as ActivityType, title: "Composição de custos finalizada", description: "BDI de 25% aplicado. Valor total com BDI: R$ 6.062.500,00." },
  ];

  const allLicitacoes = await prisma.licitacao.findMany({
    where: { companyId: company.id },
    take: 8,
  });

  for (let i = 0; i < Math.min(activityTitles.length, allLicitacoes.length); i++) {
    const existing = await prisma.activity.findFirst({
      where: { title: activityTitles[i].title, userId: [admin.id, manager.id, analyst.id][i % 3] },
    });

    if (!existing) {
      const daysAgo = i * 2;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await prisma.activity.create({
        data: {
          type: activityTitles[i].type,
          title: activityTitles[i].title,
          description: activityTitles[i].description,
          userId: [admin.id, manager.id, analyst.id, orcamentista.id][i % 4],
          licitacaoId: allLicitacoes[i]?.id ?? allLicitacoes[0].id,
          createdAt,
        },
      });
    }
  }

  console.log("✅ Atividades criadas");

  // Create Contacts
  const contactsData = [
    { name: "Dr. João Batista Ferreira", email: "pregoeiro@pmsp.sp.gov.br", role: "Pregoeiro", phone: "(11) 3392-1234", orgId: orgs[0].id },
    { name: "Eng. Márcia Oliveira", email: "marcia.oliveira@dersp.gov.br", role: "Comissão de Licitação", phone: "(11) 3311-5678", orgId: orgs[1].id },
    { name: "Dra. Patrícia Alves", email: "p.alves@sabesp.com.br", role: "Gerente de Contratos", phone: "(11) 3388-9012", orgId: orgs[2].id },
    { name: "Eng. Fernando Souza", email: "fsouza@dnit.gov.br", role: "Fiscal de Contratos", phone: "(61) 3315-4321", orgId: orgs[3].id },
    { name: "Arq. Beatriz Santos", email: "b.santos@rio.rj.gov.br", role: "Secretária de Obras", phone: "(21) 2503-7890", orgId: orgs[4].id },
  ];

  for (const contactData of contactsData) {
    const existing = await prisma.contact.findFirst({
      where: { email: contactData.email, companyId: company.id },
    });

    if (!existing) {
      await prisma.contact.create({
        data: {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          role: contactData.role,
          organizationId: contactData.orgId,
          companyId: company.id,
        },
      });
    }
  }

  console.log("✅ Contatos criados");

  // Create RPA Job
  const existingJob = await prisma.rpaJob.findFirst({
    where: { companyId: company.id, type: "EDITAL_SEARCH" },
  });

  if (!existingJob) {
    const rpaJob = await prisma.rpaJob.create({
      data: {
        name: "Busca Automática de Editais — ComprasGov + BLL",
        type: "EDITAL_SEARCH" as RpaJobType,
        schedule: "0 8 * * 1-5",
        isActive: true,
        lastRunAt: new Date(Date.now() - 3600000),
        lastRunStatus: "SUCCESS",
        config: {
          portals: ["comprasgov", "bll", "der-sp"],
          keywords: ["pavimentação", "saneamento", "obras civis", "edificação pública"],
          states: ["SP", "RJ", "MG"],
          minValue: 500000,
          maxValue: 200000000,
        },
        companyId: company.id,
      },
    });

    // Create sample logs
    await prisma.rpaLog.createMany({
      data: [
        {
          jobId: rpaJob.id,
          status: "SUCCESS",
          message: "Busca concluída com sucesso",
          itemsFound: 7,
          duration: 45230,
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          jobId: rpaJob.id,
          status: "SUCCESS",
          message: "Busca concluída com sucesso",
          itemsFound: 3,
          duration: 38150,
          createdAt: new Date(Date.now() - 3600000 * 25),
        },
        {
          jobId: rpaJob.id,
          status: "PARTIAL",
          message: "Portal BLL indisponível — buscados apenas ComprasGov",
          itemsFound: 2,
          duration: 22100,
          createdAt: new Date(Date.now() - 3600000 * 49),
        },
      ],
    });

    console.log("✅ RPA Job criado");
  }

  // Create Notifications
  const notifExists = await prisma.notification.findFirst({
    where: { userId: admin.id },
  });

  if (!notifExists) {
    await prisma.notification.createMany({
      data: [
        {
          userId: admin.id,
          type: "DOCUMENT_EXPIRING",
          title: "Certidão FGTS vencendo",
          message: "Certidão FGTS vence em 25 dias. Providencie a renovação.",
          actionUrl: "/documentos/validades",
          read: false,
        },
        {
          userId: admin.id,
          type: "DEADLINE_APPROACHING",
          title: "Prazo se aproximando",
          message: "PE 042/2024 — prazo de entrega em 7 dias.",
          actionUrl: "/licitacoes",
          read: false,
        },
        {
          userId: admin.id,
          type: "RPA_NEW_EDITAL",
          title: "Novo edital identificado",
          message: "RPA capturou novo edital compatível com seu perfil: CC 014/2024 — DER-SP.",
          actionUrl: "/licitacoes",
          read: true,
        },
      ],
    });

    console.log("✅ Notificações criadas");
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Credenciais de acesso:");
  console.log("   Admin:       admin@construtech.com / demo123");
  console.log("   Gerente:     gerente@construtech.com / demo123");
  console.log("   Orçamentista: orcamento@construtech.com / demo123");
  console.log("   Analista:    analista@construtech.com / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
