"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { generateImages } from "@/app/_app-http-requests/generate-images";
import { Button } from "@/components/shadcn-ui/button";
import { SceneCard } from "./scene-card";

type ScenarioViewerProps = {
	storyId: string;
	scenes: Array<{
		id: string;
		scene_number: number;
		scene_type: string;
		description: string;
	}>;
	onImagesGenerationStarted: () => void;
};

export function ScenarioViewer({
	storyId,
	scenes,
	onImagesGenerationStarted,
}: ScenarioViewerProps) {
	const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

	const generateImagesMutation = useMutation({
		mutationFn: () => generateImages(storyId),
		onSuccess: () => {
			onImagesGenerationStarted();
		},
	});

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				{scenes
					.sort((a, b) => a.scene_number - b.scene_number)
					.map((scene) => (
						<SceneCard
							key={scene.id}
							storyId={storyId}
							scene={scene}
							isEditing={editingSceneId === scene.id}
							onEditClick={() => setEditingSceneId(scene.id)}
							onCancelClick={() => setEditingSceneId(null)}
						/>
					))}
			</div>

			{generateImagesMutation.isError && (
				<div className="p-4 rounded-md bg-red-50 border border-red-200">
					<p className="text-sm font-medium text-red-800">
						✗ {generateImagesMutation.error.message}
					</p>
				</div>
			)}

			<Button
				onClick={() => generateImagesMutation.mutate()}
				className="w-full"
				disabled={generateImagesMutation.isPending || editingSceneId !== null}
			>
				{generateImagesMutation.isPending
					? "Lancement..."
					: "Générer les images"}
			</Button>
		</div>
	);
}
