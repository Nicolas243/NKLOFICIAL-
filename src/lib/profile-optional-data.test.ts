import assert from 'node:assert/strict';
import test from 'node:test';
import { loadOptionalProfileData } from './profile-optional-data';

test('returns empty optional sections when a profile read fails', async () => {
  const errors: string[] = [];
  const result = await loadOptionalProfileData({
    readGuideAccess: async () => {
      throw new Error('database unavailable');
    },
    readFavoriteStrings: async () => ['string-id'],
    readFavoriteLuthiers: async () => {
      throw new Error('favorites unavailable');
    },
    readFavoriteBusinesses: async () => ['business-id'],
    readFavoriteProfessors: async () => ['professor-id'],
    onError: (message) => errors.push(message),
  });

  assert.equal(result.guideAccess, null);
  assert.deepEqual(result.favoriteStrings, ['string-id']);
  assert.deepEqual(result.favoriteLuthiers, []);
  assert.deepEqual(result.favoriteBusinesses, ['business-id']);
  assert.deepEqual(result.favoriteProfessors, ['professor-id']);
  assert.deepEqual(errors, [
    'guide access',
    'favorite luthiers',
  ]);
});
