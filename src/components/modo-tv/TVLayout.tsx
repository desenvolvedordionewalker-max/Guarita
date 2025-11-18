import React, { useEffect, useState } from "react";
import ProdutoCard from "./ProdutoCard";
import { initialResources, initialRanking, Resource } from "./mockData";
import { Clock } from "lucide-react";

const TVLayout: React.FC = () => {
  const [resources] = useState<Record<string, Resource>>(initialResources);
  const [ranking] = useState(initialRanking);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
        {Object.values(resources).map((r: Resource, idx) => (
          <ProdutoCard key={idx} {...r} />
        ))}

        <div className="glass-card card-shadow p-6 flex flex-col">
          <div className="title-neon text-xl">Ranking Mensal</div>
          <div className="text-sm text-gray-300 mt-2">
            {ranking.mes.toLocaleString("pt-BR")} rolos
          </div>
          <div className="mt-4 flex-1 overflow-hidden">
            <div className="flex flex-col gap-3">
              {ranking.drivers.map((d, i) => (
                <div
                  key={i}
                  className="mini-indicator flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-gray-400">{d.placa}</div>
                  </div>
                  <div className="font-bold text-cyan-300">{d.rolos} rolos</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVLayout;
