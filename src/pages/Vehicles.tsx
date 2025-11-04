import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Truck, Clock, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVehicles, useProducers } from "@/hooks/use-supabase";

const Vehicles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, loading, addVehicle, deleteVehicle } = useVehicles();
  const { producers, loading: loadingProducers } = useProducers();
  
  // Verificar se veio da página de carregamentos
  const urlParams = new URLSearchParams(window.location.search);
  const isCarregamento = urlParams.get('type') === 'carregamento';
  
  const [savedPlates, setSavedPlates] = useState<string[]>([]);
  const [savedDrivers, setSavedDrivers] = useState<string[]>([]);
  const [savedVehicleTypes, setSavedVehicleTypes] = useState<string[]>(["Carreta", "Caminhão", "Van"]);

  const handleDeleteVehicle = async (id: string, plate: string) => {
    if (confirm(`Tem certeza que deseja excluir o veículo ${plate}?`)) {
      try {
        await deleteVehicle(id);
      } catch (error) {
        console.error('Erro ao excluir veículo:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const plate = formData.get("plate") as string;
    const driver = formData.get("driver") as string;
    const vehicleType = formData.get("vehicleType") as string;
    const producerName = formData.get("producer") as string;
    
    // Salvar valores para autocomplete futuro
    if (plate && !savedPlates.includes(plate)) setSavedPlates([...savedPlates, plate]);
    if (driver && !savedDrivers.includes(driver)) setSavedDrivers([...savedDrivers, driver]);
    if (vehicleType && !savedVehicleTypes.includes(vehicleType)) setSavedVehicleTypes([...savedVehicleTypes, vehicleType]);
    
    const vehicleData = {
      type: formData.get("type") as string,
      date: formData.get("date") as string,
      entry_time: formData.get("time") as string,
      exit_time: formData.get("exitTime") as string || undefined,
      plate: plate,
      driver: driver,
      vehicle_type: vehicleType,
      purpose: formData.get("purpose") as string,
      producer_name: producerName || "",
      observations: formData.get("observations") as string,
    };
    
    try {
      await addVehicle(vehicleData);
      e.currentTarget.reset();
      // Recarregar a página para garantir que os dados aparecem
      window.location.reload();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const todayVehicles = vehicles.filter(v => v.date === new Date().toISOString().split('T')[0]);
  
  const calculateInternalTime = (entryTime: string, exitTime?: string) => {
    if (!exitTime) return "-";
    const [entryH, entryM] = entryTime.split(':').map(Number);
    const [exitH, exitM] = exitTime.split(':').map(Number);
    const totalMinutes = (exitH * 60 + exitM) - (entryH * 60 + entryM);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  if (loading || loadingProducers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold tv-title">Controle de Veículos</h1>
              <p className="text-xs md:text-sm text-muted-foreground tv-text">Entradas e saídas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {isCarregamento ? "Registrar Carregamento" : "Registrar Entrada"}
              </CardTitle>
              <CardDescription>
                {isCarregamento ? "Cadastro de entrada para carregamento (Pluma, Caroço, etc.)" : "Cadastro de entrada de veículos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 form-mobile">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Entrada</Label>
                    <Select name="type" required defaultValue={isCarregamento ? "Carregamento" : undefined}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Carregamento">Carregamento</SelectItem>
                        <SelectItem value="Colaborador">Colaborador</SelectItem>
                        <SelectItem value="Visitante">Visitante</SelectItem>
                        <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="Prestador">Prestador</SelectItem>
                        <SelectItem value="Diretoria">Diretoria</SelectItem>
                        <SelectItem value="Regional">Regional</SelectItem>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora de Entrada</Label>
                    <Input type="time" name="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitTime">Hora da Saída</Label>
                    <Input type="time" name="exitTime" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa do Veículo</Label>
                  <Input name="plate" list="plates-list" placeholder="Digite ou selecione" required />
                  <datalist id="plates-list">
                    {savedPlates.map((plate) => <option key={plate} value={plate} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Motorista</Label>
                  <Input name="driver" list="drivers-list" placeholder="Digite ou selecione" required />
                  <datalist id="drivers-list">
                    {savedDrivers.map((driver) => <option key={driver} value={driver} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                  <Input name="vehicleType" list="vehicle-types-list" placeholder="Digite ou selecione" required />
                  <datalist id="vehicle-types-list">
                    {savedVehicleTypes.map((type) => <option key={type} value={type} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Finalidade</Label>
                  <Textarea name="purpose" placeholder="Descreva o motivo da entrada" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea name="observations" placeholder="Informações adicionais" />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Entrada
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Relatório de Hoje
                </CardTitle>
                <CardDescription>{todayVehicles.length} veículos registrados hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum veículo registrado hoje
                        </TableCell>
                      </TableRow>
                    ) : (
                      todayVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.plate}</TableCell>
                          <TableCell>{vehicle.driver}</TableCell>
                          <TableCell>{vehicle.entry_time}</TableCell>
                          <TableCell>{vehicle.exit_time || "-"}</TableCell>
                          <TableCell>{calculateInternalTime(vehicle.entry_time, vehicle.exit_time)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVehicle(vehicle.id, vehicle.plate)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Vehicles;
