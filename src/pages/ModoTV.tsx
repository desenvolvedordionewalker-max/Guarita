import React, { useEffect, useState } from "react";
import ProdutoCard from "@/components/modo-tv/ProdutoCard";
import logo from '@/assets/BF_logo.png';
import { Clock } from 'lucide-react';
import { useLoadingRecords } from '@/hooks/use-supabase';
import { LoadingRecord } from '@/lib/supabase';

const ModoTV: React.FC = () => {
  const { records: loadingRecords } = useLoadingRecords();
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
      </div>
    </div>
  );
};

export default ModoTV;
