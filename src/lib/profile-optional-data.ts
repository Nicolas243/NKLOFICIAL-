export type GuideAccess = {
  downloadCount: number;
  maxDownloads: number;
};

type OptionalProfileReaders<StringItem, LuthierItem, BusinessItem, ProfessorItem> = {
  readGuideAccess: () => Promise<GuideAccess | null>;
  readFavoriteStrings: () => Promise<StringItem[]>;
  readFavoriteLuthiers: () => Promise<LuthierItem[]>;
  readFavoriteBusinesses: () => Promise<BusinessItem[]>;
  readFavoriteProfessors: () => Promise<ProfessorItem[]>;
  onError?: (section: string, error: unknown) => void;
};

export async function loadOptionalProfileData<StringItem, LuthierItem, BusinessItem, ProfessorItem>(
  readers: OptionalProfileReaders<StringItem, LuthierItem, BusinessItem, ProfessorItem>,
): Promise<{
  guideAccess: GuideAccess | null;
  favoriteStrings: StringItem[];
  favoriteLuthiers: LuthierItem[];
  favoriteBusinesses: BusinessItem[];
  favoriteProfessors: ProfessorItem[];
}> {
  const onError = readers.onError ?? ((section, error) => {
    console.error(`[PROFILE] Falha ao carregar ${section}:`, error);
  });

  async function readSafely<T>(section: string, read: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await read();
    } catch (error) {
      onError(section, error);
      return fallback;
    }
  }

  const [
    guideAccess,
    favoriteStrings,
    favoriteLuthiers,
    favoriteBusinesses,
    favoriteProfessors,
  ] = await Promise.all([
    readSafely('guide access', readers.readGuideAccess, null),
    readSafely('favorite strings', readers.readFavoriteStrings, []),
    readSafely('favorite luthiers', readers.readFavoriteLuthiers, []),
    readSafely('favorite businesses', readers.readFavoriteBusinesses, []),
    readSafely('favorite professors', readers.readFavoriteProfessors, []),
  ]);

  return {
    guideAccess,
    favoriteStrings,
    favoriteLuthiers,
    favoriteBusinesses,
    favoriteProfessors,
  };
}
