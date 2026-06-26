import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/shadcn-ui";
import Image from "next/image";

interface OccasionCardProps {
    title: string
    description: string
    icon: string
    iconAlt: string
}

export function OccasionCard({title, description, icon, iconAlt}: Readonly<OccasionCardProps>) {
    return (
        <Card className="text-center hover:shadow-lg transition-shadow border-none bg-secondary">
            <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Image
                        src={icon}
                        alt={iconAlt}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                    />
                </div>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardContent>
        </Card>
    )
}