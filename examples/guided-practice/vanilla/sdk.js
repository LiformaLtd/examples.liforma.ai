/** Bump when the CDN bundle changes materially. */
const SDK_BUILD = '9';

import {
	experienceClassHasSpeakApi,
	existingSdkScript,
	loadLiformaSdk as loadSharedLiformaSdk,
	sdkUrl
} from './shared/loadLiformaSdk.js';

export { experienceClassHasSpeakApi, existingSdkScript, sdkUrl };

export function loadLiformaSdk() {
	return loadSharedLiformaSdk({
		build: SDK_BUILD,
		requireSpeakApi: true,
		hintWhenProductionFailed:
			'Ensure the experience origin is allowed in the developer portal and the experience is published.'
	});
}
