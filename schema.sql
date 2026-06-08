-- Run this in your Neon SQL editor to set up the database

CREATE TABLE IF NOT EXISTS captures (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,          -- random URL-safe identifier e.g. "xK9mP2qR"
  front_image TEXT NOT NULL,                 -- base64 data URL of front ID image
  back_image  TEXT NOT NULL,                 -- base64 data URL of back ID image
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'  -- auto-expire after 7 days
);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_captures_slug ON captures (slug);

-- Optional: periodically delete expired rows
-- You can run this manually or set up a cron job
-- DELETE FROM captures WHERE expires_at < NOW();
