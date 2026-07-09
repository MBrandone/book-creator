export type StoryDetailsView = {
	story: {
		id: string;
		title: string | undefined;
		description: string | undefined;
		status: string;
		created_at: string;
		updated_at: string;
	};
	characters: Array<{
		id: string;
		name: string;
		description: string;
	}>;
	scenes: Array<{
		id: string;
		scene_number: number;
		scene_type: string;
		description: string;
		image_url: string | null;
		prompt: string | null;
	}>;
};
