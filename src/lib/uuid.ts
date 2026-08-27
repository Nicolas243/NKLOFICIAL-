const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida o formato de um UUID antes de alcançar o banco de dados.
 * URLs dinâmicas podem ser injetadas com identificadores malformados;
 * nesses casos a consulta deve retornar 404, não um erro do Postgres.
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}