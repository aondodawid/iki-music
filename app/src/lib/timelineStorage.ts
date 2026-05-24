import type { GenerationResult } from "./types";

const DB_NAME = "iki-music-db";
const DB_VERSION = 1;
const STORE_NAME = "generated-tracks";

interface PersistedGenerationRecord {
  id: string;
  sessionId: string;
  mode: GenerationResult["mode"];
  content: string;
  createdAt: number;
  audioBlob?: Blob;
  audioMimeType?: string;
  audioSampleRate?: number;
}

function hasIndexedDb(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB."));
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, resolve: (value: T) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((database) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);

        transaction.onerror = () => {
          reject(
            transaction.error ?? new Error("IndexedDB transaction failed."),
          );
        };

        transaction.onabort = () => {
          reject(
            transaction.error ?? new Error("IndexedDB transaction aborted."),
          );
        };

        transaction.oncomplete = () => {
          database.close();
        };

        operation(store, resolve);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function toPersistedRecord(
  result: GenerationResult,
): Promise<PersistedGenerationRecord> {
  let audioBlob: Blob | undefined;

  if (result.audio?.url) {
    try {
      const response = await fetch(result.audio.url);
      if (response.ok) {
        audioBlob = await response.blob();
      }
    } catch {
      audioBlob = undefined;
    }
  }

  return {
    id: result.id,
    sessionId: result.sessionId,
    mode: result.mode,
    content: result.content,
    createdAt: result.createdAt,
    audioBlob,
    audioMimeType: result.audio?.mimeType,
    audioSampleRate: result.audio?.sampleRate,
  };
}

function fromPersistedRecord(
  record: PersistedGenerationRecord,
): GenerationResult {
  return {
    id: record.id,
    sessionId: record.sessionId,
    mode: record.mode,
    content: record.content,
    createdAt: record.createdAt,
    audio:
      record.audioBlob && record.audioMimeType && record.audioSampleRate
        ? {
            url: URL.createObjectURL(record.audioBlob),
            mimeType: record.audioMimeType,
            sampleRate: record.audioSampleRate,
          }
        : undefined,
  };
}

export async function loadPersistedTimeline(): Promise<GenerationResult[]> {
  if (!hasIndexedDb()) {
    return [];
  }

  return runTransaction<GenerationResult[]>("readonly", (store, resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = (request.result as PersistedGenerationRecord[])
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(fromPersistedRecord);
      resolve(rows);
    };
  });
}

export async function persistTimelineEntry(
  result: GenerationResult,
): Promise<void> {
  if (!hasIndexedDb()) {
    return;
  }

  const record = await toPersistedRecord(result);

  await runTransaction<void>("readwrite", (store, resolve) => {
    const request = store.put(record);
    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function deletePersistedTimelineEntry(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    return;
  }

  await runTransaction<void>("readwrite", (store, resolve) => {
    const request = store.delete(id);
    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function clearPersistedTimeline(): Promise<void> {
  if (!hasIndexedDb()) {
    return;
  }

  await runTransaction<void>("readwrite", (store, resolve) => {
    const request = store.clear();
    request.onsuccess = () => {
      resolve();
    };
  });
}
