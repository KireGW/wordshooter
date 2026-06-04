create table if not exists scores (
  id bigserial primary key,
  player_name text not null,
  score integer not null check (score >= 0),
  language text not null,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2')),
  created_at timestamptz not null default now()
);

create index if not exists scores_leaderboard_idx
on scores (language, cefr_level, score desc, created_at asc);
