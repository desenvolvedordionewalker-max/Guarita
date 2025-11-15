import React, { useEffect, useState } from "react";
import ResourceCard from "./ResourceCard";
import RankingPuxe from "./RankingPuxe";
import GestaoTempo from "./GestaoTempo";
import {
  initialResources,
  initialRanking,
  initialGestao,
  ResourceKey,
  Resource,
  Ranking,
  Driver,
  GestaoItem,
} from "./mockData";

const TVLayout: React.FC = () => {
  const [resources, setResources] = useState<Record<ResourceKey, Resource>>(initialResources);
  const [ranking, setRanking] = useState<Ranking>(initialRanking);
  const [gestao, setGestao] = useState<GestaoItem[]>(initialGestao);

  useEffect(() => {
    const id = setInterval(() => {
      setResources((prev) => {
        const next: Record<ResourceKey, Resource> = { ...prev };
        (Object.keys(next) as ResourceKey[]).forEach((key) => {
          const delta = Math.round((Math.random() - 0.4) * 5);
          if (next[key].stats) next[key].stats.concluidos = Math.max(0, next[key].stats.concluidos + delta);
        });
        return next;
      });

      setRanking((r) => ({ ...r, hoje: r.hoje + Math.round(Math.random() * 2) }));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="tv-mode w-screen h-screen overflow-hidden text-white" style={{ background: "linear-gradient(180deg,#0e1116 0%,#1a1f27 100%)" }}>
      <div className="w-full h-full px-6 py-4 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1" style={{ gridTemplateRows: "1fr" }}>
          {/* Coluna 1: Recursos */}
          <div className="flex flex-col gap-6 justify-between">
            <ResourceCard {...resources.pluma} />
            <ResourceCard {...resources.caroco} />
            <ResourceCard {...resources.fibrilha} />
            <ResourceCard {...resources.briquete} />
          </div>

          {/* Coluna 2: Ranking */}
          <div className="flex flex-col gap-6 justify-between">
            <div className="flex-1 min-h-[45%]">
              <RankingPuxe hoje={ranking.hoje} mes={ranking.mes} drivers={ranking.drivers} />
            </div>

            <div className="flex-1 min-h-[45%] bg-[#1b222e]/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.35)] border border-white/5 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl bg-gradient-to-r from-[#26C6DA] to-[#4DD0E1] bg-clip-text text-transparent">🏆</div>
                  <div>
                    <div className="font-semibold text-lg">Ranking Mensal</div>
                    <div className="text-sm text-muted-foreground">Acumulado do mês</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-cyan-300">{ranking.mes.toLocaleString("pt-BR")} rolos</div>
                </div>
              </div>

              {/* Lista de motoristas */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 custom-scroll">
                  {ranking.drivers.map((d: Driver) => (
                    <div key={d.pos} className="bg-[#222836]/80 rounded-xl p-3 flex justify-between items-center text-sm shadow-md mb-2 transition-all hover:bg-[#2a3242]/80">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{d.pos === 1 ? "🥇" : d.pos === 2 ? "🥈" : d.pos === 3 ? "🥉" : d.pos}</div>
                        <div>
                          <div className="font-semibold text-white">{d.name}</div>
                          <div className="text-xs text-gray-400">{d.placa}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-cyan-300">{d.rolos} rolos</div>
                        <div className={`text-xs ${d.status === "lenta" ? "text-amber-400" : d.status === "atrasada" ? "text-red-400" : "text-green-400"}`}>
                          {d.status === "lenta" ? "⚠️ Descarga Lenta" : d.status === "atrasada" ? "⛔ Descarga Atrasada" : "✅ Normal"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 3: Gestão de Tempo */}
          <div className="flex flex-col h-full">
            <GestaoTempo items={gestao} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVLayout;
