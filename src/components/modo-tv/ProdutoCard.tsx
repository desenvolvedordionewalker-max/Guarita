import React from "react";
import { Resource } from "./mockData";

const Indicator: React.FC<{
  label: string;
  value: number | string;
  colorClass: string;
}> = ({ label, value, colorClass }) => (
  <div
    className={`mini-indicator flex items-center justify-between gap-3 ${colorClass}`}
  >
    <div className="text-xs text-gray-300">{label}</div>
    <div className="font-semibold text-sm">{value}</div>
  </div>
);

const ProdutoCard: React.FC<Resource> = ({
  title,
  color,
  icon,
  value,
  stats,
  vehicles,
}) => {
  return (
    <div className="glass-card card-shadow card-allow-grow p-6 flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="title-neon text-2xl">{title}</div>
            <div className="text-sm text-gray-300 mt-1">{value}</div>
          </div>
          <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-white/5">
            <div className="text-3xl">{icon}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Indicator label="FILA" value={stats?.fila ?? 0} colorClass="" />
          <Indicator
            label="CARREGANDO"
            value={stats?.carregando ?? 0}
            colorClass=""
          />
          <Indicator
            label="CONCLUÍDOS"
            value={stats?.concluidos ?? 0}
            colorClass=""
          />
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">Carregando agora</div>
          <div className="flex flex-col gap-2">
            {vehicles && vehicles.length > 0 ? (
              vehicles.map((v, i) => (
                <div
                  key={i}
                  className="mini-indicator flex items-center justify-between"
                >
                  <div className="text-sm truncate">{v}</div>
                  <div className="text-xs text-gray-300">{i + 1}</div>
                </div>
              ))
            ) : (
              <div className="mini-indicator text-gray-400">
                Nenhum veículo carregando
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span className="text-xs">Bom Futuro</span>
        </div>
        <div className="text-xs">Atualizado agora</div>
      </div>
    </div>
  );
};

export default ProdutoCard;
