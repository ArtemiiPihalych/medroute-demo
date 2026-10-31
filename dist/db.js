/*
 * Browser-local IndexedDB for the synthetic Anton pilot.
 * This is a persistence layer for fictional demo records only, not an auth
 * boundary or a store for real patient information.
 */
(() => {
  'use strict';

  const DB_NAME = 'anton-synthetic-pilot';
  const DB_VERSION = 2;
  const STORES = ['users', 'referrals', 'audit', 'meta'];
  let databasePromise;
  let writeQueue = Promise.resolve();

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (request.oldVersion < 2 && db.objectStoreNames.contains('audit')) db.deleteObjectStore('audit');
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('referrals')) db.createObjectStore('referrals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('audit')) db.createObjectStore('audit', { keyPath: 'eventId' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Не удалось открыть локальную базу демо.'));
      request.onblocked = () => reject(new Error('Закройте другие вкладки демо и повторите попытку.'));
    });
    return databasePromise;
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Ошибка локальной базы демо.'));
      transaction.onabort = () => reject(transaction.error || new Error('Изменения демо не сохранены.'));
    });
  }

  function getAll(storeName) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Не удалось прочитать локальную базу демо.'));
    }));
  }

  async function replaceStore(transaction, storeName, rows) {
    const store = transaction.objectStore(storeName);
    store.clear();
    for (const row of rows) store.put(row);
  }

  async function saveSnapshot(snapshot) {
    const save = async () => {
      const db = await openDatabase();
      const transaction = db.transaction(STORES, 'readwrite');
      const done = transactionDone(transaction);
      await Promise.all([
        replaceStore(transaction, 'users', snapshot.users || []),
        replaceStore(transaction, 'referrals', snapshot.referrals || []),
        replaceStore(transaction, 'audit', (snapshot.audit || []).map((row, index) => ({ ...row, eventId: index + 1 }))),
      ]);
      transaction.objectStore('meta').put({ key: 'initialized', value: true });
      await done;
    };
    writeQueue = writeQueue.catch(() => {}).then(save);
    return writeQueue;
  }

  async function initialize(seed) {
    const db = await openDatabase();
    const initialized = await new Promise((resolve, reject) => {
      const request = db.transaction('meta', 'readonly').objectStore('meta').get('initialized');
      request.onsuccess = () => resolve(Boolean(request.result?.value));
      request.onerror = () => reject(request.error || new Error('Не удалось проверить локальную базу демо.'));
    });
    if (!initialized) await saveSnapshot(seed);
    return readSnapshot();
  }

  async function readSnapshot() {
    const [users, referrals, audit] = await Promise.all([
      getAll('users'), getAll('referrals'), getAll('audit'),
    ]);
    return { users, referrals, audit };
  }

  async function reset(seed) {
    await saveSnapshot(seed);
    return readSnapshot();
  }

  window.AntonDB = Object.freeze({ initialize, readSnapshot, saveSnapshot, reset });
})();
