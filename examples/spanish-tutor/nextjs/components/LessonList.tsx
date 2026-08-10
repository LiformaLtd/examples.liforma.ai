import type { Lesson } from '@/lib/lessons';

type LessonListProps = {
	lessons: Lesson[];
	selectedId: string | null;
	sessionActive: boolean;
	onSelect: (id: string) => void;
};

export function LessonList({ lessons, selectedId, sessionActive, onSelect }: LessonListProps) {
	return (
		<>
			<ul className="lesson-list" role="list">
				{lessons.map((lesson) => (
					<li key={lesson.id}>
						<button
							type="button"
							className={`lesson-btn${selectedId === lesson.id ? ' selected' : ''}`}
							disabled={sessionActive}
							aria-pressed={selectedId === lesson.id}
							onClick={() => onSelect(lesson.id)}
						>
							<span className="lesson-top">
								<span className="lesson-title">{lesson.title}</span>
								<span className="lesson-level">{lesson.level}</span>
							</span>
							<span className="lesson-desc">{lesson.description}</span>
						</button>
					</li>
				))}
			</ul>
			{sessionActive ? (
				<p className="lock-note" role="status">
					End the current session before choosing another lesson.
				</p>
			) : null}
		</>
	);
}
