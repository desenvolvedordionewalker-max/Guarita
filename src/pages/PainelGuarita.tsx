import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useGestaoTempoCargas } from "@/hooks/use-supabase";
import { getTodayLocalDate } from "@/lib/date-utils";

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
        const normalizePlate = (s?: string) => (s || '').toString().trim().replace(/\s+/g, '').toUpperCase()
        const hoje = getTodayLocalDate();
        // compute tomorrow for inclusive range filtering to avoid UTC shift
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const amanha = `${yyyy}-${mm}-${dd}`;

        const { data: rank } = await supabase
          .from("ranking_puxe_lavoura")
          .select("*")
          .gte('data', `${hoje}T00:00:00`)
          .lt('data', `${amanha}T00:00:00`)
          .order("rolos", { ascending: false });

        const { data: gest } = await supabase
          .from("gestao_tempo")
          .select("*")
          .order("placa", { ascending: true });

        const { data: prod } = await supabase
          .from("carregamento_produtos")
          .select("*")
          .gte('data', `${hoje}T00:00:00`)
          .lt('data', `${amanha}T00:00:00`);

        const { data: mat } = await supabase
          .from("movimentacoes_guarita")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        if (!mounted) return;
        setRanking(rank || []);

        // Normalize and merge gestao entries so truncated plates (e.g. "QCD4") merge into full plates (e.g. "QCD4F95") when possible.
        const raw = (gest || []).map((g: any) => ({
          ...g,
          placa: normalizePlate(g.placa),
          motorista: g.motorista || '',
          viagens: Number(g.viagens) || 0,
          rolos: Number(g.rolos) || 0,
          total: g.total || 0,
          tempo_algodoeira: g.tempo_algodoeira || g.tempo_algodoeira_min || null,
          tempo_lavoura: g.tempo_lavoura || g.tempo_lavoura_min || null
        }));

        const mapa = new Map<string, any>();
        for (const item of raw) {
          const key = item.placa || '';
          if (!mapa.has(key)) mapa.set(key, { ...item });
          else {
            const ex = mapa.get(key);
            ex.viagens = (ex.viagens || 0) + (item.viagens || 0);
            ex.rolos = (ex.rolos || 0) + (item.rolos || 0);
            ex.total = (ex.total || 0) + (item.total || 0);
            // average tempos when present
            if (item.tempo_algodoeira) ex.tempo_algodoeira = Math.round(((ex.tempo_algodoeira || 0) + item.tempo_algodoeira) / 2);
            if (item.tempo_lavoura) ex.tempo_lavoura = Math.round(((ex.tempo_lavoura || 0) + item.tempo_lavoura) / 2);
            mapa.set(key, ex);
          }
        }

        // Merge short keys (length 4) into longer keys that start with same prefix
        for (const key of Array.from(mapa.keys())) {
          if (key.length === 4) {
            const longer = Array.from(mapa.keys()).find(k => k.length > 4 && k.startsWith(key));
            if (longer) {
              const shortItem = mapa.get(key);
              const longItem = mapa.get(longer);
              longItem.viagens = (longItem.viagens || 0) + (shortItem.viagens || 0);
              longItem.rolos = (longItem.rolos || 0) + (shortItem.rolos || 0);
              longItem.total = (longItem.total || 0) + (shortItem.total || 0);
              if (shortItem.tempo_algodoeira) longItem.tempo_algodoeira = Math.round(((longItem.tempo_algodoeira || 0) + shortItem.tempo_algodoeira) / 2);
              if (shortItem.tempo_lavoura) longItem.tempo_lavoura = Math.round(((longItem.tempo_lavoura || 0) + shortItem.tempo_lavoura) / 2);
              mapa.delete(key);
            }
          }
        }

        setGestao(Array.from(mapa.values()));
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

  // Use gestao cargas hook to show header averages
  const { cargas, loading: gestaoLoading } = useGestaoTempoCargas();

  const medias = useMemo(() => {
    const rows = cargas || [];
    if (!rows || rows.length === 0) return { algodoeira: null, lavoura: null };
    const sumAlg = rows.reduce((s: number, r: any) => s + (Number(r.tempo_algodoeira) || Number(r.tempo_algodoeira_min) || 0), 0);
    const sumLav = rows.reduce((s: number, r: any) => s + (Number(r.tempo_lavoura) || Number(r.tempo_lavoura_min) || 0), 0);
    const cnt = rows.length;
    const avgAlg = cnt > 0 ? Math.round(sumAlg / cnt) : null;
    const avgLav = cnt > 0 ? Math.round(sumLav / cnt) : null;
    return { algodoeira: avgAlg, lavoura: avgLav };
  }, [cargas]);

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
                <span className="text-[#FFC300]">🏭 Algodoeira: {gestaoLoading ? '...' : (medias.algodoeira != null ? `${medias.algodoeira} min` : '—')}</span>
                <span className="text-[#FF65A3]">🌾 Lavoura: {gestaoLoading ? '...' : (medias.lavoura != null ? `${medias.lavoura} min` : '—')}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {(!cargas || cargas.length === 0) ? (
                <div className="col-span-2 flex items-center justify-center text-[#A8D6C4] text-xl font-semibold">Nenhuma Viagem Hoje</div>
              ) : (
                (cargas || []).map((g: any, i: number) => (
                  <div key={i} className="bg-[#0E1410] border border-[#1E2A33] p-3 rounded-xl">
                    <h3 className="font-semibold text-[#00C2FF] text-lg">🚛 {g.placa || g.plate || '—'} — {g.motorista || g.driver || '—'}</h3>
                    <p className="text-[#A8D6C4] text-sm">{g.viagens || g.count || 0} viagens • {g.rolos || g.rolls || '—'} rolos</p>
                    {/* Viagens incrementais: mostrar badges 1..N conforme o número de viagens */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from({ length: Math.min(Number(g.viagens || g.count || 0), 10) }).map((_, idx) => (
                        <span key={idx} className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-[#0B2A21] text-[#00FFB3] text-sm font-semibold">{idx + 1}</span>
                      ))}
                    </div>
                    <div className="mt-2">
                      <p className="text-[#A8D6C4] text-sm">⌛ Algodoeira: <span className="text-[#00FFB3] font-bold">{g.tempo_algodoeira != null ? `${g.tempo_algodoeira} min` : (g.tempo_algodoeira_min != null ? `${g.tempo_algodoeira_min} min` : '—')}</span></p>
                      <p className="text-[#A8D6C4] text-sm">🌾 Lavoura: <span className="text-[#FF65A3] font-bold">{g.tempo_lavoura != null ? `${g.tempo_lavoura} min` : (g.tempo_lavoura_min != null ? `${g.tempo_lavoura_min} min` : '—')}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

