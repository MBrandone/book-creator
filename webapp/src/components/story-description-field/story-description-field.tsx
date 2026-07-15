"use client";

import { useState } from "react";
import { Button } from "@/components/shadcn-ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/shadcn-ui/dialog";
import { Label } from "@/components/shadcn-ui/label";
import { Textarea } from "@/components/shadcn-ui/textarea";
import { buildDescriptionTemplate } from "./story-description-template";

const MAX_DESCRIPTION_LENGTH = 2000;

interface DescriptionFieldProps {
	value: string;
	onChange: (value: string) => void;
	characterNames: string[];
	disabled?: boolean;
}

export function StoryDescriptionField({
	value,
	onChange,
	characterNames,
	disabled,
}: DescriptionFieldProps) {
	const [showOverwriteConfirmation, setShowOverwriteConfirmation] =
		useState(false);

	const hasExistingDescription = value.trim().length > 0;

	const applyTemplate = () => {
		onChange(buildDescriptionTemplate(characterNames));
	};

	const handleHelpButtonClick = () => {
		if (hasExistingDescription) {
			setShowOverwriteConfirmation(true);
		} else {
			applyTemplate();
		}
	};

	const handleConfirmOverwrite = () => {
		setShowOverwriteConfirmation(false);
		applyTemplate();
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label htmlFor="description">Description *</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleHelpButtonClick}
					disabled={disabled}
				>
					Aidez-moi à décrire mon histoire
				</Button>
			</div>
			<Textarea
				id="description"
				placeholder="Décrivez votre histoire..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required
				minLength={10}
				maxLength={MAX_DESCRIPTION_LENGTH}
				rows={8}
				disabled={disabled}
			/>
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>Minimum 10 caractères</span>
				<span
					className={
						value.length > MAX_DESCRIPTION_LENGTH ? "text-red-500" : ""
					}
				>
					{value.length} / {MAX_DESCRIPTION_LENGTH}
				</span>
			</div>

			<Dialog
				open={showOverwriteConfirmation}
				onOpenChange={setShowOverwriteConfirmation}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remplacer la description ?</DialogTitle>
						<DialogDescription>
							Votre description actuelle sera remplacée par le template. Cette
							action est irréversible.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowOverwriteConfirmation(false)}
						>
							Annuler
						</Button>
						<Button type="button" onClick={handleConfirmOverwrite}>
							Remplacer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
