import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import ProdutoCard from '@/components/modo-tv/ProdutoCard';
import { useLoadingRecords, useCottonPull, useMaterialReceipts, useEquipment, useGestaoTempoCargas } from '@/hooks/use-supabase';
import { getTodayLocalDate, convertIsoToLocalDateString } from '@/lib/date-utils';

// TVLayout - Ultra Modern TV Mode
export default function TVLayout(): JSX.Element {
  const { records: loadingRecords, loading: loadingLoadings, refetch: refetchLoadings } = useLoadingRecords();
  const { records: cottonPullRecords, loading: loadingCotton, refetch: refetchCotton } = useCottonPull();
  const { records: materialRecords, loading: loadingMaterials, refetch: refetchMaterials } = useMaterialReceipts();
  const { records: equipmentRecords, loading: loadingEquipment, refetch: refetchEquipment } = useEquipment();
  const { cargas, loading: loadingCargas, refetch: refetchCargas } = useGestaoTempoCargas();

  const [now, setNow] = useState<Date>(new Date());

  // Auto refresh every 60s (visual + refetch hooks)
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      refetchLoadings?.();
      refetchCotton?.();
      refetchMaterials?.();
      refetchEquipment?.();
      refetchCargas?.();
    }, 60000);
    return () => clearInterval(id);
  }, [refetchLoadings, refetchCotton, refetchMaterials, refetchEquipment, refetchCargas]);

  const todayStr = getTodayLocalDate();

  // PRODUCTS LEFT COLUMN
  const products = useMemo(() => [
    { key: 'PLUMA', name: 'PLUMA', icon: '🪶', color: '#00f6ff' },
    { key: 'CAROÇO', name: 'CAROÇO', icon: '🌾', color: '#a770ff' },
    { key: 'FIBRILHA', name: 'FIBRILHA', icon: '🌀', color: '#8ab4ff' },
    { key: 'BRIQUETE', name: 'BRIQUETE', icon: '🔥', color: '#ff9f8a' }
  ], []);

  const resources = useMemo(() => {
    const map: Record<string, any> = {};
    products.forEach(p => {
      const list = (loadingRecords || []).filter((r: any) => (r.product || '').toString().toUpperCase() === p.name.toUpperCase());
      const fila = list.filter((r: any) => !r.entry_date).length;
      const carregando = list.filter((r: any) => (r.status || '').toString().toLowerCase() === 'carregando').length;
      const concluidos = list.filter((r: any) => !!r.exit_date).length;
      const vehicles = list.filter((r: any) => (r.status || '').toString().toLowerCase() === 'carregando').map((r: any) => `${r.plate || ''} - ${r.driver || ''}`);
      const total = list.reduce((s: number, x: any) => s + (x.qtd_rolos || 0), 0) || list.length;
      map[p.key] = { title: p.name, icon: p.icon, color: p.color, stats: { fila, carregando, concluidos }, vehicles, total };
    });
    return map;
  }, [loadingRecords, products]);

  // RANKING CENTER: aggregate cotton pulls today per driver/plate
  const ranking = useMemo(() => {
    const pulledToday = (cottonPullRecords || []).filter((r: any) => {
      const rDate = r.date || r.created_at || null;
      if (!rDate) return false;
      const local = convertIsoToLocalDateString(rDate) || String(rDate).slice(0,10);
      return local === todayStr;
    });

    const map: Record<string, any> = {};
    pulledToday.forEach((r: any) => {
      const key = (r.driver || r.carrier || r.plate || 'N/A').toString();
      if (!map[key]) map[key] = { name: key, driver: r.driver || r.carrier || '-', plate: r.plate || '-', rolos: 0, viagens: 0 };
      map[key].rolos += Number(r.rolls || 0);
      map[key].viagens += 1;
    });
    return Object.values(map).sort((a: any,b: any) => b.rolos - a.rolos);
  }, [cottonPullRecords, todayStr]);

  // Materials / Equipment center-lower card
  const materialsSummary = useMemo(() => {
    const mats = (materialRecords || []).filter((m: any) => (m.date || m.created_at) && ((m.date || m.created_at).toString().startsWith(todayStr) || convertIsoToLocalDateString(m.date || m.created_at) === todayStr));
    const equipments = (equipmentRecords || []).filter((e: any) => (e.date || e.created_at) && (convertIsoToLocalDateString(e.date || e.created_at) === todayStr));
    const totalWeight = mats.reduce((s: number, m: any) => s + (m.net_weight || 0), 0);
    return { matsCount: mats.length, totalWeight, equipmentsCount: equipments.length, equipments };
  }, [materialRecords, equipmentRecords, todayStr]);

  // Gestão de Tempo right column: group cargasHoje by plate
  const gestao = useMemo(() => {
    const cargasHoje = (cargas || []).filter((c: any) => convertIsoToLocalDateString(c.hora_entrada) === todayStr);
    const byPlate: Record<string, any> = {};
    cargasHoje.forEach((c: any) => {
      if (!byPlate[c.placa]) byPlate[c.placa] = { placa: c.placa, motorista: c.motorista || '-', viagens: [], rolos: 0 };
      byPlate[c.placa].viagens.push(c);
      byPlate[c.placa].rolos += Number(c.qtd_rolos || 0);
    });
    return Object.values(byPlate).sort((a: any,b: any) => b.rolos - a.rolos);
  }, [cargas, todayStr]);

  // Small subcomponents
  const ProductListColumn = () => (
    <div className="flex flex-col gap-4">
      {products.map(p => {
        const r = resources[p.key];
        return (
          <div key={p.key} className="glass-card card-shadow transition-all hover:scale-[1.02] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="title-neon text-2xl">{p.icon} {p.name}</div>
                <div className="text-sm text-gray-300 mt-1">Total: <span className="font-bold">{r?.total ?? '-'}</span></div>
              </div>
              <div className="text-5xl">{p.icon}</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="mini-glass p-3 text-center">
                <div className="text-xs neon-label">FILA</div>
                <div className="font-bold text-lg">{r?.stats?.fila ?? 0}</div>
              </div>
              <div className="mini-glass p-3 text-center">
                <div className="text-xs neon-label">CARREGANDO</div>
                <div className="font-bold text-lg">{r?.stats?.carregando ?? 0}</div>
              </div>
              <div className="mini-glass p-3 text-center">
                <div className="text-xs neon-label">CONCLUÍDOS</div>
                <div className="font-bold text-lg">{r?.stats?.concluidos ?? 0}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">Veículos carregando</div>
              <div className="flex flex-col gap-2">
                {(r?.vehicles || []).slice(0,5).map((v: string, i: number) => (
                  <div key={i} className="mini-indicator">{v}</div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const RankingCard = () => (
    <div className="glass-card card-shadow p-4 transition-all hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="title-neon text-2xl">🏆 Ranking Puxe</div>
          <div className="text-sm text-gray-300">Hoje • Atualizado: {now.toLocaleTimeString()}</div>
        </div>
        <div className="text-sm text-gray-400">Total {ranking.length}</div>
      </div>

      <div className="space-y-2">
        {ranking.slice(0,8).map((r: any, i: number) => (
          <div key={r.name} className={`flex items-center justify-between p-2 mini-glass ${i===0? 'border-yellow-400' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 text-center text-2xl">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}º`}</div>
              <div>
                <div className="font-bold text-lg">{r.driver || r.name}</div>
                <div className="text-sm text-gray-400">{r.plate || ''}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xl">{r.rolos}</div>
              <div className="text-sm text-gray-400">{r.viagens} viagens</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const MaterialsCard = () => (
    <div className="glass-card card-shadow p-4 transition-all hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <div className="title-neon text-xl">📦 Materiais Recebidos</div>
        <div className="text-sm text-gray-400">Hoje</div>
      </div>
      <div className="text-2xl font-bold mb-2">{materialsSummary.matsCount} • {materialsSummary.totalWeight.toLocaleString('pt-BR')} kg</div>
      <div className="flex items-start gap-4">
        <div className="mini-glass p-3">
          <div className="text-sm neon-label">Equip. Saíram</div>
          <div className="font-bold text-lg">{materialsSummary.equipmentsCount}</div>
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-300 mb-2">Destinos</div>
          <div className="flex flex-col gap-1 text-sm text-gray-300">
            {(materialsSummary.equipments || []).slice(0,5).map((e: any, i: number) => (
              <div key={i} className="mini-indicator">{e.name} → {e.destination}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const GestaoTempoLarge = () => (
    <div className="glass-card card-shadow h-full p-4 transition-all hover:scale-[1.02] flex flex-col">
      <div className="title-neon text-2xl mb-3">⏱ Gestão de Tempo</div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {gestao.length === 0 && <div className="text-gray-400">Nenhuma carga hoje</div>}
        {gestao.map((g: any, gi: number) => (
          <div key={g.placa} className="mini-glass p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-bold">{g.placa} — {g.motorista}</div>
                <div className="text-sm text-gray-400">Total Rolos: <span className="font-semibold">{g.rolos}</span> — {g.viagens.length} viagens</div>
              </div>
              <div className="text-sm neon-label">{gi+1}º</div>
            </div>

            <div className="space-y-1">
              {g.viagens.map((v: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="text-lavoura text-cyan-400">{idx+1}º 🌱 {v.tempo_lavoura? `${Math.floor(v.tempo_lavoura/60)}:${String(v.tempo_lavoura%60).padStart(2,'0')}h` : '-'}</div>
                  <div className="text-algodoeira text-purple-300">🏭 {v.tempo_algodoeira? `${Math.floor(v.tempo_algodoeira/60)}:${String(v.tempo_algodoeira%60).padStart(2,'0')}h` : '-'}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="tv-modern-root tv-container-full tv-no-scroll p-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <div className="text-sm text-gray-300">IBA Santa Luzia</div>
          <div className="title-neon text-3xl font-bold">Modo TV - Painel</div>
        </div>
        <div className="text-right text-gray-300">
          <div className="text-sm">{now.toLocaleDateString()}</div>
          <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-[#00f6ff]" /> <div className="font-medium">{now.toLocaleTimeString()}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-[300px_1fr_420px] gap-6 w-full h-[calc(100vh-120px)]">
        <div className="flex flex-col gap-4">
          <ProductListColumn />
        </div>

        <div className="flex flex-col gap-4">
          <RankingCard />
          <MaterialsCard />
        </div>

        <div className="h-full">
          <GestaoTempoLarge />
        </div>
      </div>

      {/* mobile fallback: single column */}
      <style>{`@media (max-width: 1024px) { .grid-cols-[300px_1fr_420px] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
