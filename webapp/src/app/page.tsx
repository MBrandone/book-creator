import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="container mx-auto px-4 py-20 lg:py-24">
          <div className="flex items-center justify-between gap-8">
            {/* Left Column - Content */}
            <div className="space-y-8 lg:flex-shrink-0 lg:max-w-xl">
              <Badge className="gap-2 text-sm py-1.5 px-4 bg-[#F3F0FF] text-[#635BFF] hover:bg-[#F3F0FF] font-medium">
                ✨ Des histoires uniques, créées par l'IA
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight font-[family-name:var(--font-jakarta)]">
                Transformez
                <br />
                vos proches en
                <br />
                héros d'une histoire{" "}
                <span className="text-[#635BFF]">inoubliable.</span>
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
                  <Button variant="ghost" size="lg" className="gap-2">
                    Voir des exemples
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Column - Illustration */}
            <div className="hidden lg:flex relative flex-shrink-0 -mr-4">
              <img 
                src="/livre.png"
                alt="Livre ouvert illustré" 
                className="h-[600px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="comment-ca-marche" className="py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 font-[family-name:var(--font-jakarta)]">Comment ça marche ?</h2>
            <p className="text-lg text-muted-foreground font-[family-name:var(--font-inter)]">
              3 étapes simples pour créer une histoire unique
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative pt-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                <Badge className="w-12 h-12 rounded-full flex items-center justify-center text-lg bg-[#635BFF] text-white hover:bg-[#635BFF]">
                  1
                </Badge>
              </div>

              <Card className="h-full bg-white border border-gray-300 pt-10 pb-8 px-6">
                <CardContent className="flex flex-col items-center text-center p-0">
                  <div className="mb-8 flex items-center justify-center">
                    <img
                      src="/editer.png"
                      alt="Icône éditer"
                      className="w-24 h-24 object-contain"
                    />
                  </div>

                  <h3 className="text-xl font-semibold mb-3 font-[family-name:var(--font-jakarta)]">Décrivez votre histoire</h3>
                  <p className="text-muted-foreground font-[family-name:var(--font-inter)] max-w-[200px]">
                    Parlez-nous de vos personnages et de l'aventure que vous souhaitez raconter.
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* Step 2 */}
            <div className="relative pt-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                <Badge className="w-12 h-12 rounded-full flex items-center justify-center text-lg bg-[#635BFF] text-white hover:bg-[#635BFF]">
                  2
                </Badge>
              </div>

              <Card className="h-full bg-white border border-gray-300 pt-10 pb-8 px-6">
                <CardContent className="flex flex-col items-center text-center p-0">
                  <div className="mb-8 flex items-center justify-center">
                    <img
                      src="/baguette_magique.png"
                      alt="Icône baguette magique"
                      className="w-24 h-24 object-contain"
                    />
                  </div>

                  <h3 className="text-xl font-semibold mb-3 font-[family-name:var(--font-jakarta)]">Notre IA crée la magie</h3>
                  <p className="text-muted-foreground font-[family-name:var(--font-inter)] max-w-[200px]">
                    Nous écrivons votre histoire en 4 scènes et générons des illustrations uniques.
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* Step 3 */}
            <div className="relative pt-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                <Badge className="w-12 h-12 rounded-full flex items-center justify-center text-lg bg-[#635BFF] text-white hover:bg-[#635BFF]">
                  3
                </Badge>
              </div>

              <Card className="h-full bg-white border border-gray-300 pt-10 pb-8 px-6">
                <CardContent className="flex flex-col items-center text-center p-0">
                  <div className="mb-8 flex items-center justify-center">
                    <img 
                      src="/livre2.png"
                      alt="Icône livre" 
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 font-[family-name:var(--font-jakarta)]">Recevez votre livre</h3>
                  <p className="text-muted-foreground font-[family-name:var(--font-inter)] max-w-[200px]">
                    Téléchargez votre livre et partagez ce moment magique avec vos proches.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Occasions Section */}
      <section id="occasions" className="py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 font-[family-name:var(--font-jakarta)]">Parfait pour toutes les occasions</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Anniversaires */}
            <Card className="text-center hover:shadow-lg transition-shadow border-none bg-[#FAFAFC]">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/gateau_anniversaire.png"
                    alt="Gâteau d'anniversaire" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardTitle className="font-[family-name:var(--font-jakarta)]">Anniversaires</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="font-[family-name:var(--font-inter)]">
                  Un cadeau unique qui reste gravé.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Couples */}
            <Card className="text-center hover:shadow-lg transition-shadow border-none bg-[#FAFAFC]">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/coeur.png"
                    alt="Coeur" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardTitle className="font-[family-name:var(--font-jakarta)]">Couples</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="font-[family-name:var(--font-inter)]">
                  Racontez votre histoire d'amour autrement.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Famille */}
            <Card className="text-center hover:shadow-lg transition-shadow border-none bg-[#FAFAFC]">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/cadeau.png"
                    alt="Cadeau" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardTitle className="font-[family-name:var(--font-jakarta)]">Famille</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="font-[family-name:var(--font-inter)]">
                  Créez des souvenirs à transmettre.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Autres occasions */}
            <Card className="text-center hover:shadow-lg transition-shadow border-none bg-[#FAFAFC]">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/etoile.png"
                    alt="Étoile" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardTitle className="font-[family-name:var(--font-jakarta)]">Autres occasions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="font-[family-name:var(--font-inter)]">
                  Noël, fêtes, naissance ou juste pour faire plaisir.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-[#EDE9FE]">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-[family-name:var(--font-jakarta)]">
            Prêt à créer une histoire qui restera à jamais ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-[family-name:var(--font-inter)]">
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
