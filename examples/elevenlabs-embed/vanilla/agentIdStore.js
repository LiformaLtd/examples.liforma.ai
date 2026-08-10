/** Persist ElevenLabs Agent ID only — never store API keys. */

const DB_NAME = 'liforma-elevenlabs-embed';
const DB_VERSION = 1;
const STORE = 'settings';
const AGENT_ID_KEY = 'elevenlabsAgentId';

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE);
			}
		};
		req.onsuccess = () => resolve(req.result);
	});
}

/**
 * @template T
 * @param {(store: IDBObjectStore) => IDBRequest<T>} run
 * @param {IDBTransactionMode} mode
 * @returns {Promise<T>}
 */
async function withStore(run, mode) {
	const db = await openDb();
	try {
		return await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, mode);
			const store = tx.objectStore(STORE);
			const req = run(store);
			req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
			req.onsuccess = () => resolve(req.result);
		});
	} finally {
		db.close();
	}
}

/** @returns {Promise<string>} */
export async function loadAgentId() {
	try {
		const value = await withStore((store) => store.get(AGENT_ID_KEY), 'readonly');
		return typeof value === 'string' ? value.trim() : '';
	} catch {
		return '';
	}
}

/** @param {string} agentId */
export async function saveAgentId(agentId) {
	const trimmed = String(agentId ?? '').trim();
	try {
		if (!trimmed) {
			await withStore((store) => store.delete(AGENT_ID_KEY), 'readwrite');
			return;
		}
		await withStore((store) => store.put(trimmed, AGENT_ID_KEY), 'readwrite');
	} catch {
		/* ignore persistence failures in the demo */
	}
}
