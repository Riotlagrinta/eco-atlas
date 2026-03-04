-- ================================================
-- ECO-ATLAS V2 — Script SQL Complet
-- À exécuter dans la console SQL de Supabase
-- ================================================

-- =============================================
-- PHASE 1 : GAMIFICATION
-- =============================================

-- Table des niveaux utilisateurs
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank TEXT DEFAULT '🌱 Explorateur',
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Table des défis hebdomadaires
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 50,
  target_type TEXT CHECK (target_type IN ('observations', 'species', 'alerts', 'quiz', 'login')),
  target_count INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Progression des défis par utilisateur
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

-- =============================================
-- PHASE 2 : NOTIFICATIONS & ALERTES
-- =============================================

-- Abonnements Push (Web Push API)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Préférences de notification par utilisateur
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  alert_radius_km INTEGER DEFAULT 50,
  alert_types TEXT[] DEFAULT ARRAY['critical', 'high'],
  regions TEXT[],
  UNIQUE(user_id)
);

-- Historique des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT CHECK (type IN ('alert', 'badge', 'challenge', 'community', 'system')),
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- DONNÉES INITIALES : DÉFIS HEBDOMADAIRES
-- =============================================

INSERT INTO challenges (title, description, xp_reward, target_type, target_count, start_date, end_date, is_active) VALUES
('📸 Première Observation', 'Envoyez votre première observation cette semaine.', 50, 'observations', 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true),
('🔭 Explorateur Actif', 'Faites 5 observations en une semaine.', 150, 'observations', 5, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true),
('🚨 Sentinelle', 'Signalez 3 alertes de braconnage ou danger.', 200, 'alerts', 3, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true),
('🧠 Quiz Master', 'Complétez 3 quiz sur la biodiversité.', 100, 'quiz', 3, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true),
('🔑 Fidélité', 'Connectez-vous 5 jours consécutifs.', 100, 'login', 5, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques : chacun voit/modifie ses propres données
CREATE POLICY "Users can view own level" ON user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own level" ON user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level" ON user_levels FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own challenge progress" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenge progress" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own push sub" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notif prefs" ON notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Politique pour que le classement soit visible par tous
CREATE POLICY "Anyone can view leaderboard" ON user_levels FOR SELECT TO authenticated USING (true);
