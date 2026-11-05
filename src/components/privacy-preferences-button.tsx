'use client';

import { CONSENT_STORAGE_KEY } from '@/components/privacy-scripts';

export function PrivacyPreferencesButton() {
  function resetPreferences() {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.location.reload();
  }

  return (
    <button type="button" onClick={resetPreferences} className="text-neon font-bold hover:underline">
      Abrir preferências de cookies e publicidade
    </button>
  );
}
