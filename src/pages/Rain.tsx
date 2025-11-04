import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, CloudRain, Droplets, Calendar, Loader2, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRainRecords } from "@/hooks/use-supabase";

const Rain = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useRainRecords();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthTotal = records
    .filter(r => new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear)
    .reduce((sum, r) => sum + r.millimeters, 0);

  const yearTotal = records
    .filter(r => new Date(r.date).getFullYear() === currentYear)
    .reduce((sum, r) => sum + r.millimeters, 0);

  const todayTotal = records
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + r.millimeters, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const recordData = {
      date: formData.get("date") as string,
      start_time: formData.get("startTime") as string,
      end_time: formData.get("endTime") as string || undefined,
      millimeters: parseFloat(formData.get("mm") as string),
    };
    
    try {
      await addRecord(recordData);
      e.currentTarget.reset();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleEditRecord = (record: { id: string; date: string }) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Edição de registro de chuva será implementada em breve",
    });
  };

  const handleDeleteRecord = async (id: string, date: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro de chuva de ${new Date(date).toLocaleDateString('pt-BR')}?`)) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Erro ao excluir registro:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando registros de chuva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-info/5 via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <CloudRain className="w-6 h-6 text-info" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Controle de Chuva</h1>
              <p className="text-sm text-muted-foreground">Medições pluviométricas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-info">{todayTotal.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Droplets className="w-3 h-3" />
                    Chuva de Hoje (mm)
                  </p>
                </div>
                <CloudRain className="w-8 h-8 text-info/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-info">{monthTotal.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Acumulado do Mês (mm)
                  </p>
                </div>
                <CloudRain className="w-8 h-8 text-info/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-info">{yearTotal.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Acumulado do Ano (mm)
                  </p>
                </div>
                <CloudRain className="w-8 h-8 text-info/30" />
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
                Nova Medição
              </CardTitle>
              <CardDescription>Registre a quantidade de chuva</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input type="date" name="date" required defaultValue={today} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora de Início</Label>
                    <Input type="time" name="startTime" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora do Fim</Label>
                    <Input type="time" name="endTime" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mm">Milímetros (mm)</Label>
                  <Input 
                    type="number" 
                    name="mm" 
                    placeholder="0.0" 
                    step="0.1" 
                    min="0" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-info hover:bg-info/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Medição
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Medições</CardTitle>
                <CardDescription>{records.length} registros</CardDescription>
              </CardHeader>
            </Card>
            {records.map((record) => (
              <Card key={record.id} className="border-info/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-info/10">
                        <Droplets className="w-5 h-5 text-info" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {new Date(record.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.start_time ? `${record.start_time}${record.end_time ? ` - ${record.end_time}` : ''}` : record.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <p className="text-2xl font-bold text-info">{record.millimeters}</p>
                        <p className="text-xs text-muted-foreground">milímetros</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id, record.date)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rain;
