import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { observations, apiKeys, apiLogs, species } from '@/lib/db/schema';
import { eq, and, ilike, gte, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 401 });
  }

  // Vérifier la validité de la clé API
  const keyData = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.key, apiKey), eq(apiKeys.isActive, true)),
  });

  if (!keyData) {
    return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 403 });
  }

  // Log de la requête (optionnel mais recommandé)
  await db.insert(apiLogs).values({
    apiKeyId: keyData.id,
    endpoint: '/api/v1/observations',
    method: 'GET',
    responseCode: 200,
  });

  const { searchParams } = new URL(req.url);
  const speciesName = searchParams.get('species');
  const dateFrom = searchParams.get('date_from');

  // Construction de la requête avec Drizzle
  const results = await db.query.observations.findMany({
    where: (obs, { and, eq, gte, ilike }) => {
      const conditions = [eq(obs.isVerified, true)];
      if (dateFrom) conditions.push(gte(obs.createdAt, new Date(dateFrom)));
      return and(...conditions);
    },
    with: {
      species: true,
      user: {
        columns: {
          name: true,
          image: true,
        }
      }
    },
    orderBy: [desc(observations.createdAt)],
    limit: 100,
  });

  // Filtrage manuel pour l'espèce (si jointe) ou via query builder plus complexe
  let filteredResults = results;
  if (speciesName) {
    filteredResults = results.filter(r => 
      r.species?.name.toLowerCase().includes(speciesName.toLowerCase()) || 
      r.species?.scientificName?.toLowerCase().includes(speciesName.toLowerCase())
    );
  }

  // Transformer les données pour le format GeoJSON attendu
  const formattedData = filteredResults.map(obs => ({
    id: obs.id,
    description: obs.description,
    image_url: obs.imageUrl,
    is_verified: obs.isVerified,
    created_at: obs.createdAt,
    species: obs.species ? {
      name: obs.species.name,
      scientific_name: obs.species.scientificName
    } : null,
    geometry: (obs.latitude && obs.longitude) ? {
      type: 'Point',
      coordinates: [obs.longitude, obs.latitude]
    } : null
  }));

  return NextResponse.json({
    success: true,
    count: formattedData.length,
    data: formattedData
  });
}
