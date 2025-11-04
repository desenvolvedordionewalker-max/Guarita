import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, Download, Share2, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicles, useCottonPull, useRainRecords, useEquipment, useLoadingRecords } from "@/hooks/use-supabase";
import jsPDF from "jspdf";

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, loading: loadingVehicles } = useVehicles();
  const { records: cottonRecords, loading: loadingCotton } = useCottonPull();
  const { records: rainRecords, loading: loadingRain } = useRainRecords();
  const { records: equipmentRecords, loading: loadingEquipment } = useEquipment();
  const { records: loadingRecords, loading: loadingLoadings } = useLoadingRecords();

  // Estados dos filtros
  const [dateFilter, setDateFilter] = useState("");
  const [productFilter, setProductFilter] = useState("todos");
  const [plateFilter, setPlateFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("day"); // day, month, year

  // Calcular estatísticas reais
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthVehicles = vehicles.filter(v => 
    new Date(v.date).getMonth() === currentMonth && 
    new Date(v.date).getFullYear() === currentYear
  );
  
  const carregamentosPluma = thisMonthVehicles.filter(v => 
    v.type === 'Carregamento' && v.purpose?.toLowerCase().includes('pluma')
  );
  
  const carregamentosCaroco = thisMonthVehicles.filter(v => 
    v.type === 'Carregamento' && v.purpose?.toLowerCase().includes('caroço')
  );
  
  const totalRolls = cottonRecords.reduce((sum, r) => sum + r.rolls, 0);
  
  const yearRain = rainRecords
    .filter(r => new Date(r.date).getFullYear() === currentYear)
    .reduce((sum, r) => sum + r.millimeters, 0);
    
  const equipmentsSaidas = equipmentRecords.length;

  const stats = [
    { 
      label: "Total de Veículos (Mês)", 
      value: loadingVehicles ? "..." : thisMonthVehicles.length.toString(), 
      change: "+12%" 
    },
    { 
      label: "Carregamentos Pluma", 
      value: loadingVehicles ? "..." : carregamentosPluma.length.toString(), 
      change: "+8%" 
    },
    { 
      label: "Carregamentos Caroço", 
      value: loadingVehicles ? "..." : carregamentosCaroco.length.toString(), 
      change: "+5%" 
    },
    { 
      label: "Rolos Puxados", 
      value: loadingCotton ? "..." : totalRolls.toLocaleString('pt-BR'), 
      change: "+15%" 
    },
    { 
      label: "Chuva Acumulada (Ano)", 
      value: loadingRain ? "..." : `${yearRain.toFixed(1)} mm`, 
      change: "-3%" 
    },
    { 
      label: "Equipamentos Saídos", 
      value: loadingEquipment ? "..." : equipmentsSaidas.toString(), 
      change: "+2%" 
    },
  ];

  // Top produtores baseado em dados reais
  const producerStats = cottonRecords.reduce((acc, record) => {
    if (!acc[record.producer]) {
      acc[record.producer] = 0;
    }
    acc[record.producer] += record.rolls;
    return acc;
  }, {} as Record<string, number>);

  const topProducers = Object.entries(producerStats)
    .map(([name, rolls]) => ({ name, rolls }))
    .sort((a, b) => b.rolls - a.rolls)
    .slice(0, 5);

  // Carregamentos por tipo de veículo baseado em dados reais
  const vehicleTypeStats = vehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.vehicle_type]) {
      acc[vehicle.vehicle_type] = 0;
    }
    acc[vehicle.vehicle_type]++;
    return acc;
  }, {} as Record<string, number>);

  const loadingByTruck = Object.entries(vehicleTypeStats)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const isLoading = loadingVehicles || loadingCotton || loadingRain || loadingEquipment;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  const generateDailySummary = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Dados reais do dia
    const todayVehicles = vehicles.filter(v => v.date === todayDate);
    const todayVehiclesEntered = todayVehicles.length;
    const todayVehiclesExited = todayVehicles.filter(v => v.exit_time).length;
    
    const todayCarregamentos = todayVehicles.filter(v => v.type === 'Carregamento');
    const pluma = todayCarregamentos.filter(v => v.purpose?.toLowerCase().includes('pluma')).length;
    const caroco = todayCarregamentos.filter(v => v.purpose?.toLowerCase().includes('caroço')).length;
    
    const todayCotton = cottonRecords.filter(r => r.date === todayDate);
    const todayRolls = todayCotton.reduce((sum, r) => sum + r.rolls, 0);
    const todayProducers = [...new Set(todayCotton.map(r => r.producer))].slice(0, 3).join(', ');
    
    const todayRainTotal = rainRecords
      .filter(r => r.date === todayDate)
      .reduce((sum, r) => sum + r.millimeters, 0);
    
    const monthRain = rainRecords
      .filter(r => new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear)
      .reduce((sum, r) => sum + r.millimeters, 0);
    
    const todayEquipment = equipmentRecords.filter(e => e.date === todayDate)[0];
    
    const message = `🏢 IBA Santa Luzia - Controle Guarita
📅 Resumo Diário - ${today}

🚛 Entradas/Saídas:
${todayVehiclesEntered} veículos entraram
${todayVehiclesExited} veículos saíram

📦 Carregamentos:
🧺 Pluma: ${pluma} carretas
🌰 Caroço: ${caroco} carretas

🌾 Puxe de algodão:
${todayRolls} rolos recebidos${todayProducers ? `\nProdutoras: ${todayProducers}` : ''}

🌧️ Clima:
Chuva do dia: ${todayRainTotal.toFixed(1)} mm
Acumulado do mês: ${monthRain.toFixed(1)} mm
Acumulado do ano: ${yearRain.toFixed(1)} mm${todayEquipment ? `

🛠️ Equipamento enviado:
${todayEquipment.name}
Destino: ${todayEquipment.destination}
Autorizado por: ${todayEquipment.authorized_by}` : ''}

📌 Mensagem automática gerada via Controle Guarita`;

    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem copiada!",
      description: "Cole no WhatsApp para compartilhar o resumo.",
    });
  };

  const generateQueueStatus = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const message = `🏢 IBA Santa Luzia - Controle Guarita
🕒 Fila de Carregamento - ${today} - ${time}

🚛 Pluma – 3 carretas aguardando:
🚛 Bitrem | TransBrasil
🚛 Rodotrem | CoopAgro
🚛 Toco | Almeida Log

🌰 Caroço – 2 carretas aguardando:
🚚 Rodotrem | JSL
🚚 Trucado | Rocha Transportes

🧵 Fibrilha – 1 carreta aguardando:
🚛 Bitrem | Rápido Oeste

🔥 Briquete – 1 carreta aguardando:
🚛 Bitrem | Transportadora Central

📌 Mensagem automática gerada via Controle Guarita`;

    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem copiada!",
      description: "Cole no WhatsApp para compartilhar o status da fila.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(18);
    doc.text("IBA Santa Luzia - Controle Guarita", 20, 20);
    doc.setFontSize(12);
    doc.text(`Relatório Gerencial - ${today}`, 20, 30);
    
    // Stats
    doc.setFontSize(14);
    doc.text("Indicadores Gerais", 20, 45);
    doc.setFontSize(10);
    let y = 55;
    stats.forEach(stat => {
      doc.text(`${stat.label}: ${stat.value} (${stat.change})`, 20, y);
      y += 8;
    });
    
    // Top Producers
    y += 10;
    doc.setFontSize(14);
    doc.text("Top 5 Produtoras", 20, y);
    doc.setFontSize(10);
    y += 10;
    topProducers.forEach((producer, index) => {
      doc.text(`${index + 1}. ${producer.name}: ${producer.rolls} rolos`, 20, y);
      y += 8;
    });
    
    // Loading by Truck Type
    y += 10;
    doc.setFontSize(14);
    doc.text("Carregamentos por Tipo de Caminhão", 20, y);
    doc.setFontSize(10);
    y += 10;
    loadingByTruck.forEach(item => {
      doc.text(`${item.type}: ${item.count} carretas`, 20, y);
      y += 8;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.text("Gerado automaticamente pelo Sistema Controle Guarita", 20, 280);
    
    doc.save(`relatorio-guarita-${new Date().getTime()}.pdf`);
    
    toast({
      title: "PDF gerado!",
      description: "O relatório foi baixado com sucesso.",
    });
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "IBA Santa Luzia - Controle Guarita\n";
    csvContent += `Relatório gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    csvContent += "Indicador,Valor,Variação\n";
    stats.forEach(stat => {
      csvContent += `"${stat.label}","${stat.value}","${stat.change}"\n`;
    });
    
    csvContent += "\n\nTop 5 Produtoras\n";
    csvContent += "Posição,Nome,Rolos\n";
    topProducers.forEach((producer, index) => {
      csvContent += `${index + 1},"${producer.name}",${producer.rolls}\n`;
    });
    
    csvContent += "\n\nCarregamentos por Tipo de Caminhão\n";
    csvContent += "Tipo,Quantidade\n";
    loadingByTruck.forEach(item => {
      csvContent += `"${item.type}",${item.count}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio-guarita-${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Excel gerado!",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Relatórios e Métricas</h1>
              <p className="text-sm text-muted-foreground">Análises e indicadores</p>
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Overall Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    stat.change.startsWith('+') 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Movimentação Geral com Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Movimentação Geral
            </CardTitle>
            <CardDescription>
              Filtros de data, produto, placa e contadores de rolos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Pluma">Pluma</SelectItem>
                    <SelectItem value="Caroço">Caroço</SelectItem>
                    <SelectItem value="Fibrilha">Fibrilha</SelectItem>
                    <SelectItem value="Briquete">Briquete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Placa</Label>
                <Input 
                  placeholder="Ex: ABC-1234"
                  value={plateFilter}
                  onChange={(e) => setPlateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Dia</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                    <SelectItem value="year">Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contadores de Rolos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{
                      periodFilter === 'day' ? cottonRecords.filter(r => !dateFilter || r.date === dateFilter).reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR') :
                      periodFilter === 'month' ? cottonRecords.filter(r => !dateFilter || r.date.startsWith(dateFilter.substring(0, 7))).reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR') :
                      cottonRecords.reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR')
                    }</p>
                    <p className="text-sm text-muted-foreground">Rolos por {periodFilter === 'day' ? 'Dia' : periodFilter === 'month' ? 'Mês' : 'Ano'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{
                      loadingRecords.filter(l => 
                        (!dateFilter || l.date === dateFilter) &&
                        (productFilter === "todos" || l.product === productFilter) &&
                        (!plateFilter || l.plate.toLowerCase().includes(plateFilter.toLowerCase()))
                      ).length
                    }</p>
                    <p className="text-sm text-muted-foreground">Carregamentos Filtrados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{
                      vehicles.filter(v => 
                        (!dateFilter || v.date === dateFilter) &&
                        (!plateFilter || v.plate.toLowerCase().includes(plateFilter.toLowerCase()))
                      ).length
                    }</p>
                    <p className="text-sm text-muted-foreground">Movimentações de Veículos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Resultados Filtrados */}
            {(dateFilter || (productFilter && productFilter !== "todos") || plateFilter) && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Data</th>
                      <th className="border border-gray-300 p-2 text-left">Tipo</th>
                      <th className="border border-gray-300 p-2 text-left">Placa</th>
                      <th className="border border-gray-300 p-2 text-left">Produto</th>
                      <th className="border border-gray-300 p-2 text-left">Motorista</th>
                      <th className="border border-gray-300 p-2 text-left">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecords
                      .filter(l => 
                        (!dateFilter || l.date === dateFilter) &&
                        (productFilter === "todos" || l.product === productFilter) &&
                        (!plateFilter || l.plate.toLowerCase().includes(plateFilter.toLowerCase()))
                      )
                      .map((loading) => (
                        <tr key={loading.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">{loading.date}</td>
                          <td className="border border-gray-300 p-2">Carregamento</td>
                          <td className="border border-gray-300 p-2 font-medium">{loading.plate}</td>
                          <td className="border border-gray-300 p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              loading.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                              loading.product === 'Caroço' ? 'bg-brown-100 text-brown-800' :
                              loading.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {loading.product}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2">{loading.driver}</td>
                          <td className="border border-gray-300 p-2 text-sm">{loading.carrier} → {loading.destination}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Producers */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produtoras</CardTitle>
              <CardDescription>Ranking por quantidade de rolos entregues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum registro de produtor encontrado</p>
                    <p className="text-sm">Cadastre registros de algodão para ver o ranking</p>
                  </div>
                ) : (
                  topProducers.map((producer, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-primary text-primary-foreground' :
                        index === 1 ? 'bg-secondary text-secondary-foreground' :
                        index === 2 ? 'bg-accent text-accent-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{producer.name}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${topProducers[0] ? (producer.rolls / topProducers[0].rolls) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <p className="font-bold text-primary">{producer.rolls}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading by Truck Type */}
          <Card>
            <CardHeader>
              <CardTitle>Carregamentos por Tipo de Caminhão</CardTitle>
              <CardDescription>Distribuição de carretas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingByTruck.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum veículo registrado</p>
                    <p className="text-sm">Cadastre veículos para ver a distribuição por tipo</p>
                  </div>
                ) : (
                  loadingByTruck.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 font-semibold text-sm">{item.type}</div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-accent h-3 rounded-full transition-all"
                            style={{ width: `${loadingByTruck[0] ? (item.count / loadingByTruck[0].count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <p className="font-bold text-accent w-12 text-right">{item.count}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Mensagens WhatsApp
            </CardTitle>
            <CardDescription>Gere mensagens automáticas para compartilhar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Button 
                className="h-auto py-4 flex-col items-start bg-primary hover:bg-primary/90"
                onClick={generateDailySummary}
              >
                <span className="font-semibold mb-1">📊 Resumo Diário</span>
                <span className="text-xs opacity-90">Movimentação completa do dia</span>
              </Button>
              <Button 
                className="h-auto py-4 flex-col items-start bg-accent hover:bg-accent/90"
                onClick={generateQueueStatus}
              >
                <span className="font-semibold mb-1">🚛 Status da Fila</span>
                <span className="text-xs opacity-90">Carretas aguardando embarque</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
