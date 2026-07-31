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
	}

	namespace svelteHTML {
		interface IntrinsicElements {
			'liforma-experience': import('svelte/elements').HTMLAttributes<HTMLElement> & {
				'experience-id'?: string;
				language?: string;
			};
		}
	}
}

export {};
