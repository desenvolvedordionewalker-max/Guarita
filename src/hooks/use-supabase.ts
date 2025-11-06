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
      const { data, error } = await supabase
        .from('loading_records')
        .insert([recordData])
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
      // Remove campos undefined, null ou vazios
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ""
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
} 
 
 / /   H o o k   p a r a   g e s t � o   d e   v i a g e n s   d o   p u x e   d e   a l g o d � o 
 e x p o r t   c o n s t   u s e P u x e V i a g e n s   =   ( )   = >   { 
     c o n s t   [ v i a g e n s ,   s e t V i a g e n s ]   =   u s e S t a t e < P u x e V i a g e m [ ] > ( [ ] ) 
     c o n s t   [ l o a d i n g ,   s e t L o a d i n g ]   =   u s e S t a t e ( t r u e ) 
     c o n s t   {   t o a s t   }   =   u s e T o a s t ( ) 
 
     c o n s t   f e t c h V i a g e n s   =   u s e C a l l b a c k ( a s y n c   ( )   = >   { 
         s e t L o a d i n g ( t r u e ) 
         t r y   { 
             c o n s t   {   d a t a ,   e r r o r   }   =   a w a i t   s u p a b a s e 
                 . f r o m ( ' p u x e _ v i a g e n s ' ) 
                 . s e l e c t ( ' * ' ) 
                 . o r d e r ( ' h o r a _ c h e g a d a ' ,   {   a s c e n d i n g :   f a l s e   } ) 
 
             i f   ( e r r o r )   t h r o w   e r r o r 
             s e t V i a g e n s ( d a t a   | |   [ ] ) 
         }   c a t c h   ( e r r o r )   { 
             c o n s o l e . e r r o r ( ' E r r o   a o   b u s c a r   v i a g e n s : ' ,   e r r o r ) 
             t o a s t ( { 
                 t i t l e :   " E r r o " , 
                 d e s c r i p t i o n :   " N � o   f o i   p o s s � v e l   c a r r e g a r   a s   v i a g e n s . " , 
                 v a r i a n t :   " d e s t r u c t i v e " 
             } ) 
         }   f i n a l l y   { 
             s e t L o a d i n g ( f a l s e ) 
         } 
     } ,   [ t o a s t ] ) 
 
     c o n s t   a d d V i a g e m   =   a s y n c   ( v i a g e m D a t a :   O m i t < P u x e V i a g e m ,   ' i d '   |   ' c r e a t e d _ a t '   |   ' u p d a t e d _ a t ' > )   = >   { 
         t r y   { 
             c o n s t   {   d a t a ,   e r r o r   }   =   a w a i t   s u p a b a s e 
                 . f r o m ( ' p u x e _ v i a g e n s ' ) 
                 . i n s e r t ( [ v i a g e m D a t a ] ) 
                 . s e l e c t ( ) 
                 . s i n g l e ( ) 
 
             i f   ( e r r o r )   t h r o w   e r r o r 
             
             s e t V i a g e n s ( p r e v   = >   [ d a t a ,   . . . p r e v ] ) 
             
             r e t u r n   d a t a 
         }   c a t c h   ( e r r o r )   { 
             c o n s o l e . e r r o r ( ' E r r o   a o   a d i c i o n a r   v i a g e m : ' ,   e r r o r ) 
             t h r o w   e r r o r 
         } 
     } 
 
     c o n s t   u p d a t e V i a g e m   =   a s y n c   ( i d :   s t r i n g ,   u p d a t e s :   P a r t i a l < P u x e V i a g e m > )   = >   { 
         t r y   { 
             c o n s t   {   d a t a ,   e r r o r }   =   a w a i t   s u p a b a s e 
                 . f r o m ( ' p u x e _ v i a g e n s ' ) 
                 . u p d a t e ( u p d a t e s ) 
                 . e q ( ' i d ' ,   i d ) 
                 . s e l e c t ( ) 
                 . s i n g l e ( ) 
 
             i f   ( e r r o r )   t h r o w   e r r o r 
             
             s e t V i a g e n s ( p r e v   = >   p r e v . m a p ( v   = >   v . i d   = = =   i d   ?   d a t a   :   v ) ) 
             
             r e t u r n   d a t a 
         }   c a t c h   ( e r r o r )   { 
             c o n s o l e . e r r o r ( ' E r r o   a o   a t u a l i z a r   v i a g e m : ' ,   e r r o r ) 
             t h r o w   e r r o r 
         } 
     } 
 
     c o n s t   d e l e t e V i a g e m   =   a s y n c   ( i d :   s t r i n g )   = >   { 
         t r y   { 
             c o n s t   {   e r r o r   }   =   a w a i t   s u p a b a s e 
                 . f r o m ( ' p u x e _ v i a g e n s ' ) 
                 . d e l e t e ( ) 
                 . e q ( ' i d ' ,   i d ) 
 
             i f   ( e r r o r )   t h r o w   e r r o r 
             
             s e t V i a g e n s ( p r e v   = >   p r e v . f i l t e r ( v   = >   v . i d   ! = =   i d ) ) 
         }   c a t c h   ( e r r o r )   { 
             c o n s o l e . e r r o r ( ' E r r o   a o   e x c l u i r   v i a g e m : ' ,   e r r o r ) 
             t h r o w   e r r o r 
         } 
     } 
 
     u s e E f f e c t ( ( )   = >   { 
         f e t c h V i a g e n s ( ) 
     } ,   [ f e t c h V i a g e n s ] ) 
 
     r e t u r n   { 
         v i a g e n s , 
         l o a d i n g , 
         a d d V i a g e m , 
         u p d a t e V i a g e m , 
         d e l e t e V i a g e m , 
         r e f e t c h :   f e t c h V i a g e n s 
     } 
 }  
 