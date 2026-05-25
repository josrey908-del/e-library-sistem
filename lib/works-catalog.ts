import { gutenbergCoverUrl, gutenbergEpubUrl } from './gutenberg';
import { openLibraryCoverUrl } from './openlibrary';
import coversManifest from './covers-manifest.json';

export type BookLanguage = 'en' | 'es';

export interface BookEdition {
  lang: BookLanguage;
  /** ID numérico de Project Gutenberg para esta edición */
  gutId: number;
  title: string;
  description?: string;
  /** Si no hay EPUB en español en PG, reutiliza el gutId inglés y marca la edición */
  usesEnglishText?: boolean;
}

export interface LiteraryWork {
  workKey: string;
  author: string;
  genres: string[];
  publishedYear?: number;
  readingTimeMin?: number;
  ratingAvg?: number;
  trendingScore?: number;
  topRank?: number | null;
  isFeatured?: boolean;
  isEpisodic?: boolean;
  award?: string | null;
  availableUntil?: Date | null;
  editions: BookEdition[];
}

function editionCover(edition: BookEdition, author: string, sourceId: string): string {
  const fromManifest = (coversManifest as Record<string, string>)[sourceId];
  if (fromManifest) return fromManifest;

  if (edition.usesEnglishText) {
    return openLibraryCoverUrl(edition.title, author);
  }
  return gutenbergCoverUrl(edition.gutId);
}

function editionDownload(edition: BookEdition): string {
  return gutenbergEpubUrl(edition.gutId);
}

const EN_NOTE_ES =
  ' Nota: la traducción al español no está disponible en Project Gutenberg; esta edición enlaza el texto original en inglés.';

export const LITERARY_WORKS: LiteraryWork[] = [
  {
    workKey: 'arsene-lupin',
    author: 'Maurice Leblanc',
    genres: ['Misterio', 'Episódico', 'Aventura'],
    publishedYear: 1905,
    readingTimeMin: 1200,
    ratingAvg: 4.8,
    trendingScore: 99,
    topRank: 1,
    isFeatured: true,
    isEpisodic: true,
    award: 'Mejor Serie de Misterio',
    editions: [
      {
        lang: 'en',
        gutId: 40203,
        title: 'Arsène Lupin versus Herlock Sholmes',
        description:
          'The gentleman thief Arsène Lupin faces the British detective Herlock Sholmes in a battle of wits.',
      },
      {
        lang: 'es',
        gutId: 40203,
        title: 'Las Aventuras de Arsène Lupin',
        description:
          'El famoso ladrón de guante blanco en episodios llenos de ingenio y misterio.',
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'moby-dick',
    author: 'Herman Melville',
    genres: ['Aventura', 'Ficción Clásica', 'Simbolismo'],
    publishedYear: 1851,
    readingTimeMin: 1440,
    ratingAvg: 4.6,
    trendingScore: 95,
    topRank: 1,
    isFeatured: true,
    award: 'Great American Novel',
    editions: [
      {
        lang: 'en',
        gutId: 2701,
        title: 'Moby Dick',
        description:
          'Captain Ahab’s obsessive hunt for the white whale, one of the greatest novels of the sea.',
      },
      {
        lang: 'es',
        gutId: 2701,
        title: 'Moby Dick',
        description:
          'La épica persecución de la ballena blanca por el capitán Ahab.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'pride-prejudice',
    author: 'Jane Austen',
    genres: ['Romance Clásico', 'Crítica Social', 'Ficción'],
    publishedYear: 1813,
    readingTimeMin: 600,
    ratingAvg: 4.9,
    trendingScore: 98,
    topRank: 2,
    isFeatured: true,
    editions: [
      {
        lang: 'en',
        gutId: 1342,
        title: 'Pride and Prejudice',
        description:
          'Elizabeth Bennet and Mr. Darcy in a witty portrait of love and society in Regency England.',
      },
      {
        lang: 'es',
        gutId: 1342,
        title: 'Orgullo y Prejuicio',
        description:
          'La historia de amor entre Elizabeth Bennet y Mr. Darcy en la Inglaterra del siglo XIX.' +
          EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'frankenstein',
    author: 'Mary Shelley',
    genres: ['Ciencia Ficción', 'Terror Gótico', 'Filosofía'],
    publishedYear: 1818,
    readingTimeMin: 540,
    ratingAvg: 4.7,
    trendingScore: 93,
    topRank: 3,
    isFeatured: true,
    award: 'Pioneer of Sci-Fi',
    editions: [
      {
        lang: 'en',
        gutId: 84,
        title: 'Frankenstein',
        description:
          'Victor Frankenstein creates life from death, unleashing tragic consequences.',
      },
      {
        lang: 'es',
        gutId: 84,
        title: 'Frankenstein',
        description:
          'El Dr. Frankenstein crea vida a partir de la materia muerta, con consecuencias devastadoras.' +
          EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'crime-punishment',
    author: 'Fyodor Dostoyevsky',
    genres: ['Novela Psicológica', 'Filosofía', 'Drama'],
    publishedYear: 1866,
    readingTimeMin: 1200,
    ratingAvg: 4.8,
    trendingScore: 92,
    topRank: 4,
    isFeatured: true,
    editions: [
      {
        lang: 'en',
        gutId: 2554,
        title: 'Crime and Punishment',
        description: 'Raskolnikov’s crime and tormented conscience in Dostoyevsky’s masterpiece.',
      },
      {
        lang: 'es',
        gutId: 61851,
        title: 'Crimen y Castigo',
        description:
          'Raskólnikov y su teoría del hombre extraordinario en la obra cumbre de Dostoievski.',
      },
    ],
  },
  {
    workKey: 'alice-wonderland',
    author: 'Lewis Carroll',
    genres: ['Fantasía', 'Aventura Infantil', 'Surrealismo'],
    publishedYear: 1865,
    readingTimeMin: 180,
    ratingAvg: 4.7,
    trendingScore: 91,
    topRank: 5,
    editions: [
      {
        lang: 'en',
        gutId: 11,
        title: "Alice's Adventures in Wonderland",
        description: 'Alice falls into a world of impossible logic and wonder.',
      },
      {
        lang: 'es',
        gutId: 11,
        title: 'Alicia en el País de las Maravillas',
        description: 'Alicia descubre un mundo fantástico de lógica absurda.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'sherlock-holmes',
    author: 'Arthur Conan Doyle',
    genres: ['Misterio', 'Detective', 'Ficción Clásica'],
    publishedYear: 1892,
    readingTimeMin: 480,
    ratingAvg: 4.8,
    trendingScore: 90,
    topRank: 6,
    editions: [
      {
        lang: 'en',
        gutId: 1661,
        title: 'The Adventures of Sherlock Holmes',
        description: 'Twelve classic cases solved by Holmes and Watson.',
      },
      {
        lang: 'es',
        gutId: 1661,
        title: 'Las Aventuras de Sherlock Holmes',
        description: 'Doce relatos de misterio con Holmes y Watson.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'war-and-peace',
    author: 'Leo Tolstoy',
    genres: ['Épica Histórica', 'Drama', 'Filosofía'],
    publishedYear: 1869,
    readingTimeMin: 3600,
    ratingAvg: 4.9,
    trendingScore: 89,
    topRank: 7,
    award: 'Obra Cumbre de la Literatura Rusa',
    editions: [
      {
        lang: 'en',
        gutId: 2600,
        title: 'War and Peace',
        description: 'Russian families during the Napoleonic wars.',
      },
      {
        lang: 'es',
        gutId: 2600,
        title: 'Guerra y Paz',
        description: 'Cinco familias rusas durante la invasión napoleónica.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'dracula',
    author: 'Bram Stoker',
    genres: ['Terror Gótico', 'Horror', 'Misterio'],
    publishedYear: 1897,
    readingTimeMin: 780,
    ratingAvg: 4.6,
    trendingScore: 88,
    topRank: 8,
    editions: [
      {
        lang: 'en',
        gutId: 345,
        title: 'Dracula',
        description: 'Count Dracula arrives in England and spreads terror.',
      },
      {
        lang: 'es',
        gutId: 345,
        title: 'Drácula',
        description: 'El conde Drácula llega a Inglaterra dejando un rastro de terror.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'modest-proposal',
    author: 'Jonathan Swift',
    genres: ['Sátira', 'Ensayo', 'Literatura Política'],
    publishedYear: 1729,
    readingTimeMin: 30,
    ratingAvg: 4.5,
    trendingScore: 78,
    topRank: 9,
    editions: [
      {
        lang: 'en',
        gutId: 1080,
        title: 'A Modest Proposal',
        description: 'Swift’s devastating satire on poverty and colonial rule.',
      },
      {
        lang: 'es',
        gutId: 1080,
        title: 'Una Modesta Proposición',
        description: 'La sátira de Swift sobre la pobreza y el colonialismo.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'great-expectations',
    author: 'Charles Dickens',
    genres: ['Bildungsroman', 'Drama Social', 'Ficción Clásica'],
    publishedYear: 1861,
    readingTimeMin: 960,
    ratingAvg: 4.7,
    trendingScore: 86,
    topRank: 10,
    editions: [
      {
        lang: 'en',
        gutId: 1400,
        title: 'Great Expectations',
        description: 'Pip’s journey from blacksmith’s boy to gentleman.',
      },
      {
        lang: 'es',
        gutId: 1400,
        title: 'Grandes Esperanzas',
        description: 'El joven Pip sueña con convertirse en caballero.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'beowulf',
    author: 'Autor Anónimo',
    genres: ['Épica Medieval', 'Poesía', 'Mitología'],
    publishedYear: 1000,
    readingTimeMin: 240,
    ratingAvg: 4.4,
    trendingScore: 70,
    award: 'Patrimonio de la Literatura Universal',
    editions: [
      {
        lang: 'en',
        gutId: 16328,
        title: 'Beowulf',
        description: 'The Anglo-Saxon epic of the hero Beowulf.',
      },
      {
        lang: 'es',
        gutId: 16328,
        title: 'Beowulf',
        description: 'El poema épico anglosajón del héroe Beowulf.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'huckleberry-finn',
    author: 'Mark Twain',
    genres: ['Aventura', 'Ficción Americana', 'Sátira Social'],
    publishedYear: 1884,
    readingTimeMin: 600,
    ratingAvg: 4.6,
    trendingScore: 82,
    award: 'Novela Americana Fundamental',
    editions: [
      {
        lang: 'en',
        gutId: 76,
        title: 'Adventures of Huckleberry Finn',
        description: 'Huck and Jim on the Mississippi seeking freedom.',
      },
      {
        lang: 'es',
        gutId: 76,
        title: 'Las Aventuras de Huckleberry Finn',
        description: 'Huck y Jim navegan el Mississippi en busca de libertad.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'dorian-gray',
    author: 'Oscar Wilde',
    genres: ['Gótico', 'Filosofía Estética', 'Drama'],
    publishedYear: 1890,
    readingTimeMin: 420,
    ratingAvg: 4.7,
    trendingScore: 88,
    isFeatured: true,
    award: 'Obra Cumbre del Estetismo',
    editions: [
      {
        lang: 'en',
        gutId: 174,
        title: 'The Picture of Dorian Gray',
        description: 'A portrait ages while Dorian Gray remains young.',
      },
      {
        lang: 'es',
        gutId: 174,
        title: 'El Retrato de Dorian Gray',
        description: 'Un retrato envejece mientras Dorian Gray permanece joven.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'don-quijote',
    author: 'Miguel de Cervantes',
    genres: ['Novela de Caballerías', 'Sátira', 'Ficción Clásica'],
    publishedYear: 1605,
    readingTimeMin: 2880,
    ratingAvg: 4.9,
    trendingScore: 97,
    isFeatured: true,
    award: 'Primera Novela Moderna de la Historia',
    editions: [
      {
        lang: 'en',
        gutId: 996,
        title: 'Don Quixote',
        description: 'The ingenious knight-errant and his squire Sancho Panza.',
      },
      {
        lang: 'es',
        gutId: 2000,
        title: 'Don Quijote de la Mancha',
        description:
          'El ingenioso hidalgo y su fiel escudero Sancho Panza en la primera novela moderna.',
      },
    ],
  },
  {
    workKey: 'la-regenta',
    author: 'Leopoldo Alas "Clarín"',
    genres: ['Realismo', 'Drama Social', 'Novela Psicológica'],
    publishedYear: 1884,
    readingTimeMin: 2400,
    ratingAvg: 4.7,
    trendingScore: 83,
    award: 'Obra Cumbre del Realismo Español',
    editions: [
      {
        lang: 'en',
        gutId: 17073,
        title: 'La Regenta',
        description: 'Clarín’s realist masterpiece set in Vetusta (Spanish text).',
        usesEnglishText: true,
      },
      {
        lang: 'es',
        gutId: 17073,
        title: 'La Regenta',
        description:
          'Ana Ozores y la lucha entre amor terrenal y espiritualidad en Vetusta.',
      },
    ],
  },
  {
    workKey: 'platero-y-yo',
    author: 'Juan Ramón Jiménez',
    genres: ['Poesía en Prosa', 'Literatura Española', 'Lírica'],
    publishedYear: 1914,
    readingTimeMin: 240,
    ratingAvg: 4.6,
    trendingScore: 75,
    award: 'Premio Nobel de Literatura 1956',
    editions: [
      {
        lang: 'en',
        gutId: 9980,
        title: 'Platero and I',
        description: 'Poems in prose about a poet and his donkey (Spanish text).',
        usesEnglishText: true,
      },
      {
        lang: 'es',
        gutId: 9980,
        title: 'Platero y yo',
        description: 'Poemas en prosa sobre un poeta y su burro Platero en Andalucía.',
      },
    ],
  },
  {
    workKey: 'dona-perfecta',
    author: 'Benito Pérez Galdós',
    genres: ['Realismo', 'Crítica Social', 'Drama'],
    publishedYear: 1876,
    readingTimeMin: 480,
    ratingAvg: 4.5,
    trendingScore: 72,
    editions: [
      {
        lang: 'en',
        gutId: 15725,
        title: 'Doña Perfecta',
        description: 'Galdós on intolerance in a provincial Spanish town (Spanish text).',
        usesEnglishText: true,
      },
      {
        lang: 'es',
        gutId: 15725,
        title: 'Doña Perfecta',
        description:
          'Pepe Rey choca con el fanatismo religioso encarnado en su tía Doña Perfecta.',
      },
    ],
  },
  {
    workKey: 'metamorphosis',
    author: 'Franz Kafka',
    genres: ['Existencialismo', 'Surrealismo', 'Absurdismo'],
    publishedYear: 1915,
    readingTimeMin: 120,
    ratingAvg: 4.7,
    trendingScore: 87,
    award: 'Ícono del Existencialismo',
    availableUntil: new Date('2026-06-15'),
    editions: [
      {
        lang: 'en',
        gutId: 5200,
        title: 'The Metamorphosis',
        description: 'Gregor Samsa wakes transformed into a giant insect.',
      },
      {
        lang: 'es',
        gutId: 5200,
        title: 'La Metamorfosis',
        description: 'Gregor Samsa despierta convertido en un insecto gigante.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'the-prince',
    author: 'Niccolò Machiavelli',
    genres: ['Filosofía Política', 'Ensayo', 'Historia'],
    publishedYear: 1532,
    readingTimeMin: 180,
    ratingAvg: 4.5,
    trendingScore: 80,
    availableUntil: new Date('2026-05-31'),
    editions: [
      {
        lang: 'en',
        gutId: 1232,
        title: 'The Prince',
        description: 'Machiavelli on power, leadership, and statecraft.',
      },
      {
        lang: 'es',
        gutId: 1232,
        title: 'El Príncipe',
        description: 'Maquiavelo sobre el poder y la razón de Estado.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'tale-two-cities',
    author: 'Charles Dickens',
    genres: ['Histórico', 'Drama', 'Romance'],
    publishedYear: 1859,
    readingTimeMin: 720,
    ratingAvg: 4.7,
    trendingScore: 84,
    availableUntil: new Date('2026-06-01'),
    editions: [
      {
        lang: 'en',
        gutId: 98,
        title: 'A Tale of Two Cities',
        description: 'Sacrifice and redemption during the French Revolution.',
      },
      {
        lang: 'es',
        gutId: 61887,
        title: 'Historia de Dos Ciudades',
        description: 'Sydney Carton y la Revolución Francesa en la obra de Dickens.',
      },
    ],
  },
  {
    workKey: 'lazarillo-tormes',
    author: 'Autor Anónimo',
    genres: ['Picaresca', 'Novela Clásica', 'Sátira Social'],
    publishedYear: 1554,
    readingTimeMin: 120,
    ratingAvg: 4.4,
    trendingScore: 68,
    availableUntil: new Date('2026-05-25'),
    editions: [
      {
        lang: 'en',
        gutId: 320,
        title: 'The Life of Lazarillo de Tormes',
        description: 'The first Spanish picaresque novel (Spanish text).',
        usesEnglishText: true,
      },
      {
        lang: 'es',
        gutId: 320,
        title: 'El lazarillo de Tormes',
        description: 'La primera novela picaresca española narrada en primera persona.',
      },
    ],
  },
  {
    workKey: 'jane-eyre',
    author: 'Charlotte Brontë',
    genres: ['Romance Gótico', 'Bildungsroman', 'Ficción Victoriana'],
    publishedYear: 1847,
    readingTimeMin: 900,
    ratingAvg: 4.8,
    trendingScore: 89,
    editions: [
      {
        lang: 'en',
        gutId: 1260,
        title: 'Jane Eyre',
        description: 'Jane and the enigmatic Mr. Rochester at Thornfield Hall.',
      },
      {
        lang: 'es',
        gutId: 1260,
        title: 'Jane Eyre',
        description: 'Jane y el enigmático Mr. Rochester en Thornfield Hall.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'wuthering-heights',
    author: 'Emily Brontë',
    genres: ['Romance Gótico', 'Drama', 'Ficción Victoriana'],
    publishedYear: 1847,
    readingTimeMin: 720,
    ratingAvg: 4.6,
    trendingScore: 83,
    editions: [
      {
        lang: 'en',
        gutId: 768,
        title: 'Wuthering Heights',
        description: 'Heathcliff and Catherine on the Yorkshire moors.',
      },
      {
        lang: 'es',
        gutId: 768,
        title: 'Cumbres Borrascosas',
        description: 'Heathcliff y Catherine en los páramos de Yorkshire.' + EN_NOTE_ES,
        usesEnglishText: true,
      },
    ],
  },
  {
    workKey: 'odyssey',
    author: 'Homero',
    genres: ['Épica Antigua', 'Mitología Griega', 'Aventura'],
    publishedYear: -800,
    readingTimeMin: 720,
    ratingAvg: 4.8,
    trendingScore: 91,
    award: 'Fundamento de la Literatura Occidental',
    editions: [
      {
        lang: 'en',
        gutId: 1727,
        title: 'The Odyssey',
        description: 'Odysseus’s long voyage home after Troy.',
      },
      {
        lang: 'es',
        gutId: 58221,
        title: 'La Odisea',
        description: 'El regreso de Odiseo a Ítaca tras la guerra de Troya.',
      },
    ],
  },
  {
    workKey: 'christmas-carol',
    author: 'Charles Dickens',
    genres: ['Cuento', 'Navidad', 'Drama Social'],
    publishedYear: 1843,
    readingTimeMin: 120,
    ratingAvg: 4.8,
    trendingScore: 88,
    editions: [
      {
        lang: 'en',
        gutId: 46,
        title: 'A Christmas Carol',
        description: 'Ebenezer Scrooge and the three Christmas spirits.',
      },
      {
        lang: 'es',
        gutId: 10825,
        title: 'Un Cuento de Navidad',
        description: 'Ebenezer Scrooge y los tres espíritus de la Navidad.',
      },
    ],
  },
  {
    workKey: 'scarlet-letter',
    author: 'Nathaniel Hawthorne',
    genres: ['Romance Histórico', 'Drama Moral', 'Ficción Americana'],
    publishedYear: 1850,
    readingTimeMin: 480,
    ratingAvg: 4.5,
    trendingScore: 76,
    editions: [
      {
        lang: 'en',
        gutId: 25344,
        title: 'The Scarlet Letter',
        description: 'Hester Prynne and the scarlet letter A in Puritan New England.',
      },
      {
        lang: 'es',
        gutId: 36990,
        title: 'La Letra Escarlata',
        description: 'Hester Prynne y la letra escarlata en la Nueva Inglaterra puritana.',
      },
    ],
  },
];

export function workToBookRecords(work: LiteraryWork) {
  return work.editions.map((edition) => {
    const sourceId = `gut-${edition.gutId}-${edition.lang}`;
    return {
    sourceId,
    workKey: work.workKey,
    title: edition.title,
    author: work.author,
    description: edition.description ?? '',
    genres: JSON.stringify(work.genres),
    language: edition.lang,
    coverUrl: editionCover(edition, work.author, sourceId),
    downloadUrl: editionDownload(edition),
    pdfUrl: null,
    pdfStatus: 'epub_only' as const,
    source: 'gutenberg' as const,
    publishedYear: work.publishedYear ?? null,
    readingTimeMin: work.readingTimeMin ?? null,
    ratingAvg: work.ratingAvg ?? 4.5,
    trendingScore: work.trendingScore ?? 70,
    topRank: edition.lang === 'en' ? (work.topRank ?? null) : null,
    isFeatured: work.isFeatured ?? false,
    isEpisodic: work.isEpisodic ?? false,
    award: work.award ?? null,
    availableUntil: work.availableUntil ?? null,
  };
  });
}

export function allCatalogBooks() {
  return LITERARY_WORKS.flatMap(workToBookRecords);
}
