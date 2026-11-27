import { getStringsCatalog } from '@/actions/strings';

export type StringCatalogEntry = Awaited<ReturnType<typeof getStringsCatalog>>['data'][number];

/**
 * Carrega todas as páginas de stringsCatalog acima do limite de 100 registros por chamada.
 */
export async function getAllStringsCatalog(): Promise<StringCatalogEntry[]> {
  const firstPage = await getStringsCatalog({ page: 1, limit: 100 });
  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = Array.from(
    { length: firstPage.totalPages - 1 },
    (_, index) => index + 2,
  );
  const rest = await Promise.all(
    remainingPages.map((page) => getStringsCatalog({ page, limit: 100 })),
  );

  return [
    ...firstPage.data,
    ...rest.flatMap((result) => result.data),
  ];
}
