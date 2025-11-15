import { useState, useEffect, useCallback } from 'react'
import { supabase, Vehicle, CottonPull, RainRecord, Equipment, Producer, LoadingRecord, MaterialReceipt, PuxeViagem } from '@/lib/supabase'
import { useToast } from './use-toast'

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Erro ao buscar veículos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os veículos.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Remove campos undefined e vazios para evitar problemas no INSERT
      const cleanData = Object.fromEntries(
        Object.entries(vehicleData).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ""
        )
      )
      
      // Log para debug
      console.log('Dados enviados para veículo:', cleanData)
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([cleanData])
        .select()
        .single()

      if (error) {
        console.error('Erro detalhado do Supabase:', error)
        throw error
      }
      
      setVehicles(prev => [data, ...prev])
      const isExit = vehicleData.type === "Saída Externa"
      toast({
        title: isExit ? "Saída externa registrada!" : "Entrada registrada!",
        description: `Veículo ${vehicleData.plate} registrado com sucesso.`,
      })
      
      return data
    } catch (error: unknown) {
      console.error('Erro ao adicionar veículo:', error)
      const isExternalExit = vehicleData.type === "Saída Externa"
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: "Erro ao registrar veículo",
        description: isExternalExit 
          ? `Erro ao registrar saída externa: ${errorMessage}`
          : `Erro ao registrar entrada: ${errorMessage}`,
        variant: "destructive"
      })
      throw error
    }
  }

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setVehicles(prev => prev.map(v => v.id === id ? data : v))
      return data
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o veículo.",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setVehicles(prev => prev.filter(v => v.id !== id))
      toast({
        title: "Veículo excluído!",
        description: "Registro removido com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao excluir veículo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o veículo.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  return {
    vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles
  }
}

// Helper: get local date in YYYY-MM-DD (avoids UTC shift from toISOString)
const getLocalIsoDate = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const useCottonPull = () => {
  const [records, setRecords] = useState<CottonPull[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cotton_pull')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Erro ao buscar registros de algodão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de algodão.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const addRecord = async (recordData: Omit<CottonPull, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cotton_pull')
        .insert([recordData])
        .select()
        .single()

      if (error) throw error
      
      setRecords(prev => [data, ...prev])
      toast({
        title: "Registro adicionado!",
        description: `${recordData.rolls} rolos registrados para ${recordData.producer}.`,
      })
      
      return data
    } catch (error: unknown) {
      console.error('=== ERRO NO SUPABASE ===');
      console.error('Erro completo:', error);
      console.error('Dados enviados para o banco:', recordData);
      console.error('Tabela: cotton_pull');
      console.error('Operação: INSERT');
      
      const errorObj = error as { 
        message?: string; 
        details?: string; 
        hint?: string; 
        code?: string;
        statusCode?: number;
        statusText?: string;
      };
      
      const errorMessage = errorObj?.message || errorObj?.details || errorObj?.hint || "Erro desconhecido";
      const errorCode = errorObj?.code || errorObj?.statusCode || "N/A";
      
      console.error('Código HTTP/Postgres:', errorCode);
      console.error('Mensagem do erro:', errorMessage);
      console.error('Status Text:', errorObj?.statusText);
      
      // Tentar extrair mais informações do Supabase
      if (typeof error === 'object' && error !== null) {
        console.error('Propriedades do erro:', Object.keys(error));
        console.error('Erro serializado:', JSON.stringify(error, null, 2));
      }
      
      toast({
        title: "Erro",
        description: `Não foi possível adicionar o registro: ${errorMessage}`,
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cotton_pull')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setRecords(prev => prev.filter(r => r.id !== id))
      toast({
        title: "Registro excluído!",
        description: "Puxe de algodão removido com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao excluir registro de algodão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro.",
        variant: "destructive"
      })
    }
  }

  const updateRecord = async (id: string, updates: Partial<CottonPull>) => {
    try {
      const { data, error } = await supabase
        .from('cotton_pull')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setRecords(prev => prev.map(r => r.id === id ? data : r))
      toast({
        title: "Registro atualizado!",
        description: "Puxe de algodão atualizado com sucesso.",
      })
      
      return data
    } catch (error) {
      console.error('Erro ao atualizar registro de algodão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro.",
        variant: "destructive"
      })
      throw error
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  }
}

export const useRainRecords = () => {
  const [records, setRecords] = useState<RainRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('rain_records')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Erro ao buscar registros de chuva:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de chuva.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const addRecord = async (recordData: Omit<RainRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('rain_records')
        .insert([recordData])
        .select()
        .single()

      if (error) throw error
      setRecords(prev => [data, ...prev])
      toast({
        title: "Registro de chuva adicionado!",
        description: `Registro para ${recordData.station || 'estação'} adicionado.`,
      })
      return data
    } catch (error) {
      console.error('Erro ao adicionar registro de chuva:', error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o registro de chuva.",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateRecord = async (id: string, updates: Partial<RainRecord>) => {
    try {
      const { data, error } = await supabase
        .from('rain_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setRecords(prev => prev.map(r => r.id === id ? data : r))
      return data
    } catch (error) {
      console.error('Erro ao atualizar registro de chuva:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro de chuva.",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rain_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      setRecords(prev => prev.filter(r => r.id !== id))
      toast({
        title: "Registro excluído!",
        description: "Medição de chuva removida com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao excluir registro de chuva:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  }
}

export const useEquipment = () => {
  const [records, setRecords] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const addRecord = async (recordData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([recordData])
        .select()
        .single()

      if (error) throw error
      
      setRecords(prev => [data, ...prev])
      toast({
        title: "Equipamento registrado!",
        description: `${recordData.name} retirado por ${recordData.withdrawn_by}.`,
      })
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar o equipamento.",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateRecord = async (id: string, updates: Partial<Equipment>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setRecords(prev => prev.map(r => r.id === id ? data : r))
      return data
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o equipamento.",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setRecords(prev => prev.filter(r => r.id !== id))
      toast({
        title: "Equipamento excluído!",
        description: "Equipamento removido com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o equipamento.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  }
}

export const useProducers = () => {
  const [producers, setProducers] = useState<Producer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducers(data || [])
    } catch (error) {
      console.error('Erro ao buscar produtores:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducers()
  }, [fetchProducers])

  return {
    producers,
    loading,
    refetch: fetchProducers
  }
}

export const useLoadingRecords = () => {
  const [records, setRecords] = useState<LoadingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const initializeTable = useCallback(async () => {
    try {
      // Primeiro tentamos verificar se a tabela existe fazendo uma consulta simples
      const { error } = await supabase
        .from('loading_records')
        .select('id')
        .limit(1)

      if (error && error.message.includes('relation "loading_records" does not exist')) {
        console.log('Tabela loading_records não existe, tentando criar...')
        // Se a tabela não existe, vamos usar dados mock por enquanto
        setRecords([])
        toast({
          title: "Aviso",
          description: "Sistema em modo simulação - dados não serão persistidos.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao inicializar tabela:', error)
    }
  }, [toast])

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('loading_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.message.includes('relation "loading_records" does not exist')) {
          await initializeTable()
          return
        }
        throw error
      }
      setRecords(data || [])
    } catch (error) {
      console.error('Erro ao buscar carregamentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os carregamentos.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast, initializeTable])

  const addRecord = async (recordData: Omit<LoadingRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Define status inicial baseado nos dados fornecidos
      const dataWithStatus = {
        ...recordData,
        status: recordData.status || 'fila' as const
      };
      
      const { data, error } = await supabase
        .from('loading_records')
        .insert([dataWithStatus])
        .select()
        .single()

      if (error) throw error
      
      setRecords(prev => [data, ...prev])
      toast({
        title: "Carregamento registrado!",
        description: `${recordData.product} - ${recordData.plate} registrado com sucesso.`,
      })
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar carregamento:', error)
      console.error('Dados enviados:', recordData)
      toast({
        title: "Erro",
        description: `Erro: ${error?.message || 'Não foi possível registrar o carregamento'}`,
        variant: "destructive"
      })
      throw error
    }
  }

  const updateRecord = async (id: string, updates: Partial<LoadingRecord>) => {
    try {
      // Remove apenas campos undefined ou strings vazias
      // IMPORTANTE: Mantém null explícito para limpar campos no banco
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => 
          value !== undefined && value !== ""
        )
      )
      
      console.log('=== DEBUG UPDATE LOADING ===')
      console.log('ID:', id)
      console.log('Updates originais:', updates)
      console.log('Updates limpos:', cleanUpdates)
      console.log('Campos enviados:', Object.keys(cleanUpdates))
      
      const { data, error } = await supabase
        .from('loading_records')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('=== ERRO SUPABASE ===')
        console.error('Status:', error.code)
        console.error('Mensagem:', error.message)
        console.error('Detalhes:', error.details)
        console.error('Hint:', error.hint)
        throw error
      }
      
      setRecords(prev => prev.map(r => r.id === id ? data : r))
      toast({
        title: "Carregamento atualizado!",
        description: "Dados atualizados com sucesso.",
      })
      
      return data
    } catch (error) {
      console.error('Erro ao atualizar carregamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o carregamento.",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('loading_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setRecords(prev => prev.filter(r => r.id !== id))
      toast({
        title: "Carregamento excluído!",
        description: "Registro removido com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao excluir carregamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o carregamento.",
        variant: "destructive"
      })
      throw error
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  }
}

// Hook para gestão de viagens do puxe de algodão
export const usePuxeViagens = () => {
  const [viagens, setViagens] = useState<PuxeViagem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchViagens = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error} = await supabase
        .from('puxe_viagens')
        .select('*')
        .order('hora_chegada', { ascending: false })

      if (error) throw error
      setViagens(data || [])
    } catch (error) {
      console.error('Erro ao buscar viagens:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as viagens.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const addViagem = async (viagemData: Omit<PuxeViagem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('puxe_viagens')
        .insert([viagemData])
        .select()
        .single()

      if (error) throw error
      
      setViagens(prev => [data, ...prev])
      // notify listeners that puxe_viagens changed so other hooks can refetch
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('puxe_viagens:changed')) } catch(e) {}
      toast({
        title: "Viagem registrada!",
        description: "Entrada registrada com sucesso.",
      })
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar viagem:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a viagem.",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateViagem = async (id: string, updates: Partial<PuxeViagem>) => {
    try {
      const { data, error } = await supabase
        .from('puxe_viagens')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setViagens(prev => prev.map(v => v.id === id ? data : v))
      // notify listeners that puxe_viagens changed so other hooks can refetch
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('puxe_viagens:changed')) } catch(e) {}
      toast({
        title: "Viagem atualizada!",
        description: "Dados atualizados com sucesso.",
      })
      
      return data
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a viagem.",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteViagem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('puxe_viagens')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setViagens(prev => prev.filter(v => v.id !== id))
      // notify listeners that puxe_viagens changed so other hooks can refetch
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('puxe_viagens:changed')) } catch(e) {}
      toast({
        title: "Viagem excluída!",
        description: "Registro removido com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao excluir viagem:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a viagem.",
        variant: "destructive"
      })
      throw error
    }
  }

  useEffect(() => {
    fetchViagens()
  }, [fetchViagens])

  return {
    viagens,
    loading,
    addViagem,
    updateViagem,
    deleteViagem,
    refetch: fetchViagens
  }
}

// Fallback hooks for Gestão de Tempo (utilizadas pelo painel TV)
export const useGestaoTempo = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGestao = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Prefer authoritative view `view_gestao_tempo_cargas` if present
      try {
        const { getTodayLocalDate } = await import('@/lib/date-utils')
          .then(m => m)
          .catch(() => ({ getTodayLocalDate: () => {
            const t = new Date();
            return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
          } }));

        const todayIso = getTodayLocalDate();

        // Try preferred view with explicit columns
        let rView = await supabase
          .from('view_gestao_tempo_cargas')
          .select('placa,motorista,hora_entrada,hora_saida,rolos,tempo_unidade_min,tempo_lavoura_min')
          .order('hora_entrada', { ascending: false })
          .limit(1000);

        if (rView.error) {
          // fallback to select('*') if schema differs
          try { rView = await supabase.from('view_gestao_tempo_cargas').select('*').limit(1000); } catch (e) { rView = { data: null, error: e as any } as any }
        }

        if (!rView.error && rView.data && rView.data.length > 0) {
          try { console.debug('[useGestaoTempo] view_gestao_tempo_cargas returned', rView.data.length, 'rows (sample 3):', (rView.data || []).slice(0,3)); } catch(e) {}
          const rowsToday = (rView.data || []).filter((v:any) => {
            const he = v.hora_entrada || v.hora_chegada || v.hora_arrival || null;
            const hs = v.hora_saida || v.hora_saida_unidade || v.saida_unidade || v.departure_time || null;
            const ca = v.created_at || v.createdAt || v.created || null;
            const localDate = (val: any) => {
              if (!val) return null;
              const dv = typeof val === 'string' ? new Date(val) : new Date(val);
              if (isNaN(dv.getTime())) return null;
              return `${dv.getFullYear()}-${String(dv.getMonth()+1).padStart(2,'0')}-${String(dv.getDate()).padStart(2,'0')}`;
            };
            const sHe = localDate(he);
            const sHs = localDate(hs);
            const sCa = localDate(ca);
            return sHe === todayIso || sHs === todayIso || sCa === todayIso;
          }).map((v:any) => ({
            placa: v.placa || v.plate || null,
            motorista: v.motorista || v.driver || null,
            date: v.data || v.date || (v.hora_entrada ? (typeof v.hora_entrada === 'string' ? v.hora_entrada.substring(0,10) : (new Date(v.hora_entrada).toISOString().substring(0,10))) : null),
            tempo_algodoeira: v.tempo_unidade_min ?? null,
            tempo_lavoura: v.tempo_lavoura_min ?? null,
            rolos: v.rolos ?? v.rolls ?? 0,
            hora_chegada: v.hora_entrada || v.hora_chegada || null,
            hora_saida: v.hora_saida || null,
            origem: 'view_gestao_tempo_cargas'
          }));

          setData(rowsToday);
          try { console.debug('[useGestaoTempo] rowsToday (after local-date filter) count:', rowsToday.length, 'sample:', rowsToday.slice(0,3)); } catch(e) {}
          setLoading(false);
          return;
        }

      } catch (e) {
        // if the view is missing or errored, fall back to existing behavior below
      }

      // Fallback: previous behavior (try gestao_tempo or normalize rows)
      // Try with order by placa first (preferred)
      let res = await supabase.from('gestao_tempo').select('*').order('placa', { ascending: true });
      let rows = res.data;
      let err = res.error;

      // If ordering by placa failed (bad column / 400), retry without order
      if (err) {
        const msg = String(err.message || err);
        console.warn('gestao_tempo primary query error:', msg);
        if (msg.toLowerCase().includes('column') || msg.toLowerCase().includes('invalid')) {
          const res2 = await supabase.from('gestao_tempo').select('*');
          rows = res2.data;
          err = res2.error;
        }
      }

      if (err) {
        setError(err.message || String(err));
        throw err;
      }

      // Normalize and keep only today's records when possible
      try {
        const toLocalIsoDate = (val: any) => {
          if (!val) return null
          const d = new Date(val)
          if (isNaN(d.getTime())) return null
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        }
        const todayIso = getLocalIsoDate()
        const filtered = (rows || []).filter((r: any) => {
          const possible = r.data || r.date || r.hora_chegada || r.created_at || r.createdAt || r.created
          const iso = toLocalIsoDate(possible)
          return iso === todayIso
        })
        // Always use only today's rows (do not fallback to historical rows)
        setData(filtered)
      } catch (e) {
        setData(rows || [])
      }
    } catch (err: any) {
      console.error('Erro ao buscar gestao_tempo:', err);
      setError(err?.message || String(err));
      toast({ title: 'Erro', description: `Não foi possível carregar gestão de tempo. ${err?.message || ''}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGestao();
  }, [fetchGestao]);

  return { data, loading, error, refetch: fetchGestao };
};

export const useGestaoTempoCargas = () => {
  const [cargas, setCargas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCargas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Primary table name
      const primary = 'gestao_tempo_cargas';
      let res = await supabase.from(primary).select('*').order('created_at', { ascending: false });

      let rows = res.data;
      let err = res.error;

      // If resource not found (404) or similar, try alternate table names
      if (err) {
        const msg = String(err.message || err).toLowerCase();
        console.warn(`gestao_tempo_cargas primary query error: ${msg}`);

        const alternates = [
          'gestao_cargas',
          'gestao_tempo_carga',
          'gestao_carga',
          'gestao_tempo_viagens',
          'gestao_cargas_tempo',
          'gestao_tempo_cargas_view',
          'gestao_cargas_view'
        ];

        for (const tbl of alternates) {
          try {
            const r = await supabase.from(tbl).select('*').order('created_at', { ascending: false });
            if (!r.error && r.data) {
              rows = r.data;
              err = null;
              console.info(`gestao_tempo_cargas: using alternate table '${tbl}'`);
              break;
            }
          } catch (e) {
            // continue trying alternates
          }
        }
      }

      // If still error or no rows, try project fallback views (view_relatorio_puxe / puxe_viagens)
      if (err || !rows || (Array.isArray(rows) && rows.length === 0)) {
        try {
          const rView = await supabase
            .from('view_relatorio_puxe')
            .select('placa, motorista, data, tempo_unidade_min, tempo_lavoura_min, hora_chegada')
            .order('data', { ascending: false })
            .limit(200)

          if (!rView.error && rView.data && rView.data.length > 0) {
            rows = (rView.data || []).map((v: any) => {
              const d = new Date(v.data || v.hora_chegada)
              const dateLocal = !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null
              return {
                placa: v.placa,
                motorista: v.motorista,
                date: dateLocal,
                tempo_algodoeira: v.tempo_unidade_min,
                tempo_lavoura: v.tempo_lavoura_min,
                origem: 'view_relatorio_puxe'
              }
            });
            err = null;
            console.info('gestao_tempo_cargas: using view_relatorio_puxe as source');
          } else {
            const rPuxe = await supabase
              .from('puxe_viagens')
              .select('placa, motorista, data, tempo_unidade_min, tempo_lavoura_min, hora_chegada')
              .order('data', { ascending: false })
              .limit(200)

            if (!rPuxe.error && rPuxe.data && rPuxe.data.length > 0) {
              rows = (rPuxe.data || []).map((v: any) => {
                const d = new Date(v.data || v.hora_chegada)
                const dateLocal = !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null
                return {
                  placa: v.placa,
                  motorista: v.motorista,
                  date: dateLocal,
                  tempo_algodoeira: v.tempo_unidade_min,
                  tempo_lavoura: v.tempo_lavoura_min,
                  origem: 'puxe_viagens'
                }
              });
              err = null;
              console.info('gestao_tempo_cargas: using puxe_viagens as source');
            }
          }
        } catch (e) {
          // ignore and surface original error below
        }
      }

        // First: try to fetch today's records from view_relatorio_puxe (preferred),
        // then from puxe_viagens (by data and by hora_chegada prefix). Aggregate per placa.
        try {
          const { getTodayLocalDate } = await import('@/lib/date-utils')
            .then(m => m)
            .catch(() => ({ getTodayLocalDate: () => {
              const t = new Date();
              return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
            } }));

          const todayIso = getTodayLocalDate();

          // Helper to aggregate rows by placa, normalizing tempo fields
          const aggregateRows = (rows: any[]) => {
            const mapa = new Map<string, any>();
            for (const v of rows) {
              const placa = (v.placa || v.plate || '').toString().trim().toUpperCase();
              if (!placa) continue;
              if (!mapa.has(placa)) mapa.set(placa, { placa, motorista: v.motorista || v.driver || '', viagens: 0, rolos: 0, algodoeiraTimes: [], lavouraTimes: [], horas: [] });
              const ex = mapa.get(placa);
              ex.viagens = (ex.viagens || 0) + 1;
              ex.rolos = (ex.rolos || 0) + (Number(v.rolos ?? v.rolls) || 0);

              // If the row comes from `view_gestao_tempo_cargas`, prefer its reported
              // `tempo_unidade_min` (the view computes closed tempos reliably in DB).
              // Otherwise, prefer explicit hora_chegada/hora_saida diff when available.
              let algodoeiraVal: any = null;
              if (v.origem === 'view_gestao_tempo_cargas' && v.tempo_unidade_min != null && !isNaN(Number(v.tempo_unidade_min))) {
                algodoeiraVal = Number(v.tempo_unidade_min);
              } else {
                algodoeiraVal = v.tempo_unidade_min ?? v.tempo_algodoeira_min ?? v.tempo_algodoeira ?? v.tempo_unidade ?? v.tempo_unidade_minimo ?? null;
              }
              const lavouraVal = v.tempo_lavoura_min ?? v.tempo_lavoura ?? v.tempo_lavoura_minimo ?? null;
              try {
                const hcRaw = v.hora_chegada || v.hora_arrival || v.arrival_time || null;
                const hsRaw = v.hora_saida || v.hora_saida_unidade || v.saida_unidade || v.departure_time || null;
                if (hcRaw && hsRaw) {
                  const hc = new Date(hcRaw);
                  const hs = new Date(hsRaw);
                  if (!isNaN(hc.getTime()) && !isNaN(hs.getTime())) {
                    const diffMin = Math.round((hs.getTime() - hc.getTime()) / 60000);
                    // only accept reasonable diffs
                    if (diffMin >= 0 && diffMin < 24 * 60) {
                      // Only overwrite if we don't already have a trusted value
                      if (algodoeiraVal == null) algodoeiraVal = diffMin;
                    }
                  }
                }
              } catch (e) {
                // ignore parsing errors
              }

              if (algodoeiraVal != null && !isNaN(Number(algodoeiraVal))) {
                const n = Number(algodoeiraVal);
                if (n >= 0 && n < 24 * 60) ex.algodoeiraTimes.push(n);
                else {
                  // negative or unrealistic tempo detected — log for debug
                  try { console.warn('[GestaoTempoCargas] tempo_algodoeira inválido para', placa, 'valor:', n); } catch(e) {}
                }
              }
              if (lavouraVal != null && !isNaN(Number(lavouraVal))) {
                const n = Number(lavouraVal);
                if (n >= 0 && n < 24 * 60) ex.lavouraTimes.push(n);
              }

              // collect hora_chegada timestamps for inter-arrival computations
              try {
                const hc = v.hora_chegada || v.hora_arrival || v.arrival_time || v.created_at || v.createdAt || null;
                if (hc) {
                  const d = typeof hc === 'string' ? new Date(hc) : new Date(hc);
                  if (!isNaN(d.getTime())) ex.horas.push(d.getTime());
                }
              } catch (e) {}
            }

            // compute lavoura times from consecutive hora_chegada timestamps when explicit values not provided
            for (const it of mapa.values()) {
              if ((!it.lavouraTimes || it.lavouraTimes.length === 0) && it.horas && it.horas.length > 1) {
                const sorted = (it.horas || []).slice().sort((a:number,b:number)=>a-b);
                for (let i = 0; i < sorted.length - 1; i++) {
                  const deltaMin = Math.round((sorted[i+1] - sorted[i]) / 60000);
                  if (deltaMin > 0 && deltaMin < 24 * 60) it.lavouraTimes.push(deltaMin);
                }
              }
            }

            return Array.from(mapa.values()).map((it: any) => {
              const avgAlg = it.algodoeiraTimes && it.algodoeiraTimes.length ? Math.round(it.algodoeiraTimes.reduce((s:number,a:number)=>s+a,0)/it.algodoeiraTimes.length) : null;
              const avgLav = it.lavouraTimes && it.lavouraTimes.length ? Math.round(it.lavouraTimes.reduce((s:number,a:number)=>s+a,0)/it.lavouraTimes.length) : null;
              return {
                placa: it.placa,
                motorista: it.motorista,
                viagens: it.viagens,
                rolos: it.rolos,
                tempo_algodoeira: avgAlg,
                tempo_lavoura: avgLav,
                origem: 'aggregated'
              };
            }).sort((a,b) => (b.viagens || 0) - (a.viagens || 0));
          }

          // 1) Try view_gestao_tempo_cargas (preferred if available) ---
          // This view (when present) contains cargas fechadas com hora_entrada/hora_saida
          // which are the most reliable source to compute tempo_algodoeira.
          try {
            let rGestaoView = await supabase
              .from('view_gestao_tempo_cargas')
              .select('placa,motorista,hora_entrada,hora_saida,rolos,tempo_unidade_min,tempo_lavoura_min')
              .limit(200)

            if (rGestaoView.error) {
              // fallback to selecting all columns if schema differs
              try {
                rGestaoView = await supabase.from('view_gestao_tempo_cargas').select('*').limit(200);
              } catch (e) { rGestaoView = { data: null, error: e as any } as any }
            }

            if (!rGestaoView.error && rGestaoView.data && rGestaoView.data.length > 0) {
              try { console.debug('[useGestaoTempoCargas] view_gestao_tempo_cargas returned', rGestaoView.data.length, 'rows (sample 3):', (rGestaoView.data || []).slice(0,3)); } catch(e) {}
              const rowsToday = (rGestaoView.data || []).filter((v: any) => {
                const he = v.hora_entrada || v.hora_chegada || v.hora_arrival || v.horaEntrada || null;
                const hs = v.hora_saida || v.hora_saida_unidade || v.saida_unidade || v.departure_time || null;
                const ca = v.created_at || v.createdAt || v.created || null;
                const localDate = (val: any) => {
                  if (!val) return null;
                  const dv = typeof val === 'string' ? new Date(val) : new Date(val);
                  if (isNaN(dv.getTime())) return null;
                  return `${dv.getFullYear()}-${String(dv.getMonth()+1).padStart(2,'0')}-${String(dv.getDate()).padStart(2,'0')}`;
                };
                const sHe = localDate(he);
                const sHs = localDate(hs);
                const sCa = localDate(ca);
                return sHe === todayIso || sHs === todayIso || sCa === todayIso;
              }).map((v: any) => ({
                placa: v.placa || v.plate || null,
                motorista: v.motorista || v.driver || null,
                date: v.data || v.date || (v.hora_entrada ? (typeof v.hora_entrada === 'string' ? v.hora_entrada.substring(0,10) : (new Date(v.hora_entrada).toISOString().substring(0,10))) : null),
                hora_chegada: v.hora_entrada || v.hora_chegada || v.hora_arrival || null,
                hora_saida: v.hora_saida || v.hora_saida_unidade || v.saida_unidade || v.departure_time || null,
                tempo_unidade_min: v.tempo_unidade_min ?? v.tempo_unidade ?? null,
                tempo_lavoura_min: v.tempo_lavoura_min ?? v.tempo_lavoura ?? null,
                rolos: v.rolos ?? v.rolls ?? 0,
                origem: 'view_gestao_tempo_cargas'
              }));
              try { console.debug('[useGestaoTempoCargas] rowsToday (after local-date filter) count:', rowsToday.length, 'sample:', rowsToday.slice(0,3)); } catch(e) {}
              if (rowsToday.length > 0) {
                const aggregated = aggregateRows(rowsToday as any[]);
                setCargas(aggregated);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            // continue to next source
          }

          // 2) Try view_relatorio_puxe (if available)
          try {
            // Try preferred columns first; if the view schema is different, retry with select('*') and map dynamically
            let rView = await supabase
              .from('view_relatorio_puxe')
              .select('placa,motorista,data,rolos,tempo_unidade_min,tempo_lavoura_min,hora_chegada')
              .limit(1000);

            if (rView.error) {
              // fallback to selecting all columns and map fields dynamically
              try {
                rView = await supabase.from('view_relatorio_puxe').select('*').limit(1000);
              } catch (e) {
                rView = { data: null, error: e as any } as any;
              }
            }

            if (!rView.error && rView.data && rView.data.length > 0) {
              const rowsToday = (rView.data || []).filter((v:any) => {
                // require hora_chegada to represent an actual arrival today
                if (!v.hora_chegada) return false;
                const s = (typeof v.hora_chegada === 'string') ? v.hora_chegada.substring(0,10) : (new Date(v.hora_chegada).toISOString().substring(0,10));
                return s === todayIso;
              }).map((v:any) => ({
                placa: v.placa || v.plate || v.plate_number || null,
                motorista: v.motorista || v.driver || null,
                date: (v.data || v.date) || (v.hora_chegada ? (typeof v.hora_chegada === 'string' ? v.hora_chegada.substring(0,10) : (new Date(v.hora_chegada).toISOString().substring(0,10))) : null),
                tempo_unidade_min: v.tempo_unidade_min ?? v.tempo_unidade ?? v.tempo_algodoeira ?? v.tempo_algodoeira_min ?? null,
                tempo_lavoura_min: v.tempo_lavoura_min ?? v.tempo_lavoura ?? null,
                rolos: v.rolos ?? v.rolls ?? 0,
                hora_chegada: v.hora_chegada
              }));

              if (rowsToday.length > 0) {
                const aggregated = aggregateRows(rowsToday as any[]);
                setCargas(aggregated);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            // continue to next source
          }

          // 2) Try puxe_viagens: first by data = today
          try {
            // Try querying puxe_viagens; be tolerant to schema differences by falling back to select('*')
            let rByData = await supabase
              .from('puxe_viagens')
              .select('placa,motorista,data,rolos,tempo_unidade_min,tempo_lavoura_min,hora_chegada')
              .eq('data', todayIso)
              .limit(1000);

            if (rByData.error) {
              try {
                rByData = await supabase.from('puxe_viagens').select('*').eq('data', todayIso).limit(1000);
              } catch (e) { rByData = { data: null, error: e as any } as any }
            }

            let combinedRows: any[] = [];
            if (!rByData.error && rByData.data) combinedRows = combinedRows.concat(rByData.data as any[]);

            // then try by hora_chegada starting with today (avoid .or complexity)
            try {
              let rByHora = await supabase
                .from('puxe_viagens')
                .select('placa,motorista,data,rolos,tempo_unidade_min,tempo_lavoura_min,hora_chegada')
                .ilike('hora_chegada', `${todayIso}%`)
                .limit(1000);
              if (rByHora.error) {
                try { rByHora = await supabase.from('puxe_viagens').select('*').ilike('hora_chegada', `${todayIso}%`).limit(1000); } catch (e) { rByHora = { data: null, error: e as any } as any }
              }
              if (!rByHora.error && rByHora.data) combinedRows = combinedRows.concat(rByHora.data as any[]);
            } catch (e) {
              // ignore
            }

            // Filter combinedRows to only include records with hora_chegada local-date === today
            const toLocalIso = (val: any) => {
              if (!val) return null;
              if (typeof val === 'string') {
                const s = val.trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.substring(0, 10);
              }
              const d = new Date(val);
              if (isNaN(d.getTime())) return null;
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            };

            const filteredForToday = (combinedRows || []).filter((r: any) => {
              const hc = toLocalIso(r.hora_chegada || r.hora_arrival || r.arrival_time);
              return hc === todayIso;
            });

            // deduplicate by placa+hora_chegada (or by index)
            const uniqMap = new Map<string, any>();
            for (const r of filteredForToday) {
              const key = `${(r.placa||'').toString().trim().toUpperCase()}|${r.hora_chegada||r.data||''}`;
              if (!uniqMap.has(key)) uniqMap.set(key, r);
            }
            const uniqRows = Array.from(uniqMap.values());
            if (uniqRows.length > 0) {
              const aggregated = aggregateRows(uniqRows);
              setCargas(aggregated);
              setLoading(false);
              return;
            }
            // If server-side filters returned nothing, fetch recent puxe_viagens
            // and locally filter by converted local date (hora_chegada or created_at).
            try {
              const rRecent = await (async () => {
                try {
                  return await supabase.from('puxe_viagens').select('*').order('hora_chegada', { ascending: false }).limit(1000);
                } catch (e) { return { data: null, error: e as any } as any }
              })();

              if (!rRecent.error && rRecent.data && rRecent.data.length > 0) {
                const toLocalIso = (val: any) => {
                  if (!val) return null;
                  if (typeof val === 'string') {
                    const s = val.trim();
                    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.substring(0, 10);
                  }
                  const d = new Date(val);
                  if (isNaN(d.getTime())) return null;
                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                };

                const localFiltered = (rRecent.data || []).filter((v: any) => {
                  const h = toLocalIso(v.hora_chegada || v.hora_arrival || v.arrival_time);
                  // prefer actual arrival time — require hora_chegada local date to equal today
                  return h === todayIso;
                });

                if (localFiltered.length > 0) {
                  const aggregated = aggregateRows(localFiltered);
                  setCargas(aggregated);
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              // ignore and fallback below
            }
          } catch (e) {
            // ignore and fallback below
          }
        } catch (e) {
          // ignore all and fallback to previous normalization
        }

        // Normalize and prefer today's records (use local date YYYY-MM-DD)
      try {
        // helper: produce local YYYY-MM-DD without relying on toISOString (which uses UTC)
        const toLocalIsoDate = (val: any) => {
          if (!val) return null
          // if it's already a YYYY-MM-DD string, return as-is
          if (typeof val === 'string') {
            const s = val.trim()
            // quick check for YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
            // if ISO-like with time, take first 10 chars
            if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.substring(0, 10)
          }
          const d = new Date(val)
          if (isNaN(d.getTime())) return null
          // Use local date components to avoid timezone shift
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        }

        // prefer local today (avoids UTC day-shift)
        const { getTodayLocalDate } = await import('@/lib/date-utils')
          .then(m => m)
          .catch(() => ({ getTodayLocalDate: () => {
            const t = new Date();
            return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
          } }))

        const todayIso = getTodayLocalDate()

        const normalized = (rows || []).map((r: any) => ({
          ...r,
          _date_iso: toLocalIsoDate(r.date || r.data || r.hora_chegada || r.created_at || r.createdAt || r.created)
        }))

        const todayOnly = normalized.filter((r: any) => r._date_iso === todayIso)
        // Do not fallback to historical rows: always show only today's cargas
        setCargas(todayOnly)
      } catch (e) {
        setCargas(rows || [])
      }
    } catch (err: any) {
      console.error('Erro ao buscar gestao_tempo_cargas:', err);
      setError(err?.message || String(err));
      toast({ title: 'Erro', description: `Não foi possível carregar cargas de gestão de tempo. ${err?.message || ''}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCargas();
  }, [fetchCargas]);

  // Re-fetch when other parts of the app mutate `puxe_viagens` (add/update/delete)
  useEffect(() => {
    const handler = () => { fetchCargas(); };
    try {
      if (typeof window !== 'undefined') window.addEventListener('puxe_viagens:changed', handler as EventListener);
    } catch (e) {
      // ignore
    }
    return () => {
      try {
        if (typeof window !== 'undefined') window.removeEventListener('puxe_viagens:changed', handler as EventListener);
      } catch (e) {}
    };
  }, [fetchCargas]);

  return { cargas, loading, error, refetch: fetchCargas };
};
