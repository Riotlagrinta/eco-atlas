-- =============================================
-- PHASE 5 : ÉCOTOURISME & CIRCUITS
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Circuits/itinéraires
CREATE TABLE IF NOT EXISTS eco_trails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  park_id UUID, -- Optionnel, peut être lié à la table protected_areas si elle existe
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  duration_hours DECIMAL,
  distance_km DECIMAL,
  highlights TEXT[],
  route_geojson JSONB,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Guides locaux
CREATE TABLE IF NOT EXISTS local_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  languages TEXT[] DEFAULT ARRAY['fr'],
  specialties TEXT[],
  park_id UUID, 
  rating DECIMAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  price_per_day INTEGER,
  is_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Réservations
CREATE TABLE IF NOT EXISTS trail_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID REFERENCES eco_trails(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES local_guides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  participants INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('tmoney', 'flooz', 'cash')),
  total_price INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE eco_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trails" ON eco_trails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view guides" ON local_guides FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own bookings" ON trail_bookings FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM local_guides WHERE id = guide_id));

CREATE POLICY "Users can create bookings" ON trail_bookings FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);
