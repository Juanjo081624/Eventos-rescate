(function () {
  'use strict';

  const COLLECTION = 'events';
  const listeners = new Set();
  let unsubscribeSnapshot = null;
  let latestEvents = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const now = () => new Date().toISOString();
  const collectionRef = () => window.firebaseDb.collection(COLLECTION);

  function normalizeDocument(document) {
    const data = document.data() || {};
    return { id: document.id, ...data };
  }

  function sortEvents(events) {
    return events.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }

  function emit(events) {
    latestEvents = sortEvents(events.map(clone));
    listeners.forEach(({ callback }) => {
      try { callback(clone(latestEvents)); } catch (error) { console.error(error); }
    });
  }

  function emitError(error) {
    console.error('Firestore:', error);
    listeners.forEach(({ onError }) => {
      if (typeof onError === 'function') onError(error);
    });
  }

  function ensureRealtimeListener() {
    if (unsubscribeSnapshot) return;
    unsubscribeSnapshot = collectionRef().onSnapshot(
      snapshot => emit(snapshot.docs.map(normalizeDocument)),
      emitError
    );
  }

  async function getById(id) {
    const snapshot = await collectionRef().doc(id).get();
    return snapshot.exists ? normalizeDocument(snapshot) : null;
  }

  async function commitInChunks(operations, chunkSize = 400) {
    for (let index = 0; index < operations.length; index += chunkSize) {
      const batch = window.firebaseDb.batch();
      operations.slice(index, index + chunkSize).forEach(operation => operation(batch));
      await batch.commit();
    }
  }

  window.EventStore = {
    mode: 'firestore',

    subscribe(callback, onError) {
      const listener = { callback, onError };
      listeners.add(listener);
      if (latestEvents.length) callback(clone(latestEvents));
      ensureRealtimeListener();
      return () => {
        listeners.delete(listener);
        if (!listeners.size && unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
      };
    },

    async save(event) {
      const data = clone(event || {});
      const id = data.id || createId();
      delete data.id;
      data.createdAt = data.createdAt || now();
      data.updatedAt = now();
      data.deleted = Boolean(data.deleted);

      await collectionRef().doc(id).set(data, { merge: true });
      return id;
    },

    async trash(id, meta = {}) {
      const reference = collectionRef().doc(id);
      await window.firebaseDb.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new Error('El evento no existe.');
        const event = snapshot.data() || {};
        const at = now();
        transaction.set(reference, {
          deleted: true,
          deletedAt: at,
          deletedBy: meta.user || '',
          deletionReason: meta.reason || '',
          updatedAt: at,
          updatedBy: meta.user || event.updatedBy || '',
          history: [
            ...(event.history || []),
            { action: 'Evento enviado a papelera', user: meta.user || '', at, details: meta.reason || '' }
          ]
        }, { merge: true });
      });
    },

    async restore(id, user = '') {
      const reference = collectionRef().doc(id);
      await window.firebaseDb.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new Error('El evento no existe.');
        const event = snapshot.data() || {};
        const at = now();
        transaction.set(reference, {
          deleted: false,
          restoredAt: at,
          restoredBy: user,
          updatedAt: at,
          updatedBy: user || event.updatedBy || '',
          history: [
            ...(event.history || []),
            { action: 'Evento restaurado', user, at, details: '' }
          ]
        }, { merge: true });
      });
    },

    async remove(id) {
      await collectionRef().doc(id).delete();
    },

    async replaceAll(events) {
      if (!Array.isArray(events)) throw new Error('El respaldo no contiene una lista válida de eventos.');

      const current = await collectionRef().get();
      const deleteOperations = current.docs.map(document => batch => batch.delete(document.ref));
      await commitInChunks(deleteOperations);

      const normalized = events.map(item => {
        const event = clone(item || {});
        const id = event.id || createId();
        delete event.id;
        event.createdAt = event.createdAt || now();
        event.updatedAt = event.updatedAt || now();
        event.deleted = Boolean(event.deleted);
        return { id, event };
      });

      const writeOperations = normalized.map(({ id, event }) => batch => {
        batch.set(collectionRef().doc(id), event);
      });
      await commitInChunks(writeOperations);
    },

    async getAll() {
      const snapshot = await collectionRef().get();
      return sortEvents(snapshot.docs.map(normalizeDocument));
    },

    async getById(id) {
      return getById(id);
    }
  };
})();
