import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 401 });
  }

  // Vérifier la validité de la clé API
  const { data: keyData, error: keyError } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();

  if (keyError || !keyData) {
    return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 403 });
  }

  // Log de la requête
  await supabaseAdmin.from('api_logs').insert({
    api_key_id: keyData.id,
    endpoint: '/api/v1/export',
    method: 'GET',
    response_code: 200
  });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';

  const { data, error } = await supabaseAdmin
    .from('observations')
    .select('id, description, location, is_verified, created_at, species:species_id(name, scientific_name)')
    .eq('is_verified', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === 'csv') {
    const headers = ['id', 'description', 'location', 'created_at', 'species_name', 'scientific_name'];
    const csvContent = [
      headers.join(','),
      ...data.map(obs => {
        const spec = Array.isArray(obs.species) ? obs.species[0] : obs.species;
        return [
          obs.id,
          `"${obs.description?.replace(/"/g, '""')}"`,
          `"${obs.location}"`,
          obs.created_at,
          `"${spec?.name || ''}"`,
          `"${spec?.scientific_name || ''}"`
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
