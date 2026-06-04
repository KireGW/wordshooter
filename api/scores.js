import { neon } from '@neondatabase/serverless'

const VALID_LANGUAGES = new Set(['english', 'french', 'spanish', 'italian', 'german', 'swedish'])
const VALID_LEVELS = new Set(['A1', 'A2', 'B1', 'B2'])
const DISPLAY_LIMIT = 10
const STORED_LIMIT = 20
const MAX_NAME_LENGTH = 18

const sanitizeName = (value) => {
  if (typeof value !== 'string') {
    return 'Player'
  }

  const normalized = value.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)
  return normalized || 'Player'
}

const sanitizeScore = (value) => {
  const numericScore = Number(value)
  if (!Number.isFinite(numericScore)) {
    return 0
  }

  return Math.max(0, Math.floor(numericScore))
}

const validateScope = ({ language, cefrLevel }) => {
  if (!VALID_LANGUAGES.has(language) || !VALID_LEVELS.has(cefrLevel)) {
    return false
  }

  return true
}

const getSql = () => {
  if (!process.env.DATABASE_URL) {
    return null
  }

  return neon(process.env.DATABASE_URL)
}

const ensureSchema = async (sql) => {
  await sql`
    create table if not exists scores (
      id bigserial primary key,
      player_name text not null,
      score integer not null check (score >= 0),
      language text not null,
      cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2')),
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create index if not exists scores_leaderboard_idx
    on scores (language, cefr_level, score desc, created_at asc)
  `
}

const getLeaderboard = async (sql, language, cefrLevel, limit = DISPLAY_LIMIT) => {
  const rows = await sql`
    select player_name as name, score, created_at as "achievedAt"
    from scores
    where language = ${language}
      and cefr_level = ${cefrLevel}
    order by score desc, created_at asc
    limit ${limit}
  `

  return rows.map((row) => ({
    name: row.name,
    score: row.score,
    achievedAt: row.achievedAt,
  }))
}

const getCurrentCutoff = async (sql, language, cefrLevel) => {
  const rows = await sql`
    select score
    from scores
    where language = ${language}
      and cefr_level = ${cefrLevel}
    order by score desc, created_at asc
    offset ${STORED_LIMIT - 1}
    limit 1
  `

  return rows[0]?.score ?? null
}

const getScoreCount = async (sql, language, cefrLevel) => {
  const rows = await sql`
    select count(*)::int as count
    from scores
    where language = ${language}
      and cefr_level = ${cefrLevel}
  `

  return rows[0]?.count ?? 0
}

const trimLeaderboard = async (sql, language, cefrLevel) => {
  await sql`
    delete from scores
    where id in (
      select id
      from (
        select
          id,
          row_number() over (
            partition by language, cefr_level
            order by score desc, created_at asc
          ) as rank
        from scores
        where language = ${language}
          and cefr_level = ${cefrLevel}
      ) ranked
      where rank > ${STORED_LIMIT}
    )
  `
}

const getInsertedRank = async (sql, language, cefrLevel, id) => {
  const rows = await sql`
    select rank
    from (
      select
        id,
        row_number() over (
          partition by language, cefr_level
          order by score desc, created_at asc
        ) as rank
      from scores
      where language = ${language}
        and cefr_level = ${cefrLevel}
    ) ranked
    where id = ${id}
  `

  return rows[0]?.rank ?? null
}

export default async function handler(req, res) {
  const sql = getSql()

  if (!sql) {
    return res.status(503).json({
      error: 'Global leaderboard is not configured.',
      scores: [],
    })
  }

  try {
    await ensureSchema(sql)

    if (req.method === 'GET') {
      const language = String(req.query.language ?? '')
      const cefrLevel = String(req.query.level ?? req.query.cefrLevel ?? '')

      if (!validateScope({ language, cefrLevel })) {
        return res.status(400).json({ error: 'Invalid language or CEFR level.', scores: [] })
      }

      const scores = await getLeaderboard(sql, language, cefrLevel)
      return res.status(200).json({ scores })
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {}
      const language = String(body.language ?? '')
      const cefrLevel = String(body.cefrLevel ?? body.level ?? '')
      const playerName = sanitizeName(body.playerName ?? body.name)
      const score = sanitizeScore(body.score)

      if (!validateScope({ language, cefrLevel }) || score <= 0) {
        return res.status(400).json({ error: 'Invalid score payload.', scores: [] })
      }

      const [scoreCount, cutoff] = await Promise.all([
        getScoreCount(sql, language, cefrLevel),
        getCurrentCutoff(sql, language, cefrLevel),
      ])
      const qualifies = scoreCount < STORED_LIMIT || cutoff === null || score > cutoff

      if (!qualifies) {
        const scores = await getLeaderboard(sql, language, cefrLevel)
        return res.status(200).json({ saved: false, rank: null, scores })
      }

      const insertedRows = await sql`
        insert into scores (player_name, score, language, cefr_level)
        values (${playerName}, ${score}, ${language}, ${cefrLevel})
        returning id
      `
      const insertedId = insertedRows[0].id
      const rank = await getInsertedRank(sql, language, cefrLevel, insertedId)
      await trimLeaderboard(sql, language, cefrLevel)
      const scores = await getLeaderboard(sql, language, cefrLevel)

      return res.status(200).json({ saved: true, rank, scores })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed.', scores: [] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Leaderboard request failed.', scores: [] })
  }
}
