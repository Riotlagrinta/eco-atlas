import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Espèces initiales
  const speciesData = [
    {
      name: 'Éléphant d’Afrique',
      scientificName: 'Loxodonta africana',
      category: 'Fauna',
      conservationStatus: 'VU',
      description: 'Le plus grand mammifère terrestre, menacé par le braconnage.',
    },
    {
      name: 'Baobab Africain',
      scientificName: 'Adansonia digitata',
      category: 'Flora',
      conservationStatus: 'LC',
      description: 'Arbre emblématique de la savane, capable de stocker des milliers de litres d’eau.',
    }
  ] as any[];

  console.log('Inserting species...');
  await db.insert(schema.species).values(speciesData).onConflictDoNothing();

  // 2. Articles
  const articlesData = [
    {
      title: 'Lancement du programme de protection des tortues marines',
      content: 'Le gouvernement togolais annonce de nouvelles mesures pour protéger les sites de nidification sur les plages de Lomé et d’Aného.',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      category: 'Actualités',
    },
    {
      title: 'Recensement de la faune au Parc Fazao-Malfakassa',
      content: 'Une équipe de biologistes commence une mission de trois mois pour dénombrer les populations de primates et d’oiseaux rares.',
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
      category: 'Projets',
    }
  ];

  console.log('Inserting articles...');
  await db.insert(schema.articles).values(articlesData).onConflictDoNothing();

  console.log('✅ Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:');
  console.error(err);
  process.exit(1);
});
