"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createStory } from "@/app/_app-http-requests/create-story";
import { fetchStatus } from "@/app/_app-http-requests/fetch-status";
import { fetchStoryData } from "@/app/_app-http-requests/fetch-story-data";
import { generateScenario } from "@/app/_app-http-requests/generate-scenario";
import { CharacterPhotoUpload } from "@/components/character-photo-upload";
import { ComicWordsLoader } from "@/components/loading/comic-words-loader";
import { DreamCloudLoader } from "@/components/loading/dream-cloud-loader";
import { ScenarioViewer } from "@/components/scenario-editor/scenario-viewer";
import { Button } from "@/components/shadcn-ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/shadcn-ui/card";
import { Input } from "@/components/shadcn-ui/input";
import { Label } from "@/components/shadcn-ui/label";
import { Textarea } from "@/components/shadcn-ui/textarea";
import { StoryDescriptionField } from "@/components/story-description-field/story-description-field";

const STORY_STATUS_POLLING_INTERVAL = 5000;
const MAX_CHARACTERS = 2;

export default function CreateStoryPage() {
	const router = useRouter();

	const [characters, setCharacters] = useState<CharacterDraft[]>([]);
	const [characterName, setCharacterName] = useState("");
	const [characterDescription, setCharacterDescription] = useState("");
	const [photoData, setPhotoData] = useState<{
		storageKey: string;
		storageBucket: string;
		previewUrl: string;
	} | null>(null);
	const [showCharacterForm, setShowCharacterForm] = useState(true);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const [storyId, setStoryId] = useState<string>("");
	const [isGeneratingImages, setIsGeneratingImages] = useState(false);

	const characterNames = characters.map((character) => character.name);
	const canAddMoreCharacters = characters.length < MAX_CHARACTERS;
	const hasEnoughCharacters = characters.length >= 1;
	const isDescriptionValid =
		description.trim().length >= 10 && description.length <= 2000;
	const isTitleValid = title.trim().length >= 3;
	const canSubmit = hasEnoughCharacters && isDescriptionValid && isTitleValid;

	const createStoryMutation = useMutation({
		mutationFn: createStory,
		onSuccess: (_, variables) => {
			const createdStoryId = variables.id;
			setStoryId(createdStoryId);
			generateScenarioMutation.mutate(createdStoryId);
		},
	});

	const generateScenarioMutation = useMutation({
		mutationFn: generateScenario,
	});

	const { data: statusData } = useQuery({
		queryKey: ["story-status", storyId],
		queryFn: () => fetchStatus(storyId),
		enabled: isGeneratingImages && !!storyId,
		refetchInterval: STORY_STATUS_POLLING_INTERVAL,
		refetchIntervalInBackground: true,
	});

	const { data: storyData } = useQuery({
		queryKey: ["story-data", storyId],
		queryFn: () => fetchStoryData(storyId),
		enabled: !!storyId && generateScenarioMutation.isSuccess,
	});

	function resetAddCharacterForm() {
		setCharacterName("");
		setCharacterDescription("");
		setPhotoData(null);
	}

	const handleAddCharacter = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const newCharacter: CharacterDraft = {
			id: crypto.randomUUID(),
			name: characterName,
			description: characterDescription,
			photoStorageKey: photoData?.storageKey,
			photoStorageBucket: photoData?.storageBucket,
			previewUrl: photoData?.previewUrl,
		};

		setCharacters((previous) => [...previous, newCharacter]);
		resetAddCharacterForm();
		setShowCharacterForm(false);
	};

	const handleAddAnotherCharacter = () => {
		resetAddCharacterForm();
		setShowCharacterForm(true);
	};

	const handleCreateStory = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!canSubmit) return;

		const storyPayload = {
			id: crypto.randomUUID(),
			title,
			description,
			characters: characters.map((character) => ({
				id: character.id,
				name: character.name,
				description: character.description,
				photo:
					character.photoStorageKey && character.photoStorageBucket
						? {
								storageKey: character.photoStorageKey,
								storageBucket: character.photoStorageBucket,
							}
						: undefined,
			})),
		};

		createStoryMutation.mutate(storyPayload);
	};

	const handleImagesGenerationStarted = () => {
		setIsGeneratingImages(true);
	};

	useEffect(() => {
		if (
			isGeneratingImages &&
			statusData &&
			(statusData.status === "completed" || statusData.status === "failed")
		) {
			setIsGeneratingImages(false);

			if (statusData.status === "completed" && storyId) {
				router.push(`/stories/${storyId}`);
			}
		}
	}, [isGeneratingImages, statusData, storyId, router]);

	const isCreating =
		createStoryMutation.isPending || generateScenarioMutation.isPending;
	const isScenarioGenerating = generateScenarioMutation.isPending;
	const creationError =
		createStoryMutation.error || generateScenarioMutation.error;

	return (
		<div className="container mx-auto py-10 max-w-2xl px-8 md:px-0">
			<div className="mb-8 flex justify-between items-center">
				<div>
					<h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2">
						Créer une histoire
					</h1>
					<p className="text-muted-foreground">
						Remplissez le formulaire ci-dessous pour créer une nouvelle histoire
					</p>
				</div>
			</div>

			{!storyId && (
				<div className="space-y-6">
					{/* Étape 1 : Personnages */}
					{showCharacterForm && (
						<Card>
							<CardHeader>
								<CardTitle>
									{characters.length === 0
										? "Ajouter un personnage"
										: "Ajouter un autre personnage"}
								</CardTitle>
								<CardDescription>
									Créez les personnages de votre histoire ({characters.length}/
									{MAX_CHARACTERS})
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleAddCharacter} className="space-y-6">
									<div className="space-y-2">
										<Label htmlFor="character-name">Nom du personnage *</Label>
										<Input
											id="character-name"
											type="text"
											placeholder="Ex: Alice"
											value={characterName}
											onChange={(e) => setCharacterName(e.target.value)}
											required
											minLength={3}
										/>
										<p className="text-xs text-muted-foreground">
											Minimum 3 caractères
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor="character-description">
											Description du personnage *
										</Label>
										<Textarea
											id="character-description"
											placeholder="Décrivez le personnage..."
											value={characterDescription}
											onChange={(e) => setCharacterDescription(e.target.value)}
											required
											minLength={10}
											rows={4}
										/>
										<p className="text-xs text-muted-foreground">
											Minimum 10 caractères
										</p>
									</div>

									<CharacterPhotoUpload
										onPhotoUploaded={setPhotoData}
										onPhotoRemoved={() => setPhotoData(null)}
									/>

									<Button type="submit" className="w-full">
										Ajouter le personnage
									</Button>
								</form>
							</CardContent>
						</Card>
					)}

					{/* Liste des personnages ajoutés */}
					{characters.length > 0 && !showCharacterForm && (
						<Card>
							<CardHeader>
								<CardTitle>
									Personnages ({characters.length}/{MAX_CHARACTERS})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{characters.map((character) => (
										<div key={character.id} className="p-4 border rounded-md">
											<div className="flex gap-4">
												{character.previewUrl && (
													<div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
														<Image
															src={character.previewUrl}
															alt={character.name}
															className="w-full h-full object-cover"
															width={80}
															height={80}
														/>
													</div>
												)}
												<div className="flex-1">
													<h3 className="font-semibold text-lg">
														{character.name}
													</h3>
													<p className="text-sm text-muted-foreground mt-1">
														{character.description}
													</p>
													{character.previewUrl && (
														<p className="text-xs text-green-600 mt-2">
															✓ Photo de référence ajoutée
														</p>
													)}
												</div>
											</div>
										</div>
									))}
								</div>

								{canAddMoreCharacters && (
									<Button
										type="button"
										variant="outline"
										className="w-full mt-4"
										onClick={handleAddAnotherCharacter}
									>
										Ajouter un autre personnage
									</Button>
								)}
							</CardContent>
						</Card>
					)}

					{/* Étape 2 & 3 : Description + Titre (visible dès qu'un personnage est ajouté) */}
					{hasEnoughCharacters && !showCharacterForm && (
						<form onSubmit={handleCreateStory} className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Votre histoire</CardTitle>
									<CardDescription>
										Décrivez votre histoire, puis donnez-lui un titre
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<StoryDescriptionField
										value={description}
										onChange={setDescription}
										characterNames={characterNames}
										disabled={isCreating}
									/>

									<div className="space-y-2">
										<Label htmlFor="title">Titre de l'histoire *</Label>
										<Input
											id="title"
											type="text"
											placeholder="Ex: L'Aventure Magique"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											required
											minLength={3}
											disabled={isCreating}
										/>
										<p className="text-xs text-muted-foreground">
											Minimum 3 caractères
										</p>
									</div>

									{creationError && (
										<div className="p-4 rounded-md bg-red-50 border border-red-200">
											<p className="text-sm font-medium text-red-800">
												✗ {creationError.message}
											</p>
										</div>
									)}

									<Button
										type="submit"
										className="w-full"
										disabled={!canSubmit || isCreating}
									>
										{isCreating ? "Création en cours..." : "Créer l'histoire"}
									</Button>
								</CardContent>
							</Card>
						</form>
					)}
				</div>
			)}

			{/* Génération du scénario en cours */}
			{isScenarioGenerating && (
				<Card>
					<CardHeader>
						<CardTitle>Génération du scénario en cours...</CardTitle>
						<CardDescription>
							Veuillez patienter pendant que nous créons les scènes de votre
							histoire
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ComicWordsLoader />
					</CardContent>
				</Card>
			)}

			{/* Scénario généré — édition */}
			{storyData &&
				storyData.scenes.length === 4 &&
				!storyData.scenes[0].image_url &&
				!isScenarioGenerating &&
				!isGeneratingImages && (
					<div className="space-y-6">
						<div className="p-4 rounded-md bg-green-50 border border-green-200">
							<p className="text-sm font-medium text-green-800">
								✓ Scénario généré avec succès !
							</p>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Édition du scénario</CardTitle>
								<CardDescription>
									Vous pouvez modifier les descriptions des scènes avant de
									générer les images
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ScenarioViewer
									storyId={storyId}
									scenes={storyData.scenes}
									onImagesGenerationStarted={handleImagesGenerationStarted}
								/>
							</CardContent>
						</Card>
					</div>
				)}

			{/* Génération des images en cours */}
			{isGeneratingImages && (
				<Card>
					<CardHeader>
						<CardTitle>Génération des images en cours...</CardTitle>
						<CardDescription>
							Veuillez patienter pendant que nous créons les illustrations. Vous
							serez automatiquement redirigé une fois la génération terminée.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<DreamCloudLoader />
					</CardContent>
				</Card>
			)}

			<div className="my-8 mb-0 flex justify-center">
				<Link href="/stories">
					<Button variant="outline">📚 Mes histoires</Button>
				</Link>
			</div>
		</div>
	);
}

interface CharacterDraft {
	id: string;
	name: string;
	description: string;
	photoStorageKey?: string;
	photoStorageBucket?: string;
	previewUrl?: string;
}
