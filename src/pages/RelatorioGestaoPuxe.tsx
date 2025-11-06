import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, TrendingUp, Clock, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import logo from "@/assets/BF_logo.png";
import { useCottonPull } from "@/hooks/use-supabase";
import type { CottonPull } from "@/lib/supabase";

interface DadosDiario {
  dia: string;
  total_viagens: number;
  total_veiculos: number;
  media_algodoeira_min: number;
  media_viagem_min: number;
  media_total_min: number;
}

interface DadosMensal {
  mes: string;
  fazenda: string;
  viagens: number;
  media_algodoeira_min: number;
  media_viagem_min: number;
  media_total_min: number;
}

interface RankingData {
  motorista: string;
  placa: string;
  viagens: number;
  media_algodoeira_min: number;
  media_viagem_min: number;
  media_total_min: number;
  ultima_viagem: string;
}

interface ResumoPlaca {
  placa: string;
  motorista: string;
  viagens: number;
  rolos: number;
  tempoAlgodoeira: number;
  tempoViagemLavoura: number;
  talhoes: Set<string>;
}

interface DetalhePuxe extends CottonPull {
  tempo_algodoeira_min?: number;
  tempo_viagem_lavoura_min?: number;
}

const RelatorioGestaoPuxe = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("analitico");
  const [dadosDiario, setDadosDiario] = useState<DadosDiario[]>([]);
  const [dadosMensal, setDadosMensal] = useState<DadosMensal[]>([]);
  const [ranking, setRanking] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediasGerais, setMediasGerais] = useState({ algodoeira: 0, viagem: 0, totalViagens: 0 });
  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [filtroPlaca, setFiltroPlaca] = useState("");
  const [rankingDetalhado, setRankingDetalhado] = useState<DetalhePuxe[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [puxeViagensMap, setPuxeViagensMap] = useState<Map<string, number>>(new Map());
  const { records: cottonRecords } = useCottonPull();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar dados diários
      const { data: diario, error: erroDiario } = await supabase
        .from("view_puxe_diario")
        .select("*")
        .order("dia", { ascending: false })
        .limit(30);

      if (!erroDiario && diario) {
        setDadosDiario(diario);
      }

      // Buscar dados mensais
      const { data: mensal, error: erroMensal } = await supabase
        .from("view_puxe_mensal")
        .select("*")
        .order("mes", { ascending: false });

      if (!erroMensal && mensal) {
        setDadosMensal(mensal);
      }

      // Buscar ranking
      const { data: rank, error: erroRank } = await supabase
        .from("view_ranking_puxe")
        .select("*")
        .order("viagens", { ascending: false })
        .limit(20);

      if (!erroRank && rank) {
        setRanking(rank);
      }

      // Buscar médias gerais DIRETO da tabela puxe_viagens
      // FILTRO: apenas viagens onde entrada E saída são NO MESMO DIA
      const { data: viagensCompletas, error: erroViagens } = await supabase
        .from("puxe_viagens")
        .select("hora_chegada, hora_saida, tempo_unidade_min, tempo_lavoura_min")
        .not("hora_chegada", "is", null)
        .not("hora_saida", "is", null)
        .not("tempo_unidade_min", "is", null);

      if (!erroViagens && viagensCompletas && viagensCompletas.length > 0) {
        // Filtrar apenas viagens onde entrada e saída são no mesmo dia
        const viagensMesmoDia = viagensCompletas.filter(v => {
          const dataChegada = new Date(v.hora_chegada).toDateString();
          const dataSaida = new Date(v.hora_saida).toDateString();
          return dataChegada === dataSaida && (v.tempo_unidade_min || 0) > 0;
        });

        if (viagensMesmoDia.length > 0) {
          const somaAlgodoeira = viagensMesmoDia.reduce((sum, v) => sum + (v.tempo_unidade_min || 0), 0);
          const somaViagem = viagensMesmoDia.reduce((sum, v) => sum + (v.tempo_lavoura_min || 0), 0);
          
          setMediasGerais({
            algodoeira: Math.round(somaAlgodoeira / viagensMesmoDia.length),
            viagem: Math.round(somaViagem / viagensMesmoDia.length),
            totalViagens: viagensMesmoDia.length,
          });
        }
      }

      // Buscar tempo_lavoura_min da tabela puxe_viagens para mapear por placa/data/hora
      const { data: viagensLavoura, error: erroLavoura } = await supabase
        .from("puxe_viagens")
        .select("placa, data, hora_chegada, tempo_lavoura_min")
        .not("tempo_lavoura_min", "is", null);

      if (!erroLavoura && viagensLavoura) {
        const mapaViagens = new Map<string, number>();
        viagensLavoura.forEach(v => {
          // Criar chave: placa + data + hora
          const hora = new Date(v.hora_chegada).toTimeString().substring(0, 5);
          const key = `${v.placa}_${v.data}_${hora}`;
          mapaViagens.set(key, v.tempo_lavoura_min || 0);
        });
        setPuxeViagensMap(mapaViagens);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totalizadores para cards de resumo
  const totalizadoresGerais = dadosDiario.reduce(
    (acc, d) => ({
      viagensTotal: acc.viagensTotal + d.total_viagens,
      veiculosTotal: acc.veiculosTotal + d.total_veiculos,
    }),
    { viagensTotal: 0, veiculosTotal: 0 }
  );

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  // Formatar minutos para horas e minutos
  const formatTime = (minutes: number | null) => {
    if (!minutes) return "0min";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const handleRankingClick = async (placa: string, motorista: string) => {
    try {
      // Buscar todos os registros dessa placa/motorista
      const registrosPlaca = cottonRecords.filter(
        r => r.plate === placa && r.driver === motorista
      ).sort((a, b) => `${b.date} ${b.entry_time}`.localeCompare(`${a.date} ${a.entry_time}`));
      
      // Adicionar cálculos de tempo
      const detalhesComTempo = registrosPlaca.map(r => {
        let tempo_algodoeira_min = null;
        if (r.entry_time && r.exit_time) {
          const [eH, eM] = r.entry_time.split(':').map(Number);
          const [sH, sM] = r.exit_time.split(':').map(Number);
          tempo_algodoeira_min = (sH * 60 + sM) - (eH * 60 + eM);
        }
        
        // Buscar tempo viagem lavoura do mapa
        const mapKey = r.entry_time ? `${r.plate}_${r.date}_${r.entry_time}` : '';
        const tempo_viagem_lavoura_min = mapKey ? puxeViagensMap.get(mapKey) || null : null;
        
        return {
          ...r,
          tempo_algodoeira_min,
          tempo_viagem_lavoura_min
        };
      });
      
      setRankingDetalhado(detalhesComTempo);
      setDialogOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes do ranking:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")} className="flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-emerald-400">Gestão do Puxe de Rolos</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Análise de tempos e performance</p>
          </div>
        </div>
        {/* Logo da Empresa */}
        <div className="flex items-center gap-3 bg-gray-800/60 px-4 py-2 rounded-lg border border-emerald-500/30">
          <img src={logo} alt="IBA Santa Luzia Logo" className="h-10 w-auto object-contain" />
          <div className="text-right">
            <p className="font-bold text-emerald-400 text-sm">IBA Santa Luzia</p>
            <p className="text-xs text-gray-400">Controle Guarita</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total de Viagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">
              {totalizadoresGerais.viagensTotal}
            </div>
            <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Veículos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{ranking.length}</div>
            <p className="text-xs text-gray-500 mt-1">Veículos no ranking</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tempo Algodoeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              {formatTime(mediasGerais.algodoeira)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Média geral ({mediasGerais.totalViagens} viagens)</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Tempo Viagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">
              {formatTime(mediasGerais.viagem)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Média geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Relatórios */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger
            value="analitico"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            � Analítico
          </TabsTrigger>
          <TabsTrigger
            value="ranking"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            🏁 Ranking
          </TabsTrigger>
        </TabsList>

        {/* === RELATÓRIO ANALÍTICO === */}
        <TabsContent value="analitico" className="space-y-4">
          {/* Resumo Diário por Placa/Motorista */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Resumo Diário - Últimos 7 Dias
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">Performance por veículo</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  // Agrupar registros dos últimos 7 dias por placa
                  const hoje = new Date();
                  const seteDiasAtras = new Date(hoje);
                  seteDiasAtras.setDate(hoje.getDate() - 7);
                  
                  const registrosRecentes = cottonRecords.filter(r => {
                    const dataRegistro = new Date(r.date);
                    return dataRegistro >= seteDiasAtras && dataRegistro <= hoje;
                  });

                  // Agrupar por placa
                  const porPlaca = registrosRecentes.reduce((acc, r) => {
                    const key = r.plate;
                    if (!acc[key]) {
                      acc[key] = {
                        placa: r.plate,
                        motorista: r.driver,
                        viagens: 0,
                        rolos: 0,
                        tempoAlgodoeira: 0,
                        tempoViagemLavoura: 0,
                        talhoes: new Set<string>(),
                      };
                    }
                    acc[key].viagens += 1;
                    acc[key].rolos += r.rolls;
                    if (r.talhao) acc[key].talhoes.add(r.talhao);
                    
                    // Calcular tempo algodoeira (permanência) se tiver entrada e saída
                    if (r.entry_time && r.exit_time) {
                      const [eH, eM] = r.entry_time.split(':').map(Number);
                      const [sH, sM] = r.exit_time.split(':').map(Number);
                      const tempo = (sH * 60 + sM) - (eH * 60 + eM);
                      if (tempo > 0) acc[key].tempoAlgodoeira += tempo;
                    }
                    
                    // Buscar tempo de viagem lavoura do mapa puxe_viagens
                    if (r.entry_time) {
                      const mapKey = `${r.plate}_${r.date}_${r.entry_time}`;
                      const tempoViagem = puxeViagensMap.get(mapKey);
                      if (tempoViagem && tempoViagem > 0) {
                        acc[key].tempoViagemLavoura += tempoViagem;
                      }
                    }
                    
                    return acc;
                  }, {} as Record<string, ResumoPlaca>);

                  return Object.values(porPlaca)
                    .sort((a: ResumoPlaca, b: ResumoPlaca) => b.viagens - a.viagens)
                    .slice(0, 12)
                    .map((dados: ResumoPlaca, idx) => (
                      <Card key={idx} className="bg-gray-800/60 border-gray-700 hover:border-emerald-500/50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400 text-lg">{dados.placa}</span>
                            <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded">
                              {dados.viagens} viagens
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{dados.motorista}</p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Rolos:</span>
                            <span className="text-white font-medium">{dados.rolos.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">🏭 Tempo Algodoeira:</span>
                            <span className="text-yellow-400 font-medium">
                              {formatTime(dados.viagens > 0 ? Math.round(dados.tempoAlgodoeira / dados.viagens) : 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">🚜 Tempo Viagem:</span>
                            <span className="text-blue-400 font-medium">
                              {dados.tempoViagemLavoura > 0 
                                ? formatTime(Math.round(dados.tempoViagemLavoura / dados.viagens))
                                : 'N/A'}
                            </span>
                          </div>
                          {dados.talhoes.size > 0 && (
                            <div className="text-sm pt-2 border-t border-gray-700">
                              <span className="text-gray-400">TH: </span>
                              <span className="text-cyan-400 font-medium">
                                {Array.from(dados.talhoes).join(', ')}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ));
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Filtros para tabela detalhada */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Filtrar Viagens Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Motorista</label>
                  <Input
                    placeholder="Digite o nome do motorista"
                    value={filtroMotorista}
                    onChange={(e) => setFiltroMotorista(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Placa</label>
                  <Input
                    placeholder="Digite a placa"
                    value={filtroPlaca}
                    onChange={(e) => setFiltroPlaca(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Carga a Carga */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Relatório Carga a Carga
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {cottonRecords
                  .filter(r => 
                    (!filtroMotorista || r.driver.toLowerCase().includes(filtroMotorista.toLowerCase())) &&
                    (!filtroPlaca || r.plate.toLowerCase().includes(filtroPlaca.toLowerCase()))
                  ).length} registros encontrados
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2">Data</th>
                      <th className="text-left py-3 px-2">Entrada</th>
                      <th className="text-left py-3 px-2">Saída</th>
                      <th className="text-left py-3 px-2">Placa</th>
                      <th className="text-left py-3 px-2">Motorista</th>
                      <th className="text-left py-3 px-2">Fazenda</th>
                      <th className="text-left py-3 px-2">TH</th>
                      <th className="text-center py-3 px-2">Rolos</th>
                      <th className="text-center py-3 px-2">🏭 T. Algod.</th>
                      <th className="text-center py-3 px-2">🚜 T. Viagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cottonRecords
                      .filter(r => 
                        (!filtroMotorista || r.driver.toLowerCase().includes(filtroMotorista.toLowerCase())) &&
                        (!filtroPlaca || r.plate.toLowerCase().includes(filtroPlaca.toLowerCase()))
                      )
                      .sort((a, b) => `${b.date} ${b.entry_time}`.localeCompare(`${a.date} ${a.entry_time}`))
                      .slice(0, 100)
                      .map((r, i) => {
                        const tempoAlgodoeira = r.entry_time && r.exit_time 
                          ? (() => {
                              const [eH, eM] = r.entry_time.split(':').map(Number);
                              const [sH, sM] = r.exit_time.split(':').map(Number);
                              return (sH * 60 + sM) - (eH * 60 + eM);
                            })()
                          : null;
                        
                        // Buscar tempo viagem lavoura do mapa
                        const mapKey = r.entry_time ? `${r.plate}_${r.date}_${r.entry_time}` : '';
                        const tempoViagemLavoura = mapKey ? puxeViagensMap.get(mapKey) || null : null;
                        
                        return (
                          <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 text-white">
                            <td className="py-3 px-2 text-gray-100">
                              {new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td className="py-3 px-2 text-cyan-400 font-medium">{r.entry_time}</td>
                            <td className="py-3 px-2 text-orange-400 font-medium">{r.exit_time || "-"}</td>
                            <td className="py-3 px-2 font-semibold text-white">{r.plate}</td>
                            <td className="py-3 px-2 text-gray-100">{r.driver}</td>
                            <td className="py-3 px-2 text-emerald-400">{r.farm}</td>
                            <td className="py-3 px-2 text-yellow-400">{r.talhao || "-"}</td>
                            <td className="text-center py-3 px-2 text-blue-400 font-medium">{r.rolls}</td>
                            <td className="text-center py-3 px-2 text-yellow-400 font-medium">
                              {tempoAlgodoeira ? formatTime(tempoAlgodoeira) : "-"}
                            </td>
                            <td className="text-center py-3 px-2 text-blue-400 font-medium">
                              {tempoViagemLavoura ? formatTime(tempoViagemLavoura) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === RANKING === */}
        <TabsContent value="ranking" className="space-y-4">
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Top Caminhões / Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2">#</th>
                      <th className="text-left py-3 px-2">Motorista</th>
                      <th className="text-left py-3 px-2">Placa</th>
                      <th className="text-center py-3 px-2">Viagens</th>
                      <th className="text-center py-3 px-2">Tempo Algodoeira</th>
                      <th className="text-center py-3 px-2">Tempo Viagem</th>
                      <th className="text-center py-3 px-2">Tempo Total</th>
                      <th className="text-center py-3 px-2">Última Viagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, i) => (
                      <tr
                        key={i}
                        onClick={() => handleRankingClick(r.placa, r.motorista)}
                        className={`border-b border-gray-800 hover:bg-emerald-900/30 text-gray-100 cursor-pointer transition-colors ${
                          i < 3 ? "bg-emerald-900/20" : ""
                        }`}
                      >
                        <td className="py-3 px-2">
                          {i === 0 && <span className="text-yellow-400 text-lg">🥇</span>}
                          {i === 1 && <span className="text-gray-300 text-lg">🥈</span>}
                          {i === 2 && <span className="text-orange-400 text-lg">🥉</span>}
                          {i > 2 && <span className="text-gray-400">{i + 1}</span>}
                        </td>
                        <td className="py-3 px-2 font-medium text-white">{r.motorista}</td>
                        <td className="py-3 px-2 text-cyan-400">{r.placa}</td>
                        <td className="text-center py-3 px-2 font-bold text-emerald-400">
                          {r.viagens}
                        </td>
                        <td className="text-center py-3 px-2 text-yellow-400">
                          {formatTime(r.media_algodoeira_min)}
                        </td>
                        <td className="text-center py-3 px-2 text-cyan-400">
                          {formatTime(r.media_viagem_min)}
                        </td>
                        <td className="text-center py-3 px-2 font-semibold text-white">
                          {formatTime(r.media_total_min)}
                        </td>
                        <td className="text-center py-3 px-2 text-white text-xs">
                          {new Date(r.ultima_viagem + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para detalhes do ranking */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-400">
              Histórico Completo - {rankingDetalhado?.[0]?.plate || ''} / {rankingDetalhado?.[0]?.driver || ''}
            </DialogTitle>
          </DialogHeader>
          
          {rankingDetalhado && (
            <div className="space-y-4">
              {/* Totalizadores */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gray-800/60 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total de Viagens</p>
                      <p className="text-2xl font-bold text-emerald-400">{rankingDetalhado.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/60 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total de Rolos</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {rankingDetalhado.reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/60 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Média Algodoeira</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {formatTime(
                          Math.round(
                            rankingDetalhado
                              .filter(r => r.tempo_algodoeira_min)
                              .reduce((sum, r) => sum + (r.tempo_algodoeira_min || 0), 0) /
                            rankingDetalhado.filter(r => r.tempo_algodoeira_min).length
                          )
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela detalhada */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-2 px-2">Data</th>
                      <th className="text-left py-2 px-2">Entrada</th>
                      <th className="text-left py-2 px-2">Saída</th>
                      <th className="text-left py-2 px-2">Fazenda</th>
                      <th className="text-left py-2 px-2">TH</th>
                      <th className="text-center py-2 px-2">Rolos</th>
                      <th className="text-center py-2 px-2">🏭 T. Algod.</th>
                      <th className="text-center py-2 px-2">🚜 T. Viagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingDetalhado.map((r, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-2 px-2 text-gray-100">
                          {new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2 px-2 text-cyan-400">{r.entry_time}</td>
                        <td className="py-2 px-2 text-orange-400">{r.exit_time || "-"}</td>
                        <td className="py-2 px-2 text-emerald-400">{r.farm}</td>
                        <td className="py-2 px-2 text-yellow-400">{r.talhao || "-"}</td>
                        <td className="text-center py-2 px-2 text-blue-400 font-medium">{r.rolls}</td>
                        <td className="text-center py-2 px-2 text-yellow-400 font-medium">
                          {r.tempo_algodoeira_min ? formatTime(r.tempo_algodoeira_min) : "-"}
                        </td>
                        <td className="text-center py-2 px-2 text-blue-400 font-medium">
                          {r.tempo_viagem_lavoura_min ? formatTime(r.tempo_viagem_lavoura_min) : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelatorioGestaoPuxe;
