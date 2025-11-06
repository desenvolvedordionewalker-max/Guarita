import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Package, Clock, Edit2, Trash2, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoadingRecords } from "@/hooks/use-supabase";
import { LoadingRecord } from "@/lib/supabase";

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
  const [destinations] = useState<string[]>(["Santos-SP", "Guararapes-SP", "Cubatão-SP", "Guarujá-SP", "Paranaguá-PR", "Tangará da Serra-MT", "Alto Araguaia-MT"]);
  const [harvestYears] = useState<string[]>(["2024/2025", "2023/2024", "2022/2023", "2021/2022"]);
  
  const [selectedLoading, setSelectedLoading] = useState<LoadingRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTruckType, setNewTruckType] = useState("");
  const [newCarrier, setNewCarrier] = useState("");
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
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      product: formData.get("product") as string,
      harvest_year: formData.get("harvestYear") as string,
      truck_type: formData.get("truckType") as string,
      is_sider: formData.get("isSider") === "on",
      carrier: formData.get("carrier") as string,
      destination: formData.get("destination") as string || "",
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
    if (!entryDate || !entryTime) {
      toast({ title: "Campos obrigatórios", description: "Preencha data e hora de entrada.", variant: "destructive" });
      return;
    }
    
    try {
      await updateRecord(selectedLoading.id, {
        entry_date: entryDate,
        entry_time: entryTime
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
    const bales = Number((document.getElementById("bales") as HTMLInputElement)?.value || 0);
    const weight = Number((document.getElementById("weight") as HTMLInputElement)?.value || 0);
    if (!exitDate || !exitTime) {
      toast({ title: "Campos obrigatórios", description: "Preencha data e hora de saída.", variant: "destructive" });
      return;
    }
    
    try {
      await updateRecord(selectedLoading.id, {
        exit_date: exitDate,
        exit_time: exitTime,
        invoice_number: invoiceNumber || null,
        bales,
        weight
      });
      setIsDialogOpen(false);
      toast({
        title: "Carregamento finalizado!",
        description: `Placa ${selectedLoading.plate} - Nota Fiscal: ${invoiceNumber || 'N/A'}`,
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

  const queuedLoadings = loadings.filter(l => !l.entry_date);
  const loadingInProgress = loadings.filter(l => l.entry_date && !l.exit_date);
  const completedLoadings = loadings.filter(l => l.exit_date);

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
                <div className="space-y-2"><Label>Data</Label><Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} /></div>
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
                  <div className="flex items-center space-x-2 h-10"><Checkbox id="isSider" name="isSider" />
                    <label htmlFor="isSider" className="text-sm font-medium">Caminhão SIDER</label>
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
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90"><Plus className="w-4 h-4 mr-2" />Adicionar à Fila</Button>
            </form>
          </CardContent>
        </Card>
        )}

        <Tabs defaultValue="queue"><TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue" className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground">Fila ({queuedLoadings.length})</TabsTrigger>
            <TabsTrigger value="loading" className="data-[state=active]:bg-info data-[state=active]:text-info-foreground">Carregando ({loadingInProgress.length})</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-success data-[state=active]:text-success-foreground">Concluídos ({completedLoadings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="queue" className="space-y-4 mt-6">
            {queuedLoadings.map(l => (
              <Card key={l.id} className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getProductColor(l.product)}`} onClick={() => handleCardClick(l)}>
                <CardContent className="pt-6">
                  <div className="flex justify-between mb-3">
                    <div>
                      <div className="flex gap-2 mb-1 items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getProductColor(l.product)}`}>
                          {l.product}
                        </span>
                        {l.is_sider && <span className="px-2 py-0.5 rounded bg-info/20 text-info text-xs">SIDER</span>}
                        {getQueuePosition(l).position === 1 && (
                          <div className="flex items-center gap-1">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-bold text-yellow-600">1º DA VEZ</span>
                          </div>
                        )}
                        {getQueuePosition(l).position === 2 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-blue-600">PRÓXIMO DA VEZ</span>
                          </div>
                        )}
                      </div>
                      <p className="font-semibold text-lg">{l.plate}</p>
                      <p className="text-sm text-muted-foreground">
                        {getPositionMessage(l)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEditClick(l, e)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(l, e)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Transportadora:</span> {l.carrier}</p>
                    <p><span className="text-muted-foreground">Destino:</span> {l.destination}</p>
                    <p><span className="text-muted-foreground">Motorista:</span> {l.driver}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="loading" className="space-y-4 mt-6">
            {loadingInProgress.map(l => (
              <Card key={l.id} className={`border-l-4 cursor-pointer ${getProductColor(l.product)}`} onClick={() => handleCardClick(l)}>
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex gap-2 mb-1 items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getProductColor(l.product)}`}>
                          {l.product}
                        </span>
                        <Clock className="w-4 h-4 text-info" />
                        <span className="text-xs font-bold text-green-600">EM CARREGAMENTO</span>
                      </div>
                      <p className="font-semibold text-lg mt-1">{l.plate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEditClick(l, e)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(l, e)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Entrada:</span> {l.entry_date} {l.entry_time}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Motorista:</span> {l.driver}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedLoadings.map(l => (
              <Card key={l.id} className={`border-l-4 ${getProductColor(l.product)}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex gap-2 mb-1 items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getProductColor(l.product)}`}>
                          {l.product}
                        </span>
                        <span className="text-xs font-bold text-green-600">CONCLUÍDO</span>
                      </div>
                      <p className="font-semibold mt-1">{l.plate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEditClick(l, e)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(l, e)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm mt-2">
                    <p><span className="text-muted-foreground">Saída:</span> {l.exit_date} {l.exit_time}</p>
                    <p><span className="text-muted-foreground">Motorista:</span> {l.driver}</p>
                    {l.bales > 0 && <p><span className="text-muted-foreground">Fardos:</span> {l.bales}</p>}
                    {l.weight > 0 && <p><span className="text-muted-foreground">Peso:</span> {l.weight} kg</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
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
                <Input type="date" id="entryDate" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Hora de Entrada</Label>
                <Input type="time" id="entryTime" />
              </div>
              <Button onClick={handleStartLoading} className="w-full bg-info hover:bg-info/90">
                Iniciar Carregamento
              </Button>
            </div>
          )}

          {/* Modo Gerenciamento - Concluir Carregamento */}
          {!isEditMode && selectedLoading && selectedLoading.entry_date && !selectedLoading.exit_date && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Data de Saída</Label>
                <Input type="date" id="exitDate" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Hora de Saída</Label>
                <Input type="time" id="exitTime" />
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
                Concluir Carregamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Loading;
