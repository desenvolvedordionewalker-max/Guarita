import React from "react";

type Driver = {
  pos: number;
  name: string;
  placa: string;
  rolos: number;
  viagens: number;
  status: string;
};

const RankingPuxe: React.FC<{
  hoje: number;
  mes: number;
  drivers: Driver[];
}> = ({ hoje, mes, drivers }) => {
  return (
    <div className="bg-card/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl bg-gradient-to-r from-[#26C6DA] to-[#4DD0E1] bg-clip-text text-transparent">
            🏆
          </div>
          <div>
            <div className="font-semibold text-lg">Ranking Puxe Lavoura</div>
            <div className="text-sm text-muted-foreground">Atualizado</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm">Hoje</div>
          <div className="font-bold text-xl">{hoje}</div>
          <div className="text-sm mt-1">Mês {mes}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 overflow-auto">
        {drivers.map((d) => (
          <div
            key={d.pos}
            className="bg-[#222836]/80 rounded-xl p-3 flex justify-between items-center text-sm shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="text-lg">
                {d.pos === 1
                  ? "🥇"
                  : d.pos === 2
                  ? "🥈"
                  : d.pos === 3
                  ? "🥉"
                  : d.pos}
              </div>
              <div>
                <div className="font-semibold">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.placa} • {d.viagens} viagens
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{d.rolos} rolos</div>
              <div
                className={`text-xs ${
                  d.status === "lenta"
                    ? "text-amber-400"
                    : d.status === "atrasada"
                    ? "text-red-400"
                    : "text-green-300"
                }`}
              >
                {d.status === "lenta"
                  ? "⚠️ Descarga Lenta"
                  : d.status === "atrasada"
                  ? "⛔ Descarga Atrasada"
                  : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingPuxe;
