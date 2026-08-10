export type LessonLevel = 'Beginner' | 'Intermediate';

export type Lesson = {
	id: string;
	title: string;
	description: string;
	level: LessonLevel;
	goal: string;
	/** Liforma experience id from the project catalog or static fallback. */
	experienceId: string;
};

/**
 * Static lesson list shipped in the client bundle for demo simplicity.
 * In production, load lessons from your backend (see the Next.js example's
 * `lib/loadLessons.ts` and optional `LIFORMA_API_KEY` catalog fetch).
 */
export const fallbackLessons: Lesson[] = [
	{
		id: 'coffee-barista',
		title: 'Coffee Shop Barista',
		description: 'Order coffee and a pastry at a London café.',
		level: 'Beginner',
		goal: 'Practise greeting the barista, ordering a drink and snack, and paying.',
		experienceId: 'exp_01EXAMPLES_COFFEE_BARISTA'
	},
	{
		id: 'gp-doctor',
		title: 'GP Appointment',
		description: 'Describe a mild health concern at the doctor.',
		level: 'Beginner',
		goal: 'Practise explaining symptoms and understanding simple medical advice.',
		experienceId: 'exp_01EXAMPLES_GP_DOCTOR'
	},
	{
		id: 'hotel-reception',
		title: 'Hotel Check-in',
		description: 'Check into a boutique hotel at reception.',
		level: 'Beginner',
		goal: 'Practise giving your name, confirming a reservation, and asking about your room.',
		experienceId: 'exp_01EXAMPLES_HOTEL_RECEPTIONIST'
	},
	{
		id: 'airport-checkin',
		title: 'Airport Check-in',
		description: 'Check in for a flight at the airport desk.',
		level: 'Beginner',
		goal: 'Practise stating your destination, baggage, and seat preference.',
		experienceId: 'exp_01EXAMPLES_AIRPORT_CHECKIN'
	},
	{
		id: 'spanish-cafe',
		title: 'Spanish Café',
		description: 'Order food and drinks at a Spanish café.',
		level: 'Beginner',
		goal: 'Practise ordering a drink and snack and asking for the bill.',
		experienceId: 'exp_01EXAMPLES_SPANISH_CAFE_WAITRESS'
	},
	{
		id: 'practice-nurse',
		title: 'Practice Nurse',
		description: 'Book an appointment at the doctor’s surgery.',
		level: 'Beginner',
		goal: 'Practise describing why you came in and arranging a GP appointment.',
		experienceId: 'exp_01EXAMPLES_PRACTICE_NURSE'
	}
];

export const SPANISH_TUTOR_LANGUAGE = 'es' as const;

export function getLesson(lessons: readonly Lesson[], id: string): Lesson | undefined {
	return lessons.find((lesson) => lesson.id === id);
}
