import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import {
  CATEGORY_STYLES,
  CEFR_LEVELS,
  DEFAULT_LANGUAGE,
  DEFAULT_LEVEL,
  LANGUAGE_PACKS,
  getCategoryMap,
  getCategoryOrder,
  getLanguageNames,
  getLevelPack,
} from './gameData.js'

const ARENA = {
  width: 100,
  height: 100,
}

const PLAYER_SPEED = 56
const BULLET_SPEED = 88
const WORD_SPAWN_MS = 850
const WORD_MIN_SPEED = 5.5
const WORD_MAX_SPEED = 9.5
const MIN_ACTIVE_WORDS = 4
const INITIAL_WORD_COUNT = 3
const CATEGORY_SWITCH_MS = 15000
const CATEGORY_ANNOUNCEMENT_MS = 1800
const ROUND_DURATION_MS = 90000
const CORRECT_HIT_POINTS = 1
const WRONG_HIT_POINTS = 1
const MISSED_TARGET_POINTS = 1
const STREAK_BONUS_THRESHOLD = 10
const STREAK_BONUS_POINTS = 5
const INITIAL_WORD_Y_MIN = -6
const INITIAL_WORD_Y_MAX = 10
const WORD_BOX_HEIGHT = 6
const WORD_CHAR_WIDTH = 1.15
const WORD_BOX_PADDING = 3.2
const WORD_OVERLAP_ALLOWANCE = 0.2
const MAX_READABILITY_OVERLAP = 0.7
const EFFECT_LIFETIME_MS = 550
const HIGH_SCORE_STORAGE_KEY = 'wordshooter-highscores'
const SETTINGS_STORAGE_KEY = 'wordshooter-settings'
const RECENT_WORD_MEMORY = 4
const STREAK_ANNOUNCEMENT_MS = 1500
const DEFAULT_MUSIC_ENABLED = false
const DEFAULT_SFX_ENABLED = false

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const pickRandom = (items) => items[Math.floor(Math.random() * items.length)]
const getWordBoxWidth = (text) => text.length * WORD_CHAR_WIDTH + WORD_BOX_PADDING
const getWordBounds = (word) => {
  const halfWidth = getWordBoxWidth(word.text) / 2
  const halfHeight = WORD_BOX_HEIGHT / 2

  return {
    left: word.x - halfWidth,
    right: word.x + halfWidth,
    top: word.y - halfHeight,
    bottom: word.y + halfHeight,
    halfWidth,
    halfHeight,
  }
}

const wordsOverlap = (firstWord, secondWord, padding = 1.4) => {
  const first = getWordBounds(firstWord)
  const second = getWordBounds(secondWord)
  const allowedHorizontalOverlap =
    Math.min(first.right - first.left, second.right - second.left) *
    WORD_OVERLAP_ALLOWANCE

  return !(
    first.right - allowedHorizontalOverlap + padding < second.left ||
    first.left + allowedHorizontalOverlap - padding > second.right ||
    first.bottom + padding < second.top ||
    first.top - padding > second.bottom
  )
}

const gentlyResolveUnreadableOverlap = (words) => {
  const adjusted = words.map((word) => ({ ...word }))

  for (let i = 0; i < adjusted.length; i += 1) {
    for (let j = i + 1; j < adjusted.length; j += 1) {
      const first = getWordBounds(adjusted[i])
      const second = getWordBounds(adjusted[j])
      const overlapX =
        Math.min(first.right, second.right) - Math.max(first.left, second.left)
      const overlapY =
        Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)

      if (overlapX <= 0 || overlapY <= 0) {
        continue
      }

      const narrowerWidth = Math.min(
        first.right - first.left,
        second.right - second.left,
      )
      const overlapRatio = overlapX / narrowerWidth

      if (overlapRatio < MAX_READABILITY_OVERLAP) {
        continue
      }

      const push = Math.min(0.18, (overlapRatio - MAX_READABILITY_OVERLAP) * 0.45)

      if (adjusted[i].x <= adjusted[j].x) {
        adjusted[i].x = clamp(adjusted[i].x - push, 8, 92)
        adjusted[j].x = clamp(adjusted[j].x + push, 8, 92)
      } else {
        adjusted[i].x = clamp(adjusted[i].x + push, 8, 92)
        adjusted[j].x = clamp(adjusted[j].x - push, 8, 92)
      }
    }
  }

  return adjusted
}

const placeWordWithoutOverlap = (candidate, existingWords, maxAttempts = 8) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const collides = existingWords.some((word) => wordsOverlap(candidate, word))
    if (!collides) {
      return candidate
    }

    candidate = {
      ...candidate,
      x: 12 + Math.random() * 76,
      y: Math.max(-8, candidate.y + 3 + Math.random() * 6),
    }
  }

  return candidate
}

const getNextCategoryId = (categoryOrder, currentCategoryId) => {
  const currentIndex = categoryOrder.indexOf(currentCategoryId)
  if (currentIndex === -1) {
    return categoryOrder[0]
  }

  return categoryOrder[(currentIndex + 1) % categoryOrder.length]
}

const getHighScoreKey = (languageId, cefrLevel) => `${languageId}:${cefrLevel}`

const loadHighScores = () => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const loadSettings = () => {
  if (typeof window === 'undefined') {
    return {
      languageId: DEFAULT_LANGUAGE,
      cefrLevel: DEFAULT_LEVEL,
      musicEnabled: DEFAULT_MUSIC_ENABLED,
      sfxEnabled: DEFAULT_SFX_ENABLED,
    }
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      return {
        languageId: DEFAULT_LANGUAGE,
        cefrLevel: DEFAULT_LEVEL,
        musicEnabled: DEFAULT_MUSIC_ENABLED,
        sfxEnabled: DEFAULT_SFX_ENABLED,
      }
    }

    const parsed = JSON.parse(raw)
    const languageId =
      parsed.languageId && LANGUAGE_PACKS[parsed.languageId]
        ? parsed.languageId
        : DEFAULT_LANGUAGE
    const cefrLevel =
      parsed.cefrLevel && CEFR_LEVELS.includes(parsed.cefrLevel)
        ? parsed.cefrLevel
        : DEFAULT_LEVEL
    const musicEnabled =
      typeof parsed.musicEnabled === 'boolean'
        ? parsed.musicEnabled
        : typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_MUSIC_ENABLED
    const sfxEnabled =
      typeof parsed.sfxEnabled === 'boolean'
        ? parsed.sfxEnabled
        : typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_SFX_ENABLED

    return {
      languageId,
      cefrLevel,
      musicEnabled,
      sfxEnabled,
    }
  } catch {
    return {
      languageId: DEFAULT_LANGUAGE,
      cefrLevel: DEFAULT_LEVEL,
      musicEnabled: DEFAULT_MUSIC_ENABLED,
      sfxEnabled: DEFAULT_SFX_ENABLED,
    }
  }
}

const createAudioEngine = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    return null
  }

  const context = new AudioContextClass()
  const masterGain = context.createGain()
  masterGain.gain.value = 0
  masterGain.connect(context.destination)

  const musicGain = context.createGain()
  musicGain.gain.value = 0.11
  musicGain.connect(masterGain)

  const lowpass = context.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 2400
  lowpass.Q.value = 1.2
  lowpass.connect(musicGain)

  const reverbDelay = context.createDelay()
  reverbDelay.delayTime.value = 0.22
  const reverbGain = context.createGain()
  reverbGain.gain.value = 0.16
  reverbDelay.connect(reverbGain)
  reverbGain.connect(lowpass)

  const createVoice = (type, frequency, volume) => {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.value = volume
    osc.connect(gain)
    gain.connect(lowpass)
    gain.connect(reverbDelay)
    osc.start()

    return { osc, gain }
  }

  const padRoot = createVoice('sawtooth', 130.81, 0.028)
  const padThird = createVoice('triangle', 164.81, 0.018)
  const padFifth = createVoice('triangle', 196, 0.014)

  const lfo = context.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.12
  const lfoDepth = context.createGain()
  lfoDepth.gain.value = 180
  lfo.connect(lfoDepth)
  lfoDepth.connect(lowpass.frequency)
  lfo.start()

  const progression = [
    {
      root: 130.81,
      chord: [130.81, 164.81, 196],
      bass: [130.81, 130.81, 98, 110],
      arp: [261.63, 392, 523.25, 392, 329.63, 392, 523.25, 392],
    },
    {
      root: 146.83,
      chord: [146.83, 185, 220],
      bass: [146.83, 146.83, 110, 123.47],
      arp: [293.66, 440, 587.33, 440, 369.99, 440, 587.33, 440],
    },
    {
      root: 174.61,
      chord: [174.61, 220, 261.63],
      bass: [174.61, 174.61, 130.81, 146.83],
      arp: [349.23, 523.25, 698.46, 523.25, 440, 523.25, 698.46, 523.25],
    },
    {
      root: 146.83,
      chord: [146.83, 185, 220],
      bass: [146.83, 146.83, 110, 123.47],
      arp: [293.66, 440, 659.25, 440, 369.99, 440, 587.33, 440],
    },
  ]

  let stepIndex = 0
  const beatSeconds = 0.3

  const playNote = (frequency, startTime, duration, volume, type = 'triangle') => {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, startTime)
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.55), startTime + duration * 0.45)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
    osc.connect(gain)
    gain.connect(lowpass)
    gain.connect(reverbDelay)
    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }

  const sequencerId = window.setInterval(() => {
    const now = context.currentTime + 0.02
    const pattern = progression[stepIndex % progression.length]

    ;[padRoot, padThird, padFifth].forEach((voice, index) => {
      voice.osc.frequency.cancelScheduledValues(now)
      voice.osc.frequency.linearRampToValueAtTime(pattern.chord[index], now + 0.08)
    })

    pattern.bass.forEach((frequency, index) => {
      playNote(frequency / 2, now + index * beatSeconds, beatSeconds * 0.9, 0.052, 'sawtooth')
    })

    pattern.arp.forEach((frequency, index) => {
      playNote(frequency, now + index * (beatSeconds / 2), beatSeconds * 0.42, 0.028, 'square')
    })

    stepIndex += 1
  }, beatSeconds * 4000)

  const setMasterMuted = (muted) => {
    const now = context.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.9, now + 0.12)
  }

  const setMusicMuted = (muted) => {
    const now = context.currentTime
    musicGain.gain.cancelScheduledValues(now)
    musicGain.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.11, now + 0.12)
  }

  const playLaser = () => {
    const now = context.currentTime
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(660, now)
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(now)
    osc.stop(now + 0.13)
  }

  const playSuccess = () => {
    const now = context.currentTime
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(now)
    osc.stop(now + 0.24)
  }

  const playFailure = () => {
    const now = context.currentTime
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(now)
    osc.stop(now + 0.22)
  }

  const playBonus = () => {
    const now = context.currentTime
    ;[523.25, 659.25, 783.99].forEach((frequency, index) => {
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(frequency, now + index * 0.04)
      gain.gain.setValueAtTime(0.0001, now + index * 0.04)
      gain.gain.exponentialRampToValueAtTime(0.05, now + index * 0.04 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.04 + 0.18)
      osc.connect(gain)
      gain.connect(masterGain)
      osc.start(now + index * 0.04)
      osc.stop(now + index * 0.04 + 0.2)
    })
  }

  return {
    context,
    setMasterMuted,
    setMusicMuted,
    resume: () => context.resume(),
    stop: () => {
      window.clearInterval(sequencerId)
      ;[padRoot, padThird, padFifth].forEach((voice) => {
        voice.osc.stop()
      })
      lfo.stop()
    },
    playLaser,
    playSuccess,
    playFailure,
    playBonus,
  }
}

const rememberRecentWord = (recentWordsByCategory, categoryId, text) => {
  const recentWords = recentWordsByCategory[categoryId] ?? []

  return {
    ...recentWordsByCategory,
    [categoryId]: [text, ...recentWords.filter((item) => item !== text)].slice(
      0,
      RECENT_WORD_MEMORY,
    ),
  }
}

const SpeakerIcon = ({ enabled }) => (
  <svg viewBox="0 0 24 24" role="presentation">
    <path d="M4 14h4l5 4V6L8 10H4z" fill="currentColor" />
    {enabled ? (
      <>
        <path
          d="M16 9a4 4 0 0 1 0 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18.5 6.5a7.5 7.5 0 0 1 0 11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ) : (
      <path
        d="M16 8l5 8M21 8l-5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    )}
  </svg>
)

const SoundToggleButton = ({ enabled, label, onClick }) => (
  <button className="sound-button sound-button-sidebar" onClick={onClick}>
    <span className="sound-icon" aria-hidden="true">
      <SpeakerIcon enabled={enabled} />
    </span>
    <span className="sound-label">{label}</span>
    <span className={`sound-toggle ${enabled ? 'sound-toggle-on' : 'sound-toggle-off'}`}>
      <span className={`sound-toggle-on-text ${enabled ? 'is-visible' : ''}`}>On</span>
      <span className="sound-toggle-thumb" aria-hidden="true" />
      <span className="sound-toggle-text">{enabled ? '' : 'Off'}</span>
    </span>
  </button>
)

const makeWordFactory = (languageId, cefrLevel) => {
  const categoryOrder = getCategoryOrder(languageId, cefrLevel)
  const categoryMap = getCategoryMap(languageId, cefrLevel)

  return (
    id,
    targetCategory,
    score,
    spawnCount,
    recentWordsByCategory = {},
    yRange = { min: 8, max: 36 },
  ) => {
    const shouldFavorTarget = spawnCount % 3 === 0 || Math.random() < 0.5
    const fallbackPool = categoryOrder.filter((item) => item !== targetCategory)
    const categoryId = shouldFavorTarget
      ? targetCategory
      : pickRandom(fallbackPool.length > 0 ? fallbackPool : categoryOrder)
    const category = categoryMap[categoryId]
    const recentWords = recentWordsByCategory[categoryId] ?? []
    const availableWords = category.words.filter((word) => !recentWords.includes(word))
    const text = pickRandom(availableWords.length > 0 ? availableWords : category.words)

    return {
      id,
      text,
      categoryId,
      x: 12 + Math.random() * 76,
      y: yRange.min + Math.random() * (yRange.max - yRange.min),
      speed: WORD_MIN_SPEED + Math.random() * WORD_MAX_SPEED + score * 0.12,
    }
  }
}

const buildInitialGame = (languageId, cefrLevel) => {
  const levelPack = getLevelPack(languageId, cefrLevel)
  const targetCategory = pickRandom(levelPack.categories).id
  const makeWord = makeWordFactory(languageId, cefrLevel)
  const initialWords = []
  let recentWordsByCategory = {}

  for (let index = 0; index < INITIAL_WORD_COUNT; index += 1) {
    const candidate = makeWord(
      index,
      targetCategory,
      0,
      index + 1,
      recentWordsByCategory,
      {
        min: INITIAL_WORD_Y_MIN,
        max: INITIAL_WORD_Y_MAX,
      },
    )
    initialWords.push(placeWordWithoutOverlap(candidate, initialWords))
    recentWordsByCategory = rememberRecentWord(
      recentWordsByCategory,
      candidate.categoryId,
      candidate.text,
    )
  }

  return {
    languageId,
    cefrLevel,
    playerX: 50,
    bullets: [],
    words: initialWords,
    effects: [],
    recentWordsByCategory,
    score: 0,
    bestScore: 0,
    streak: 0,
    phase: 1,
    nextCategorySwitchMs: CATEGORY_SWITCH_MS,
    roundTimeMs: ROUND_DURATION_MS,
    categoryAnnouncement: '',
    categoryAnnouncementMs: 0,
    streakAnnouncement: '',
    streakAnnouncementMs: 0,
    endReason: null,
    status: 'playing',
    targetCategory,
    feedback: `Mission loaded for ${LANGUAGE_PACKS[languageId].name} ${cefrLevel}. Shoot only the matching targets.`,
    feedbackTone: 'neutral',
  }
}

function App() {
  const [selection, setSelection] = useState(loadSettings)
  const [highScores, setHighScores] = useState(loadHighScores)
  const [game, setGame] = useState(() =>
    buildInitialGame(loadSettings().languageId, loadSettings().cefrLevel),
  )

  const gameRef = useRef(game)
  const keysRef = useRef(new Set())
  const rafRef = useRef(0)
  const lastFrameRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const lastShotRef = useRef(0)
  const bulletIdRef = useRef(0)
  const wordIdRef = useRef(INITIAL_WORD_COUNT)
  const spawnCountRef = useRef(INITIAL_WORD_COUNT)
  const effectIdRef = useRef(0)
  const audioRef = useRef(null)

  useEffect(() => {
    gameRef.current = game
  }, [game])

  useEffect(() => {
    audioRef.current = createAudioEngine()

    return () => {
      audioRef.current?.stop?.()
      if (audioRef.current?.context && audioRef.current.context.state !== 'closed') {
        audioRef.current.context.close()
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(highScores))
  }, [highScores])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(selection))
  }, [selection])

  useEffect(() => {
    if (!audioRef.current) {
      return
    }

    audioRef.current.setMasterMuted(!selection.musicEnabled && !selection.sfxEnabled)
    audioRef.current.setMusicMuted(!selection.musicEnabled)
  }, [selection.musicEnabled, selection.sfxEnabled])

  useEffect(() => {
    const highScoreKey = getHighScoreKey(game.languageId, game.cefrLevel)
    setHighScores((current) => {
      const previous = current[highScoreKey] ?? 0
      if (game.bestScore <= previous) {
        return current
      }

      return {
        ...current,
        [highScoreKey]: game.bestScore,
      }
    })
  }, [game.bestScore, game.cefrLevel, game.languageId])

  const resetGame = useCallback(
    (nextLanguage = selection.languageId, nextLevel = selection.cefrLevel) => {
      lastFrameRef.current = 0
      lastSpawnRef.current = 0
      lastShotRef.current = 0
      bulletIdRef.current = 0
      wordIdRef.current = INITIAL_WORD_COUNT
      spawnCountRef.current = INITIAL_WORD_COUNT
      effectIdRef.current = 0
      keysRef.current.clear()
      setGame(buildInitialGame(nextLanguage, nextLevel))
    },
    [selection.cefrLevel, selection.languageId],
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if (
        ['arrowleft', 'arrowright', 'a', 'd', ' '].includes(key) ||
        event.key === ' '
      ) {
        event.preventDefault()
      }

      if (event.key === ' ') {
        const now = performance.now()
        if (now - lastShotRef.current > 180) {
          lastShotRef.current = now
          audioRef.current?.resume()
          if (selection.sfxEnabled) {
            audioRef.current?.playLaser()
          }
          setGame((current) => ({
            ...current,
            bullets: [
              ...current.bullets,
              {
                id: bulletIdRef.current++,
                x: current.playerX,
                y: 82,
              },
            ],
            effects: current.effects,
          }))
        }
      }

      if (key === 'enter') {
        resetGame()
        return
      }

      keysRef.current.add(key)
    }

    const onKeyUp = (event) => {
      keysRef.current.delete(event.key.toLowerCase())
      if (event.key === ' ') {
        keysRef.current.delete(' ')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [resetGame, selection.sfxEnabled])

  useEffect(() => {
    if (game.status === 'gameover') {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setGame((current) => {
        if (current.status === 'gameover') {
          return current
        }

        const categoryOrder = getCategoryOrder(current.languageId, current.cefrLevel)
        const categoryMap = getCategoryMap(current.languageId, current.cefrLevel)
        const nextCategory = getNextCategoryId(categoryOrder, current.targetCategory)

        return {
          ...current,
          phase: current.phase + 1,
          targetCategory: nextCategory,
          nextCategorySwitchMs: CATEGORY_SWITCH_MS,
          categoryAnnouncement: `Shoot ${categoryMap[nextCategory].pluralLabel}`,
          categoryAnnouncementMs: CATEGORY_ANNOUNCEMENT_MS,
          feedback: `New target category: ${categoryMap[nextCategory].label}.`,
          feedbackTone: 'neutral',
        }
      })
    }, CATEGORY_SWITCH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [game.cefrLevel, game.languageId, game.status])

  useEffect(() => {
    const tick = (timestamp) => {
      if (!lastFrameRef.current) {
        lastFrameRef.current = timestamp
        lastSpawnRef.current = timestamp
      }

      const delta = (timestamp - lastFrameRef.current) / 1000
      lastFrameRef.current = timestamp

      setGame((current) => {
        if (current.status === 'gameover') {
          return current
        }

        const categoryMap = getCategoryMap(current.languageId, current.cefrLevel)
        const makeWord = makeWordFactory(current.languageId, current.cefrLevel)

        let playerDirection = 0
        if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
          playerDirection -= 1
        }
        if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
          playerDirection += 1
        }

        const nextPlayerX = clamp(
          current.playerX + playerDirection * PLAYER_SPEED * delta,
          8,
          92,
        )

        let nextBullets = current.bullets
          .map((bullet) => ({ ...bullet, y: bullet.y - BULLET_SPEED * delta }))
          .filter((bullet) => bullet.y > -5)

        let nextWords = current.words.map((word) => ({
          ...word,
          y: word.y + word.speed * delta,
        }))
        nextWords = gentlyResolveUnreadableOverlap(nextWords)
        let nextEffects = current.effects
          .map((effect) => ({ ...effect, ttl: effect.ttl - delta * 1000 }))
          .filter((effect) => effect.ttl > 0)
        let recentWordsByCategory = current.recentWordsByCategory

        let score = current.score
        let bestScore = current.bestScore
        let streak = current.streak
        let feedback = current.feedback
        let feedbackTone = current.feedbackTone
        const phase = current.phase
        const targetCategory = current.targetCategory
        const roundTimeMs = Math.max(0, current.roundTimeMs - delta * 1000)
        let categoryAnnouncement = current.categoryAnnouncement
        let categoryAnnouncementMs = Math.max(
          0,
          current.categoryAnnouncementMs - delta * 1000,
        )
        let streakAnnouncement = current.streakAnnouncement
        let streakAnnouncementMs = Math.max(
          0,
          current.streakAnnouncementMs - delta * 1000,
        )
        const nextCategorySwitchMs = Math.max(
          0,
          current.nextCategorySwitchMs - delta * 1000,
        )

        const spentBullets = new Set()
        const destroyedWords = new Set()

        nextBullets.forEach((bullet) => {
          const hitWord = nextWords.find(
            (word) => {
              if (destroyedWords.has(word.id)) {
                return false
              }

              const halfWidth = getWordBoxWidth(word.text) / 2
              const halfHeight = WORD_BOX_HEIGHT / 2

              return (
                bullet.x >= word.x - halfWidth &&
                bullet.x <= word.x + halfWidth &&
                bullet.y >= word.y - halfHeight &&
                bullet.y <= word.y + halfHeight
              )
            },
          )

          if (!hitWord) {
            return
          }

          spentBullets.add(bullet.id)
          destroyedWords.add(hitWord.id)

          if (hitWord.categoryId === targetCategory) {
            score += CORRECT_HIT_POINTS
            bestScore = Math.max(bestScore, score)
            streak += 1
            feedback = `"${hitWord.text}" is correct. +${CORRECT_HIT_POINTS} points.`
            feedbackTone = 'good'
            nextEffects = [
              ...nextEffects,
              {
                id: effectIdRef.current++,
                x: hitWord.x,
                y: hitWord.y,
                tone: 'good',
                label: `+${CORRECT_HIT_POINTS}`,
                ttl: EFFECT_LIFETIME_MS,
              },
            ]
            if (selection.sfxEnabled) {
              audioRef.current?.playSuccess()
            }

            if (streak > 0 && streak % STREAK_BONUS_THRESHOLD === 0) {
              score += STREAK_BONUS_POINTS
              bestScore = Math.max(bestScore, score)
              feedback = `Streak bonus! ${streak} correct hits in a row. +${STREAK_BONUS_POINTS} points.`
              nextEffects = [
                ...nextEffects,
                {
                  id: effectIdRef.current++,
                  x: hitWord.x,
                  y: Math.max(8, hitWord.y - 6),
                  tone: 'bonus',
                  label: `BONUS +${STREAK_BONUS_POINTS}`,
                  ttl: EFFECT_LIFETIME_MS + 180,
                },
              ]
              streakAnnouncement = `${streak} word streak bonus!`
              streakAnnouncementMs = STREAK_ANNOUNCEMENT_MS
              if (selection.sfxEnabled) {
                audioRef.current?.playBonus()
              }
            }
          } else {
            score -= WRONG_HIT_POINTS
            streak = 0
            feedback = `"${hitWord.text}" belongs to ${categoryMap[hitWord.categoryId].label.toLowerCase()}, not your current target. -${WRONG_HIT_POINTS} point.`
            feedbackTone = 'bad'
            nextEffects = [
              ...nextEffects,
              {
                id: effectIdRef.current++,
                x: hitWord.x,
                y: hitWord.y,
                tone: 'bad',
                label: `-${WRONG_HIT_POINTS}`,
                ttl: EFFECT_LIFETIME_MS,
              },
            ]
            if (selection.sfxEnabled) {
              audioRef.current?.playFailure()
            }
          }
        })

        nextBullets = nextBullets.filter((bullet) => !spentBullets.has(bullet.id))
        nextWords = nextWords.filter((word) => !destroyedWords.has(word.id))

        const slippedWords = nextWords.filter((word) => word.y >= 96)
        if (slippedWords.some((word) => word.categoryId === targetCategory)) {
          score -= MISSED_TARGET_POINTS
          streak = 0
          feedback = `A correct target escaped. -${MISSED_TARGET_POINTS} point.`
          feedbackTone = 'bad'
          const missedTarget = slippedWords.find((word) => word.categoryId === targetCategory)
          if (missedTarget) {
            nextEffects = [
              ...nextEffects,
              {
                id: effectIdRef.current++,
                x: missedTarget.x,
                y: 92,
                tone: 'bad',
                label: `-${MISSED_TARGET_POINTS}`,
                ttl: EFFECT_LIFETIME_MS,
              },
            ]
          }
          if (selection.sfxEnabled) {
            audioRef.current?.playFailure()
          }
        }
        nextWords = nextWords.filter((word) => word.y < 96)

        const spawnDue = timestamp - lastSpawnRef.current >= WORD_SPAWN_MS

        if (spawnDue || nextWords.length < MIN_ACTIVE_WORDS) {
          lastSpawnRef.current = timestamp

          while (nextWords.length < MIN_ACTIVE_WORDS) {
            spawnCountRef.current += 1
            const candidate = makeWord(
              wordIdRef.current++,
              targetCategory,
              score,
              spawnCountRef.current,
              recentWordsByCategory,
            )
            const placedWord = placeWordWithoutOverlap(candidate, nextWords)
            nextWords = [...nextWords, placedWord]
            recentWordsByCategory = rememberRecentWord(
              recentWordsByCategory,
              placedWord.categoryId,
              placedWord.text,
            )
          }

          if (spawnDue) {
            spawnCountRef.current += 1
            const candidate = makeWord(
              wordIdRef.current++,
              targetCategory,
              score,
              spawnCountRef.current,
              recentWordsByCategory,
            )
            const placedWord = placeWordWithoutOverlap(candidate, nextWords)
            nextWords = [...nextWords, placedWord]
            recentWordsByCategory = rememberRecentWord(
              recentWordsByCategory,
              placedWord.categoryId,
              placedWord.text,
            )
          }
        }
        if (score <= 0 && current.score > 0) {
          return {
            ...current,
            playerX: nextPlayerX,
            bullets: [],
            words: nextWords,
            effects: nextEffects,
            recentWordsByCategory,
            score: 0,
            bestScore,
            streak: 0,
            phase,
            targetCategory,
            roundTimeMs,
            categoryAnnouncement: '',
            categoryAnnouncementMs: 0,
            streakAnnouncement: '',
            streakAnnouncementMs: 0,
            nextCategorySwitchMs: 0,
            endReason: 'score',
            status: 'gameover',
            feedback: `Game over. Highest score this run: ${bestScore}. Press Enter or restart to try again.`,
            feedbackTone: 'bad',
          }
        }

        if (roundTimeMs <= 0) {
          return {
            ...current,
            playerX: nextPlayerX,
            bullets: [],
            words: nextWords,
            effects: nextEffects,
            score,
            bestScore,
            streak,
            phase,
            targetCategory,
            roundTimeMs: 0,
            categoryAnnouncement: '',
            categoryAnnouncementMs: 0,
            streakAnnouncement: '',
            streakAnnouncementMs: 0,
            nextCategorySwitchMs: 0,
            endReason: 'time',
            status: 'gameover',
            feedback: `Round complete. Highest score this run: ${bestScore}. Press Enter or restart to play again.`,
            feedbackTone: 'good',
          }
        }

        score = Math.max(score, 0)

        return {
          ...current,
          playerX: nextPlayerX,
          bullets: nextBullets,
          words: nextWords,
          effects: nextEffects,
          recentWordsByCategory,
          score,
          bestScore,
          streak,
          phase,
          targetCategory,
          roundTimeMs,
          categoryAnnouncement,
          categoryAnnouncementMs,
          streakAnnouncement,
          streakAnnouncementMs,
          endReason: null,
          status: 'playing',
          nextCategorySwitchMs,
          feedback,
          feedbackTone,
        }
      })

      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(rafRef.current)
    }
  }, [selection.sfxEnabled])

  const levelPack = getLevelPack(game.languageId, game.cefrLevel)
  const categoryMap = getCategoryMap(game.languageId, game.cefrLevel)
  const targetCategory = categoryMap[game.targetCategory]
  const targetStyle = CATEGORY_STYLES[game.targetCategory]
  const languages = getLanguageNames()
  const roundProgress = game.roundTimeMs / ROUND_DURATION_MS
  const selectedHighScore =
    highScores[getHighScoreKey(selection.languageId, selection.cefrLevel)] ?? 0

  const handleLanguageChange = (event) => {
    const languageId = event.target.value
    const nextSelection = {
      languageId,
      cefrLevel: selection.cefrLevel,
      musicEnabled: selection.musicEnabled,
      sfxEnabled: selection.sfxEnabled,
    }
    setSelection(nextSelection)
    resetGame(nextSelection.languageId, nextSelection.cefrLevel)
  }

  const handleLevelChange = (event) => {
    const cefrLevel = event.target.value
    const nextSelection = {
      languageId: selection.languageId,
      cefrLevel,
      musicEnabled: selection.musicEnabled,
      sfxEnabled: selection.sfxEnabled,
    }
    setSelection(nextSelection)
    resetGame(nextSelection.languageId, nextSelection.cefrLevel)
  }

  const toggleMusic = () => {
    audioRef.current?.resume()
    setSelection((current) => ({
      ...current,
      musicEnabled: !current.musicEnabled,
    }))
  }

  const toggleSfx = () => {
    audioRef.current?.resume()
    setSelection((current) => ({
      ...current,
      sfxEnabled: !current.sfxEnabled,
    }))
  }

  return (
    <main className="game-shell">
      <section className="hero-panel">
        <div>
          <h1>Wordshooter</h1>
          <p className="intro">
            Choose a language and CEFR level, then steer the ship and shoot only
            the vocabulary or grammar forms that match the active category.
          </p>
        </div>
      </section>

      <section className="play-layout">
        <aside className="sidebar sidebar-left">
          <section className="setup-panel">
            <label className="select-card">
              <span>Language</span>
              <select value={selection.languageId} onChange={handleLanguageChange}>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="select-card">
              <span>CEFR level</span>
              <select value={selection.cefrLevel} onChange={handleLevelChange}>
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <div className="select-card curriculum-card">
              <span>Curriculum focus</span>
              <strong>{levelPack.label}</strong>
              <p>{levelPack.categories.map((category) => category.label).join(' · ')}</p>
            </div>
          </section>

          <section className="controls-panel">
            <div className="control-chip">
              <span>Move</span>
              <strong>A / D or Arrow keys</strong>
            </div>
            <div className="control-chip">
              <span>Fire</span>
              <strong>Space</strong>
            </div>
            <div className="control-chip">
              <span>Progression</span>
              <strong>Target rotates through CEFR-appropriate categories over time</strong>
            </div>
          </section>
        </aside>

        <section className="arena-panel">
        <div className="arena-header">
          <p className="arena-kicker">
            {LANGUAGE_PACKS[game.languageId].name} · {game.cefrLevel}
          </p>
          <button className="restart-button" onClick={() => resetGame()}>
            Restart run
          </button>
        </div>

        <div className="round-progress">
          <div className="round-progress-copy">
            <span>Round time</span>
            <strong>{Math.ceil(game.roundTimeMs / 1000)}s</strong>
          </div>
          <div className="round-progress-track" aria-hidden="true">
            <div
              className="round-progress-fill"
              style={{ transform: `scaleX(${roundProgress})` }}
            />
          </div>
        </div>

        <div className="mission-card mission-card-inline">
          <p className="mission-label">Current target</p>
          <strong style={{ color: targetStyle.color }}>{targetCategory.label}</strong>
          <span>{targetCategory.description}</span>
        </div>

        <div className="arena">
          <div className="starfield starfield-a" />
          <div className="starfield starfield-b" />

          {game.words.map((word) => {
            return (
              <div
                key={word.id}
                className="word-target"
                style={{
                  left: `${(word.x / ARENA.width) * 100}%`,
                  top: `${(word.y / ARENA.height) * 100}%`,
                }}
              >
                {word.text}
              </div>
            )
          })}

          {game.effects.map((effect) => (
            <div
              key={effect.id}
              className={`hit-effect hit-effect-${effect.tone}`}
              style={{
                left: `${(effect.x / ARENA.width) * 100}%`,
                top: `${(effect.y / ARENA.height) * 100}%`,
              }}
            >
              <div className="hit-burst" />
              <span>{effect.label}</span>
            </div>
          ))}

          {game.bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="bullet"
              style={{
                left: `${(bullet.x / ARENA.width) * 100}%`,
                top: `${(bullet.y / ARENA.height) * 100}%`,
              }}
            />
          ))}

          <div
            className="spaceship"
            style={{ left: `${(game.playerX / ARENA.width) * 100}%` }}
          >
            <div className="ship-cockpit" />
            <div className="ship-wing ship-wing-left" />
            <div className="ship-wing ship-wing-right" />
            <div className="ship-engine ship-engine-left" />
            <div className="ship-engine ship-engine-right" />
          </div>

          {game.categoryAnnouncementMs > 0 ? (
            <div className="category-popup">
              <span>New target</span>
              <strong>{game.categoryAnnouncement}</strong>
            </div>
          ) : null}

          {game.streakAnnouncementMs > 0 ? (
            <div className="streak-popup">
              <span>Bonus unlocked</span>
              <strong>{game.streakAnnouncement}</strong>
            </div>
          ) : null}

          {game.status === 'gameover' ? (
            <div className="overlay">
              <p>{game.endReason === 'time' ? 'Round complete' : 'Game over'}</p>
              <h3>Score: {game.bestScore}</h3>
              <span>Press Enter or restart to launch again.</span>
            </div>
          ) : null}

        </div>

        <div className={`feedback feedback-${game.feedbackTone}`}>{game.feedback}</div>
        </section>

        <aside className="sidebar sidebar-right">
          <section className="hud">
            <div className="hud-card">
              <span>Score</span>
              <strong>{game.score}</strong>
            </div>
            <div className="hud-card">
              <span>Streak</span>
              <strong>{game.streak}</strong>
            </div>
            <div className="hud-card">
              <span>Next switch</span>
              <strong>{(game.nextCategorySwitchMs / 1000).toFixed(1)}s</strong>
            </div>
            <div className="hud-card">
              <span>High score</span>
              <strong>{selectedHighScore}</strong>
            </div>
            <SoundToggleButton
              enabled={selection.musicEnabled}
              label="Music"
              onClick={toggleMusic}
            />
            <SoundToggleButton
              enabled={selection.sfxEnabled}
              label="FX"
              onClick={toggleSfx}
            />
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App
