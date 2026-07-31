/** Scripted practice turns — host-owned lines the avatar speaks via `speak()`. */
export const PRACTICE_EXPERIENCE_ID = 'exp_01MEET_COFFEE_BARISTA';

export const practiceScenario = {
	title: 'Café ordering',
	description: 'Practise ordering at a coffee shop with a scripted tutor and your own speaking feedback.',
	goal: 'Respond naturally when the barista asks what you would like and whether you want milk.'
};

/** @type {readonly { id: string; tutorLine: string; hint: string }[]} */
export const practiceTurns = [
	{
		id: 'welcome',
		tutorLine: 'Welcome! What would you like to order today?',
		hint: 'Try: “I’d like a latte, please.”'
	},
	{
		id: 'milk',
		tutorLine: 'Great choice. Would you like milk in your coffee?',
		hint: 'Try: “Yes, a little milk please.” or “No milk, thanks.”'
	},
	{
		id: 'size',
		tutorLine: 'And what size would you like — small, medium, or large?',
		hint: 'Try: “Medium, please.”'
	}
];
