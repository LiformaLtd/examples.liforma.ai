/** Bump when the CDN bundle changes materially (avatar paths, API, etc.). */
const SDK_BUILD = '10';

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
	return Boolean(window.Liforma?.Experience);
}

type LiformaExperienceClass = NonNullable<Window['Liforma']>['Experience'];

export type LiformaExperience = Awaited<ReturnType<LiformaExperienceClass['startSession']>>;

function experienceClassHasSpeakApi(Experience: LiformaExperienceClass | undefined): boolean {
	if (window.Liforma?.features?.speakApi === true) {
		return true;
	}
	return (
		typeof Experience?.prototype?.speak === 'function' &&
		typeof Experience?.prototype?.startListening === 'function' &&
		typeof Experience?.prototype?.stopListening === 'function'
	);
}

function existingSdkScript(): HTMLScriptElement | null {
	const el = document.querySelector(`script[${SDK_MARKER}]`);
	return el instanceof HTMLScriptElement ? el : null;
}

function sdkLoadError(url: string): Error {
	if (useLocalStack()) {
		return new Error(
			`Failed to load Liforma SDK from ${url}. ` +
				'Start api (:3001), player (:3002), and cdn preview (:3010).'
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
			if (!experienceClassHasSpeakApi(window.Liforma?.Experience)) {
				loadPromise = null;
				reject(
					new Error(
						`SDK loaded from ${url} but does not include the presenter speech APIs. ` +
							(useLocalStack()
								? 'Rebuild cdn.liforma.ai (`npm run dev:sdk`) and hard-refresh.'
								: 'Ensure cdn.liforma.ai has published a SDK build that includes the Speak API.')
					)
				);
				return;
			}
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
			if (!ok || !isSdkReady() || !experienceClassHasSpeakApi(window.Liforma?.Experience)) {
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

export function getExperienceClass(): LiformaExperienceClass {
	const Experience = window.Liforma?.Experience;
	if (!Experience || !experienceClassHasSpeakApi(Experience)) {
		throw new Error('Liforma SDK is loaded but missing presenter speech APIs.');
	}
	return Experience;
}
