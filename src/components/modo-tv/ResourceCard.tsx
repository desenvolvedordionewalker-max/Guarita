import React from "react";

type Props = {
  icon: string;
  title: string;
  color: string;
  value: string;
  stats: { fila: number; carregando: number; concluidos: number };
  vehicles: string[];
};

const ResourceCard: React.FC<Props> = ({
  icon,
  title,
  color,
  value,
  stats,
  vehicles,
}) => {
  return (
    <div className="bg-card/80 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-4xl" style={{ color }}>
            {icon}
          </div>
          <div>
            <div
              className="card-title font-semibold tracking-tight"
              style={{ color }}
            >
              {title}
            </div>
            <div className="text-sm text-muted-foreground">Material</div>
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-400" />{" "}
          <small>Fila {stats.fila}</small>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />{" "}
          <small>Carregando {stats.carregando}</small>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />{" "}
          <small>Concluídos {stats.concluidos}</small>
        </div>
      </div>

      <div className="mt-2">
        <div className="text-sm font-semibold mb-1">Veículos</div>
        <ul className="text-sm list-disc list-inside">
          {vehicles.map((v, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-xl">🚛</span>
              <span className="truncate">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResourceCard;
