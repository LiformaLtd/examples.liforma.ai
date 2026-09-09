/**
 * @typedef {'Beginner' | 'Intermediate'} LessonLevel
 */

/**
 * @typedef {Object} Lesson
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {LessonLevel} level
 * @property {string} goal
 * @property {string} experienceId
 */

/** @type {Lesson[]} */
export const fallbackLessons = [
	{
		id: 'coffee-barista',
		title: 'Coffee Shop Barista',
		description: 'Order coffee and a pastry at a London café.',
		level: 'Beginner',
		goal: 'Practise greeting the barista, ordering a drink and snack, and paying.',
		experienceId: 'exp_T0I7ACMQLBMPG6K'
	},
	{
		id: 'gp-doctor',
		title: 'GP Appointment',
		description: 'Describe a mild health concern at the doctor.',
		level: 'Beginner',
		goal: 'Practise explaining symptoms and understanding simple medical advice.',
		experienceId: 'exp_3QMATO3T48QY7KY'
	},
	{
		id: 'hotel-reception',
		title: 'Hotel Check-in',
		description: 'Check into a boutique hotel at reception.',
		level: 'Beginner',
		goal: 'Practise giving your name, confirming a reservation, and asking about your room.',
		experienceId: 'exp_HWN0IEIGOXSC8LS'
	},
	{
		id: 'airport-checkin',
		title: 'Airport Check-in',
		description: 'Check in for a flight at the airport desk.',
		level: 'Beginner',
		goal: 'Practise stating your destination, baggage, and seat preference.',
		experienceId: 'exp_J4VK54TLEN33Q3V'
	},
	{
		id: 'spanish-cafe',
		title: 'Spanish Café',
		description: 'Order food and drinks at a Spanish café.',
		level: 'Beginner',
		goal: 'Practise ordering a drink and snack and asking for the bill.',
		experienceId: 'exp_1DH814CAPBJ1G18'
	},
	{
		id: 'practice-nurse',
		title: 'Practice Nurse',
		description: 'Book an appointment at the doctor’s surgery.',
		level: 'Beginner',
		goal: 'Practise describing why you came in and arranging a GP appointment.',
		experienceId: 'exp_CIBQRPYYCPUR3ZX'
	}
];
