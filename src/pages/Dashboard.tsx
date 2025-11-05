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
  Crown
} from "lucide-react";
import { useVehicles, useCottonPull, useRainRecords, useEquipment, useLoadingRecords } from "@/hooks/use-supabase";
import { LoadingRecord } from "@/lib/supabase";
import QueueDisplay from "@/components/QueueDisplay";
import logo from "@/assets/BF_logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { vehicles, loading: loadingVehicles, updateVehicle } = useVehicles();
  const { records: cottonRecords, loading: loadingCotton } = useCottonPull();
  const { records: rainRecords, loading: loadingRain } = useRainRecords();
  const { records: equipmentRecords, loading: loadingEquipment } = useEquipment();
  const { records: loadingRecords, loading: loadingCarregamentos, updateRecord } = useLoadingRecords();
  
  const [selectedLoading, setSelectedLoading] = useState<LoadingRecord | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const handleRegisterVehicleExit = async (id: string) => {
    const now = new Date();
    const exitTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await updateVehicle(id, { exit_time: exitTime });
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
    }
  };

  const handleLoadingCardClick = (loading: LoadingRecord) => {
    setSelectedLoading(loading);
    setIsManageModalOpen(true);
  };

  const handleStartLoading = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLoading) return;
    
    const formData = new FormData(e.currentTarget);
    const entryDate = formData.get("entryDate") as string;
    const entryTime = formData.get("entryTime") as string;
    
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
    
    // Aqui você pode implementar a lógica para atualizar o registro
    // Por enquanto vamos apenas navegar para a tela de Cotton Pull
    navigate(`/cotton-pull?exit=${cottonPullId}`);
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
  const todayCarregamentos = todayVehicles.filter(v => v.type === 'Carregamento');
  const todayRolls = cottonRecords
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + r.rolls, 0);
  const todayRain = rainRecords
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + r.millimeters, 0);

  // Estatísticas da nova tabela de carregamentos
  const todayLoadings = loadingRecords.filter(l => l.date === today);
  const loadingsFila = todayLoadings.filter(l => !l.entry_date);
  const loadingsCarregando = todayLoadings.filter(l => l.entry_date && !l.exit_date);
  const loadingsConcluidos = todayLoadings.filter(l => l.exit_date);

  // Apenas veículos (separado dos carregamentos)
  const veiculosFila = todayVehicles.filter(v => !v.exit_time && v.purpose?.toLowerCase().includes('fila'));
  const veiculosProcessando = todayVehicles.filter(v => !v.exit_time && !v.purpose?.toLowerCase().includes('fila'));
  const veiculosConcluidos = todayVehicles.filter(v => v.exit_time);
  
  // Algodão dentro da algodoeira (CottonPull com entry_time mas sem exit_time)
  const algodaoNaAlgodoeira = cottonRecords.filter(c => c.entry_time && !c.exit_time);
  
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
      label: "Total Carregamentos", 
      value: (loadingVehicles || loadingCarregamentos) ? "..." : `${totalFila + totalCarregando + totalConcluidos} carregamentos`, 
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
      <header className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-3 flex justify-between items-center bg-card/50 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden">
            <img 
              src={logo}
              alt="Bom Futuro Logo" 
              className="w-full h-full object-contain"
            />
          </div>
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
              <Container className="w-6 h-6 text-primary mr-3" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Carregamentos</p>
                <p className="text-xl font-bold">{loadingCarregamentos ? "..." : todayLoadings.length}</p>
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
          {/* Algodão na Algodoeira */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-600" />
                Algodão na Algodoeira
              </CardTitle>
              <CardDescription>
                Veículos dentro da unidade processadora ({algodaoNaAlgodoeira.length} veículos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {algodaoNaAlgodoeira.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Placa</th>
                        <th className="text-left p-2 font-semibold">Produtor</th>
                        <th className="text-left p-2 font-semibold">Fazenda</th>
                        <th className="text-left p-2 font-semibold">Motorista</th>
                        <th className="text-left p-2 font-semibold">Rolos</th>
                        <th className="text-left p-2 font-semibold">Entrada</th>
                        <th className="text-left p-2 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {algodaoNaAlgodoeira.map((cotton) => (
                        <tr 
                          key={cotton.id} 
                          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="p-2 font-medium">{cotton.plate}</td>
                          <td className="p-2">{cotton.producer}</td>
                          <td className="p-2">{cotton.farm}</td>
                          <td className="p-2">{cotton.driver}</td>
                          <td className="p-2">{cotton.rolls}</td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {cotton.entry_time}
                          </td>
                          <td className="p-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleMarkExit(cotton.id)}
                              className="text-xs bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              Marcar Saída
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum veículo na algodoeira
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fila de Carregamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="w-5 h-5 text-purple-600" />
                Fila de Carregamentos
              </CardTitle>
              <CardDescription>
                Clique em um carregamento para gerenciar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!loadingCarregamentos && loadingsFila.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loadingsFila
                    .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
                    .map((loading) => {
                      const { position } = getQueuePosition(loading);
                      return (
                        <Card 
                          key={loading.id} 
                          className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getProductColor(loading.product)}`}
                          onClick={() => handleLoadingCardClick(loading)}
                        >
                          <CardContent className="pt-4 pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex gap-2 mb-1 items-center">
                                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                    loading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                                    loading.product === 'Caroço' ? 'bg-amber-100 text-amber-800' :
                                    loading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                                    loading.product === 'Briquete' ? 'bg-purple-100 text-purple-800' :
                                    loading.product === 'Reciclados' ? 'bg-blue-100 text-blue-800' :
                                    loading.product === 'Cavaco' ? 'bg-orange-100 text-orange-800' :
                                    loading.product === 'Outros' ? 'bg-pink-100 text-pink-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {loading.product}
                                  </span>
                                  {loading.is_sider && (
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">SIDER</span>
                                  )}
                                  {position === 1 && (
                                    <div className="flex items-center gap-1">
                                      <Crown className="w-4 h-4 text-yellow-500" />
                                      <span className="text-xs font-bold text-yellow-600">1º DA VEZ</span>
                                    </div>
                                  )}
                                  {position === 2 && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4 text-blue-500" />
                                      <span className="text-xs font-bold text-blue-600">PRÓXIMO DA VEZ</span>
                                    </div>
                                  )}
                                </div>
                                <p className="font-semibold text-lg">{loading.plate}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getPositionMessage(loading)}
                                </p>
                              </div>
                              <div className="text-right text-sm">
                                <p className="text-muted-foreground">Transportadora</p>
                                <p className="font-medium">{loading.carrier}</p>
                              </div>
                            </div>
                            <div className="text-sm mt-3 pt-3 border-t">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-muted-foreground">Motorista</p>
                                  <p className="font-medium">{loading.driver}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Destino</p>
                                  <p className="font-medium">{loading.destination}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {loadingCarregamentos ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Carregando...
                    </div>
                  ) : (
                    "Nenhum veículo na fila de carregamento"
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movimentação Geral de Veículos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Movimentação Geral de Veículos
              </CardTitle>
              <CardDescription>
                Todos os veículos que entraram hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!loadingVehicles && todayVehicles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Placa</th>
                        <th className="text-left p-2 font-semibold">Tipo</th>
                        <th className="text-left p-2 font-semibold">Finalidade</th>
                        <th className="text-left p-2 font-semibold">Entrada</th>
                        <th className="text-left p-2 font-semibold">Saída</th>
                        <th className="text-left p-2 font-semibold">Status</th>
                        <th className="text-left p-2 font-semibold">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayVehicles.slice(0, 10).map((vehicle) => (
                        <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{vehicle.plate}</td>
                          <td className="p-2">{vehicle.type}</td>
                          <td className="p-2">{vehicle.purpose}</td>
                          <td className="p-2 text-sm">
                            {vehicle.date} {vehicle.entry_time}
                          </td>
                          <td className="p-2 text-sm">
                            {vehicle.exit_time ? `${vehicle.date} ${vehicle.exit_time}` : '-'}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.exit_time ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {vehicle.exit_time ? 'Saiu' : 'No Pátio'}
                            </span>
                          </td>
                          <td className="p-2">
                            {!vehicle.exit_time && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRegisterVehicleExit(vehicle.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                Registrar Saída
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {todayVehicles.length > 10 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" onClick={() => navigate('/vehicles')}>
                        Ver todos os {todayVehicles.length} veículos
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {loadingVehicles ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Carregando...
                    </div>
                  ) : (
                    "Nenhum veículo registrado hoje"
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Gerenciamento de Carregamento */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Carregamento</DialogTitle>
            <DialogDescription>
              Registre a data e hora de entrada para mover para "Carregando"
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoading && (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedLoading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                    selectedLoading.product === 'Caroço' ? 'bg-amber-100 text-amber-800' :
                    selectedLoading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedLoading.product}
                  </span>
                  <span className="text-sm font-medium">{selectedLoading.plate}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Motorista: {selectedLoading.driver} | {selectedLoading.carrier}
                </p>
              </div>

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
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Iniciar Carregamento
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
