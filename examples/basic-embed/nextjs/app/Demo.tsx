'use client';

/**
 * Hello-world Experience mount — public session mint via experienceId only.
 * Import from `@liforma/client/react` (not `/next`).
 */
import { Experience } from '@liforma/client/react';

export default function Demo() {
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
