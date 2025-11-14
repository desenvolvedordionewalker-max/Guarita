import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PainelGuaritaNovo(): JSX.Element {
  const [rankingHoje, setRankingHoje] = useState<any[]>([]);
  const [rankingMes, setRankingMes] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [gestao, setGestao] = useState<any[]>([]);
  const [now, setNow] = useState<string>(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));

  useEffect(() => {
    let mounted = true;

    async function carregar() {
      try {
        const hoje = new Date().toISOString().split("T")[0];

        const { data: rHoje } = await supabase
          .from("ranking_puxe_lavoura")
          .select("*")
          .eq("data", hoje)
          .order("rolos", { ascending: false });

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: rMes } = await supabase
          .from("ranking_puxe_lavoura")
          .select("*")
          .gte("data", startOfMonth)
          .order("total_rolos_mes", { ascending: false });

        const { data: mov } = await supabase
          .from("movimentacoes_guarita")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        const { data: gest } = await supabase
          .from("gestao_tempo")
          .select("*")
          .order("placa", { ascending: true });

        if (!mounted) return;
        setRankingHoje(rHoje || []);
        setRankingMes(rMes || []);
        setMovimentacoes(mov || []);
        setGestao(gest || []);
      } catch (err) {
        console.error("Erro ao carregar dados PainelGuaritaNovo:", err);
      }
    }

    carregar();
    const interval = setInterval(carregar, 30_000);
    const clock = setInterval(() => setNow(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })), 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);

  const topRolos = rankingHoje[0]?.rolos || 1;

  function formatMinutesToLabel(mins: number | null | undefined) {
    if (!mins && mins !== 0) return "—";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}min`;
  }

  return (
    <div className="min-h-screen bg-[#0B1210] text-[#EAFBF0] font-inter p-6 grid grid-cols-[320px_1fr_1fr] gap-6">
      {/* HEADER */}
      <header className="col-span-3 rounded-2xl p-4" style={{ background: "linear-gradient(90deg,#0b5cff33 0%, #00ffb333 100%)", boxShadow: "0 6px 18px rgba(0,194,255,0.08)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#00C2FF] to-[#00FFB3] text-[#072018] font-bold">IBA</div>
            <div>
              <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#00C2FF] to-[#00FFB3]">Controle Guarita</h1>
              <p className="text-sm text-[#A8D6C4]">IBA Santa Luzia</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-sm text-[#A8D6C4] text-right">
              <div>☁️ 27°C • 🌧️ 8mm • 💨 4 km/h</div>
              <div className="mt-1">📅 {new Date().toLocaleDateString("pt-BR")} — <span className="text-[#00FFB3] font-semibold">{now}</span></div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#06110f66] border border-[#0b4037] text-sm">
              <div className="text-[#00FFB3] font-semibold">🟢 3 movimentações hoje</div>
              <div className="text-[#A8D6C4] text-xs">Total 31.160t</div>
            </div>
          </div>
        </div>
      </header>

      {/* LEFT: Produtos (placeholder column) */}
      <aside className="flex flex-col gap-4">
        <div className="bg-[#101B17] rounded-2xl p-4 shadow-[0_6px_16px_#00C2FF40]">
          <h3 className="text-[#00C2FF] font-semibold mb-3">Produtos</h3>
          <div className="grid gap-3">
            {[
              { nome: "PLUMA", destaque: true },
              { nome: "CAROÇO" },
              { nome: "FIBRILHA" },
              { nome: "BRIQUETE" },
            ].map((p) => (
              <div key={p.nome} className={`flex items-center justify-between p-3 rounded-lg ${p.destaque ? "bg-gradient-to-r from-[#0b3cff20] to-[#00ffb320] border border-[#00FFB3]" : "bg-[#0E1410]"}`}>
                <div>
                  <div className="text-sm text-[#A8D6C4]">{p.nome}</div>
                  <div className="text-xs text-[#55786B]">Estoque: —</div>
                </div>
                <div className="text-lg font-bold text-[#00FFB3]">— t</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#101B17] rounded-2xl p-4 shadow-[0_6px_16px_#00C2FF40]">
          <h3 className="text-[#00FFB3] font-semibold mb-3">Clima</h3>
          <div className="text-sm text-[#A8D6C4]">Última leitura: 18:00 — 🌧️ 8mm — 💨 4 km/h</div>
        </div>
      </aside>

      {/* CENTER: Ranking + Entradas/Saídas */}
      <main className="flex flex-col gap-4">
        <section className="bg-[#101B17] rounded-2xl p-5 shadow-[0_6px_20px_#00C2FF25]">
          <h2 className="text-[#00C2FF] text-lg font-semibold mb-4">Ranking Puxe Lavoura</h2>

          <div className="flex flex-col gap-3">
            {rankingHoje.length === 0 && <div className="text-sm text-[#55786B]">Nenhum registro hoje</div>}

            {rankingHoje.map((r, i) => {
              const pct = Math.min(100, Math.round(((r.rolos || 0) / topRolos) * 100));
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`;
              return (
                <div key={i} className="p-3 rounded-xl bg-[#0E1410] flex items-center justify-between shadow-inner border border-[#0b2b25]">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{medal}</div>
                    <div>
                      <div className="font-semibold text-lg text-[#EAFBF0]">{r.motorista} — <span className="text-[#A8D6C4] text-sm">{r.placa}</span></div>
                      <div className="text-sm text-[#A8D6C4] mt-1">Rolos: <span className="text-[#00FFB3] font-bold">{r.rolos}</span> • Viagens: {r.viagens} • ⏱️ Ciclo médio: {r.ciclo_medio ?? '—'}</div>
                      <div className="mt-2 w-64 h-2 rounded-full bg-[#10231f] overflow-hidden">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#00C2FF,#00FFB3)" }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#A8D6C4]">Status:</div>
                    <div className="mt-1 text-sm font-semibold text-[#00FFB3]">{r.status ?? 'Normal'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Entradas / Saídas */}
        <section className="bg-[#0E1410cc] rounded-2xl p-5 shadow-[0_6px_20px_#00C2FF25] border border-[#002f26]">
          <h3 className="text-[#00FFB3] font-semibold mb-3">📦 Entradas e Saídas</h3>

          {movimentacoes.length === 0 ? (
            <div className="text-sm text-[#55786B]">Nenhuma movimentação registrada hoje.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {movimentacoes.map((m, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#14221d]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{m.tipo === "entrada" ? "📥" : "📤"}</span>
                    <div className="text-[#EAFBF0]">{m.descricao}</div>
                  </div>
                  <div className="text-[#A8D6C4]">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* RIGHT: Gestão de Tempo */}
      <aside className="bg-[#101B17] rounded-2xl p-5 shadow-[0_6px_20px_#00C2FF25] overflow-y-auto">
        <h2 className="text-[#00C2FF] text-lg font-semibold mb-3">Gestão de Tempo</h2>
        <div className="grid grid-cols-2 gap-4">
          {gestao.length === 0 && <div className="text-sm text-[#55786B] col-span-2">Sem dados de gestão hoje.</div>}

          {gestao.map((g, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#0E1410] border border-[#08382f] shadow-[0_6px_14px_#00C2FF20]">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-[#EAFBF0]">🚛 {g.placa} — {g.motorista}</div>
                  <div className="text-sm text-[#A8D6C4]">{g.viagens || 0} viagens • {g.rolos || 0} rolos</div>
                </div>
                <div className="text-sm text-[#00FFB3] font-bold">{formatMinutesToLabel(g.total_minutes)}</div>
              </div>

              <div className="mt-3 text-sm text-[#A8D6C4]">Lavoura: {formatMinutesToLabel(g.t_lavoura)} • Algodoeira: {formatMinutesToLabel(g.t_algodoeira)}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
