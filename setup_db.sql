CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  user_id UUID,
  title TEXT,
  severity TEXT,
  status TEXT,
  threat_type TEXT,
  endpoint TEXT,
  source_ip TEXT,
  user_session TEXT,
  risk_score INTEGER,
  confidence FLOAT,
  first_seen TEXT,
  last_seen TEXT,
  occurrences INTEGER,
  action_taken TEXT
);

CREATE TABLE IF NOT EXISTS custom_rules (
  id TEXT PRIMARY KEY,
  user_id UUID,
  condition TEXT,
  action TEXT,
  severity TEXT,
  status TEXT
);
