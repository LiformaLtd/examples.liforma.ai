/** Production Liforma platform URLs (default for all examples). */
export const PRODUCTION_STACK = {
	name: 'production',
	cdnBaseUrl: 'https://cdn.liforma.ai',
	apiBaseUrl: 'https://api.liforma.ai',
	playerEmbedUrl: 'https://player.liforma.ai/embed'
};

/** Local monorepo stack — only for Liforma engineers testing unpublished changes. */
export const LOCAL_STACK = {
	name: 'local',
	cdnBaseUrl: 'http://localhost:3010',
	apiBaseUrl: 'http://localhost:3001',
	playerEmbedUrl: 'http://localhost:3002/embed'
};

/**
 * Resolve which Liforma stack the example should use.
 *
 * Default: production. Override with `?stack=local` or `window.__LIFORMA_STACK`.
 */
export function resolveLiformaStack() {
	if (typeof window === 'undefined') {
		return PRODUCTION_STACK;
	}

	const params = new URLSearchParams(window.location.search);
	const paramStack = params.get('stack');
	const globalStack = window.__LIFORMA_STACK;

	if (paramStack === 'local' || globalStack === 'local') {
		return LOCAL_STACK;
	}
	if (paramStack === 'production' || globalStack === 'production') {
		return PRODUCTION_STACK;
	}

	return PRODUCTION_STACK;
}

export function isLocalLiformaStack() {
	return resolveLiformaStack().name === 'local';
}

export function sdkClientUrl(build) {
	const stack = resolveLiformaStack();
	return `${stack.cdnBaseUrl.replace(/\/$/, '')}/sdk/v2/client.js?b=${build}`;
}

export function experienceClassHasSpeakApi(Experience) {
	return (
		typeof Experience?.prototype?.speak === 'function' &&
		typeof Experience?.prototype?.startListening === 'function' &&
		typeof Experience?.prototype?.stopListening === 'function'
	);
}

const SDK_MARKER = 'data-liforma-sdk';

export function existingSdkScript() {
	const el = document.querySelector(`script[${SDK_MARKER}]`);
	return el instanceof HTMLScriptElement ? el : null;
}
