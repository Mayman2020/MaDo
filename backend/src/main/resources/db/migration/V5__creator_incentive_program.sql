-- Creator Incentive Program + Advanced Rankings + Rewards System
SET search_path TO kick_live, public;

-- ─────────────────────────────────────────────
-- Streamer tier definitions
-- ─────────────────────────────────────────────
CREATE TABLE streamer_tiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(50)  NOT NULL,
  display_name      VARCHAR(50)  NOT NULL,
  badge_icon        VARCHAR(200),
  badge_color       VARCHAR(7),
  min_hours_monthly INTEGER      NOT NULL,
  min_avg_viewers   INTEGER      NOT NULL,
  min_followers     INTEGER      NOT NULL,
  revenue_split     INTEGER      NOT NULL,
  monthly_bonus_usd DECIMAL(10,2) DEFAULT 0,
  perks             TEXT[],
  sort_order        INTEGER      NOT NULL,
  created_at        TIMESTAMP    DEFAULT NOW()
);

-- Streamer's current tier + progress
CREATE TABLE streamer_tier_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id              UUID UNIQUE REFERENCES channels(id) ON DELETE CASCADE,
  current_tier_id         UUID REFERENCES streamer_tiers(id),
  previous_tier_id        UUID REFERENCES streamer_tiers(id),
  tier_achieved_at        TIMESTAMP,
  tier_expires_at         TIMESTAMP,
  hours_this_month        DECIMAL(10,2) DEFAULT 0,
  avg_viewers_this_month  INTEGER       DEFAULT 0,
  peak_viewers_this_month INTEGER       DEFAULT 0,
  streams_this_month      INTEGER       DEFAULT 0,
  revenue_this_month      DECIMAL(10,2) DEFAULT 0,
  total_stream_hours      DECIMAL(10,2) DEFAULT 0,
  total_revenue_earned    DECIMAL(10,2) DEFAULT 0,
  last_calculated_at      TIMESTAMP     DEFAULT NOW(),
  updated_at              TIMESTAMP     DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Milestone definitions
-- ─────────────────────────────────────────────
CREATE TABLE milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  description   TEXT         NOT NULL,
  icon          VARCHAR(200),
  category      VARCHAR(50)  NOT NULL,
  metric_type   VARCHAR(50)  NOT NULL,
  metric_value  BIGINT       NOT NULL,
  reward_type   VARCHAR(30),
  reward_amount DECIMAL(10,2),
  reward_detail TEXT,
  badge_color   VARCHAR(7),
  is_repeatable BOOLEAN      DEFAULT FALSE,
  sort_order    INTEGER      DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT NOW()
);

-- Earned milestones per streamer
CREATE TABLE streamer_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID REFERENCES channels(id) ON DELETE CASCADE,
  milestone_id    UUID REFERENCES milestones(id),
  earned_at       TIMESTAMP DEFAULT NOW(),
  reward_paid     BOOLEAN   DEFAULT FALSE,
  reward_paid_at  TIMESTAMP,
  notified        BOOLEAN   DEFAULT FALSE,
  UNIQUE(channel_id, milestone_id)
);

-- ─────────────────────────────────────────────
-- Stats snapshots
-- ─────────────────────────────────────────────
CREATE TABLE stream_stats_daily (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id     UUID REFERENCES channels(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES categories(id),
  stat_date      DATE    NOT NULL,
  total_views    BIGINT  DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  peak_viewers   INTEGER DEFAULT 0,
  avg_viewers    INTEGER DEFAULT 0,
  stream_minutes INTEGER DEFAULT 0,
  new_followers  INTEGER DEFAULT 0,
  new_subs       INTEGER DEFAULT 0,
  chat_messages  INTEGER DEFAULT 0,
  clips_created  INTEGER DEFAULT 0,
  revenue_usd    DECIMAL(10,2) DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, stat_date)
);

CREATE TABLE stream_stats_hourly (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    UUID REFERENCES channels(id) ON DELETE CASCADE,
  stream_id     UUID REFERENCES streams(id)  ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id),
  snapshot_hour TIMESTAMP NOT NULL,
  viewer_count  INTEGER   DEFAULT 0,
  peak_viewers  INTEGER   DEFAULT 0,
  chat_messages INTEGER   DEFAULT 0,
  new_followers INTEGER   DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stream_stats_monthly (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID REFERENCES channels(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id),
  stat_year       INTEGER NOT NULL,
  stat_month      INTEGER NOT NULL,
  total_views     BIGINT  DEFAULT 0,
  unique_viewers  INTEGER DEFAULT 0,
  peak_viewers    INTEGER DEFAULT 0,
  avg_viewers     INTEGER DEFAULT 0,
  total_hours     DECIMAL(10,2) DEFAULT 0,
  stream_count    INTEGER DEFAULT 0,
  new_followers   INTEGER DEFAULT 0,
  new_subs        INTEGER DEFAULT 0,
  total_revenue   DECIMAL(10,2) DEFAULT 0,
  bonus_paid      DECIMAL(10,2) DEFAULT 0,
  revenue_split_pct INTEGER     DEFAULT 80,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, stat_year, stat_month)
);

-- ─────────────────────────────────────────────
-- Rankings snapshots (cached for performance)
-- ─────────────────────────────────────────────
CREATE TABLE rankings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    UUID REFERENCES channels(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id),
  ranking_type  VARCHAR(50) NOT NULL,
  rank_position INTEGER     NOT NULL,
  metric_value  BIGINT      NOT NULL,
  period_start  TIMESTAMP   NOT NULL,
  period_end    TIMESTAMP   NOT NULL,
  calculated_at TIMESTAMP   DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Payouts
-- ─────────────────────────────────────────────
CREATE TABLE payouts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id         UUID REFERENCES channels(id)   ON DELETE CASCADE,
  user_id            UUID REFERENCES users(id)      ON DELETE CASCADE,
  payout_type        VARCHAR(30) NOT NULL,
  amount_usd         DECIMAL(10,2) NOT NULL,
  status             VARCHAR(20)   DEFAULT 'PENDING',
  period_month       INTEGER,
  period_year        INTEGER,
  milestone_id       UUID REFERENCES milestones(id),
  stripe_transfer_id VARCHAR(200),
  notes              TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  paid_at            TIMESTAMP
);

-- ─────────────────────────────────────────────
-- Community goals
-- ─────────────────────────────────────────────
CREATE TABLE streamer_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    UUID REFERENCES channels(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  goal_type     VARCHAR(30)  NOT NULL,
  target_value  BIGINT       NOT NULL,
  current_value BIGINT       DEFAULT 0,
  reward_text   TEXT,
  is_active     BOOLEAN      DEFAULT TRUE,
  is_completed  BOOLEAN      DEFAULT FALSE,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP    DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
CREATE INDEX ON stream_stats_daily(channel_id, stat_date DESC);
CREATE INDEX ON stream_stats_daily(stat_date, total_views DESC);
CREATE INDEX ON stream_stats_hourly(snapshot_hour, viewer_count DESC);
CREATE INDEX ON stream_stats_hourly(channel_id, snapshot_hour DESC);
CREATE INDEX ON stream_stats_monthly(channel_id, stat_year, stat_month);
CREATE INDEX ON rankings(ranking_type, rank_position);
CREATE INDEX ON rankings(channel_id, ranking_type);
CREATE INDEX ON streamer_milestones(channel_id);
CREATE INDEX ON payouts(channel_id, created_at DESC);
CREATE INDEX ON payouts(status) WHERE status = 'PENDING';
CREATE INDEX ON streamer_goals(channel_id) WHERE is_active = TRUE;

-- ─────────────────────────────────────────────
-- Seed: Streamer tiers
-- ─────────────────────────────────────────────
INSERT INTO streamer_tiers (name, display_name, badge_color, min_hours_monthly, min_avg_viewers, min_followers, revenue_split, monthly_bonus_usd, perks, sort_order) VALUES
('BRONZE',  'Bronze',  '#cd7f32', 5,  0,   0,     80, 0,    ARRAY['80% revenue split', 'Basic analytics', 'Custom emotes (3 slots)'], 1),
('SILVER',  'Silver',  '#c0c0c0', 20, 10,  100,   85, 25,   ARRAY['85% revenue split', '$25/month bonus', 'Custom emotes (6 slots)', 'Priority support'], 2),
('GOLD',    'Gold',    '#ffd700', 40, 50,  500,   90, 100,  ARRAY['90% revenue split', '$100/month bonus', 'Custom emotes (15 slots)', 'Featured on homepage', 'Verified badge'], 3),
('DIAMOND', 'Diamond', '#b9f2ff', 60, 200, 2000,  95, 300,  ARRAY['95% revenue split', '$300/month bonus', 'Unlimited emotes', 'Priority featured', 'Dedicated support manager'], 4),
('LEGEND',  'Legend',  '#53fc18', 80, 500, 10000, 97, 1000, ARRAY['97% revenue split', '$1000/month bonus', 'Unlimited everything', 'Homepage hero slot', 'Custom platform badge', 'Direct line to CEO'], 5);

-- ─────────────────────────────────────────────
-- Seed: Milestones
-- ─────────────────────────────────────────────
INSERT INTO milestones (name, description, category, metric_type, metric_value, reward_type, reward_amount, reward_detail, badge_color, sort_order) VALUES
-- Hours
('First Stream',   'Complete your first live stream',            'HOURS',     'stream_count',   1,     'BADGE', 0,    'First Stream badge',           '#53fc18', 1),
('10 Hours',       'Stream a total of 10 hours',                 'HOURS',     'total_hours',    10,    'CASH',  5,    '$5 bonus credited to account', '#cd7f32', 2),
('50 Hours',       'Stream a total of 50 hours',                 'HOURS',     'total_hours',    50,    'CASH',  15,   '$15 bonus + Silver badge',     '#c0c0c0', 3),
('100 Hours',      'Stream a total of 100 hours',                'HOURS',     'total_hours',    100,   'CASH',  30,   '$30 bonus + Featured 24h',     '#ffd700', 4),
('500 Hours',      'Stream a total of 500 hours',                'HOURS',     'total_hours',    500,   'CASH',  150,  '$150 bonus + Gold badge',      '#ffd700', 5),
('1000 Hours',     'Stream 1000 total hours — true dedication',  'HOURS',     'total_hours',    1000,  'CASH',  500,  '$500 bonus + Diamond badge',   '#b9f2ff', 6),
-- Viewers
('First 10 Viewers','Reach 10 concurrent viewers',              'VIEWERS',   'peak_viewers',   10,    'BADGE', 0,    'Rising Star badge',            '#53fc18', 10),
('50 Viewers',     'Reach 50 concurrent viewers',               'VIEWERS',   'peak_viewers',   50,    'CASH',  10,   '$10 bonus',                    '#cd7f32', 11),
('100 Viewers',    'Reach 100 concurrent viewers',              'VIEWERS',   'peak_viewers',   100,   'CASH',  25,   '$25 bonus + emote slot',       '#c0c0c0', 12),
('500 Viewers',    'Reach 500 concurrent viewers',              'VIEWERS',   'peak_viewers',   500,   'CASH',  100,  '$100 bonus + Featured 48h',    '#ffd700', 13),
('1000 Viewers',   'Reach 1000 concurrent viewers',             'VIEWERS',   'peak_viewers',   1000,  'CASH',  300,  '$300 bonus + Homepage hero',   '#b9f2ff', 14),
('10K Viewers',    'Reach 10,000 concurrent viewers',           'VIEWERS',   'peak_viewers',   10000, 'CASH',  1000, '$1000 bonus + Legend status',  '#53fc18', 15),
-- Followers
('First 100 Followers','Reach 100 followers',                   'FOLLOWERS', 'follower_count', 100,   'BADGE', 0,    'Community Builder badge',      '#53fc18', 20),
('500 Followers',  'Reach 500 followers',                       'FOLLOWERS', 'follower_count', 500,   'CASH',  10,   '$10 bonus',                    '#cd7f32', 21),
('1K Followers',   'Reach 1,000 followers',                     'FOLLOWERS', 'follower_count', 1000,  'CASH',  25,   '$25 bonus + Silver badge',     '#c0c0c0', 22),
('10K Followers',  'Reach 10,000 followers',                    'FOLLOWERS', 'follower_count', 10000, 'CASH',  100,  '$100 bonus + Gold badge',      '#ffd700', 23),
('100K Followers', 'Reach 100,000 followers',                   'FOLLOWERS', 'follower_count', 100000,'CASH',  500,  '$500 bonus + Verified badge',  '#b9f2ff', 24),
-- Subscribers
('First Sub',      'Get your first subscriber',                 'SUBSCRIBERS','sub_count',     1,     'BADGE', 0,    'First Sub badge',              '#53fc18', 30),
('10 Subs',        'Reach 10 subscribers',                      'SUBSCRIBERS','sub_count',     10,    'CASH',  15,   '$15 bonus',                    '#cd7f32', 31),
('50 Subs',        'Reach 50 subscribers',                      'SUBSCRIBERS','sub_count',     50,    'CASH',  50,   '$50 bonus + emote slot',       '#c0c0c0', 32),
('100 Subs',       'Reach 100 subscribers',                     'SUBSCRIBERS','sub_count',     100,   'CASH',  150,  '$150 bonus + Featured week',   '#ffd700', 33),
('500 Subs',       'Reach 500 subscribers',                     'SUBSCRIBERS','sub_count',     500,   'CASH',  500,  '$500 bonus + Diamond tier',    '#b9f2ff', 34),
-- Clips
('Viral Clip',     'A clip reaches 10,000 views',               'CLIPS',     'clip_views',     10000, 'CASH',  25,   '$25 bonus + Featured clip',    '#ffd700', 40),
('Mega Clip',      'A clip reaches 100,000 views',              'CLIPS',     'clip_views',     100000,'CASH',  100,  '$100 bonus',                   '#b9f2ff', 41);
