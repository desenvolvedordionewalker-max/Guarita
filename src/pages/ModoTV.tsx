import React, { useEffect, useState } from "react";
import ProdutoCard from "@/components/modo-tv/ProdutoCard";
import logo from '@/assets/BF_logo.png';
import { Clock } from 'lucide-react';
import { useLoadingRecords, useCottonPull } from '@/hooks/use-supabase';
import { LoadingRecord } from '@/lib/supabase';
import GestaoTempo from '@/components/modo-tv/GestaoTempo';
import { Viagem } from '@/components/modo-tv/mockData';
import { getTodayLocalDate, convertIsoToLocalDateString } from '@/lib/date-utils';

const ModoTV: React.FC = () => {
  const { records: loadingRecords } = useLoadingRecords();
  const { records: cottonPullRecords } = useCottonPull();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const products = [
    { key: 'pluma', name: 'PLUMA', icon: '🪶', color: '#1E88E5' },
    { key: 'caroco', name: 'CAROÇO', icon: '🌾', color: '#43A047' },
    { key: 'fibrilha', name: 'FIBRILHA', icon: '🌀', color: '#00BCD4' },
    { key: 'briquete', name: 'BRIQUETE', icon: '🔥', color: '#FFB300' },
  ];

  const mapResources = () => {
    const map: Record<string, any> = {};
    products.forEach(p => {
      const pr = (loadingRecords as LoadingRecord[] || []).filter(r => (r.product || '').toString().toUpperCase() === p.name.toUpperCase());
      const fila = pr.filter(r => !r.entry_date).length;
      const carregando = pr.filter(r => (r.status || '').toString().toLowerCase() === 'carregando').length;
      const concluidos = pr.filter(r => !!r.exit_date).length;
      const value = `${concluidos} concluídos`;
      const vehicles = pr.filter(r => (r.status || '').toString().toLowerCase() === 'carregando').map(r => `${r.plate || ''} - ${r.driver || ''}`);

      map[p.key] = {
        title: p.name,
        color: p.color,
        icon: p.icon,
        value,
        stats: { fila, carregando, concluidos },
        vehicles,
      };
    });
    return map;
  };

  const resources = mapResources();

  // Construir itens agrupados por placa a partir de cotton pull (apenas hoje), ordenados por rolos
  const gestaoItems = (() => {
    try {
      const today = getTodayLocalDate();
      const pulledToday = (cottonPullRecords || []).filter((r: any) => {
        const rDate = r.date || r.created_at || null;
        if (!rDate) return false;
        const local = convertIsoToLocalDateString(rDate) || String(rDate).slice(0,10);
        return local === today;
      });

      const map: Record<string, { placa: string; motorista: string; viagens: Viagem[]; rolos: number }> = {};
      pulledToday.forEach((r: any) => {
        const plate = r.plate || 'N/A';
        if (!map[plate]) map[plate] = { placa: plate, motorista: r.driver || r.carrier || '', viagens: [], rolos: 0 };
        map[plate].viagens.push({
          title: `${plate} - ${map[plate].viagens.length + 1}ª Viagem`,
          lavoura: r.talhao || r.field || '',
          algodoeira: r.farm || r.producer || '',
          total: `${r.rolls || 0} rolos`,
          status: 'normal',
          when: r.date || r.created_at || new Date().toISOString(),
        });
        map[plate].rolos += Number(r.rolls || 0);
      });

      const items = Object.values(map).sort((a, b) => b.rolos - a.rolos).map(({placa, motorista, viagens, rolos}) => ({ placa, motorista, viagens, rolos }));
      console.log('Gestao items (ordenados):', items.map(i => ({ placa: i.placa, rolos: i.rolos })));
      return items;
    } catch (e) {
      return [];
    }
  })();

  return (
    <div className="tv-modern-root tv-container-full tv-full tv-no-scroll">
      <div className="px-8 py-6 flex items-center justify-between glass-card card-shadow mx-6">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
          <div>
            <div className="text-sm text-gray-300">Unidade</div>
            <div className="title-neon text-2xl">Central</div>
          </div>
        </div>

        <div className="text-right text-gray-200">
          <div className="text-sm">Data e hora</div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00ffbf]" />
            <div className="font-medium">{now.toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid-tv">
          {products.map((p) => {
            const r = resources[p.key];
            return (
              <ProdutoCard
                key={p.key}
                title={r.title}
                color={r.color}
                icon={r.icon}
                value={r.value}
                stats={r.stats}
                vehicles={r.vehicles}
              />
            );
          })}
        </div>

        {/* Gestão de Tempo - modo TV (ordenado por quem puxou mais) */}
        <div className="mt-6">
          <GestaoTempo items={gestaoItems} />
        </div>
      </div>
    </div>
  );
};

export default ModoTV;
