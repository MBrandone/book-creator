"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { updateScene } from "@/app/_app-http-requests/update-scene";
import { Button } from "@/components/shadcn-ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/shadcn-ui/card";
import { Textarea } from "@/components/shadcn-ui/textarea";

type SceneCardProps = {
	storyId: string;
	scene: {
		id: string;
		scene_number: number;
		scene_type: string;
		description: string;
	};
	isEditing: boolean;
	onEditClick: () => void;
	onCancelClick: () => void;
	onSceneUpdated: () => void;
};

export function SceneCard({
	storyId,
	scene,
	isEditing,
	onEditClick,
	onCancelClick,
	onSceneUpdated,
}: SceneCardProps) {
	const [localDescription, setLocalDescription] = useState(scene.description);
	const [error, setError] = useState<string | null>(null);

	const updateSceneMutation = useMutation({
		mutationFn: (description: string) =>
			updateScene(storyId, scene.id, description),
		onSuccess: () => {
			onSceneUpdated();
			onCancelClick();
		},
		onError: (err: Error) => {
			setError(err.message);
		},
	});

	const validateDescription = (text: string): string | null => {
		const trimmed = text.trim();
		if (trimmed.length < 10) {
			return "La description doit contenir au moins 10 caractères";
		}
		if (text.length > 500) {
			return "La description ne peut pas dépasser 500 caractères";
		}
		return null;
	};

	const handleSave = async () => {
		setError(null);
		const validationError = validateDescription(localDescription);
		if (validationError) {
			setError(validationError);
			return;
		}
		updateSceneMutation.mutate(localDescription);
	};

	const handleCancel = () => {
		setLocalDescription(scene.description);
		setError(null);
		onCancelClick();
	};

	if (!isEditing) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Scène {scene.scene_number}</CardTitle>
					<CardDescription>{scene.scene_type}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm">{scene.description}</p>
					<Button onClick={onEditClick} variant="secondary">
						Éditer
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Scène {scene.scene_number}</CardTitle>
				<CardDescription>{scene.scene_type}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{error && (
					<div className="p-3 rounded-md bg-red-50 border border-red-200">
						<p className="text-sm font-medium text-red-800">✗ {error}</p>
					</div>
				)}
				{updateSceneMutation.isError && (
					<div className="p-3 rounded-md bg-red-50 border border-red-200">
						<p className="text-sm font-medium text-red-800">
							✗ {updateSceneMutation.error.message}
						</p>
					</div>
				)}
				<div className="space-y-2">
					<Textarea
						value={localDescription}
						onChange={(e) => setLocalDescription(e.target.value)}
						minLength={10}
						maxLength={500}
						required
						className="min-h-[150px]"
						disabled={updateSceneMutation.isPending}
					/>
					<p className="text-xs text-muted-foreground">
						{localDescription.length} / 500 caractères
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={handleSave} disabled={updateSceneMutation.isPending}>
						{updateSceneMutation.isPending
							? "Enregistrement..."
							: "Enregistrer"}
					</Button>
					<Button
						onClick={handleCancel}
						variant="outline"
						disabled={updateSceneMutation.isPending}
					>
						Annuler
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
