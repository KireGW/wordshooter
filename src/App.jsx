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
const WORD_MIN_SPEED = 4.7
const WORD_MAX_SPEED = 8.1
const DESKTOP_MIN_ACTIVE_WORDS = 4
const DESKTOP_INITIAL_WORD_COUNT = 3
const DESKTOP_MAX_ACTIVE_WORDS = 5
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
const ACTIVE_SPAWN_Y_MIN = -8
const ACTIVE_SPAWN_Y_MAX = 9
const DESKTOP_CATEGORY_SWITCH_SAFE_Y = 58
const MOBILE_CATEGORY_SWITCH_SAFE_Y = 52
const CATEGORY_SWITCH_RESPAWN_Y_MAX = 10
const WORD_BOX_HEIGHT = 6
const WORD_CHAR_WIDTH = 1.15
const WORD_BOX_PADDING = 3.2
const MOBILE_WORD_BOX_HEIGHT = 6.8
const MOBILE_WORD_CHAR_WIDTH = 1.22
const MOBILE_WORD_BOX_PADDING = 4.3
const WORD_BOX_BORDER_ALLOWANCE = 0.45
const BULLET_HITBOX_RADIUS_X = 0.65
const BULLET_HITBOX_RADIUS_Y = 1.15
const SHIP_LEVEL_HIT_Y = 80
const SHIP_LEVEL_HITBOX_BONUS_X = 0.7
const SHIP_LEVEL_HITBOX_BONUS_Y = 1.4
const WORD_OVERLAP_ALLOWANCE = 0.2
const MAX_READABILITY_OVERLAP = 0.7
const EFFECT_LIFETIME_MS = 550
const HIGH_SCORE_STORAGE_KEY = 'wordshooter-highscores'
const SETTINGS_STORAGE_KEY = 'wordshooter-settings'
const RECENT_WORD_MEMORY = 4
const STREAK_ANNOUNCEMENT_MS = 1500
const DEFAULT_MUSIC_ENABLED = false
const DEFAULT_SFX_ENABLED = false
const MOBILE_LAYOUT_MEDIA_QUERY = '(max-width: 720px), (pointer: coarse)'
const LANGUAGE_FLAGS = {
  english: '🇬🇧',
  french: '🇫🇷',
  spanish: '🇪🇸',
  italian: '🇮🇹',
  german: '🇩🇪',
  swedish: '🇸🇪',
}
const TARGET_UI_TRANSLATIONS = {
  english: {
    currentTarget: 'Current target',
    newTarget: 'New target',
    categories: {
      noun: { label: 'Nouns', description: 'people, places, things, or ideas' },
      verb: { label: 'Verbs', description: 'action or state words' },
      adjective: { label: 'Adjectives', description: 'describing words' },
      adverb: { label: 'Adverbs', description: 'words that modify actions or descriptions' },
      pronoun: { label: 'Pronouns', description: 'replacement words like I, she, they' },
      past: { label: 'Past Forms', description: 'forms used for completed past actions' },
      future: { label: 'Future Forms', description: 'forms used to talk about the future' },
      modal: { label: 'Modal Forms', description: 'forms for ability, obligation, or possibility' },
      connective: { label: 'Connectives', description: 'linking words for longer sentences' },
      subjunctive: { label: 'Subjunctive', description: 'forms for wishes, doubt, or hypotheticals' },
      idiom: { label: 'Idioms', description: 'fixed advanced expressions' },
    },
  },
  french: {
    currentTarget: 'Cible actuelle',
    newTarget: 'Nouvelle cible',
    categories: {
      noun: { label: 'Noms', description: 'personnes, lieux, choses ou idées' },
      verb: { label: 'Verbes', description: "mots d'action ou d'état" },
      adjective: { label: 'Adjectifs', description: 'mots qui décrivent' },
      adverb: { label: 'Adverbes', description: "mots qui modifient l'action ou la description" },
      pronoun: { label: 'Pronoms', description: 'mots de remplacement comme je, elle, ils' },
      past: { label: 'Formes du passé', description: 'formes pour parler d’actions passées' },
      future: { label: 'Formes du futur', description: 'formes pour parler du futur' },
      modal: { label: 'Formes modales', description: 'formes de capacité, obligation ou possibilité' },
      connective: { label: 'Connecteurs', description: 'mots qui relient les phrases' },
      subjunctive: { label: 'Subjonctif', description: 'formes de souhait, doute ou hypothèse' },
      idiom: { label: 'Expressions', description: 'expressions figées avancées' },
    },
  },
  spanish: {
    currentTarget: 'Objetivo actual',
    newTarget: 'Nuevo objetivo',
    categories: {
      noun: { label: 'Sustantivos', description: 'personas, lugares, cosas o ideas' },
      verb: { label: 'Verbos', description: 'palabras de acción o estado' },
      adjective: { label: 'Adjetivos', description: 'palabras que describen' },
      adverb: { label: 'Adverbios', description: 'palabras que modifican acciones o descripciones' },
      pronoun: { label: 'Pronombres', description: 'palabras de reemplazo como yo, ella, ellos' },
      past: { label: 'Formas del pasado', description: 'formas para acciones ya terminadas' },
      future: { label: 'Formas del futuro', description: 'formas para hablar del futuro' },
      modal: { label: 'Formas modales', description: 'formas de habilidad, obligación o posibilidad' },
      connective: { label: 'Conectores', description: 'palabras para unir frases' },
      subjunctive: { label: 'Subjuntivo', description: 'formas para deseo, duda o hipótesis' },
      idiom: { label: 'Expresiones', description: 'expresiones fijas avanzadas' },
    },
  },
  italian: {
    currentTarget: 'Obiettivo attuale',
    newTarget: 'Nuovo obiettivo',
    categories: {
      noun: { label: 'Sostantivi', description: 'persone, luoghi, cose o idee' },
      verb: { label: 'Verbi', description: 'parole di azione o stato' },
      adjective: { label: 'Aggettivi', description: 'parole che descrivono' },
      adverb: { label: 'Avverbi', description: 'parole che modificano azioni o descrizioni' },
      pronoun: { label: 'Pronomi', description: 'parole sostitutive come io, lei, loro' },
      past: { label: 'Forme del passato', description: 'forme per azioni passate concluse' },
      future: { label: 'Forme del futuro', description: 'forme per parlare del futuro' },
      modal: { label: 'Forme modali', description: 'forme di capacità, obbligo o possibilità' },
      connective: { label: 'Connettivi', description: 'parole che collegano frasi più lunghe' },
      subjunctive: { label: 'Congiuntivo', description: 'forme per desiderio, dubbio o ipotesi' },
      idiom: { label: 'Espressioni', description: 'espressioni fisse avanzate' },
    },
  },
  german: {
    currentTarget: 'Aktuelles Ziel',
    newTarget: 'Neues Ziel',
    categories: {
      noun: { label: 'Nomen', description: 'Personen, Orte, Dinge oder Ideen' },
      verb: { label: 'Verben', description: 'Handlungs- oder Zustandswörter' },
      adjective: { label: 'Adjektive', description: 'beschreibende Wörter' },
      adverb: { label: 'Adverbien', description: 'Wörter, die Handlungen oder Beschreibungen verändern' },
      pronoun: { label: 'Pronomen', description: 'Stellvertreter wie ich, sie, sie' },
      past: { label: 'Vergangenheitsformen', description: 'Formen für abgeschlossene Vergangenheitsaktionen' },
      future: { label: 'Zukunftsformen', description: 'Formen für Aussagen über die Zukunft' },
      modal: { label: 'Modalformen', description: 'Formen für Fähigkeit, Pflicht oder Möglichkeit' },
      connective: { label: 'Konnektoren', description: 'Verbindungswörter für längere Sätze' },
      subjunctive: { label: 'Konjunktiv', description: 'Formen für Wunsch, Zweifel oder Hypothesen' },
      idiom: { label: 'Redewendungen', description: 'feste fortgeschrittene Ausdrücke' },
    },
  },
  swedish: {
    currentTarget: 'Nuvarande mål',
    newTarget: 'Nytt mål',
    categories: {
      noun: { label: 'Substantiv', description: 'personer, platser, saker eller idéer' },
      verb: { label: 'Verb', description: 'ord för handling eller tillstånd' },
      adjective: { label: 'Adjektiv', description: 'ord som beskriver' },
      adverb: { label: 'Adverb', description: 'ord som ändrar handlingar eller beskrivningar' },
      pronoun: { label: 'Pronomen', description: 'ersättningsord som jag, hon, de' },
      past: { label: 'Dåtidsformer', description: 'former för avslutade handlingar i dåtid' },
      future: { label: 'Futurumformer', description: 'former för att tala om framtiden' },
      modal: { label: 'Modala former', description: 'former för förmåga, skyldighet eller möjlighet' },
      connective: { label: 'Sambandsord', description: 'ord som binder ihop längre meningar' },
      subjunctive: { label: 'Konjunktiv', description: 'former för önskan, tvivel eller hypoteser' },
      idiom: { label: 'Idiom', description: 'fasta avancerade uttryck' },
    },
  },
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const pickRandom = (items) => items[Math.floor(Math.random() * items.length)]
const getCategorySwitchSafeY = (isMobileLayout) =>
  isMobileLayout ? MOBILE_CATEGORY_SWITCH_SAFE_Y : DESKTOP_CATEGORY_SWITCH_SAFE_Y

const getWordBudget = (isMobileLayout, viewportSize) => {
  if (!isMobileLayout) {
    return {
      initialCount: DESKTOP_INITIAL_WORD_COUNT,
      minActiveWords: DESKTOP_MIN_ACTIVE_WORDS,
      maxActiveWords: DESKTOP_MAX_ACTIVE_WORDS,
    }
  }

  const { width, height } = viewportSize
  if (width <= 390 || height <= 760) {
    return {
      initialCount: 2,
      minActiveWords: 2,
      maxActiveWords: 3,
    }
  }

  if (width <= 480 || height <= 860) {
    return {
      initialCount: 2,
      minActiveWords: 3,
      maxActiveWords: 4,
    }
  }

  return {
    initialCount: 3,
    minActiveWords: 3,
    maxActiveWords: 4,
  }
}
const getWordBoxMetrics = (text, isMobileLayout = false) => {
  const charWidth = isMobileLayout ? MOBILE_WORD_CHAR_WIDTH : WORD_CHAR_WIDTH
  const boxPadding = isMobileLayout ? MOBILE_WORD_BOX_PADDING : WORD_BOX_PADDING
  const boxHeight = isMobileLayout ? MOBILE_WORD_BOX_HEIGHT : WORD_BOX_HEIGHT

  return {
    width: text.length * charWidth + boxPadding + WORD_BOX_BORDER_ALLOWANCE * 2,
    height: boxHeight + WORD_BOX_BORDER_ALLOWANCE * 2,
  }
}

const getWordBounds = (word, isMobileLayout = false) => {
  const metrics = getWordBoxMetrics(word.text, isMobileLayout)
  const halfWidth = metrics.width / 2
  const halfHeight = metrics.height / 2

  return {
    left: word.x - halfWidth,
    right: word.x + halfWidth,
    top: word.y - halfHeight,
    bottom: word.y + halfHeight,
    halfWidth,
    halfHeight,
  }
}

const segmentIntersectsRect = (x1, y1, x2, y2, rect) => {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  if (
    maxX < rect.left ||
    minX > rect.right ||
    maxY < rect.top ||
    minY > rect.bottom
  ) {
    return false
  }

  if (
    (x1 >= rect.left && x1 <= rect.right && y1 >= rect.top && y1 <= rect.bottom) ||
    (x2 >= rect.left && x2 <= rect.right && y2 >= rect.top && y2 <= rect.bottom)
  ) {
    return true
  }

  const dx = x2 - x1
  const dy = y2 - y1
  let tMin = 0
  let tMax = 1

  const clip = (p, q) => {
    if (p === 0) {
      return q >= 0
    }

    const t = q / p
    if (p < 0) {
      if (t > tMax) {
        return false
      }
      if (t > tMin) {
        tMin = t
      }
    } else {
      if (t < tMin) {
        return false
      }
      if (t < tMax) {
        tMax = t
      }
    }

    return true
  }

  return (
    clip(-dx, x1 - rect.left) &&
    clip(dx, rect.right - x1) &&
    clip(-dy, y1 - rect.top) &&
    clip(dy, rect.bottom - y1) &&
    tMin <= tMax
  )
}

const wordsOverlap = (firstWord, secondWord, isMobileLayout = false, padding = 1.4) => {
  const first = getWordBounds(firstWord, isMobileLayout)
  const second = getWordBounds(secondWord, isMobileLayout)
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

const gentlyResolveUnreadableOverlap = (words, isMobileLayout = false) => {
  const adjusted = words.map((word) => ({ ...word }))

  for (let i = 0; i < adjusted.length; i += 1) {
    for (let j = i + 1; j < adjusted.length; j += 1) {
      const first = getWordBounds(adjusted[i], isMobileLayout)
      const second = getWordBounds(adjusted[j], isMobileLayout)
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

const placeWordWithoutOverlap = (
  candidate,
  existingWords,
  isMobileLayout = false,
  maxAttempts = 8,
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const collides = existingWords.some((word) =>
      wordsOverlap(candidate, word, isMobileLayout),
    )
    if (!collides) {
      return candidate
    }

    candidate = {
      ...candidate,
      x: 12 + Math.random() * 76,
      y: clamp(candidate.y + 2 + Math.random() * 4, ACTIVE_SPAWN_Y_MIN, ACTIVE_SPAWN_Y_MAX + 3),
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

const pickCategoryWordText = (categoryMap, categoryId, recentWordsByCategory = {}) => {
  const category = categoryMap[categoryId]
  const recentWords = recentWordsByCategory[categoryId] ?? []
  const availableWords = category.words.filter((word) => !recentWords.includes(word))

  return pickRandom(availableWords.length > 0 ? availableWords : category.words)
}

const makeSpecificCategoryWord = ({
  id,
  categoryId,
  score,
  categoryMap,
  recentWordsByCategory = {},
  yRange = { min: INITIAL_WORD_Y_MIN, max: CATEGORY_SWITCH_RESPAWN_Y_MAX },
}) => ({
  id,
  text: pickCategoryWordText(categoryMap, categoryId, recentWordsByCategory),
  categoryId,
  x: 12 + Math.random() * 76,
  y: yRange.min + Math.random() * (yRange.max - yRange.min),
  speed: WORD_MIN_SPEED + Math.random() * WORD_MAX_SPEED + score * 0.12,
})

const makeWordFactory = (languageId, cefrLevel) => {
  const categoryOrder = getCategoryOrder(languageId, cefrLevel)
  const categoryMap = getCategoryMap(languageId, cefrLevel)

  return (
    id,
    targetCategory,
    score,
    spawnCount,
    recentWordsByCategory = {},
    yRange = { min: ACTIVE_SPAWN_Y_MIN, max: ACTIVE_SPAWN_Y_MAX },
  ) => {
    const shouldFavorTarget = spawnCount % 3 === 0 || Math.random() < 0.5
    const fallbackPool = categoryOrder.filter((item) => item !== targetCategory)
    const categoryId = shouldFavorTarget
      ? targetCategory
      : pickRandom(fallbackPool.length > 0 ? fallbackPool : categoryOrder)
    return makeSpecificCategoryWord({
      id,
      categoryId,
      score,
      categoryMap,
      recentWordsByCategory,
      yRange,
    })
  }
}

const buildInitialGame = (languageId, cefrLevel, wordBudget, isMobileLayout = false) => {
  const levelPack = getLevelPack(languageId, cefrLevel)
  const targetCategory = pickRandom(levelPack.categories).id
  const makeWord = makeWordFactory(languageId, cefrLevel)
  const initialWords = []
  let recentWordsByCategory = {}

  for (let index = 0; index < wordBudget.initialCount; index += 1) {
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
    initialWords.push(placeWordWithoutOverlap(candidate, initialWords, isMobileLayout))
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false)
  const [targetUiLanguage, setTargetUiLanguage] = useState('english')
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
  }))
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
  })
  const [game, setGame] = useState(() =>
    buildInitialGame(
      loadSettings().languageId,
      loadSettings().cefrLevel,
      getWordBudget(
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
          ? window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
          : false,
        {
          width: typeof window === 'undefined' ? 1280 : window.innerWidth,
          height: typeof window === 'undefined' ? 800 : window.innerHeight,
        },
      ),
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
        : false,
    ),
  )

  const gameRef = useRef(game)
  const keysRef = useRef(new Set())
  const rafRef = useRef(0)
  const lastFrameRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const lastShotRef = useRef(0)
  const wordBudget = getWordBudget(isMobileLayout, viewportSize)
  const bulletIdRef = useRef(0)
  const wordIdRef = useRef(wordBudget.initialCount)
  const spawnCountRef = useRef(wordBudget.initialCount)
  const effectIdRef = useRef(0)
  const audioRef = useRef(null)
  const arenaRef = useRef(null)
  const controlLineRef = useRef(null)
  const controlTouchStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
  })

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
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY)
    const syncLayout = () => {
      setIsMobileLayout(mediaQuery.matches)
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    syncLayout()
    mediaQuery.addEventListener('change', syncLayout)

    return () => {
      mediaQuery.removeEventListener('change', syncLayout)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (!isMobileLayout) {
      setMobileMenuOpen(false)
      setLanguagePickerOpen(false)
    }
  }, [isMobileLayout])

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
      wordIdRef.current = wordBudget.initialCount
      spawnCountRef.current = wordBudget.initialCount
      effectIdRef.current = 0
      keysRef.current.clear()
      setGame(buildInitialGame(nextLanguage, nextLevel, wordBudget, isMobileLayout))
    },
    [isMobileLayout, selection.cefrLevel, selection.languageId, wordBudget],
  )

  const fireBullet = useCallback(() => {
    const now = performance.now()
    if (now - lastShotRef.current <= 180) {
      return
    }

    lastShotRef.current = now
    audioRef.current?.resume()
    if (selection.sfxEnabled) {
      audioRef.current?.playLaser()
    }

    setGame((current) => {
      if (current.status === 'gameover') {
        return current
      }

      return {
        ...current,
        bullets: [
          ...current.bullets,
          {
            id: bulletIdRef.current++,
            x: current.playerX,
            y: 82,
          },
        ],
      }
    })
  }, [selection.sfxEnabled])

  const movePlayerToClientX = useCallback((clientX, surface = arenaRef.current) => {
    if (!surface) {
      return
    }

    const bounds = surface.getBoundingClientRect()
    const relativeX = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const nextPlayerX = 8 + relativeX * 84

    setGame((current) => ({
      ...current,
      playerX: nextPlayerX,
    }))
  }, [])

  const handleArenaPointerDown = useCallback(
    (event) => {
      if (!isMobileLayout) {
        return
      }

      if (event.pointerType === 'mouse' && window.innerWidth > 720) {
        return
      }

      event.currentTarget.setPointerCapture?.(event.pointerId)
      movePlayerToClientX(event.clientX)
    },
    [isMobileLayout, movePlayerToClientX],
  )

  const handleArenaPointerMove = useCallback(
    (event) => {
      if (!isMobileLayout) {
        return
      }

      const isTouchLike = event.pointerType !== 'mouse' || window.innerWidth <= 720
      if (!isTouchLike || (event.buttons === 0 && event.pointerType === 'mouse')) {
        return
      }

      movePlayerToClientX(event.clientX)
    },
    [isMobileLayout, movePlayerToClientX],
  )

  const handleControlPointerDown = useCallback(
    (event) => {
      if (!isMobileLayout) {
        return
      }

      event.currentTarget.setPointerCapture?.(event.pointerId)
      controlTouchStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      }
      movePlayerToClientX(event.clientX, controlLineRef.current)
    },
    [isMobileLayout, movePlayerToClientX],
  )

  const handleControlPointerMove = useCallback(
    (event) => {
      if (!isMobileLayout || controlTouchStateRef.current.pointerId !== event.pointerId) {
        return
      }

      const deltaX = Math.abs(event.clientX - controlTouchStateRef.current.startX)
      const deltaY = Math.abs(event.clientY - controlTouchStateRef.current.startY)
      if (deltaX > 6 || deltaY > 6) {
        controlTouchStateRef.current.moved = true
      }

      movePlayerToClientX(event.clientX, controlLineRef.current)
    },
    [isMobileLayout, movePlayerToClientX],
  )

  const handleControlPointerUp = useCallback(
    (event) => {
      if (!isMobileLayout || controlTouchStateRef.current.pointerId !== event.pointerId) {
        return
      }

      const shouldFire = !controlTouchStateRef.current.moved
      controlTouchStateRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        moved: false,
      }

      if (shouldFire) {
        fireBullet()
      }
    },
    [fireBullet, isMobileLayout],
  )

  const handleShipClick = useCallback(
    (event) => {
      event.stopPropagation()
      fireBullet()
    },
    [fireBullet],
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
        fireBullet()
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
  }, [fireBullet, resetGame])

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
        const categorySwitchSafeY = getCategorySwitchSafeY(isMobileLayout)
        const wordsTooLowForNewTarget = current.words.filter(
          (word) => word.categoryId === nextCategory && word.y >= categorySwitchSafeY,
        )
        const preservedWords = current.words.filter(
          (word) => !(word.categoryId === nextCategory && word.y >= categorySwitchSafeY),
        )
        let adjustedWords = [...preservedWords]
        let recentWordsByCategory = current.recentWordsByCategory

        wordsTooLowForNewTarget.forEach(() => {
          const replacement = placeWordWithoutOverlap(
            makeSpecificCategoryWord({
              id: wordIdRef.current++,
              categoryId: nextCategory,
              score: current.score,
              categoryMap,
              recentWordsByCategory,
            }),
            adjustedWords,
            isMobileLayout,
          )
          adjustedWords.push(replacement)
          recentWordsByCategory = rememberRecentWord(
            recentWordsByCategory,
            replacement.categoryId,
            replacement.text,
          )
        })

        return {
          ...current,
          words: adjustedWords,
          recentWordsByCategory,
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
  }, [game.cefrLevel, game.languageId, game.status, isMobileLayout])

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
          .map((bullet) => ({
            ...bullet,
            previousY: bullet.y,
            y: bullet.y - BULLET_SPEED * delta,
          }))
          .filter((bullet) => bullet.y > -5)

        let nextWords = current.words.map((word) => ({
          ...word,
          y: word.y + word.speed * delta,
        }))
        nextWords = gentlyResolveUnreadableOverlap(nextWords, isMobileLayout)
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

              const isNearShipLevel = word.y >= SHIP_LEVEL_HIT_Y
              const bounds = getWordBounds(word, isMobileLayout)
              const rect = {
                left:
                  bounds.left -
                  BULLET_HITBOX_RADIUS_X -
                  (isNearShipLevel ? SHIP_LEVEL_HITBOX_BONUS_X : 0),
                right:
                  bounds.right +
                  BULLET_HITBOX_RADIUS_X +
                  (isNearShipLevel ? SHIP_LEVEL_HITBOX_BONUS_X : 0),
                top:
                  bounds.top -
                  BULLET_HITBOX_RADIUS_Y -
                  (isNearShipLevel ? SHIP_LEVEL_HITBOX_BONUS_Y : 0),
                bottom:
                  bounds.bottom +
                  BULLET_HITBOX_RADIUS_Y +
                  (isNearShipLevel ? SHIP_LEVEL_HITBOX_BONUS_Y : 0),
              }

              return segmentIntersectsRect(
                bullet.x,
                bullet.previousY ?? bullet.y,
                bullet.x,
                bullet.y,
                rect,
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

        if (spawnDue || nextWords.length < wordBudget.minActiveWords) {
          lastSpawnRef.current = timestamp

          while (nextWords.length < wordBudget.minActiveWords) {
            spawnCountRef.current += 1
            const candidate = makeWord(
              wordIdRef.current++,
              targetCategory,
              score,
              spawnCountRef.current,
              recentWordsByCategory,
            )
            const placedWord = placeWordWithoutOverlap(candidate, nextWords, isMobileLayout)
            nextWords = [...nextWords, placedWord]
            recentWordsByCategory = rememberRecentWord(
              recentWordsByCategory,
              placedWord.categoryId,
              placedWord.text,
            )
          }

          if (spawnDue && nextWords.length < wordBudget.maxActiveWords) {
            spawnCountRef.current += 1
            const candidate = makeWord(
              wordIdRef.current++,
              targetCategory,
              score,
              spawnCountRef.current,
              recentWordsByCategory,
            )
            const placedWord = placeWordWithoutOverlap(candidate, nextWords, isMobileLayout)
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
  }, [isMobileLayout, selection.sfxEnabled, wordBudget])

  const levelPack = getLevelPack(game.languageId, game.cefrLevel)
  const targetStyle = CATEGORY_STYLES[game.targetCategory]
  const languages = getLanguageNames()
  const targetUiPack =
    TARGET_UI_TRANSLATIONS[targetUiLanguage] ?? TARGET_UI_TRANSLATIONS.english
  const targetUiCategory =
    targetUiPack.categories[game.targetCategory] ??
    TARGET_UI_TRANSLATIONS.english.categories[game.targetCategory]
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

  const handleTargetLanguageToggle = () => {
    if (!isMobileLayout) {
      return
    }

    setLanguagePickerOpen((current) => !current)
  }

  const handleTargetLanguageSelect = (languageId) => {
    setTargetUiLanguage(languageId)
    setLanguagePickerOpen(false)
  }

  const settingsPanel = (
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
  )

  const controlsPanel = (
    <section className="controls-panel">
      <div className="control-chip">
        <span>Move</span>
        <strong>{isMobileLayout ? 'Drag on the control line' : 'A / D or Arrow keys'}</strong>
      </div>
      <div className="control-chip">
        <span>Fire</span>
        <strong>{isMobileLayout ? 'Tap the control line' : 'Space'}</strong>
      </div>
      <div className="control-chip">
        <span>Progression</span>
        <strong>Target rotates through CEFR-appropriate categories over time</strong>
      </div>
    </section>
  )

  const statsPanel = (
    <>
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
    </>
  )

  const soundPanel = (
    <>
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
    </>
  )

  const hudPanel = (
    <section className="hud">
      {statsPanel}
      {soundPanel}
    </section>
  )

  return (
    <main className="game-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <h1>Wordshooter</h1>
          {!isMobileLayout ? (
          <p className="intro">
            Choose a language and CEFR level, then steer the ship and shoot only
            the vocabulary or grammar forms that match the active category.
          </p>
          ) : null}
        </div>
        {isMobileLayout ? (
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </button>
        ) : null}
      </section>

      {isMobileLayout && mobileMenuOpen ? (
      <section className="mobile-menu-panel">
          <p className="intro mobile-menu-intro">
            Choose a language and CEFR level, then steer the ship and shoot only
            the vocabulary or grammar forms that match the active category.
          </p>
          {settingsPanel}
          {controlsPanel}
          <section className="hud mobile-menu-sound-panel">{soundPanel}</section>
        </section>
      ) : null}

      <section className="play-layout">
        {!isMobileLayout ? (
        <aside className="sidebar sidebar-left">
          {settingsPanel}
          {controlsPanel}
        </aside>
        ) : null}

        <section className="arena-panel">
        {!isMobileLayout ? (
        <div className="arena-header">
          <p className="arena-kicker">
            {LANGUAGE_PACKS[game.languageId].name} · {game.cefrLevel}
          </p>
          <button className="restart-button" onClick={() => resetGame()}>
            Restart run
          </button>
        </div>
        ) : null}

        {!isMobileLayout ? (
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
        ) : null}

        {!isMobileLayout ? (
        <div className="mission-card mission-card-inline">
          <p className="mission-label">{targetUiPack.currentTarget}</p>
          <strong style={{ color: targetStyle.color }}>{targetUiCategory.label}</strong>
          <span>{targetUiCategory.description}</span>
        </div>
        ) : null}

        <div
          ref={arenaRef}
          className={`arena ${isMobileLayout ? 'arena-touch' : ''}`}
          onPointerDown={handleArenaPointerDown}
          onPointerMove={handleArenaPointerMove}
        >
          <div className="starfield starfield-a" />
          <div className="starfield starfield-b" />

          {isMobileLayout ? (
            <>
              <div className="arena-overlay arena-overlay-top">
                <div className="arena-mini-card arena-mini-time">
                  <span>Round time</span>
                  <strong>{Math.ceil(game.roundTimeMs / 1000)}s</strong>
                  <div className="arena-mini-track" aria-hidden="true">
                    <div
                      className="arena-mini-fill"
                      style={{ transform: `scaleX(${roundProgress})` }}
                    />
                  </div>
                </div>
                <div className="arena-target-picker">
                  <button
                    type="button"
                    className="arena-mini-card arena-target-card arena-target-button"
                    onClick={handleTargetLanguageToggle}
                  >
                    <span>{targetUiPack.currentTarget}</span>
                    <strong style={{ color: targetStyle.color }}>{targetUiCategory.label}</strong>
                  </button>
                  {languagePickerOpen ? (
                    <div className="language-picker-popup">
                      {languages.map((language) => (
                        <button
                          key={language.id}
                          type="button"
                          className={`language-picker-option ${
                            selection.languageId === language.id ? 'language-picker-option-active' : ''
                          }`}
                          onClick={() => handleTargetLanguageSelect(language.id)}
                        >
                          <span className="language-picker-flag" aria-hidden="true">
                            {LANGUAGE_FLAGS[language.id] ?? '🌐'}
                          </span>
                          <span>{language.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button className="restart-button arena-restart-button" onClick={() => resetGame()}>
                  Restart
                </button>
              </div>

              <div className="arena-overlay arena-overlay-bottom">
                <div className="arena-mobile-stats" aria-hidden="true">
                  <div className="arena-mobile-stat">
                    <span>Score</span>
                    <strong>{game.score}</strong>
                  </div>
                  <div className="arena-mobile-stat">
                    <span>Streak</span>
                    <strong>{game.streak}</strong>
                  </div>
                  <div className="arena-mobile-stat">
                    <span>Next switch</span>
                    <strong>{(game.nextCategorySwitchMs / 1000).toFixed(1)}s</strong>
                  </div>
                  <div className="arena-mobile-stat">
                    <span>High score</span>
                    <strong>{selectedHighScore}</strong>
                  </div>
                </div>
              </div>

            </>
          ) : null}

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
            onClick={handleShipClick}
          >
            <div className="ship-cockpit" />
            <div className="ship-wing ship-wing-left" />
            <div className="ship-wing ship-wing-right" />
            <div className="ship-engine ship-engine-left" />
            <div className="ship-engine ship-engine-right" />
          </div>

          {game.categoryAnnouncementMs > 0 ? (
            <div className="category-popup">
              <span>{targetUiPack.newTarget}</span>
              <strong>{targetUiCategory.label}</strong>
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

        {isMobileLayout ? (
          <div
            ref={controlLineRef}
            className="mobile-control-line"
            onPointerDown={handleControlPointerDown}
            onPointerMove={handleControlPointerMove}
            onPointerUp={handleControlPointerUp}
            onPointerCancel={handleControlPointerUp}
          >
            <span className="mobile-control-line-arrow mobile-control-line-arrow-left" aria-hidden="true">
              ←
            </span>
            <span className="mobile-control-line-label">Tap to fire</span>
            <span className="mobile-control-line-arrow mobile-control-line-arrow-right" aria-hidden="true">
              →
            </span>
          </div>
        ) : null}

        <div className={`feedback feedback-${game.feedbackTone}`}>{game.feedback}</div>
        </section>

        {!isMobileLayout ? (
        <aside className="sidebar sidebar-right">
          {hudPanel}
        </aside>
        ) : null}
      </section>
    </main>
  )
}

export default App
