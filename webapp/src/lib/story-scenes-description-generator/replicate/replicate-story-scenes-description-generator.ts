import Replicate from "replicate";
import { env } from "@/config/env";
import type { RetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/retry-strategy";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import {
	LLAMA_MODEL,
	MAX_TOKENS,
	MODEL_NAME,
	MODEL_OWNER,
	TEMPERATURE,
} from "@/lib/story-scenes-description-generator/replicate/config";
import { InMemorySceneGenerator } from "../in-memory/in-memory-story-generator";
import {
	DEFAULT_ART_STYLE,
	getStylePrefix,
	StorySceneDescriptionPromptBuilder,
} from "../prompts";
import type {
	GeneratedScene,
	StoryContext,
	StoryScenesDescriptionGenerator,
} from "../story-scenes-description-generator";
import {
	convertDifferentOutputFormatToString,
	parseJSONResponse,
	validateAIResponse,
} from "../validator";

export class ReplicateStoryScenesDescriptionGenerator
	implements StoryScenesDescriptionGenerator
{
	private readonly client: Replicate;
	private readonly fallbackGenerator: InMemorySceneGenerator;
	private readonly retryStrategy: RetryStrategy;

	constructor(retryStrategy: RetryStrategy) {
		this.client = new Replicate({ auth: env.REPLICATE_API_TOKEN });
		this.fallbackGenerator = new InMemorySceneGenerator();
		this.retryStrategy = retryStrategy;
	}

	async isAvailable(): Promise<boolean> {
		try {
			await this.client.models.get(MODEL_OWNER, MODEL_NAME);
			return true;
		} catch (error) {
			getLogger().error("Replicate availability check failed", {
				error: String(error),
			});
			return false;
		}
	}

	async generateStory(context: StoryContext): Promise<GeneratedScene[]> {
		getLogger().info("Starting story generation", { title: context.title });

		try {
			const prompt = new StorySceneDescriptionPromptBuilder()
				.setUserPrompt(context)
				.getPrompt();
			const output = await this.retryStrategy.execute(() =>
				this.callReplicateAPI(prompt)
			);

			const responseText: string = convertDifferentOutputFormatToString(output);
			const parsedResponse = parseJSONResponse(responseText);
			const validatedResponse = validateAIResponse(parsedResponse);

			const scenes = validatedResponse.scenes.map((scene) => ({
				scene_number: scene.scene_number,
				scene_type: scene.scene_type,
				description: scene.description,
				prompt: getStylePrefix(DEFAULT_ART_STYLE)
					? `${getStylePrefix(DEFAULT_ART_STYLE)}, ${scene.image_prompt}`
					: scene.image_prompt,
			}));

			getLogger().info("Story generation completed", {
				sceneCount: scenes.length,
			});
			return scenes;
		} catch (error) {
			getLogger().error("Story generation error", {
				error: error instanceof Error ? error.message : String(error),
			});
			return await this.fallbackGenerator.generateStory(context);
		}
	}

	private async callReplicateAPI(prompt: string): Promise<object> {
		return await this.client.run(LLAMA_MODEL, {
			input: {
				prompt,
				max_tokens: MAX_TOKENS,
				temperature: TEMPERATURE,
			},
		});
	}
}
