'use client';

/** Integration pattern — copy into your app */
import { ExperienceWidget } from '@liforma/client/react';

export default function Demo() {
	return (
		<ExperienceWidget
			experienceId="exp_t0i7acmq"
			alt="Talk to our coffee barista"
			position="bottom-right"
			offset={16}
			prefetch="idle"
			websiteAssistant
		/>
	);
}
