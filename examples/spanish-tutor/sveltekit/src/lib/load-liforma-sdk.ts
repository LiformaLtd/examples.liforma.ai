/** Bump when the CDN bundle changes materially (avatar paths, API, etc.). */
const SDK_BUILD = '6';

const SDK_MARKER = 'data-liforma-sdk';

const PRODUCTION_CDN_BASE_URL = 'https://cdn.liforma.ai';
const LOCAL_CDN_BASE_URL = 'http://localhost:3010';
const LOCAL_API_BASE_URL = 'http://localhost:3001';
const LOCAL_PLAYER_EMBED_URL = 'http://localhost:3002/embed';

const SDK_LOAD_TIMEOUT_MS = 20_000;

let loadPromise: Promise<void> | null = null;

function useLocalStack(): boolean {
	const viteStack = import.meta.env.VITE_LIFORMA_STACK;
	if (viteStack === 'local') return true;
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	if (params.get('stack') === 'local') return true;
	return window.__LIFORMA_STACK === 'local';
}

function sdkUrl(): string {
	const base = useLocalStack() ? LOCAL_CDN_BASE_URL : PRODUCTION_CDN_BASE_URL;
	return `${base.replace(/\/$/, '')}/sdk/v2/client.js?b=${SDK_BUILD}`;
}

function isSdkReady(): boolean {
	const globalWindow = window as Window & { Liforma?: { Experience?: unknown } };
	return Boolean(globalWindow.Liforma?.Experience);
}

function existingSdkScript(): HTMLScriptElement | null {
	const el = document.querySelector(`script[${SDK_MARKER}]`);
	return el instanceof HTMLScriptElement ? el : null;
}

function sdkLoadError(url: string): Error {
	if (useLocalStack()) {
		return new Error(
			`Failed to load Liforma SDK from ${url}. ` +
				'Start api (:3001), player (:3002), and optional cdn preview (:3010).'
		);
	}
	return new Error(
		`Failed to load Liforma SDK from ${url}. ` +
			'If v2 was recently added, publish it with npm run deploy in cdn.liforma.ai.'
	);
}

export function loadLiformaSdk(): Promise<void> {
	if (typeof document === 'undefined') {
		return Promise.resolve();
	}

	if (loadPromise) {
		return loadPromise;
	}

	loadPromise = new Promise((resolve, reject) => {
		const url = sdkUrl();
		const existing = existingSdkScript();

		if (existing?.src.includes('/sdk/v2/') && isSdkReady()) {
			resolve();
			return;
		}

		existing?.remove();

		const script = document.createElement('script');
		script.src = url;
		script.setAttribute(SDK_MARKER, 'true');
		script.async = true;

		if (useLocalStack()) {
			script.dataset.apiBaseUrl = LOCAL_API_BASE_URL;
			script.dataset.playerEmbedUrl = LOCAL_PLAYER_EMBED_URL;
		}

		const timeoutId = window.setTimeout(() => {
			loadPromise = null;
			reject(sdkLoadError(url));
		}, SDK_LOAD_TIMEOUT_MS);

		const finish = (ok: boolean) => {
			window.clearTimeout(timeoutId);
			if (!ok || !isSdkReady()) {
				loadPromise = null;
				script.remove();
				reject(sdkLoadError(url));
				return;
			}
			resolve();
		};

		script.onload = () => finish(true);
		script.onerror = () => finish(false);
		document.head.appendChild(script);
	});

	return loadPromise;
}
