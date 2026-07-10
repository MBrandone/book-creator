import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/shadcn-ui/button";

export function Header() {
	return (
		<header className="py-6">
			<div className="container mx-auto flex items-center justify-between px-4">
				<Link href="/" className="flex items-center font-semibold text-xl">
					<Image
						src="/logo.png"
						alt="Book Creator Logo"
						className="h-16 w-16"
						width={1000}
						height={1000}
					/>
					<span>Book Creator</span>
				</Link>

				<nav className="hidden md:flex items-center gap-8">
					<Link
						href="/#comment-ca-marche"
						className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Comment ça marche
					</Link>
					<Link
						href="/#occasions"
						className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Occasions
					</Link>
					<Link
						href="/stories"
						className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Exemples
					</Link>
				</nav>

				<Link href="/create-story">
					<Button className="cursor-pointer">Créer une histoire</Button>
				</Link>
			</div>
		</header>
	);
}
