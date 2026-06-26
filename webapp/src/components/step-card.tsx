import {Badge, Card, CardContent} from "@/components/shadcn-ui";
import Image from "next/image";

interface StepCardProps {
    step: number
    title: string
    description: string
    icon: string
    iconAlt: string
}

export function StepCard({step, title, description, icon, iconAlt}: Readonly<StepCardProps>) {
    return (
        <div className="relative pt-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                <Badge
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg bg-primary text-white hover:bg-primary-dark">
                    {step}
                </Badge>
            </div>

            <Card className="h-full border border-gray-300 pt-10 pb-8 px-6">
                <CardContent className="flex flex-col items-center text-center p-0">
                    <div className="mb-8 flex items-center justify-center">
                        <Image
                            src={icon}
                            alt={iconAlt}
                            width={96}
                            height={96}
                            className="h-auto w-auto object-contain"
                        />
                    </div>

                    <h3 className="text-xl font-semibold mb-3">{title}</h3>
                    <p className="text-muted-foreground max-w-50">
                        {description}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}