/**
 * Utilitários para lidar com datas no timezone local do Brasil
 */

/**
 * Retorna a data de hoje no formato YYYY-MM-DD no timezone local
 * Evita problemas com UTC que pode retornar o dia anterior
 */
export function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma string de data do input para formato YYYY-MM-DD garantindo timezone local
 * Quando o usuário seleciona uma data no input, precisamos garantir que ela seja
 * salva exatamente como selecionada, sem conversão UTC que pode mudar o dia
 */
export function normalizeLocalDate(dateString: string): string {
  if (!dateString) return getTodayLocalDate();
  
  // Se já está no formato correto YYYY-MM-DD, parse localmente
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    // Cria data no timezone local (meio-dia para evitar mudanças de DST)
    const localDate = new Date(year, month - 1, day, 12, 0, 0);
    
    return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
  }
  
  return dateString;
}

/**
 * Converte uma data para o formato YYYY-MM-DD no timezone local
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
