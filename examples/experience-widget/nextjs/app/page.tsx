import Demo from './Demo';

export default function Page() {
	return (
		<>
			<main className="page">
				<p className="eyebrow">Liforma example</p>
				<h1>Experience widget</h1>
				<p className="lede">
					This page is ordinary marketing copy. The avatar in the corner is an
					<code>&lt;ExperienceWidget /&gt;</code> with <code>position=&quot;bottom-right&quot;</code> and{' '}
					<code>websiteAssistant</code> — no host CSS required. Ask it about the unique pricing
					fact below. The SDK loads thumb plates from the public preview API, warms the player
					after idle, then opens the conversation on one click. On desktop, use the reduce
					control to dock a draggable portrait window; on mobile the player opens near full-screen
					with close only.
				</p>
				<p>
					<strong>The Acme Plus plan includes twelve seats and priority support.</strong> Ask the
					widget: “How many seats does the Plus plan include?”
				</p>
				<section data-liforma-ignore="true">
					<p>
						Private note: this section is marked <code>data-liforma-ignore</code> and must not be
						read by the website assistant (secret codeword: zebra-moon-419).
					</p>
				</section>
				<p>
					Use <code>position=&quot;static&quot;</code> (default) when you want to place the FAB
					yourself with an enclosing div. Optional <code>offset</code> sets the corner inset
					(default 16).
				</p>
			</main>
			<Demo />
		</>
	);
}
