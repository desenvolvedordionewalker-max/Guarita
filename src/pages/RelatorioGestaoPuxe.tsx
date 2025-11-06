import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowLeft, TrendingUp, Clock, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import logo from "@/assets/BF_logo.png";
import { useCottonPull } from "@/hooks/use-supabase";

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

      // Buscar médias gerais DIRETO da tabela puxe_viagens (não de views)
      const { data: viagensCompletas, error: erroViagens } = await supabase
        .from("puxe_viagens")
        .select("tempo_unidade_min, tempo_lavoura_min, total_viagem_min")
        .not("tempo_unidade_min", "is", null);

      if (!erroViagens && viagensCompletas && viagensCompletas.length > 0) {
        // Calcular médias reais de TODAS as viagens
        const somaAlgodoeira = viagensCompletas.reduce((sum, v) => sum + (v.tempo_unidade_min || 0), 0);
        const somaViagem = viagensCompletas.reduce((sum, v) => sum + (v.tempo_lavoura_min || 0), 0);
        const total = viagensCompletas.length;

        setMediasGerais({
          algodoeira: Math.round(somaAlgodoeira / total),
          viagem: Math.round(somaViagem / total),
          totalViagens: total,
        });
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
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger
            value="analitico"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            � Analítico
          </TabsTrigger>
          <TabsTrigger
            value="mensal"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            📆 Mensal
          </TabsTrigger>
          <TabsTrigger
            value="ranking"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            🏁 Ranking
          </TabsTrigger>
        </TabsList>

        {/* === RELATÓRIO ANALÍTICO (VIAGEM A VIAGEM) === */}
        <TabsContent value="analitico" className="space-y-4">
          {/* Filtros */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Filtros
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

          {/* Tabela de Viagens */}
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
                      <th className="text-center py-3 px-2">Tempo</th>
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
                        const tempoMin = r.entry_time && r.exit_time 
                          ? (() => {
                              const [eH, eM] = r.entry_time.split(':').map(Number);
                              const [sH, sM] = r.exit_time.split(':').map(Number);
                              return (sH * 60 + sM) - (eH * 60 + eM);
                            })()
                          : null;
                        
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
                            <td className="text-center py-3 px-2 text-white font-medium">
                              {tempoMin ? formatTime(tempoMin) : "-"}
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

        {/* === RELATÓRIO MENSAL === */}
        <TabsContent value="mensal" className="space-y-4">
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Análise Mensal por Fazenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dadosMensal.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="fazenda" tick={{ fill: "#9ca3af" }} />
                  <YAxis tick={{ fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatTime(value), ""]}
                  />
                  <Legend />
                  <Bar
                    dataKey="media_viagem_min"
                    fill="#22d3ee"
                    name="Tempo Viagem"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="media_algodoeira_min"
                    fill="#fbbf24"
                    name="Tempo Algodoeira"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabela Mensal */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Dados Mensais Detalhados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2">Mês</th>
                      <th className="text-left py-3 px-2">Fazenda</th>
                      <th className="text-center py-3 px-2">Viagens</th>
                      <th className="text-center py-3 px-2">Tempo Algodoeira</th>
                      <th className="text-center py-3 px-2">Tempo Viagem</th>
                      <th className="text-center py-3 px-2">Tempo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosMensal.map((d, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 text-white">
                        <td className="py-3 px-2 text-gray-100">{d.mes}</td>
                        <td className="py-3 px-2 font-medium text-white">{d.fazenda}</td>
                        <td className="text-center py-3 px-2 font-semibold text-emerald-400">{d.viagens}</td>
                        <td className="text-center py-3 px-2 text-yellow-400 font-medium">
                          {formatTime(d.media_algodoeira_min)}
                        </td>
                        <td className="text-center py-3 px-2 text-cyan-400 font-medium">
                          {formatTime(d.media_viagem_min)}
                        </td>
                        <td className="text-center py-3 px-2 font-bold text-white">
                          {formatTime(d.media_total_min)}
                        </td>
                      </tr>
                    ))}
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
                        className={`border-b border-gray-800 hover:bg-gray-800/50 text-gray-100 ${
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
    </div>
  );
};

export default RelatorioGestaoPuxe;
