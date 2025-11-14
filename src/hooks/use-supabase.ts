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
        .order('time', { ascending: false })

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
        title: "Medição registrada!",
        description: `${recordData.millimeters} mm registrados em ${recordData.date}.`,
      })
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar registro:', error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o registro.",
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
      toast({
        title: "Registro atualizado!",
        description: "Medição de chuva atualizada com sucesso.",
      })
      
      return data
    } catch (error) {
      console.error('Erro ao atualizar registro de chuva:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro.",
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

      setData(rows || []);
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

      if (err) {
        setError(err.message || String(err));
        throw err;
      }

      setCargas(rows || []);
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

  return { cargas, loading, error, refetch: fetchCargas };
};
