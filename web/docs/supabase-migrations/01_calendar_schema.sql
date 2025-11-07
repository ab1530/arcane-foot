-- ============================================
-- ARCANE FOOTBALL - CALENDAR MODULE SCHEMA
-- Module: Arcane Agency - Calendrier Partagé
-- Version: 1.0
-- Date: 2025-10-27
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('agency', 'club', 'scout_network')),
  logo_url TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. USERS TABLE (extended from Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) CHECK (role IN ('admin', 'agent', 'scout', 'analyst', 'coach', 'player', 'staff')),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  phone VARCHAR(50),
  date_of_birth DATE,
  account_type VARCHAR(50) CHECK (account_type IN ('player', 'agent', 'club', 'scout')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. COMPETITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  country VARCHAR(100),
  level VARCHAR(50) CHECK (level IN ('professional', 'semi_pro', 'amateur', 'youth')),
  type VARCHAR(50) CHECK (type IN ('league', 'cup', 'friendly', 'international')),
  season VARCHAR(20),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CLUBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  founded_year INTEGER,
  stadium_name VARCHAR(255),
  stadium_capacity INTEGER,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. VENUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity INTEGER,
  surface_type VARCHAR(50) CHECK (surface_type IN ('natural_grass', 'artificial_turf', 'hybrid')),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. MATCHES TABLE (Core Calendar Entity)
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Match Details
  home_team_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,

  -- Scheduling
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Status
  status VARCHAR(50) CHECK (status IN ('scheduled', 'confirmed', 'live', 'completed', 'postponed', 'cancelled')) DEFAULT 'scheduled',

  -- Results (optional, filled after match)
  home_score INTEGER,
  away_score INTEGER,

  -- Metadata
  round VARCHAR(50), -- e.g., "Matchday 10", "Quarter-Final"
  season VARCHAR(20),
  referee_name VARCHAR(255),
  attendance INTEGER,
  notes TEXT,

  -- Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. MATCH_ASSIGNMENTS TABLE (Scout Assignments)
-- ============================================
CREATE TABLE IF NOT EXISTS match_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  scout_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Assignment Details
  status VARCHAR(50) CHECK (status IN ('assigned', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'assigned',
  role VARCHAR(50) CHECK (role IN ('primary_scout', 'assistant', 'analyst', 'video_analyst')),

  -- Logistics
  arrival_time TIME,
  seating_section VARCHAR(50),
  access_credentials TEXT,

  -- Target Players for this scout
  target_player_names TEXT[], -- Array of player names to focus on

  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  report_submitted BOOLEAN DEFAULT FALSE,

  -- Metadata
  notes TEXT,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate assignments
  UNIQUE(match_id, scout_id)
);

-- ============================================
-- 8. CALENDAR_SYNC_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Google Calendar
  google_calendar_enabled BOOLEAN DEFAULT FALSE,
  google_calendar_id VARCHAR(255),
  google_refresh_token TEXT,
  google_access_token TEXT,
  google_token_expiry TIMESTAMP WITH TIME ZONE,

  -- Outlook Calendar
  outlook_calendar_enabled BOOLEAN DEFAULT FALSE,
  outlook_calendar_id VARCHAR(255),
  outlook_refresh_token TEXT,
  outlook_access_token TEXT,
  outlook_token_expiry TIMESTAMP WITH TIME ZONE,

  -- Sync Preferences
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INTEGER DEFAULT 30,
  last_synced_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- 9. CALENDAR_EVENTS TABLE (External Sync Log)
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- External Calendar IDs
  google_event_id VARCHAR(255),
  outlook_event_id VARCHAR(255),

  -- Sync Status
  sync_status VARCHAR(50) CHECK (sync_status IN ('pending', 'synced', 'failed', 'deleted')),
  sync_error TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Matches
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_organization ON matches(organization_id);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_competition ON matches(competition_id);

-- Match Assignments
CREATE INDEX idx_assignments_match ON match_assignments(match_id);
CREATE INDEX idx_assignments_scout ON match_assignments(scout_id);
CREATE INDEX idx_assignments_status ON match_assignments(status);

-- Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

-- Calendar Sync
CREATE INDEX idx_calendar_sync_user ON calendar_sync_settings(user_id);
CREATE INDEX idx_calendar_events_match ON calendar_events(match_id);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- MATCHES: Users can view matches from their organization
CREATE POLICY "Users can view organization matches"
  ON matches FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- MATCHES: Admins and Agents can create matches
CREATE POLICY "Admins and Agents can create matches"
  ON matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'agent', 'staff')
      AND organization_id = matches.organization_id
    )
  );

-- MATCHES: Admins and Agents can update matches
CREATE POLICY "Admins and Agents can update matches"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'agent', 'staff')
      AND organization_id = matches.organization_id
    )
  );

-- MATCH_ASSIGNMENTS: Scouts can view their own assignments
CREATE POLICY "Scouts can view their assignments"
  ON match_assignments FOR SELECT
  USING (scout_id = auth.uid() OR assigned_by = auth.uid());

-- MATCH_ASSIGNMENTS: Agents can create assignments
CREATE POLICY "Agents can create assignments"
  ON match_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'agent', 'staff')
    )
  );

-- MATCH_ASSIGNMENTS: Scouts can update their own assignments
CREATE POLICY "Scouts can update their assignments"
  ON match_assignments FOR UPDATE
  USING (scout_id = auth.uid());

-- CALENDAR_SYNC_SETTINGS: Users can only access their own sync settings
CREATE POLICY "Users can manage their own sync settings"
  ON calendar_sync_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- CALENDAR_EVENTS: Users can only access their own calendar events
CREATE POLICY "Users can manage their own calendar events"
  ON calendar_events FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_assignments_updated_at BEFORE UPDATE ON match_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_sync_settings_updated_at BEFORE UPDATE ON calendar_sync_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Development/Testing)
-- ============================================

-- Insert sample competitions
INSERT INTO competitions (name, short_name, country, level, type, season) VALUES
('Bundesliga', 'BL', 'Germany', 'professional', 'league', '2024/2025'),
('Ligue 1', 'L1', 'France', 'professional', 'league', '2024/2025'),
('La Liga', 'LL', 'Spain', 'professional', 'league', '2024/2025'),
('UEFA Champions League', 'UCL', 'Europe', 'professional', 'cup', '2024/2025')
ON CONFLICT DO NOTHING;

-- Insert sample clubs
INSERT INTO clubs (name, short_name, country, city, stadium_name) VALUES
('Bayern Munich', 'FCB', 'Germany', 'Munich', 'Allianz Arena'),
('Borussia Dortmund', 'BVB', 'Germany', 'Dortmund', 'Signal Iduna Park'),
('RB Leipzig', 'RBL', 'Germany', 'Leipzig', 'Red Bull Arena'),
('Bayer Leverkusen', 'B04', 'Germany', 'Leverkusen', 'BayArena'),
('Paris Saint-Germain', 'PSG', 'France', 'Paris', 'Parc des Princes'),
('Olympique Marseille', 'OM', 'France', 'Marseille', 'Stade Vélodrome')
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF CALENDAR SCHEMA
-- ============================================
