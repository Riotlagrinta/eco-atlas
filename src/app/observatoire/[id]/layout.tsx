import { Metadata } from 'next';
import { db } from '@/lib/db';
import { species } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    try {
        const speciesData = await db.query.species.findFirst({
            where: eq(species.id, id)
        });

        if (!speciesData) {
            return {
                title: 'Espèce introuvable | Eco-Atlas',
                description: 'L\'espèce demandée n\'existe pas.',
            };
        }

        const title = `${speciesData.name} (${speciesData.scientificName || 'Espèce'}) | Eco-Atlas`;
        const description = speciesData.description
            ? speciesData.description.substring(0, 160) + '...'
            : `Découvrez tout sur ${speciesData.name} et aidez-nous à préserver la biodiversité au Togo.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                locale: 'fr_FR',
                siteName: 'Eco-Atlas',
                images: [
                    {
                        url: speciesData.imageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                        width: 1200,
                        height: 630,
                        alt: speciesData.name,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [speciesData.imageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            },
        };
    } catch (error) {
        console.error('Erreur génération metadata:', error);
        return {
            title: 'Espèce | Eco-Atlas',
        };
    }
}

export default function SpeciesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
