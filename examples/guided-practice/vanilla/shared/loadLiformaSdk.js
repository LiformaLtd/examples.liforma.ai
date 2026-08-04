const SDK_MARKER = 'data-liforma-sdk';
const PRODUCTION_SDK_BASE = 'https://cdn.liforma.ai/sdk/v2/client.js';
const DEFAULT_TIMEOUT_MS = 20_000;

let loadPromise = null;

function sdkClientUrl(build) {
	const base = PRODUCTION_SDK_BASE;
	return build ? `${base}?b=${build}` : base;
}

function existingSdkScript() {
	const el = document.querySelector(`script[${SDK_MARKER}]`);
	return el instanceof HTMLScriptElement ? el : null;
}

function experienceClassHasSpeakApi(Experience) {
	if (typeof window !== 'undefined' && window.Liforma?.features?.speakApi === true) {
		return true;
	}
	return (
		typeof Experience?.prototype?.speak === 'function' &&
		typeof Experience?.prototype?.startListening === 'function' &&
		typeof Experience?.prototype?.stopListening === 'function'
	);
}

function sdkLoadError(url, options, loadedButMissingSpeakApi = false) {
	if (loadedButMissingSpeakApi) {
		return new Error(
			`SDK loaded from ${url} but does not include the presenter speech APIs. ` +
				'Ensure cdn.liforma.ai has published a SDK build that includes the Speak API.'
		);
	}

	return new Error(
		`Failed to load Liforma SDK from ${url}. ` +
			(options.hintWhenProductionFailed ?? 'Check your network and try again.')
	);
}

function isSdkReady(requireSpeakApi) {
	const Experience = window.Liforma?.Experience;
	if (!Experience) return false;
	if (requireSpeakApi && !experienceClassHasSpeakApi(Experience)) return false;
	return true;
}

/**
 * Load the Liforma v2 browser SDK from production CDN.
 * Examples always target production; local monorepo stack is not configured here.
 *
 * @param {object} [options]
 * @param {string} [options.build] CDN cache-bust build id
 * @param {boolean} [options.requireSpeakApi] Guided-practice / speak examples need speak()
 * @param {number} [options.timeoutMs]
 * @param {string} [options.hintWhenProductionFailed]
 */
export function loadLiformaSdk(options = {}) {
	const {
		build = '6',
		requireSpeakApi = false,
		timeoutMs = DEFAULT_TIMEOUT_MS,
		hintWhenProductionFailed
	} = options;

	if (loadPromise) return loadPromise;

	loadPromise = new Promise((resolve, reject) => {
		const url = sdkClientUrl(build);
		const existing = existingSdkScript();

		if (existing?.src.includes('/sdk/v2/') && isSdkReady(requireSpeakApi)) {
			resolve();
			return;
		}

		if (existing && (!existing.src.includes(`/b=${build}`) || !isSdkReady(requireSpeakApi))) {
			existing.remove();
		}

		const script = document.createElement('script');
		script.src = url;
		script.setAttribute(SDK_MARKER, 'true');
		script.async = true;

		const timeoutId = window.setTimeout(() => {
			loadPromise = null;
			reject(sdkLoadError(url, { hintWhenProductionFailed }));
		}, timeoutMs);

		const finish = (networkOk) => {
			window.clearTimeout(timeoutId);
			if (!networkOk) {
				loadPromise = null;
				script.remove();
				reject(sdkLoadError(url, { hintWhenProductionFailed }));
				return;
			}
			if (!isSdkReady(requireSpeakApi)) {
				loadPromise = null;
				script.remove();
				reject(sdkLoadError(url, { hintWhenProductionFailed }, true));
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

export { experienceClassHasSpeakApi, existingSdkScript, sdkClientUrl as sdkUrl };
