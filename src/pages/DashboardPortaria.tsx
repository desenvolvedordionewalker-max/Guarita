import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CloudRain, Truck, PackageCheck, Clock } from "lucide-react";
import { useVehicles, useCottonPull, useRainRecords, useLoadingRecords, useEquipment } from "@/hooks/use-supabase";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";
import ControleGuaritaFitScreen from "@/components/ControleGuaritaFitScreen";
import logo from "@/assets/BF_logo.png";

export default function DashboardPortariaTV() {
  const { vehicles, loading: loadingVehicles } = useVehicles();
  const { records: cottonPullRecords, loading: loadingCotton } = useCottonPull();
  const { records: rainRecords, loading: loadingRain } = useRainRecords();
  const { records: loadingRecords, loading: loadingLoadings } = useLoadingRecords();
  const { records: materialRecords, loading: loadingMaterials } = useMaterialReceipts();
  const { records: equipmentRecords, loading: loadingEquipment } = useEquipment();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // atualiza a cada 1 minuto
    return () => clearInterval(timer);
  }, []);

  // Estado para forçar re-render e atualização automática
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Atualização automática do modo TV a cada 30 segundos
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      // Incrementa o trigger para forçar re-fetch dos dados
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // atualiza a cada 30 segundos
    return () => clearInterval(autoRefresh);
  }, []);

  // Efeito para forçar atualização dos hooks quando necessário
  useEffect(() => {
    // Este efeito roda sempre que refreshTrigger muda
    // Os hooks já têm seus próprios sistemas de atualização
  }, [refreshTrigger]);

  const getBannerMessages = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMaterials = materialRecords.filter(m => m.date === today);
    const todayEquipment = equipmentRecords.filter(e => e.date === today);
    
    const messages = [];
    
    // Materiais recebidos
    if (todayMaterials.length === 0) {
      messages.push("📦 Nenhum material recebido hoje");
    } else {
      // Mensagem geral
      const totalWeight = todayMaterials.reduce((sum, m) => sum + m.net_weight, 0);
      messages.push(`📦 ${todayMaterials.length} materiais recebidos hoje - Total: ${totalWeight.toFixed(1)}t`);
      
      // Por tipo de material
      const materialsByType = todayMaterials.reduce((acc: Record<string, number>, m) => {
        acc[m.material_type] = (acc[m.material_type] || 0) + m.net_weight;
        return acc;
      }, {});
      
      Object.entries(materialsByType).forEach(([type, weight]) => {
        messages.push(`📦 ${type}: ${weight.toFixed(1)}t recebidos hoje`);
      });
    }
    
    // Saída de equipamentos
    if (todayEquipment.length === 0) {
      messages.push("🔧 Nenhuma saída de equipamento hoje");
    } else {
      // Mensagem geral de equipamentos
      messages.push(`🔧 ${todayEquipment.length} equipamentos saíram hoje`);
      
      // Por tipo de equipamento
      const equipmentByType = todayEquipment.reduce((acc: Record<string, number>, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(equipmentByType).forEach(([type, count]) => {
        messages.push(`🔧 ${type}: ${count} saídas hoje`);
      });

      // Equipamentos ainda em campo (saídos mas não retornados)
      const equipmentInField = todayEquipment.filter(e => e.status === 'pending');
      if (equipmentInField.length > 0) {
        messages.push(`⚠️ ${equipmentInField.length} equipamentos ainda em campo`);
      }
    }
    
    return messages;
  }, [materialRecords, equipmentRecords]);

  // Banner rotativo para materiais e equipamentos
  useEffect(() => {
    const messages = getBannerMessages();
    if (messages.length === 0) return;
    
    const bannerTimer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % messages.length);
    }, 5000); // muda a cada 5 segundos
    return () => clearInterval(bannerTimer);
  }, [materialRecords, equipmentRecords, getBannerMessages]);

  const loading = loadingVehicles || loadingCotton || loadingRain || loadingLoadings || loadingMaterials || loadingEquipment;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 text-xl">
        <Loader2 className="animate-spin mr-3" /> Carregando informações...
      </div>
    );
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const thisWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Primeiro filtramos os carregamentos do dia (temporariamente todos)
  const todayLoadings = loadingRecords; // Mostrando todos temporariamente
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
  const produtosParaExibir = [...produtosFixos, ...produtosComMovimentacao];

  // Rolos puxados hoje
  const todayRolls = cottonPullRecords?.filter(r => r.date === todayStr) || [];

  // Estatísticas de chuva
  const chuvaHoje = rainRecords?.filter(r => r.date === todayStr).reduce((sum, r) => sum + r.millimeters, 0) || 0;
  const chuvaMes = rainRecords?.filter(r => r.date >= thisMonthStart.toISOString().split('T')[0]).reduce((sum, r) => sum + r.millimeters, 0) || 0;
  const chuvaSemana = rainRecords?.filter(r => r.date >= thisWeekStart.toISOString().split('T')[0]).reduce((sum, r) => sum + r.millimeters, 0) || 0;
  
  // Última chuva
  const ultimaChuva = rainRecords && rainRecords.length > 0 
    ? new Date(rainRecords.find(r => r.millimeters > 0)?.date || rainRecords[0].date)
    : null;

  // Ranking de placas - Rolos do dia
  const rankingDia = todayRolls.reduce((acc, r) => {
    if (!acc[r.plate]) {
      acc[r.plate] = { plate: r.plate, driver: r.driver, rolos: 0, viagens: 0 };
    }
    acc[r.plate].rolos += r.rolls;
    acc[r.plate].viagens += 1;
    acc[r.plate].driver = r.driver; // Sempre usar o motorista mais recente
    return acc;
  }, {} as Record<string, {plate: string, driver: string, rolos: number, viagens: number}>);

  const rankingDiaArray = Object.values(rankingDia)
    .sort((a, b) => b.rolos - a.rolos)
    .slice(0, 10);

  // Ranking de placas - Acumulado do mês
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthRolls = cottonPullRecords?.filter(r => r.date && r.date.startsWith(thisMonth)) || [];
  
  const rankingMes = monthRolls.reduce((acc, r) => {
    if (!acc[r.plate]) {
      acc[r.plate] = { plate: r.plate, driver: r.driver, rolos: 0, viagens: 0 };
    }
    acc[r.plate].rolos += r.rolls;
    acc[r.plate].viagens += 1;
    acc[r.plate].driver = r.driver; // Sempre usar o motorista mais recente
    return acc;
  }, {} as Record<string, {plate: string, driver: string, rolos: number, viagens: number}>);

  const rankingMesArray = Object.values(rankingMes)
    .sort((a, b) => b.rolos - a.rolos)
    .slice(0, 10);

  // Sistema responsivo otimizado para TVs
  const totalCards = produtosParaExibir.length;
  const getResponsiveClasses = () => {
    if (totalCards <= 2) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 800px), 1fr))',
        textSize: 'text-[clamp(0.8rem, 1.6vw, 1.8rem)]',
        titleSize: 'text-[clamp(1rem, 1.9vw, 2.2rem)]',
        cardTitleSize: 'text-[clamp(1.3rem, 2.2vw, 2.8rem)]',
        padding: 'p-[clamp(0.8rem, 1.4vw, 2rem)]',
        gap: 'gap-[clamp(0.8rem, 1.4vw, 2rem)]',
        minHeight: 'min-h-[clamp(5rem, 15vh, 12rem)]'
      };
    } else if (totalCards <= 3) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(240px, 30vw, 600px), 1fr))',
        textSize: 'text-[clamp(0.7rem, 1.4vw, 1.6rem)]',
        titleSize: 'text-[clamp(0.9rem, 1.7vw, 2rem)]',
        cardTitleSize: 'text-[clamp(1.1rem, 2vw, 2.5rem)]',
        padding: 'p-[clamp(0.6rem, 1.2vw, 1.8rem)]',
        gap: 'gap-[clamp(0.6rem, 1.2vw, 1.8rem)]',
        minHeight: 'min-h-[clamp(4rem, 12vh, 10rem)]'
      };
    } else if (totalCards <= 4) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(200px, 22vw, 500px), 1fr))',
        textSize: 'text-[clamp(0.6rem, 1.2vw, 1.4rem)]',
        titleSize: 'text-[clamp(0.8rem, 1.5vw, 1.8rem)]',
        cardTitleSize: 'text-[clamp(1rem, 1.8vw, 2.2rem)]',
        padding: 'p-[clamp(0.5rem, 1.1vw, 1.6rem)]',
        gap: 'gap-[clamp(0.5rem, 1.1vw, 1.6rem)]',
        minHeight: 'min-h-[clamp(3.5rem, 10vh, 8rem)]'
      };
    } else if (totalCards <= 6) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(160px, 16vw, 400px), 1fr))',
        textSize: 'text-[clamp(0.5rem, 1vw, 1.2rem)]',
        titleSize: 'text-[clamp(0.7rem, 1.3vw, 1.6rem)]',
        cardTitleSize: 'text-[clamp(0.9rem, 1.5vw, 1.9rem)]',
        padding: 'p-[clamp(0.4rem, 0.9vw, 1.3rem)]',
        gap: 'gap-[clamp(0.4rem, 0.9vw, 1.3rem)]',
        minHeight: 'min-h-[clamp(3rem, 8vh, 6rem)]'
      };
    } else {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(130px, 12vw, 300px), 1fr))',
        textSize: 'text-[clamp(0.4rem, 0.8vw, 1rem)]',
        titleSize: 'text-[clamp(0.6rem, 1.1vw, 1.4rem)]',
        cardTitleSize: 'text-[clamp(0.8rem, 1.3vw, 1.7rem)]',
        padding: 'p-[clamp(0.3rem, 0.7vw, 1rem)]',
        gap: 'gap-[clamp(0.3rem, 0.7vw, 1rem)]',
        minHeight: 'min-h-[clamp(2.5rem, 6vh, 5rem)]'
      };
    }
  };

  const classes = getResponsiveClasses();
  const infoLevel = totalCards <= 4 ? 'low' : totalCards <= 6 ? 'medium' : 'high';

  return (
    <ControleGuaritaFitScreen>
      <div className="h-full bg-transparent text-white flex flex-col relative">
      {/* HEADER - Mais Compacto */}
      <div className="bg-black/70 backdrop-blur-sm border-b border-emerald-600/30 p-[clamp(0.4rem,0.8vw,0.8rem)] min-h-[clamp(3rem,6vh,4rem)]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-[clamp(0.75rem,1.5vw,1.5rem)]">
            <img src={logo} alt="Logo" className="h-[clamp(2rem,3.5vh,3rem)] w-auto" />
            <div>
              <h1 className="text-[clamp(1.2rem,2.2vw,2.5rem)] font-bold text-emerald-400">Controle Guarita</h1>
              <p className="text-[clamp(0.65rem,0.9vw,0.95rem)] text-emerald-300">IBA Santa Luzia</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[clamp(0.8rem,1.1vw,1.2rem)] text-emerald-300">
              {currentTime.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long',
                year: 'numeric' 
              })}
            </p>
            <p className="text-[clamp(0.9rem,1.3vw,1.4rem)] font-bold text-emerald-400">
              {currentTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* BANNER MATERIAIS RECEBIDOS */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 overflow-hidden">
        <div className="animate-pulse text-center font-semibold text-[clamp(0.8rem,1.2vw,1.3rem)]">
          {getBannerMessages()[bannerIndex] || "📦 Sistema de materiais carregando..."}
        </div>
      </div>

      {/* CARREGAMENTOS - Sistema de Grid Fluido Responsivo */}
      <div className="p-[clamp(0.3rem,0.8vw,1rem)] flex-1" style={{ 
        minHeight: `calc(50vh - 60px)`, 
        overflow: 'visible' 
      }}>
        <div 
          className={`${classes.gap} w-full`}
          style={{
            display: 'grid',
            gridTemplateColumns: classes.gridCols,
            gridAutoRows: 'minmax(auto, 1fr)',
            minHeight: '100%',
            alignItems: 'stretch'
          }}
        >
          {produtosParaExibir.map((produto) => {
            const filaItems = fila.filter(l => l.product.toUpperCase() === produto);
            const carregandoItems = carregando.filter(l => l.product.toUpperCase() === produto);
            const concluidosItems = concluidos.filter(l => l.product.toUpperCase() === produto);

            // Cálculo inteligente de quantidades
            const getQuantidadeTotal = (items: Array<{bales?: number; weight?: number}>) => {
              if (produto === "PLUMA" || produto === "FIBRILHA") {
                // Para Pluma e Fibrilha: mostrar em Fardos
                const totalFardos = items.reduce((sum, item) => sum + (item.bales || 0), 0);
                return `${totalFardos.toLocaleString('pt-BR')} Fardos`;
              } else {
                // Para Caroço e Briquete: mostrar em KG
                const totalKg = items.reduce((sum, item) => sum + (item.weight || 0), 0);
                return `${totalKg.toLocaleString('pt-BR')} KG`;
              }
            };

            return (
              <Card key={produto} className="bg-black/60 backdrop-blur-lg border-emerald-600/30 text-emerald-100 min-h-full flex flex-col">
                <CardHeader className={`border-b border-emerald-600/30 ${classes.padding} pb-[clamp(0.2rem,0.4vw,0.5rem)]`}>
                  <CardTitle className={`${classes.cardTitleSize} font-bold text-emerald-400 text-center`}>
                    {produto}
                  </CardTitle>
                  <div className="text-center">
                    <p className={`text-[clamp(0.5rem,0.7vw,0.75rem)] text-emerald-300 truncate`}>
                      {produto === "PLUMA" || produto === "FIBRILHA" ? 
                        `${(filaItems.reduce((sum, item) => sum + (item.bales || 0), 0) + 
                           carregandoItems.reduce((sum, item) => sum + (item.bales || 0), 0) + 
                           concluidosItems.reduce((sum, item) => sum + (item.bales || 0), 0)).toLocaleString('pt-BR')} Fardos` :
                        `${(filaItems.reduce((sum, item) => sum + (item.weight || 0), 0) + 
                           carregandoItems.reduce((sum, item) => sum + (item.weight || 0), 0) + 
                           concluidosItems.reduce((sum, item) => sum + (item.weight || 0), 0)).toLocaleString('pt-BR')} KG`
                      }
                    </p>
                  </div>
                </CardHeader>
                <CardContent className={`${classes.padding} h-full overflow-hidden flex flex-col`}>
                  <div className={`grid grid-cols-3 ${classes.gap} mb-[clamp(0.3rem,0.6vh,0.8rem)] text-center`}>
                    <div className={`bg-yellow-600/20 border border-yellow-600/30 rounded ${classes.padding} ${classes.minHeight} flex flex-col justify-center`}>
                      <p className="text-[clamp(0.5rem,0.8vw,0.9rem)] text-yellow-400 font-semibold">FILA</p>
                      <p className={`${classes.titleSize} font-bold text-yellow-300`}>{filaItems.length}</p>
                    </div>
                    <div className={`bg-blue-600/20 border border-blue-600/30 rounded ${classes.padding} ${classes.minHeight} flex flex-col justify-center`}>
                      <p className="text-[clamp(0.45rem,0.7vw,0.8rem)] text-blue-400 font-semibold">CARREGANDO</p>
                      <p className={`${classes.titleSize} font-bold text-blue-300`}>{carregandoItems.length}</p>
                    </div>
                    <div className={`bg-emerald-600/20 border border-emerald-600/30 rounded ${classes.padding} ${classes.minHeight} flex flex-col justify-center`}>
                      <p className="text-[clamp(0.45rem,0.7vw,0.8rem)] text-emerald-400 font-semibold">FINALIZADO</p>
                      <p className={`${classes.titleSize} font-bold text-emerald-300`}>{concluidosItems.length}</p>
                    </div>
                  </div>

                  {/* Detalhes dos carregamentos em andamento */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <p className={`text-emerald-300 ${classes.textSize} mb-[clamp(0.4rem,0.8vh,0.8rem)] font-semibold`}>🚛 Carregando:</p>
                    <div className={`bg-black/30 border border-emerald-600/20 rounded ${classes.padding} flex-1 overflow-auto ${classes.minHeight}`}>
                      {carregandoItems.length > 0 ? (
                        <div className={`space-y-[clamp(0.25rem,0.5vh,0.5rem)] overflow-y-auto h-full flex flex-col justify-center`}>
                          {carregandoItems.slice(0, totalCards <= 4 ? 3 : totalCards <= 6 ? 2 : 2).map((item) => (
                            <div key={item.id} className={`bg-black/20 rounded p-[clamp(0.2rem,0.4vw,0.5rem)] border border-emerald-600/20`}>
                              <div className="text-[clamp(0.5rem,0.8vw,1rem)] text-emerald-400 font-bold text-center leading-tight">
                                <span className="block">{item.plate}</span>
                                <div className="text-[clamp(0.4rem,0.65vw,0.8rem)] text-emerald-300 mt-[clamp(0.1rem,0.2vh,0.2rem)]">
                                  {item.client || 'S/Cliente'} • {item.truck_type || 'S/Tipo'} • {item.carrier || 'S/Transp'}
                                </div>
                              </div>
                            </div>
                          ))}
                          {carregandoItems.length > (totalCards <= 4 ? 3 : totalCards <= 6 ? 2 : 2) && (
                            <div className={`text-emerald-400 text-center text-[clamp(0.35rem,0.5vw,0.6rem)] mt-[clamp(0.1rem,0.2vh,0.2rem)]`}>
                              +{carregandoItems.length - (totalCards <= 4 ? 3 : totalCards <= 6 ? 2 : 2)} mais
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className={`text-emerald-400 text-center ${classes.textSize} flex items-center justify-center h-full`}>Nenhum ativo</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ROLOS E CHUVA - Seção Responsiva */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(0.5rem,1vw,1rem)] p-[clamp(0.5rem,1vw,1rem)]"
        style={{ 
          minHeight: `calc(50vh - 60px)`, 
          overflow: 'visible' 
        }}
      >

        {/* Card de Rolos */}
        <Card className="bg-black/60 backdrop-blur-lg text-emerald-100 border-emerald-600/30 h-full overflow-hidden">
          <CardHeader className="border-b border-emerald-600/30 pb-2">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
              <CardTitle className="text-[clamp(1.25rem,2vw,2.5rem)] font-bold flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
                <span className="text-emerald-400">Ranking Puxe Lavoura</span>
              </CardTitle>
              <div className="text-[clamp(0.75rem,1.2vw,1.25rem)] text-emerald-300">
                {(() => {
                  // Filtrar registros de hoje de forma mais robusta
                  const todayString = today.toISOString().split('T')[0];
                  const pulledToday = cottonPullRecords?.filter(r => {
                    return r.date === todayString;
                  }) || [];

                  console.log('Cotton Pull Records:', cottonPullRecords?.length || 0);
                  console.log('Today String:', todayString);
                  console.log('Pulled Today:', pulledToday.length);

                  if (pulledToday.length > 0) {
                    // Mostrar fazendas únicas
                    const uniqueFarms = [...new Set(pulledToday.map(r => r.farm).filter(farm => farm && farm.trim() !== ''))];
                    
                    // Mostrar talhões únicos se existirem
                    const uniqueTalhaos = [...new Set(pulledToday.map(r => r.talhao).filter(talhao => talhao && talhao.trim() !== ''))];
                    
                    console.log('=== DEBUG TALHÃO ===');
                    console.log('Cotton Pull Records:', cottonPullRecords?.length || 0);
                    console.log('Today String:', todayString);
                    console.log('Pulled Today:', pulledToday.length);
                    console.log('Pulled Today Data:', pulledToday);
                    console.log('Sample Record:', pulledToday[0]);
                    console.log('Unique Farms:', uniqueFarms);
                    console.log('Unique Talhaos:', uniqueTalhaos);
                    console.log('Talhao values:', pulledToday.map(r => `${r.plate}: "${r.talhao}"`));
                    console.log('===================');
                    
                    if (uniqueFarms.length > 0 || uniqueTalhaos.length > 0) {
                      return (
                        <div className="flex items-center gap-[clamp(0.2rem,0.4vw,0.5rem)]">
                          <span className="text-green-400 text-[clamp(0.8rem,1.2vw,1.4rem)]">🌿</span>
                          <div className="flex flex-col">
                            <span className="text-[clamp(0.65rem,1vw,1.1rem)] font-semibold text-emerald-400">
                              Puxando hoje
                            </span>
                            <div className="text-[clamp(0.55rem,0.85vw,0.95rem)] text-emerald-300">
                              {uniqueFarms.length > 0 && (
                                <span>
                                  {uniqueFarms.slice(0, 2).join(', ')}
                                  {uniqueFarms.length > 2 && ` +${uniqueFarms.length - 2}`}
                                </span>
                              )}
                              {uniqueTalhaos.length > 0 && (
                                <span className={uniqueFarms.length > 0 ? "ml-2" : ""}>
                                  TH: {uniqueTalhaos.slice(0, 3).join(', ')}
                                  {uniqueTalhaos.length > 3 && ` +${uniqueTalhaos.length - 3}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  return (
                    <div className="flex items-center gap-[clamp(0.2rem,0.4vw,0.5rem)]">
                      <span className="text-green-400 text-[clamp(0.8rem,1.2vw,1.4rem)]">🌿</span>
                      <span className="text-[clamp(0.65rem,1vw,1.1rem)] font-semibold text-emerald-400">
                        Puxando hoje - {pulledToday.length} registros
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-[clamp(0.5rem,1vw,1rem)] h-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(0.5rem,1vw,1rem)] h-full">
              
              {/* Ranking do Dia */}
              <div className="flex flex-col h-full">
                <h3 className="text-[clamp(0.6rem,0.9vw,1rem)] font-semibold text-emerald-400 mb-[clamp(0.15rem,0.3vh,0.3rem)] border-b border-emerald-600/30 pb-[clamp(0.15rem,0.3vh,0.3rem)]">
                  HOJE ({rankingDiaArray.reduce((sum, item) => sum + item.rolos, 0).toLocaleString('pt-BR')} rolos)
                </h3>
                <div className="space-y-[clamp(0.1rem,0.2vh,0.25rem)] flex-1 overflow-y-auto">
                  {rankingDiaArray.length > 0 ? (
                    rankingDiaArray.slice(0, totalCards <= 3 ? 8 : totalCards <= 4 ? 10 : totalCards <= 6 ? 12 : 15).map((item, index) => (
                      <div
                        key={item.plate}
                        className="bg-black/40 border border-emerald-600/20 rounded p-[clamp(0.2rem,0.4vw,0.5rem)] flex justify-between items-center hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-[clamp(0.2rem,0.4vw,0.5rem)] min-w-0 flex-1">
                          <span className={`w-[clamp(0.9rem,1.4vw,1.4rem)] h-[clamp(0.9rem,1.4vw,1.4rem)] rounded-full flex items-center justify-center text-[clamp(0.3rem,0.5vw,0.55rem)] font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-black' :
                            'bg-emerald-600/30 text-emerald-300'
                          }`}>
                            {index + 1}
                          </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-emerald-400 text-[clamp(0.4rem,0.65vw,0.8rem)]">{item.plate}</p>
                              <p className="text-[clamp(0.35rem,0.55vw,0.7rem)] text-emerald-300">{item.driver}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-1">
                            <p className="font-bold text-emerald-400 text-[clamp(0.4rem,0.65vw,0.8rem)]">{item.rolos.toLocaleString('pt-BR')}</p>
                            <p className="text-[clamp(0.35rem,0.55vw,0.7rem)] text-emerald-300">{item.viagens} viagens</p>
                          </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-emerald-400 text-center py-4 text-[clamp(0.6rem,0.9vw,1rem)]">Nenhum rolo hoje</p>
                  )}
                </div>
              </div>

              {/* Ranking do Mês */}
              <div className="flex flex-col h-full">
                <h3 className="text-[clamp(0.6rem,0.9vw,1rem)] font-semibold text-emerald-400 mb-[clamp(0.15rem,0.3vh,0.3rem)] border-b border-emerald-600/30 pb-[clamp(0.15rem,0.3vh,0.3rem)]">
                  MÊS ({rankingMesArray.reduce((sum, item) => sum + item.rolos, 0).toLocaleString('pt-BR')} rolos)
                </h3>
                <div className="space-y-[clamp(0.1rem,0.2vh,0.25rem)] flex-1 overflow-y-auto">
                  {rankingMesArray.length > 0 ? (
                    rankingMesArray.slice(0, totalCards <= 3 ? 8 : totalCards <= 4 ? 10 : totalCards <= 6 ? 12 : 15).map((item, index) => (
                      <div
                        key={item.plate}
                        className="bg-black/40 border border-emerald-600/20 rounded p-[clamp(0.2rem,0.4vw,0.5rem)] flex justify-between items-center hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-[clamp(0.2rem,0.4vw,0.5rem)] min-w-0 flex-1">
                          <span className={`w-[clamp(0.9rem,1.4vw,1.4rem)] h-[clamp(0.9rem,1.4vw,1.4rem)] rounded-full flex items-center justify-center text-[clamp(0.3rem,0.5vw,0.55rem)] font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-black' :
                            'bg-emerald-600/30 text-emerald-300'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-emerald-400 text-[clamp(0.4rem,0.65vw,0.8rem)]">{item.plate}</p>
                            <p className="text-[clamp(0.35rem,0.55vw,0.7rem)] text-emerald-300">{item.driver}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-1">
                          <p className="font-bold text-emerald-400 text-[clamp(0.4rem,0.65vw,0.8rem)]">{item.rolos.toLocaleString('pt-BR')}</p>
                          <p className="text-[clamp(0.35rem,0.55vw,0.7rem)] text-emerald-300">{item.viagens} viagens</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-emerald-400 text-center py-4 text-[clamp(0.6rem,0.9vw,1rem)]">Nenhum rolo neste mês</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Chuva */}
        <Card className="bg-black/60 backdrop-blur-lg text-emerald-100 border-emerald-600/30">
          <CardHeader className="border-b border-emerald-600/30 p-[clamp(0.4rem,0.8vw,1rem)]">
            <CardTitle className="text-[clamp(0.9rem,1.4vw,1.8rem)] font-bold flex items-center justify-between">
              <span className="text-blue-400">💧 Chuva</span>
              {ultimaChuva && (
                <span className="text-[clamp(0.5rem,0.8vw,0.9rem)] text-blue-300 font-normal">
                  Última: {ultimaChuva.toLocaleDateString('pt-BR')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[clamp(0.4rem,0.7vw,0.9rem)]">
            <div className="grid grid-cols-3 gap-[clamp(0.3rem,0.6vw,0.8rem)] text-center">
              <div className="bg-black/30 border border-blue-600/20 rounded-lg p-[clamp(0.3rem,0.6vw,0.8rem)]">
                <p className="text-[clamp(0.5rem,0.8vw,0.9rem)] text-blue-300 mb-[clamp(0.15rem,0.3vh,0.3rem)]">HOJE</p>
                <p className="text-[clamp(0.9rem,1.4vw,1.8rem)] font-bold text-blue-400">{chuvaHoje.toFixed(1)}</p>
                <p className="text-[clamp(0.4rem,0.6vw,0.7rem)] text-blue-300">mm</p>
              </div>
              <div className="bg-black/30 border border-blue-600/20 rounded-lg p-[clamp(0.3rem,0.6vw,0.8rem)]">
                <p className="text-[clamp(0.5rem,0.8vw,0.9rem)] text-blue-300 mb-[clamp(0.15rem,0.3vh,0.3rem)]">SEMANA</p>
                <p className="text-[clamp(0.9rem,1.4vw,1.8rem)] font-bold text-blue-400">{chuvaSemana.toFixed(1)}</p>
                <p className="text-[clamp(0.4rem,0.6vw,0.7rem)] text-blue-300">mm</p>
              </div>
              <div className="bg-black/30 border border-blue-600/20 rounded-lg p-[clamp(0.3rem,0.6vw,0.8rem)]">
                <p className="text-[clamp(0.5rem,0.8vw,0.9rem)] text-blue-300 mb-[clamp(0.15rem,0.3vh,0.3rem)]">MÊS</p>
                <p className="text-[clamp(0.9rem,1.4vw,1.8rem)] font-bold text-blue-400">{chuvaMes.toFixed(1)}</p>
                <p className="text-[clamp(0.4rem,0.6vw,0.7rem)] text-blue-300">mm</p>
              </div>
            </div>

            {/* Últimas medições */}
            <div className="mt-[clamp(0.3rem,0.5vw,0.6rem)]">
              <h4 className="text-[clamp(0.5rem,0.7vw,0.8rem)] font-semibold text-blue-400 mb-[clamp(0.2rem,0.3vh,0.3rem)]">Últimas Medições</h4>
              <div className="bg-black/30 border border-blue-600/20 rounded-lg p-[clamp(0.25rem,0.4vw,0.5rem)] max-h-[clamp(4rem,8vh,6rem)] overflow-y-auto">
                {rainRecords && rainRecords.length > 0 ? (
                  <div className="space-y-[clamp(0.1rem,0.18vh,0.2rem)]">
                    {rainRecords.slice(0, totalCards <= 4 ? 10 : totalCards <= 6 ? 12 : 15).map((record, index) => (
                      <div key={index} className="flex justify-between items-center py-[clamp(0.06rem,0.1vh,0.12rem)]">
                        <span className="text-[clamp(0.5rem,0.75vw,0.85rem)] text-blue-300 flex-shrink-0">
                          {new Date(record.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[clamp(0.5rem,0.75vw,0.85rem)] font-semibold text-blue-400 flex-shrink-0 ml-2">
                          {record.millimeters.toFixed(1)}mm
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-400 text-center text-[clamp(0.45rem,0.65vw,0.75rem)]">Nenhuma medição registrada</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ControleGuaritaFitScreen>
  );
};