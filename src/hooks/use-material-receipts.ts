// Extensão do hook use-supabase para MaterialReceipts
import { useState, useEffect, useCallback } from 'react'
import { supabase, MaterialReceipt } from '@/lib/supabase'
import { useToast } from './use-toast'

// Hook para Materiais Recebidos
export const useMaterialReceipts = () => {
  const [records, setRecords] = useState<MaterialReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('material_receipts')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Erro ao buscar materiais recebidos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os materiais recebidos.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const addRecord = async (recordData: Omit<MaterialReceipt, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('material_receipts')
        .insert([recordData])
        .select()
        .single()

      if (error) throw error
      
      setRecords(prev => [data, ...prev])
      toast({
        title: "Material registrado!",
        description: `Recebimento de ${recordData.material_type} registrado com sucesso.`,
      })
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar material:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar o material.",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateRecord = async (id: string, updateData: Partial<MaterialReceipt>) => {
    try {
      const { data, error } = await supabase
        .from('material_receipts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setRecords(prev => prev.map(record => record.id === id ? data : record))
      toast({
        title: "Material atualizado!",
        description: "Informações atualizadas com sucesso.",
      })

      return data
    } catch (error) {
      console.error('Erro ao atualizar material:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o material.",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('material_receipts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRecords(prev => prev.filter(record => record.id !== id))
      toast({
        title: "Material removido!",
        description: "Registro removido com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao remover material:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o material.",
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