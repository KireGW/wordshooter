import englishCsv from '../data/english.csv?raw'
import frenchCsv from '../data/french.csv?raw'
import germanCsv from '../data/german.csv?raw'
import italianCsv from '../data/italian.csv?raw'
import spanishCsv from '../data/spanish.csv?raw'
import swedishCsv from '../data/svenska.csv?raw'

export const CATEGORY_STYLES = {
  noun: {
    color: '#7bdff2',
    border: 'rgba(123, 223, 242, 0.5)',
    background: 'rgba(123, 223, 242, 0.12)',
  },
  verb: {
    color: '#ffd166',
    border: 'rgba(255, 209, 102, 0.5)',
    background: 'rgba(255, 209, 102, 0.12)',
  },
  adjective: {
    color: '#f7aef8',
    border: 'rgba(247, 174, 248, 0.5)',
    background: 'rgba(247, 174, 248, 0.12)',
  },
  adverb: {
    color: '#ff9f9f',
    border: 'rgba(255, 159, 159, 0.5)',
    background: 'rgba(255, 159, 159, 0.12)',
  },
  pronoun: {
    color: '#caffbf',
    border: 'rgba(202, 255, 191, 0.5)',
    background: 'rgba(202, 255, 191, 0.12)',
  },
  preposition: {
    color: '#b8c0ff',
    border: 'rgba(184, 192, 255, 0.5)',
    background: 'rgba(184, 192, 255, 0.12)',
  },
  past: {
    color: '#a0c4ff',
    border: 'rgba(160, 196, 255, 0.5)',
    background: 'rgba(160, 196, 255, 0.12)',
  },
  future: {
    color: '#ffc6ff',
    border: 'rgba(255, 198, 255, 0.5)',
    background: 'rgba(255, 198, 255, 0.12)',
  },
  modal: {
    color: '#ffe5a9',
    border: 'rgba(255, 229, 169, 0.5)',
    background: 'rgba(255, 229, 169, 0.12)',
  },
  connective: {
    color: '#9bf6ff',
    border: 'rgba(155, 246, 255, 0.5)',
    background: 'rgba(155, 246, 255, 0.12)',
  },
  subjunctive: {
    color: '#b8f2a5',
    border: 'rgba(184, 242, 165, 0.5)',
    background: 'rgba(184, 242, 165, 0.12)',
  },
  idiom: {
    color: '#ffd6a5',
    border: 'rgba(255, 214, 165, 0.5)',
    background: 'rgba(255, 214, 165, 0.12)',
  },
  present: {
    color: '#ffe29a',
    border: 'rgba(255, 226, 154, 0.5)',
    background: 'rgba(255, 226, 154, 0.12)',
  },
  verbPhrase: {
    color: '#d0b7ff',
    border: 'rgba(208, 183, 255, 0.5)',
    background: 'rgba(208, 183, 255, 0.12)',
  },
  phrase: {
    color: '#9bf6ff',
    border: 'rgba(155, 246, 255, 0.5)',
    background: 'rgba(155, 246, 255, 0.12)',
  },
}

const makeCategory = (id, label, description, words, extra = {}) => ({
  id,
  label,
  pluralLabel: label.toLowerCase(),
  description,
  words,
  styleId: id,
  matchType: 'category',
  sourceBucketIds: [id],
  ...extra,
})

const nouns = (words) => makeCategory('noun', 'Nouns', 'people, places, things, or ideas', words)
const verbs = (words) => makeCategory('verb', 'Verbs', 'action or state words', words)
const adjectives = (words) => makeCategory('adjective', 'Adjectives', 'describing words', words)
const adverbs = (words) => makeCategory('adverb', 'Adverbs', 'words that modify actions or descriptions', words)
const connective = (words) => makeCategory('connective', 'Connectives', 'linking words for longer sentences', words)
const verbPhrase = (words) => makeCategory('verbPhrase', 'Verb Phrases', 'multi-word verb constructions', words)
const makeVerbFormCategory = (id, label, description, words) =>
  makeCategory(id, label, description, words, {
    styleId: 'verb',
    matchType: 'subcategory',
    parentCategoryId: 'verb',
    sourceBucketIds: [id],
  })
const present = (words) => makeVerbFormCategory('present', 'Verb - present', 'present-tense verb forms', words)
const pastVerb = (words) => makeVerbFormCategory('verbPast', 'Verb - past', 'past-tense verb forms', words)
const futureVerb = (words) => makeVerbFormCategory('verbFuture', 'Verb - future', 'future verb forms', words)
const perfectVerb = (words) => makeVerbFormCategory('verbPerfect', 'Verb - perfect', 'perfect verb forms', words)
const modalVerb = (words) => makeVerbFormCategory('verbModal', 'Verb - modal', 'modal verb expressions', words)
const createLevel = (label, categories) => ({ label, categories })
const createLanguagePack = (name, levels) => ({ name, levels })

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }

  Object.values(value).forEach((child) => deepFreeze(child))
  return Object.freeze(value)
}

// Wordshooter is tuned for quick recognition practice from A1 through B2.
// C1-C2 material remains parked in the source lists for a future mode.
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2']
export const CEFR_VOCAB_TARGETS = {
  A1: { cumulative: 600, addedSincePrevious: 600 },
  A2: { cumulative: 1600, addedSincePrevious: 1000 },
  B1: { cumulative: 3600, addedSincePrevious: 2000 },
  B2: { cumulative: 7600, addedSincePrevious: 4000 },
  C1: { cumulative: 11600, addedSincePrevious: 4000 },
  C2: { cumulative: 19600, addedSincePrevious: 8000 },
}

const normalizeWord = (word) => word.trim().toLocaleLowerCase()
const uniqueWords = (words) => {
  const seen = new Set()

  return words.filter((word) => {
    const key = normalizeWord(word)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

const REINFORCEMENT_RATIO_BY_LEVEL = {
  A1: 0,
  A2: 0.12,
  B1: 0.1,
  B2: 0.08,
}

const selectSpreadWords = (words, count) => {
  if (count <= 0 || words.length === 0) {
    return []
  }

  if (count >= words.length) {
    return words
  }

  const step = words.length / count
  return Array.from({ length: count }, (_, index) => words[Math.floor((index + 0.5) * step)])
}

const getCompatibleReinforcementWords = (category, historyByCategoryId) => {
  const exactWords = historyByCategoryId.get(category.id)?.words ?? []

  if (category.parentCategoryId) {
    return exactWords
  }

  const childWords = Array.from(historyByCategoryId.values())
    .filter((historyCategory) => historyCategory.parentCategoryId === category.id)
    .flatMap((historyCategory) => historyCategory.words)

  return uniqueWords([...exactWords, ...childWords])
}

const compileLevelsWithReinforcementProgression = (levels) => {
  const historyByCategoryId = new Map()

  return Object.fromEntries(
    CEFR_LEVELS.map((levelId) => {
      const level = levels[levelId]
      const reinforcementRatio = REINFORCEMENT_RATIO_BY_LEVEL[levelId] ?? 0
      const ownCategories = level.categories.map((category) => ({
        ...category,
        words: uniqueWords(category.words),
      }))
      const categories = ownCategories.map((category) => {
        const ownWordKeys = new Set(category.words.map(normalizeWord))
        const reinforcementCandidates = getCompatibleReinforcementWords(
          category,
          historyByCategoryId,
        ).filter((word) => !ownWordKeys.has(normalizeWord(word)))
        const reinforcementCount = Math.round(category.words.length * reinforcementRatio)
        const reinforcementWords = selectSpreadWords(
          reinforcementCandidates,
          reinforcementCount,
        )

        return {
          ...category,
          words: uniqueWords([...category.words, ...reinforcementWords]),
        }
      })

      ownCategories.forEach((category) => {
        const previousWords = historyByCategoryId.get(category.id)?.words ?? []
        historyByCategoryId.set(category.id, {
          parentCategoryId: category.parentCategoryId ?? null,
          words: uniqueWords([...previousWords, ...category.words]),
        })
      })

      return [
        levelId,
        {
          ...level,
          categories,
          vocabTarget: CEFR_VOCAB_TARGETS[levelId],
        },
      ]
    }),
  )
}

const addExtraWordMatchSourcesToLevels = (levels, extraWordMatchSources = {}) =>
  Object.fromEntries(
    Object.entries(levels).map(([levelId, level]) => {
      const wordMatchSources = new Map(
        Object.entries(level.wordMatchSourceIds ?? {}).map(([word, sourceIds]) => [
          word,
          new Set(sourceIds),
        ]),
      )

      level.categories.forEach((category) => {
        category.words.forEach((word) => {
          const wordKey = normalizeWord(word)
          const sourceIds = wordMatchSources.get(wordKey) ?? new Set()
          sourceIds.add(category.id)
          ;(extraWordMatchSources[wordKey] ?? []).forEach((sourceId) => sourceIds.add(sourceId))
          wordMatchSources.set(wordKey, sourceIds)
        })
      })

      return [
        levelId,
        {
          ...level,
          wordMatchSourceIds: Object.fromEntries(
            Array.from(wordMatchSources.entries()).map(([word, sourceIds]) => [
              word,
              uniqueWords(Array.from(sourceIds)),
            ]),
          ),
        },
      ]
    }),
  )

const SWEDISH_VERB_FORM_BUILDERS = {
  infinitiv: {
    id: 'verb',
    build: verbs,
    subcategory: 'infinitiv',
  },
  presens: {
    id: 'present',
    build: present,
    subcategory: 'presens',
  },
  dåtid: {
    id: 'verbPast',
    build: pastVerb,
    subcategory: 'dåtid',
  },
  futurum: {
    id: 'verbFuture',
    build: futureVerb,
    subcategory: 'futurum',
  },
  perfekt: {
    id: 'verbPerfect',
    build: perfectVerb,
    subcategory: 'perfekt',
  },
  modalverb: {
    id: 'verbModal',
    build: modalVerb,
    subcategory: 'modalverb',
  },
  verbfras: {
    id: 'verbPhrase',
    build: verbPhrase,
    subcategory: 'verbfras',
  },
}

const SWEDISH_VERB_FORM_ALIASES = {
  'modala verb': 'modalverb',
  'modala uttryck': 'modalverb',
  'verbfraser': 'verbfras',
}

const SWEDISH_EXTRA_WORD_MATCH_SOURCES = {
  fråga: ['noun', 'verb'],
  kort: ['noun', 'adjective'],
  vila: ['noun', 'verb'],
  visa: ['verb', 'noun'],
  dricka: ['verb', 'noun'],
  rätt: ['adjective', 'noun', 'adverb'],
  fel: ['adjective', 'noun', 'adverb'],
  lätt: ['adjective', 'adverb'],
  gift: ['adjective', 'noun'],
  lokal: ['adjective', 'noun'],
  lugn: ['adjective', 'noun'],
  ljus: ['adjective', 'noun'],
  fast: ['connective', 'adjective', 'adverb'],
  när: ['connective', 'adverb'],
  lagom: ['adjective', 'adverb'],
  beroende: ['adjective', 'noun'],
  rättvisa: ['noun', 'adjective'],
  avgörande: ['adjective', 'noun'],
  konkret: ['adjective', 'adverb'],
  abstrakt: ['adjective', 'adverb'],
  ytterligare: ['adverb', 'adjective'],
  ändå: ['connective', 'adverb'],
  alltså: ['connective', 'adverb'],
  således: ['connective', 'adverb'],
}

const ENGLISH_EXTRA_WORD_MATCH_SOURCES = {
  back: ['adverb', 'noun', 'verb'],
  forward: ['adverb', 'verb'],
  bike: ['noun', 'verb'],
  help: ['noun', 'verb'],
  drink: ['noun', 'verb'],
  answer: ['verb', 'noun'],
  home: ['noun', 'adverb'],
  still: ['adverb', 'adjective'],
  well: ['noun', 'adverb'],
  public: ['noun', 'adjective'],
  otherwise: ['adverb', 'connective'],
  plans: ['verb', 'noun'],
  check: ['verb', 'noun'],
  cross: ['verb', 'noun'],
  clear: ['verb', 'adjective'],
  dream: ['verb', 'noun'],
  shower: ['verb', 'noun'],
  party: ['verb', 'noun'],
  schedule: ['noun', 'verb'],
  stay: ['verb', 'noun'],
  love: ['verb', 'noun'],
  call: ['verb', 'noun'],
  object: ['verb', 'noun'],
  subject: ['noun', 'verb', 'adjective'],
  grade: ['noun', 'verb'],
  research: ['noun', 'verb'],
  screen: ['noun', 'verb'],
  match: ['noun', 'verb'],
  watch: ['verb', 'noun'],
  work: ['verb', 'noun'],
  study: ['verb', 'noun'],
  play: ['verb', 'noun'],
  shop: ['noun', 'verb'],
  open: ['verb', 'adjective'],
  clean: ['verb', 'adjective'],
  early: ['adjective', 'adverb'],
  late: ['adjective', 'adverb'],
  rent: ['noun', 'verb'],
  change: ['noun', 'verb'],
  order: ['noun', 'verb'],
  alone: ['adjective', 'adverb'],
}

const ENGLISH_VERB_FORM_BUILDERS = {
  base: {
    id: 'verb',
    build: verbs,
    subcategory: 'base',
  },
  present: {
    id: 'present',
    build: present,
    subcategory: 'present',
  },
  past: {
    id: 'verbPast',
    build: pastVerb,
    subcategory: 'past',
  },
  future: {
    id: 'verbFuture',
    build: futureVerb,
    subcategory: 'future',
  },
  perfect: {
    id: 'verbPerfect',
    build: perfectVerb,
    subcategory: 'perfect',
  },
  modal: {
    id: 'verbModal',
    build: modalVerb,
    subcategory: 'modal',
  },
  phrasal: {
    id: 'verbPhrase',
    build: verbPhrase,
    subcategory: 'phrasal',
  },
}

const ENGLISH_CSV_CONFIG = {
  levelLabels: {
    A1: 'A1 Beginner',
    A2: 'A2 Elementary',
    B1: 'B1 Intermediate',
    B2: 'B2 Upper Intermediate',
  },
  categoryBuilders: {
    noun: {
      id: 'noun',
      build: nouns,
    },
    verb: {
      derivedBuilders: Object.values(ENGLISH_VERB_FORM_BUILDERS),
      resolve: ({ subcategory }) => {
        const verbForm = subcategory.trim().toLocaleLowerCase('en-US')
        return ENGLISH_VERB_FORM_BUILDERS[verbForm] ?? ENGLISH_VERB_FORM_BUILDERS.base
      },
    },
    adjective: {
      id: 'adjective',
      build: adjectives,
    },
    adverb: {
      id: 'adverb',
      build: adverbs,
    },
    connective: {
      id: 'connective',
      build: connective,
    },
  },
  playableCategoryIdsByLevel: {
    A1: new Set(['noun', 'verb', 'adjective']),
    A2: new Set(['noun', 'verb', 'present', 'adjective', 'adverb']),
    B1: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'verbPhrase',
      'adjective',
      'adverb',
      'connective',
    ]),
    B2: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'verbPerfect',
      'verbModal',
      'verbPhrase',
      'adjective',
      'adverb',
      'connective',
    ]),
  },
  mergeCategoriesByLevel: {
    A2: [{ from: 'verbPhrase', into: 'verb' }],
  },
  extraWordMatchSources: ENGLISH_EXTRA_WORD_MATCH_SOURCES,
  describeSubcategory: ({ subcategoryId }) => `${subcategoryId} verb forms`,
}

const makeSubjunctiveVerbCategory = (words) =>
  makeCategory('subjunctive', 'Subjunctive', 'forms for wishes, doubt, emotion, or hypotheticals', words, {
    styleId: 'subjunctive',
    matchType: 'subcategory',
    parentCategoryId: 'verb',
    subcategoryId: 'subjuntivo',
    sourceBucketIds: ['subjunctive'],
  })

const makeFrenchSubjunctiveVerbCategory = (words) =>
  makeCategory('subjunctive', 'Subjonctif', 'formes pour le doute, le souhait ou la nécessité', words, {
    styleId: 'subjunctive',
    matchType: 'subcategory',
    parentCategoryId: 'verb',
    subcategoryId: 'subjonctif',
    sourceBucketIds: ['subjunctive'],
  })

const makeItalianSubjunctiveVerbCategory = (words) =>
  makeCategory('subjunctive', 'Congiuntivo', 'forme per dubbio, desiderio o necessità', words, {
    styleId: 'subjunctive',
    matchType: 'subcategory',
    parentCategoryId: 'verb',
    subcategoryId: 'congiuntivo',
    sourceBucketIds: ['subjunctive'],
  })

const makeGermanSubjunctiveVerbCategory = (words) =>
  makeCategory('subjunctive', 'Konjunktiv', 'Formen für Möglichkeiten, Wünsche oder Irreales', words, {
    styleId: 'subjunctive',
    matchType: 'subcategory',
    parentCategoryId: 'verb',
    subcategoryId: 'konjunktiv',
    sourceBucketIds: ['subjunctive'],
  })

const SPANISH_EXTRA_WORD_MATCH_SOURCES = {
  casa: ['noun', 'present'],
  calle: ['noun', 'subjunctive'],
  camino: ['noun', 'present'],
  mañana: ['noun', 'adverb'],
  tarde: ['noun', 'adjective', 'adverb'],
  claro: ['adjective', 'adverb'],
  seguro: ['adjective', 'adverb', 'noun'],
  enfermo: ['adjective', 'noun'],
  temprano: ['adjective', 'adverb'],
  médico: ['noun', 'adjective'],
  cuenta: ['noun', 'present'],
  efectivo: ['noun', 'adjective'],
  solo: ['adjective', 'adverb'],
  general: ['adjective', 'noun'],
  regular: ['adjective', 'verb'],
  paciente: ['adjective', 'noun'],
  técnico: ['adjective', 'noun'],
  físico: ['adjective', 'noun'],
  profesional: ['adjective', 'noun'],
  social: ['adjective', 'noun'],
  político: ['adjective', 'noun'],
  política: ['noun', 'adjective'],
  crítico: ['adjective', 'noun'],
  común: ['adjective', 'noun'],
  para: ['connective', 'present'],
  como: ['connective', 'present'],
  discutimos: ['present', 'verbPast'],
  afirmamos: ['present', 'verbPast'],
  definimos: ['present', 'verbPast'],
}

const SPANISH_VERB_FORM_BUILDERS = {
  infinitivo: {
    id: 'verb',
    build: verbs,
    subcategory: 'infinitivo',
  },
  presente: {
    id: 'present',
    build: present,
    subcategory: 'presente',
  },
  pretérito: {
    id: 'verbPast',
    build: pastVerb,
    subcategory: 'pretérito',
  },
  futuro: {
    id: 'verbFuture',
    build: futureVerb,
    subcategory: 'futuro',
  },
  perfecto: {
    id: 'verbPerfect',
    build: perfectVerb,
    subcategory: 'perfecto',
  },
  modal: {
    id: 'verbModal',
    build: modalVerb,
    subcategory: 'modal',
  },
  subjuntivo: {
    id: 'subjunctive',
    build: makeSubjunctiveVerbCategory,
    subcategory: 'subjuntivo',
  },
  perífrasis: {
    id: 'verbPhrase',
    build: verbPhrase,
    subcategory: 'perífrasis',
  },
}

const SPANISH_CSV_CONFIG = {
  levelLabels: {
    A1: 'A1 Inicial',
    A2: 'A2 Básico',
    B1: 'B1 Intermedio',
    B2: 'B2 Intermedio alto',
  },
  categoryBuilders: {
    sustantivo: {
      id: 'noun',
      build: nouns,
    },
    verbo: {
      derivedBuilders: Object.values(SPANISH_VERB_FORM_BUILDERS),
      resolve: ({ subcategory }) => {
        const verbForm = subcategory.trim().toLocaleLowerCase('es-ES')
        return SPANISH_VERB_FORM_BUILDERS[verbForm] ?? SPANISH_VERB_FORM_BUILDERS.infinitivo
      },
    },
    adjetivo: {
      id: 'adjective',
      build: adjectives,
    },
    adverbio: {
      id: 'adverb',
      build: adverbs,
    },
    conector: {
      id: 'connective',
      build: connective,
    },
  },
  playableCategoryIdsByLevel: {
    A1: new Set(['noun', 'verb', 'adjective']),
    A2: new Set(['noun', 'verb', 'present', 'adjective', 'adverb']),
    B1: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
    B2: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'verbPerfect',
      'verbModal',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
  },
  mergeCategoriesByLevel: {
    A2: [{ from: 'verbPhrase', into: 'verb' }],
  },
  extraWordMatchSources: SPANISH_EXTRA_WORD_MATCH_SOURCES,
  describeSubcategory: ({ subcategoryId }) => `${subcategoryId} verbal`,
}

const FRENCH_EXTRA_WORD_MATCH_SOURCES = {
  devoir: ['verb', 'noun'],
  livre: ['noun', 'present'],
  porte: ['noun', 'present'],
  cours: ['noun', 'present'],
  note: ['noun', 'present'],
  recherche: ['noun', 'present'],
  analyse: ['noun', 'present'],
  politique: ['adjective', 'noun'],
  critique: ['adjective', 'noun', 'present'],
  calme: ['adjective', 'noun', 'present'],
  court: ['adjective', 'present'],
  vide: ['adjective', 'noun', 'present'],
  fort: ['adjective', 'adverb', 'noun'],
  bon: ['adjective', 'noun'],
  frais: ['adjective', 'noun'],
  jeune: ['adjective', 'noun'],
  grand: ['adjective', 'noun'],
  petit: ['adjective', 'noun'],
  local: ['adjective', 'noun'],
  public: ['adjective', 'noun'],
  privé: ['adjective', 'noun'],
  seul: ['adjective', 'adverb'],
  physique: ['adjective', 'noun'],
  logique: ['adjective', 'noun'],
  limite: ['noun', 'adjective', 'present'],
  pratique: ['adjective', 'noun', 'present'],
  reçu: ['noun', 'adjective'],
  social: ['adjective', 'noun'],
  résultat: ['noun'],
  avantage: ['noun'],
  aussi: ['connective', 'adverb'],
  ainsi: ['connective', 'adverb'],
  sinon: ['connective', 'adverb'],
  ensuite: ['connective', 'adverb'],
}

const FRENCH_VERB_FORM_BUILDERS = {
  infinitif: {
    id: 'verb',
    build: verbs,
    subcategory: 'infinitif',
  },
  présent: {
    id: 'present',
    build: present,
    subcategory: 'présent',
  },
  'passé composé': {
    id: 'verbPast',
    build: pastVerb,
    subcategory: 'passé composé',
  },
  futur: {
    id: 'verbFuture',
    build: futureVerb,
    subcategory: 'futur',
  },
  modal: {
    id: 'verbModal',
    build: modalVerb,
    subcategory: 'modal',
  },
  subjonctif: {
    id: 'subjunctive',
    build: makeFrenchSubjunctiveVerbCategory,
    subcategory: 'subjonctif',
  },
}

const FRENCH_CSV_CONFIG = {
  levelLabels: {
    A1: 'A1 Débutant',
    A2: 'A2 Élémentaire',
    B1: 'B1 Intermédiaire',
    B2: 'B2 Intermédiaire supérieur',
  },
  categoryBuilders: {
    nom: {
      id: 'noun',
      build: nouns,
    },
    verbe: {
      derivedBuilders: Object.values(FRENCH_VERB_FORM_BUILDERS),
      resolve: ({ subcategory }) => {
        const verbForm = subcategory.trim().toLocaleLowerCase('fr-FR')
        return FRENCH_VERB_FORM_BUILDERS[verbForm] ?? FRENCH_VERB_FORM_BUILDERS.infinitif
      },
    },
    adjectif: {
      id: 'adjective',
      build: adjectives,
    },
    adverbe: {
      id: 'adverb',
      build: adverbs,
    },
    connecteur: {
      id: 'connective',
      build: connective,
    },
  },
  playableCategoryIdsByLevel: {
    A1: new Set(['noun', 'verb', 'adjective']),
    A2: new Set(['noun', 'verb', 'present', 'adjective', 'adverb']),
    B1: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
    B2: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'verbModal',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
  },
  mergeCategoriesByLevel: {
    A2: [{ from: 'verbPhrase', into: 'verb' }],
  },
  extraWordMatchSources: FRENCH_EXTRA_WORD_MATCH_SOURCES,
  describeSubcategory: ({ subcategoryId }) => `formes verbales ${subcategoryId}`,
}

const ITALIAN_EXTRA_WORD_MATCH_SOURCES = {
  porta: ['noun', 'present'],
  conto: ['noun', 'present'],
  ordine: ['noun', 'present'],
  studio: ['present', 'noun'],
  medico: ['noun', 'adjective'],
  solo: ['adjective', 'adverb'],
  vicino: ['noun', 'adjective', 'adverb'],
  prima: ['adverb', 'connective'],
  dopo: ['adverb', 'connective'],
  come: ['connective', 'adverb'],
  perché: ['connective', 'adverb'],
  mentre: ['connective', 'adverb'],
  appena: ['connective', 'adverb'],
  altrimenti: ['adverb', 'connective'],
  così: ['connective', 'adverb'],
  poi: ['connective', 'adverb'],
  politica: ['noun', 'adjective'],
  critico: ['adjective', 'noun'],
  fisico: ['adjective', 'noun'],
  logico: ['adjective', 'noun'],
  economico: ['adjective', 'noun'],
  sociale: ['adjective', 'noun'],
  regolare: ['adjective', 'verb'],
  pratico: ['adjective', 'noun'],
  paziente: ['adjective', 'noun'],
  tecnico: ['adjective', 'noun'],
  generale: ['adjective', 'noun'],
  pubblico: ['adjective', 'noun'],
  privato: ['adjective', 'noun'],
  limite: ['noun', 'adjective', 'present'],
  capace: ['adjective', 'noun'],
  disposto: ['adjective', 'noun'],
  preoccupato: ['adjective', 'noun'],
  adatto: ['adjective', 'noun'],
  scelta: ['noun', 'verbPast'],
  prova: ['noun', 'present'],
}

const ITALIAN_VERB_FORM_BUILDERS = {
  infinito: {
    id: 'verb',
    build: verbs,
    subcategory: 'infinito',
  },
  presente: {
    id: 'present',
    build: present,
    subcategory: 'presente',
  },
  'passato prossimo': {
    id: 'verbPast',
    build: pastVerb,
    subcategory: 'passato prossimo',
  },
  futuro: {
    id: 'verbFuture',
    build: futureVerb,
    subcategory: 'futuro',
  },
  modale: {
    id: 'verbModal',
    build: modalVerb,
    subcategory: 'modale',
  },
  congiuntivo: {
    id: 'subjunctive',
    build: makeItalianSubjunctiveVerbCategory,
    subcategory: 'congiuntivo',
  },
}

const ITALIAN_CSV_CONFIG = {
  levelLabels: {
    A1: 'A1 Principiante',
    A2: 'A2 Elementare',
    B1: 'B1 Intermedio',
    B2: 'B2 Intermedio avanzato',
  },
  categoryBuilders: {
    sostantivo: {
      id: 'noun',
      build: nouns,
    },
    verbo: {
      derivedBuilders: Object.values(ITALIAN_VERB_FORM_BUILDERS),
      resolve: ({ subcategory }) => {
        const verbForm = subcategory.trim().toLocaleLowerCase('it-IT')
        return ITALIAN_VERB_FORM_BUILDERS[verbForm] ?? ITALIAN_VERB_FORM_BUILDERS.infinito
      },
    },
    aggettivo: {
      id: 'adjective',
      build: adjectives,
    },
    avverbio: {
      id: 'adverb',
      build: adverbs,
    },
    connettivo: {
      id: 'connective',
      build: connective,
    },
  },
  playableCategoryIdsByLevel: {
    A1: new Set(['noun', 'verb', 'adjective']),
    A2: new Set(['noun', 'verb', 'present', 'adjective', 'adverb']),
    B1: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
    B2: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'verbModal',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
  },
  mergeCategoriesByLevel: {
    A2: [{ from: 'verbPhrase', into: 'verb' }],
  },
  extraWordMatchSources: ITALIAN_EXTRA_WORD_MATCH_SOURCES,
  describeSubcategory: ({ subcategoryId }) => `forme verbali ${subcategoryId}`,
}

const GERMAN_EXTRA_WORD_MATCH_SOURCES = {
  morgen: ['noun', 'adverb'],
  einfach: ['adjective', 'adverb'],
  leicht: ['adjective', 'adverb'],
  traurig: ['adjective', 'adverb'],
  richtig: ['adjective', 'adverb'],
  laut: ['adjective', 'adverb'],
  schnell: ['adjective', 'adverb'],
  langsam: ['adjective', 'adverb'],
  allein: ['adjective', 'adverb'],
  höflich: ['adjective', 'adverb'],
  gewöhnlich: ['adjective', 'adverb'],
  klar: ['adjective', 'adverb'],
  geduldig: ['adjective', 'adverb'],
  erfolgreich: ['adjective', 'adverb'],
  persönlich: ['adjective', 'adverb'],
  beruflich: ['adjective', 'adverb'],
  regelmäßig: ['adjective', 'adverb'],
  offensichtlich: ['adjective', 'adverb'],
  angemessen: ['adjective', 'adverb'],
  kritisch: ['adjective', 'adverb'],
  bedeutend: ['adjective', 'adverb'],
  rechtlich: ['adjective', 'adverb'],
  emotional: ['adjective', 'adverb'],
  geistig: ['adjective', 'adverb'],
  körperlich: ['adjective', 'adverb'],
  logisch: ['adjective', 'adverb'],
  falsch: ['adjective', 'adverb'],
  sicher: ['adjective', 'adverb'],
  da: ['connective', 'adverb'],
  denn: ['connective', 'adverb'],
  wenn: ['connective', 'adverb'],
  falls: ['connective', 'adverb'],
  wie: ['connective', 'adverb'],
  also: ['connective', 'adverb'],
  auch: ['connective', 'adverb'],
  damit: ['connective', 'adverb'],
  während: ['connective', 'adverb'],
  andernfalls: ['adverb', 'connective'],
  haben: ['verb', 'present'],
  gehen: ['verb', 'present'],
  lesen: ['verb', 'present'],
  schreiben: ['verb', 'present'],
  sprechen: ['verb', 'present'],
  nehmen: ['verb', 'present'],
  lernen: ['verb', 'present'],
  wählen: ['verb', 'present'],
  akzeptieren: ['verb', 'present'],
  vergleichen: ['verb', 'present'],
  verwalten: ['verb', 'present'],
  empfehlen: ['verb', 'present'],
  behaupten: ['verb', 'present'],
  kritisieren: ['verb', 'present'],
  definieren: ['verb', 'present'],
  repräsentieren: ['verb', 'present'],
}

const GERMAN_VERB_FORM_BUILDERS = {
  infinitiv: {
    id: 'verb',
    build: verbs,
    subcategory: 'infinitiv',
  },
  präsens: {
    id: 'present',
    build: present,
    subcategory: 'präsens',
  },
  perfekt: {
    id: 'verbPast',
    build: pastVerb,
    subcategory: 'perfekt',
  },
  futur: {
    id: 'verbFuture',
    build: futureVerb,
    subcategory: 'futur',
  },
  modal: {
    id: 'verbModal',
    build: modalVerb,
    subcategory: 'modal',
  },
  konjunktiv: {
    id: 'subjunctive',
    build: makeGermanSubjunctiveVerbCategory,
    subcategory: 'konjunktiv',
  },
}

const GERMAN_CSV_CONFIG = {
  levelLabels: {
    A1: 'A1 Einstieg',
    A2: 'A2 Grundstufe',
    B1: 'B1 Mittelstufe',
    B2: 'B2 Obere Mittelstufe',
  },
  categoryBuilders: {
    substantiv: {
      id: 'noun',
      build: nouns,
    },
    verb: {
      derivedBuilders: Object.values(GERMAN_VERB_FORM_BUILDERS),
      resolve: ({ subcategory }) => {
        const verbForm = subcategory.trim().toLocaleLowerCase('de-DE')
        return GERMAN_VERB_FORM_BUILDERS[verbForm] ?? GERMAN_VERB_FORM_BUILDERS.infinitiv
      },
    },
    adjektiv: {
      id: 'adjective',
      build: adjectives,
    },
    adverb: {
      id: 'adverb',
      build: adverbs,
    },
    konnektor: {
      id: 'connective',
      build: connective,
    },
  },
  playableCategoryIdsByLevel: {
    A1: new Set(['noun', 'verb', 'adjective']),
    A2: new Set(['noun', 'verb', 'present', 'adjective', 'adverb']),
    B1: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
    B2: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'verbModal',
      'subjunctive',
      'adjective',
      'adverb',
      'connective',
    ]),
  },
  mergeCategoriesByLevel: {
    A2: [{ from: 'verbPhrase', into: 'verb' }],
  },
  extraWordMatchSources: GERMAN_EXTRA_WORD_MATCH_SOURCES,
  describeSubcategory: ({ subcategoryId }) => `Verbformen ${subcategoryId}`,
}

const SWEDISH_CSV_CONFIG = {
  levelLabels: {
    A1: 'A1 Nybörjare',
    A2: 'A2 Grundläggande',
    B1: 'B1 Mellannivå',
    B2: 'B2 Högre mellannivå',
    C1: 'C1 Avancerad',
    C2: 'C2 Mycket avancerad',
  },
  categoryBuilders: {
    substantiv: {
      id: 'noun',
      build: nouns,
    },
    verb: {
      derivedBuilders: Object.values(SWEDISH_VERB_FORM_BUILDERS),
      resolve: ({ subcategory }) => {
        const verbForm = subcategory.trim().toLocaleLowerCase('sv-SE')
        const normalizedVerbForm = SWEDISH_VERB_FORM_ALIASES[verbForm] ?? verbForm
        return SWEDISH_VERB_FORM_BUILDERS[normalizedVerbForm] ?? SWEDISH_VERB_FORM_BUILDERS.infinitiv
      },
    },
    verb_infinitiv: {
      id: 'verb',
      build: verbs,
    },
    verb_presens: {
      id: 'present',
      build: present,
    },
    verb_dåtid: {
      id: 'verbPast',
      build: pastVerb,
    },
    verb_futurum: {
      id: 'verbFuture',
      build: futureVerb,
    },
    verb_perfekt: {
      id: 'verbPerfect',
      build: perfectVerb,
    },
    verb_modal: {
      id: 'verbModal',
      build: modalVerb,
    },
    verbfras: {
      id: 'verbPhrase',
      build: verbPhrase,
    },
    adjektiv: {
      id: 'adjective',
      build: adjectives,
    },
    adverb: {
      id: 'adverb',
      build: adverbs,
    },
    sambandsord: {
      id: 'connective',
      build: connective,
    },
  },
  playableCategoryIdsByLevel: {
    A1: new Set(['noun', 'verb', 'adjective']),
    A2: new Set(['noun', 'verb', 'present', 'adjective', 'adverb']),
    B1: new Set(['noun', 'verb', 'present', 'verbPast', 'verbFuture', 'adjective', 'adverb', 'connective']),
    B2: new Set([
      'noun',
      'verb',
      'present',
      'verbPast',
      'verbFuture',
      'verbPerfect',
      'verbModal',
      'adjective',
      'adverb',
      'connective',
    ]),
  },
  mergeCategoriesByLevel: {
    A1: [{ from: 'present', into: 'verb' }],
    A2: [{ from: 'verbPhrase', into: 'verb' }],
  },
  extraWordMatchSources: SWEDISH_EXTRA_WORD_MATCH_SOURCES,
  describeSubcategory: ({ subcategoryId, parentId }) => `${subcategoryId} inom ${parentId}`,
}

const resolveCategoryConfig = (categoryBuilders, row) => {
  const categoryConfig = categoryBuilders[row.category]
  if (!categoryConfig) {
    return null
  }

  if (typeof categoryConfig.resolve === 'function') {
    return categoryConfig.resolve(row)
  }

  return categoryConfig
}

const parseCsvRows = (csvText) => {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)

  const [headerLine, ...rowLines] = lines
  const headers = headerLine.replace(/^\uFEFF/, '').split(',')

  return rowLines.map((line) => {
    const values = line.split(',')
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

const buildLevelsFromCsv = (
  csvText,
  {
    levelLabels,
    categoryBuilders,
    playableCategoryIdsByLevel = {},
    mergeCategoriesByLevel = {},
    extraWordMatchSources = {},
    describeSubcategory = ({ subcategoryId, parentId }) => `${subcategoryId} in ${parentId}`,
  },
) => {
  const grouped = new Map()
  const subcategoryGrouped = new Map()
  const wordMatchSourcesByLevel = new Map()
  const languageWideWordMatchSources = new Map()
  const categoryBuilderById = new Map(
    Object.values(categoryBuilders)
      .flatMap((config) => [config, ...(config.derivedBuilders ?? [])])
      .filter((config) => config.id)
      .map((config) => [config.id, config]),
  )

  parseCsvRows(csvText).forEach(({ level, category, subcategory, word }) => {
    const categoryConfig = resolveCategoryConfig(categoryBuilders, {
      category,
      subcategory,
      word,
    })
    if (!categoryConfig || !CEFR_LEVELS.includes(level) || !word) {
      return
    }

    if (!grouped.has(level)) {
      grouped.set(level, new Map())
    }

    const levelMap = grouped.get(level)
    const categoryWords = levelMap.get(categoryConfig.id) ?? []
    categoryWords.push(word.trim())
    levelMap.set(categoryConfig.id, categoryWords)

    const resolvedSubcategory = categoryConfig.subcategory ?? subcategory?.trim()
    if (!wordMatchSourcesByLevel.has(level)) {
      wordMatchSourcesByLevel.set(level, new Map())
    }
    const wordKey = normalizeWord(word)
    const wordSourceIds = wordMatchSourcesByLevel.get(level).get(wordKey) ?? new Set()
    wordSourceIds.add(categoryConfig.id)
    if (resolvedSubcategory) {
      wordSourceIds.add(`${categoryConfig.id}:${resolvedSubcategory}`)
    }
    wordMatchSourcesByLevel.get(level).set(wordKey, wordSourceIds)

    const languageWideSourceIds = languageWideWordMatchSources.get(wordKey) ?? new Set()
    wordSourceIds.forEach((sourceId) => languageWideSourceIds.add(sourceId))
    languageWideWordMatchSources.set(wordKey, languageWideSourceIds)

    if (resolvedSubcategory) {
      if (!subcategoryGrouped.has(level)) {
        subcategoryGrouped.set(level, new Map())
      }
      const subMap = subcategoryGrouped.get(level)
      const subKey = `${categoryConfig.id}::${resolvedSubcategory}`
      const subState =
        subMap.get(subKey) ??
        {
          parentId: categoryConfig.id,
          subcategoryId: resolvedSubcategory,
          words: [],
        }
      subState.words.push(word.trim())
      subMap.set(subKey, subState)
    }
  })

  return Object.fromEntries(
    CEFR_LEVELS.map((level) => {
      const levelMap = grouped.get(level) ?? new Map()
      const allowedCategoryIds = playableCategoryIdsByLevel[level] ?? null
      const categories = Array.from(levelMap.entries())
        .map(([id, words]) => {
          const config = categoryBuilderById.get(id)
          return config ? config.build(uniqueWords(words)) : null
        })
        .filter(Boolean)
      const categoriesById = new Map(categories.map((category) => [category.id, category]))
      const mergeRules = mergeCategoriesByLevel[level] ?? []
      const mergedSourceIdsByTarget = new Map()

      mergeRules.forEach(({ from, into }) => {
        const targetCategory = categoriesById.get(into)
        const sourceCategory = categoriesById.get(from)
        if (targetCategory && sourceCategory) {
          categoriesById.set(into, {
            ...targetCategory,
            words: uniqueWords([...targetCategory.words, ...sourceCategory.words]),
          })
          mergedSourceIdsByTarget.set(into, [...(mergedSourceIdsByTarget.get(into) ?? []), from])
          categoriesById.delete(from)
        }
      })

      const subcategories = Array.from((subcategoryGrouped.get(level) ?? new Map()).values())
        .map(({ parentId, subcategoryId, words }) => {
          const normalizedWords = uniqueWords(words)
          const styleId = parentId
          const sourceBucketId = `${parentId}:${subcategoryId}`
          return makeCategory(
            sourceBucketId,
            subcategoryId[0].toUpperCase() + subcategoryId.slice(1),
            describeSubcategory({ subcategoryId, parentId }),
            normalizedWords,
            {
              styleId,
              matchType: 'subcategory',
              parentCategoryId: parentId,
              subcategoryId,
              sourceBucketIds: [sourceBucketId],
            },
          )
        })
        .filter((item) => item.words.length > 0)
      const allCategories = Array.from(categoriesById.values()).filter((category) =>
        allowedCategoryIds ? allowedCategoryIds.has(category.id) : true,
      )
      const getSourceBucketIds = (category) => {
        const categoryIds = [category.id, ...(mergedSourceIdsByTarget.get(category.id) ?? [])]
        return uniqueWords([
          ...categoryIds,
          ...subcategories
            .filter((item) => categoryIds.includes(item.parentCategoryId))
            .map((item) => item.id),
        ])
      }
      const withExpandedSources = allCategories.map((category) => {
        if (allowedCategoryIds) {
          const childCategorySourceIds = allCategories
            .filter((item) => item.parentCategoryId === category.id)
            .flatMap((item) => getSourceBucketIds(item))

          return {
            ...category,
            sourceBucketIds: [...getSourceBucketIds(category), ...childCategorySourceIds],
          }
        }

        const sourceBucketIds = getSourceBucketIds(category)
        if (sourceBucketIds.length === 1) {
          return category
        }

        return {
          ...category,
          sourceBucketIds,
        }
      })
      const activeSubcategories = allowedCategoryIds
        ? []
        : subcategories
      const wordMatchSources = new Map(wordMatchSourcesByLevel.get(level) ?? [])
      wordMatchSources.forEach((sourceIds, word) => {
        const languageWideSourceIds = languageWideWordMatchSources.get(word) ?? new Set()
        languageWideSourceIds.forEach((sourceId) => sourceIds.add(sourceId))
        ;(extraWordMatchSources[word] ?? []).forEach((sourceId) => sourceIds.add(sourceId))
        wordMatchSources.set(word, sourceIds)
      })

      return [
        level,
        {
          ...createLevel(levelLabels[level], [...withExpandedSources, ...activeSubcategories]),
          wordMatchSourceIds: Object.fromEntries(
            Array.from(wordMatchSources.entries()).map(([word, sourceIds]) => [
              word,
              uniqueWords(Array.from(sourceIds)),
            ]),
          ),
        },
      ]
    }),
  )
}

// Keep language-specific curricula isolated here so global gameplay changes
// do not require editing the language content directly.
const LANGUAGE_LEVELS = {
  english: {
    name: 'English',
    levels: buildLevelsFromCsv(englishCsv, ENGLISH_CSV_CONFIG),
  },
  french: {
    name: 'Français',
    levels: buildLevelsFromCsv(frenchCsv, FRENCH_CSV_CONFIG),
  },
  spanish: {
    name: 'Español',
    levels: buildLevelsFromCsv(spanishCsv, SPANISH_CSV_CONFIG),
  },
  italian: {
    name: 'Italiano',
    levels: buildLevelsFromCsv(italianCsv, ITALIAN_CSV_CONFIG),
  },
  german: {
    name: 'Deutsch',
    levels: buildLevelsFromCsv(germanCsv, GERMAN_CSV_CONFIG),
  },
  swedish: {
    name: 'Svenska',
    levels: buildLevelsFromCsv(swedishCsv, SWEDISH_CSV_CONFIG),
  },
}

export const LANGUAGE_PACKS = deepFreeze(
  Object.fromEntries(
    Object.entries(LANGUAGE_LEVELS).map(([id, pack]) => [
      id,
      createLanguagePack(
        pack.name,
        addExtraWordMatchSourcesToLevels(
          compileLevelsWithReinforcementProgression(pack.levels),
          pack.extraWordMatchSources,
        ),
      ),
    ]),
  ),
)

export const DEFAULT_LANGUAGE = 'english'
export const DEFAULT_LEVEL = 'A1'

export const getLanguageNames = () =>
  Object.entries(LANGUAGE_PACKS).map(([id, pack]) => ({ id, name: pack.name }))

export const getLevelPack = (languageId, levelId) =>
  LANGUAGE_PACKS[languageId]?.levels[levelId] ?? LANGUAGE_PACKS[DEFAULT_LANGUAGE].levels[DEFAULT_LEVEL]

export const getCategoryMap = (languageId, levelId) => {
  const pack = getLevelPack(languageId, levelId)
  return Object.fromEntries(pack.categories.map((category) => [category.id, category]))
}

export const getCategoryOrder = (languageId, levelId) =>
  getLevelPack(languageId, levelId).categories.map((category) => category.id)

export const getSpawnBucketMap = (languageId, levelId) => {
  const pack = getLevelPack(languageId, levelId)
  return Object.fromEntries(
    pack.categories.map((category) => [
      category.id,
      {
        id: category.id,
        categoryId: category.parentCategoryId ?? category.id,
        subcategoryId: category.subcategoryId ?? null,
        words: category.words,
        matchSourceIdsByWord: Object.fromEntries(
          category.words.map((word) => [
            normalizeWord(word),
            pack.wordMatchSourceIds?.[normalizeWord(word)] ?? [category.id],
          ]),
        ),
        styleId: category.styleId ?? category.id,
      },
    ]),
  )
}

export const getSpawnBucketOrder = (languageId, levelId) =>
  Object.keys(getSpawnBucketMap(languageId, levelId))
