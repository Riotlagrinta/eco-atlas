-- =============================================
-- PHASE 3 : FORUM COMMUNAUTAIRE
-- À exécuter dans Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  category TEXT CHECK (category IN ('general', 'identification', 'alert', 'parc', 'species')),
  related_species_id UUID,
  related_area_id UUID,
  image_url TEXT,
  upvotes INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_expert_answer BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS observation_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  observation_id UUID,
  voter_id UUID REFERENCES auth.users(id),
  vote TEXT CHECK (vote IN ('confirm', 'reject', 'unsure')),
  suggested_species_id UUID,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(observation_id, voter_id)
);

-- RLS
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE observation_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view threads" ON forum_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create threads" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update threads" ON forum_threads FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Anyone can view replies" ON forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Anyone can view votes" ON observation_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can vote" ON observation_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Users can update own vote" ON observation_votes FOR UPDATE USING (auth.uid() = voter_id);
