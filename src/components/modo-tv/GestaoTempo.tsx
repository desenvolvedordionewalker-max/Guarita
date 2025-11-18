import React from "react";
import { Factory, Leaf, Clock } from "lucide-react";
import { Viagem } from "./mockData";
import { convertIsoToLocalDateString, getTodayLocalDate } from '@/lib/date-utils'

const ViagemCard: React.FC<{ v: Viagem }> = ({ v }) => {
  const borderColor =
    v.status === "normal"
      ? "border-green-500"
      : v.status === "lenta"
      ? "border-amber-400"
      : "border-red-500";

  const statusLabel =
    v.status === "normal"
      ? "✅ Normal"
      : v.status === "lenta"
      ? "⚠️ Descarga Lenta"
      : "⛔ Descarga Atrasada";

  const statusColor =
    v.status === "normal"
      ? "text-green-400"
      : v.status === "lenta"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div
      className={`bg-[#1e2532]/90 backdrop-blur-md rounded-xl p-3 shadow-md border-l-4 ${borderColor}
      transition-all duration-300 hover:scale-[1.02] hover:bg-[#283041]/90`}
    >
      <div className="font-semibold text-sm mb-1 text-white truncate">
        {v.title}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-300 mb-2 flex-wrap">
        <div className="flex items-center gap-1 text-pink-400">
          <Leaf className="w-3 h-3" />
          <span className="truncate max-w-[70px]">{v.lavoura}</span>
        </div>
        <div className="flex items-center gap-1 text-orange-400">
          <Factory className="w-3 h-3" />
          <span className="truncate max-w-[70px]">{v.algodoeira}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Total:</span>
        <span className="font-semibold text-cyan-300">{v.total}</span>
      </div>

      <div className={`text-xs mt-1 text-right font-medium ${statusColor}`}>
        {statusLabel}
      </div>
    </div>
  );
};

const isSameDay = (iso?: string) => {
  if (!iso) return false;
  const local = convertIsoToLocalDateString(iso);
  if (!local) return false;
  return local === getTodayLocalDate();
};

type GestaoItem = {
  placa: string;
  motorista: string;
  viagens: Viagem[];
  rolos?: number;
};

const GestaoTempo: React.FC<{
  items: GestaoItem[];
  onlyToday?: boolean;
}> = ({ items, onlyToday = true }) => {
  return (
    <div
      className="bg-[#1b222e]/90 backdrop-blur-md rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.35)]
      border border-white/10 text-white w-full h-full flex flex-col overflow-hidden"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Clock className="text-pink-400 w-6 h-6" />
          <div>
            <div className="font-semibold text-xl text-white">
              Gestão de Tempo
            </div>
            <div className="text-sm text-gray-400">
              Monitoramento por motorista
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Factory className="w-4 h-4 text-orange-400" /> Algodoeira
          </div>
          <div className="flex items-center gap-1">
            <Leaf className="w-4 h-4 text-pink-400" /> Lavoura
          </div>
        </div>
      </div>

      {/* Grid Automático */}
      <div
        className="grid flex-1 gap-5 overflow-hidden"
        style={{
          display: "grid",
          // For TV mode we want a clear top-to-bottom order: use single column
          gridTemplateColumns: `1fr`,
          alignContent: "start",
        }}
      >
        {items
          .slice()
          .sort((a, b) => (b.rolos || 0) - (a.rolos || 0))
          .map((it, index) => {
            const viagensToShow = onlyToday ? it.viagens.filter((v) => isSameDay(v.when)) : it.viagens;
            if (viagensToShow.length === 0) return null;
            return (
              <div
                key={it.placa}
                className="bg-[#0f1724]/60 p-4 rounded-2xl border border-white/10
              shadow-inner flex flex-col justify-between transition-all hover:bg-[#182030]/80 relative"
              >
                {/* Rank badge */}
                <div className="absolute -top-3 -left-3 bg-emerald-500 text-black font-bold px-3 py-1 rounded-br-lg shadow-md">{index + 1}º</div>
              {/* Cabeçalho do motorista */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-lg text-cyan-300">{it.placa}</div>
                  <div className="text-sm text-gray-400">{it.motorista}</div>
                </div>
                <div className="text-xs text-gray-500 italic">{viagensToShow.length} viagem{viagensToShow.length > 1 ? "s" : ""} • {it.rolos || 0} rolos</div>
              </div>

              {/* Lista de viagens */}
              <div className="flex flex-col gap-2 overflow-hidden">
                {viagensToShow.map((v, idx) => (
                  <ViagemCard key={idx} v={v} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GestaoTempo;
