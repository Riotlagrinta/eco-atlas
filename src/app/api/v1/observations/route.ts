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
    endpoint: '/api/v1/observations',
    method: 'GET',
    response_code: 200
  });

  const { searchParams } = new URL(req.url);
  const species = searchParams.get('species');
  const region = searchParams.get('region');
  const dateFrom = searchParams.get('date_from');

  let query = supabaseAdmin
    .from('observations')
    .select('id, description, image_url, location, is_verified, created_at, species:species_id(name, scientific_name)')
    .eq('is_verified', true);

  if (species) {
    query = query.ilike('species.name', `%${species}%`);
  }
  
  // Note: La région est souvent stockée dans le profil de l'utilisateur qui a fait l'observation
  // On peut filtrer par région via une jointure si nécessaire, ici on fait simple
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transformer les points PostGIS en GeoJSON si nécessaire
  const formattedData = data.map(obs => {
    // Si location est une chaîne POINT(lng lat)
    const match = obs.location?.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    const coordinates = match ? [parseFloat(match[1]), parseFloat(match[2])] : null;

    return {
      ...obs,
      geometry: coordinates ? {
        type: 'Point',
        coordinates: coordinates
      } : null
    };
  });

  return NextResponse.json({
    success: true,
    count: formattedData.length,
    data: formattedData
  });
}
