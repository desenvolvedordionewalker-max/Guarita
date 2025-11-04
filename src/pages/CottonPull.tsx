import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Package, Loader2, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCottonPull, useProducers } from "@/hooks/use-supabase";
import { supabase, CottonPull as CottonPullRecord } from "@/lib/supabase";

const CottonPull = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useCottonPull();
  const { producers, loading: loadingProducers } = useProducers();
  const [selectedRecord, setSelectedRecord] = useState<CottonPullRecord | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitRecordId, setExitRecordId] = useState<string>("");
  const [exitTime, setExitTime] = useState("");
  
  const farms = ["CARAJAS", "VENTANIA", "SIMARELLI", "MAMOSE", "JUCARA", "SANTA LUZIA", "TALHAO"];

  // Detectar se veio do Dashboard para marcar saída
  useEffect(() => {
    const exitId = searchParams.get('exit');
    if (exitId && records.length > 0) {
      const recordToExit = records.find(record => record.id === exitId);
      if (recordToExit) {
        // Marcar saída automaticamente
        const now = new Date();
        const exitTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        updateRecord(exitId, { exit_time: exitTime });
        toast({
          title: "Saída registrada!",
          description: `Placa ${recordToExit.plate} - ${recordToExit.producer} marcada como saída às ${exitTime}`,
        });
        
        // Limpar parâmetro da URL
        setSearchParams({});
      }
    }
  }, [searchParams, records, setSearchParams, updateRecord, toast]);

  const totalRolls = records.reduce((sum, record) => sum + record.rolls, 0);

  const handleEditRecord = (record: CottonPullRecord) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Edição de registros será implementada em breve",
    });
  };

  const handleDeleteRecord = async (id: string, plate: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro da placa ${plate}?`)) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Erro ao excluir registro:', error);
      }
    }
  };
  const pendingExits = records.filter(record => !record.exit_time);
  const completed = records.filter(record => record.exit_time);

  const handleDeleteRecord = async (id: string, plate: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro da placa ${plate}?`)) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Erro ao excluir registro:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const recordData = {
      date: formData.get("date") as string,
      entry_time: formData.get("entryTime") as string,
      producer: formData.get("farm") as string, // Usar fazenda como produtor
      farm: formData.get("farm") as string,
      talhao: formData.get("talhao") as string || "",
      plate: formData.get("plate") as string,
      driver: formData.get("driver") as string,
      rolls: parseInt(formData.get("rolls") as string),
      observations: formData.get("observations") as string,
    };
    
    try {
      await addRecord(recordData);
      e.currentTarget.reset();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleExit = async (recordId: string) => {
    setExitRecordId(recordId);
    const currentTime = new Date().toTimeString().slice(0, 5);
    setExitTime(currentTime);
    setExitModalOpen(true);
  };

  const confirmExit = async () => {
    if (!exitTime) {
      toast({
        title: "Erro",
        description: "Por favor, informe o horário de saída.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar record com exit_time
      const { error } = await supabase
        .from('cotton_pull')
        .update({ exit_time: exitTime })
        .eq('id', exitRecordId);

      if (error) throw error;

      toast({
        title: "Saída registrada",
        description: "Veículo registrado como saído com sucesso.",
      });
      
      setExitModalOpen(false);
      setExitRecordId("");
      setExitTime("");
      
      // Recarregar dados
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erro ao registrar saída",
        description: "Não foi possível registrar a saída do veículo.",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingProducers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando registros de algodão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Package className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Puxe de Algodão da Lavoura</h1>
              <p className="text-sm text-muted-foreground">Registro de rolos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{totalRolls}</p>
                <p className="text-sm text-muted-foreground">Total de Rolos Hoje</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{records.length}</p>
                <p className="text-sm text-muted-foreground">Carregamentos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">
                  {new Set(records.map(r => r.producer)).size}
                </p>
                <p className="text-sm text-muted-foreground">Produtoras</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Registrar Puxe
              </CardTitle>
              <CardDescription>Entrada de algodão da lavoura</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryTime">Hora da Entrada</Label>
                    <Input type="time" name="entryTime" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farm">Fazenda</Label>
                  <Select name="farm" required>
                    <SelectTrigger><SelectValue placeholder="Selecione a fazenda" /></SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={farm} value={farm}>{farm}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="talhao">Talhão</Label>
                  <Input name="talhao" placeholder="Digite o talhão" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plate">Placa do Caminhão</Label>
                    <Input name="plate" placeholder="ABC-1234" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver">Nome do Motorista</Label>
                    <Input name="driver" placeholder="Nome completo" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rolls">Quantidade de Rolos</Label>
                  <Input type="number" name="rolls" placeholder="0" required min="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea name="observations" placeholder="Informações adicionais (opcional)" />
                </div>
                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Puxe
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pending Exits */}
          {pendingExits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Aguardando Saída ({pendingExits.length})</CardTitle>
                <CardDescription>Veículos que entraram mas ainda não saíram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingExits.map((record) => {
                    const entryTime = new Date(`1970-01-01T${record.entry_time}`);
                    const now = new Date();
                    const currentTime = new Date(`1970-01-01T${now.toTimeString().slice(0, 8)}`);
                    const diffMs = currentTime.getTime() - entryTime.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    return (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                        <div>
                          <p className="font-medium">{record.plate} - {record.driver}</p>
                          <p className="text-sm text-muted-foreground">{record.farm} | {record.rolls} rolos</p>
                          <p className="text-sm text-orange-600">
                            Entrada: {record.entry_time} | Permanência: {diffHours}h {diffMins}min
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRecord(record.id, record.plate)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleExit(record.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Registrar Saída
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registros de Hoje</CardTitle>
                <CardDescription>{records.length} puxes realizados</CardDescription>
              </CardHeader>
            </Card>
            {records.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Nenhum registro de algodão encontrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              records.map((record) => (
              <Card key={record.id} className="border-secondary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>PUXE DE ALGODÃO</span>
                    <span className="text-secondary">{record.rolls} rolos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Produtora</p>
                      <p className="font-semibold">{record.producer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fazenda</p>
                      <p className="font-semibold">{record.farm}</p>
                    </div>
                    {record.talhao && (
                      <div>
                        <p className="text-sm text-muted-foreground">Talhão</p>
                        <p className="font-semibold">{record.talhao}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Placa</p>
                        <p className="font-medium">{record.plate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entrada</p>
                        <p className="font-medium">{record.entry_time}</p>
                      </div>
                    </div>
                    {record.exit_time && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Saída</p>
                          <p className="font-medium text-green-600">{record.exit_time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Permanência</p>
                          <p className="font-medium">
                            {(() => {
                              try {
                                const entryTime = new Date(`1970-01-01T${record.entry_time}`);
                                const exitTime = new Date(`1970-01-01T${record.exit_time}`);
                                let diffMs = exitTime.getTime() - entryTime.getTime();
                                
                                // Se a diferença for negativa (saída no dia seguinte), adicionar 24h
                                if (diffMs < 0) {
                                  diffMs += 24 * 60 * 60 * 1000;
                                }
                                
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                return `${diffHours}h ${diffMins}min`;
                              } catch (error) {
                                return "Erro no cálculo";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Motorista</p>
                      <p className="font-medium">{record.driver}</p>
                    </div>
                    {record.observations && (
                      <div>
                        <p className="text-sm text-muted-foreground">Observações</p>
                        <p className="text-sm italic">{record.observations}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRecord(record)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecord(record.id, record.plate)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </div>
      </main>
      
      {/* Modal de confirmação de saída */}
      <Dialog open={exitModalOpen} onOpenChange={setExitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Horário de Saída</DialogTitle>
            <DialogDescription>
              Informe o horário de saída do veículo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exit-time">Horário de Saída</Label>
              <Input
                id="exit-time"
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmExit} className="bg-green-600 hover:bg-green-700">
              Confirmar Saída
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CottonPull;
