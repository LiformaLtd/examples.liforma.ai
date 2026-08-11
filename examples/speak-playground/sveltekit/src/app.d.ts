declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		__LIFORMA_STACK?: 'local' | 'production';
		Liforma?: {
			Experience: {
				startSession: (
					options: Record<string, unknown>
				) => Promise<LiformaExperienceInstance>;
				prototype: {
					speak?: (options: Record<string, unknown>) => Promise<SpeakResult>;
					startListening?: () => Promise<void>;
					stopListening?: () => Promise<{ utteranceId: string; text: string }>;
					on?: (event: string, handler: (payload: unknown) => void) => () => void;
					attach?: (options: Record<string, unknown>) => Promise<unknown>;
					getManifest?: () => unknown;
				};
			};
			sdkVersion: 'v2';
			features?: { speakApi?: boolean };
		};
	}

	type SpeakResult = {
		text: string;
		durationMs: number;
	};

	type LiformaExperienceInstance = {
		speak: (options: {
			text: string;
			behavior?: 'enqueue' | 'interrupt';
		}) => Promise<SpeakResult>;
		startListening: () => Promise<void>;
		stopListening: () => Promise<{ utteranceId: string; text: string }>;
		on: (event: string, handler: (payload: unknown) => void) => () => void;
		attach: (options: Record<string, unknown>) => Promise<unknown>;
		getManifest: () => {
			experience?: { mode?: string; responseMode?: string; speechInputMode?: string };
		} | null;
	};
}

export {};
