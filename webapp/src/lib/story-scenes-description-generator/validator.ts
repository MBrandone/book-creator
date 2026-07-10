import { z } from "zod";
import type { SceneType } from "@/lib/infrastructure/db/schema";
import type { StoryContext } from "./story-scenes-description-generator";

export function validateStoryContext(context: StoryContext): void {
	storyContextSchema.parse(context);
}

export function validateAIResponse(response: unknown): AIStoryResponse {
	return aiStoryResponseSchema.parse(response);
}

export function normalizeSceneType(sceneType: string): string {
	return removeAccents(sceneType.toLowerCase().trim());
}

function removeAccents(str: string): string {
	return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function convertDifferentOutputFormatToString(output: object): string {
	if (typeof output === "string") {
		return output;
	} else if (Array.isArray(output)) {
		return output.join("");
	} else if (output && typeof output === "object" && "output" in output) {
		const typedOutput = output as ReplicateRunOutput;
		if (typeof typedOutput.output === "string") {
			return typedOutput.output;
		} else if (Array.isArray(typedOutput.output)) {
			return typedOutput.output.join("");
		} else {
			throw new Error("Unexpected output format from Replicate");
		}
	} else {
		throw new Error("Unexpected output format from Replicate");
	}
}

export function parseJSONResponse(response: string): unknown {
	try {
		return JSON.parse(response);
	} catch {
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[0]);
			} catch {
				throw new Error("Failed to parse JSON from response");
			}
		}
		throw new Error("No valid JSON found in response");
	}
}

const characterSchema = z
	.object({
		name: z.string().min(1, "Character name is required"),
		description: z
			.string()
			.min(10, "Character description needs to be at least 10 characters"),
	})
	.strict();

const storyContextSchema = z.object({
	title: z.string().min(1, "Story title is required"),
	description: z
		.string()
		.min(10, "Story description needs to be at least 10 characters"),
	characters: z
		.array(characterSchema)
		.min(1, "At least one character is required")
		.max(5, "Too many characters (maximum 5)"),
});

const sceneTypeSchema = z
	.string()
	.transform((val) => normalizeSceneType(val))
	.refine(
		(val): val is SceneType => {
			const validSceneTypes: SceneType[] = [
				"introduction",
				"conflict",
				"action",
				"resolution",
			];
			return validSceneTypes.includes(val as SceneType);
		},
		{
			message:
				"scene_type must be one of: introduction, conflict, action, resolution",
		}
	);

const aiSceneResponseSchema = z
	.object({
		scene_number: z.number(),
		scene_type: sceneTypeSchema,
		description: z.string().min(1),
		image_prompt: z.string().min(1),
	})
	.strict();

const aiStoryResponseSchema = z
	.object({
		scenes: z
			.array(aiSceneResponseSchema)
			.length(4, "Expected exactly 4 scenes"),
	})
	.strict();

export interface AISceneResponse {
	scene_number: number;
	scene_type: SceneType;
	description: string;
	image_prompt: string;
}

export interface AIStoryResponse {
	scenes: AISceneResponse[];
}

export interface ReplicateRunOutput {
	output?: string | string[];
}
