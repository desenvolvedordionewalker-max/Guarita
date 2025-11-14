import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CloudRain, Truck, PackageCheck, Clock, Droplet, Leaf, Factory } from "lucide-react";
import { useVehicles, useCottonPull, useRainRecords, useLoadingRecords, useEquipment, useGestaoTempo, useGestaoTempoCargas } from "@/hooks/use-supabase";
import { useRainAlert } from "@/hooks/use-rain-alert";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";
import { RainAnimation } from "@/components/RainAnimation";
import { RainHeaderAnimation } from "@/components/RainHeaderAnimation";
import ControleGuaritaFitScreen from "@/components/ControleGuaritaFitScreen";
import logo from "@/assets/BF_logo.png";
import { getTodayLocalDate, convertIsoToLocalDateString, toLocalDateString } from "@/lib/date-utils";

function DashboardPortariaTV() {
  const { vehicles, loading: loadingVehicles, refetch: refetchVehicles } = useVehicles();
  const { records: cottonPullRecords, loading: loadingCotton, refetch: refetchCotton } = useCottonPull();
  const { records: rainRecords, loading: loadingRain, refetch: refetchRain } = useRainRecords();
  const { records: loadingRecords, loading: loadingLoadings, refetch: refetchLoadings } = useLoadingRecords();
  const { records: materialRecords, loading: loadingMaterials, refetch: refetchMaterials } = useMaterialReceipts();
  const { records: equipmentRecords, loading: loadingEquipment, refetch: refetchEquipment } = useEquipment();
  const { data: gestaoTempo, loading: loadingGestaoTempo, refetch: refetchGestaoTempo } = useGestaoTempo();
  const { cargas, loading: loadingCargas, refetch: refetchCargas } = useGestaoTempoCargas();
  const { isRaining, toggleRainAlert } = useRainAlert();
  
  // Estado para modo claro/escuro — para TV forçamos sempre o modo escuro
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // Debug: Log do estado de chuva
  useEffect(() => {
    console.log('🌧️ Estado da chuva no Modo TV:', isRaining);
  }, [isRaining]);
  
  // Forçar tema escuro ao montar o modo TV e salvar no localStorage
  useEffect(() => {
    try {
      setIsDarkMode(true);
      localStorage.setItem('tv-mode-theme', 'dark');
    } catch (e) {
      // ignore
    }
  }, []);

  // Se o usuário não definiu preferência, acompanhar mudanças do sistema
  useEffect(() => {
    let m: MediaQueryList | null = null;
    let handler: ((e: MediaQueryListEvent) => void) | null = null;

    try {
      const saved = localStorage.getItem('tv-mode-theme');
      if (saved) return; // usuário já escolheu, não sobrescrever

      if (typeof window !== 'undefined' && window.matchMedia) {
        m = window.matchMedia('(prefers-color-scheme: dark)');
        handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);

        if (m.addEventListener) {
          m.addEventListener('change', handler as any);
        } else if ((m as any).addListener) {
          (m as any).addListener(handler as any);
        }
      }
    } catch (e) {
      // ignore
    }

    return () => {
      if (!m || !handler) return;
      if (m.removeEventListener) {
        m.removeEventListener('change', handler as any);
      } else if ((m as any).removeListener) {
        (m as any).removeListener(handler as any);
      }
    };
  }, []);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bannerIndex, setBannerIndex] = useState(0);
  const [timerTick, setTimerTick] = useState(0); // Para forçar re-render do cronômetro
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // atualiza a cada 1 minuto
    return () => clearInterval(timer);
  }, []);

  // Timer para atualizar cronômetro a cada 1 minuto
  useEffect(() => {
    const cronometro = setInterval(() => {
      setTimerTick(prev => prev + 1);
    }, 60000); // atualiza a cada 1 minuto
    return () => clearInterval(cronometro);
  }, []);

  // Estado para forçar re-render e atualização automática
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Atualização automática do modo TV a cada 60 segundos sem piscar a tela
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      // Refetch de todos os dados sem recarregar a página
      refetchVehicles?.();
      refetchCotton?.();
      refetchRain?.();
      refetchLoadings?.();
      refetchMaterials?.();
      refetchEquipment?.();
      refetchGestaoTempo?.();
      refetchCargas?.();
      
      console.log('🔄 Auto-refresh executado:', new Date().toLocaleTimeString());
    }, 60000); // atualiza a cada 60 segundos
    
    return () => clearInterval(autoRefresh);
  }, [refetchVehicles, refetchCotton, refetchRain, refetchLoadings, refetchMaterials, refetchEquipment, refetchGestaoTempo, refetchCargas]);

  // Auto-scroll para o card de Gestão de Tempo
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || cargas.length === 0) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels por intervalo (bem devagar)
    const scrollInterval = 50; // ms entre cada movimento

    const autoScroll = setInterval(() => {
      if (scrollContainer) {
        scrollPosition += scrollSpeed;
        
        // Se chegou no final, volta pro início suavemente
        if (scrollPosition >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollTop = scrollPosition;
      }
    }, scrollInterval);

    return () => clearInterval(autoScroll);
  }, [cargas]);

  const getBannerMessages = useCallback(() => {
    const today = getTodayLocalDate(); // Usa a função local
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
      
      // Detalhes específicos de cada material recebido
      todayMaterials.forEach(material => {
        const supplierInfo = material.supplier ? ` | ${material.supplier}` : '';
        messages.push(`📦 ${material.material_type}: ${material.net_weight.toFixed(1)}t${supplierInfo} | ${material.plate}`);
      });
      
      // Por tipo de material (resumo)
      const materialsByType = todayMaterials.reduce((acc: Record<string, number>, m) => {
        acc[m.material_type] = (acc[m.material_type] || 0) + m.net_weight;
        return acc;
      }, {});
      
      Object.entries(materialsByType).forEach(([type, weight]) => {
        const count = todayMaterials.filter(m => m.material_type === type).length;
        messages.push(`� Resumo ${type}: ${count} entregas totalizando ${weight.toFixed(1)}t`);
      });
    }
    
    // Saída de equipamentos
    if (todayEquipment.length === 0) {
      messages.push("🔧 Nenhuma saída de equipamento hoje");
    } else {
      // Mensagem geral de equipamentos
      messages.push(`🔧 ${todayEquipment.length} equipamentos saíram hoje`);
      
      // Detalhes específicos de cada equipamento
      todayEquipment.forEach(equipment => {
        messages.push(`🔧 ${equipment.name} | ${equipment.destination} | ${equipment.purpose || 'Saída'}`);
      });

    }
    
    return messages;
  }, [materialRecords, equipmentRecords]);

  // Banner rotativo para materiais e equipamentos
  useEffect(() => {
    const messages = getBannerMessages();
    if (messages.length === 0) return;
    
    const bannerTimer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % messages.length);
    }, 4000); // muda a cada 4 segundos para acomodar mais informações
    return () => clearInterval(bannerTimer);
  }, [materialRecords, equipmentRecords, getBannerMessages]);

  const loading = loadingVehicles || loadingCotton || loadingRain || loadingLoadings || loadingMaterials || loadingEquipment;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 text-[clamp(1rem,1.5vw,1.3rem)]">
        <Loader2 className="animate-spin mr-3" /> Carregando informações...
      </div>
    );
  }

  const today = new Date();
  const todayStr = getTodayLocalDate(); // Usa a função local
  
  // Calcular início da semana (Segunda-feira)
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Segunda-feira
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // Domingo
  thisWeekEnd.setHours(23, 59, 59, 999);
  
  const thisWeekStartStr = toLocalDateString(thisWeekStart); // CORRIGIDO
  const thisWeekEndStr = toLocalDateString(thisWeekEnd);     // CORRIGIDO
  
  // Início e fim do mês atual
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const thisMonthStartStr = toLocalDateString(thisMonthStart); // CORRIGIDO
  const thisMonthEndStr = toLocalDateString(thisMonthEnd);     // CORRIGIDO
  
  // Início e fim do ano atual
  const thisYearStart = new Date(today.getFullYear(), 0, 1);
  const thisYearEnd = new Date(today.getFullYear(), 11, 31);
  const thisYearStartStr = toLocalDateString(thisYearStart); // CORRIGIDO
  const thisYearEndStr = toLocalDateString(thisYearEnd);     // CORRIGIDO

  // Filtros de carregamento (mesma lógica do Dashboard principal)
  const todayLoadings = loadingRecords;
  
  // FILA: status = 'fila' E sem data de entrada
  const fila = todayLoadings.filter(l => 
    l.status === 'fila' && !l.entry_date
  );
  
  // CARREGANDO (CARD): APENAS status 'carregando' sem exit_date
  const carregandoCard = todayLoadings.filter(l => {
    if (l.exit_date) return false;
    if (l.status === 'carregando') return true;
    return false;
  });
  
  // CARREGANDO (LISTA): status 'carregando' OU 'carregado' de hoje sem exit_date
  const carregando = todayLoadings.filter(l => {
    const todayDateString = getTodayLocalDate();
    
    if (l.exit_date) return false; // Se já saiu, não está mais carregando
    
    // Mostra os que estão carregando
    if (l.status === 'carregando') return true;
    
    // Mostra os carregados de HOJE que ainda não registraram saída
    if (l.status === 'carregado' && l.loaded_at && !l.exit_date) {
      const loadedAtNormalized = l.loaded_at.split('T')[0].split(' ')[0].trim();
      return loadedAtNormalized === todayDateString;
    }
    
    return false;
  });
  
  // AGUARDANDO NF: Removido - agora vai para "Carregando" com alerta
  const aguardandoNF: typeof todayLoadings = [];

  // CONCLUÍDOS (SAÍDA): Apenas caminhões que JÁ SAÍRAM e foram carregados HOJE
  const concluidosSaida = todayLoadings.filter(l => {
    const todayDateString = getTodayLocalDate();
    
    // Caso 1: Tem loaded_at de HOJE (carregado hoje)
    if (l.loaded_at) {
      const loadedAtNormalized = l.loaded_at.split('T')[0].split(' ')[0].trim();
      if (loadedAtNormalized === todayDateString) {
        return true; // Carregou hoje = Concluído (mesmo sem exit_date)
      }
      // Se loaded_at NÃO é de hoje, não mostra
      return false;
    }
    
    // Caso 2: NÃO tem loaded_at (registros antigos) - mostra se saiu hoje
    if (l.exit_date) {
      const exitDateNormalized = l.exit_date.split('T')[0].split(' ')[0].trim();
      return exitDateNormalized === todayDateString;
    }
    
    return false;
  });

  // NOVO: Total de concluídos para o card principal (soma aguardando NF + saídos)
  const totalConcluidosHoje = aguardandoNF.length + concluidosSaida.length;

  // Estatísticas de carregamento por produto
  const produtosFixos = ["PLUMA", "CAROÇO", "FIBRILHA", "BRIQUETE"];
  const produtosOpcionais = ["RECICLADOS", "CAVACO", "OUTROS"];
  
  // Produtos opcionais que tiveram movimentação no dia
  const produtosComMovimentacao = produtosOpcionais.filter(produto => {
    const filaCount = fila.filter(l => l.product.toUpperCase() === produto).length;
    const carregandoCount = carregando.filter(l => l.product.toUpperCase() === produto).length;
    const aguardandoNFCount = aguardandoNF.filter(l => l.product.toUpperCase() === produto).length;
    const concluidosSaidaCount = concluidosSaida.filter(l => l.product.toUpperCase() === produto).length;
    return filaCount > 0 || carregandoCount > 0 || aguardandoNFCount > 0 || concluidosSaidaCount > 0;
  });
  
  // Lista final de produtos
  const produtosParaExibir = [...produtosFixos, ...produtosComMovimentacao];
  
  console.log('🎯 PRODUTOS PARA EXIBIR:', produtosParaExibir);
  console.log('📦 Produtos Fixos:', produtosFixos);
  console.log('📦 Produtos com Movimentação:', produtosComMovimentacao);

  // Rolos puxados hoje
  const todayRolls = cottonPullRecords?.filter(r => r.date === todayStr) || [];

  // Estatísticas de chuva - corrigido para respeitar as datas corretas
  const chuvaHoje = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) === todayStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  const chuvaSemana = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) && convertIsoToLocalDateString(r.date)! >= thisWeekStartStr && convertIsoToLocalDateString(r.date)! <= thisWeekEndStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  const chuvaMes = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) && convertIsoToLocalDateString(r.date)! >= thisMonthStartStr && convertIsoToLocalDateString(r.date)! <= thisMonthEndStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  const chuvaAno = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) && convertIsoToLocalDateString(r.date)! >= thisYearStartStr && convertIsoToLocalDateString(r.date)! <= thisYearEndStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  
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
    .sort((a, b) => b.viagens - a.viagens)
    .slice(0, 10);

  // Verificar quais caminhões estão na algodoeira agora
  const trucksInAlgodoeira = new Set(
    cottonPullRecords
      ?.filter(r => r.entry_time && !r.exit_time)
      .map(r => r.plate) || []
  );

  // Função para calcular tempo na algodoeira (em minutos)
  const calculateTimeInAlgodoeira = (plate: string): number | null => {
    const record = cottonPullRecords?.find(r => r.plate === plate && r.entry_time && !r.exit_time);
    if (!record || !record.entry_time) return null;

    // Se tem parada_puxe, não calcular tempo (retorna null para não mostrar cronômetro)
    if (record.parada_puxe) return null;

    const now = new Date();
    const [hours, minutes] = record.entry_time.split(':').map(Number);
    const entryTime = new Date();
    entryTime.setHours(hours, minutes, 0, 0);

    const diffMs = now.getTime() - entryTime.getTime();
    return Math.floor(diffMs / (1000 * 60)); // retorna em minutos
  };

  // Função para formatar tempo (minutos para horas se > 60)
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  // Função para renderizar cronômetro com cor baseada no tempo
  const renderCronometro = (minutes: number) => {
    const timeFormatted = formatTime(minutes);
    const pct24 = Math.min(100, Math.round((minutes / 24) * 100));

    const status = minutes < 20 ? { color: 'text-green-500', label: `🕒 ${timeFormatted} na unidade` }
      : minutes < 30 ? { color: 'text-yellow-500', label: `⚠️ Lentidão Descarga (${timeFormatted})` }
      : { color: 'text-red-600', label: `⛔ Descarga Atrasada (${timeFormatted})`, pulse: true };

    return (
      <div className="mt-2">
        <div className={`text-[clamp(0.6rem,0.85vw,0.75rem)] font-medium flex items-center gap-1 ${status.color} ${status.pulse ? 'animate-pulse' : ''}`}>
          {status.label}
        </div>

        {/* Progress bar: track fills full width representing 24 minutes */}
        <div className="mt-2 w-full h-2 rounded-full bg-[#0b0f12] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct24}%`,
              background: minutes >= 30 ? 'linear-gradient(90deg,#ff6b6b,#ff3b3b)' : minutes >= 20 ? 'linear-gradient(90deg,#ffd166,#ffb347)' : 'linear-gradient(90deg,#7ef9a6,#00ffb3)'
            }}
          />
        </div>
      </div>
    );
  };

  // Helper para capitalizar (Primeira letra maiúscula, demais minúsculas)
  const toTitleCase = (s?: string | null) => {
    if (!s) return '';
    return String(s)
      .toLowerCase()
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

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
    .sort((a, b) => (b.viagens || 0) - (a.viagens || 0))
    .slice(0, 10);

  // Total de rolos puxados hoje (para exibir no título HOJE)
  const totalRolosHoje = rankingDiaArray.reduce((sum, item) => sum + (item.rolos || 0), 0);

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
        gap: 'gap-[clamp(1rem, 1.6vw, 2.2rem)]',
        minHeight: 'min-h-[clamp(5rem, 15vh, 12rem)]'
      };
    } else if (totalCards <= 3) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(240px, 30vw, 600px), 1fr))',
        textSize: 'text-[clamp(0.7rem, 1.4vw, 1.6rem)]',
        titleSize: 'text-[clamp(0.9rem, 1.7vw, 2rem)]',
        cardTitleSize: 'text-[clamp(1.1rem, 2vw, 2.5rem)]',
        padding: 'p-[clamp(0.6rem, 1.2vw, 1.8rem)]',
        gap: 'gap-[clamp(0.8rem, 1.4vw, 2rem)]',
        minHeight: 'min-h-[clamp(4rem, 12vh, 10rem)]'
      };
    } else if (totalCards <= 4) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(200px, 22vw, 500px), 1fr))',
        textSize: 'text-[clamp(0.6rem, 1.2vw, 1.4rem)]',
        titleSize: 'text-[clamp(0.8rem, 1.5vw, 1.8rem)]',
        cardTitleSize: 'text-[clamp(1rem, 1.8vw, 2.2rem)]',
        padding: 'p-[clamp(0.5rem, 1.1vw, 1.6rem)]',
        gap: 'gap-[clamp(0.7rem, 1.3vw, 1.8rem)]',
        minHeight: 'min-h-[clamp(3.5rem, 10vh, 8rem)]'
      };
    } else if (totalCards <= 6) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(160px, 16vw, 400px), 1fr))',
        textSize: 'text-[clamp(0.5rem, 1vw, 1.2rem)]',
        titleSize: 'text-[clamp(0.7rem, 1.3vw, 1.6rem)]',
        cardTitleSize: 'text-[clamp(0.9rem, 1.5vw, 1.9rem)]',
        padding: 'p-[clamp(0.4rem, 0.9vw, 1.3rem)]',
        gap: 'gap-[clamp(0.6rem, 1.1vw, 1.5rem)]',
        minHeight: 'min-h-[clamp(3rem, 8vh, 6rem)]'
      };
    } else {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(130px, 12vw, 300px), 1fr))',
        textSize: 'text-[clamp(0.4rem, 0.8vw, 1rem)]',
        titleSize: 'text-[clamp(0.6rem, 1.1vw, 1.4rem)]',
        cardTitleSize: 'text-[clamp(0.8rem, 1.3vw, 1.7rem)]',
        padding: 'p-[clamp(0.3rem, 0.7vw, 1rem)]',
        gap: 'gap-[clamp(0.5rem, 0.9vw, 1.2rem)]',
        minHeight: 'min-h-[clamp(2.5rem, 6vh, 5rem)]'
      };
    }
  };

  const classes = getResponsiveClasses();
  const infoLevel = totalCards <= 4 ? 'low' : totalCards <= 6 ? 'medium' : 'high';

  // --- DEBUGGING LOGS ---
  console.log('--- DashboardPortariaTV Debug ---');
  console.log('Today (local):', todayStr);
  console.log('Week Range:', thisWeekStartStr, '-', thisWeekEndStr);
  console.log('Month Range:', thisMonthStartStr, '-', thisMonthEndStr);
  console.log('Year Range:', thisYearStartStr, '-', thisYearEndStr);
  console.log('Global Counts:');
  console.log('  Fila:', fila.length);
  console.log('  Carregando:', carregando.length);
  console.log('  Aguardando NF (global):', aguardandoNF.length);
  console.log('  Concluídos (Saída - global):', concluidosSaida.length);
  console.log('  Total Concluídos (top card):', totalConcluidosHoje); // Usando a nova variável
  console.log('---------------------------------');

  // Agrupar cargas por placa para o layout de cards da Gestão de Tempo
  const gestaoByPlate: Record<string, any[]> = (cargas || []).reduce((acc: Record<string, any[]>, g: any) => {
    const placa = g.placa || g.plate || g.placa?.toString();
    if (!placa) return acc;
    if (!acc[placa]) acc[placa] = [];
    acc[placa].push(g);
    return acc;
  }, {});

  // acumulado mensal removido conforme solicitado — mantenho apenas dados diários na Gestão

  // Puxando Hoje: registros ativos na algodoeira (entrada sem saída)
  const puxandoHojeRecords = (cottonPullRecords || []).filter(r => r.entry_time && !r.exit_time);
  const puxandoHojeFirst = puxandoHojeRecords && puxandoHojeRecords.length > 0 ? puxandoHojeRecords[0] : null;
  // Agregar múltiplas fazendas e talhões se houver mais de uma
  const puxandoFazendas = (puxandoHojeRecords || []).map(r => r.fazenda || r.farm || r.fazenda_nome || r.farmName || '').filter(Boolean);
  const uniqueFazendas = Array.from(new Set(puxandoFazendas));
  const puxandoFazenda = uniqueFazendas.length > 0 ? uniqueFazendas.join(', ') : '-';

  const puxandoTalhoes = (puxandoHojeRecords || []).map(r => r.talhao || r.plot || r.talhao_nome || '').filter(Boolean);
  const uniqueTalhoes = Array.from(new Set(puxandoTalhoes));
  const puxandoTalhao = uniqueTalhoes.length > 0 ? uniqueTalhoes.join(', ') : '-';

  // Médias de tempo (Hoje) para Gestão de Tempo - cálculo a partir de `cargas`
  const cargasHoje = (cargas || []).filter(g => {
    if (!g) return false;
    if (!g.date) return true; // incluir se não existir data
    return String(g.date).startsWith(todayStr);
  });

  const avgAlgodoeiraMinutes = cargasHoje.length > 0 ? Math.round(cargasHoje.reduce((s, it) => s + (Number(it.tempo_algodoeira ?? it.t_algodoeira ?? it.tempo_algodadeira ?? 0) || 0), 0) / cargasHoje.length) : 0;
  const avgLavouraMinutes = cargasHoje.length > 0 ? Math.round(cargasHoje.reduce((s, it) => s + (Number(it.tempo_lavoura ?? it.t_lavoura ?? it.tempo_lavoura ?? 0) || 0), 0) / cargasHoje.length) : 0;

  // Dominant stage for header (used to show single icon + time)
  const dominantIsAlg = (avgAlgodoeiraMinutes || 0) >= (avgLavouraMinutes || 0);
  const dominantTime = dominantIsAlg ? avgAlgodoeiraMinutes : avgLavouraMinutes;

  // Materiais e equipamentos do dia (usados para o novo card abaixo do Ranking)
  const todayMaterials = (materialRecords || []).filter(m => {
    const d = m.date || m.received_at || m.inserted_at || m.created_at;
    return d === todayStr || (typeof d === 'string' && convertIsoToLocalDateString(d) === todayStr);
  });

  const todayEquipmentOut = (equipmentRecords || []).filter(e => {
    const d = e.date || e.out_date || e.departure_date || e.exit_date || e.created_at;
    return d === todayStr || (typeof d === 'string' && convertIsoToLocalDateString(d) === todayStr);
  });

  const awaitingReturn = (equipmentRecords || []).filter(e => {
    // considerar equipamentos que têm data de saída/partida e ainda não registraram retorno
    const out = e.out_date || e.departure_date || e.date || e.exit_date || e.created_at;
    const returned = e.return_date || e.returned_at || e.arrival_date || e.returned;
    return !!out && !returned;
  });


  // Debugging específico para Pluma e Caroço Aguardando NF
  console.log('\n--- DEBUG: Aguardando NF por Produto ---');
  ['PLUMA', 'CAROÇO'].forEach(productName => {
    const aguardandoNFForProduct = aguardandoNF.filter(l => l.product.toUpperCase() === productName);
    console.log(`  ${productName} - Aguardando NF: ${aguardandoNFForProduct.length}`);
    aguardandoNFForProduct.forEach(item => {
      console.log(`    - Placa: ${item.plate}, Status: ${item.status}, Loaded_at: ${item.loaded_at}, Loaded_date_local: ${convertIsoToLocalDateString(item.loaded_at)}`);
    });
  });
  console.log('---------------------------------------');


  return (
    <ControleGuaritaFitScreen>
      <div className={`fixed inset-0 w-screen h-screen flex flex-col overflow-y-auto transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#0a0a0a] text-foreground' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {/* HEADER - Fluido e Responsivo */}
        <header className={`relative flex flex-wrap items-center justify-between gap-2 backdrop-blur-sm border-b px-[clamp(0.5rem,2vw,3rem)] py-2 sm:py-3 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-black/70 border-emerald-600/30' 
            : 'bg-white/80 border-emerald-500/40'
        }`}>
          {/* Animação de chuva no header */}
          {isRaining && <RainHeaderAnimation />}
          
          <div className="relative z-10 flex items-center gap-2">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-[clamp(2rem,3vw,3.5rem)] w-auto cursor-pointer hover:scale-105 transition-transform duration-300" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Clique para ativar modo claro' : 'Clique para ativar modo escuro'}
            />
            <div>
              <h1 className={`text-[clamp(1rem,2vw,1.8rem)] font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>Gestao Guarita</h1>
              <p className={`text-[clamp(0.7rem,1.2vw,1rem)] transition-colors duration-300 ${
                isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
              }`}>IBA Santa Luzia</p>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            {/* Indicador de Chuva dentro de um único card: ícone + 'chuva' abaixo, valores H/M ao lado */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: isDarkMode ? '#101B17' : '#ECF4F1', border: `1px solid ${isDarkMode ? '#1E2A33' : '#B4D1C2'}` }}>
              <div className="flex flex-col items-center">
                <Droplet size={16} className={`text-blue-400 ${isRaining ? 'animate-pulse' : ''}`} />
                <div className="text-[0.72rem] text-blue-300 mt-1">chuva</div>
              </div>

              <div className={`flex flex-col text-[clamp(0.65rem,0.85vw,0.85rem)] font-normal ${isDarkMode ? 'text-muted-foreground' : 'text-gray-600'}`}>
                <div>H - {Math.round(chuvaHoje)} mm</div>
                <div>M - {Math.round(chuvaMes)} mm</div>
              </div>
            </div>
            
            {/* Data e Hora */}
            <div className="text-right whitespace-nowrap">
              <p className={`text-[clamp(0.7rem,1vw,0.9rem)] hidden sm:block transition-colors duration-300 ${
                isDarkMode ? 'text-muted-foreground' : 'text-gray-600'
              }`}>
                {currentTime.toLocaleDateString('pt-BR')}
              </p>
              <p className={`text-[clamp(0.8rem,1.3vw,1.1rem)] font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {currentTime.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </header>

        {/* BANNER MATERIAIS RECEBIDOS (verde) */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 text-white px-[clamp(0.5rem,2vw,3rem)] py-1">
          <div className="w-full">
            <div className="animate-pulse text-center font-semibold text-[clamp(0.7rem,1.1vw,1rem)]">
              {/* Banner removido: materiais agora aparecem em card abaixo do Ranking */}
            </div>
          </div>
        </div>
        {/* LAYOUT AJUSTADO - COLUNA PRODUTOS | RANKING CENTRAL | GESTAO DIREITA */}
          <section className="px-[clamp(0.5rem,1.5vw,1.5rem)] py-[clamp(0.3rem,0.8vw,0.8rem)] w-full max-w-full overflow-x-hidden">
          <div className="w-full max-w-full grid grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(280px,420px)] gap-6">
            {/* COLUNA ESQUERDA - PRODUTOS */}
            <div className="flex flex-col gap-4">
              {produtosFixos.map((produto) => {
                const filaItems = fila.filter(l => l.product.toUpperCase() === produto);
                const carregandoListaItems = carregando.filter(l => l.product.toUpperCase() === produto);
                const aguardandoNFItems = aguardandoNF.filter(l => l.product.toUpperCase() === produto);
                const concluidosSaidaItems = concluidosSaida.filter(l => l.product.toUpperCase() === produto);

                return (
                  <Card key={produto} className="bg-[#161B22] border border-[#1E2A33] rounded-2xl shadow-[0_0_15px_#00C2FF20] p-4">
                    <CardContent>
                      <h2 className="text-lg font-semibold uppercase mb-1" style={{
                        color: produto === 'PLUMA' ? '#00C2FF' : produto === 'CAROÇO' ? '#FFC300' : produto === 'FIBRILHA' ? '#0096FF' : '#FF6B00'
                      }}>{produto}</h2>

                      <p className="text-sm text-[#8B949E] mb-1 font-medium">
                        {produto === 'PLUMA' || produto === 'FIBRILHA'
                          ? `${(filaItems.reduce((s, it) => s + (it.bales || 0), 0) + carregandoListaItems.reduce((s, it) => s + (it.bales || 0), 0) + aguardandoNFItems.reduce((s, it) => s + (it.bales || 0), 0) + concluidosSaidaItems.reduce((s, it) => s + (it.bales || 0), 0)).toLocaleString('pt-BR')} Fardos`
                          : `${(filaItems.reduce((s, it) => s + (it.weight || 0), 0) + carregandoListaItems.reduce((s, it) => s + (it.weight || 0), 0) + aguardandoNFItems.reduce((s, it) => s + (it.weight || 0), 0) + concluidosSaidaItems.reduce((s, it) => s + (it.weight || 0), 0)).toLocaleString('pt-BR')} KG`}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="flex flex-col items-center text-sm">
                          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-transparent text-[0.85rem] text-white">{filaItems.length}</div>
                          <div className="text-[0.75rem] text-[#F1C40F] mt-1 truncate">Fila</div>
                        </div>
                        <div className="flex flex-col items-center text-sm">
                          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-transparent text-[0.85rem] text-white">{carregandoListaItems.length}</div>
                          <div className="text-[0.75rem] text-[#00C2FF] mt-1 truncate">Carregando</div>
                        </div>
                        <div className="flex flex-col items-center text-sm">
                          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-transparent text-[0.85rem] text-white">{aguardandoNFItems.length + concluidosSaidaItems.length}</div>
                          <div className="text-[0.75rem] text-[#2ECC71] mt-1 truncate">Concluídos</div>
                        </div>
                      </div>

                      <div className="text-xs text-[#8B949E] leading-tight mt-3 space-y-1">
                        {(carregandoListaItems.slice(0, 2)).map((x, idx) => {
                          if (!x) {
                            return (
                              <div key={`empty-${idx}`} className="inline-flex items-center gap-2 opacity-50 mb-1">
                                <Truck size={14} className="opacity-60" />
                                <span className="text-[0.78rem] text-[#55786B]">—</span>
                              </div>
                            );
                          }

                          const truckTypeRaw = x.tipo_caminhao || x.truck_type || x.tipo || x.vehicle_type || x.type || null;
                          const carrierRaw = x.transportadora || x.carrier || x.transport || x.transport_company || x.empresa || null;
                          const truckType = toTitleCase(truckTypeRaw as string | null);
                          const carrier = toTitleCase(carrierRaw as string | null);

                          return (
                            <div key={x.id || `c-${idx}`} className="inline-flex items-center gap-2 mb-1">
                              <Truck size={14} className="opacity-90" />
                              <span className="text-[0.78rem] text-[#A8D6C4] font-medium">{truckType || (x.plate ?? '-')}</span>
                              {carrier ? <span className="text-[0.72rem] text-[#8B949E]">· {carrier}</span> : null}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* CENTRO - RANKING (modern card layout) */}
            <div className="flex flex-col items-start justify-start min-w-0">
              <Card className="w-full bg-[#161B22] border border-[#1E2A33] rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_18px_#00FFB320] text-white backdrop-blur-md">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[#00C2FF] text-base font-semibold">Ranking Puxe Lavoura</h3>
                  <div className="text-right text-[0.85rem]">
                    <div className="flex items-center justify-end gap-2">
                      <div className="relative inline-flex items-center">
                        <Leaf size={16} className="text-emerald-400" />
                        <span className="absolute -top-1 -right-2 w-3 h-3 bg-yellow-400 rounded-full border border-white/20" />
                      </div>
                      <div className="text-emerald-300 font-medium">Puxando Hoje</div>
                    </div>
                    <div className="text-white font-semibold"><span className="text-[#93A6B0]">Fazenda:&nbsp;</span>{puxandoHojeRecords.length > 0 ? puxandoFazenda : '—'}</div>
                    <div className="text-emerald-300"><span className="text-[#93A6B0]">Talhão:&nbsp;</span>{puxandoHojeRecords.length > 0 ? puxandoTalhao : '—'}</div>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-[#0b0f12] p-3 rounded-xl border border-[#11161a] flex items-center justify-between min-h-[3.5rem]">
                    <div className="text-xs text-emerald-300 font-medium">Hoje</div>
                    <div className="ml-2 text-lg font-semibold text-white">{totalRolosHoje.toLocaleString('pt-BR')} rolos</div>
                  </div>
                  <div className="flex-1 bg-[#0b0f12] p-2 rounded-xl border border-[#11161a] flex items-center justify-between">
                    <div className="text-xs text-emerald-300 font-medium">Mês</div>
                    <div className="ml-2 text-lg font-semibold text-white">{rankingMesArray.reduce((s, r) => s + (r.rolos || 0), 0).toLocaleString('pt-BR')} rolos</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                    {rankingDiaArray.map((item, index) => {
                      const isInAlgodoeira = trucksInAlgodoeira.has(item.plate);
                      const record = cottonPullRecords?.find(r => r.plate === item.plate && r.entry_time && !r.exit_time);
                      const hasParadaPuxe = record?.parada_puxe === true;
                      const timeInAlgodoeira = isInAlgodoeira && !hasParadaPuxe ? calculateTimeInAlgodoeira(item.plate) : null;

                      return (
                        <div key={item.plate} style={isInAlgodoeira && !hasParadaPuxe ? { animation: 'pulse 3.5s infinite' } : undefined} className={`backdrop-blur-md rounded-xl p-2 flex items-start gap-2 hover:shadow-[0_8px_20px_rgba(0,194,255,0.08)] transition-all duration-300 ${isInAlgodoeira && !hasParadaPuxe ? 'bg-orange-600/20 border border-orange-400' : 'bg-black/40 border border-[#1E2A33]'}`}>
                          <div className={`flex-none w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-gray-200 text-black' : index === 2 ? 'bg-orange-400 text-black' : 'bg-emerald-600/30 text-emerald-50'
                          }`}>
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`text-white text-[0.95rem] font-medium tracking-tight ${isInAlgodoeira && !hasParadaPuxe ? 'animate-pulse text-yellow-300' : ''}`}>{item.driver ? toTitleCase(item.driver) : item.plate}</div>
                                <div className="text-[0.7rem] text-emerald-300 mt-1">{item.plate}</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-semibold ${isInAlgodoeira ? 'text-yellow-300' : 'text-emerald-400'}`}>{item.rolos.toLocaleString('pt-BR')}</div>
                                <div className="text-[0.75rem] text-yellow-400 mt-1">{item.viagens} viagens</div>
                              </div>
                            </div>

                            {hasParadaPuxe && <div className="mt-2 text-sm italic text-muted-foreground">⏸️ Parada Puxe</div>}

                            {isInAlgodoeira && timeInAlgodoeira !== null && !hasParadaPuxe && (
                              <div className="mt-2">
                                {renderCronometro(timeInAlgodoeira)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                    {rankingMesArray.map((r, i) => (
                      <div key={r.plate} className="bg-black/40 backdrop-blur-md border border-[#1E2A33] rounded-xl p-2 flex items-center justify-between hover:shadow-[0_8px_20px_rgba(0,194,255,0.06)] transition-all duration-300">
                          <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-gray-200 text-black' : i === 2 ? 'bg-orange-400 text-black' : 'bg-emerald-600/30 text-emerald-50'
                          }`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </div>

                          <div className="min-w-0 flex-1 px-2">
                            <div className="text-white text-sm font-semibold truncate">{r.driver ? toTitleCase(r.driver) : r.plate}</div>
                            <div className="text-[0.7rem] text-emerald-300 truncate">{r.plate}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-[#00FFB3] font-semibold text-sm">{r.rolos.toLocaleString('pt-BR')} rolos</div>
                            <div className="text-[0.75rem] text-yellow-400 mt-1">{r.viagens || 0} viagens</div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </Card>

            {/* Novo card: Materiais e Equipamentos (Hoje) - mesmo padrão do Ranking */}
            <div className="flex items-start justify-start mt-3 w-full max-w-full">
              <Card className="w-full max-w-full bg-[#161B22] border border-[#1E2A33] rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#FF9F1C] font-semibold">Materiais e Equipamentos (Hoje)</h4>
                  <div className="text-[0.8rem] text-emerald-300">{todayStr}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-emerald-300 mb-1">Materiais Recebidos</div>
                    <div className="space-y-1 max-h-[18vh] overflow-y-auto pr-2">
                      {todayMaterials.length === 0 && <div className="text-[0.85rem] text-[#55786B]">— Nenhum material recebido hoje</div>}
                      {todayMaterials.map((m: any, i: number) => (
                        <div key={m.id || i} className="flex items-center justify-between gap-2 text-[0.82rem] text-[#A8D6C4]">
                          <div className="truncate mr-2">
                            <span className="font-medium text-white">{toTitleCase(m.material_type || m.material || '-')}</span>
                            {m.supplier ? <span className="text-[#93A6B0]"> · {toTitleCase(m.supplier)}</span> : null}
                            {m.plate ? <span className="text-[#93A6B0]"> · {m.plate}</span> : null}
                          </div>
                          <div className="ml-1 text-white min-w-[3.2rem] text-right">{(m.net_weight || m.weight || 0).toLocaleString('pt-BR')}</div>
                        </div>
                      ))}

                      {/* 'Equipamentos Aguardando Retorno' removed as requested */}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs text-emerald-300 mb-1">Equipamentos - Saída</div>
                    <div className="space-y-1 max-h-[28vh] overflow-y-auto pr-2">
                      {todayEquipmentOut.length === 0 && <div className="text-[0.85rem] text-[#55786B]">— Nenhuma saída hoje</div>}
                      {todayEquipmentOut.map((e: any, i: number) => (
                        <div key={e.id || i} className="flex items-center justify-between gap-2 text-[0.82rem] text-[#A8D6C4]">
                          <div className="truncate mr-2">
                            <span className="font-medium text-white">{toTitleCase(e.name || e.equipment || '-')}</span>
                            {e.destination ? <span className="text-[#93A6B0]"> · {toTitleCase(e.destination)}</span> : null}
                          </div>
                          <div className="ml-1 text-[#E6F8F2] min-w-[3.2rem] text-right">{e.purpose || e.purpose || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            </div>

            {/* DIREITA - GESTÃO DE TEMPO (cards agrupados por placa) */}
            <div className="flex flex-col min-w-0">
              <div className="bg-[#161B22] border border-[#1E2A33] rounded-2xl p-5 pt-5 overflow-y-auto text-white min-h-[44vh] shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_18px_#00FFB320] backdrop-blur-md">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[#00C2FF] text-base font-semibold leading-tight">Gestão de Tempo</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1 mr-0">
                      <div className="flex items-center gap-2 text-orange-400 text-sm">
                        <Factory size={16} className="text-orange-400" />
                        <span className="font-medium">Algodoeira</span>
                        <span className="text-white font-semibold text-sm ml-2">{cargasHoje.length ? formatTime(avgAlgodoeiraMinutes) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-pink-500 text-sm">
                        <Leaf size={16} className="text-pink-500" />
                        <span className="font-medium">Lavoura</span>
                        <span className="text-white font-semibold text-sm ml-2">{cargasHoje.length ? formatTime(avgLavouraMinutes) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hoje - Cards por placa (stacked vertically for better TV visualization) */}
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(gestaoByPlate).map(([placa, trips]) => {
                    const totalRolosForPlate = (trips || []).reduce((s: number, it: any) => s + (Number(it.qtd_rolos ?? it.rolos ?? 0) || 0), 0);
                    return (
                    <div key={placa} className="w-full bg-transparent border-l-4 border-emerald-500/60 rounded-2xl p-2 py-3 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_20px_rgba(0,255,179,0.06)] h-auto overflow-visible">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <div className="text-base font-semibold text-[#00C2FF]">🚛 {placa}</div>
                          <div className="text-xs text-emerald-300">{toTitleCase(trips[0]?.motorista || trips[0]?.driver || '—')}</div>
                        </div>
                        <div className="text-xs text-emerald-300">{trips.length} viagens · {totalRolosForPlate.toLocaleString('pt-BR')} rolos</div>
                      </div>

                      {/* Layout: left column = 1º (top) + 2º/3º (below); right column = 4,5,6 stacked */}
                      <div className="grid grid-cols-2 gap-3 py-1 auto-rows-min">
                        <div className="flex flex-col gap-2">
                          {/* 1st trip */}
                          {trips[0] && (() => {
                            const t = trips[0];
                            const talhao = t.talhao || t.talhao_nome || t.talhao_id || t.plot || '-';
                            const rolos = Number(t.qtd_rolos ?? t.rolos ?? 0) || 0;
                            const tAlg = Number(t.tempo_algodadeira ?? t.tempo_algodoeira ?? t.t_algodadeira ?? t.tempo_algodadora ?? t.tempo_algodoeira ?? 0) || Number(t.tempo_algodoeira ?? t.t_algodoeira ?? 0) || 0;
                            const tLav = Number(t.tempo_lavoura ?? t.t_lavoura ?? 0) || 0;
                            const tTotal = Number(t.tempo_total ?? t.total ?? (tAlg + tLav)) || (tAlg + tLav);
                            const timeColor = (tAlg || 0) > (tLav || 0) ? 'text-orange-400' : 'text-pink-500';

                              return (
                              <div key={`t0-${placa}`} className={`bg-black/30 border border-[#16232a] rounded-lg p-3 mb-2 overflow-visible h-auto pb-3 w-full pr-3` }>
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-yellow-400 whitespace-nowrap">1º</span>
                                  </div>

                                  <div className="flex items-center gap-3 whitespace-nowrap">
                                      <div className="flex items-center gap-2 px-3 py-1 leading-tight">
                                        <Leaf size={16} className="text-pink-500" />
                                        <span className="text-[0.75rem] text-pink-500 whitespace-nowrap">{formatTime(tLav)}</span>
                                      </div>

                                      <div className="flex items-center gap-2 px-3 py-1 leading-tight">
                                        <Factory size={16} className="text-orange-400" />
                                        <span className="text-[0.75rem] text-orange-400 whitespace-nowrap">{formatTime(tAlg)}</span>
                                      </div>
                                    </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* 2nd & 3rd trips stacked */}
                          <div className="space-y-2">
                            {trips.slice(1,3).map((t: any, i: number) => {
                              const idx = i + 2;
                              const talhao = t.talhao || t.talhao_nome || t.talhao_id || t.plot || '-';
                              const tAlg = Number(t.tempo_algodadeira ?? t.tempo_algodoeira ?? 0) || 0;
                              const tLav = Number(t.tempo_lavoura ?? 0) || 0;
                              const tTotal = Number(t.tempo_total ?? (tAlg + tLav)) || (tAlg + tLav);
                              const timeColor = (tAlg || 0) > (tLav || 0) ? 'text-orange-400' : 'text-pink-500';

                              return (
                                <div key={`t${idx}-${placa}`} className="bg-black/20 border border-[#16232a] rounded-lg p-2 h-auto overflow-visible pr-3 w-full">
                                  <div className="flex items-center justify-between gap-2 w-full">
                                      <span className="text-[0.75rem] font-medium text-yellow-400 whitespace-nowrap">{idx}º</span>
                                      <div className="flex items-center gap-2 px-3 py-1 leading-tight">
                                        <Leaf size={16} className="text-pink-500" />
                                        <span className="text-[0.75rem] text-pink-500 whitespace-nowrap">{formatTime(tLav)}</span>
                                      </div>

                                      <div className="flex items-center gap-2 px-3 py-1 leading-tight">
                                        <Factory size={16} className="text-orange-400" />
                                        <span className="text-[0.75rem] text-orange-400 whitespace-nowrap">{formatTime(tAlg)}</span>
                                      </div>
                                    </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* right column: trips 4,5,6 stacked */}
                        <div className="flex flex-col gap-2">
                          {trips.slice(3,6).length === 0 && <div className="text-[0.85rem] text-[#55786B]">—</div>}
                          {trips.slice(3,6).map((t: any, i: number) => {
                            const idx = i + 4;
                            const talhao = t.talhao || t.talhao_nome || t.talhao_id || t.plot || '-';
                            const tAlg = Number(t.tempo_algodadeira ?? t.tempo_algodoeira ?? 0) || 0;
                            const tLav = Number(t.tempo_lavoura ?? 0) || 0;
                            const tTotal = Number(t.tempo_total ?? (tAlg + tLav)) || (tAlg + tLav);
                            const timeColor = (tAlg || 0) > (tLav || 0) ? 'text-orange-400' : 'text-pink-500';

                            return (
                              <div key={`t${idx}-${placa}`} className="bg-black/20 border border-[#16232a] rounded-lg p-2 h-auto overflow-visible pr-3 w-full">
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <span className="text-[0.75rem] font-medium text-yellow-400 whitespace-nowrap">{idx}º</span>
                                  <div className="flex items-center gap-2 px-3 py-1 leading-tight">
                                    <Leaf size={16} className="text-pink-500" />
                                    <span className="text-[0.75rem] text-pink-500 whitespace-nowrap">{formatTime(tLav)}</span>
                                  </div>

                                  <div className="flex items-center gap-2 px-3 py-1 leading-tight">
                                    <Factory size={16} className="text-orange-400" />
                                    <span className="text-[0.75rem] text-orange-400 whitespace-nowrap">{formatTime(tAlg)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Acumulado mensal removido (solicitado) */}
              </div>
            </div>
          </div>
        </section>

      </div>
    </ControleGuaritaFitScreen>
  );
}

export default DashboardPortariaTV;