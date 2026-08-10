/** Integration pattern — copy into your app */
import { ExperienceWidget } from '@liforma/client/react';

export function Demo() {
	return (
		<ExperienceWidget
			experienceId="exp_01EXAMPLES_COFFEE_BARISTA"
			alt="Talk to our coffee barista"
			position="bottom-right"
			offset={16}
			prefetch="idle"
		/>
	);
}
