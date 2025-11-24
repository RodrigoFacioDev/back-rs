/**
 * Utilitários para manipulação de datas
 * Garante que as comparações de datas sejam feitas de forma consistente,
 * independente do fuso horário
 */

/**
 * Retorna o início do dia em UTC (00:00:00.000Z)
 * @param date Data opcional. Se não fornecida, usa a data atual
 */
export function getStartOfDayUTC(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Retorna o fim do dia em UTC (23:59:59.999Z)
 * @param date Data opcional. Se não fornecida, usa a data atual
 */
export function getEndOfDayUTC(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/**
 * Adiciona dias a uma data em UTC
 * @param date Data base
 * @param days Número de dias a adicionar (pode ser negativo)
 */
export function addDaysUTC(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Retorna o início de hoje em UTC
 */
export function getTodayStartUTC(): Date {
  return getStartOfDayUTC();
}

/**
 * Retorna o início de amanhã em UTC
 */
export function getTomorrowStartUTC(): Date {
  return addDaysUTC(getTodayStartUTC(), 1);
}

/**
 * Retorna o início de N dias atrás em UTC
 * @param days Número de dias atrás
 */
export function getDaysAgoStartUTC(days: number): Date {
  return addDaysUTC(getTodayStartUTC(), -days);
}
