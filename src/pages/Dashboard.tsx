import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Truck, 
  Package, 
  CloudRain, 
  Settings, 
  FileText, 
  LogOut,
  TrendingUp,
  Users,
  BarChart3,
  Loader2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Container,
  Plus,
  Crown,
  CheckCircle,
  UserPlus,
  Moon,
  Sun
} from "lucide-react";
import { useVehicles, useCottonPull, useRainRecords, useEquipment, useLoadingRecords } from "@/hooks/use-supabase";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";
import { LoadingRecord } from "@/lib/supabase";
import QueueDisplay from "@/components/QueueDisplay";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/BF_logo.png";
import { calculateLoadingTime } from "@/lib/time-utils";

// Função helper para converter texto para Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, loading: loadingVehicles, updateVehicle } = useVehicles();
  const { records: cottonRecords, loading: loadingCotton, updateRecord: updateCottonRecord } = useCottonPull();
  const { records: rainRecords, loading: loadingRain } = useRainRecords();
  const { records: equipmentRecords, loading: loadingEquipment } = useEquipment();
  const { records: loadingRecords, loading: loadingCarregamentos, updateRecord } = useLoadingRecords();
  const { records: materialRecords, loading: loadingMaterials } = useMaterialReceipts();
  
  const [selectedLoading, setSelectedLoading] = useState<LoadingRecord | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'escolher' | 'carregado' | 'saiu'>('escolher');
  const [filtroCarregando, setFiltroCarregando] = useState<string>("Todos");
  const [filtroFila, setFiltroFila] = useState<string>("Todos");
  const { theme, toggleTheme } = useTheme();

  const handleRegisterVehicleExit = async (id: string) => {
    const now = new Date();
    const exitTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await updateVehicle(id, { exit_time: exitTime });
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
    }
  };

  const handleRegisterVehicleReturn = async (id: string) => {
    const now = new Date();
    const entryTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await updateVehicle(id, { entry_time: entryTime });
    } catch (error) {
      console.error('Erro ao registrar retorno:', error);
    }
  };

  const calculatePermanenceTime = (entryTime?: string, exitTime?: string) => {
    if (!entryTime || !exitTime) return "-";
    const [entryH, entryM] = entryTime.split(':').map(Number);
    const [exitH, exitM] = exitTime.split(':').map(Number);
    const totalMinutes = (exitH * 60 + exitM) - (entryH * 60 + entryM);
    if (totalMinutes < 0) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const handleLoadingCardClick = (loading: LoadingRecord) => {
    setSelectedLoading(loading);
    setModalAction('escolher'); // Reset para escolher ação
    setIsManageModalOpen(true);
  };

  // Função para verificar se uma data é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleStartLoading = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLoading) return;

    const formData = new FormData(event.target as HTMLFormElement);
    const entryDate = formData.get('entryDate') as string;
    const entryTime = formData.get('entryTime') as string;

    try {
      await updateRecord(selectedLoading.id, {
        entry_date: entryDate,
        entry_time: entryTime
      });
      
      setIsManageModalOpen(false);
      setSelectedLoading(null);
    } catch (error) {
      console.error('Erro ao iniciar carregamento:', error);
    }
  };

  const handleFinishLoading = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLoading) return;

    const formData = new FormData(event.target as HTMLFormElement);
    const exitDate = formData.get('exitDate') as string;
    const exitTime = formData.get('exitTime') as string;
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const destination = formData.get('destination') as string;
    const client = formData.get('client') as string;
    const weight = formData.get('weight') as string;
    const bales = formData.get('bales') as string;

    // Validação: hora de saída obrigatória para remover da lista
    if (!exitDate || !exitTime) {
      toast({
        title: "Hora de saída obrigatória",
        description: "Para remover da lista, informe a hora de saída.",
        variant: "destructive"
      });
      return;
    }

    // Determinar quais campos enviar baseado no produto
    const updateData: Partial<LoadingRecord> = {
      exit_date: exitDate,
      exit_time: exitTime,
      invoice_number: invoiceNumber || selectedLoading.invoice_number || null,
      destination: destination || selectedLoading.destination,
      client: client || selectedLoading.client || "",
      status: 'concluido' // Com hora de saída = concluído
    };

    // Caroço e Briquete usam peso
    if (selectedLoading.product === 'Caroço' || selectedLoading.product === 'Briquete') {
      if (weight) {
        updateData.weight = parseFloat(weight);
      } else {
        updateData.weight = selectedLoading.weight;
      }
    }
    // Pluma e Fibrilha usam fardos
    else if (selectedLoading.product === 'Pluma' || selectedLoading.product === 'Fibrilha') {
      if (bales) {
        updateData.bales = parseInt(bales);
      } else {
        updateData.bales = selectedLoading.bales;
      }
    }

    try {
      await updateRecord(selectedLoading.id, updateData);
      
      setIsManageModalOpen(false);
      setSelectedLoading(null);
      
      toast({
        title: "Carregamento finalizado!",
        description: `Placa ${selectedLoading.plate} saiu às ${exitTime}`,
      });
    } catch (error) {
      console.error('Erro ao finalizar carregamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o carregamento.",
        variant: "destructive"
      });
    }
  };

  // Função para marcar como carregado sem hora de saída
  const handleMarkAsLoaded = async () => {
    if (!selectedLoading) return;
    
    // Pega valores do formulário
    const invoiceNumber = (document.getElementById("invoiceNumber") as HTMLInputElement)?.value;
    const destination = (document.getElementById("dashDestination") as HTMLInputElement)?.value;
    const client = (document.getElementById("dashClient") as HTMLInputElement)?.value;
    const bales = Number((document.getElementById("bales") as HTMLInputElement)?.value || 0);
    const weight = Number((document.getElementById("weight") as HTMLInputElement)?.value || 0);
    
    const updateData: Partial<LoadingRecord> = {
      status: 'carregado',
      invoice_number: invoiceNumber || selectedLoading.invoice_number || null,
      destination: destination || selectedLoading.destination,
      client: client || selectedLoading.client || "",
      bales: bales || selectedLoading.bales,
      weight: weight || selectedLoading.weight,
    };

    try {
      await updateRecord(selectedLoading.id, updateData);
      setIsManageModalOpen(false);
      setSelectedLoading(null);
      
      toast({
        title: "Marcado como Carregado!",
        description: `Placa ${selectedLoading.plate} - Aguardando hora de saída.`,
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar.",
        variant: "destructive"
      });
    }
  };

  const getProductColor = (product: string) => {
    switch (product) {
      case 'Pluma':
        return 'border-l-yellow-500 bg-yellow-50 text-yellow-800';
      case 'Caroço':
        return 'border-l-amber-600 bg-amber-50 text-amber-800';
      case 'Fibrilha':
        return 'border-l-green-500 bg-green-50 text-green-800';
      case 'Briquete':
        return 'border-l-purple-500 bg-purple-50 text-purple-800';
      case 'Reciclados':
        return 'border-l-blue-500 bg-blue-50 text-blue-800';
      case 'Cavaco':
        return 'border-l-orange-500 bg-orange-50 text-orange-800';
      case 'Outros':
        return 'border-l-pink-500 bg-pink-50 text-pink-800';
      default:
        return 'border-l-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const getQueuePosition = (loading: LoadingRecord) => {
    const sameProductQueue = loadingsFila
      .filter((l: LoadingRecord) => l.product === loading.product)
      .sort((a: LoadingRecord, b: LoadingRecord) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());
    
    const position = sameProductQueue.findIndex((l: LoadingRecord) => l.id === loading.id) + 1;
    return { position, total: sameProductQueue.length };
  };

  const getPositionMessage = (loading: LoadingRecord) => {
    const { position } = getQueuePosition(loading);
    if (position === 1) {
      return `1º da vez - ${loading.product}`;
    } else if (position === 2) {
      return `Próximo da vez - ${loading.product}`;
    }
    return `${position}º na fila - ${loading.product}`;
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleMarkExit = async (cottonPullId: string) => {
    const now = new Date();
    const exitTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await updateCottonRecord(cottonPullId, { exit_time: exitTime });
    } catch (error) {
      console.error('Erro ao registrar saída do algodão:', error);
    }
  };  const modules = [
    {
      title: "Veículos", 
      description: "Entrada e Saída",
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      route: "/vehicles",
    },
    {
      title: "Algodão",
      description: "Puxe de rolos",
      icon: Package,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      route: "/cotton-pull",
    },
    {
      title: "Carregamentos",
      description: "Pluma, Caroço, Fibrilha",
      icon: Container,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      route: "/loading",
    },
    {
      title: "Controle de Chuva",
      description: "Medições pluviométricas",
      icon: CloudRain,
      color: "text-info",
      bgColor: "bg-info/10",
      route: "/rain",
    },
    {
      title: "Saída de Equipamentos",
      description: "Máquinas e peças",
      icon: Settings,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      route: "/equipment",
    },
    {
      title: "Materiais",
      description: "Recebimento de insumos",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      route: "/materials",
    },
    {
      title: "Relatórios",
      description: "Métricas e análises",
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
      route: "/reports",
    },
  ];

  // Calcular estatísticas reais
  const today = new Date().toISOString().split('T')[0];
  const todayVehicles = vehicles.filter(v => v.date === today);
  const allVehicles = vehicles; // TODOS os veículos (histórico completo)
  const todayCarregamentos = todayVehicles.filter(v => v.type === 'Carregamento');
  const todayRolls = cottonRecords
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + r.rolls, 0);
  const todayRain = rainRecords
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + r.millimeters, 0);
  const todayMaterials = materialRecords.filter(m => m.date === today);

  // Estatísticas da nova tabela de carregamentos
  // Usar campo status quando disponível, senão fallback para lógica antiga
  const todayLoadings = loadingRecords.filter(l => l.date === today);
  
  // FILA: TODOS os registros com status 'fila' (independente da data)
  // Ordenar por data+hora de marcação (crescente - primeiro que chegou primeiro)
  const loadingsFila = loadingRecords
    .filter(l => l.status === 'fila' || (!l.status && !l.entry_date))
    .sort((a, b) => {
      const dateTimeA = `${a.date} ${a.time}`;
      const dateTimeB = `${b.date} ${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });
  
  // CARREGANDO: Mostra os que estão em processo (status 'carregando')
  // NÃO mostra os já marcados como 'carregado' (esses vão para Concluídos)
  const loadingsCarregando = loadingRecords.filter(l => {
    // Se já saiu completamente (tem exit_date), não mostra aqui
    if (l.exit_date) return false;
    
    // Se tem status CARREGANDO (não carregado) - MOSTRA
    if (l.status === 'carregando') return true;
    
    // Fallback para registros antigos: tem entry_date mas não tem exit_date e não tem status
    return !l.status && l.entry_date && !l.exit_date;
  });
  
  // CONCLUÍDOS: 
  // 1. Status 'carregado' carregados HOJE → Aguardando Nota
  // 2. Status 'concluido' carregados HOJE → Já saiu
  const loadingsConcluidos = loadingRecords.filter(l => {
    // Carregados HOJE com status 'carregado' (aguardando nota)
    if (l.entry_date === today && l.status === 'carregado') return true;
    // Concluídos HOJE (já saíram)
    if (l.entry_date === today && l.status === 'concluido') return true;
    return false;
  });

  // Apenas veículos (separado dos carregamentos)
  const veiculosFila = todayVehicles.filter(v => !v.exit_time && v.purpose?.toLowerCase().includes('fila'));
  const veiculosProcessando = todayVehicles.filter(v => !v.exit_time && !v.purpose?.toLowerCase().includes('fila'));
  const veiculosConcluidos = todayVehicles.filter(v => v.exit_time);
  
  // Algodão dentro da algodoeira (CottonPull com entry_time mas sem exit_time)
  const algodaoNaAlgodoeira = cottonRecords.filter(c => c.entry_time && !c.exit_time);
  
  // Algodão que já saiu (concluído) hoje
  const algodaoConcluido = cottonRecords.filter(c => 
    c.exit_time && isToday(new Date(c.created_at!))
  );
  
  // Totais APENAS dos carregamentos (não incluir veículos)
  const totalFila = loadingsFila.length;
  const totalCarregando = loadingsCarregando.length;
  const totalConcluidos = loadingsConcluidos.length;

  const stats = [
    { 
      label: "Fila Hoje", 
      value: (loadingVehicles || loadingCarregamentos) ? "..." : totalFila.toString(), 
      icon: Clock, 
      color: "text-orange-600" 
    },
    { 
      label: "Carregando", 
      value: (loadingVehicles || loadingCarregamentos) ? "..." : totalCarregando.toString(), 
      icon: Container, 
      color: "text-blue-600" 
    },
    { 
      label: "Concluídos", 
      value: (loadingVehicles || loadingCarregamentos) ? "..." : totalConcluidos.toString(), 
      icon: TrendingUp, 
      color: "text-green-600" 
    },
    { 
      label: "Total Veículos Embarque", 
      value: (loadingVehicles || loadingCarregamentos) ? "..." : `${totalFila + totalCarregando + totalConcluidos}`, 
      icon: Truck, 
      color: "text-primary" 
    },
    { 
      label: "Rolos Puxados", 
      value: loadingCotton ? "..." : `Hoje: ${todayRolls} | Total: ${cottonRecords.reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR')}`, 
      icon: Package, 
      color: "text-yellow-600" 
    },
    { 
      label: "Chuva", 
      value: loadingRain ? "..." : `Hoje: ${todayRain.toFixed(1)}mm | Total: ${rainRecords.reduce((sum, r) => sum + r.millimeters, 0).toFixed(1)}mm`, 
      icon: CloudRain, 
      color: "text-blue-500" 
    },
  ];

  const username = localStorage.getItem("username") || "Usuário";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-neutral-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-3 flex justify-between items-center bg-white dark:bg-neutral-900 shadow-md sticky top-0 z-50 border-b dark:border-neutral-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? (
              <Moon className="w-full h-full p-4 text-yellow-400" />
            ) : (
              <img 
                src={logo}
                alt="Bom Futuro Logo" 
                className="w-full h-full object-contain"
              />
            )}
          </button>
          <div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold tv-title">Controle Guarita</h1>
            <p className="text-sm text-muted-foreground">IBA Santa Luzia</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Action Modules */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              {modules.map((module, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(module.route)}
                  className="flex flex-col items-center gap-1 p-3 h-auto hover:bg-gray-50"
                >
                  <module.icon className={`w-6 h-6 ${module.color}`} />
                  <span className="text-xs font-medium">{module.title}</span>
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/dashboard-tv', '_blank')}
                className="hidden md:flex items-center gap-1"
              >
                <Truck className="w-4 h-4" />
                <span className="text-xs">Versão TV</span>
              </Button>
              <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline tv-text">
                Olá, <span className="font-semibold text-foreground">
                  {username?.includes('dione') 
                    ? 'Dione' 
                    : username?.split(' ')[0] || username
                  }
                </span>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="mobile-full-btn sm:w-auto">
                <LogOut className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Sair</span>
                <span className="sm:hidden">Exit</span>
              </Button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] flex-1 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8">
        {/* Enhanced Stats Cards with Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Fila Hoje */}
          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Fila Hoje</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {(loadingVehicles || loadingCarregamentos) ? "..." : totalFila}
                    </p>
                  </div>
                </div>
              </div>
              {!loadingCarregamentos && (
                <div className="space-y-1">
                  {['Pluma', 'Caroço', 'Fibrilha', 'Briquete'].map(product => {
                    const count = loadingsFila.filter(l => l.product === product).length;
                    return count > 0 ? (
                      <div key={product} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{product}:</span>
                        <span className="font-medium text-orange-700">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carregando */}
          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Container className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Carregando</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {(loadingVehicles || loadingCarregamentos) ? "..." : totalCarregando}
                    </p>
                  </div>
                </div>
              </div>
              {!loadingCarregamentos && (
                <div className="space-y-1">
                  {['Pluma', 'Caroço', 'Fibrilha', 'Briquete'].map(product => {
                    const count = loadingsCarregando.filter(l => l.product === product).length;
                    return count > 0 ? (
                      <div key={product} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{product}:</span>
                        <span className="font-medium text-blue-700">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Concluídos */}
          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Concluídos</p>
                    <p className="text-3xl font-bold text-green-600">
                      {(loadingVehicles || loadingCarregamentos) ? "..." : totalConcluidos}
                    </p>
                  </div>
                </div>
              </div>
              {!loadingCarregamentos && (
                <div className="space-y-1">
                  {['Pluma', 'Caroço', 'Fibrilha', 'Briquete'].map(product => {
                    const count = loadingsConcluidos.filter(l => l.product === product).length;
                    return count > 0 ? (
                      <div key={product} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{product}:</span>
                        <span className="font-medium text-green-700">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center p-4">
              <Truck className="w-6 h-6 text-primary mr-3" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Veículos Embarque</p>
                <p className="text-xl font-bold">{loadingCarregamentos ? "..." : (totalFila + totalCarregando + totalConcluidos)}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Fila: {totalFila} | Carregando: {totalCarregando} | Concluído: {totalConcluidos}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <Package className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Rolos Puxados</p>
                <p className="text-xl font-bold">{loadingCotton ? "..." : todayRolls}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <CloudRain className="w-6 h-6 text-blue-500 mr-3" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Chuva (mm)</p>
                <p className="text-xl font-bold">{loadingRain ? "..." : todayRain.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Modules Grid (apenas para mobile) */}
        <div className="grid grid-cols-2 gap-3 mb-6 md:hidden">
          {modules.map((module, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex flex-col items-center gap-2 p-4 h-auto"
              onClick={() => navigate(module.route)}
            >
              <module.icon className={`w-6 h-6 ${module.color}`} />
              <div className="text-center">
                <div className="font-medium text-sm">{module.title}</div>
                <div className="text-xs text-muted-foreground">{module.description}</div>
              </div>
            </Button>
          ))}
        </div>



        {/* Detailed Information Section */}
        <div className="space-y-6">
          {/* Algodão - Layout Otimizado */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Veículos na Algodoeira */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-yellow-600" />
                    Na Algodoeira
                  </div>
                  <span className="text-sm font-normal bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    {algodaoNaAlgodoeira.length}
                  </span>
                </CardTitle>
                <CardDescription>
                  Veículos processando algodão
                </CardDescription>
              </CardHeader>
              <CardContent>
                {algodaoNaAlgodoeira.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {algodaoNaAlgodoeira.map((cotton) => (
                      <Card key={cotton.id} className="border-yellow-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{cotton.plate}</p>
                              <p className="text-sm text-muted-foreground">{cotton.driver}</p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleMarkExit(cotton.id)}
                              className="text-xs bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              Marcar Saída
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><span className="font-medium">Produtor:</span> {cotton.producer}</p>
                            <p><span className="font-medium">Fazenda:</span> {cotton.farm}</p>
                            <p><span className="font-medium">Rolos:</span> {cotton.rolls}</p>
                            <p><span className="font-medium">Entrada:</span> {cotton.entry_time}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhum veículo na algodoeira
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Veículos que Concluíram */}
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Concluídos
                  </div>
                  <span className="text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {algodaoConcluido.length}
                  </span>
                </CardTitle>
                <CardDescription>
                  Processamento concluído hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                {algodaoConcluido.length > 0 ? (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="p-2 font-semibold text-left">Placa</th>
                          <th className="p-2 font-semibold text-left">Motorista</th>
                          <th className="p-2 font-semibold text-left">Fazenda</th>
                          <th className="p-2 font-semibold text-left">Talhão</th>
                          <th className="p-2 font-semibold text-center">Rolos</th>
                          <th className="p-2 font-semibold text-left">Entrada</th>
                          <th className="p-2 font-semibold text-left">Saída</th>
                          <th className="p-2 font-semibold text-left">Permanência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {algodaoConcluido
                          .sort((a, b) => new Date(b.exit_time!).getTime() - new Date(a.exit_time!).getTime())
                          .slice(0, 20)
                          .map((cotton) => (
                            <tr key={cotton.id} className="border-b hover:bg-green-50 transition-colors">
                              <td className="p-2 font-medium border border-gray-200">{cotton.plate}</td>
                              <td className="p-2 border border-gray-200 truncate max-w-24">{cotton.driver}</td>
                              <td className="p-2 border border-gray-200 truncate max-w-24">{cotton.farm}</td>
                              <td className="p-2 border border-gray-200">{cotton.talhao || '-'}</td>
                              <td className="p-2 border border-gray-200 font-medium text-center">{cotton.rolls}</td>
                              <td className="p-2 border border-gray-200">{cotton.entry_time || '-'}</td>
                              <td className="p-2 border border-gray-200">{cotton.exit_time || '-'}</td>
                              <td className="p-2 border border-gray-200 text-green-600 font-medium">
                                {cotton.entry_time && cotton.exit_time ? (() => {
                                  try {
                                    const entryTime = new Date(`1970-01-01T${cotton.entry_time}`);
                                    const exitTime = new Date(`1970-01-01T${cotton.exit_time}`);
                                    let diffMs = exitTime.getTime() - entryTime.getTime();
                                    
                                    if (diffMs < 0) {
                                      diffMs += 24 * 60 * 60 * 1000;
                                    }
                                    
                                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                    return `${diffHours}h ${diffMins}min`;
                                  } catch (error) {
                                    return "Erro";
                                  }
                                })() : '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhum processamento concluído hoje
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fila de Carregamento - Layout Otimizado */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Fila de Carregamento - Card Único com Filtros */}
            <Card className="lg:col-span-4 border-l-4 border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    Na Fila
                  </div>
                  <span className="text-sm font-normal bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    {loadingCarregamentos ? '...' : loadingsFila.filter(l => filtroFila === "Todos" || l.product === filtroFila).length}
                  </span>
                </CardTitle>
                <CardDescription>
                  Aguardando carregamento
                </CardDescription>
                {/* Filtros por produto */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={() => setFiltroFila("Todos")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filtroFila === "Todos"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroFila("Pluma")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filtroFila === "Pluma"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pluma
                  </button>
                  <button
                    onClick={() => setFiltroFila("Caroço")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filtroFila === "Caroço"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Caroço
                  </button>
                  <button
                    onClick={() => setFiltroFila("Fibrilha")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filtroFila === "Fibrilha"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Fibrilha
                  </button>
                  <button
                    onClick={() => setFiltroFila("Briquete")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filtroFila === "Briquete"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Briquete
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {!loadingCarregamentos && loadingsFila.filter(l => filtroFila === "Todos" || l.product === filtroFila).length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loadingsFila
                      .filter(l => filtroFila === "Todos" || l.product === filtroFila)
                      .map((loading, idx) => (
                        <Card 
                          key={loading.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleLoadingCardClick(loading)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {/* Número da posição na fila */}
                                  <span className="px-2 py-0.5 rounded bg-yellow-600 text-white text-xs font-bold">
                                    {idx + 1}º
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    loading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                                    loading.product === 'Caroço' ? 'bg-red-100 text-red-800' :
                                    loading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                                    loading.product === 'Briquete' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {loading.product}
                                  </span>
                                  {loading.is_sider && (
                                    <span className="px-1 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">SIDER</span>
                                  )}
                                  {loading.acompanhante && (
                                    <span className="px-1 py-0.5 rounded bg-green-100 text-green-800 text-xs flex items-center gap-1">
                                      <UserPlus className="w-3 h-3" />
                                      ACOMP
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold text-sm">{loading.plate}</p>
                                <p className="text-xs text-muted-foreground truncate">{loading.driver}</p>
                                <p className="text-xs font-medium text-purple-600 truncate">{loading.carrier}</p>
                                <p className="text-xs font-medium text-blue-600 truncate">{loading.destination}</p>
                                {/* Data e hora de marcação */}
                                <p className="text-xs text-gray-500 mt-1">
                                  📅 {loading.date} às {loading.time}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {loadingCarregamentos ? 'Carregando...' : 'Nenhum na fila'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carregando */}
            <Card className="lg:col-span-4 border-l-4 border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-orange-600" />
                    Carregando
                  </div>
                  <span className="text-sm font-normal bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {loadingCarregamentos ? '...' : loadingsCarregando.filter(l => filtroCarregando === "Todos" || l.product === filtroCarregando).length}
                  </span>
                </CardTitle>
                <CardDescription>
                  Em processo de carregamento
                </CardDescription>
                {/* Filtros por produto */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={() => setFiltroCarregando("Todos")}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      filtroCarregando === "Todos" 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroCarregando("Pluma")}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      filtroCarregando === "Pluma" 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    Pluma
                  </button>
                  <button
                    onClick={() => setFiltroCarregando("Caroço")}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      filtroCarregando === "Caroço" 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    Caroço
                  </button>
                  <button
                    onClick={() => setFiltroCarregando("Fibrilha")}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      filtroCarregando === "Fibrilha" 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Fibrilha
                  </button>
                  <button
                    onClick={() => setFiltroCarregando("Briquete")}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      filtroCarregando === "Briquete" 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                    }`}
                  >
                    Briquete
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {!loadingCarregamentos && loadingsCarregando.filter(l => filtroCarregando === "Todos" || l.product === filtroCarregando).length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {loadingsCarregando
                      .filter(l => filtroCarregando === "Todos" || l.product === filtroCarregando)
                      .map((loading) => (
                        <Card 
                          key={loading.id} 
                          className={`relative cursor-pointer hover:shadow-md transition-shadow ${
                            loading.status === 'carregado' 
                              ? 'border-2 border-amber-400 bg-amber-50' 
                              : 'border-orange-200'
                          }`}
                          onClick={() => handleLoadingCardClick(loading)}
                        >
                          <CardContent className="p-3">
                            {/* Badge de alerta para status "carregado" */}
                            {loading.status === 'carregado' && (
                              <div className="absolute -top-2 -right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                                ⚠️ REGISTRAR SAÍDA
                              </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    loading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                                    loading.product === 'Caroço' ? 'bg-red-100 text-red-800' :
                                    loading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                                    loading.product === 'Briquete' ? 'bg-purple-100 text-purple-800' :
                                    loading.product === 'Reciclados' ? 'bg-blue-100 text-blue-800' :
                                    loading.product === 'Cavaco' ? 'bg-orange-100 text-orange-800' :
                                    loading.product === 'Outros' ? 'bg-pink-100 text-pink-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {loading.product}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                      loading.status === 'carregado' ? 'bg-amber-500' : 'bg-orange-500'
                                    } animate-pulse`}></div>
                                    <span className={`text-xs font-bold ${
                                      loading.status === 'carregado' ? 'text-amber-600' : 'text-orange-600'
                                    }`}>
                                      {loading.status === 'carregado' ? 'CARREGADO' : 'CARREGANDO'}
                                    </span>
                                  </div>
                                  {loading.acompanhante && (
                                    <span className="px-1 py-0.5 rounded bg-green-100 text-green-800 text-xs flex items-center gap-1">
                                      <UserPlus className="w-3 h-3" />
                                      ACOMP
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold">{loading.plate}</p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p className="truncate">{loading.driver}</p>
                              <p className="truncate font-medium text-purple-600">{loading.carrier}</p>
                              {loading.entry_date && loading.entry_time && (
                                <p className="text-orange-600 font-medium mt-1">
                                  🚛 Entrada: {loading.entry_date} às {loading.entry_time}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {loadingCarregamentos ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Carregando...
                      </div>
                    ) : (
                      "Nenhum carregamento em andamento"
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Concluídos */}
            <Card className="lg:col-span-4 border-l-4 border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Concluídos
                  </div>
                  <span className="text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {loadingCarregamentos ? '...' : loadingsConcluidos.length}
                  </span>
                </CardTitle>
                <CardDescription>
                  Carregamentos finalizados hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!loadingCarregamentos && loadingsConcluidos.length > 0 ? (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="p-2 font-semibold text-left">Placa</th>
                          <th className="p-2 font-semibold text-left">Motorista</th>
                          <th className="p-2 font-semibold text-left">Produto</th>
                          <th className="p-2 font-semibold text-left">Entrada</th>
                          <th className="p-2 font-semibold text-left">Saída</th>
                          <th className="p-2 font-semibold text-center">Permanência</th>
                          <th className="p-2 font-semibold text-center">Peso/Fardos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingsConcluidos
                          .sort((a, b) => new Date(b.exit_time!).getTime() - new Date(a.exit_time!).getTime())
                          .slice(0, 10)
                          .map((loading) => {
                            const permanencia = calculateLoadingTime(
                              loading.entry_date,
                              loading.entry_time,
                              loading.exit_date,
                              loading.exit_time
                            );
                            
                            return (
                              <tr key={loading.id} className="border-b hover:bg-green-50 transition-colors">
                                <td className="p-2 font-medium border border-gray-200">{loading.plate}</td>
                                <td className="p-2 border border-gray-200 truncate max-w-24">{loading.driver}</td>
                                <td className="p-2 border border-gray-200">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    loading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                                    loading.product === 'Caroço' ? 'bg-red-100 text-red-800' :
                                    loading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {loading.product}
                                  </span>
                                </td>
                                <td className="p-2 border border-gray-200">
                                  {loading.entry_date && loading.entry_time 
                                    ? `${loading.entry_date} ${loading.entry_time}` 
                                    : '-'}
                                </td>
                                <td className="p-2 border border-gray-200">
                                  {loading.exit_date && loading.exit_time ? (
                                    <span className="text-green-600 font-medium">
                                      {`${loading.exit_date} ${loading.exit_time}`}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                      📋 Aguardando Nota
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 border border-gray-200 text-center font-medium text-green-600">{permanencia}</td>
                                <td className="p-2 border border-gray-200 text-center">
                                  {loading.weight ? `${loading.weight}kg` : loading.bales ? `${loading.bales} fardos` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {loadingCarregamentos ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Carregando...
                      </div>
                    ) : (
                      "Nenhum carregamento concluído hoje"
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Movimentação Geral de Veículos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="w-5 h-5 text-primary" />
                Movimentação Geral de Veículos
              </CardTitle>
              <CardDescription>
                Histórico Completo de Todos os Veículos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!loadingVehicles && allVehicles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold text-sm">Placa</th>
                        <th className="text-left p-2 font-semibold text-sm">Motorista</th>
                        <th className="text-left p-2 font-semibold text-sm">Tipo</th>
                        <th className="text-left p-2 font-semibold text-sm">Empresa</th>
                        <th className="text-left p-2 font-semibold text-sm">Finalidade</th>
                        <th className="text-left p-2 font-semibold text-sm">Entrada</th>
                        <th className="text-left p-2 font-semibold text-sm">Saída</th>
                        <th className="text-left p-2 font-semibold text-sm">Permanência</th>
                        <th className="text-left p-2 font-semibold text-sm">Status</th>
                        <th className="text-left p-2 font-semibold text-sm">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allVehicles
                        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
                        .slice(0, 20)
                        .map((vehicle) => {
                        const isExternalExit = vehicle.type === "Saída Externa";
                        return (
                          <tr key={vehicle.id} className={`border-b hover:bg-gray-50 ${isExternalExit ? 'bg-orange-50' : ''}`}>
                            <td className="p-2 font-medium text-sm">
                              {vehicle.plate.toUpperCase()}
                              {isExternalExit && (
                                <span className="ml-2 px-1 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                                  Externa
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-sm">{toTitleCase(vehicle.driver)}</td>
                            <td className="p-2 text-sm">{toTitleCase(vehicle.type)}</td>
                            <td className="p-2 text-sm">{vehicle.company ? toTitleCase(vehicle.company) : '-'}</td>
                            <td className="p-2 text-sm">{toTitleCase(vehicle.purpose)}</td>
                            <td className="p-2 text-sm">
                              {vehicle.entry_time ? `${vehicle.date} ${vehicle.entry_time}` : '-'}
                            </td>
                            <td className="p-2 text-sm">
                              {vehicle.exit_time ? `${vehicle.date} ${vehicle.exit_time}` : '-'}
                            </td>
                            <td className="p-2 text-sm">
                              {isExternalExit 
                                ? (vehicle.entry_time ? "Retornou" : "Saída Externa") 
                                : calculatePermanenceTime(vehicle.entry_time, vehicle.exit_time)
                              }
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isExternalExit 
                                  ? (vehicle.entry_time ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800')
                                  : (vehicle.exit_time ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800')
                              }`}>
                                {isExternalExit 
                                  ? (vehicle.entry_time ? 'Retornou' : 'Fora')
                                  : (vehicle.exit_time ? 'Saiu' : 'No Pátio')
                                }
                              </span>
                            </td>
                            <td className="p-2">
                              {isExternalExit && !vehicle.entry_time ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRegisterVehicleReturn(vehicle.id)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
                                >
                                  Registrar Retorno
                                </Button>
                              ) : !isExternalExit && !vehicle.exit_time && vehicle.entry_time ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRegisterVehicleExit(vehicle.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs"
                                >
                                  Registrar Saída
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {allVehicles.length > 20 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" onClick={() => navigate('/vehicles')} className="text-sm">
                        Ver Todos os {allVehicles.length} Veículos
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {loadingVehicles ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Carregando...
                    </div>
                  ) : (
                    "Nenhum Veículo Registrado Hoje"
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Gerenciamento de Carregamento */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Carregamento</DialogTitle>
            <DialogDescription>
              {selectedLoading && !selectedLoading.entry_date 
                ? "Registre a data e hora de entrada para mover para \"Carregando\""
                : "Finalize o carregamento com data, hora e nota fiscal"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoading && (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedLoading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                    selectedLoading.product === 'Caroço' ? 'bg-red-100 text-red-800' :
                    selectedLoading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                    selectedLoading.product === 'Briquete' ? 'bg-purple-100 text-purple-800' :
                    selectedLoading.product === 'Reciclados' ? 'bg-blue-100 text-blue-800' :
                    selectedLoading.product === 'Cavaco' ? 'bg-orange-100 text-orange-800' :
                    selectedLoading.product === 'Outros' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedLoading.product}
                  </span>
                  <span className="text-sm font-medium">{selectedLoading.plate}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Motorista: {selectedLoading.driver} | {selectedLoading.carrier}
                </p>
                {selectedLoading.entry_date && (
                  <p className="text-sm text-orange-600 font-medium mt-2">
                    Carregamento iniciado: {selectedLoading.entry_date} {selectedLoading.entry_time}
                  </p>
                )}
              </div>

              {!selectedLoading.entry_date ? (
                // Formulário para INICIAR carregamento
                <form onSubmit={handleStartLoading} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entryDate">Data de Entrada</Label>
                      <Input
                        id="entryDate"
                        name="entryDate"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entryTime">Hora de Entrada</Label>
                      <Input
                        id="entryTime"
                        name="entryTime"
                        type="time"
                        defaultValue={new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsManageModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Iniciar Carregamento
                    </Button>
                  </DialogFooter>
                </form>
              ) : modalAction === 'escolher' ? (
                // TELA DE ESCOLHA: Carregado ou Saiu
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Selecione a ação desejada:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => setModalAction('carregado')}
                      className="h-24 flex flex-col gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Package className="w-8 h-8" />
                      <span className="font-bold">CARREGADO</span>
                      <span className="text-xs font-normal">Aguardando saída</span>
                    </Button>
                    <Button
                      onClick={() => setModalAction('saiu')}
                      className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-8 h-8" />
                      <span className="font-bold">SAIU</span>
                      <span className="text-xs font-normal">Finalizar NF</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsManageModalOpen(false)}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : modalAction === 'carregado' ? (
                // FORMULÁRIO CARREGADO (apenas quantidade)
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">📦 Carregado - Aguardando NF</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setModalAction('escolher')}
                    >
                      ← Voltar
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Informe apenas a quantidade para marcar como carregado:
                  </p>

                  {(selectedLoading.product === 'Caroço' || selectedLoading.product === 'Briquete') && (
                    <div className="space-y-2">
                      <Label htmlFor="weightCarregado">Peso (kg)</Label>
                      <Input
                        id="weightCarregado"
                        type="number"
                        step="0.01"
                        placeholder="Peso em kg"
                        defaultValue={selectedLoading.weight || ""}
                      />
                    </div>
                  )}

                  {(selectedLoading.product === 'Pluma' || selectedLoading.product === 'Fibrilha') && (
                    <div className="space-y-2">
                      <Label htmlFor="balesCarregado">Fardos</Label>
                      <Input
                        id="balesCarregado"
                        type="number"
                        placeholder="Quantidade de fardos"
                        defaultValue={selectedLoading.bales || ""}
                      />
                    </div>
                  )}

                  <DialogFooter className="gap-2">
                    <Button
                      onClick={() => {
                        const weight = (document.getElementById("weightCarregado") as HTMLInputElement)?.value;
                        const bales = (document.getElementById("balesCarregado") as HTMLInputElement)?.value;
                        
                        const updateData: Partial<LoadingRecord> = {
                          status: 'carregado',
                          weight: weight ? parseFloat(weight) : selectedLoading.weight,
                          bales: bales ? parseInt(bales) : selectedLoading.bales,
                        };
                        
                        updateRecord(selectedLoading.id, updateData);
                        setIsManageModalOpen(false);
                        toast({
                          title: "Marcado como Carregado!",
                          description: `Placa ${selectedLoading.plate} - Aguardando hora de saída.`,
                        });
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      ✅ Confirmar - Carregado (fica visível na lista)
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                // FORMULÁRIO para FINALIZAR carregamento (SAIU)
                <form onSubmit={handleFinishLoading} className="space-y-4">
                  <div className="space-y-2 border-b pb-4">
                    <Label htmlFor="dashDestination">Destino</Label>
                    <Input
                      id="dashDestination"
                      name="destination"
                      type="text"
                      placeholder="Digite ou confirme o destino"
                      defaultValue={selectedLoading.destination || ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dashClient">Cliente (opcional)</Label>
                    <Input
                      id="dashClient"
                      name="client"
                      type="text"
                      placeholder="Digite o nome do cliente"
                      defaultValue={selectedLoading.client || ""}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exitDate">Data de Saída *</Label>
                      <Input
                        id="exitDate"
                        name="exitDate"
                        type="date"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exitTime">Hora de Saída *</Label>
                      <Input
                        id="exitTime"
                        name="exitTime"
                        type="time"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Número da Nota Fiscal</Label>
                    <Input
                      id="invoiceNumber"
                      name="invoiceNumber"
                      type="text"
                      placeholder="Ex: 123.456"
                      defaultValue={selectedLoading.invoice_number || ""}
                    />
                  </div>

                  {/* Campos condicionais baseados no produto */}
                  {(selectedLoading.product === 'Caroço' || selectedLoading.product === 'Briquete') && (
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        step="0.01"
                        placeholder="Peso em kg"
                        defaultValue={selectedLoading.weight || ""}
                      />
                    </div>
                  )}

                  {(selectedLoading.product === 'Pluma' || selectedLoading.product === 'Fibrilha') && (
                    <div className="space-y-2">
                      <Label htmlFor="bales">Fardos</Label>
                      <Input
                        id="bales"
                        name="bales"
                        type="number"
                        placeholder="Quantidade de fardos"
                        defaultValue={selectedLoading.bales || ""}
                      />
                    </div>
                  )}

                  <DialogFooter className="gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setModalAction('escolher')}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                      ✅ Saiu - Finalizar
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
