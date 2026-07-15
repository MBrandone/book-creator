import { StoryAlreadyGeneratingError } from "@/lib/domain/story-already-generating-error";
import { CannotEditSceneAfterGenerationError } from "../cannot-edit-scene-after-generation-error";
import { Character } from "../entities/character";
import { InvalidCharacterCountError } from "../invalid-character-count-error";
import { NoCharactersError } from "../no-characters-error";
import type { Scene, SceneType } from "../scene";
import { SceneDescriptionTooLongError } from "../scene-description-too-long-error";
import { SceneDescriptionTooShortError } from "../scene-description-too-short-error";
import { SceneNotFoundInStoryError } from "../scene-not-found-in-story-error";
import { StoryDescriptionTooLongError } from "../story-description-too-long-error";
import { StoryDescriptionTooShortError } from "../story-description-too-short-error";

export type StoryStatus = "pending" | "generating" | "completed" | "failed";

export class Story {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	status: StoryStatus;
	readonly createdAt: Date;
	updatedAt: Date;
	readonly characters: Character[];
	private _scenes: Scene[];

	private constructor(data: {
		id: string;
		title: string;
		description: string;
		status: StoryStatus;
		createdAt: Date;
		updatedAt: Date;
		characters: Character[];
		scenes: Scene[];
	}) {
		this.id = data.id;
		this.title = data.title;
		this.description = data.description;
		this.status = data.status;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
		this.characters = data.characters;
		this._scenes = data.scenes;
	}

	static create(data: {
		id: string;
		title: string;
		description: string;
		characters: Array<{
			id: string;
			name: string;
			description: string;
			photo?: { storageBucket: string; storageKey: string };
		}>;
	}): Story {
		if (data.description.trim().length < 10) {
			throw new StoryDescriptionTooShortError();
		}

		if (data.description.length > 2000) {
			throw new StoryDescriptionTooLongError();
		}

		if (data.characters.length < 1 || data.characters.length > 2) {
			throw new InvalidCharacterCountError(data.characters.length);
		}

		const characters = data.characters.map((characterData) =>
			Character.create({
				id: characterData.id,
				storyId: data.id,
				name: characterData.name,
				description: characterData.description,
				photoStorageBucket: characterData.photo?.storageBucket,
				photoStorageKey: characterData.photo?.storageKey,
			})
		);

		return new Story({
			id: data.id,
			title: data.title,
			description: data.description,
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
			characters,
			scenes: [],
		});
	}

	static hydrate(data: {
		id: string;
		title: string;
		description: string;
		status: StoryStatus;
		createdAt: Date;
		updatedAt: Date;
		characters: Character[];
		scenes: Scene[];
	}): Story {
		return new Story(data);
	}

	canAddMoreCharacters(): boolean {
		return this.characters.length < 2;
	}

	startGeneration(): void {
		if (this.status === "generating") {
			throw new StoryAlreadyGeneratingError(this.status);
		}

		if (this.characters.length === 0) {
			throw new NoCharactersError();
		}

		this.status = "generating";
		this.updatedAt = new Date();
	}

	markAsCompleted(): void {
		this.status = "completed";
		this.updatedAt = new Date();
	}

	markAsFailed(): void {
		this.status = "failed";
		this.updatedAt = new Date();
	}

	updateSceneDescription(sceneId: string, newDescription: string): void {
		if (this.status !== "pending") {
			throw new CannotEditSceneAfterGenerationError(this.status);
		}

		const scene = this._scenes.find((scene) => scene.id === sceneId);
		if (!scene) {
			throw new SceneNotFoundInStoryError(sceneId);
		}

		const trimmed = newDescription.trim();

		if (trimmed.length < 10) {
			throw new SceneDescriptionTooShortError();
		}

		if (trimmed.length > 500) {
			throw new SceneDescriptionTooLongError();
		}

		scene.description = newDescription;
		this.updatedAt = new Date();
	}

	get scenes(): Scene[] {
		return this._scenes;
	}

	createScene(
		sceneNumber: number,
		sceneType: SceneType,
		description: string,
		prompt: string
	): void {
		const scene: Scene = {
			id: crypto.randomUUID(),
			storyId: this.id,
			sceneNumber,
			sceneType,
			description,
			prompt,
			storageBucket: null,
			storageKey: null,
		};

		this._scenes.push(scene);
		this.updatedAt = new Date();
	}

	setImageToScene(
		sceneId: string,
		storageBucket: string,
		storageKey: string
	): void {
		const scene = this._scenes.find((s) => s.id === sceneId);
		if (!scene) {
			throw new SceneNotFoundInStoryError(sceneId);
		}

		scene.storageBucket = storageBucket;
		scene.storageKey = storageKey;
		this.updatedAt = new Date();
	}
}
