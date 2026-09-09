/** Integration pattern — copy into your app */
import { ExperienceWidget } from '@liforma/client/react';

export function Demo() {
	return (
		<ExperienceWidget
			experienceId="exp_T0I7ACMQLBMPG6K"
			alt="Talk to our coffee barista"
			position="bottom-right"
			offset={16}
			prefetch="idle"
		/>
	);
}
