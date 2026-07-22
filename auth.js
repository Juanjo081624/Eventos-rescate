(function () {
  'use strict';

  const auth = window.firebaseAuth;
  const db = window.firebaseDb;
  const USERS = 'users';

  if (!auth || !db) {
    throw new Error('Firebase Authentication o Firestore no están disponibles.');
  }

  function mapAuthError(error) {
    const code = error && error.code;
    const messages = {
      'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes e inténtalo nuevamente.',
      'auth/popup-closed-by-user': 'El inicio de sesión fue cancelado.',
      'auth/cancelled-popup-request': 'Ya existe un inicio de sesión en curso.',
      'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Authentication.',
      'auth/network-request-failed': 'No fue posible conectar con Google. Revisa tu conexión a internet.',
      'auth/account-exists-with-different-credential': 'Este correo ya está asociado a otro método de acceso.',
      'auth/user-disabled': 'Esta cuenta está deshabilitada.',
      'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'La API key configurada para Firebase no es válida.'
    };
    return messages[code] || (error && error.message) || 'No fue posible iniciar sesión con Google.';
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function initialProfile(user) {
    const now = nowIso();
    return {
      fullName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      provider: 'google',
      role: 'pending',
      active: false,
      createdAt: now,
      updatedAt: now,
      lastLogin: now
    };
  }

  async function getProfile(uid) {
    const snapshot = await db.collection(USERS).doc(uid).get();
    return snapshot.exists ? { uid: snapshot.id, ...snapshot.data() } : null;
  }

  async function ensureProfile(user) {
    const ref = db.collection(USERS).doc(user.uid);
    const snapshot = await ref.get();
    const now = nowIso();

    if (!snapshot.exists) {
      const profile = initialProfile(user);
      await ref.set(profile);
      return { uid: user.uid, ...profile };
    }

    const existing = snapshot.data();
    const changes = {
      fullName: existing.fullName || user.displayName || '',
      email: user.email || existing.email || '',
      photoURL: user.photoURL || existing.photoURL || '',
      provider: 'google',
      updatedAt: now,
      lastLogin: now
    };
    await ref.set(changes, { merge: true });
    return { uid: user.uid, ...existing, ...changes };
  }

  window.AuthStore = {
    async loginWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      try {
        return await auth.signInWithPopup(provider);
      } catch (error) {
        error.userMessage = mapAuthError(error);
        throw error;
      }
    },

    logout() {
      return auth.signOut();
    },

    watch(callback) {
      return auth.onAuthStateChanged(async user => {
        if (!user) {
          callback(null, null);
          return;
        }
        try {
          const profile = await ensureProfile(user);
          callback(user, profile);
        } catch (error) {
          console.error('No fue posible cargar o crear el perfil:', error);
          callback(user, null, error);
        }
      });
    },

    getProfile,
    ensureProfile,
    mapAuthError
  };

  window.UserStore = {
    subscribe(callback, onError) {
      return db.collection(USERS).orderBy('fullName').onSnapshot(
        snapshot => callback(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))),
        onError
      );
    },

    async update(uid, changes, actor) {
      const allowed = {};
      if (typeof changes.fullName === 'string') allowed.fullName = changes.fullName.trim();
      if (['admin', 'user', 'readonly', 'pending'].includes(changes.role)) allowed.role = changes.role;
      if (typeof changes.active === 'boolean') allowed.active = changes.active;
      allowed.updatedAt = nowIso();
      allowed.updatedBy = actor || '';
      await db.collection(USERS).doc(uid).set(allowed, { merge: true });
    }
  };
})();
