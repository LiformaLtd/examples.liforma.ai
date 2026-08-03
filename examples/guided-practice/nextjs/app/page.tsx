import type { Metadata } from 'next';

import PracticeApp from './PracticeApp';

export const metadata: Metadata = {
	title: 'Guided practice — Liforma Example',
	description:
		'Marvely-style scripted practice with presenter speak() and manual listening.'
};

export default function Page() {
	return <PracticeApp />;
}
