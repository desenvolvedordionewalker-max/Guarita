import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PainelGuarita(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [ranking, setRanking] = useState<any[]>([]);
  const [gestao, setGestao] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function carregar() {
      try {
        const hoje = new Date().toISOString().split("T")[0];

        const { data: rank } = await supabase
          .from("ranking_puxe_lavoura")
          .select("*")
          .eq("data", hoje)
          .order("rolos", { ascending: false });

        const { data: gest } = await supabase
          .from("gestao_tempo")
          .select("*")
          .order("placa", { ascending: true });

        const { data: prod } = await supabase
          .from("carregamento_produtos")
          .select("*")
          .eq("data", hoje);

        const { data: mat } = await supabase
          .from("movimentacoes_guarita")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        if (!mounted) return;
        setRanking(rank || []);
        setGestao(gest || []);
        setProdutos(prod || []);
        setMateriais(mat || []);
      } catch (err) {
        // do nothing - TV should be resilient
      }
    }
    carregar();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const ajustarEscala = () => {
      const baseWidth = 1920;
      const baseHeight = 1080;
      const scaleW = window.innerWidth / baseWidth;
      const scaleH = window.innerHeight / baseHeight;
      const finalScale = Math.min(scaleW, scaleH) * 1.05;
      setScale(finalScale);
    };
    ajustarEscala();
    window.addEventListener("resize", ajustarEscala);
    return () => window.removeEventListener("resize", ajustarEscala);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#070D0B] flex items-center justify-center">
      <div
        ref={containerRef}
        className="origin-center transition-transform duration-500 ease-in-out"
        style={{
          transform: `scale(${scale})`,
          width: "1920px",
          height: "1080px",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateColumns: "1fr",
        }}
      >
        <header className="flex justify-between items-center px-8 py-4 border-b border-[#1E2A33] text-[#EAFBF0]">
          <div>
            <h1 className="text-4xl font-bold text-[#00FFB3]">Gestão Guarita</h1>
            <p className="text-[#6FBFA5] text-lg">IBA Santa Luzia</p>
          </div>
          <div className="flex items-center gap-4 text-[#A8D6C4] text-lg">
            <div className="bg-[#0E1410] px-4 py-2 rounded-xl border border-[#1E2A33] flex gap-3">
              <span>💧 chuva: 0 mm</span>
              <span>🌡️ M: 117 mm</span>
            </div>
            <div className="text-[#00FFB3] font-bold text-2xl">
              {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-6 p-6" style={{ gridTemplateColumns: "20% 40% 40%", alignItems: "stretch" }}>
          <div className="flex flex-col gap-4">
            {(produtos || []).map((p, i) => (
              <div key={i} className="flex flex-col justify-between bg-[#101B17] rounded-2xl p-4 shadow-md flex-1">
                <h2 className="font-semibold text-2xl mb-2" style={{ color: p.nome === "PLUMA" ? "#00C2FF" : p.nome === "CAROÇO" ? "#FFC300" : "#00FFB3" }}>
                  {p.nome}
                </h2>
                <p className="text-[#A8D6C4] text-lg mb-2">{p.quantidade} {p.unidade}</p>
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-[#EAFBF0] text-2xl font-bold">{p.fila}</p>
                    <p className="text-[#6FBFA5]">Fila</p>
                  </div>
                  <div>
                    <p className="text-[#00C2FF] text-2xl font-bold">{p.carregando}</p>
                    <p className="text-[#6FBFA5]">Carregando</p>
                  </div>
                  <div>
                    <p className="text-[#00FFB3] text-2xl font-bold">{p.concluidos}</p>
                    <p className="text-[#6FBFA5]">Concluídos</p>
                  </div>
                </div>
                <div className="border-t border-[#1E2A33] mt-2 pt-2 text-sm">
                  <p>🚛 {p.veiculo1}</p>
                  <p>🚛 {p.veiculo2}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col bg-[#101B17] rounded-2xl p-5 justify-between shadow-md">
            <div className="flex justify-between items-center">
              <h2 className="text-[#00C2FF] text-2xl font-semibold">Ranking Puxe Lavoura</h2>
              <div className="text-right text-[#A8D6C4]">
                <p>Fazenda: <span className="text-[#00FFB3] font-semibold">São José</span></p>
                <p>Talhão: TH 18</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 flex-1">
              {(ranking || []).slice(0, 6).map((r, i) => (
                <div key={i} className="bg-[#0E1410] border border-[#1E2A33] rounded-xl p-3">
                  <div className="flex justify-between mb-1">
                    <span>{i + 1}º {r.motorista}</span>
                    <span className="text-[#00FFB3] font-bold">{r.rolos} rolos</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1A2723]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#00C2FF] to-[#00FFB3]" style={{ width: ranking[0] && ranking[0].rolos ? `${(r.rolos / ranking[0].rolos) * 100}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0E1410] mt-4 rounded-xl p-4 border border-[#1E2A33]">
              <h3 className="text-[#FFC300] text-xl font-semibold mb-2">Materiais e Equipamentos (Hoje)</h3>
              {(materiais || []).map((m, i) => (
                <p key={i} className="text-[#A8D6C4] text-sm">{m.tipo === "entrada" ? "📥" : "📤"} {m.descricao}</p>
              ))}
            </div>
          </div>

          <div className="bg-[#101B17] rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-[#00C2FF] text-2xl font-semibold">Gestão de Tempo</h2>
              <div className="flex gap-6 text-lg">
                <span className="text-[#FFC300]">🏭 Algodoeira: 25 min</span>
                <span className="text-[#FF65A3]">🌾 Lavoura: 41 min</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {(gestao || []).map((g, i) => (
                <div key={i} className="bg-[#0E1410] border border-[#1E2A33] p-3 rounded-xl">
                  <h3 className="font-semibold text-[#00C2FF] text-lg">🚛 {g.placa} — {g.motorista}</h3>
                  <p className="text-[#A8D6C4] text-sm">{g.viagens} viagens • {g.rolos} rolos</p>
                  <p className="text-[#00FFB3] font-bold mt-1">Total: {g.total}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

