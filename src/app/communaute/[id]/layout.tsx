import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: thread } = await supabase
    .from('forum_threads')
    .select('title, content, category')
    .eq('id', id)
    .single();

  if (!thread) {
    return {
      title: 'Discussion non trouvée | Eco-Atlas Togo',
    };
  }

  const categoryLabels: Record<string, string> = {
    general: 'Général',
    identification: 'Identification',
    alert: 'Alerte',
    parc: 'Parcs',
    species: 'Espèces',
  };

  return {
    title: `${thread.title} | Forum Eco-Atlas Togo`,
    description: thread.content.substring(0, 160),
    openGraph: {
      title: thread.title,
      description: thread.content.substring(0, 160),
      type: 'article',
      section: categoryLabels[thread.category] || 'Communauté',
    },
    twitter: {
      card: 'summary_large_image',
      title: thread.title,
      description: thread.content.substring(0, 160),
    },
  };
}

export default function ThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
