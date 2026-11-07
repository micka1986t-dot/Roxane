-- Schéma de Plume Libre. Rejouable sans risque (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  pseudo        TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  bio           TEXT NOT NULL DEFAULT '',
  color         TEXT NOT NULL DEFAULT '#D3336A',
  birth_year    INT  NOT NULL,
  is_demo       BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  premium       BOOLEAN NOT NULL DEFAULT FALSE,
  parent_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_pseudo_lower ON users (lower(pseudo));

CREATE TABLE IF NOT EXISTS stories (
  id         SERIAL PRIMARY KEY,
  author_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  summary    TEXT NOT NULL DEFAULT '',
  section    TEXT NOT NULL CHECK (section IN ('jeunesse','adulte')),
  genre      TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('courte','chapitres')),
  cover      JSONB NOT NULL DEFAULT '{}',
  reads      INT NOT NULL DEFAULT 0,
  hidden     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stories_author ON stories(author_id);

CREATE TABLE IF NOT EXISTS chapters (
  id       SERIAL PRIMARY KEY,
  story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  position INT NOT NULL,
  title    TEXT NOT NULL,
  body     TEXT NOT NULL,
  UNIQUE (story_id, position)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  story_id   INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anonymous  BOOLEAN NOT NULL DEFAULT TRUE,
  stars      INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  body       TEXT NOT NULL,
  hidden     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, author_id),
  CHECK (follower_id <> author_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id          SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('story','review')),
  target_id   INT NOT NULL,
  reason      TEXT NOT NULL,
  reporter_id INT REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- v0.3 : récupération de compte, charte, validation des comptes adultes, notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS adult_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  actor      TEXT NOT NULL DEFAULT '',
  story_id   INT REFERENCES stories(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id, created_at DESC);

-- v0.4 : e-mail de secours facultatif (jamais affiché) et liens de réinitialisation
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email TEXT;
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE
);
