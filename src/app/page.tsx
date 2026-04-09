import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  Building2, Globe, Cpu, Calculator, Award, ArrowRight,
  Bot, BarChart3, ShieldCheck, Users, Check,
  Clock, AlertTriangle, FileX, ChevronRight,
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ConstruTech Pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#como-funciona" className="hover:text-gray-900 transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-gray-900 transition-colors">Preços</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link
              href="/registro"
              className="flex items-center gap-1.5 text-sm font-medium bg-[#6366f1] text-white px-4 py-2 rounded-lg hover:bg-[#4f46e5] transition-colors"
            >
              Criar conta grátis <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6 text-gray-900">
              Pare de Perder<br />Licitações.<br />
              <span className="text-[#6366f1]">Comece a Dominar.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              A plataforma que une IA, automação e orçamentos SINAPI em um só lugar —
              para construtoras que querem vencer mais licitações públicas.
              Conforme <strong className="text-gray-800">Lei 14.133/2021</strong> e <strong className="text-gray-800">Lei 8.666/93</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                href="/registro"
                className="flex items-center justify-center gap-2 bg-[#6366f1] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4f46e5] transition-colors text-base"
              >
                Criar conta grátis
              </Link>
              <a
                href="#como-funciona"
                className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-base"
              >
                Ver como funciona
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-4xl font-black text-gray-900">+2.000</p>
                <p className="text-sm text-gray-500 mt-1">Licitações<br />Gerenciadas</p>
              </div>
              <div>
                <p className="text-4xl font-black text-gray-900">+180</p>
                <p className="text-sm text-gray-500 mt-1">Construtoras<br />Ativas</p>
              </div>
              <div>
                <p className="text-4xl font-black text-gray-900">100%</p>
                <p className="text-sm text-gray-500 mt-1">Sem Cartão de<br />Crédito</p>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 flex items-center justify-center">
              <div className="text-center p-8 w-full">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-3">
                  {[
                    { text: "Edital capturado automaticamente", done: true },
                    { text: "IA analisando requisitos...", done: true },
                    { text: "Orçamento SINAPI gerado", done: true },
                    { text: "Proposta enviada ✓", done: true, success: true },
                  ].map((step, i) => (
                    <div key={i} className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left ${step.success ? "bg-green-400/20 text-green-200 border border-green-400/30" : "bg-white/10 text-white/80 border border-white/10"}`}>
                      {step.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#6366f1]/10 rounded-3xl -z-10" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-amber-400/10 rounded-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* ── Problemas ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Reconhece algum desses problemas?</h2>
            <p className="text-gray-500 text-lg">O mercado de licitações é complexo. Mas não precisa ser assim.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                Icon: Clock,
                title: "Editais Complexos",
                desc: "Horas perdidas analisando centenas de páginas de documentos técnicos e jurídicos manualmente.",
                color: "text-orange-500",
                bg: "bg-orange-50 border-orange-100",
              },
              {
                Icon: AlertTriangle,
                title: "Certidões Vencidas",
                desc: "Desclassificado por documentos vencidos que ninguém lembrou de renovar a tempo.",
                color: "text-red-500",
                bg: "bg-red-50 border-red-100",
              },
              {
                Icon: FileX,
                title: "Orçamentos Fora do Padrão",
                desc: "Propostas rejeitadas por não seguir as tabelas SINAPI, ORSE-SE ou SEINFRA exigidas pelo edital.",
                color: "text-purple-500",
                bg: "bg-purple-50 border-purple-100",
              },
            ].map((p) => (
              <div key={p.title} className={`rounded-xl border p-6 ${p.bg}`}>
                <p.Icon className={`w-6 h-6 mb-3 ${p.color}`} />
                <h3 className="font-bold mb-2 text-gray-800">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#eef0fd] border border-[#c7d0fa] rounded-xl p-5 flex gap-4 items-start max-w-3xl mx-auto">
            <span className="text-[#6366f1] text-lg flex-shrink-0">□</span>
            <p className="text-gray-700 text-base">
              <strong>Existe um jeito melhor.</strong> A ConstruTech Pro foi criada para resolver cada um desses
              problemas — de forma integrada, inteligente e acessível.
            </p>
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Do edital à proposta em 4 etapas</h2>
          <p className="text-gray-500 text-lg">
            Cada etapa se conecta automaticamente à próxima.<br />
            Sem retrabalho, sem redigitação, sem perda de dados entre sistemas.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start justify-center">
          {[
            { Icon: Globe, label: "Captura", desc: "RPA monitora portais 24/7" },
            { Icon: Cpu, label: "Análise IA", desc: "Claude lê o edital por você" },
            { Icon: Calculator, label: "Orçamento", desc: "SINAPI/ORSE-SE/SEINFRA" },
            { Icon: Award, label: "Proposta", desc: "Exportação PDF/Excel" },
          ].map((step, i) => (
            <div key={step.label} className="flex md:flex-row flex-col items-center">
              <div className="flex flex-col items-center text-center w-36 md:w-40">
                <div className="w-20 h-20 rounded-full border-2 border-[#6366f1] bg-white flex items-center justify-center mb-3 shadow-sm">
                  <step.Icon className="w-8 h-8 text-[#6366f1]" />
                </div>
                <p className="font-bold text-gray-800">{step.label}</p>
                <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:flex items-center mb-8 mx-1">
                  <div className="w-6 h-0.5 bg-[#6366f1]/40" />
                  <ChevronRight className="w-4 h-4 text-[#6366f1]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <div id="funcionalidades">

        {/* Feature 1: IA */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] bg-[#eef0fd] px-3 py-1 rounded-full mb-4">
                <Cpu className="w-3 h-3" /> Inteligência Artificial
              </span>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">IA que lê editais por você</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Envie qualquer edital e nossa IA extrai automaticamente requisitos técnicos,
                prazos, condições de habilitação e pontos críticos — em segundos, não em horas.
              </p>
              <ul className="space-y-3">
                {[
                  "Análise completa de editais em segundos",
                  "Extração de requisitos de habilitação",
                  "Alertas de prazos e datas importantes",
                  "Resumo executivo para sua equipe",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 bg-[#6366f1]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#6366f1]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-950 to-indigo-900 aspect-video flex items-center justify-center p-8">
              <div className="w-full bg-white/5 rounded-xl border border-white/10 p-5">
                <p className="text-white/50 text-xs mb-4">Analisando edital SEINFRA-SE-2024-0847...</p>
                <div className="space-y-2">
                  {["✓ 47 requisitos identificados", "✓ Prazo: 15/04/2026", "✓ Valor estimado: R$ 2.4M", "✓ Empresa habilitada"].map((line, i) => (
                    <p key={i} className={`text-sm font-medium ${i === 3 ? "text-green-400" : "text-white"}`}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Orçamentos */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 aspect-video flex items-center justify-center p-6">
              <div className="w-full">
                <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden text-xs">
                  <div className="grid grid-cols-4 text-white/50 p-2 border-b border-white/10 gap-2">
                    <span>Código</span><span>Descrição</span><span>Qtd</span><span>Total</span>
                  </div>
                  {[
                    ["87492", "Concreto fck=25MPa", "45 m³", "R$12.600"],
                    ["94992", "Aço CA-50 Ø10mm", "850 kg", "R$8.500"],
                    ["74209", "Forma em chapa", "120 m²", "R$4.320"],
                  ].map(([cod, desc, qtd, total]) => (
                    <div key={cod} className="grid grid-cols-4 text-white/80 p-2 border-b border-white/5 gap-2">
                      <span className="text-[#818cf8]">{cod}</span>
                      <span>{desc}</span>
                      <span>{qtd}</span>
                      <span className="text-green-400">{total}</span>
                    </div>
                  ))}
                  <div className="p-2 text-right font-bold text-white">Total: R$25.420</div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {["SINAPI", "ORSE-SE", "SEINFRA", "BDI 25%"].map((tag) => (
                    <span key={tag} className="text-xs bg-[#6366f1]/20 text-indigo-300 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] bg-[#eef0fd] px-3 py-1 rounded-full mb-4">
                <Calculator className="w-3 h-3" /> Orçamentos
              </span>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Orçamentos que impressionam bancas</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Gere orçamentos profissionais compatíveis com as principais tabelas de referência
                brasileiras, com BDI e encargos sociais calculados automaticamente.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  ["SINAPI", "Federal / Caixa", "bg-blue-50 border-blue-200 text-blue-700"],
                  ["SICRO", "Obras rodoviárias", "bg-green-50 border-green-200 text-green-700"],
                  ["ORSE-SE", "Estado de Sergipe", "bg-amber-50 border-amber-200 text-amber-700"],
                  ["SEINFRA", "Secretarias estaduais", "bg-purple-50 border-purple-200 text-purple-700"],
                ].map(([name, sub, cls]) => (
                  <div key={name} className={`rounded-lg border p-3 ${cls}`}>
                    <p className="font-bold text-sm">{name}</p>
                    <p className="text-xs opacity-70">{sub}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                💡 Compare preços entre tabelas e exporte com BDI já calculado — garantindo competitividade e conformidade em cada proposta.
              </p>
            </div>
          </div>
        </section>

        {/* Feature 3: RPA */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] bg-[#eef0fd] px-3 py-1 rounded-full mb-4">
                <Bot className="w-3 h-3" /> Automação RPA
              </span>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Nunca mais perca uma licitação por falta de informação</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Agentes RPA trabalhando 24/7</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Robôs inteligentes monitoram todos os principais portais de licitação do Brasil
                    continuamente, capturando editais relevantes antes mesmo de você acordar.
                  </p>
                </div>
                <div className="bg-[#eef0fd] border border-[#c7d0fa] rounded-xl p-4">
                  <p className="text-sm text-[#6366f1] font-medium">✓ Importação automática de editais</p>
                </div>
                <div className="bg-[#eef0fd] border border-[#c7d0fa] rounded-xl p-4">
                  <p className="text-sm text-[#6366f1] font-medium">✓ Alertas por e-mail em tempo real</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-52 h-52 rounded-full border-4 border-[#6366f1]/20 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border-4 border-[#6366f1]/40 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-5xl font-black text-[#6366f1]">100%</p>
                      <p className="text-xs text-gray-500 mt-1">automatizado</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">24/7</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 4: CRM */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] bg-[#eef0fd] px-3 py-1 rounded-full mb-4">
                <Users className="w-3 h-3" /> CRM & Gestão
              </span>
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Organize sua operação como as grandes construtoras</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Pipeline visual de oportunidades, gestão de contatos, alertas de documentos e controle de
                acesso por perfil — tudo que sua construtora precisa para operar com excelência.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  Icon: BarChart3,
                  title: "Pipeline Visual de Oportunidades",
                  desc: "Acompanhe cada licitação em tempo real, do prospecto ao contrato assinado, com visibilidade total da sua equipe.",
                },
                {
                  Icon: ShieldCheck,
                  title: "Gestão de Documentos",
                  desc: "Alertas automáticos de vencimento de certidões, Registro CREA, balanços e demais habilitações.",
                },
                {
                  Icon: Users,
                  title: "Multi-Usuário com RBAC",
                  desc: "Perfis de administrador, gerente, orçamentista e analista — cada um com suas permissões específicas.",
                },
              ].map((f) => (
                <div key={f.title} className="bg-[#eef0fd] border border-[#c7d0fa] rounded-xl p-6">
                  <f.Icon className="w-6 h-6 text-[#6366f1] mb-4" />
                  <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Pricing ── */}
      <section id="precos" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Comece grátis. Escale quando quiser.</h2>
            <p className="text-gray-500 text-lg">
              Planos pensados para construtoras de todos os portes — do freelancer que quer entrar
              no mercado público às grandes empresas com operação complexa.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-5 border-b border-gray-100">
              <div className="p-4 text-sm font-semibold text-gray-400">Recurso</div>
              <div className="p-4 text-center border-l border-gray-100">
                <p className="font-bold text-gray-800">Grátis</p>
                <p className="text-gray-400 text-xs mt-0.5">R$ 0/mês</p>
              </div>
              <div className="p-4 text-center border-l border-gray-100">
                <p className="font-bold text-gray-800">Starter</p>
                <p className="text-[#6366f1] font-semibold text-sm mt-0.5">R$69/mês</p>
              </div>
              <div className="p-4 text-center bg-[#6366f1] border-l border-[#5558e3]">
                <p className="font-bold text-white">Pro ⭐</p>
                <p className="text-indigo-200 text-sm mt-0.5">R$99/mês</p>
              </div>
              <div className="p-4 text-center border-l border-gray-100">
                <p className="font-bold text-gray-800">Enterprise</p>
                <p className="text-gray-400 text-xs mt-0.5">Sob consulta</p>
              </div>
            </div>

            {/* Rows */}
            {[
              ["Licitações", "5", "50", "Ilimitado", "Ilimitado"],
              ["Usuários", "1", "3", "10", "Personalizado"],
              ["Agentes RPA", "1", "5", "20", "Ilimitado"],
              ["Documentos", "20", "200", "Ilimitado", "Ilimitado"],
              ["Análise com IA", "—", "✓", "✓", "✓"],
              ["Exportação PDF/Excel", "—", "✓", "✓", "✓"],
              ["Alertas por e-mail", "—", "✓", "✓", "✓"],
              ["Suporte prioritário", "—", "—", "✓", "✓"],
              ["SSO / SAML", "—", "—", "—", "✓"],
            ].map(([label, free, starter, pro, enterprise], rowIdx) => (
              <div key={label} className={`grid grid-cols-5 border-b border-gray-100 text-sm ${rowIdx % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}>
                <div className="p-4 font-medium text-gray-700">{label}</div>
                <div className="p-4 text-center text-gray-500 border-l border-gray-100">{free}</div>
                <div className="p-4 text-center text-gray-600 border-l border-gray-100">{starter}</div>
                <div className={`p-4 text-center text-white font-medium border-l border-[#5558e3] ${rowIdx % 2 === 0 ? "bg-[#5f63ef]" : "bg-[#6366f1]"}`}>{pro}</div>
                <div className="p-4 text-center text-gray-600 border-l border-gray-100">{enterprise}</div>
              </div>
            ))}

            {/* CTA row */}
            <div className="grid grid-cols-5">
              <div className="p-4" />
              <div className="p-4 border-l border-gray-100 flex justify-center">
                <Link href="/registro" className="text-sm font-semibold text-[#6366f1] hover:underline">Começar grátis</Link>
              </div>
              <div className="p-4 border-l border-gray-100 flex justify-center">
                <Link href="/registro" className="text-sm font-semibold text-[#6366f1] hover:underline">Assinar agora</Link>
              </div>
              <div className="p-4 bg-[#6366f1] border-l border-[#5558e3] flex justify-center">
                <Link href="/registro" className="text-sm font-bold text-white bg-white/20 px-4 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                  Assinar agora
                </Link>
              </div>
              <div className="p-4 border-l border-gray-100 flex justify-center">
                <a href="mailto:comercial@construtechpro.com" className="text-sm font-semibold text-gray-500 hover:underline">Falar com vendas</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight">
              Sua próxima licitação pode ser a que muda tudo.
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Junte-se a centenas de construtoras que já automatizaram sua operação licitatória
              com a ConstruTech Pro. Setup em 2 minutos. Sem cartão de crédito.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { emoji: "🚀", title: "Comece em 2 minutos", desc: "Cadastre-se, configure seu perfil e já inicie o monitoramento de licitações." },
                { emoji: "🔒", title: "Sem compromisso", desc: "Plano Free para sempre, sem cartão de crédito. Escale quando estiver pronto." },
                { emoji: "✅", title: "Conforme a lei", desc: "Lei 14.133/2021 e Lei 8.666/93 — sua operação sempre dentro das normas." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 bg-[#eef0fd] border border-[#c7d0fa] rounded-xl p-4">
                  <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-[#6366f1] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#4f46e5] transition-colors text-base"
            >
              Criar conta grátis agora <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-400 mt-3">
              www.construtechpro.com · Sem cartão de crédito · Setup em 2 minutos
            </p>
          </div>

          <div className="hidden lg:block rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-100 aspect-[3/4] relative">
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center w-full">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-1">Próxima licitação</h3>
                <p className="text-gray-500 text-sm mb-6">vencida pela sua equipe</p>
                <div className="space-y-2 text-left bg-white/60 rounded-xl p-4 border border-amber-100">
                  {[
                    "Edital analisado em 30s",
                    "Orçamento SINAPI aprovado",
                    "Proposta enviada no prazo",
                    "Contrato assinado ✓",
                  ].map((s, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${i === 3 ? "text-green-600 font-bold" : "text-gray-600"}`}>
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6366f1] rounded flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-700">ConstruTech Pro</span>
          </div>
          <p>© {new Date().getFullYear()} ConstruTech Pro. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-gray-700 transition-colors">Entrar</Link>
            <Link href="/registro" className="hover:text-gray-700 transition-colors">Cadastro</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
