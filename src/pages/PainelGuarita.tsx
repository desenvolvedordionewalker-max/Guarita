import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PainelGuarita() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rankingHoje, setRankingHoje] = useState<any[]>([]);
  const [gestao, setGestao] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);

  // 🔹 Busca dados reais
  useEffect(() => {
    async function carregar() {
      const hoje = new Date().toISOString().split("T")[0];
      const { data: rHoje } = await supabase
        .from("ranking_puxe_lavoura")
        .select("*")
        .eq("data", hoje)
        .order("rolos", { ascending: false });

      const { data: mov } = await supabase
        .from("movimentacoes_guarita")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: gest } = await supabase
        .from("gestao_tempo")
        .select("*")
        .order("placa", { ascending: true });

      setRankingHoje(rHoje || []);
      setMovimentacoes(mov || []);
      setGestao(gest || []);
    }
    carregar();
  }, []);

  // 🔧 Ajuste automático de escala (modo TV)
  useEffect(() => {
    function ajustarEscala() {
      const el = containerRef.current;
      if (!el) return;
      const baseWidth = 1920; // resolução base padrão
      const baseHeight = 1080;
      const scaleW = window.innerWidth / baseWidth;
      const scaleH = window.innerHeight / baseHeight;
      const finalScale = Math.min(scaleW, scaleH);
      setScale(finalScale);
    }

    ajustarEscala();
    window.addEventListener("resize", ajustarEscala);
    return () => window.removeEventListener("resize", ajustarEscala);
  }, []);

  return (
    <div
      className="w-screen h-screen overflow-hidden flex items-center justify-center bg-[#0B1210] text-[#EAFBF0]"
    >
      <div
        ref={containerRef}
        className="origin-top-left transition-transform duration-500 ease-in-out"
        style={{
          transform: `scale(${scale})`,
          width: "1920px",
          height: "1080px",
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "340px 1fr 1fr",
          gridGap: "20px",
        }}
      >
        {/* 🔹 COLUNA ESQUERDA */}
        <div className="flex flex-col gap-5">
          <div className="bg-[#101B17] rounded-2xl p-5 shadow-[0_0_15px_#00C2FF25]">
            <h2 className="text-[#00C2FF] text-xl font-semibold mb-3">
              Ranking Puxe Lavoura
            </h2>
            <div className="flex flex-col gap-2">
              {rankingHoje.map((r, i) => (
                <div
                  key={i}
                  className="bg-[#0E1410] border border-[#1E2A33] p-3 rounded-xl flex justify-between items-center"
                >
                  <span>
                    {i + 1}º {r.motorista}
                  </span>
                  <span className="text-[#00FFB3] font-bold">{r.rolos} rolos</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#101B17] rounded-2xl p-5 shadow-[0_0_15px_#00FFB320]">
            <h2 className="text-[#00FFB3] text-xl font-semibold mb-3">
              📦 Entradas e Saídas
            </h2>
            {movimentacoes.length > 0 ? (
              movimentacoes.map((m, i) => (
                <div
                  key={i}
                  className="text-sm border-b border-[#1E2A33] py-1 flex justify-between"
                >
                  <span>
                    {m.tipo === "entrada" ? "📥" : "📤"} {m.descricao}
                  </span>
                  <span className="text-[#A8D6C4]">
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[#55786B] text-sm italic">
                Nenhuma movimentação registrada hoje.
              </p>
            )}
          </div>
        </div>

        {/* 🔹 COLUNA CENTRAL – RANKING DETALHADO */}
        <div className="bg-[#101B17] rounded-2xl p-5 shadow-[0_0_15px_#00C2FF25] overflow-hidden">
          <h2 className="text-[#00C2FF] text-xl font-semibold mb-4">
            Gestão Guarita – Santa Luzia
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {rankingHoje.slice(0, 6).map((r, i) => (
              <div
                key={i}
                className="bg-[#0E1410] p-4 rounded-xl border border-[#1E2A33]"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{i + 1}º {r.motorista}</span>
                  <span className="text-[#00FFB3]">{r.rolos} rolos</span>
                </div>
                <div className="h-2 rounded-full bg-[#1A2723]">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#00C2FF] to-[#00FFB3]"
                    style={{
                      width: `${rankingHoje[0] ? (r.rolos / rankingHoje[0].rolos) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 COLUNA DIREITA – GESTÃO DE TEMPO */}
        <div className="bg-[#101B17] rounded-2xl p-5 shadow-[0_0_15px_#00C2FF25] overflow-hidden">
          <h2 className="text-[#00C2FF] text-xl font-semibold mb-3">Gestão de Tempo</h2>
          <div className="grid grid-cols-2 gap-3">
            {gestao.map((g, i) => (
              <div
                key={i}
                className="bg-[#0E1410] border border-[#1E2A33] p-3 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-[#00C2FF]">🚛 {g.placa} — {g.motorista}</h3>
                  <p className="text-sm text-[#A8D6C4]">Viagens: {g.viagens} • Rolos: {g.rolos}</p>
                </div>
                <p className="text-[#00FFB3] font-semibold mt-2">Total: {g.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
