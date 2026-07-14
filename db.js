const DB_NAME = 'rescate_cua_eventos';
const DB_VERSION = 1;
const STORE_EVENTS = 'events';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        const store = db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
        store.createIndex('deleted', 'deleted', { unique: false });
        store.createIndex('startDate', 'startDate', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbTransaction(mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, mode);
    const store = tx.objectStore(STORE_EVENTS);
    let result;
    try { result = callback(store); } catch (error) { reject(error); return; }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción cancelada'));
  });
}

async function getAllEvents() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readonly');
    const req = tx.objectStore(STORE_EVENTS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function saveEvent(event) {
  return dbTransaction('readwrite', (store) => store.put(event));
}

async function deleteEventPermanently(id) {
  return dbTransaction('readwrite', (store) => store.delete(id));
}

async function replaceAllEvents(events) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readwrite');
    const store = tx.objectStore(STORE_EVENTS);
    store.clear();
    events.forEach((event) => store.put(event));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

window.RescueDB = { getAllEvents, saveEvent, deleteEventPermanently, replaceAllEvents };
