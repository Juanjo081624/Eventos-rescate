(function () {
  'use strict';

  const auth = window.firebaseAuth;
  const db = window.firebaseDb;
  const USERS = 'users';

  function mapAuthError(error) {
    const code = error && error.code;
    const messages = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/user-disabled': 'Esta cuenta está deshabilitada.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
      'auth/invalid-email': 'El correo electrónico no es válido.',
      'auth/network-request-failed': 'No fue posible conectar. Revisa internet.'
    };
    return messages[code] || 'No fue posible iniciar sesión.';
  }

  async function getProfile(uid) {
    const snapshot = await db.collection(USERS).doc(uid).get();
    return snapshot.exists ? { uid: snapshot.id, ...snapshot.data() } : null;
  }

  window.AuthStore = {
    async login(email, password, remember) {
      await auth.setPersistence(
        remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
      );
      try {
        return await auth.signInWithEmailAndPassword(email.trim(), password);
      } catch (error) {
        error.userMessage = mapAuthError(error);
        throw error;
      }
    },

    logout() {
      return auth.signOut();
    },

    resetPassword(email) {
      if (!email || !email.trim()) throw new Error('Ingresa tu correo electrónico.');
      return auth.sendPasswordResetEmail(email.trim());
    },

    watch(callback) {
      return auth.onAuthStateChanged(async user => {
        if (!user) {
          callback(null, null);
          return;
        }
        try {
          const profile = await getProfile(user.uid);
          callback(user, profile);
        } catch (error) {
          console.error(error);
          callback(user, null, error);
        }
      });
    },

    getProfile
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
      if (['admin', 'user', 'readonly'].includes(changes.role)) allowed.role = changes.role;
      if (typeof changes.active === 'boolean') allowed.active = changes.active;
      allowed.updatedAt = new Date().toISOString();
      allowed.updatedBy = actor || '';
      await db.collection(USERS).doc(uid).set(allowed, { merge: true });
    }
  };
})();
