'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker enregistré avec succès:', registration.scope);
        })
        .catch((error) => {
          console.error('Échec de l\'enregistrement du Service Worker:', error);
        });
    }
  }, []);

  return null;
}
