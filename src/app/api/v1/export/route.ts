import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { observations, apiKeys, apiLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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
    endpoint: '/api/v1/export',
    method: 'GET',
    responseCode: 200
  });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';

  const data = await db.query.observations.findMany({
    where: eq(observations.isVerified, true),
    orderBy: [desc(observations.createdAt)],
    with: {
      species: {
        columns: {
          name: true,
          scientificName: true
        }
      }
    }
  });

  if (format === 'json') {
    return NextResponse.json({
      success: true,
      count: data.length,
      data: data
    });
  }

  if (format === 'csv') {
    const headers = ['id', 'description', 'location', 'created_at', 'species_name', 'scientific_name'];
    const csvContent = [
      headers.join(','),
      ...data.map(obs => {
        return [
          obs.id,
          `"${obs.description?.replace(/"/g, '""') || ''}"`,
          `"${obs.location || ''}"`,
          obs.createdAt?.toISOString() || '',
          `"${obs.species?.name || ''}"`,
          `"${obs.species?.scientificName || ''}"`
        ].join(',');
      })
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="eco_atlas_export.csv"'
      }
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
