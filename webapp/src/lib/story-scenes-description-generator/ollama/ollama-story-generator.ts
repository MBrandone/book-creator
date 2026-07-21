import { env } from "@/config/env";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import {
	DEFAULT_OPTIONS,
	type StoryGeneratorOptions,
} from "@/lib/story-scenes-description-generator/ollama/story-generator-options";
import {
	DEFAULT_ART_STYLE,
	generateUserPrompt,
	getStylePrefix,
	SYSTEM_PROMPT,
} from "@/lib/story-scenes-description-generator/prompts";
import { StoryGenerationError } from "@/lib/story-scenes-description-generator/story-generation-error";
import type {
	GeneratedScene,
	StoryContext,
	StoryScenesDescriptionGenerator,
} from "@/lib/story-scenes-description-generator/story-scenes-description-generator";
import {
	parseJSONResponse,
	validateAIResponse,
	validateStoryContext,
} from "@/lib/story-scenes-description-generator/validator";

export class OllamaStoryGenerator implements StoryScenesDescriptionGenerator {
	private readonly config: OllamaConfig = {
		baseUrl: env.OLLAMA_BASE_URL,
		model: env.OLLAMA_MODEL,
		timeout: env.STORY_GENERATION_TIMEOUT,
	};
	public readonly name = "Ollama";
	protected options: Required<StoryGeneratorOptions>;

	constructor(options: StoryGeneratorOptions = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
		getLogger().debug("OllamaStoryGenerator initialized", {
			baseUrl: this.config.baseUrl,
			model: this.config.model,
		});
	}

	async isAvailable(): Promise<boolean> {
		try {
			const response = await fetch(`${this.config.baseUrl}/api/tags`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) {
				getLogger().warn("Ollama server not responding", {
					status: response.status,
				});
				return false;
			}

			const data = (await response.json()) as OllamaListResponse;

			const modelAvailable = data.models.some((m) =>
				m.name.includes(this.config.model)
			);

			if (!modelAvailable) {
				getLogger().warn("Ollama model not found", {
					model: this.config.model,
				});
				return false;
			}

			getLogger().info("Ollama available", { model: this.config.model });
			return true;
		} catch (error) {
			getLogger().warn("Ollama availability check failed", {
				error: String(error),
			});
			return false;
		}
	}

	async generateStory(context: StoryContext): Promise<GeneratedScene[]> {
		getLogger().info("Starting story generation", {
			title: context.title,
			characterCount: context.characters.length,
		});

		validateStoryContext(context);

		const available = await this.isAvailable();
		if (!available) {
			throw new StoryGenerationError(
				"Ollama is not available. Please ensure Ollama is running and the model is downloaded.",
				this.name
			);
		}

		try {
			const systemPrompt = SYSTEM_PROMPT;
			const userPrompt = generateUserPrompt(
				context.title,
				context.description,
				context.characters
			);

			const fullPrompt = `${systemPrompt}

---

${userPrompt}

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.`;

			const startTime = Date.now();

			const response = await this.withTimeout(
				this.callOllamaAPI(fullPrompt),
				this.config.timeout
			);

			const duration = Date.now() - startTime;
			getLogger().info("Ollama story generated", { durationMs: duration });

			const parsedResponse = parseJSONResponse(response.response);
			const validatedResponse = validateAIResponse(parsedResponse);

			const stylePrefix = getStylePrefix(DEFAULT_ART_STYLE);
			const scenes = validatedResponse.scenes.map((scene) => ({
				scene_number: scene.scene_number,
				scene_type: scene.scene_type,
				description: scene.description,
				prompt: stylePrefix
					? `${stylePrefix}, ${scene.image_prompt}`
					: scene.image_prompt,
			}));

			getLogger().info("Story scenes generated", {
				sceneCount: scenes.length,
				artStyle: DEFAULT_ART_STYLE,
			});
			return scenes;
		} catch (error) {
			getLogger().error("Story generation failed", { error: String(error) });

			if (error instanceof StoryGenerationError) {
				throw error;
			}

			throw new StoryGenerationError(
				`Failed to generate story: ${error instanceof Error ? error.message : "Unknown error"}`,
				this.name
			);
		}
	}

	private async callOllamaAPI(prompt: string): Promise<OllamaGenerateResponse> {
		const requestBody: OllamaGenerateRequest = {
			model: this.config.model,
			prompt: prompt,
			stream: false,
			format: "json",
			options: {
				temperature: this.options.temperature,
				num_predict: this.options.maxTokens,
			},
		};

		try {
			const response = await fetch(`${this.config.baseUrl}/api/generate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new StoryGenerationError(
					`Ollama API error (${response.status}): ${errorText}`,
					this.name
				);
			}

			const data = (await response.json()) as OllamaGenerateResponse;

			if (!data.response) {
				throw new StoryGenerationError(
					"Empty response from Ollama API",
					this.name
				);
			}

			getLogger().debug("Received response from Ollama", {
				model: data.model,
				responseLength: data.response.length,
			});

			return data;
		} catch (error) {
			if (error instanceof StoryGenerationError) {
				throw error;
			}

			if (error instanceof TypeError && error.message.includes("fetch")) {
				throw new StoryGenerationError(
					`Cannot connect to Ollama at ${this.config.baseUrl}. Is Ollama running?`,
					this.name
				);
			}

			throw new StoryGenerationError(
				`Ollama API call failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				this.name
			);
		}
	}

	protected async withTimeout<T>(
		promise: Promise<T>,
		timeoutMs: number = this.options.timeout
	): Promise<T> {
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				reject(
					new StoryGenerationError(
						`Request timeout after ${timeoutMs}ms`,
						this.name
					)
				);
			}, timeoutMs);
		});

		return Promise.race([promise, timeoutPromise]);
	}
}

interface OllamaConfig {
	baseUrl: string;
	model: string;
	timeout: number;
}

interface OllamaGenerateRequest {
	model: string;
	prompt: string;
	stream: boolean;
	format?: "json";
	options?: {
		temperature?: number;
		num_predict?: number;
	};
}

interface OllamaGenerateResponse {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
	context?: number[];
	total_duration?: number;
	load_duration?: number;
	prompt_eval_count?: number;
	prompt_eval_duration?: number;
	eval_count?: number;
	eval_duration?: number;
}

interface OllamaListResponse {
	models: Array<{
		name: string;
		modified_at: string;
		size: number;
	}>;
}
