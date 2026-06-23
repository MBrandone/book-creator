import Link from "next/link"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import Image from "next/image"
import type {Metadata} from "next"
import {StepCard} from "@/components/step-card";
import {OccasionCard} from "@/components/occasion-card";

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 lg:py-24">
          <div className="flex items-center justify-between gap-8">

            <div className="space-y-8">
              <Badge className="gap-2 text-sm py-1.5 px-4 bg-secondary text-primary hover:bg-secondary-foreground font-medium">
                ✨ Des histoires uniques, votre création
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl leading-tight">
                Transformez
                <br />
                vos proches en
                <br />
                héros d'une histoire{" "}
                <span className="text-primary">inoubliable.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Créez en quelques minutes un livre illustré personnalisé où vos enfants, votre couple ou vos proches vivent une aventure magique.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <Link href="/create-story">
                  <Button size="lg" className="gap-2">
                    ✨ Créer ma première histoire
                  </Button>
                </Link>
                <Link href="/stories">
                  <Button variant="secondary" size="lg" className="gap-2">
                    Voir des exemples
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex relative -mr-4">
              <Image src="/livre.png" loading="eager" alt="Exemple de livre personnalisé illustré créé avec Book Creator" width={1301} height={762} className="object-contain"/>
            </div>
          </div>
        </div>
      </section>

      <section id="comment-ca-marche" className="py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-lg text-muted-foreground">
              3 étapes simples pour créer une histoire unique
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            <StepCard
              step={1}
              title="Décrivez votre histoire"
              description="Parlez-nous de vos personnages et de l'aventure que vous souhaitez raconter."
              icon="/editer.png"
              iconAlt="Icône éditer"
            />
            
            <StepCard
              step={2}
              title="Notre IA crée la magie"
              description="Nous écrivons votre histoire en 4 scènes et générons des illustrations uniques."
              icon="/baguette_magique.png"
              iconAlt="Icône baguette magique"
            />
            
            <StepCard
              step={3}
              title="Recevez votre livre"
              description="Téléchargez votre livre et partagez ce moment magique avec vos proches."
              icon="/livre2.png"
              iconAlt="Icône livre"
            />
          </div>
        </div>
      </section>

      <section id="occasions" className="py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Parfait pour toutes les occasions</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <OccasionCard
              title="Anniversaires"
              description="Un cadeau unique qui reste gravé."
              icon="/gateau_anniversaire.png"
              iconAlt="Gâteau d'anniversaire"
            />

            <OccasionCard
              title="Couples"
              description="Racontez votre histoire d'amour autrement."
              icon="/coeur.png"
              iconAlt="Coeur"
            />

            <OccasionCard
              title="Famille"
              description="Créez des souvenirs à transmettre."
              icon="/cadeau.png"
              iconAlt="Cadeau"
            />

            <OccasionCard
              title="Autres occasions"
              description="Noël, fêtes, naissance ou juste pour faire plaisir."
              icon="/etoile.png"
              iconAlt="Étoile"
            />
          </div>
        </div>
      </section>

      <section className="relative py-20 lg:py-32 overflow-hidden bg-secondary">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Prêt à créer une histoire qui restera à jamais ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de familles qui créent déjà des souvenirs uniques.
          </p>
          <Link href="/create-story">
            <Button size="lg" className="gap-2 text-base">
              Commencer maintenant ✨
            </Button>
          </Link>
        </div>
      </section>

    </div>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL('https://book-creator-jet.vercel.app/'),
  title: "Créer un Livre Personnalisé avec l'IA | Histoires Uniques",
  description: "Créez en quelques minutes un livre illustré personnalisé où vos enfants, votre couple ou vos proches vivent une aventure magique. Histoires générées par IA.",
  keywords: [
    "livre personnalisé",
    "histoire personnalisée",
    "cadeau personnalisé",
    "livre enfant IA",
    "histoire sur mesure",
    "livre photo personnalisé",
    "cadeau original",
    "livre illustré personnalisé"
  ],
  authors: [{ name: "Book Creator" }],
  openGraph: {
    title: "Créer un Livre Personnalisé avec l'IA | Histoires Uniques",
    description: "Transformez vos proches en héros d'une histoire inoubliable. Créez un livre illustré personnalisé en quelques minutes.",
    type: "website",
    locale: "fr_FR",
    siteName: "Book Creator",
    images: [
      {
        url: "/livre.png",
        width: 1301,
        height: 762,
        alt: "Exemple de livre personnalisé créé par Book Creator"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Créer un Livre Personnalisé avec l'IA",
    description: "Transformez vos proches en héros d'une histoire inoubliable",
    images: ["/livre.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  }
}
