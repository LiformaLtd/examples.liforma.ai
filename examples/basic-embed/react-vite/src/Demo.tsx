/**
 * Hello-world Experience mount — public session mint via experienceId only.
 */
import { Experience } from '@liforma/client/react';

export function Demo() {
	return (
		<div className="stage">
			<p className="lede">
				This example shows a simple Experience embedded in a div on a web page.
			</p>
			<div className="experience">
				<Experience experienceId="exp_01EXAMPLES_COFFEE_BARISTA" />
			</div>
		</div>
	);
}
