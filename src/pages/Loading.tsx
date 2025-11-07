import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Package, Clock, Edit2, Trash2, Crown, Users, Loader2, CheckCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoadingRecords } from "@/hooks/use-supabase";
import { LoadingRecord } from "@/lib/supabase";
import { getTodayLocalDate, normalizeLocalDate } from "@/lib/date-utils";

const Loading = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { records: loadings, addRecord, updateRecord, deleteRecord, loading } = useLoadingRecords();
  
  const [truckTypes, setTruckTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('guarita_truck_types');
    return saved ? JSON.parse(saved) : ["Rodotrem", "Bitrem", "Toco", "LS Simples", "LS Trucada", "Vanderleia"];
  });
  const [carriers, setCarriers] = useState<string[]>(() => {
    const saved = localStorage.getItem('guarita_carriers');
    return saved ? JSON.parse(saved) : ["Fribon", "Bom Futuro", "RDM"];
  });
  const [destinations, setDestinations] = useState<string[]>(() => {
    const saved = localStorage.getItem('guarita_destinations');
    return saved ? JSON.parse(saved) : ["Santos-SP", "Guararapes-SP", "Cubatão-SP", "Guarujá-SP", "Paranaguá-PR", "Tangará da Serra-MT", "Alto Araguaia-MT"];
  });
  const [harvestYears] = useState<string[]>(["2024/2025", "2023/2024", "2022/2023", "2021/2022"]);
  
  const [selectedLoading, setSelectedLoading] = useState<LoadingRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalAction, setModalAction] = useState<'escolher' | 'carregado' | 'saiu'>('escolher');
  const [newTruckType, setNewTruckType] = useState("");
  const [newCarrier, setNewCarrier] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Salvar tipos de caminhão no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('guarita_truck_types', JSON.stringify(truckTypes));
  }, [truckTypes]);

  // Salvar transportadoras no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('guarita_carriers', JSON.stringify(carriers));
  }, [carriers]);

  // Salvar destinos no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('guarita_destinations', JSON.stringify(destinations));
  }, [destinations]);

  // Sistema de autocomplete
  const [savedPlates, setSavedPlates] = useState<string[]>(() => {
    const saved = localStorage.getItem('guarita_saved_plates');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedDrivers, setSavedDrivers] = useState<string[]>(() => {
    const saved = localStorage.getItem('guarita_saved_drivers');
    return saved ? JSON.parse(saved) : [];
  });

  // Detectar se veio do Dashboard para editar
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && loadings.length > 0) {
      const loadingToEdit = loadings.find(loading => loading.id === editId);
      if (loadingToEdit) {
        setSelectedLoading(loadingToEdit);
        setIsEditMode(true);
        setIsDialogOpen(true);
        // Limpar parâmetro da URL
        setSearchParams({});
      }
    }
  }, [searchParams, loadings, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loadingData = {
      date: normalizeLocalDate(formData.get("date") as string),
      time: formData.get("time") as string,
      product: formData.get("product") as string,
      harvest_year: formData.get("harvestYear") as string,
      truck_type: formData.get("truckType") as string,
      is_sider: formData.get("isSider") === "on",
      acompanhante: formData.get("acompanhante") === "on",
      carrier: formData.get("carrier") as string,
      destination: (formData.get("destination") as string) || "",
      plate: formData.get("plate") as string,
      driver: formData.get("driver") as string,
      client: formData.get("client") as string || "",
      bales: parseInt(formData.get("bales") as string) || 0,
      weight: parseFloat(formData.get("weight") as string) || 0,
      notes: formData.get("notes") as string || "",
      // Novos campos de entrada e saída
      entry_date: formData.get("entry_date") as string || null,
      entry_time: formData.get("entry_time") as string || null,
      exit_date: formData.get("exit_date") as string || null,
      exit_time: formData.get("exit_time") as string || null
    };
    
    // Salvar dados para autocomplete
    const plate = formData.get("plate") as string;
    const driver = formData.get("driver") as string;
    
    if (plate && !savedPlates.includes(plate.toUpperCase())) {
      const newPlates = [...savedPlates, plate.toUpperCase()];
      setSavedPlates(newPlates);
      localStorage.setItem('guarita_saved_plates', JSON.stringify(newPlates));
    }
    if (driver && !savedDrivers.includes(driver)) {
      const newDrivers = [...savedDrivers, driver];
      setSavedDrivers(newDrivers);
      localStorage.setItem('guarita_saved_drivers', JSON.stringify(newDrivers));
    }
    
    try {
      if (isEditMode && selectedLoading) {
        await updateRecord(selectedLoading.id, loadingData);
        setIsDialogOpen(false);
        setIsEditMode(false);
      } else {
        await addRecord(loadingData);
        e.currentTarget.reset();
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erro ao processar carregamento:', error);
    }
  };

  const handleCardClick = (loading: LoadingRecord) => { 
    setSelectedLoading(loading); 
    setIsEditMode(false);
    setModalAction('escolher');
    setIsDialogOpen(true); 
  };

  const handleEditClick = (loading: LoadingRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLoading(loading);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (loading: LoadingRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir o carregamento ${loading.plate} - ${loading.product}?`)) {
      try {
        await deleteRecord(loading.id);
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  // Função para calcular posição na fila por produto
  const getQueuePosition = (loading: LoadingRecord) => {
    const sameProductQueue = queuedLoadings
      .filter(l => l.product === loading.product)
      .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());
    
    const position = sameProductQueue.findIndex(l => l.id === loading.id) + 1;
    return { position, total: sameProductQueue.length };
  };

  // Função para obter mensagem de posição
  const getPositionMessage = (loading: LoadingRecord) => {
    const { position } = getQueuePosition(loading);
    if (position === 1) {
      return `1º da vez - ${loading.product}`;
    } else if (position === 2) {
      return `Próximo da vez - ${loading.product}`;
    }
    return `${position}º na fila - ${loading.product}`;
  };

  const handleStartLoading = async () => {
    if (!selectedLoading) return;
    const entryDate = (document.getElementById("entryDate") as HTMLInputElement)?.value;
    const entryTime = (document.getElementById("entryTime") as HTMLInputElement)?.value;
    const destination = (document.getElementById("confirmDestination") as HTMLInputElement)?.value;
    const client = (document.getElementById("confirmClient") as HTMLInputElement)?.value;
    
    if (!entryDate || !entryTime) {
      toast({ title: "Campos obrigatórios", description: "Preencha data e hora de entrada.", variant: "destructive" });
      return;
    }
    
    try {
      await updateRecord(selectedLoading.id, {
        entry_date: entryDate,
        entry_time: entryTime,
        destination: destination || selectedLoading.destination,
        client: client || selectedLoading.client || "",
        status: 'carregando' // Define status como carregando
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao iniciar carregamento:', error);
    }
  };

  const handleCompleteLoading = async () => {
    if (!selectedLoading) return;
    const exitDate = (document.getElementById("exitDate") as HTMLInputElement)?.value;
    const exitTime = (document.getElementById("exitTime") as HTMLInputElement)?.value;
    const invoiceNumber = (document.getElementById("invoiceNumber") as HTMLInputElement)?.value;
    const destination = (document.getElementById("confirmDestinationExit") as HTMLInputElement)?.value;
    const client = (document.getElementById("confirmClientExit") as HTMLInputElement)?.value;
    const bales = Number((document.getElementById("bales") as HTMLInputElement)?.value || 0);
    const weight = Number((document.getElementById("weight") as HTMLInputElement)?.value || 0);
    
    // Para concluir COMPLETAMENTE (e remover da lista), precisa de hora de saída
    if (!exitDate || !exitTime) {
      toast({ 
        title: "Hora de saída obrigatória", 
        description: "Para remover da lista, informe a hora de saída do caminhão.", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      // Atualiza com os dados disponíveis + hora de saída = status concluido
      await updateRecord(selectedLoading.id, {
        exit_date: exitDate,
        exit_time: exitTime,
        invoice_number: invoiceNumber || selectedLoading.invoice_number || null,
        destination: destination || selectedLoading.destination,
        client: client || selectedLoading.client || "",
        bales: bales || selectedLoading.bales,
        weight: weight || selectedLoading.weight,
        status: 'concluido' // Com hora de saída = concluído e some da lista
      });
      setIsDialogOpen(false);
      toast({
        title: "Carregamento finalizado!",
        description: `Placa ${selectedLoading.plate} saiu às ${exitTime}`,
      });
    } catch (error) {
      console.error('Erro ao finalizar carregamento:', error);
      toast({
        title: "Erro ao finalizar carregamento",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Nova função para marcar como carregado (sem precisar de todos os dados)
  const handleMarkAsLoaded = async () => {
    if (!selectedLoading) return;
    
    // Pega apenas Fardos ou Peso (os campos que estão no modal CARREGADO)
    const bales = Number((document.getElementById("bales") as HTMLInputElement)?.value || 0);
    const weight = Number((document.getElementById("weight") as HTMLInputElement)?.value || 0);
    
    try {
      await updateRecord(selectedLoading.id, {
        status: 'carregado', // Marca como carregado mas não concluído
        // Salva apenas a quantidade
        bales: bales || selectedLoading.bales,
        weight: weight || selectedLoading.weight,
      });
      setIsDialogOpen(false);
      toast({
        title: "Marcado como Carregado!",
        description: `Placa ${selectedLoading.plate} - Aguardando hora de saída para conclusão.`,
      });
    } catch (error) {
      console.error('Erro ao marcar como carregado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleAddTruckType = () => {
    if (newTruckType && !truckTypes.includes(newTruckType)) {
      setTruckTypes([...truckTypes, newTruckType]);
      setNewTruckType("");
      toast({ title: "Tipo adicionado!", description: `"${newTruckType}" cadastrado.` });
    }
  };

  const handleAddCarrier = () => {
    if (newCarrier && !carriers.includes(newCarrier)) {
      setCarriers([...carriers, newCarrier]);
      setNewCarrier("");
      toast({ title: "Transportadora adicionada!", description: `"${newCarrier}" cadastrada.` });
    }
  };

  const handleAddDestination = () => {
    if (newDestination && !destinations.includes(newDestination)) {
      setDestinations([...destinations, newDestination]);
      setNewDestination("");
      toast({ title: "Destino adicionado!", description: `"${newDestination}" cadastrado.` });
    }
  };

  const queuedLoadings = loadings.filter(l => 
    l.status === 'fila' || (!l.status && !l.entry_date)
  );
  
  const loadingInProgress = loadings.filter(l => {
    // Não mostra se já tem saída
    if (l.exit_date) return false;
    // Mostra se está carregando ou carregado (SEMPRE MOSTRA até registrar saída)
    if (l.status === 'carregando' || l.status === 'carregado') return true;
    // Fallback para registros sem status mas com entrada
    return !l.status && l.entry_date && !l.exit_date;
  });
  
  const completedLoadings = loadings.filter(l => {
    // Mostra apenas os que saíram HOJE (serão arquivados à meia-noite)
    return l.exit_date === today;
  });

  const getProductColor = (product: string) => {
    switch (product) {
      case "Pluma": return "bg-primary/10 border-primary text-primary";
      case "Caroço": return "bg-secondary/10 border-secondary text-secondary";
      case "Fibrilha": return "bg-accent/10 border-accent text-accent";
      case "Briquete": return "bg-muted border-muted-foreground text-muted-foreground";
      case "Reciclados": return "bg-info/10 border-info text-info";
      default: return "bg-muted border-muted-foreground text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-secondary/5">
      <header className="border-b bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg"><Package className="w-6 h-6 text-accent" /></div>
              <div><h1 className="text-xl font-bold">Carregamento</h1><p className="text-sm text-muted-foreground">Gestão de embarques</p></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/loading/history")}>
              Histórico
            </Button>
            <Button onClick={() => setShowForm(!showForm)} className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />{showForm ? 'Ocultar' : 'Novo'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {showForm && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Cadastrar Carregamento</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Data</Label><Input type="date" name="date" required defaultValue={getTodayLocalDate()} /></div>
                <div className="space-y-2"><Label>Hora</Label><Input type="time" name="time" required /></div>
                <div className="space-y-2"><Label>Produto</Label>
                  {!isCreatingNewProduct ? (
                    <div className="space-y-2">
                      <Select name="product" required onValueChange={(value) => {
                        if (value === "__new__") {
                          setIsCreatingNewProduct(true);
                        }
                      }}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pluma">Pluma</SelectItem>
                          <SelectItem value="Caroço">Caroço</SelectItem>
                          <SelectItem value="Fibrilha">Fibrilha</SelectItem>
                          <SelectItem value="Briquete">Briquete</SelectItem>
                          <SelectItem value="Reciclados">Reciclados</SelectItem>
                          <SelectItem value="Cavaco">Cavaco</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                          <SelectItem value="__new__">+ Novo Produto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        name="product"
                        value={newProduct}
                        onChange={(e) => setNewProduct(e.target.value)}
                        placeholder="Digite o nome do novo produto"
                        required
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsCreatingNewProduct(false);
                          setNewProduct("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid sm:grid-cols-1 gap-4">
                <div className="space-y-2"><Label>Safra</Label>
                  <Select name="harvestYear" required defaultValue="2024/2025"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{harvestYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo de Caminhão</Label>
                  <Select name="truckType" required><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{truckTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Novo tipo" value={newTruckType} onChange={e => setNewTruckType(e.target.value)} />
                    <Button type="button" size="sm" onClick={handleAddTruckType}>Adicionar</Button>
                  </div>
                </div>
                <div className="space-y-2"><Label>Características</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2 h-10"><Checkbox id="isSider" name="isSider" />
                      <label htmlFor="isSider" className="text-sm font-medium">Caminhão SIDER</label>
                    </div>
                    <div className="flex items-center space-x-2 h-10"><Checkbox id="acompanhante" name="acompanhante" />
                      <label htmlFor="acompanhante" className="text-sm font-medium">Com Acompanhante</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Input name="carrier" list="carriers-list" required />
                  <datalist id="carriers-list">{carriers.map(c => <option key={c} value={c} />)}</datalist>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Nova transportadora" value={newCarrier} onChange={e => setNewCarrier(e.target.value)} />
                    <Button type="button" size="sm" onClick={handleAddCarrier}>Adicionar</Button>
                  </div>
                </div>
                <div className="space-y-2"><Label>Cliente (opcional)</Label><Input name="client" placeholder="Nome do cliente" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Destino (opcional)</Label>
                  <Select name="destination">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Novo destino" value={newDestination} onChange={e => setNewDestination(e.target.value)} />
                    <Button type="button" size="sm" onClick={handleAddDestination}>Adicionar</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input 
                    name="plate" 
                    required 
                    list="plates-list"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <datalist id="plates-list">
                    {savedPlates.map((plate) => <option key={plate} value={plate} />)}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motorista</Label>
                <Input 
                  name="driver" 
                  required 
                  list="drivers-list"
                />
                <datalist id="drivers-list">
                  {savedDrivers.map((driver) => <option key={driver} value={driver} />)}
                </datalist>
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90"><Plus className="w-4 h-4 mr-2" />Adicionar à Fila</Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Cards lado a lado - Fila, Carregando, Concluídos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FILA */}
          <Card className="border-t-4 border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span>Fila</span>
                </div>
                <span className="text-sm font-normal bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                  {queuedLoadings.length}
                </span>
              </CardTitle>
              <CardDescription>Aguardando carregamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {queuedLoadings.length > 0 ? (
                  queuedLoadings.map(l => (
                    <Card key={l.id} className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getProductColor(l.product)}`} onClick={() => handleCardClick(l)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex gap-2 mb-2 items-center flex-wrap">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getProductColor(l.product)}`}>
                                {l.product}
                              </span>
                              {l.is_sider && <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">SIDER</span>}
                              {l.acompanhante && (
                                <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs flex items-center gap-1">
                                  <UserPlus className="w-3 h-3" />
                                  ACOMP
                                </span>
                              )}
                              {getQueuePosition(l).position === 1 && (
                                <div className="flex items-center gap-1">
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                  <span className="text-xs font-bold text-yellow-600">1º</span>
                                </div>
                              )}
                            </div>
                            <p className="font-semibold text-base">{l.plate}</p>
                            <p className="text-xs text-muted-foreground">{getPositionMessage(l)}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEditClick(l, e)}
                              className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteClick(l, e)}
                              className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="truncate"><span className="text-muted-foreground">Transportadora:</span> {l.carrier}</p>
                          <p className="truncate"><span className="text-muted-foreground">Destino:</span> {l.destination}</p>
                          <p className="truncate"><span className="text-muted-foreground">Motorista:</span> {l.driver}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum carregamento na fila
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CARREGANDO */}
          <Card className="border-t-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span>Carregando</span>
                </div>
                <span className="text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {loadingInProgress.length}
                </span>
              </CardTitle>
              <CardDescription>Em processo de carregamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingInProgress.length > 0 ? (
                  loadingInProgress.map(l => (
                    <Card key={l.id} className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow relative ${getProductColor(l.product)} ${
                      l.status === 'carregado' ? 'ring-2 ring-amber-400 bg-amber-50' : ''
                    }`} onClick={() => handleCardClick(l)}>
                      <CardContent className="p-4">
                        {/* Badge de alerta para status "carregado" */}
                        {l.status === 'carregado' && (
                          <div className="absolute -top-2 -right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse z-10">
                            ⚠️ REGISTRAR SAÍDA
                          </div>
                        )}
                        <div className="flex justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex gap-2 mb-2 items-center flex-wrap">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getProductColor(l.product)}`}>
                                {l.product}
                              </span>
                              {l.acompanhante && (
                                <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs flex items-center gap-1">
                                  <UserPlus className="w-3 h-3" />
                                  ACOMP
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${
                                  l.status === 'carregado' ? 'bg-amber-500' : 'bg-blue-500'
                                }`}></div>
                                <span className={`text-xs font-bold ${
                                  l.status === 'carregado' ? 'text-amber-600' : 'text-blue-600'
                                }`}>
                                  {l.status === 'carregado' ? 'CARREGADO' : 'ATIVO'}
                                </span>
                              </div>
                            </div>
                            <p className="font-semibold text-base">{l.plate}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEditClick(l, e)}
                              className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteClick(l, e)}
                              className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="truncate"><span className="text-muted-foreground">Entrada:</span> {l.entry_date} {l.entry_time}</p>
                          <p className="truncate"><span className="text-muted-foreground">Motorista:</span> {l.driver}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum carregamento em andamento
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CONCLUÍDOS */}
          <Card className="border-t-4 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Concluídos</span>
                </div>
                <span className="text-sm font-normal bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {completedLoadings.length}
                </span>
              </CardTitle>
              <CardDescription>Carregamentos finalizados</CardDescription>
            </CardHeader>
            <CardContent>
              {completedLoadings.length > 0 ? (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-green-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left border text-xs">Placa</th>
                        <th className="p-2 text-left border text-xs">Motorista</th>
                        <th className="p-2 text-left border text-xs">Produto</th>
                        <th className="p-2 text-left border text-xs">Entrada</th>
                        <th className="p-2 text-left border text-xs">Saída</th>
                        <th className="p-2 text-left border text-xs">Tempo</th>
                        <th className="p-2 text-left border text-xs">Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedLoadings
                        .sort((a, b) => {
                          const timeA = a.exit_time ? new Date(`2000-01-01 ${a.exit_time}`).getTime() : 0;
                          const timeB = b.exit_time ? new Date(`2000-01-01 ${b.exit_time}`).getTime() : 0;
                          return timeB - timeA;
                        })
                        .slice(0, 10)
                        .map((loading) => {
                          const entryTime = loading.entry_time;
                          const exitTime = loading.exit_time;
                          const permanencia = entryTime && exitTime ? 
                            (() => {
                              const [entryH, entryM] = entryTime.split(':').map(Number);
                              const [exitH, exitM] = exitTime.split(':').map(Number);
                              const totalMinutes = (exitH * 60 + exitM) - (entryH * 60 + entryM);
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${hours}h ${minutes}min`;
                            })() : '-';
                          
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
                              <td className="p-2 border border-gray-200">{entryTime || '-'}</td>
                              <td className="p-2 border border-gray-200 text-green-600 font-medium">{exitTime || '-'}</td>
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
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum carregamento concluído
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo Geral de Carregamentos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Resumo Geral de Carregamentos
            </CardTitle>
            <CardDescription>Todos os registros com opções de edição e exclusão</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : loadings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left border">Status</th>
                      <th className="p-2 text-left border">Placa</th>
                      <th className="p-2 text-left border">Produto</th>
                      <th className="p-2 text-left border">Motorista</th>
                      <th className="p-2 text-left border">Transportadora</th>
                      <th className="p-2 text-left border">Destino</th>
                      <th className="p-2 text-left border">Data</th>
                      <th className="p-2 text-left border">Entrada</th>
                      <th className="p-2 text-left border">Saída</th>
                      <th className="p-2 text-center border">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadings
                      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
                      .map((loading) => {
                        const status = loading.exit_date ? 'Concluído' : loading.entry_date ? 'Carregando' : 'Na Fila';
                        const statusColor = status === 'Concluído' ? 'text-green-600' : status === 'Carregando' ? 'text-orange-600' : 'text-yellow-600';
                        
                        return (
                          <tr key={loading.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-2 border">
                              <span className={`text-xs font-semibold ${statusColor}`}>{status}</span>
                            </td>
                            <td className="p-2 border font-medium">{loading.plate}</td>
                            <td className="p-2 border">
                              <span className={`px-2 py-1 rounded text-xs ${
                                loading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                                loading.product === 'Caroço' ? 'bg-red-100 text-red-800' :
                                loading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                                loading.product === 'Briquete' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {loading.product}
                              </span>
                            </td>
                            <td className="p-2 border truncate max-w-32">{loading.driver}</td>
                            <td className="p-2 border truncate max-w-32">{loading.carrier}</td>
                            <td className="p-2 border truncate max-w-32">{loading.destination}</td>
                            <td className="p-2 border">{loading.date}</td>
                            <td className="p-2 border">{loading.entry_date ? `${loading.entry_date} ${loading.entry_time}` : '-'}</td>
                            <td className="p-2 border">{loading.exit_date ? `${loading.exit_date} ${loading.exit_time}` : '-'}</td>
                            <td className="p-2 border">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditClick(loading, {} as React.MouseEvent)}
                                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(loading, {} as React.MouseEvent)}
                                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum carregamento registrado
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={() => {setIsDialogOpen(false); setIsEditMode(false);}}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Carregamento" : "Gerenciar Carregamento"}
            </DialogTitle>
            <DialogDescription>
              {selectedLoading?.plate} - {selectedLoading?.product}
            </DialogDescription>
          </DialogHeader>

          {/* Modo Edição */}
          {isEditMode && selectedLoading && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" name="date" defaultValue={selectedLoading.date} required />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" name="time" defaultValue={selectedLoading.time} required />
                </div>
              </div>

              {/* Campos de Entrada */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Data de Entrada</Label>
                  <Input type="date" name="entry_date" defaultValue={selectedLoading.entry_date || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Hora de Entrada</Label>
                  <Input type="time" name="entry_time" defaultValue={selectedLoading.entry_time || ""} />
                </div>
              </div>

              {/* Campos de Saída */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Saída</Label>
                  <Input type="date" name="exit_date" defaultValue={selectedLoading.exit_date || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Hora de Saída</Label>
                  <Input type="time" name="exit_time" defaultValue={selectedLoading.exit_time || ""} />
                </div>
              </div>

              {/* Campos de Peso/Fardos */}
              <div className="grid grid-cols-2 gap-4">
                {selectedLoading.product === "Pluma" && (
                  <div className="space-y-2">
                    <Label>Fardos</Label>
                    <Input type="number" name="bales" defaultValue={selectedLoading.bales || ""} />
                  </div>
                )}
                {(selectedLoading.product === "Caroço" || selectedLoading.product === "Briquete") && (
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input type="number" name="weight" defaultValue={selectedLoading.weight || ""} />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select name="product" defaultValue={selectedLoading.product} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pluma">Pluma</SelectItem>
                    <SelectItem value="Caroço">Caroço</SelectItem>
                    <SelectItem value="Fibrilha">Fibrilha</SelectItem>
                    <SelectItem value="Briquete">Briquete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Safra</Label>
                <Select name="harvestYear" defaultValue={selectedLoading.harvest_year || "2024/2025"} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {harvestYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo do Veículo</Label>
                <Select name="truckType" defaultValue={selectedLoading.truck_type} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {truckTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input name="plate" defaultValue={selectedLoading.plate} placeholder="ABC-1234" required />
                </div>
                <div className="space-y-2">
                  <Label>Motorista</Label>
                  <Input name="driver" defaultValue={selectedLoading.driver} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Select name="carrier" defaultValue={selectedLoading.carrier} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <Input name="client" defaultValue={selectedLoading.client || ""} placeholder="Nome do cliente" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Select name="destination" defaultValue={selectedLoading.destination} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destino (opcional - texto livre)</Label>
                  <Input name="destination_custom" defaultValue={selectedLoading.destination || ""} placeholder="Digite destino customizado" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="editIsSider" 
                  name="isSider" 
                  defaultChecked={selectedLoading.is_sider}
                />
                <label htmlFor="editIsSider" className="text-sm font-medium">
                  Caminhão SIDER
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {setIsDialogOpen(false); setIsEditMode(false);}}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Modo Gerenciamento - Iniciar Carregamento */}
          {!isEditMode && selectedLoading && !selectedLoading.entry_date && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Data de Entrada</Label>
                <Input type="date" id="entryDate" defaultValue={getTodayLocalDate()} />
              </div>
              <div className="space-y-2">
                <Label>Hora de Entrada</Label>
                <Input type="time" id="entryTime" />
              </div>
              <div className="space-y-2 border-t pt-4">
                <Label>Confirmar Destino</Label>
                <Input 
                  type="text" 
                  id="confirmDestination" 
                  placeholder="Digite ou confirme o destino"
                  defaultValue={selectedLoading.destination || ""} 
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                <Input 
                  type="text" 
                  id="confirmClient" 
                  placeholder="Digite o nome do cliente"
                  defaultValue={selectedLoading.client || ""} 
                />
              </div>
              <Button onClick={handleStartLoading} className="w-full bg-info hover:bg-info/90">
                Iniciar Carregamento
              </Button>
            </div>
          )}

          {/* Modo Gerenciamento - Concluir Carregamento */}
          {!isEditMode && selectedLoading && selectedLoading.entry_date && !selectedLoading.exit_date && (
            <>
              {modalAction === 'escolher' ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      O caminhão já está carregado ou ainda está aguardando a nota fiscal?
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => setModalAction('carregado')} 
                    className="w-full h-auto py-6 bg-orange-500 hover:bg-orange-600 flex flex-col items-center gap-2"
                  >
                    <Package className="w-8 h-8" />
                    <span className="text-lg font-bold">CARREGADO</span>
                    <span className="text-xs font-normal">Aguardando NF</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setModalAction('saiu')} 
                    className="w-full h-auto py-6 bg-green-600 hover:bg-green-700 flex flex-col items-center gap-2"
                  >
                    <CheckCircle className="w-8 h-8" />
                    <span className="text-lg font-bold">SAIR</span>
                    <span className="text-xs font-normal">Já pegou a NF - Sair da unidade</span>
                  </Button>
                </div>
              ) : modalAction === 'carregado' ? (
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
                  
                  {selectedLoading.product === "Pluma" && (
                    <div className="space-y-2">
                      <Label>Fardos</Label>
                      <Input type="number" id="bales" placeholder="Quantidade de fardos" />
                    </div>
                  )}
                  {(selectedLoading.product === "Caroço" || selectedLoading.product === "Briquete") && (
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input type="number" id="weight" placeholder="Peso em quilogramas" />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleMarkAsLoaded} 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    ✅ Confirmar - Carregado (fica visível na lista)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Salva a quantidade e mantém o caminhão visível com badge de alerta para registrar saída depois.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">✅ Finalizar e Remover</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setModalAction('escolher')}
                    >
                      ← Voltar
                    </Button>
                  </div>
                  
                  <div className="space-y-2 border-b pb-4">
                    <Label>Confirmar Destino</Label>
                    <Input 
                      type="text" 
                      id="confirmDestinationExit" 
                      placeholder="Digite ou confirme o destino"
                      defaultValue={selectedLoading.destination || ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente (opcional)</Label>
                    <Input 
                      type="text" 
                      id="confirmClientExit" 
                      placeholder="Digite o nome do cliente"
                      defaultValue={selectedLoading.client || ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Saída</Label>
                    <Input type="date" id="exitDate" defaultValue={getTodayLocalDate()} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora de Saída *</Label>
                    <Input type="time" id="exitTime" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Número da Nota Fiscal</Label>
                    <Input type="text" id="invoiceNumber" placeholder="Digite o número da NF" />
                  </div>
                  {selectedLoading.product === "Pluma" && (
                    <div className="space-y-2">
                      <Label>Fardos</Label>
                      <Input type="number" id="bales" placeholder="Quantidade de fardos" />
                    </div>
                  )}
                  {(selectedLoading.product === "Caroço" || selectedLoading.product === "Briquete") && (
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input type="number" id="weight" placeholder="Peso em quilogramas" />
                    </div>
                  )}
                  
                  <Button onClick={handleCompleteLoading} className="w-full bg-success hover:bg-success/90">
                    ✅ Confirmar Saída - Finalizar e Remover
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Caminhão saiu. Será removido da lista após confirmar.
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Loading;
