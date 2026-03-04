import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// Utilisation du client Supabase "pur" pour le SSR sans auth context complexe
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    try {
        const { data: species } = await supabase
            .from('species')
            .select('name, scientific_name, description, image_url')
            .eq('id', id)
            .single();

        if (!species) {
            return {
                title: 'Espèce introuvable | Eco-Atlas',
                description: 'L\'espèce demandée n\'existe pas.',
            };
        }

        const title = `${species.name} (${species.scientific_name || 'Espèce'}) | Eco-Atlas`;
        const description = species.description
            ? species.description.substring(0, 160) + '...'
            : `Découvrez tout sur ${species.name} et aidez-nous à préserver la biodiversité au Togo.`;

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
                        url: species.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                        width: 1200,
                        height: 630,
                        alt: species.name,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [species.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
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
