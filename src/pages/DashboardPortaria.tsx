import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CloudRain, Truck, PackageCheck, Clock } from "lucide-react";
import { useVehicles, useCottonPull, useRainRecords, useLoadingRecords } from "@/hooks/use-supabase";
import logo from "@/assets/BF_logo.png";

export default function DashboardPortariaTV() {
  const { vehicles, loading: loadingVehicles } = useVehicles();
  const { records: cottonRecords, loading: loadingCotton } = useCottonPull();
  const { records: rainRecords, loading: loadingRain } = useRainRecords();
  const { records: loadingRecords, loading: loadingLoadings } = useLoadingRecords();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // atualiza a cada 1 minuto
    return () => clearInterval(timer);
  }, []);

  const loading = loadingVehicles || loadingCotton || loadingRain || loadingLoadings;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 text-xl">
        <Loader2 className="animate-spin mr-3" /> Carregando informações...
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const thisWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const thisYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

  // Primeiro filtramos os carregamentos do dia
  const todayLoadings = loadingRecords.filter(l => l.date === today);
  const fila = todayLoadings.filter(l => !l.entry_date);
  const carregando = todayLoadings.filter(l => l.entry_date && !l.exit_date);
  const concluidos = todayLoadings.filter(l => l.exit_date);

  // Estatísticas de carregamento por produto
  const produtosFixos = ["PLUMA", "CAROÇO", "FIBRILHA", "BRIQUETE"];
  const produtosOpcionais = ["RECICLADOS", "CAVACO", "OUTROS"];
  
  // Produtos opcionais que tiveram movimentação no dia
  const produtosComMovimentacao = produtosOpcionais.filter(produto => {
    const filaCount = fila.filter(l => l.product.toUpperCase() === produto).length;
    const carregandoCount = carregando.filter(l => l.product.toUpperCase() === produto).length;
    const concluidosCount = concluidos.filter(l => l.product.toUpperCase() === produto).length;
    return filaCount > 0 || carregandoCount > 0 || concluidosCount > 0;
  });
  
  // Lista final de produtos
  const produtos = [...produtosFixos, ...produtosComMovimentacao];

  // Rolos puxados hoje
  const todayRolls = cottonRecords.filter(r => r.date === today);

  // Estatísticas de chuva
  const chuvaHoje = rainRecords.filter(r => r.date === today).reduce((sum, r) => sum + r.millimeters, 0);
  const chuvaSemana = rainRecords.filter(r => r.date >= thisWeekStart).reduce((sum, r) => sum + r.millimeters, 0);
  const chuvaMes = rainRecords.filter(r => r.date >= thisMonthStart).reduce((sum, r) => sum + r.millimeters, 0);
  const chuvaAno = rainRecords.filter(r => r.date >= thisYearStart).reduce((sum, r) => sum + r.millimeters, 0);

  // Última chuva
  const ultimaChuva = rainRecords
    .filter(r => r.millimeters > 0)
    .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime())[0];

  // Ranking de placas - Rolos do dia
  const rankingDia = todayRolls.reduce((acc, r) => {
    if (!acc[r.plate]) {
      acc[r.plate] = { plate: r.plate, rolos: 0, producer: r.producer, driver: r.driver, viagens: 0 };
    }
    acc[r.plate].rolos += r.rolls;
    acc[r.plate].viagens += 1;
    acc[r.plate].driver = r.driver; // Sempre usar o motorista mais recente
    return acc;
  }, {} as Record<string, { plate: string; rolos: number; producer: string; driver: string; viagens: number }>);

  const rankingDiaArray = Object.values(rankingDia)
    .sort((a, b) => b.rolos - a.rolos)
    .slice(0, 8);

  // Ranking de placas - Acumulado do mês
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthRolls = cottonRecords.filter(r => r.date.startsWith(thisMonth));
  
  const rankingMes = monthRolls.reduce((acc, r) => {
    if (!acc[r.plate]) {
      acc[r.plate] = { plate: r.plate, rolos: 0, producer: r.producer, driver: r.driver, viagens: 0 };
    }
    acc[r.plate].rolos += r.rolls;
    acc[r.plate].viagens += 1;
    acc[r.plate].driver = r.driver; // Sempre usar o motorista mais recente
    return acc;
  }, {} as Record<string, { plate: string; rolos: number; producer: string; driver: string; viagens: number }>);

  const rankingMesArray = Object.values(rankingMes)
    .sort((a, b) => b.rolos - a.rolos)
    .slice(0, 8);

  return (
    <div className="tv-mode min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-800 text-emerald-100 p-[clamp(0.5rem,1vw,2rem)]">
      {/* Header responsivo para TV */}
      <div className="bg-black/60 backdrop-blur-lg rounded-lg p-[clamp(0.75rem,1.5vw,3rem)] mb-[clamp(1rem,1.5vw,2rem)] border border-emerald-600/30">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-[clamp(1rem,2vw,3rem)]">
          <div className="flex items-center gap-[clamp(0.75rem,1.5vw,2.5rem)]">
            <div className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)]">
              <img 
                src={logo}
                alt="Bom Futuro Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-[clamp(1.5rem,3vw,4rem)] font-bold text-emerald-400 leading-tight">
                CONTROLE GUARITA
              </h1>
              <p className="text-[clamp(0.875rem,1.2vw,1.5rem)] text-emerald-300">
                Sistema de Monitoramento em Tempo Real
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[clamp(1.25rem,2.5vw,3rem)] font-mono text-emerald-400">
              {currentTime.toLocaleTimeString('pt-BR')}
            </p>
            <p className="text-[clamp(0.875rem,1.2vw,1.5rem)] text-emerald-300">
              {currentTime.toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* CARDS POR PRODUTO - Grid Responsivo para TV */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-[clamp(0.5rem,1vw,1.5rem)] mb-[clamp(1rem,2vw,3rem)] overflow-hidden">
        {produtos.map((produto) => {
          const filaCount = fila.filter(l => l.product.toUpperCase() === produto).length;
          const carregandoCount = carregando.filter(l => l.product.toUpperCase() === produto).length;
          const concluidosCount = concluidos.filter(l => l.product.toUpperCase() === produto).length;
          const carregandoItems = carregando.filter(l => l.product.toUpperCase() === produto);

          return (
            <Card key={produto} className="bg-black/60 backdrop-blur-lg text-emerald-100 border-emerald-600/30 hover:border-emerald-500/50 transition-colors min-w-0 flex flex-col h-[clamp(12rem,20vh,24rem)]">
              <CardHeader className="border-b border-emerald-600/30 pb-[clamp(0.5rem,1vh,1rem)] flex-shrink-0">
                <CardTitle className="text-[clamp(0.875rem,1.2vw,1.25rem)] font-bold flex flex-col gap-[clamp(0.25rem,0.5vh,0.5rem)]">
                  <span className="flex items-center gap-[clamp(0.25rem,0.5vw,0.75rem)] min-w-0">
                    <PackageCheck className="w-[clamp(1rem,1.5vw,2rem)] h-[clamp(1rem,1.5vw,2rem)] text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-400 truncate">{produto}</span>
                  </span>
                  <span className="text-[clamp(0.75rem,1vw,1rem)] text-emerald-300 font-normal">Tempo real</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-[clamp(0.5rem,1vw,1rem)] flex-1 flex flex-col min-w-0">
                {/* Contadores */}
                <div className="grid grid-cols-3 gap-[clamp(0.25rem,0.5vw,0.5rem)] mb-[clamp(0.5rem,1vh,1rem)]">
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded p-[clamp(0.25rem,0.5vw,0.75rem)] text-center min-w-0">
                    <div className="flex flex-col items-center">
                      <Clock className="w-[clamp(0.75rem,1vw,1.5rem)] h-[clamp(0.75rem,1vw,1.5rem)] text-orange-400 mb-[clamp(0.25rem,0.5vh,0.5rem)]" />
                      <span className="text-[clamp(0.625rem,0.8vw,1rem)] font-semibold text-orange-300 truncate">FILA</span>
                      <p className="text-[clamp(1rem,1.5vw,2rem)] font-bold text-orange-400">{filaCount}</p>
                    </div>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded p-[clamp(0.25rem,0.5vw,0.75rem)] text-center min-w-0">
                    <div className="flex flex-col items-center">
                      <Truck className="w-[clamp(0.75rem,1vw,1.5rem)] h-[clamp(0.75rem,1vw,1.5rem)] text-blue-400 mb-[clamp(0.25rem,0.5vh,0.5rem)]" />
                      <span className="text-[clamp(0.625rem,0.8vw,1rem)] font-semibold text-blue-300 truncate">Carregando</span>
                      <p className="text-[clamp(1rem,1.5vw,2rem)] font-bold text-blue-400">{carregandoCount}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded p-[clamp(0.25rem,0.5vw,0.75rem)] text-center min-w-0">
                    <div className="flex flex-col items-center">
                      <PackageCheck className="w-[clamp(0.75rem,1vw,1.5rem)] h-[clamp(0.75rem,1vw,1.5rem)] text-emerald-400 mb-[clamp(0.25rem,0.5vh,0.5rem)]" />
                      <span className="text-[clamp(0.625rem,0.8vw,1rem)] font-semibold text-emerald-300 truncate">OK</span>
                      <p className="text-[clamp(1rem,1.5vw,2rem)] font-bold text-emerald-400">{concluidosCount}</p>
                    </div>
                  </div>
                </div>

                {/* Detalhes dos carregamentos em andamento */}
                <div className="flex-1 min-h-0">
                  <p className="text-emerald-300 text-[clamp(0.75rem,1vw,1rem)] mb-[clamp(0.25rem,0.5vh,0.5rem)] font-semibold truncate">🚛 Carregando:</p>
                  <div className="bg-black/30 border border-emerald-600/20 rounded p-[clamp(0.25rem,0.5vw,0.75rem)] flex-1 overflow-hidden">
                    {carregandoItems.length > 0 ? (
                      <div className="space-y-[clamp(0.25rem,0.5vh,0.5rem)] max-h-[clamp(4rem,8vh,6rem)] overflow-y-auto">
                        {carregandoItems.slice(0, 2).map((item) => (
                          <div key={item.id} className="text-[clamp(0.75rem,1vw,1rem)]">
                            <span className="font-semibold text-emerald-400 block truncate">{item.plate}</span>
                            <span className="text-emerald-300 text-[clamp(0.625rem,0.8vw,0.875rem)] truncate block">{item.truck_type} - {item.carrier}</span>
                          </div>
                        ))}
                        {carregandoItems.length > 2 && (
                          <div className="text-emerald-400 text-center text-[clamp(0.625rem,0.8vw,0.875rem)]">+{carregandoItems.length - 2} mais</div>
                        )}
                      </div>
                    ) : (
                      <p className="text-emerald-400 text-center text-[clamp(0.75rem,1vw,1rem)]">Nenhum ativo</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ROLOS E CHUVA - Seção Responsiva para TV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(1rem,2vw,2rem)]">
        {/* Movimentação de Rolos */}
        <Card className="bg-black/60 backdrop-blur-lg text-emerald-100 border-emerald-600/30">
          <CardHeader className="border-b border-emerald-600/30">
            <CardTitle className="text-[clamp(1.25rem,2vw,2.5rem)] font-bold flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
              <Truck className="text-emerald-400 w-[clamp(1.5rem,2vw,2.5rem)] h-[clamp(1.5rem,2vw,2.5rem)]" /> 
              <span className="text-emerald-400">Ranking de Rolos por Placa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[clamp(0.75rem,1.5vw,2rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(1rem,2vw,2rem)]">
              {/* Ranking do Dia */}
              <div>
                <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)] mb-[clamp(0.75rem,1.5vw,1.5rem)]">
                  <div className="w-[clamp(0.75rem,1vw,1rem)] h-[clamp(0.75rem,1vw,1rem)] bg-yellow-500 rounded-full"></div>
                  <h3 className="font-semibold text-emerald-400 text-[clamp(1rem,1.3vw,1.5rem)]">🏆 TOP ROLOS - HOJE</h3>
                </div>
                <div className="space-y-[clamp(0.5rem,1vw,1rem)]">
                  {rankingDiaArray.length > 0 ? (
                    rankingDiaArray.map((item, index) => (
                      <div
                        key={item.plate}
                        className="bg-black/40 border border-emerald-600/20 rounded-lg p-[clamp(0.5rem,1vw,1rem)] flex justify-between items-center hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
                          <span className={`w-[clamp(1.5rem,2vw,2.5rem)] h-[clamp(1.5rem,2vw,2.5rem)] rounded-full flex items-center justify-center text-[clamp(0.75rem,1vw,1.25rem)] font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-black' :
                            'bg-emerald-600/30 text-emerald-300'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-emerald-400 text-[clamp(0.875rem,1.2vw,1.25rem)]">{item.plate}</p>
                            <p className="text-[clamp(0.75rem,1vw,1rem)] text-emerald-300">{item.driver}</p>
                            <p className="text-[clamp(0.75rem,1vw,1rem)] text-emerald-300">{item.producer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400 text-[clamp(1rem,1.3vw,1.5rem)]">{item.rolos.toLocaleString('pt-BR')}</p>
                          <p className="text-[clamp(0.75rem,1vw,1rem)] text-emerald-300">{item.viagens} viagens</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-emerald-400 text-center py-[clamp(1rem,2vw,2rem)] text-[clamp(1rem,1.3vw,1.5rem)]">Nenhum rolo hoje</p>
                  )}
                </div>
              </div>

              {/* Ranking do Mês */}
              <div>
                <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)] mb-[clamp(0.75rem,1.5vw,1.5rem)]">
                  <div className="w-[clamp(0.75rem,1vw,1rem)] h-[clamp(0.75rem,1vw,1rem)] bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-emerald-400 text-[clamp(1rem,1.3vw,1.5rem)]">📅 TOP ROLOS - MÊS ATUAL</h3>
                </div>
                <div className="space-y-[clamp(0.5rem,1vw,1rem)]">
                  {rankingMesArray.length > 0 ? (
                    rankingMesArray.map((item, index) => (
                      <div
                        key={item.plate}
                        className="bg-black/40 border border-emerald-600/20 rounded-lg p-[clamp(0.5rem,1vw,1rem)] flex justify-between items-center hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
                          <span className={`w-[clamp(1.5rem,2vw,2.5rem)] h-[clamp(1.5rem,2vw,2.5rem)] rounded-full flex items-center justify-center text-[clamp(0.75rem,1vw,1.25rem)] font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-black' :
                            'bg-emerald-600/30 text-emerald-300'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-emerald-400 text-[clamp(0.875rem,1.2vw,1.25rem)]">{item.plate}</p>
                            <p className="text-[clamp(0.75rem,1vw,1rem)] text-emerald-300">{item.driver}</p>
                            <p className="text-[clamp(0.75rem,1vw,1rem)] text-emerald-300">{item.producer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400 text-[clamp(1rem,1.3vw,1.5rem)]">{item.rolos.toLocaleString('pt-BR')}</p>
                          <p className="text-[clamp(0.75rem,1vw,1rem)] text-emerald-300">{item.viagens} viagens</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-emerald-400 text-center py-[clamp(1rem,2vw,2rem)] text-[clamp(1rem,1.3vw,1.5rem)]">Nenhum rolo neste mês</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoramento de Chuvas */}
        <Card className="bg-black/60 backdrop-blur-lg text-emerald-100 border-emerald-600/30">
          <CardHeader className="border-b border-emerald-600/30">
            <CardTitle className="text-[clamp(1.25rem,2vw,2.5rem)] font-bold flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
              <CloudRain className="text-blue-400 w-[clamp(1.5rem,2vw,2.5rem)] h-[clamp(1.5rem,2vw,2.5rem)]" /> 
              <span className="text-emerald-400">Monitoramento de Chuvas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[clamp(0.75rem,1.5vw,2rem)]">
            <div className="space-y-[clamp(1rem,2vw,2rem)]">
              {/* Estatísticas de Chuva */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.5rem)]">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-[clamp(0.75rem,1.5vw,1.5rem)] text-center">
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300 mb-[clamp(0.25rem,0.5vh,0.5rem)]">HOJE</p>
                  <p className="text-[clamp(1.25rem,2vw,2.5rem)] font-bold text-blue-400">{chuvaHoje.toFixed(1)}</p>
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300">mm</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-[clamp(0.75rem,1.5vw,1.5rem)] text-center">
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300 mb-[clamp(0.25rem,0.5vh,0.5rem)]">SEMANA</p>
                  <p className="text-[clamp(1.25rem,2vw,2.5rem)] font-bold text-blue-400">{chuvaSemana.toFixed(1)}</p>
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300">mm</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-[clamp(0.75rem,1.5vw,1.5rem)] text-center">
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300 mb-[clamp(0.25rem,0.5vh,0.5rem)]">MÊS</p>
                  <p className="text-[clamp(1.25rem,2vw,2.5rem)] font-bold text-blue-400">{chuvaMes.toFixed(1)}</p>
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300">mm</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-[clamp(0.75rem,1.5vw,1.5rem)] text-center">
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300 mb-[clamp(0.25rem,0.5vh,0.5rem)]">ANO</p>
                  <p className="text-[clamp(1.25rem,2vw,2.5rem)] font-bold text-blue-400">{chuvaAno.toFixed(1)}</p>
                  <p className="text-[clamp(0.75rem,1vw,1rem)] text-blue-300">mm</p>
                </div>
              </div>

              {/* Última Chuva */}
              {ultimaChuva && (
                <div className="bg-black/40 border border-emerald-600/20 rounded-lg p-[clamp(1rem,2vw,2rem)]">
                  <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)] mb-[clamp(0.5rem,1vw,1rem)]">
                    <CloudRain className="w-[clamp(1.25rem,2vw,2rem)] h-[clamp(1.25rem,2vw,2rem)] text-blue-400" />
                    <span className="font-semibold text-emerald-400 text-[clamp(1rem,1.3vw,1.5rem)]">Última Chuva Registrada</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(1rem,2vw,2rem)] text-[clamp(0.875rem,1.2vw,1.25rem)]">
                    <div>
                      <p className="text-emerald-300">Data:</p>
                      <p className="font-semibold text-emerald-400">
                        {new Date(ultimaChuva.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-300">Quantidade:</p>
                      <p className="font-semibold text-blue-400">{ultimaChuva.millimeters.toFixed(1)}mm</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!ultimaChuva && (
                <div className="text-center py-[clamp(1rem,2vw,2rem)]">
                  <p className="text-emerald-400 text-[clamp(1rem,1.3vw,1.5rem)]">Nenhuma chuva registrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}