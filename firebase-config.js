(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: 'AIzaSyBhVC3v8Q2RjFjtcO9oI5x-EQALwsZev-o',
    authDomain: 'eventos-rescate.firebaseapp.com',
    projectId: 'eventos-rescate',
    storageBucket: 'eventos-rescate.firebasestorage.app',
    messagingSenderId: '728772129352',
    appId: '1:728772129352:web:25d18ae68cea067bd19e7d'
  };

  if (!window.firebase) {
    throw new Error('No se pudo cargar Firebase. Revisa la conexión a internet en la primera carga.');
  }

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  window.firebaseDb = firebase.firestore();
  window.firebaseAuth = firebase.auth();

  // Firestore conserva una copia local y sincroniza cuando vuelve internet.
  window.firebaseDb.enablePersistence({ synchronizeTabs: true }).catch(error => {
    if (error && error.code !== 'failed-precondition' && error.code !== 'unimplemented') {
      console.warn('No fue posible activar la persistencia offline de Firestore:', error);
    }
  });
})();
