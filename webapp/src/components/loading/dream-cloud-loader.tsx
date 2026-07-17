"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/components/shadcn-ui/utils";
import "./loading-animations.css";

interface OrbitingObjectConfig {
	src: string;
	alt: string;
	radiusRatio: number;
	objectSize: number;
	durationSeconds: number;
	startAngleDegrees: number;
	twinkleDurationSeconds: number;
	twinkleDelaySeconds: number;
	reverse?: boolean;
}

const ORBITING_OBJECTS: OrbitingObjectConfig[] = [
	{
		src: "/loading-images-animations/book.png",
		alt: "Livre",
		radiusRatio: 0.34,
		objectSize: 44,
		durationSeconds: 11,
		startAngleDegrees: 20,
		twinkleDurationSeconds: 8,
		twinkleDelaySeconds: -1,
	},
	{
		src: "/loading-images-animations/magic-wand.png",
		alt: "Baguette magique",
		radiusRatio: 0.38,
		objectSize: 46,
		durationSeconds: 16,
		startAngleDegrees: 145,
		twinkleDurationSeconds: 9,
		twinkleDelaySeconds: -4,
		reverse: true,
	},
	{
		src: "/loading-images-animations/rocket.png",
		alt: "Fusée",
		radiusRatio: 0.31,
		objectSize: 42,
		durationSeconds: 13,
		startAngleDegrees: 250,
		twinkleDurationSeconds: 7,
		twinkleDelaySeconds: -2,
	},
	{
		src: "/loading-images-animations/fee.png",
		alt: "Fée",
		radiusRatio: 0.4,
		objectSize: 44,
		durationSeconds: 18,
		startAngleDegrees: 305,
		twinkleDurationSeconds: 10,
		twinkleDelaySeconds: -6,
		reverse: true,
	},
	{
		src: "/loading-images-animations/fox.png",
		alt: "Renard",
		radiusRatio: 0.29,
		objectSize: 40,
		durationSeconds: 9,
		startAngleDegrees: 80,
		twinkleDurationSeconds: 6,
		twinkleDelaySeconds: -3,
	},
	{
		src: "/loading-images-animations/lion.png",
		alt: "Lion",
		radiusRatio: 0.37,
		objectSize: 46,
		durationSeconds: 15,
		startAngleDegrees: 200,
		twinkleDurationSeconds: 9,
		twinkleDelaySeconds: -7,
	},
	{
		src: "/loading-images-animations/bunny.png",
		alt: "Lapin",
		radiusRatio: 0.33,
		objectSize: 40,
		durationSeconds: 12,
		startAngleDegrees: 340,
		twinkleDurationSeconds: 7,
		twinkleDelaySeconds: -5,
		reverse: true,
	},
	{
		src: "/loading-images-animations/dinosaure.png",
		alt: "Dinosaure",
		radiusRatio: 0.39,
		objectSize: 46,
		durationSeconds: 17,
		startAngleDegrees: 115,
		twinkleDurationSeconds: 10,
		twinkleDelaySeconds: -2,
	},
	{
		src: "/loading-images-animations/superhero.png",
		alt: "Super-héros",
		radiusRatio: 0.3,
		objectSize: 42,
		durationSeconds: 14,
		startAngleDegrees: 45,
		twinkleDurationSeconds: 8,
		twinkleDelaySeconds: -6,
		reverse: true,
	},
	{
		src: "/loading-images-animations/soldier.png",
		alt: "Soldat",
		radiusRatio: 0.36,
		objectSize: 42,
		durationSeconds: 10,
		startAngleDegrees: 280,
		twinkleDurationSeconds: 9,
		twinkleDelaySeconds: -8,
	},
];

const DEFAULT_MESSAGES = [
	"On invente ton personnage…",
	"On saupoudre un peu de magie…",
	"On dessine les décors…",
	"On tourne les pages du rêve…",
];

const MESSAGE_ROTATION_INTERVAL = 2500;

interface DreamCloudLoaderProps {
	messages?: string[];
	size?: number;
	className?: string;
}

export function DreamCloudLoader({
	messages = DEFAULT_MESSAGES,
	size = 320,
	className,
}: Readonly<DreamCloudLoaderProps>) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-6",
				className
			)}
		>
			<div className="relative" style={{ width: size, height: size }}>
				<DreamHalo />
				<DreamCloud size={size} />
				{ORBITING_OBJECTS.map((object) => (
					<OrbitingObject key={object.src} sceneSize={size} config={object} />
				))}
			</div>
			<RotatingMessage messages={messages} />
		</div>
	);
}

function DreamHalo() {
	return (
		<div
			className="dream-halo-spin absolute inset-0"
			style={{
				background:
					"radial-gradient(closest-side, hsl(var(--secondary)) 0%, transparent 70%)",
				maskImage:
					"repeating-conic-gradient(from 0deg, black 0deg 12deg, transparent 12deg 30deg)",
				WebkitMaskImage:
					"repeating-conic-gradient(from 0deg, black 0deg 12deg, transparent 12deg 30deg)",
				opacity: 0.5,
				borderRadius: "9999px",
			}}
			aria-hidden
		/>
	);
}

function DreamCloud({ size }: Readonly<{ size: number }>) {
	const cloudSize = size * 0.55;
	return (
		<div className="dream-cloud-float absolute inset-0 flex items-center justify-center">
			<div className="dream-cloud-pulse flex items-center justify-center">
				<Image
					src="/loading-images-animations/cloud.png"
					alt="Nuage de rêve"
					width={cloudSize}
					height={cloudSize}
				/>
			</div>
		</div>
	);
}

function OrbitingObject({
	sceneSize,
	config,
}: Readonly<{
	sceneSize: number;
	config: OrbitingObjectConfig;
}>) {
	const orbitRadius = sceneSize * config.radiusRatio;
	const orbitTiming = {
		"--orbit-duration": `${config.durationSeconds}s`,
		"--orbit-start": `${config.startAngleDegrees}deg`,
	} as React.CSSProperties;
	return (
		<div
			className={cn(
				"dream-orbit absolute left-1/2 top-1/2 h-0 w-0",
				config.reverse && "dream-orbit-reverse"
			)}
			style={orbitTiming}
			aria-hidden
		>
			<div
				className="absolute left-0 top-0"
				style={{
					width: config.objectSize,
					height: config.objectSize,
					transform: `translate(-50%, -50%) translateY(-${orbitRadius}px)`,
				}}
			>
				<div className="dream-orbit-counter h-full w-full" style={orbitTiming}>
					<Image
						className="dream-orbit-object h-full w-full"
						src={config.src}
						alt={config.alt}
						width={config.objectSize}
						height={config.objectSize}
						style={
							{
								"--twinkle-duration": `${config.twinkleDurationSeconds}s`,
								"--twinkle-delay": `${config.twinkleDelaySeconds}s`,
							} as React.CSSProperties
						}
					/>
				</div>
			</div>
		</div>
	);
}

function RotatingMessage({ messages }: Readonly<{ messages: string[] }>) {
	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		if (messages.length <= 1) {
			return;
		}
		const intervalId = setInterval(() => {
			setMessageIndex((current) => (current + 1) % messages.length);
		}, MESSAGE_ROTATION_INTERVAL);
		return () => clearInterval(intervalId);
	}, [messages.length]);

	return (
		<p
			key={messageIndex}
			className="dream-message text-center text-lg italic font-playful text-primary"
		>
			{messages[messageIndex]}
		</p>
	);
}
