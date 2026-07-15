export type StoryListItemView = {
	id: string;
	title: string;
	description: string;
	status: string;
	created_at: string;
	updated_at: string;
	character_count: number;
	scene_count: number;
};

export type StoryListView = StoryListItemView[];
