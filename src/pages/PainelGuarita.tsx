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
          import { useEffect, useState } from "react";
          import { supabase } from "@/lib/supabase";

          export default function PainelGuarita(): JSX.Element {
            const [ranking, setRanking] = useState<any[]>([]);
            const [gestao, setGestao] = useState<any[]>([]);
            const [produtos, setProdutos] = useState<any[]>([]);

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

                  if (!mounted) return;
                  setRanking(rank || []);
                  setGestao(gest || []);
                  setProdutos(prod || []);
                } catch (err) {
                  // silent for TV; optionally log
                }
              }
              carregar();
              return () => {
                mounted = false;
              };
            }, []);

            return (
              <div
                className="flex flex-col w-screen h-screen bg-[#070D0B] text-[#EAFBF0] overflow-hidden"
                style={{ fontSize: "clamp(0.8rem, 0.9vw, 1rem)" }}
              >
                {/* ================= CABEÇALHO ================= */}
                <header className="flex justify-between items-center px-[2vw] py-[1vh] border-b border-[#1E2A33]">
                  <div>
                    <h1 className="text-[clamp(1.3rem,2vw,2.4rem)] font-bold bg-gradient-to-r from-[#00C2FF] to-[#00FFB3] bg-clip-text text-transparent">
                      Gestão Guarita
                    </h1>
                    <p className="text-[#6FBFA5] text-[clamp(0.8rem,1vw,1rem)]">IBA Santa Luzia</p>
                  </div>

                  <div className="flex items-center gap-3 text-[#A8D6C4]">
                    <div className="flex gap-3 bg-[#0E1410] px-[1vw] py-[0.5vh] rounded-xl border border-[#1E2A33]">
                      <span>💧 chuva: 0 mm</span>
                      <span>🌡️ M: 117 mm</span>
                    </div>
                    <div className="text-[#00FFB3] font-bold text-[clamp(1rem,1.2vw,1.4rem)]">
                      {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </header>

                {/* ================= GRID PRINCIPAL ================= */}
                <main
                  className="grid flex-1 gap-[1vw] px-[1.5vw] py-[1vh]"
                  style={{
                    gridTemplateColumns: "minmax(300px, 20%) 1fr 1fr",
                    gridTemplateRows: "1fr",
                    height: "calc(100vh - 10vh)",
                  }}
                >
                  {/* ======== COLUNA ESQUERDA ======== */}
                  <section className="flex flex-col gap-[1vh] overflow-hidden">
                    {produtos.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-[#6FBFA5]">Sem dados de produtos hoje</div>
                    ) : (
                      produtos.map((p, i) => (
                        <div
                          key={i}
                          className="flex flex-col justify-between bg-[#101B17] rounded-2xl shadow-md p-[1vw] flex-1"
                        >
                          <h2
                            className="font-semibold text-[clamp(1rem,1.4vw,1.6rem)] mb-[0.5vh]"
                            style={{
                              color: p.nome === "PLUMA" ? "#00C2FF" : p.nome === "CAROÇO" ? "#FFC300" : "#00FFB3",
                            }}
                          >
                            {p.nome}
                          </h2>
                          <p className="text-[#A8D6C4] mb-[0.5vh]">{p.quantidade} {p.unidade}</p>
                          <div className="flex justify-around text-center">
                            <div>
                              <p className="text-[#EAFBF0] text-[clamp(1rem,1.3vw,1.5rem)] font-bold">{p.fila}</p>
                              <p className="text-[#6FBFA5]">Fila</p>
                            </div>
                            <div>
                              <p className="text-[#00C2FF] text-[clamp(1rem,1.3vw,1.5rem)] font-bold">{p.carregando}</p>
                              <p className="text-[#6FBFA5]">Carregando</p>
                            </div>
                            <div>
                              <p className="text-[#00FFB3] text-[clamp(1rem,1.3vw,1.5rem)] font-bold">{p.concluidos}</p>
                              <p className="text-[#6FBFA5]">Concluídos</p>
                            </div>
                          </div>
                          <div className="border-t border-[#1E2A33] mt-[0.5vh] pt-[0.5vh] text-sm">
                            <p>🚛 {p.veiculo1}</p>
                            <p>🚛 {p.veiculo2}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </section>

                  {/* ======== RANKING ======== */}
                  <section className="bg-[#101B17] rounded-2xl shadow-md p-[1vw] flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h2 className="text-[#00C2FF] font-semibold text-[clamp(1rem,1.4vw,1.6rem)]">Ranking Puxe Lavoura</h2>
                      <div className="text-right text-[#A8D6C4] text-[clamp(0.8rem,1vw,1rem)]">
                        <p>Fazenda: <span className="text-[#00FFB3] font-semibold">São José</span></p>
                        <p>Talhão: TH 18</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-[0.8vw] mt-[1vh] flex-1">
                      {(ranking || []).slice(0, 6).map((r, i) => (
                        <div key={i} className="p-[0.8vw] rounded-xl border border-[#1E2A33] bg-[#0E1410] flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-[0.3vh]">
                            <span className="font-medium">{i + 1}º {r.motorista}</span>
                            <span className="text-[#00FFB3] font-bold">{r.rolos} rolos</span>
                          </div>
                          <div className="h-[0.5vh] rounded-full bg-[#1A2723] w-full">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#00C2FF] to-[#00FFB3]" style={{ width: ranking[0] && ranking[0].rolos ? `${(r.rolos / ranking[0].rolos) * 100}%` : "0%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* ======== GESTÃO DE TEMPO ======== */}
                  <section className="bg-[#101B17] rounded-2xl shadow-md p-[1vw] flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center mb-[0.5vh]">
                      <h2 className="text-[#00C2FF] font-semibold text-[clamp(1rem,1.4vw,1.6rem)]">Gestão de Tempo</h2>
                      <div className="flex gap-[1vw] text-[clamp(0.8rem,1vw,1rem)]">
                        <span className="text-[#FFC300]">🏭 Algodoeira: 25 min</span>
                        <span className="text-[#FF65A3]">🌾 Lavoura: 41 min</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[0.8vw] flex-1">
                      {(gestao || []).map((g, i) => (
                        import { useEffect, useRef, useState } from "react";
                        import { supabase } from "@/lib/supabase";

                        export default function PainelGuarita(): JSX.Element {
                          const containerRef = useRef<HTMLDivElement | null>(null);
                          const [scale, setScale] = useState<number>(1);
                          const [ranking, setRanking] = useState<any[]>([]);
                          const [gestao, setGestao] = useState<any[]>([]);
                          const [produtos, setProdutos] = useState<any[]>([]);
                          const [materiais, setMateriais] = useState<any[]>([]);

                          // 🔹 Carrega dados reais
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
                                // manter silencioso no painel; log opcional
                              }
                            }
                            carregar();
                            return () => {
                              mounted = false;
                            };
                          }, []);

                          // 🔧 Auto Escala – preenche qualquer resolução (sem bordas pretas)
                          useEffect(() => {
                            const ajustarEscala = () => {
                              const baseWidth = 1920;
                              const baseHeight = 1080;
                              const scaleW = window.innerWidth / baseWidth;
                              const scaleH = window.innerHeight / baseHeight;
                              const finalScale = Math.min(scaleW, scaleH) * 1.05; // ligeiro aumento pra eliminar sobras
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
                                {/* ======= CABEÇALHO ======= */}
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

                                {/* ======= CONTEÚDO ======= */}
                                <main
                                  className="grid flex-1 gap-6 p-6"
                                  style={{
                                    gridTemplateColumns: "20% 40% 40%",
                                    alignItems: "stretch",
                                  }}
                                >
                                  {/* COLUNA ESQUERDA */}
                                  <div className="flex flex-col gap-4">
                                    {(produtos || []).map((p, i) => (
                                      <div
                                        key={i}
                                        className="flex flex-col justify-between bg-[#101B17] rounded-2xl p-4 shadow-md flex-1"
                                      >
                                        <h2
                                          className="font-semibold text-2xl mb-2"
                                          style={{
                                            color: p.nome === "PLUMA" ? "#00C2FF" : p.nome === "CAROÇO" ? "#FFC300" : "#00FFB3",
                                          }}
                                        >
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

                                  {/* RANKING CENTRAL */}
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
                                            <div
                                              className="h-2 rounded-full bg-gradient-to-r from-[#00C2FF] to-[#00FFB3]"
                                              style={{ width: ranking[0] && ranking[0].rolos ? `${(r.rolos / ranking[0].rolos) * 100}%` : "0%" }}
                                            ></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* CARD MATERIAIS */}
                                    <div className="bg-[#0E1410] mt-4 rounded-xl p-4 border border-[#1E2A33]">
                                      <h3 className="text-[#FFC300] text-xl font-semibold mb-2">Materiais e Equipamentos (Hoje)</h3>
                                      {(materiais || []).map((m, i) => (
                                        <p key={i} className="text-[#A8D6C4] text-sm">{m.tipo === "entrada" ? "📥" : "📤"} {m.descricao}</p>
                                      ))}
                                    </div>
                                  </div>

                                  {/* GESTÃO DE TEMPO */}
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
