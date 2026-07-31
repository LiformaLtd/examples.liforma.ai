import {
	experienceClassHasSpeakApi,
	existingSdkScript,
	isLocalLiformaStack,
	resolveLiformaStack,
	sdkClientUrl
} from './liformaStack.js';

const SDK_MARKER = 'data-liforma-sdk';
const DEFAULT_TIMEOUT_MS = 20_000;

let loadPromise = null;

function sdkLoadError(url, options, loadedButMissingSpeakApi = false) {
	if (loadedButMissingSpeakApi) {
		return new Error(
			`SDK loaded from ${url} but does not include the presenter speech APIs. ` +
				(isLocalLiformaStack()
					? 'Rebuild cdn.liforma.ai (`npm run dev:sdk`) and hard-refresh.'
					: 'Ensure cdn.liforma.ai has published a SDK build that includes the Speak API.')
		);
	}

	if (isLocalLiformaStack()) {
		return new Error(
			`Failed to load Liforma SDK from ${url}. ` +
				'Start api (:3001), player (:3002), and cdn SDK preview (:3010).'
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
 * Load the Liforma v2 browser SDK from production CDN by default.
 *
 * @param {object} [options]
 * @param {string} [options.build] CDN cache-bust build id
 * @param {boolean} [options.requireSpeakApi] Guided-practice examples need speak()
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
		const stack = resolveLiformaStack();
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
		script.dataset.apiBaseUrl = stack.apiBaseUrl;
		script.dataset.playerEmbedUrl = stack.playerEmbedUrl;

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

export { experienceClassHasSpeakApi, existingSdkScript, resolveLiformaStack, sdkClientUrl as sdkUrl };
