"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/shadcn-ui/utils";
import "./loading-animations.css";

const COMIC_VIOLET = "hsl(var(--primary))";
const COMIC_VIOLET_DARK = "hsl(var(--primary-dark))";
const COMIC_ROSE = "hsl(330 85% 62%)";

const COMIC_COLORS = [COMIC_VIOLET, COMIC_VIOLET_DARK, COMIC_ROSE];

const COMIC_ONOMATOPOEIA = [
	"Caboum",
	"Wizzzzz",
	"Whoooosh",
	"Fiuuu",
	"Boum",
	"Bam",
	"Patatrak",
	"Boing",
];

const COMIC_APPEAR_DURATION_MS = 300;
const COMIC_HOLD_DURATION_MS = 200;
const COMIC_DISAPPEAR_DURATION_MS = 1000;
const MIN_SPAWN_DELAY_MS = 200;
const MAX_SPAWN_DELAY_MS = 2000;
const MIN_FONT_SIZE_PX = 36;
const MAX_FONT_SIZE_PX = 54;
const MIN_TILT_DEGREES = -18;
const MAX_TILT_DEGREES = 18;
const MAX_PLACEMENT_ATTEMPTS = 25;
const COLLISION_GAP_PX = 12;

const COMIC_DISAPPEAR_DELAY_MS =
	COMIC_APPEAR_DURATION_MS + COMIC_HOLD_DURATION_MS;
const COMIC_WORD_LIFETIME_MS =
	COMIC_DISAPPEAR_DELAY_MS + COMIC_DISAPPEAR_DURATION_MS;

interface ComicWordInstance {
	id: number;
	text: string;
	color: string;
	leftRatio: number;
	topRatio: number;
	tiltDegrees: number;
	fontSize: number;
}

interface BoundingBox {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

function pickRandom<ItemType>(items: ItemType[]): ItemType {
	return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

function estimateWordSizePx(word: { text: string; fontSize: number }): {
	width: number;
	height: number;
} {
	const burstPadding = word.fontSize * 0.9;
	const glyphWidth = word.text.length * word.fontSize * 0.62;
	return {
		width: glyphWidth + burstPadding * 1.2 * 2,
		height: word.fontSize + burstPadding * 2,
	};
}

function boundingBoxOf(
	word: ComicWordInstance,
	containerWidth: number,
	containerHeight: number
): BoundingBox {
	const size = estimateWordSizePx(word);
	const left = word.leftRatio * containerWidth;
	const top = word.topRatio * containerHeight;
	return {
		left,
		top,
		right: left + size.width,
		bottom: top + size.height,
	};
}

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
	return !(
		a.right + COLLISION_GAP_PX < b.left ||
		a.left - COLLISION_GAP_PX > b.right ||
		a.bottom + COLLISION_GAP_PX < b.top ||
		a.top - COLLISION_GAP_PX > b.bottom
	);
}

function placeComicWord(
	id: number,
	presentWords: ComicWordInstance[],
	containerWidth: number,
	containerHeight: number
): ComicWordInstance | null {
	const text = pickRandom(COMIC_ONOMATOPOEIA);
	const fontSize = randomBetween(MIN_FONT_SIZE_PX, MAX_FONT_SIZE_PX);
	const size = estimateWordSizePx({ text, fontSize });
	const maxLeftRatio = Math.max(0, 1 - size.width / containerWidth);
	const maxTopRatio = Math.max(0, 1 - size.height / containerHeight);
	const presentBoxes = presentWords.map((word) =>
		boundingBoxOf(word, containerWidth, containerHeight)
	);

	for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
		const candidate: ComicWordInstance = {
			id,
			text,
			color: pickRandom(COMIC_COLORS),
			leftRatio: randomBetween(0, maxLeftRatio),
			topRatio: randomBetween(0, maxTopRatio),
			tiltDegrees: randomBetween(MIN_TILT_DEGREES, MAX_TILT_DEGREES),
			fontSize,
		};
		const candidateBox = boundingBoxOf(
			candidate,
			containerWidth,
			containerHeight
		);
		const collides = presentBoxes.some((box) =>
			boxesOverlap(candidateBox, box)
		);
		if (!collides) {
			return candidate;
		}
	}
	return null;
}

interface ComicWordsLoaderProps {
	height?: number;
	className?: string;
}

export function ComicWordsLoader({
	height = 320,
	className,
}: Readonly<ComicWordsLoaderProps>) {
	const [words, setWords] = useState<ComicWordInstance[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const wordsRef = useRef<ComicWordInstance[]>([]);
	const nextWordIdRef = useRef(0);

	useEffect(() => {
		wordsRef.current = words;
	}, [words]);

	useEffect(() => {
		let spawnTimeoutId: ReturnType<typeof setTimeout>;

		const spawnWord = () => {
			const container = containerRef.current;
			if (container) {
				const wordId = nextWordIdRef.current++;
				const placedWord = placeComicWord(
					wordId,
					wordsRef.current,
					container.clientWidth,
					container.clientHeight
				);
				if (placedWord) {
					wordsRef.current = [...wordsRef.current, placedWord];
					setWords((current) => [...current, placedWord]);
					setTimeout(() => {
						wordsRef.current = wordsRef.current.filter(
							(word) => word.id !== wordId
						);
						setWords((current) => current.filter((word) => word.id !== wordId));
					}, COMIC_WORD_LIFETIME_MS);
				}
			}
			spawnTimeoutId = setTimeout(
				spawnWord,
				randomBetween(MIN_SPAWN_DELAY_MS, MAX_SPAWN_DELAY_MS)
			);
		};

		spawnWord();
		return () => clearTimeout(spawnTimeoutId);
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative w-full overflow-hidden rounded-xl bg-white",
				className
			)}
			style={{ height }}
		>
			{words.map((word) => (
				<ComicWord key={word.id} word={word} />
			))}
		</div>
	);
}

function ComicWord({ word }: Readonly<{ word: ComicWordInstance }>) {
	const burstPadding = word.fontSize * 0.9;
	return (
		<div
			className="comic-word absolute flex items-center justify-center select-none"
			style={
				{
					left: `${word.leftRatio * 100}%`,
					top: `${word.topRatio * 100}%`,
					padding: `${burstPadding}px ${burstPadding * 1.2}px`,
					"--comic-tilt": `${word.tiltDegrees}deg`,
					"--comic-appear-duration": `${COMIC_APPEAR_DURATION_MS}ms`,
					"--comic-disappear-duration": `${COMIC_DISAPPEAR_DURATION_MS}ms`,
					"--comic-disappear-delay": `${COMIC_DISAPPEAR_DELAY_MS}ms`,
				} as React.CSSProperties
			}
		>
			<span
				className="comic-burst absolute inset-0"
				style={{
					backgroundColor: `color-mix(in srgb, ${word.color} 22%, white)`,
				}}
				aria-hidden
			/>
			<span
				className="relative font-playful font-bold uppercase tracking-wide"
				style={{
					fontSize: word.fontSize,
					color: word.color,
					textShadow:
						"2px 2px 0 #fff, -2px 2px 0 #fff, 2px -2px 0 #fff, -2px -2px 0 #fff",
				}}
			>
				{word.text}
			</span>
		</div>
	);
}
