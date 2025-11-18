import React, { useEffect, useState } from "react";
import ProdutoCard from "./ProdutoCard";
import { Clock } from "lucide-react";
import { useLoadingRecords, useGestaoTempoCargas } from "@/hooks/use-supabase";
import { LoadingRecord } from "@/lib/supabase";
import type { GestaoTempoCarga } from "@/hooks/use-supabase";

type ResourceLocal = {
  title: string;
  color?: string;
  icon?: string;
  value?: string;
  stats?: { fila: number; carregando: number; concluidos: number };
  vehicles?: string[];
};

const TVLayout: React.FC = () => {
  const { records: loadingRecords } = useLoadingRecords();
  const { cargas: ranking, loading: loadingRanking } = useGestaoTempoCargas();
  const [resources, setResources] = useState<Record<string, ResourceLocal>>({});
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Agrupar estatísticas básicas por produto a partir dos loadingRecords
    const products = [
      { key: "pluma", name: "Pluma", icon: "🪶", color: "#1E88E5" },
      { key: "caroco", name: "Caroço", icon: "🌾", color: "#43A047" },
      { key: "fibrilha", name: "Fibrilha", icon: "🌀", color: "#00BCD4" },
      { key: "briquete", name: "Briquete", icon: "🔥", color: "#FFB300" },
    ];

    const map: Record<string, ResourceLocal> = {};

    products.forEach((p) => {
      const pr = (loadingRecords as LoadingRecord[]).filter((r) => (r.product || "").toLowerCase() === p.name.toLowerCase());
      const fila = pr.filter((r) => !r.entry_date).length;
      const carregando = pr.filter((r) => (r.status || "").toLowerCase() === "carregando").length;
      const concluidos = pr.filter((r) => !!r.exit_date).length;
      const value = `${concluidos} concluídos`;
      const vehicles = pr.filter((r) => (r.status || "").toLowerCase() === "carregando").map((r) => `${r.plate || ""} - ${r.driver || ""}`);

      map[p.key] = {
        title: p.name.toUpperCase(),
        color: p.color,
        icon: p.icon,
        value,
        stats: { fila, carregando, concluidos },
        vehicles,
      };
    });

    setResources(map);
  }, [loadingRecords]);

  return (
    <div className="tv-modern-root tv-container-full">
      <div className="glass-card p-6 mb-6 flex items-center justify-between card-shadow">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#00ffbf]/30 to-[#00a0ff]/10 flex items-center justify-center text-xl">
            🌱
          </div>
          <div>
            <div className="text-sm text-gray-300">Logo Bom Futuro</div>
            <div className="title-neon text-2xl">Unidade: Central</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">Data e hora</div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00ffbf]" />
            <div className="font-medium">{now.toLocaleString("pt-BR")}</div>
          </div>
        </div>
      </div>

      <div className="grid-tv">
        {Object.keys(resources).length === 0 ? (
          <div className="glass-card card-shadow p-6">Sem dados para exibir</div>
        ) : (
          Object.values(resources).map((r: ResourceLocal, idx) => (
            <ProdutoCard key={idx} {...r} />
          ))
        )}

        <div className="glass-card card-shadow p-6 flex flex-col">
          <div className="title-neon text-xl">Ranking Mensal</div>
          <div className="text-sm text-gray-300 mt-2">
            {loadingRanking ? "..." : `${ranking?.length || 0} registros`}
          </div>
          <div className="mt-4 flex-1 overflow-hidden">
            <div className="flex flex-col gap-3">
              {(!loadingRanking && ranking && ranking.length > 0) ? (
                (ranking as GestaoTempoCarga[]).slice(0, 5).map((d, i) => (
                  <div key={i} className="mini-indicator flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{d.motorista || d.placa || "—"}</div>
                      <div className="text-xs text-gray-400">{d.placa || ""}</div>
                    </div>
                    <div className="font-bold text-cyan-300">{d.qtd_rolos || 0} rolos</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">Ranking indisponível</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVLayout;
