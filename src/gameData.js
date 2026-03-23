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
}

const makeCategory = (id, label, description, words) => ({
  id,
  label,
  pluralLabel: label.toLowerCase(),
  description,
  words,
})

const nouns = (words) => makeCategory('noun', 'Nouns', 'people, places, things, or ideas', words)
const verbs = (words) => makeCategory('verb', 'Verbs', 'action or state words', words)
const adjectives = (words) => makeCategory('adjective', 'Adjectives', 'describing words', words)
const adverbs = (words) => makeCategory('adverb', 'Adverbs', 'words that modify actions or descriptions', words)
const pronouns = (words) => makeCategory('pronoun', 'Pronouns', 'replacement words like I, she, they', words)
const past = (words) => makeCategory('past', 'Past Forms', 'forms used to talk about completed past actions', words)
const future = (words) => makeCategory('future', 'Future Forms', 'forms used to talk about future actions', words)
const modal = (words) => makeCategory('modal', 'Modal Forms', 'forms expressing ability, obligation, or possibility', words)
const connective = (words) => makeCategory('connective', 'Connectives', 'linking words for longer sentences', words)
const subjunctive = (words) => makeCategory('subjunctive', 'Subjunctive', 'forms for wishes, doubt, emotion, or hypotheticals', words)
const idiom = (words) => makeCategory('idiom', 'Idioms', 'fixed advanced expressions', words)
const createLevel = (label, categories) => ({ label, categories })
const createLanguagePack = (name, levels) => ({ name, levels })

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }

  Object.values(value).forEach((child) => deepFreeze(child))
  return Object.freeze(value)
}

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
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

const compileLevelsWithUniqueProgression = (levels) => {
  const seenByCategory = new Map()

  return Object.fromEntries(
    CEFR_LEVELS.map((levelId) => {
      const level = levels[levelId]
      const categories = level.categories.map((category) => {
        const seenWords = seenByCategory.get(category.id) ?? new Set()
        const dedupedWords = uniqueWords(category.words)
        const exclusiveWords = dedupedWords.filter(
          (word) => !seenWords.has(normalizeWord(word)),
        )
        const nextWords = exclusiveWords.length > 0 ? exclusiveWords : dedupedWords

        nextWords.forEach((word) => seenWords.add(normalizeWord(word)))
        seenByCategory.set(category.id, seenWords)

        return {
          ...category,
          words: nextWords,
        }
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

// Keep language-specific curricula isolated here so global gameplay changes
// do not require editing the language content directly.
const LANGUAGE_LEVELS = {
  english: {
    name: 'English',
    levels: {
      A1: createLevel('A1 Beginner', [
          nouns(['house', 'book', 'teacher', 'water', 'city', 'friend', 'garden', 'school', 'family', 'window', 'room', 'door', 'table', 'chair', 'street', 'dog', 'cat', 'mother', 'father', 'child', 'apple', 'bread', 'car', 'bus', 'sun', 'rain', 'day', 'night', 'bag', 'phone']),
          verbs(['go', 'eat', 'make', 'live', 'read', 'play', 'walk', 'open', 'watch', 'write', 'come', 'drink', 'sleep', 'sit', 'stand', 'speak', 'listen', 'work', 'study', 'help', 'start', 'stop', 'cook', 'call', 'wait', 'carry', 'drive', 'love', 'learn', 'use']),
          adjectives(['big', 'small', 'happy', 'cold', 'young', 'easy', 'warm', 'clean', 'short', 'bright', 'old', 'new', 'good', 'bad', 'fast', 'slow', 'hot', 'sweet', 'strong', 'quiet', 'loud', 'kind', 'busy', 'ready', 'full', 'empty', 'dark', 'early', 'late', 'friendly']),
        ]),
      A2: createLevel('A2 Elementary', [
          pronouns(['someone', 'anyone', 'nothing', 'myself', 'themselves', 'each', 'everything', 'another', 'everybody', 'something', 'nobody', 'yourself', 'ourselves', 'herself', 'himself', 'these', 'those', 'one another', 'several', 'either', 'neither', 'someone else', 'whatever', 'whoever']),
          adverbs(['always', 'sometimes', 'carefully', 'often', 'quickly', 'already', 'usually', 'finally', 'outside', 'slowly', 'inside', 'yesterday', 'today', 'tomorrow', 'really', 'almost', 'together', 'alone', 'upstairs', 'downstairs', 'soon', 'later', 'everywhere', 'anywhere']),
          past(['went', 'saw', 'made', 'studied', 'called', 'arrived', 'bought', 'learned', 'brought', 'finished', 'found', 'left', 'heard', 'met', 'lost', 'sent', 'took', 'gave', 'spent', 'forgot', 'felt', 'won', 'sold', 'decided']),
        ]),
      B1: createLevel('B1 Intermediate', [
          future(['will travel', 'going to study', 'will improve', 'is going to rain', 'will decide', 'will return', 'will probably win', 'are going to move', 'will be easier', 'will soon change', 'will keep trying', 'is going to open', 'will need help', 'are going to build', 'will become clear', 'will take time', 'is going to start', 'will stay longer', 'will likely grow', 'are going to meet']),
          connective(['although', 'however', 'because', 'unless', 'while', 'therefore', 'since', 'even though', 'as soon as', 'instead', 'meanwhile', 'in case', 'for example', 'on the other hand', 'as a result', 'otherwise', 'in order to', 'after that', 'before that', 'at least']),
          subjunctive(['if I were', 'I suggest that he be', 'it is vital that she arrive', 'I asked that they stay', 'they recommended that we wait', 'I insist that he go', 'it is essential that we leave', 'I demand that she listen', 'if he were here', 'they propose that it remain', 'I would rather that she stay', 'it is important that he understand', 'they asked that we be ready', 'I wish it were easier', 'if she were more patient', 'the teacher insisted that they finish', 'we requested that he join', 'it is necessary that she speak', 'I would prefer that they come early', 'the doctor advised that he rest']),
        ]),
      B2: createLevel('B2 Upper Intermediate', [
          modal(['might have gone', 'should have told', 'must be joking', 'could have seen', 'would rather stay', 'ought to know']),
          connective(['nevertheless', 'whereas', 'provided that', 'in order that', 'despite', 'as long as']),
          idiom(['once in a blue moon', 'under the weather', 'break the ice', 'on the same page', 'call it a day', 'hit the books']),
        ]),
      C1: createLevel('C1 Advanced', [
          subjunctive(['were it not for', 'be that as it may', 'if he be found', 'so be it', 'suffice it to say', 'lest they forget']),
          connective(['notwithstanding', 'inasmuch as', 'albeit', 'henceforth', 'thereby', 'whereby']),
          idiom(['toe the line', 'raise the bar', 'a double-edged sword', 'in the long run', 'read the room', 'back to square one']),
        ]),
      C2: createLevel('C2 Mastery', [
          idiom(['the elephant in the room', 'split hairs', 'bury the hatchet', 'throw in the towel', 'a blessing in disguise', 'burn the midnight oil']),
          modal(['need not have worried', 'would sooner resign', 'might well have assumed', 'be bound to happen', 'cannot but admire', 'would have had to leave']),
          connective(['for all that', 'inasmuch as', 'by virtue of', 'all the same', 'be that as it may', 'in light of']),
        ]),
    },
  },
  french: {
    name: 'Français',
    levels: {
      A1: {
        label: 'A1 Debutant',
        categories: [
          nouns(['maison', 'livre', 'ami', 'ville', 'chat', 'table', 'ecole', 'famille', 'fenetre', 'jardin']),
          verbs(['aller', 'manger', 'parler', 'aimer', 'habiter', 'jouer', 'regarder', 'ecouter', 'ouvrir', 'ecrire']),
          adjectives(['grand', 'petit', 'jeune', 'facile', 'content', 'froid', 'chaud', 'propre', 'court', 'rapide']),
        ],
      },
      A2: {
        label: 'A2 Elementaire',
        categories: [
          pronouns(['quelqu’un', 'personne', 'le mien', 'celle-ci', 'eux', 'chacun', 'tout le monde', 'quelque chose', 'les autres', 'celui-la']),
          adverbs(['souvent', 'toujours', 'vite', 'deja', 'ensemble', 'presque', 'parfois', 'dehors', 'lentement', 'ensuite']),
          past(['j’ai vu', 'nous avons mange', 'elle est arrivee', 'tu as parle', 'ils ont fini', 'j’ai compris', 'nous avons achete', 'il a appris', 'elle a choisi', 'ils sont partis']),
        ],
      },
      B1: {
        label: 'B1 Intermediaire',
        categories: [
          future(['je partirai', 'nous allons sortir', 'il fera beau', 'tu reviendras', 'elle va changer', 'on verra']),
          connective(['parce que', 'pourtant', 'pendant que', 'donc', 'puisque', 'afin que']),
          subjunctive(['il faut que tu viennes', 'bien qu’il soit tard', 'pour que nous puissions', 'je veux qu’elle fasse', 'avant qu’ils partent', 'il est possible que ce soit vrai']),
        ],
      },
      B2: {
        label: 'B2 Intermediaire superieur',
        categories: [
          modal(['il faudrait partir', 'je pourrais venir', 'on devrait savoir', 'tu aurais pu dire', 'il vaudrait mieux attendre', 'elle doit etre la']),
          connective(['cependant', 'tandis que', 'malgre', 'a condition que', 'en revanche', 'de sorte que']),
          idiom(['avoir le cafard', 'poser un lapin', 'prendre son temps', 'couper les cheveux en quatre', 'donner un coup de main', 'tomber dans les pommes']),
        ],
      },
      C1: {
        label: 'C1 Avance',
        categories: [
          subjunctive(['encore faut-il que', 'pourvu qu’il vienne', 'bien que nous ayons su', 'quoique ce soit utile', 'il importe qu’elle soit prete', 'sans qu’ils le sachent']),
          connective(['neanmoins', 'd’autant plus que', 'or', 'nonobstant', 'de surcroit', 'au demeurant']),
          idiom(['mettre de l’eau dans son vin', 'faire la sourde oreille', 'tirer son epingle du jeu', 'avoir beau faire', 'faire fausse route', 'mettre les bouchées doubles']),
        ],
      },
      C2: {
        label: 'C2 Maitrise',
        categories: [
          idiom(['jeter un pave dans la mare', 'tourner autour du pot', 'se mettre le doigt dans l’oeil', 'faire d’une pierre deux coups', 'ne pas etre sorti de l’auberge', 'mettre les pieds dans le plat']),
          modal(['il n’eut pas fallu', 'elle aurait mieux fait', 'on ne saurait trop dire', 'tu n’aurais su prevoir', 'cela pourrait bien arriver', 'je ne puis que constater']),
          connective(['quoi qu’il en soit', 'pour autant', 'a plus forte raison', 'dans la mesure ou', 'au regard de', 'somme toute']),
        ],
      },
    },
  },
  spanish: {
    name: 'Español',
    levels: {
      A1: {
        label: 'A1 Inicial',
        categories: [
          nouns(['casa', 'libro', 'amigo', 'ciudad', 'agua', 'mesa', 'escuela', 'familia', 'ventana', 'jardin']),
          verbs(['ir', 'comer', 'vivir', 'hablar', 'tener', 'jugar', 'mirar', 'abrir', 'escribir', 'caminar']),
          adjectives(['grande', 'pequeno', 'feliz', 'frio', 'nuevo', 'facil', 'limpio', 'corto', 'caliente', 'claro']),
        ],
      },
      A2: {
        label: 'A2 Basico',
        categories: [
          pronouns(['alguien', 'nadie', 'ellos', 'aquello', 'cada uno', 'nosotros', 'todos', 'algo', 'otro', 'quienquiera']),
          adverbs(['siempre', 'a veces', 'ya', 'casi', 'rapidamente', 'juntos', 'normalmente', 'afuera', 'despacio', 'despues']),
          past(['fui', 'comió', 'llegaron', 'vivimos', 'estudiaste', 'hicieron', 'compraron', 'aprendió', 'volvimos', 'terminaste']),
        ],
      },
      B1: {
        label: 'B1 Intermedio',
        categories: [
          future(['viajaré', 'vamos a salir', 'cambiará', 'volverás', 'lloverá', 'vamos a aprender', 'voy a estudiar', 'seguirá creciendo', 'va a llegar tarde', 'mañana saldremos', 'el plan cambiará pronto', 'vamos a volver temprano']),
          connective(['aunque', 'porque', 'mientras', 'entonces', 'asi que', 'para que', 'por eso', 'sin embargo', 'al mismo tiempo', 'despues de eso', 'por un lado', 'como resultado']),
          subjunctive(['quiero que vengas', 'es posible que sea', 'cuando tengas tiempo', 'ojala llueva', 'dudo que puedan', 'antes de que salgan', 'me alegra que estes aqui', 'es mejor que esperemos', 'no creo que funcione', 'tal vez llegue tarde']),
        ],
      },
      B2: {
        label: 'B2 Intermedio alto',
        categories: [
          modal(['deberias ir', 'podria haber sido', 'tendria que estudiar', 'debe de estar', 'habrias podido venir', 'quisiera saber']),
          connective(['sin embargo', 'a pesar de', 'siempre que', 'mientras que', 'por lo tanto', 'de modo que']),
          idiom(['estar en las nubes', 'costar un ojo de la cara', 'meter la pata', 'echar una mano', 'dar en el clavo', 'ser pan comido']),
        ],
      },
      C1: {
        label: 'C1 Avanzado',
        categories: [
          subjunctive(['hubiera querido', 'sea como sea', 'como si supiera', 'ojala hubiera venido', 'no creo que haya salido', 'tal vez lo hubieran hecho']),
          connective(['no obstante', 'por consiguiente', 'si bien', 'con tal de que', 'habida cuenta de', 'en tanto que']),
          idiom(['poner el grito en el cielo', 'tirar la casa por la ventana', 'no tener pelos en la lengua', 'quedarse de piedra', 'dar la talla', 'irse por las ramas']),
        ],
      },
      C2: {
        label: 'C2 Maestria',
        categories: [
          idiom(['a buenas horas mangas verdes', 'buscarle tres pies al gato', 'no hay tutia', 'estar al pie del canon', 'tener mala leche', 'quedarse para vestir santos']),
          modal(['habria que haberlo visto', 'no habria por que negarlo', 'bien podria suceder', 'deberas de haberlo oido', 'quisiera que constara', 'se diria que llueve']),
          connective(['con todo', 'ahora bien', 'aun asi', 'en virtud de', 'por ende', 'a la sazón']),
        ],
      },
    },
  },
  italian: {
    name: 'Italiano',
    levels: {
      A1: {
        label: 'A1 Principiante',
        categories: [
          nouns(['casa', 'libro', 'amico', 'citta', 'acqua', 'scuola', 'famiglia', 'finestra', 'giardino', 'strada']),
          verbs(['andare', 'mangiare', 'parlare', 'vivere', 'avere', 'giocare', 'guardare', 'aprire', 'scrivere', 'camminare']),
          adjectives(['grande', 'piccolo', 'felice', 'freddo', 'nuovo', 'facile', 'pulito', 'corto', 'caldo', 'chiaro']),
        ],
      },
      A2: {
        label: 'A2 Elementare',
        categories: [
          pronouns(['qualcuno', 'nessuno', 'loro', 'questo', 'ciascuno', 'noi', 'tutti', 'qualcosa', 'chiunque', 'gli altri']),
          adverbs(['sempre', 'spesso', 'gia', 'quasi', 'velocemente', 'insieme', 'fuori', 'lentamente', 'dopo', 'di solito']),
          past(['sono andato', 'ha visto', 'abbiamo mangiato', 'sei arrivato', 'hanno finito', 'ho capito', 'abbiamo comprato', 'ha imparato', 'sono tornati', 'hai scelto']),
        ],
      },
      B1: {
        label: 'B1 Intermedio',
        categories: [
          future(['andro', 'tornerai', 'piovera', 'cambiera', 'impareremo', 'usciranno']),
          connective(['anche se', 'perche', 'mentre', 'quindi', 'cosi che', 'affinche']),
          subjunctive(['voglio che tu venga', 'penso che sia', 'benche lui abbia ragione', 'prima che partano', 'e possibile che arrivi', 'dubito che possano']),
        ],
      },
      B2: {
        label: 'B2 Intermedio avanzato',
        categories: [
          modal(['dovresti andare', 'potrei sapere', 'avresti potuto dire', 'deve essere vero', 'vorrei capire', 'bisognerebbe aspettare']),
          connective(['tuttavia', 'nonostante', 'purché', 'mentre invece', 'pertanto', 'di modo che']),
          idiom(['essere al verde', 'in bocca al lupo', 'rompere il ghiaccio', 'prendere due piccioni con una fava', 'andare a gonfie vele', 'cadere dalle nuvole']),
        ],
      },
      C1: {
        label: 'C1 Avanzato',
        categories: [
          subjunctive(['sebbene fosse tardi', 'qualunque cosa accada', 'come se sapesse tutto', 'temo che sia inutile', 'prima che sia troppo tardi', 'nonostante abbiano detto di no']),
          connective(['ciononostante', 'dal momento che', 'laddove', 'benché', 'alla luce di', 'nondimeno']),
          idiom(['avere le mani bucate', 'fare orecchie da mercante', 'mettere il carro davanti ai buoi', 'restare a bocca aperta', 'tagliare la corda', 'non capire un accidente']),
        ],
      },
      C2: {
        label: 'C2 Padronanza',
        categories: [
          idiom(['menare il can per l’aia', 'arrampicarsi sugli specchi', 'piantare in asso', 'fare il passo piu lungo della gamba', 'essere in gamba', 'non cavare un ragno dal buco']),
          modal(['avrebbe dovuto saperlo', 'potrebbe pure accadere', 'non si potrebbe negare', 'vorrei che si sapesse', 'si direbbe che piova', 'sarebbe stato meglio evitare']),
          connective(['cionondimeno', 'peraltro', 'in virtù di', 'posto che', 'ad ogni modo', 'alla stregua di']),
        ],
      },
    },
  },
  german: {
    name: 'Deutsch',
    levels: {
      A1: {
        label: 'A1 Einstieg',
        categories: [
          nouns(['Haus', 'Buch', 'Freund', 'Stadt', 'Wasser', 'Schule', 'Familie', 'Fenster', 'Garten', 'Strasse']),
          verbs(['gehen', 'essen', 'sprechen', 'wohnen', 'haben', 'spielen', 'sehen', 'offnen', 'schreiben', 'lernen']),
          adjectives(['gross', 'klein', 'froh', 'kalt', 'neu', 'leicht', 'warm', 'sauber', 'kurz', 'hell']),
        ],
      },
      A2: {
        label: 'A2 Grundstufe',
        categories: [
          pronouns(['jemand', 'niemand', 'wir', 'ihr', 'diese', 'alle', 'etwas', 'jeder', 'einander', 'manche']),
          adverbs(['oft', 'immer', 'schon', 'fast', 'schnell', 'zusammen', 'draussen', 'langsam', 'spater', 'meistens']),
          past(['ging', 'sah', 'machten', 'lernte', 'kam an', 'verstand', 'kaufte', 'brachte', 'wusste', 'blieb']),
        ],
      },
      B1: {
        label: 'B1 Mittelstufe',
        categories: [
          future(['ich werde reisen', 'wir werden lernen', 'es wird regnen', 'du wirst kommen', 'sie wird bleiben', 'wir werden sehen']),
          connective(['obwohl', 'weil', 'wahrend', 'deshalb', 'damit', 'sobald']),
          subjunctive(['wenn ich ware', 'ich schlage vor, dass er komme', 'es ist wichtig, dass sie sei', 'als ob er mehr wüsste', 'ich wunsche, er hatte Zeit', 'es ware besser, wenn wir gingen']),
        ],
      },
      B2: {
        label: 'B2 Obere Mittelstufe',
        categories: [
          modal(['ich hatte gehen sollen', 'das konnte stimmen', 'du müsstest lernen', 'sie durfte bleiben', 'er konnte gekommen sein', 'wir wollten warten']),
          connective(['dennoch', 'wahrenddessen', 'falls', 'sodass', 'hingegen', 'trotzdem']),
          idiom(['Tomaten auf den Augen haben', 'die Nase voll haben', 'ins kalte Wasser springen', 'zwei Fliegen mit einer Klappe schlagen', 'auf Wolke sieben sein', 'Da liegt der Hund begraben']),
        ],
      },
      C1: {
        label: 'C1 Fortgeschritten',
        categories: [
          subjunctive(['es sei denn', 'als ware nichts geschehen', 'man nehme an', 'es lebe die Freiheit', 'ich hätte gern, dass er komme', 'als ob sie alles gewusst hatte']),
          connective(['nichtsdestotrotz', 'insofern', 'wohingegen', 'demzufolge', 'indem', 'zumal']),
          idiom(['den Nagel auf den Kopf treffen', 'um den heissen Brei reden', 'aus allen Wolken fallen', 'etwas im Schilde fuhren', 'sich aus dem Staub machen', 'jemandem einen Korb geben']),
        ],
      },
      C2: {
        label: 'C2 Beherrschung',
        categories: [
          idiom(['Da steppt der Bar', 'das ist nicht mein Bier', 'auf keinen grünen Zweig kommen', 'jemandem einen Bären aufbinden', 'Öl ins Feuer giessen', 'sich zum Affen machen']),
          modal(['das hätte nicht sein müssen', 'er mag wohl recht haben', 'das dürfte geschehen sein', 'man könnte meinen', 'es ware zu bedenken', 'sie hatte gehen konnen']),
          connective(['ungeachtet dessen', 'mithin', 'kraft dessen', 'obschon', 'gleichwohl', 'im Hinblick auf']),
        ],
      },
    },
  },
  swedish: {
    name: 'Svenska',
    levels: {
      A1: {
        label: 'A1 Nybörjare',
        categories: [
          nouns(['hus', 'bok', 'vän', 'stad', 'vatten', 'skola', 'familj', 'fönster', 'trädgård', 'gata', 'rum', 'dörr', 'bord', 'stol', 'hund', 'katt', 'mamma', 'pappa', 'barn', 'äpple', 'bröd', 'bil', 'buss', 'sol', 'regn', 'dag', 'natt', 'väska', 'telefon', 'kök']),
          verbs(['gå', 'äta', 'tala', 'bo', 'ha', 'leka', 'skriva', 'öppna', 'titta', 'lära', 'komma', 'dricka', 'sova', 'sitta', 'stå', 'lyssna', 'arbeta', 'studera', 'hjälpa', 'börja', 'sluta', 'laga', 'ringa', 'vänta', 'bära', 'köra', 'älska', 'använda', 'läsa', 'resa']),
          adjectives(['stor', 'liten', 'glad', 'kall', 'ny', 'enkel', 'varm', 'ren', 'kort', 'ljus', 'gammal', 'bra', 'dålig', 'snabb', 'långsam', 'het', 'söt', 'stark', 'tyst', 'hög', 'snäll', 'upptagen', 'redo', 'full', 'tom', 'mörk', 'tidig', 'sen', 'vänlig', 'billig']),
        ],
      },
      A2: {
        label: 'A2 Grundläggande',
        categories: [
          pronouns(['någon', 'ingen', 'vi', 'de', 'denna', 'var och en', 'alla', 'något', 'den andre', 'vem som helst', 'någon annan', 'ingenting', 'sig själv', 'oss själva', 'dem själva', 'sådan', 'sådana', 'båda', 'endera', 'varken', 'flera', 'några', 'allt', 'varje']),
          adverbs(['alltid', 'ofta', 'redan', 'nästan', 'snabbt', 'tillsammans', 'utomhus', 'långsamt', 'senare', 'vanligtvis', 'inomhus', 'igår', 'idag', 'imorgon', 'verkligen', 'ensam', 'ovanpå', 'nedanför', 'snart', 'därefter', 'överallt', 'någonstans', 'hemma', 'borta']),
          past(['gick', 'såg', 'gjorde', 'studerade', 'kom fram', 'förstod', 'köpte', 'hämtade', 'valde', 'stannade', 'fann', 'lämnade', 'hörde', 'träffade', 'tappade', 'skickade', 'tog', 'gav', 'spenderade', 'glömde', 'kände', 'vann', 'sålde', 'bestämde']),
        ],
      },
      B1: {
        label: 'B1 Mellannivå',
        categories: [
          future(['ska resa', 'kommer att lära', 'ska stanna', 'kommer tillbaka', 'ska regna', 'ska förändra', 'ska fortsätta', 'kommer att öppna', 'ska behöva hjälp', 'ska bygga', 'kommer att bli tydligare', 'ska ta tid', 'kommer att börja', 'ska stanna längre', 'kommer troligen att växa', 'ska träffas', 'kommer att fungera bättre', 'ska försöka igen', 'kommer snart att ändras', 'ska flytta']),
          connective(['fastän', 'eftersom', 'medan', 'därför', 'så att', 'innan', 'dessutom', 'samtidigt', 'i fall', 'till exempel', 'å andra sidan', 'som resultat', 'annars', 'för att', 'efter det', 'före det', 'åtminstone', 'trots att', 'så snart som', 'under tiden']),
          modal(['skulle vilja', 'kan nog gå', 'borde förstå', 'måste vänta', 'får inte glömma', 'kunde hjälpa', 'skulle kunna prova', 'måste nog åka', 'borde ha frågat', 'kan tänka mig', 'får gärna stanna', 'skulle behöva vila', 'måste hinna klart', 'kunde kanske förklara', 'borde försöka igen', 'kan råka bli fel', 'får lov att gå', 'skulle vilja veta', 'måste ha missat', 'kunde ha sagt det']),
        ],
      },
      B2: {
        label: 'B2 Högre mellannivå',
        categories: [
          modal(['skulle kunna', 'borde ha sagt', 'måste vara sant', 'kunde ha kommit', 'ville stanna', 'skulle hellre gå']),
          connective(['ändå', 'dessutom', 'ifall', 'medan', 'trots att', 'således']),
          idiom(['ingen ko på isen', 'ana ugglor i mossen', 'glida in på en räkmacka', 'ha is i magen', 'falla mellan stolarna', 'lägga benen på ryggen']),
        ],
      },
      C1: {
        label: 'C1 Avancerad',
        categories: [
          modal(['hade kunnat undvika', 'borde ha insett', 'skulle ha velat veta', 'måste ha förstått', 'kunde ha nämnt', 'lär ha hänt']),
          connective(['likväl', 'i den mån', 'varigenom', 'samtidigt som', 'med tanke på', 'fördenskull']),
          idiom(['sitta i sjön', 'ingen dans på rosor', 'kasta in handduken', 'ha rent mjöl i påsen', 'dra alla över en kam', 'gå som katten kring het gröt']),
        ],
      },
      C2: {
        label: 'C2 Mycket avancerad',
        categories: [
          idiom(['ingen fara på taket', 'fånga dagen', 'lägga korten på bordet', 'få blodad tand', 'ha tomtar på loftet', 'inte för allt i världen']),
          modal(['det hade kunnat undvikas', 'man kunde tro', 'det lär ha hänt', 'det borde inte ha skett', 'jag ville att det måtte gå', 'det skulle kunna visa sig']),
          connective(['oaktat detta', 'så till vida', 'mot bakgrund av', 'å andra sidan', 'i kraft av', 'desto mera']),
        ],
      },
    },
  },
}

export const LANGUAGE_PACKS = deepFreeze(
  Object.fromEntries(
    Object.entries(LANGUAGE_LEVELS).map(([id, pack]) => [
      id,
      createLanguagePack(pack.name, compileLevelsWithUniqueProgression(pack.levels)),
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
