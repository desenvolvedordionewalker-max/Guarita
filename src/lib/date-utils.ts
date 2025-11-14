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
  
  // O input date já retorna no formato YYYY-MM-DD
  // Apenas retornamos o valor exatamente como veio, sem fazer parse
  // Isso evita qualquer conversão de timezone
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

/**
 * Converte uma string ISO (ex.: 2023-07-19T12:34:56Z) para YYYY-MM-DD
 * Retorna string vazia se entrada inválida
 */
export function convertIsoToLocalDateString(iso?: string | null): string {
  if (!iso) return '';
  try {
    // Pega os 10 primeiros caracteres YYYY-MM-DD, que já representam a data
    return String(iso).substring(0, 10);
  } catch (e) {
    return '';
  }
}

/**
 * Formata uma string de data YYYY-MM-DD para exibição DD/MM/YYYY
 * SEM fazer conversão de timezone - usa a data exatamente como está no banco
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  
  // Se já está no formato YYYY-MM-DD, apenas formata para DD/MM/YYYY
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
}
