import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

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
        const { data: parc } = await supabase
            .from('protected_areas')
            .select('name, description, image_url, surface_area, type')
            .eq('id', id)
            .single();

        if (!parc) {
            return {
                title: 'Parc introuvable | Eco-Atlas',
                description: 'La zone protégée demandée n\'existe pas.',
            };
        }

        const title = `${parc.name} (${parc.type}) | Eco-Atlas Togo`;
        const description = parc.description
            ? parc.description.substring(0, 160) + '...'
            : `Explorez la riche faune et flore sauvage de ${parc.name}, couvrant plus de ${parc.surface_area || 'milliers de'} km².`;

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
                        url: parc.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                        width: 1200,
                        height: 630,
                        alt: parc.name,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [parc.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'],
            },
        };
    } catch (error) {
        console.error('Erreur génération metadata parc:', error);
        return {
            title: 'Parc National | Eco-Atlas',
        };
    }
}

export default function ParcLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
