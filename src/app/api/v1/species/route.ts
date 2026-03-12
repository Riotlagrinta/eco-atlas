import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { species, apiKeys, apiLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 401 });
  }

  // Vérifier la validité de la clé API
  const keyData = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.key, apiKey),
      eq(apiKeys.isActive, true)
    )
  });

  if (!keyData) {
    return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 403 });
  }

  // Log de la requête
  await db.insert(apiLogs).values({
    apiKeyId: keyData.id,
    endpoint: '/api/v1/species',
    method: 'GET',
    responseCode: 200
  });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') as 'Fauna' | 'Flora' | null;
  const status = searchParams.get('status');

  const speciesData = await db.query.species.findMany({
    where: (species, { and, eq }) => {
      const filters = [];
      if (category) filters.push(eq(species.category, category));
      if (status) filters.push(eq(species.conservationStatus, status));
      return filters.length > 0 ? and(...filters) : undefined;
    },
    orderBy: (species, { asc }) => [asc(species.name)]
  });

  return NextResponse.json({
    success: true,
    count: speciesData.length,
    data: speciesData
  });
}
