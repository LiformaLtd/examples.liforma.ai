export const PRACTICE_EXPERIENCE_ID = 'exp_01EXAMPLES_COFFEE_BARISTA';

export type PracticeTurn = {
	readonly id: string;
	readonly tutorLine: string;
	readonly hint: string;
};

export const practiceTurns: readonly PracticeTurn[] = [
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
