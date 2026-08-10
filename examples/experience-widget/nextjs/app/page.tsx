import Demo from './Demo';

export default function Page() {
	return (
		<>
			<main className="page">
				<p className="eyebrow">Liforma example</p>
				<h1>Experience widget</h1>
				<p className="lede">
					This page is ordinary marketing copy. The avatar in the corner is an
					<code>&lt;ExperienceWidget /&gt;</code> with <code>position=&quot;bottom-right&quot;</code> —
					no host CSS required. The SDK loads thumb plates from the public preview API, warms the
					player after idle, then opens the conversation on one click. On desktop, use the reduce
					control to dock a draggable portrait window; on mobile the player opens near full-screen
					with close only.
				</p>
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
