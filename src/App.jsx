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
  getSpawnBucketMap,
  getSpawnBucketOrder,
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
const START_ANNOUNCEMENT_MS = 2000
const MAX_LIVES = 5
const INITIAL_LIVES = MAX_LIVES
const HEART_SPAWN_MS = 18000
const HEART_PICKUP_POINTS = 1
const HEART_PICKUP_SIZE = 5.8
const HEART_MIN_SPEED = 4.2
const HEART_MAX_SPEED = 5.8
const CORRECT_HIT_POINTS = 10
const WRONG_HIT_POINTS = 10
const MISSED_TARGET_POINTS = 10
const STREAK_BONUS_THRESHOLD = 10
const STREAK_BONUS_POINTS = 40
const INITIAL_WORD_Y_MIN = -6
const INITIAL_WORD_Y_MAX = 10
const ACTIVE_SPAWN_Y_MIN = -8
const ACTIVE_SPAWN_Y_MAX = 9
const DESKTOP_CATEGORY_SWITCH_SAFE_Y = 46
const MOBILE_CATEGORY_SWITCH_SAFE_Y = 42
const CATEGORY_SWITCH_RESPAWN_Y_MAX = 10
const WORD_BOX_HEIGHT = 6
const WORD_CHAR_WIDTH = 1.15
const WORD_BOX_PADDING = 3.2
const MOBILE_WORD_BOX_HEIGHT = 6.8
const MOBILE_WORD_CHAR_WIDTH = 1.22
const MOBILE_WORD_BOX_PADDING = 4.3
const WORD_BOX_BORDER_ALLOWANCE = 0.45
const DESKTOP_BULLET_HITBOX_RADIUS_X = 0.28
const DESKTOP_BULLET_HITBOX_RADIUS_Y = 0.68
const MOBILE_BULLET_HITBOX_RADIUS_X = 0.65
const MOBILE_BULLET_HITBOX_RADIUS_Y = 1.15
const SHIP_LEVEL_HIT_Y = 80
const DESKTOP_SHIP_LEVEL_HITBOX_BONUS_X = 0.22
const DESKTOP_SHIP_LEVEL_HITBOX_BONUS_Y = 0.75
const MOBILE_SHIP_LEVEL_HITBOX_BONUS_X = 0.7
const MOBILE_SHIP_LEVEL_HITBOX_BONUS_Y = 1.4
const MOBILE_ARENA_FIRE_Y_MIN = 74
const WORD_OVERLAP_ALLOWANCE = 0.2
const MAX_READABILITY_OVERLAP = 0.7
const EFFECT_LIFETIME_MS = 550
const HIGH_SCORE_STORAGE_KEY = 'wordshooter-highscores'
const PLAYER_NAME_STORAGE_KEY = 'wordshooter-player-name'
const SETTINGS_STORAGE_KEY = 'wordshooter-settings'
const HIGH_SCORE_LIMIT = 5
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
      present: { label: 'Present Verbs', description: 'verbs in present tense' },
      verbPhrase: { label: 'Verb Phrases', description: 'multi-word verb constructions' },
      phrase: { label: 'Phrases', description: 'short fixed phrases and chunks' },
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
      present: { label: 'Verbes au présent', description: 'verbes conjugués au présent' },
      verbPhrase: { label: 'Locutions verbales', description: 'constructions verbales à plusieurs mots' },
      phrase: { label: 'Phrases', description: 'expressions et segments courts figés' },
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
      present: { label: 'Verbos en presente', description: 'verbos conjugados en presente' },
      verbPhrase: { label: 'Perífrasis verbales', description: 'construcciones verbales de varias palabras' },
      phrase: { label: 'Frases', description: 'frases cortas y bloques fijos' },
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
      present: { label: 'Verbi al presente', description: 'verbi coniugati al presente' },
      verbPhrase: { label: 'Frasi verbali', description: 'costruzioni verbali con più parole' },
      phrase: { label: 'Frasi', description: 'frasi brevi e blocchi fissi' },
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
      present: { label: 'Verben im Präsens', description: 'konjugierte Verben im Präsens' },
      verbPhrase: { label: 'Verbphrasen', description: 'mehrteilige Verbkonstruktionen' },
      phrase: { label: 'Phrasen', description: 'kurze feste Wendungen und Chunks' },
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
      present: { label: 'Verb i presens', description: 'verb böjda i presens' },
      verbPhrase: { label: 'Verbfraser', description: 'verbkonstruktioner med flera ord' },
      phrase: { label: 'Fraser', description: 'korta fasta fraser och uttrycksblock' },
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

const UI_TRANSLATIONS = {
  english: {
    language: 'Language',
    targetLanguage: 'Show instructions in',
    languageHelp: 'Words and grammar in the game use this language.',
    targetLanguageHelp: 'Current target and other guidance use this language.',
    startGame: 'Start game',
    cefrLevel: 'CEFR level',
    curriculumFocus: 'Curriculum focus',
    progression: 'Progression',
    progressionText: 'Target rotates through CEFR-appropriate categories over time',
    leaderboard: 'Leaderboard',
    noScores: 'No scores saved yet.',
    score: 'Score',
    streak: 'Streak',
    nextSwitch: 'New category in',
    highScore: 'High score',
    lives: 'Lives',
    restart: 'Restart',
    restartRun: 'Restart run',
    newGame: 'New game',
    intro:
      'Choose a language and CEFR level, then steer the ship and shoot only the vocabulary or grammar forms that match the active category.',
    gameOver: 'Game over',
    roundComplete: 'Round complete',
    tapRestart: 'Tap restart to play again.',
    pressEnterRestart: 'Press Enter or restart to launch again.',
    newLeaderboardEntry: 'New leaderboard entry',
    yourName: 'Your name',
    saveScore: 'Save score',
    scoreSaved: 'Score saved.',
    tapToShoot: 'Tap to shoot',
    spaceToShoot: 'Space to shoot',
    bonusUnlocked: 'Bonus unlocked',
    missionLoaded:
      'Mission loaded for {language} {level}. Shoot only the matching targets.',
    newTargetCategory: 'New target category: {category}.',
    shootCategory: 'Shoot {category}',
    extraLifeCollected: 'Extra life collected. {lives} lives remaining.',
    heartFull: 'Heart collected, but your lives are already full.',
    correctHit: '"{word}" is correct. +{points} points.',
    streakBonus: 'Streak bonus! {streak} correct hits in a row. +{points} points.',
    wrongCategory: '"{word}" is the wrong category. -{points} points and -1 life.',
    targetEscaped: 'A correct target escaped. -{points} points and -1 life.',
    effectLifeLoss: '-{points} / -1 LIFE',
    effectLifeGain: '+1 LIFE',
    effectFull: 'FULL',
    streakWords: '{streak} word streak bonus!',
  },
  french: {
    language: 'Langue',
    targetLanguage: 'Afficher les instructions en',
    languageHelp: 'Les mots et la grammaire du jeu utilisent cette langue.',
    targetLanguageHelp: 'La cible actuelle et les autres instructions utilisent cette langue.',
    startGame: 'Commencer',
    cefrLevel: 'Niveau CECR',
    curriculumFocus: 'Focus du programme',
    progression: 'Progression',
    progressionText: 'La cible tourne entre des categories adaptees au niveau CECR',
    leaderboard: 'Classement',
    noScores: 'Aucun score enregistre.',
    score: 'Score',
    streak: 'Serie',
    nextSwitch: 'Nouvelle categorie dans',
    highScore: 'Meilleur score',
    lives: 'Vies',
    restart: 'Recommencer',
    restartRun: 'Relancer',
    newGame: 'Nouveau jeu',
    intro:
      'Choisissez une langue et un niveau CECR, puis dirigez le vaisseau et tirez seulement sur le vocabulaire ou les formes grammaticales qui correspondent a la categorie active.',
    gameOver: 'Partie terminee',
    roundComplete: 'Round termine',
    tapRestart: 'Touchez relancer pour rejouer.',
    pressEnterRestart: 'Appuyez sur Entree ou relancez pour rejouer.',
    newLeaderboardEntry: 'Nouveau score',
    yourName: 'Votre nom',
    saveScore: 'Enregistrer',
    scoreSaved: 'Score enregistre.',
    tapToShoot: 'Touchez pour tirer',
    spaceToShoot: 'Espace pour tirer',
    bonusUnlocked: 'Bonus active',
    missionLoaded:
      'Mission chargee pour {language} {level}. Tirez seulement sur les bonnes cibles.',
    newTargetCategory: 'Nouvelle categorie cible : {category}.',
    shootCategory: 'Tirez sur {category}',
    extraLifeCollected: 'Vie supplementaire gagnee. Il reste {lives} vies.',
    heartFull: 'Coeur recupere, mais vos vies sont deja au maximum.',
    correctHit: '"{word}" est correct. +{points} points.',
    streakBonus: 'Bonus de serie ! {streak} reponses justes de suite. +{points} points.',
    wrongCategory: '"{word}" est dans la mauvaise categorie. -{points} points et -1 vie.',
    targetEscaped: 'Une bonne cible s est echappee. -{points} points et -1 vie.',
    effectLifeLoss: '-{points} / -1 VIE',
    effectLifeGain: '+1 VIE',
    effectFull: 'MAX',
    streakWords: 'Bonus serie de {streak} mots !',
  },
  spanish: {
    language: 'Idioma',
    targetLanguage: 'Mostrar instrucciones en',
    languageHelp: 'Las palabras y la gramatica del juego usan este idioma.',
    targetLanguageHelp: 'Objetivo actual y otras instrucciones usan este idioma.',
    startGame: 'Empezar',
    cefrLevel: 'Nivel MCER',
    curriculumFocus: 'Enfoque del curso',
    progression: 'Progresion',
    progressionText: 'El objetivo rota entre categorias adecuadas al nivel MCER',
    leaderboard: 'Clasificacion',
    noScores: 'Todavia no hay puntuaciones guardadas.',
    score: 'Puntuacion',
    streak: 'Racha',
    nextSwitch: 'Nueva categoria en',
    highScore: 'Puntuacion maxima',
    lives: 'Vidas',
    restart: 'Reiniciar',
    restartRun: 'Reiniciar partida',
    newGame: 'Nuevo juego',
    intro:
      'Elige un idioma y un nivel MCER, luego dirige la nave y dispara solo al vocabulario o a las formas gramaticales que coincidan con la categoria activa.',
    gameOver: 'Fin de la partida',
    roundComplete: 'Ronda completada',
    tapRestart: 'Toca reiniciar para jugar otra vez.',
    pressEnterRestart: 'Pulsa Enter o reinicia para volver a jugar.',
    newLeaderboardEntry: 'Nueva puntuacion',
    yourName: 'Tu nombre',
    saveScore: 'Guardar',
    scoreSaved: 'Puntuacion guardada.',
    tapToShoot: 'Toca para disparar',
    spaceToShoot: 'Pulsa espacio para disparar',
    bonusUnlocked: 'Bonus desbloqueado',
    missionLoaded:
      'Mision cargada para {language} {level}. Dispara solo a los objetivos correctos.',
    newTargetCategory: 'Nueva categoria objetivo: {category}.',
    shootCategory: 'Dispara a {category}',
    extraLifeCollected: 'Vida extra conseguida. Te quedan {lives} vidas.',
    heartFull: 'Corazon recogido, pero ya tienes todas las vidas.',
    correctHit: '"{word}" es correcto. +{points} puntos.',
    streakBonus: 'Bonus de racha. {streak} aciertos seguidos. +{points} puntos.',
    wrongCategory: '"{word}" es la categoria incorrecta. -{points} puntos y -1 vida.',
    targetEscaped: 'Se escapo un objetivo correcto. -{points} puntos y -1 vida.',
    effectLifeLoss: '-{points} / -1 VIDA',
    effectLifeGain: '+1 VIDA',
    effectFull: 'MAX',
    streakWords: 'Bonus por racha de {streak} palabras',
  },
  italian: {
    language: 'Lingua',
    targetLanguage: 'Mostra le istruzioni in',
    languageHelp: 'Le parole e la grammatica del gioco usano questa lingua.',
    targetLanguageHelp: 'Obiettivo attuale e altre istruzioni usano questa lingua.',
    startGame: 'Inizia',
    cefrLevel: 'Livello QCER',
    curriculumFocus: 'Focus del corso',
    progression: 'Progressione',
    progressionText: 'L obiettivo ruota tra categorie adatte al livello QCER',
    leaderboard: 'Classifica',
    noScores: 'Nessun punteggio salvato.',
    score: 'Punteggio',
    streak: 'Serie',
    nextSwitch: 'Nuova categoria tra',
    highScore: 'Record',
    lives: 'Vite',
    restart: 'Riavvia',
    restartRun: 'Riavvia partita',
    newGame: 'Nuova partita',
    intro:
      'Scegli una lingua e un livello QCER, poi guida la nave e spara solo al vocabolario o alle forme grammaticali che corrispondono alla categoria attiva.',
    gameOver: 'Game over',
    roundComplete: 'Round completato',
    tapRestart: 'Tocca riavvia per giocare ancora.',
    pressEnterRestart: 'Premi Invio o riavvia per giocare ancora.',
    newLeaderboardEntry: 'Nuovo punteggio',
    yourName: 'Il tuo nome',
    saveScore: 'Salva',
    scoreSaved: 'Punteggio salvato.',
    tapToShoot: 'Tocca per sparare',
    spaceToShoot: 'Premi spazio per sparare',
    bonusUnlocked: 'Bonus sbloccato',
    missionLoaded:
      'Missione caricata per {language} {level}. Spara solo ai bersagli giusti.',
    newTargetCategory: 'Nuova categoria bersaglio: {category}.',
    shootCategory: 'Spara a {category}',
    extraLifeCollected: 'Vita extra ottenuta. Ti restano {lives} vite.',
    heartFull: 'Cuore raccolto, ma le vite sono gia al massimo.',
    correctHit: '"{word}" e corretto. +{points} punti.',
    streakBonus: 'Bonus serie! {streak} colpi giusti di fila. +{points} punti.',
    wrongCategory: '"{word}" e la categoria sbagliata. -{points} punti e -1 vita.',
    targetEscaped: 'Un bersaglio corretto e scappato. -{points} punti e -1 vita.',
    effectLifeLoss: '-{points} / -1 VITA',
    effectLifeGain: '+1 VITA',
    effectFull: 'MAX',
    streakWords: 'Bonus serie da {streak} parole!',
  },
  german: {
    language: 'Sprache',
    targetLanguage: 'Anweisungen anzeigen auf',
    languageHelp: 'Worter und Grammatik im Spiel nutzen diese Sprache.',
    targetLanguageHelp: 'Aktuelles Ziel und andere Hinweise nutzen diese Sprache.',
    startGame: 'Starten',
    cefrLevel: 'GER-Niveau',
    curriculumFocus: 'Lernfokus',
    progression: 'Fortschritt',
    progressionText: 'Das Ziel wechselt zwischen GER-passenden Kategorien',
    leaderboard: 'Bestenliste',
    noScores: 'Noch keine Punkte gespeichert.',
    score: 'Punktzahl',
    streak: 'Serie',
    nextSwitch: 'Neue Kategorie in',
    highScore: 'Highscore',
    lives: 'Leben',
    restart: 'Neustart',
    restartRun: 'Runde neu starten',
    newGame: 'Neues Spiel',
    intro:
      'Waehle eine Sprache und ein GER-Niveau, steuere dann das Schiff und schiesse nur auf Woerter oder Grammatikformen, die zur aktiven Kategorie passen.',
    gameOver: 'Spiel vorbei',
    roundComplete: 'Runde beendet',
    tapRestart: 'Tippe auf Neustart, um weiterzuspielen.',
    pressEnterRestart: 'Druecke Enter oder starte neu, um weiterzuspielen.',
    newLeaderboardEntry: 'Neuer Eintrag',
    yourName: 'Dein Name',
    saveScore: 'Speichern',
    scoreSaved: 'Punktzahl gespeichert.',
    tapToShoot: 'Tippen zum Schiessen',
    spaceToShoot: 'Leertaste zum Schiessen',
    bonusUnlocked: 'Bonus aktiviert',
    missionLoaded:
      'Mission fuer {language} {level} geladen. Schiesse nur auf passende Ziele.',
    newTargetCategory: 'Neue Zielkategorie: {category}.',
    shootCategory: 'Schiesse auf {category}',
    extraLifeCollected: 'Extraleben eingesammelt. Noch {lives} Leben uebrig.',
    heartFull: 'Herz eingesammelt, aber deine Leben sind bereits voll.',
    correctHit: '"{word}" ist korrekt. +{points} Punkte.',
    streakBonus: 'Serienbonus! {streak} richtige Treffer in Folge. +{points} Punkte.',
    wrongCategory: '"{word}" ist die falsche Kategorie. -{points} Punkte und -1 Leben.',
    targetEscaped: 'Ein richtiges Ziel ist entkommen. -{points} Punkte und -1 Leben.',
    effectLifeLoss: '-{points} / -1 LEBEN',
    effectLifeGain: '+1 LEBEN',
    effectFull: 'VOLL',
    streakWords: '{streak}er-Serienbonus!',
  },
  swedish: {
    language: 'Språk',
    targetLanguage: 'Visa instruktioner på',
    languageHelp: 'Ord och grammatik i spelet använder det här språket.',
    targetLanguageHelp: 'Nuvarande mål och andra instruktioner använder det här språket.',
    startGame: 'Starta spelet',
    cefrLevel: 'CEFR-nivå',
    curriculumFocus: 'Kursfokus',
    progression: 'Progression',
    progressionText: 'Målkategorin roterar mellan CEFR-anpassade kategorier',
    leaderboard: 'Topplista',
    noScores: 'Inga sparade resultat än.',
    score: 'Poäng',
    streak: 'Streak',
    nextSwitch: 'Ny kategori om',
    highScore: 'High score',
    lives: 'Liv',
    restart: 'Starta om',
    restartRun: 'Starta om runda',
    newGame: 'Nytt spel',
    intro:
      'Välj ett språk och en CEFR-nivå, styr sedan skeppet och skjut bara på ord eller grammatiska former som matchar den aktiva kategorin.',
    gameOver: 'Game over',
    roundComplete: 'Rundan klar',
    tapRestart: 'Tryck på starta om för att spela igen.',
    pressEnterRestart: 'Tryck Enter eller starta om för att spela igen.',
    newLeaderboardEntry: 'Nytt topplisteresultat',
    yourName: 'Ditt namn',
    saveScore: 'Spara',
    scoreSaved: 'Resultat sparat.',
    tapToShoot: 'Knacka för att skjuta',
    spaceToShoot: 'Space för att skjuta',
    bonusUnlocked: 'Bonus upplåst',
    missionLoaded:
      'Uppdrag laddat för {language} {level}. Skjut bara på rätt mål.',
    newTargetCategory: 'Ny målkategori: {category}.',
    shootCategory: 'Skjut på {category}',
    extraLifeCollected: 'Extra liv insamlat. Du har {lives} liv kvar.',
    heartFull: 'Hjärta uppsamlat, men du har redan fullt med liv.',
    correctHit: '"{word}" är rätt. +{points} poäng.',
    streakBonus: 'Streakbonus! {streak} rätta i rad. +{points} poäng.',
    wrongCategory: '"{word}" är fel kategori. -{points} poäng och -1 liv.',
    targetEscaped: 'Ett rätt mål kom undan. -{points} poäng och -1 liv.',
    effectLifeLoss: '-{points} / -1 LIV',
    effectLifeGain: '+1 LIV',
    effectFull: 'FULLT',
    streakWords: '{streak} i rad-bonus!',
  },
}

const getUiText = (languageId) => UI_TRANSLATIONS[languageId] ?? UI_TRANSLATIONS.english

const formatUiText = (template, values = {}) =>
  template.replace(/\{(\w+)\}/g, (_, key) => `${values[key] ?? ''}`)

const getShootPrompt = (languageId, isMobileLayout) => {
  const uiText = getUiText(languageId)
  return isMobileLayout ? uiText.tapToShoot : uiText.spaceToShoot
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const pickRandom = (items) => items[Math.floor(Math.random() * items.length)]
const getCategorySwitchSafeY = (isMobileLayout) =>
  isMobileLayout ? MOBILE_CATEGORY_SWITCH_SAFE_Y : DESKTOP_CATEGORY_SWITCH_SAFE_Y

const getBulletHitboxPadding = (isMobileLayout, isNearShipLevel) => ({
  x:
    (isMobileLayout ? MOBILE_BULLET_HITBOX_RADIUS_X : DESKTOP_BULLET_HITBOX_RADIUS_X) +
    (isNearShipLevel
      ? isMobileLayout
        ? MOBILE_SHIP_LEVEL_HITBOX_BONUS_X
        : DESKTOP_SHIP_LEVEL_HITBOX_BONUS_X
      : 0),
  y:
    (isMobileLayout ? MOBILE_BULLET_HITBOX_RADIUS_Y : DESKTOP_BULLET_HITBOX_RADIUS_Y) +
    (isNearShipLevel
      ? isMobileLayout
        ? MOBILE_SHIP_LEVEL_HITBOX_BONUS_Y
        : DESKTOP_SHIP_LEVEL_HITBOX_BONUS_Y
      : 0),
})

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
      initialCount: 3,
      minActiveWords: 3,
      maxActiveWords: 4,
    }
  }

  if (width <= 480 || height <= 860) {
    return {
      initialCount: 3,
      minActiveWords: 4,
      maxActiveWords: 5,
    }
  }

  return {
    initialCount: 4,
    minActiveWords: 4,
    maxActiveWords: 5,
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

const getHeartBounds = (heart) => {
  const halfSize = HEART_PICKUP_SIZE / 2

  return {
    left: heart.x - halfSize,
    right: heart.x + halfSize,
    top: heart.y - halfSize,
    bottom: heart.y + halfSize,
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

const sanitizeHighScoreName = (value) => {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed.slice(0, 18) || 'Player'
}

const normalizeHighScores = (value) => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (typeof entry === 'number') {
        return [
          key,
          [
            {
              name: 'Local best',
              score: entry,
              achievedAt: null,
            },
          ],
        ]
      }

      if (!Array.isArray(entry)) {
        return [key, []]
      }

      const normalizedEntries = entry
        .filter((item) => item && typeof item.score === 'number')
        .map((item) => ({
          name: sanitizeHighScoreName(typeof item.name === 'string' ? item.name : 'Player'),
          score: item.score,
          achievedAt: typeof item.achievedAt === 'string' ? item.achievedAt : null,
        }))
        .sort((first, second) => second.score - first.score)
        .slice(0, HIGH_SCORE_LIMIT)

      return [key, normalizedEntries]
    }),
  )
}

const loadHighScores = () => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY)
    return raw ? normalizeHighScores(JSON.parse(raw)) : {}
  } catch {
    return {}
  }
}

const loadPlayerName = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    return window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

const loadSettings = () => {
  if (typeof window === 'undefined') {
    return {
      languageId: DEFAULT_LANGUAGE,
      targetLanguageId: DEFAULT_LANGUAGE,
      targetLanguageOverridden: false,
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
        targetLanguageId: DEFAULT_LANGUAGE,
        targetLanguageOverridden: false,
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
    const targetLanguageId =
      parsed.targetLanguageId && LANGUAGE_PACKS[parsed.targetLanguageId]
        ? parsed.targetLanguageId
        : languageId
    const targetLanguageOverridden =
      typeof parsed.targetLanguageOverridden === 'boolean'
        ? parsed.targetLanguageOverridden
        : targetLanguageId !== languageId
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
      targetLanguageId,
      targetLanguageOverridden,
      cefrLevel,
      musicEnabled,
      sfxEnabled,
    }
  } catch {
    return {
      languageId: DEFAULT_LANGUAGE,
      targetLanguageId: DEFAULT_LANGUAGE,
      targetLanguageOverridden: false,
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

const doesWordMatchTarget = (word, target) => {
  if (!target) {
    return false
  }

  const sourceBucketId = word.sourceBucketId ?? word.categoryId
  return (target.sourceBucketIds ?? [target.id]).includes(sourceBucketId)
}

const countWordsMatchingTarget = (target, words) =>
  words.filter((word) => doesWordMatchTarget(word, target)).length

const countPlayableWordsMatchingTarget = (target, words, maxY) =>
  words.filter((word) => doesWordMatchTarget(word, target) && word.y < maxY).length

const getDesiredTargetWordCount = (target) =>
  target?.matchType === 'subcategory' ? Math.min(2, target.words.length) : 1

const getPreferredSpawnBucketId = (target, activeWords) => {
  const sourceBucketIds = target?.sourceBucketIds ?? []
  if (sourceBucketIds.length === 0) {
    return null
  }

  const counts = Object.fromEntries(
    sourceBucketIds.map((bucketId) => [
      bucketId,
      activeWords.filter((word) => (word.sourceBucketId ?? word.categoryId) === bucketId).length,
    ]),
  )
  const minCount = Math.min(...Object.values(counts))
  const eligible = sourceBucketIds.filter((bucketId) => counts[bucketId] === minCount)
  return pickRandom(eligible)
}

const makeSpecificCategoryWord = ({
  id,
  categoryId,
  score,
  categoryMap,
  recentWordsByCategory = {},
  yRange = { min: INITIAL_WORD_Y_MIN, max: CATEGORY_SWITCH_RESPAWN_Y_MAX },
}) => {
  const bucket = categoryMap[categoryId]
  return {
    id,
    text: pickCategoryWordText(categoryMap, categoryId, recentWordsByCategory),
    categoryId: bucket.categoryId ?? categoryId,
    subcategoryId: bucket.subcategoryId ?? null,
    sourceBucketId: categoryId,
    x: 12 + Math.random() * 76,
    y: yRange.min + Math.random() * (yRange.max - yRange.min),
    speed: WORD_MIN_SPEED + Math.random() * WORD_MAX_SPEED + score * 0.12,
  }
}

const makeHeartPickup = (id) => ({
  id,
  x: 14 + Math.random() * 72,
  y: INITIAL_WORD_Y_MIN + Math.random() * 6,
  speed: HEART_MIN_SPEED + Math.random() * HEART_MAX_SPEED,
})

const countWordsByCategory = (categoryOrder, words) =>
  categoryOrder.reduce(
    (counts, categoryId) => ({
      ...counts,
      [categoryId]: words.filter((word) => (word.sourceBucketId ?? word.categoryId) === categoryId).length,
    }),
    {},
  )

const pickBalancedCategoryId = (
  categoryOrder,
  words,
  { mustIncludeCategoryId = null, avoidCategoryId = null } = {},
) => {
  if (
    mustIncludeCategoryId &&
    !words.some((word) => (word.sourceBucketId ?? word.categoryId) === mustIncludeCategoryId)
  ) {
    return mustIncludeCategoryId
  }

  const counts = countWordsByCategory(categoryOrder, words)
  const minCount = Math.min(...Object.values(counts))
  let eligible = categoryOrder.filter((categoryId) => counts[categoryId] === minCount)

  if (avoidCategoryId && eligible.length > 1) {
    eligible = eligible.filter((categoryId) => categoryId !== avoidCategoryId)
  }

  return pickRandom(eligible)
}

const makeWordFactory = (languageId, cefrLevel) => {
  const categoryOrder = getSpawnBucketOrder(languageId, cefrLevel)
  const categoryMap = getSpawnBucketMap(languageId, cefrLevel)

  return (
    id,
    score,
    activeWords,
    recentWordsByCategory = {},
    yRange = { min: ACTIVE_SPAWN_Y_MIN, max: ACTIVE_SPAWN_Y_MAX },
    options = {},
  ) => {
    const categoryId = pickBalancedCategoryId(categoryOrder, activeWords, options)
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
      0,
      initialWords,
      recentWordsByCategory,
      {
        min: INITIAL_WORD_Y_MIN,
        max: INITIAL_WORD_Y_MAX,
      },
    )
    initialWords.push(placeWordWithoutOverlap(candidate, initialWords, isMobileLayout))
    recentWordsByCategory = rememberRecentWord(
      recentWordsByCategory,
      candidate.sourceBucketId ?? candidate.categoryId,
      candidate.text,
    )
  }

  return {
    languageId,
    cefrLevel,
    playerX: 50,
    bullets: [],
    words: initialWords,
    hearts: [],
    effects: [],
    recentWordsByCategory,
    score: 0,
    bestScore: 0,
    lives: INITIAL_LIVES,
    streak: 0,
    phase: 1,
    nextCategorySwitchMs: CATEGORY_SWITCH_MS,
    nextHeartSpawnMs: HEART_SPAWN_MS,
    startAnnouncement: getShootPrompt(languageId, isMobileLayout),
    startAnnouncementMs: START_ANNOUNCEMENT_MS,
    categoryAnnouncement: '',
    categoryAnnouncementMs: 0,
    streakAnnouncement: '',
    streakAnnouncementMs: 0,
    endReason: null,
    status: 'playing',
    targetCategory,
    feedback: formatUiText(getUiText(languageId).missionLoaded, {
      language: LANGUAGE_PACKS[languageId].name,
      level: cefrLevel,
    }),
    feedbackTone: 'neutral',
  }
}

function App() {
  const [selection, setSelection] = useState(loadSettings)
  const [highScores, setHighScores] = useState(loadHighScores)
  const [playerName, setPlayerName] = useState(loadPlayerName)
  const [hasSubmittedCurrentRun, setHasSubmittedCurrentRun] = useState(false)
  const [hasLaunchedInitialRun, setHasLaunchedInitialRun] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
  const heartIdRef = useRef(0)
  const spawnCountRef = useRef(wordBudget.initialCount)
  const effectIdRef = useRef(0)
  const audioRef = useRef(null)
  const arenaRef = useRef(null)
  const controlLineRef = useRef(null)
  const arenaTouchStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startPlayerX: 50,
    moved: false,
    active: false,
  })
  const controlTouchStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startPlayerX: 50,
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
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, playerName)
  }, [playerName])

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
    }
  }, [isMobileLayout])

  const resetGame = useCallback(
    (nextLanguage = selection.languageId, nextLevel = selection.cefrLevel) => {
      lastFrameRef.current = 0
      lastSpawnRef.current = 0
      lastShotRef.current = 0
      bulletIdRef.current = 0
      wordIdRef.current = wordBudget.initialCount
      heartIdRef.current = 0
      spawnCountRef.current = wordBudget.initialCount
      effectIdRef.current = 0
      keysRef.current.clear()
      setHasSubmittedCurrentRun(false)
      arenaTouchStateRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        startPlayerX: 50,
        moved: false,
        active: false,
      }
      controlTouchStateRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        startPlayerX: 50,
        moved: false,
      }
      setGame(buildInitialGame(nextLanguage, nextLevel, wordBudget, isMobileLayout))
    },
    [isMobileLayout, selection.cefrLevel, selection.languageId, wordBudget],
  )

  const saveHighScoreEntry = useCallback(() => {
    if (game.status !== 'gameover' || game.bestScore <= 0 || hasSubmittedCurrentRun) {
      return
    }

    const highScoreKey = getHighScoreKey(game.languageId, game.cefrLevel)
    const nextEntry = {
      name: sanitizeHighScoreName(playerName),
      score: game.bestScore,
      achievedAt: new Date().toISOString(),
    }

    setHighScores((current) => {
      const existingEntries = current[highScoreKey] ?? []
      const nextEntries = [...existingEntries, nextEntry]
        .sort((first, second) => second.score - first.score)
        .slice(0, HIGH_SCORE_LIMIT)

      return {
        ...current,
        [highScoreKey]: nextEntries,
      }
    })
    setHasSubmittedCurrentRun(true)
  }, [game.bestScore, game.cefrLevel, game.languageId, game.status, hasSubmittedCurrentRun, playerName])

  const saveHighScoreEntryAndReset = useCallback(() => {
    if (game.status !== 'gameover' || game.bestScore <= 0 || hasSubmittedCurrentRun) {
      return
    }

    const highScoreKey = getHighScoreKey(game.languageId, game.cefrLevel)
    const nextEntry = {
      name: sanitizeHighScoreName(playerName),
      score: game.bestScore,
      achievedAt: new Date().toISOString(),
    }

    setHighScores((current) => {
      const existingEntries = current[highScoreKey] ?? []
      const nextEntries = [...existingEntries, nextEntry]
        .sort((first, second) => second.score - first.score)
        .slice(0, HIGH_SCORE_LIMIT)

      return {
        ...current,
        [highScoreKey]: nextEntries,
      }
    })
    setHasSubmittedCurrentRun(true)
    resetGame()
  }, [
    game.bestScore,
    game.cefrLevel,
    game.languageId,
    game.status,
    hasSubmittedCurrentRun,
    playerName,
    resetGame,
  ])

  const fireBullet = useCallback(() => {
    if (!hasLaunchedInitialRun) {
      return
    }

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
  }, [hasLaunchedInitialRun, selection.sfxEnabled])

  const movePlayerToClientX = useCallback((clientX, surface = arenaRef.current) => {
    if (!surface) {
      return null
    }

    const bounds = surface.getBoundingClientRect()
    const relativeX = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const nextPlayerX = 8 + relativeX * 84

    setGame((current) => ({
      ...current,
      playerX: nextPlayerX,
    }))
  }, [])

  const movePlayerByRelativeDrag = useCallback(
    (clientX, startClientX, startPlayerX, surface = arenaRef.current) => {
      if (!surface) {
        return
      }

      const bounds = surface.getBoundingClientRect()
      const relativeDelta = ((clientX - startClientX) / bounds.width) * 84
      const nextPlayerX = clamp(startPlayerX + relativeDelta, 8, 92)

      setGame((current) => ({
        ...current,
        playerX: nextPlayerX,
      }))
    },
    [],
  )

  const handleArenaPointerDown = useCallback(
    (event) => {
      if (!hasLaunchedInitialRun) {
        return
      }

      if (!isMobileLayout) {
        if (event.pointerType !== 'mouse' || event.button !== 0) {
          return
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
        arenaTouchStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startPlayerX: gameRef.current.playerX,
          moved: false,
          active: true,
        }
        return
      }

      if (event.pointerType === 'mouse' && window.innerWidth > 720) {
        return
      }

      const bounds = event.currentTarget.getBoundingClientRect()
      const relativeY = ((event.clientY - bounds.top) / bounds.height) * 100

      const isBottomControlZone = relativeY >= MOBILE_ARENA_FIRE_Y_MIN
      arenaTouchStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPlayerX: gameRef.current.playerX,
        moved: false,
        active: isBottomControlZone,
      }

      if (isBottomControlZone) {
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }
    },
    [hasLaunchedInitialRun, isMobileLayout],
  )

  const handleArenaPointerMove = useCallback(
    (event) => {
      if (!hasLaunchedInitialRun) {
        return
      }

      if (arenaTouchStateRef.current.pointerId !== event.pointerId || !arenaTouchStateRef.current.active) {
        return
      }

      const deltaX = Math.abs(event.clientX - arenaTouchStateRef.current.startX)
      const deltaY = Math.abs(event.clientY - arenaTouchStateRef.current.startY)

      if (deltaX > 6 || deltaY > 6) {
        arenaTouchStateRef.current.moved = true
        if (isMobileLayout) {
          movePlayerByRelativeDrag(
            event.clientX,
            arenaTouchStateRef.current.startX,
            arenaTouchStateRef.current.startPlayerX,
            arenaRef.current,
          )
        } else {
          movePlayerToClientX(event.clientX, arenaRef.current)
        }
      }
    },
    [hasLaunchedInitialRun, isMobileLayout, movePlayerByRelativeDrag, movePlayerToClientX],
  )

  const handleArenaPointerUp = useCallback(
    (event) => {
      if (!hasLaunchedInitialRun) {
        return
      }

      if (arenaTouchStateRef.current.pointerId !== event.pointerId) {
        return
      }

      const shouldFire =
        arenaTouchStateRef.current.active && !arenaTouchStateRef.current.moved

      arenaTouchStateRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        startPlayerX: 50,
        moved: false,
        active: false,
      }

      if (shouldFire) {
        fireBullet()
      }
    },
    [fireBullet, hasLaunchedInitialRun],
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
        startPlayerX: gameRef.current.playerX,
        moved: false,
      }
    },
    [isMobileLayout],
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
        movePlayerByRelativeDrag(
          event.clientX,
          controlTouchStateRef.current.startX,
          controlTouchStateRef.current.startPlayerX,
          controlLineRef.current,
        )
      }
    },
    [isMobileLayout, movePlayerByRelativeDrag],
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
        startPlayerX: 50,
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

  const startInitialRun = useCallback(() => {
    audioRef.current?.resume()
    setHasLaunchedInitialRun(true)
    resetGame()
  }, [resetGame])

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
        if (isMobileLayout) {
          return
        }

        if (!hasLaunchedInitialRun) {
          startInitialRun()
          return
        }

        if (game.status === 'gameover') {
          resetGame()
          return
        }

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
  }, [fireBullet, game.status, hasLaunchedInitialRun, isMobileLayout, resetGame, startInitialRun])

  useEffect(() => {
    if (
      !hasLaunchedInitialRun ||
      game.status === 'gameover' ||
      (isMobileLayout && mobileMenuOpen)
    ) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setGame((current) => {
        if (current.status === 'gameover') {
          return current
        }

        const categoryOrder = getCategoryOrder(current.languageId, current.cefrLevel)
        const categoryMap = getCategoryMap(current.languageId, current.cefrLevel)
        const spawnBucketOrder = getSpawnBucketOrder(current.languageId, current.cefrLevel)
        const spawnBucketMap = getSpawnBucketMap(current.languageId, current.cefrLevel)
        const uiText = getUiText(current.languageId)
        const nextCategory = getNextCategoryId(categoryOrder, current.targetCategory)
        const nextTarget = categoryMap[nextCategory]
        const categorySwitchSafeY = getCategorySwitchSafeY(isMobileLayout)
        const wordsTooLowForNewTarget = current.words.filter(
          (word) => doesWordMatchTarget(word, nextTarget) && word.y >= categorySwitchSafeY,
        )
        const preservedWords = current.words.filter(
          (word) => !(doesWordMatchTarget(word, nextTarget) && word.y >= categorySwitchSafeY),
        )
        let adjustedWords = [...preservedWords]
        let recentWordsByCategory = current.recentWordsByCategory

        wordsTooLowForNewTarget.forEach(() => {
          const needsVisibleTarget =
            countPlayableWordsMatchingTarget(nextTarget, adjustedWords, categorySwitchSafeY) <
            getDesiredTargetWordCount(nextTarget)
          const preferredBucketId = needsVisibleTarget
            ? getPreferredSpawnBucketId(nextTarget, adjustedWords)
            : null
          const replacementCategoryId = pickBalancedCategoryId(spawnBucketOrder, adjustedWords, {
            mustIncludeCategoryId: preferredBucketId,
            avoidCategoryId: preferredBucketId ? null : getPreferredSpawnBucketId(nextTarget, adjustedWords),
          })
          const replacement = placeWordWithoutOverlap(
            makeSpecificCategoryWord({
              id: wordIdRef.current++,
              categoryId: replacementCategoryId,
              score: current.score,
              categoryMap: spawnBucketMap,
              recentWordsByCategory,
            }),
            adjustedWords,
            isMobileLayout,
          )
          adjustedWords.push(replacement)
          recentWordsByCategory = rememberRecentWord(
            recentWordsByCategory,
            replacement.sourceBucketId,
            replacement.text,
          )
        })

        while (
          countPlayableWordsMatchingTarget(nextTarget, adjustedWords, categorySwitchSafeY) <
          getDesiredTargetWordCount(nextTarget)
        ) {
          const preferredBucketId = getPreferredSpawnBucketId(nextTarget, adjustedWords)
          const replacementCategoryId = pickBalancedCategoryId(spawnBucketOrder, adjustedWords, {
            mustIncludeCategoryId: preferredBucketId,
          })
          const replacement = placeWordWithoutOverlap(
            makeSpecificCategoryWord({
              id: wordIdRef.current++,
              categoryId: replacementCategoryId,
              score: current.score,
              categoryMap: spawnBucketMap,
              recentWordsByCategory,
              yRange: {
                min: INITIAL_WORD_Y_MIN,
                max: CATEGORY_SWITCH_RESPAWN_Y_MAX,
              },
            }),
            adjustedWords,
            isMobileLayout,
          )
          adjustedWords.push(replacement)
          recentWordsByCategory = rememberRecentWord(
            recentWordsByCategory,
            replacement.sourceBucketId,
            replacement.text,
          )
        }

        return {
          ...current,
          words: adjustedWords,
          recentWordsByCategory,
          phase: current.phase + 1,
          targetCategory: nextCategory,
          nextCategorySwitchMs: CATEGORY_SWITCH_MS,
          categoryAnnouncement: formatUiText(uiText.shootCategory, {
            category: categoryMap[nextCategory].pluralLabel,
          }),
          categoryAnnouncementMs: CATEGORY_ANNOUNCEMENT_MS,
          feedback: formatUiText(uiText.newTargetCategory, {
            category: categoryMap[nextCategory].label,
          }),
          feedbackTone: 'neutral',
        }
      })
    }, CATEGORY_SWITCH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [game.cefrLevel, game.languageId, game.status, hasLaunchedInitialRun, isMobileLayout, mobileMenuOpen])

  useEffect(() => {
    const tick = (timestamp) => {
      if (!hasLaunchedInitialRun || (isMobileLayout && mobileMenuOpen)) {
        lastFrameRef.current = timestamp
        rafRef.current = window.requestAnimationFrame(tick)
        return
      }

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

        const uiText = getUiText(current.languageId)
        const targetMap = getCategoryMap(current.languageId, current.cefrLevel)
        const activeTarget = targetMap[current.targetCategory]
        const makeWord = makeWordFactory(current.languageId, current.cefrLevel)

        let playerDirection = 0
        if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
          playerDirection -= 1
        }
        if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
          playerDirection += 1
        }

        let nextPlayerX = clamp(
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
        let nextHearts = current.hearts.map((heart) => ({
          ...heart,
          y: heart.y + heart.speed * delta,
        }))
        nextWords = gentlyResolveUnreadableOverlap(nextWords, isMobileLayout)
        let nextEffects = current.effects
          .map((effect) => ({ ...effect, ttl: effect.ttl - delta * 1000 }))
          .filter((effect) => effect.ttl > 0)
        let recentWordsByCategory = current.recentWordsByCategory

        let score = current.score
        let bestScore = current.bestScore
        let lives = current.lives
        let streak = current.streak
        let feedback = current.feedback
        let feedbackTone = current.feedbackTone
        const phase = current.phase
        const targetCategory = current.targetCategory
        let categoryAnnouncement = current.categoryAnnouncement
        let categoryAnnouncementMs = Math.max(
          0,
          current.categoryAnnouncementMs - delta * 1000,
        )
        let startAnnouncement = current.startAnnouncement
        let startAnnouncementMs = Math.max(
          0,
          current.startAnnouncementMs - delta * 1000,
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
        let nextHeartSpawnMs = Math.max(0, current.nextHeartSpawnMs - delta * 1000)

        const spentBullets = new Set()
        const destroyedWords = new Set()
        const collectedHearts = new Set()

        nextBullets.forEach((bullet) => {
          const hitHeart = nextHearts.find((heart) => {
            if (collectedHearts.has(heart.id)) {
              return false
            }

            return segmentIntersectsRect(
              bullet.x,
              bullet.previousY ?? bullet.y,
              bullet.x,
              bullet.y,
              getHeartBounds(heart),
            )
          })

          if (hitHeart) {
            spentBullets.add(bullet.id)
            collectedHearts.add(hitHeart.id)
            const gainedLife = lives < MAX_LIVES
            lives = Math.min(MAX_LIVES, lives + HEART_PICKUP_POINTS)
            feedback = gainedLife
              ? formatUiText(uiText.extraLifeCollected, { lives })
              : uiText.heartFull
            feedbackTone = 'good'
            nextEffects = [
              ...nextEffects,
              {
                id: effectIdRef.current++,
                x: hitHeart.x,
                y: hitHeart.y,
                tone: 'bonus',
                label: gainedLife ? uiText.effectLifeGain : uiText.effectFull,
                ttl: EFFECT_LIFETIME_MS + 120,
              },
            ]
            if (selection.sfxEnabled) {
              audioRef.current?.playBonus()
            }
            return
          }

          const hitWord = nextWords.find((word) => {
            if (destroyedWords.has(word.id)) {
              return false
            }

            const isNearShipLevel = word.y >= SHIP_LEVEL_HIT_Y
            const bounds = getWordBounds(word, isMobileLayout)
            const hitboxPadding = getBulletHitboxPadding(isMobileLayout, isNearShipLevel)
            const rect = {
              left: bounds.left - hitboxPadding.x,
              right: bounds.right + hitboxPadding.x,
              top: bounds.top - hitboxPadding.y,
              bottom: bounds.bottom + hitboxPadding.y,
            }

            return segmentIntersectsRect(
              bullet.x,
              bullet.previousY ?? bullet.y,
              bullet.x,
              bullet.y,
              rect,
            )
          })

          if (!hitWord) {
            return
          }

          spentBullets.add(bullet.id)
          destroyedWords.add(hitWord.id)

          if (doesWordMatchTarget(hitWord, activeTarget)) {
            score += CORRECT_HIT_POINTS
            bestScore = Math.max(bestScore, score)
            streak += 1
            feedback = formatUiText(uiText.correctHit, {
              word: hitWord.text,
              points: CORRECT_HIT_POINTS,
            })
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
              feedback = formatUiText(uiText.streakBonus, {
                streak,
                points: STREAK_BONUS_POINTS,
              })
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
              streakAnnouncement = formatUiText(uiText.streakWords, { streak })
              streakAnnouncementMs = STREAK_ANNOUNCEMENT_MS
              if (selection.sfxEnabled) {
                audioRef.current?.playBonus()
              }
            }
          } else {
            score = Math.max(0, score - WRONG_HIT_POINTS)
            lives -= 1
            streak = 0
            feedback = formatUiText(uiText.wrongCategory, {
              word: hitWord.text,
              points: WRONG_HIT_POINTS,
            })
            feedbackTone = 'bad'
            nextEffects = [
              ...nextEffects,
              {
                id: effectIdRef.current++,
                x: hitWord.x,
                y: hitWord.y,
                tone: 'bad',
                label: formatUiText(uiText.effectLifeLoss, {
                  points: WRONG_HIT_POINTS,
                }),
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
        nextHearts = nextHearts.filter((heart) => !collectedHearts.has(heart.id) && heart.y < 98)

        const slippedWords = nextWords.filter((word) => word.y >= 96)
        if (slippedWords.some((word) => doesWordMatchTarget(word, activeTarget))) {
          score = Math.max(0, score - MISSED_TARGET_POINTS)
          lives -= 1
          streak = 0
          feedback = formatUiText(uiText.targetEscaped, {
            points: MISSED_TARGET_POINTS,
          })
          feedbackTone = 'bad'
          const missedTarget = slippedWords.find((word) => doesWordMatchTarget(word, activeTarget))
          if (missedTarget) {
            nextEffects = [
              ...nextEffects,
              {
                id: effectIdRef.current++,
                x: missedTarget.x,
                y: 92,
                tone: 'bad',
                label: formatUiText(uiText.effectLifeLoss, {
                  points: MISSED_TARGET_POINTS,
                }),
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
          const preferredBucketId =
            countWordsMatchingTarget(activeTarget, nextWords) < getDesiredTargetWordCount(activeTarget)
              ? getPreferredSpawnBucketId(activeTarget, nextWords)
              : null

          while (nextWords.length < wordBudget.minActiveWords) {
            spawnCountRef.current += 1
            const candidate = makeWord(
              wordIdRef.current++,
              score,
              nextWords,
              recentWordsByCategory,
              undefined,
              {
                mustIncludeCategoryId: preferredBucketId,
              },
            )
            const placedWord = placeWordWithoutOverlap(candidate, nextWords, isMobileLayout)
            nextWords = [...nextWords, placedWord]
            recentWordsByCategory = rememberRecentWord(
              recentWordsByCategory,
              placedWord.sourceBucketId,
              placedWord.text,
            )
          }

          if (spawnDue && nextWords.length < wordBudget.maxActiveWords) {
            spawnCountRef.current += 1
            const candidate = makeWord(
              wordIdRef.current++,
              score,
              nextWords,
              recentWordsByCategory,
              undefined,
              {
                mustIncludeCategoryId: preferredBucketId,
              },
            )
            const placedWord = placeWordWithoutOverlap(candidate, nextWords, isMobileLayout)
            nextWords = [...nextWords, placedWord]
            recentWordsByCategory = rememberRecentWord(
              recentWordsByCategory,
              placedWord.sourceBucketId,
              placedWord.text,
            )
          }
        }

        if (lives >= MAX_LIVES) {
          nextHearts = []
          nextHeartSpawnMs = HEART_SPAWN_MS
        } else if (nextHeartSpawnMs <= 0) {
          nextHearts = [...nextHearts, makeHeartPickup(heartIdRef.current++)]
          nextHeartSpawnMs = HEART_SPAWN_MS * (0.88 + Math.random() * 0.28)
        }

        if (lives <= 0) {
          return {
            ...current,
            playerX: nextPlayerX,
            bullets: [],
            words: nextWords,
            hearts: nextHearts,
            effects: nextEffects,
            recentWordsByCategory,
            score: Math.max(score, 0),
            bestScore,
            lives: 0,
            streak,
            phase,
            targetCategory,
            categoryAnnouncement: '',
            categoryAnnouncementMs: 0,
            streakAnnouncement: '',
            streakAnnouncementMs: 0,
            nextCategorySwitchMs: 0,
            nextHeartSpawnMs: 0,
            startAnnouncement: '',
            startAnnouncementMs: 0,
            endReason: 'lives',
            status: 'gameover',
            feedback: isMobileLayout
              ? `${uiText.gameOver}. ${uiText.score}: ${bestScore}. ${uiText.tapRestart}`
              : `${uiText.gameOver}. ${uiText.score}: ${bestScore}. ${uiText.pressEnterRestart}`,
            feedbackTone: 'bad',
          }
        }

        score = Math.max(score, 0)

        return {
          ...current,
          playerX: nextPlayerX,
          bullets: nextBullets,
          words: nextWords,
          hearts: nextHearts,
          effects: nextEffects,
          recentWordsByCategory,
          score,
          bestScore,
          lives,
          streak,
          phase,
          targetCategory,
          categoryAnnouncement,
          categoryAnnouncementMs,
          startAnnouncement,
          startAnnouncementMs,
          streakAnnouncement,
          streakAnnouncementMs,
          endReason: null,
          status: 'playing',
          nextCategorySwitchMs,
          nextHeartSpawnMs,
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
  }, [hasLaunchedInitialRun, isMobileLayout, mobileMenuOpen, selection.sfxEnabled, wordBudget])

  const levelPack = getLevelPack(game.languageId, game.cefrLevel)
  const targetCategoryMap = getCategoryMap(game.languageId, game.cefrLevel)
  const currentTarget = targetCategoryMap[game.targetCategory]
  const targetStyle =
    CATEGORY_STYLES[currentTarget?.styleId ?? game.targetCategory] ?? CATEGORY_STYLES.verb
  const languages = getLanguageNames()
  const uiLanguageId = selection.languageId
  const uiText = getUiText(uiLanguageId)
  const targetLanguageId = selection.targetLanguageId ?? selection.languageId
  const targetUiPack =
    TARGET_UI_TRANSLATIONS[targetLanguageId] ?? TARGET_UI_TRANSLATIONS.english
  const targetUiCategory =
    targetUiPack.categories[game.targetCategory] ??
    TARGET_UI_TRANSLATIONS.english.categories[game.targetCategory] ?? {
      label: currentTarget?.label ?? game.targetCategory,
      description: currentTarget?.description ?? '',
    }
  const selectedHighScoreEntries =
    highScores[getHighScoreKey(selection.languageId, selection.cefrLevel)] ?? []
  const selectedHighScore = selectedHighScoreEntries[0]?.score ?? 0
  const gameHighScoreKey = getHighScoreKey(game.languageId, game.cefrLevel)
  const gameHighScoreEntries = highScores[gameHighScoreKey] ?? []
  const lowestQualifyingScore =
    gameHighScoreEntries.length > 0
      ? gameHighScoreEntries[gameHighScoreEntries.length - 1].score
      : 0
  const qualifiesForHighScore =
    game.bestScore > 0 &&
    (gameHighScoreEntries.length < HIGH_SCORE_LIMIT ||
      game.bestScore > lowestQualifyingScore)
  const lifeHearts = Array.from({ length: MAX_LIVES }, (_, index) => index < game.lives)
  const categoryCountdown =
    hasLaunchedInitialRun &&
    game.status !== 'gameover' &&
    game.nextCategorySwitchMs > 0 &&
    game.nextCategorySwitchMs <= 3000
      ? Math.ceil(game.nextCategorySwitchMs / 1000)
      : null
  const nextSwitchDisplay = categoryCountdown
    ? `${categoryCountdown}`
    : `${(game.nextCategorySwitchMs / 1000).toFixed(1)}s`

  const handleLanguageChange = (event) => {
    const languageId = event.target.value
    const targetLanguageId =
      selection.targetLanguageOverridden ? selection.targetLanguageId : languageId
    const nextSelection = {
      languageId,
      targetLanguageId,
      targetLanguageOverridden: selection.targetLanguageOverridden,
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
      targetLanguageId: selection.targetLanguageId,
      targetLanguageOverridden: selection.targetLanguageOverridden,
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

  const handleTargetLanguageChange = (event) => {
    const targetLanguageId = event.target.value
    setSelection((current) => ({
      ...current,
      targetLanguageId,
      targetLanguageOverridden: targetLanguageId !== current.languageId,
    }))
  }

  const settingsPanel = (
    <section className="setup-panel">
      <label className="select-card">
        <span>{uiText.language}</span>
        <select value={selection.languageId} onChange={handleLanguageChange}>
          {languages.map((language) => (
            <option key={language.id} value={language.id}>
              {language.name}
            </option>
          ))}
        </select>
      </label>

      <label className="select-card">
        <span>{uiText.targetLanguage}</span>
        <select value={targetLanguageId} onChange={handleTargetLanguageChange}>
          {languages.map((language) => (
            <option key={language.id} value={language.id}>
              {language.name}
            </option>
          ))}
        </select>
        <small className="select-help">{uiText.targetLanguageHelp}</small>
      </label>

      <label className="select-card">
        <span>{uiText.cefrLevel}</span>
        <select value={selection.cefrLevel} onChange={handleLevelChange}>
          {CEFR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <div className="select-card curriculum-card">
        <span>{uiText.curriculumFocus}</span>
        <strong>{levelPack.label}</strong>
        <p>{levelPack.categories.map((category) => category.label).join(' · ')}</p>
      </div>
    </section>
  )

  const initialSetupPanel = (
    <section className="start-screen-settings">
      <label className="select-card">
        <span className="select-label-with-flag">
          <span className="select-label-flag" aria-hidden="true">
            {LANGUAGE_FLAGS[selection.languageId] ?? '🌐'}
          </span>
          <span>{uiText.language}</span>
        </span>
        <select value={selection.languageId} onChange={handleLanguageChange}>
          {languages.map((language) => (
            <option key={language.id} value={language.id}>
              {language.name}
            </option>
          ))}
        </select>
      </label>

      <label className="select-card">
        <span>{uiText.cefrLevel}</span>
        <select value={selection.cefrLevel} onChange={handleLevelChange}>
          {CEFR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>
    </section>
  )

  const controlsPanel = (
    <section className="controls-panel">
      <div className="control-chip">
        <span>{uiText.progression}</span>
        <strong>{uiText.progressionText}</strong>
      </div>
    </section>
  )

  const statsPanel = (
    <>
      <div className="hud-card">
        <span>{uiText.score}</span>
        <strong>{game.score}</strong>
      </div>
      <div className="hud-card">
        <span>{uiText.streak}</span>
        <strong>{game.streak}</strong>
      </div>
      <div className="hud-card">
        <span>{uiText.highScore}</span>
        <strong>{selectedHighScore}</strong>
      </div>
    </>
  )

  const soundPanel = (
    <>
      <SoundToggleButton
        enabled={selection.musicEnabled}
        label={uiLanguageId === 'swedish' ? 'Musik' : uiLanguageId === 'french' ? 'Musique' : uiLanguageId === 'spanish' ? 'Musica' : uiLanguageId === 'italian' ? 'Musica' : uiLanguageId === 'german' ? 'Musik' : 'Music'}
        onClick={toggleMusic}
      />
      <SoundToggleButton
        enabled={selection.sfxEnabled}
        label="FX"
        onClick={toggleSfx}
      />
    </>
  )

  const leaderboardPanel = (
    <section className="highscore-card">
      <span>{uiText.leaderboard}</span>
      {selectedHighScoreEntries.length > 0 ? (
        <ol className="highscore-list">
          {selectedHighScoreEntries.map((entry, index) => (
            <li key={`${entry.name}-${entry.score}-${index}`}>
              <strong>{entry.name}</strong>
              <span>{entry.score}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="highscore-empty">{uiText.noScores}</p>
      )}
    </section>
  )

  const hudPanel = (
    <section className="hud">
      {statsPanel}
      {soundPanel}
      {leaderboardPanel}
    </section>
  )

  return (
    <main
      className="game-shell"
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <section className="hero-panel">
        <div className="hero-copy">
          <h1>Wordshooter</h1>
          {!isMobileLayout ? (
          <p className="intro">
            {uiText.intro}
          </p>
          ) : null}
        </div>
        {isMobileLayout ? (
          <button
            type="button"
            className={`mobile-top-button mobile-menu-button ${mobileMenuOpen ? 'is-open' : ''}`}
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        ) : null}
      </section>

      {isMobileLayout && mobileMenuOpen ? (
      <>
        <button
          type="button"
          className="mobile-menu-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
        <section className="mobile-menu-panel">
            <p className="intro mobile-menu-intro">
              {uiText.intro}
            </p>
            {settingsPanel}
            {controlsPanel}
            <section className="hud mobile-menu-sound-panel">{soundPanel}</section>
            {leaderboardPanel}
          </section>
      </>
      ) : null}

      <section className={`play-layout ${isMobileLayout && mobileMenuOpen ? 'play-layout-dimmed' : ''}`}>
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
        </div>
        ) : null}

        {!isMobileLayout ? (
        <div className="mission-card mission-card-inline">
          <div className="mission-main">
            <p className="mission-label">{targetUiPack.currentTarget}</p>
            <strong style={{ color: targetStyle.color }}>{targetUiCategory.label}</strong>
            <span>{targetUiCategory.description}</span>
          </div>
          <div className={`mission-countdown ${categoryCountdown ? 'is-imminent' : ''}`}>
            <span>{uiText.nextSwitch}</span>
            <strong>{nextSwitchDisplay}</strong>
          </div>
        </div>
        ) : null}

        <div
          ref={arenaRef}
          className={`arena ${isMobileLayout ? 'arena-touch' : ''}`}
          onPointerDown={handleArenaPointerDown}
          onPointerMove={handleArenaPointerMove}
          onPointerUp={handleArenaPointerUp}
          onPointerCancel={handleArenaPointerUp}
        >
          <div className="starfield starfield-a" />
          <div className="starfield starfield-b" />

          {!isMobileLayout ? (
            <div className={`lives-panel arena-desktop-lives ${game.feedbackTone === 'bad' ? 'lives-panel-alert' : ''}`}>
              <div className="lives-panel-copy">
                <div className="lives-row" aria-label={`${game.lives} ${uiText.lives.toLowerCase()}`}>
                  {lifeHearts.map((filled, index) => (
                    <span key={index} className={`life-heart ${filled ? 'life-heart-filled' : ''}`}>
                      {filled ? '♥' : '♡'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {isMobileLayout ? (
            <>
              <div className="arena-overlay arena-overlay-top">
                <div className={`arena-mini-card arena-mini-time ${game.feedbackTone === 'bad' ? 'arena-mini-time-alert' : ''}`}>
                  <div className="arena-mini-lives" aria-label={`${game.lives} ${uiText.lives.toLowerCase()}`}>
                    {lifeHearts.map((filled, index) => (
                      <span key={index} className={`arena-mini-heart ${filled ? 'arena-mini-heart-filled' : ''}`}>
                        {filled ? '♥' : '♡'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="arena-target-picker">
                  <div className="arena-mini-card arena-target-card">
                    <span>{targetUiPack.currentTarget}</span>
                    <strong style={{ color: targetStyle.color }}>{targetUiCategory.label}</strong>
                  </div>
                </div>
                <button className="restart-button arena-restart-button" onClick={() => resetGame()}>
                  {uiText.newGame}
                </button>
              </div>

              <div className="arena-overlay arena-overlay-bottom">
                <div className="arena-mobile-stats" aria-hidden="true">
                  <div className="arena-mobile-stat">
                    <span>{uiText.score}</span>
                    <strong>{game.score}</strong>
                  </div>
                  <div className="arena-mobile-stat">
                    <span>{uiText.streak}</span>
                    <strong>{game.streak}</strong>
                  </div>
                  <div className="arena-mobile-stat arena-mobile-stat-next">
                    <span>{uiText.nextSwitch}</span>
                    <strong>{(game.nextCategorySwitchMs / 1000).toFixed(1)}s</strong>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {hasLaunchedInitialRun ? (
            <>
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

              {game.hearts.map((heart) => (
                <div
                  key={heart.id}
                  className="heart-pickup"
                  style={{
                    left: `${(heart.x / ARENA.width) * 100}%`,
                    top: `${(heart.y / ARENA.height) * 100}%`,
                  }}
                >
                  ♥
                </div>
              ))}

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

              {game.categoryAnnouncementMs > 0 ? (
                <div className="category-popup">
                  <span>{targetUiPack.newTarget}</span>
                  <strong>{targetUiCategory.label}</strong>
                </div>
              ) : null}

              {isMobileLayout && categoryCountdown ? (
                <div className="mobile-category-countdown" aria-hidden="true">
                  <span>{categoryCountdown}</span>
                </div>
              ) : null}

              {game.startAnnouncementMs > 0 ? (
                <div className="start-popup">
                  <strong>{game.startAnnouncement}</strong>
                </div>
              ) : null}

              {game.streakAnnouncementMs > 0 ? (
                <div className="streak-popup">
                  <span>{uiText.bonusUnlocked}</span>
                  <strong>{game.streakAnnouncement}</strong>
                </div>
              ) : null}

              {game.status === 'gameover' ? (
                <div
                  className="overlay overlay-interactive"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <p>{uiText.gameOver}</p>
                  <h3>{uiText.score}: {game.bestScore}</h3>
                  {qualifiesForHighScore && !hasSubmittedCurrentRun ? (
                    <div className="highscore-entry">
                      <label className="highscore-entry-label" htmlFor="highscore-name">
                        {uiText.newLeaderboardEntry}
                      </label>
                      <input
                        id="highscore-name"
                        className="highscore-entry-input"
                        type="text"
                        maxLength={18}
                        value={playerName}
                        onChange={(event) => setPlayerName(event.target.value)}
                        placeholder={uiText.yourName}
                      />
                      {isMobileLayout ? (
                        <button className="restart-button highscore-save-button" onClick={saveHighScoreEntry}>
                          {uiText.saveScore}
                        </button>
                      ) : (
                        <div className="overlay-actions">
                          <button className="restart-button highscore-save-button" onClick={saveHighScoreEntryAndReset}>
                            {uiText.saveScore}
                          </button>
                          <button className="restart-button overlay-new-game-button" onClick={() => resetGame()}>
                            {uiText.newGame}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : !isMobileLayout ? (
                    <div className="overlay-actions">
                      <button className="restart-button overlay-new-game-button" onClick={() => resetGame()}>
                        {uiText.newGame}
                      </button>
                    </div>
                  ) : null}
                  <span>
                    {hasSubmittedCurrentRun
                      ? uiText.scoreSaved
                      : isMobileLayout
                        ? uiText.tapRestart
                        : uiText.pressEnterRestart}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}

          <div
            className={`spaceship ${hasLaunchedInitialRun ? '' : 'spaceship-inactive'}`.trim()}
            style={{ left: `${(game.playerX / ARENA.width) * 100}%` }}
            onClick={hasLaunchedInitialRun ? handleShipClick : undefined}
          >
            {hasLaunchedInitialRun && game.startAnnouncementMs > 0 ? (
              <>
                <div className="ship-move-hint ship-move-hint-left" aria-hidden="true">
                  ←
                </div>
                <div className="ship-move-hint ship-move-hint-right" aria-hidden="true">
                  →
                </div>
              </>
            ) : null}
            <div className="ship-cockpit" />
            <div className="ship-wing ship-wing-left" />
            <div className="ship-wing ship-wing-right" />
            <div className="ship-engine ship-engine-left" />
            <div className="ship-engine ship-engine-right" />
          </div>

          {!hasLaunchedInitialRun ? (
            <div className="start-screen">
              <p>{uiText.intro}</p>
              {initialSetupPanel}
              <button className="restart-button start-screen-button" onClick={startInitialRun}>
                {uiText.startGame}
              </button>
            </div>
          ) : null}

        </div>

        {isMobileLayout && hasLaunchedInitialRun && game.status !== 'gameover' ? (
          <>
            <div
              ref={controlLineRef}
              className="mobile-control-zone"
              onPointerDown={handleControlPointerDown}
              onPointerMove={handleControlPointerMove}
              onPointerUp={handleControlPointerUp}
              onPointerCancel={handleControlPointerUp}
            />
            <div className={`feedback feedback-${game.feedbackTone}`}>{game.feedback}</div>
          </>
        ) : (
          <div className={`feedback feedback-${game.feedbackTone}`}>{game.feedback}</div>
        )}
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
