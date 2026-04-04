/**
 * Alias map — alternate ways to say the same thing.
 *
 * Structure:
 *   canonical: the exact string that lives in the JSON word list
 *   aliases:   every other acceptable way to say it (all lowercase)
 *
 * Rules:
 * - The canonical MUST exist in the corresponding word list.
 * - An alias is valid for whatever letter it starts with.
 *   e.g. "america" → valid for letter A  (canonical "united states" covers letter U)
 * - Aliases within the same category are deduplicated at runtime.
 */

import { Category, Language } from '../types';

export interface AliasEntry {
  canonical: string;   // must be in the word list
  aliases: string[];   // all other accepted forms
}

export const ALIASES: Record<Language, Partial<Record<Category, AliasEntry[]>>> = {
  en: {
    countries: [
      // USA
      {
        canonical: 'united states',
        aliases: ['usa', 'us', 'america', 'united states of america', 'the united states', 'the usa'],
      },
      // UK
      {
        canonical: 'united kingdom',
        aliases: ['uk', 'britain', 'great britain', 'gb', 'england', 'the uk', 'the united kingdom'],
      },
      // UAE
      {
        canonical: 'united arab emirates',
        aliases: ['uae', 'emirates'],
      },
      // Russia
      {
        canonical: 'russia',
        aliases: ['russian federation'],
      },
      // China
      {
        canonical: 'china',
        aliases: ["people's republic of china", 'prc'],
      },
      // North Korea
      {
        canonical: 'north korea',
        aliases: ['dprk', 'democratic peoples republic of korea'],
      },
      // South Korea
      {
        canonical: 'south korea',
        aliases: ['korea', 'republic of korea'],
      },
      // Democratic Republic of Congo
      {
        canonical: 'democratic republic of the congo',
        aliases: ['drc', 'dr congo', 'dr. congo', 'congo drc', 'zaire'],
      },
      // Czech Republic
      {
        canonical: 'czechia',
        aliases: ['czech republic', 'the czech republic'],
      },
      // Turkey
      {
        canonical: 'turkey',
        aliases: ['turkiye', 'türkiye'],
      },
      // Myanmar
      {
        canonical: 'myanmar',
        aliases: ['burma'],
      },
      // Ivory Coast
      {
        canonical: 'ivory coast',
        aliases: ["cote d'ivoire", "côte d'ivoire", 'cote divoire'],
      },
      // Cape Verde
      {
        canonical: 'cabo verde',
        aliases: ['cape verde'],
      },
      // Eswatini
      {
        canonical: 'eswatini',
        aliases: ['swaziland'],
      },
      // Timor-Leste
      {
        canonical: 'timor-leste',
        aliases: ['east timor', 'timor leste'],
      },
      // Vatican
      {
        canonical: 'vatican',
        aliases: ['vatican city', 'holy see', 'the vatican'],
      },
      // Iran
      {
        canonical: 'iran',
        aliases: ['persia'],
      },
      // Germany
      {
        canonical: 'germany',
        aliases: ['deutschland'],
      },
      // Netherlands
      {
        canonical: 'netherlands',
        aliases: ['holland', 'the netherlands'],
      },
      // Philippines
      {
        canonical: 'philippines',
        aliases: ['the philippines'],
      },
      // Congo (Republic)
      {
        canonical: 'congo',
        aliases: ['republic of the congo', 'republic of congo'],
      },
      // Taiwan
      {
        canonical: 'taiwan',
        aliases: ['republic of china', 'chinese taipei'],
      },
      // Bolivia
      {
        canonical: 'bolivia',
        aliases: ['plurinational state of bolivia'],
      },
      // Venezuela
      {
        canonical: 'venezuela',
        aliases: ['bolivarian republic of venezuela'],
      },
      // Moldova
      {
        canonical: 'moldova',
        aliases: ['republic of moldova'],
      },
      // Macedonia
      {
        canonical: 'north macedonia',
        aliases: ['macedonia', 'fyrom'],
      },
      // Bosnia
      {
        canonical: 'bosnia and herzegovina',
        aliases: ['bosnia', 'herzegovina', 'bih'],
      },
      // Trinidad
      {
        canonical: 'trinidad and tobago',
        aliases: ['trinidad', 'tobago'],
      },
      // Saint Kitts
      {
        canonical: 'saint kitts and nevis',
        aliases: ['st kitts', 'st. kitts', 'saint kitts', 'st kitts and nevis'],
      },
      // Saint Lucia
      {
        canonical: 'saint lucia',
        aliases: ['st lucia', 'st. lucia'],
      },
      // Saint Vincent
      {
        canonical: 'saint vincent and the grenadines',
        aliases: ['st vincent', 'st. vincent', 'saint vincent', 'the grenadines'],
      },
      // Sao Tome
      {
        canonical: 'sao tome and principe',
        aliases: ['sao tome', 'são tomé'],
      },
      // Antigua
      {
        canonical: 'antigua and barbuda',
        aliases: ['antigua', 'barbuda'],
      },
    ],

    cities: [
      // New York
      {
        canonical: 'new york',
        aliases: ['nyc', 'new york city', 'the big apple', 'big apple'],
      },
      // Los Angeles
      {
        canonical: 'los angeles',
        aliases: ['la', 'l.a.', 'the city of angels'],
      },
      // San Francisco
      {
        canonical: 'san francisco',
        aliases: ['sf', 's.f.', 'san fran', 'frisco'],
      },
      // Las Vegas
      {
        canonical: 'las vegas',
        aliases: ['vegas'],
      },
      // Washington DC
      {
        canonical: 'washington dc',
        aliases: ['washington', 'dc', 'd.c.', 'washington d.c.'],
      },
      // Rio de Janeiro
      {
        canonical: 'rio de janeiro',
        aliases: ['rio'],
      },
      // Sao Paulo
      {
        canonical: 'sao paulo',
        aliases: ['são paulo', 'sao paulo'],
      },
      // Saint Petersburg
      {
        canonical: 'saint petersburg',
        aliases: ['st petersburg', 'st. petersburg', 'san petersburg'],
      },
      // Tel Aviv
      {
        canonical: 'tel aviv',
        aliases: ['tel aviv-yafo', 'tel aviv yafo'],
      },
      // Kuala Lumpur
      {
        canonical: 'kuala lumpur',
        aliases: ['kl'],
      },
      // Abu Dhabi
      {
        canonical: 'abu dhabi',
        aliases: ['abudhabi'],
      },
      // Mexico City
      {
        canonical: 'mexico city',
        aliases: ['ciudad de mexico', 'ciudad mexico', 'df', 'd.f.'],
      },
      // Buenos Aires
      {
        canonical: 'buenos aires',
        aliases: ['ba'],
      },
      // Hong Kong
      {
        canonical: 'hong kong',
        aliases: ['hk', 'hong kong sar'],
      },
    ],

    animals: [
      // Killer Whale / Orca (both already in list, but cross-alias)
      {
        canonical: 'killer whale',
        aliases: ['orca whale'],
      },
      {
        canonical: 'orca',
        aliases: ['killer whale orca'],
      },
      // Mountain Lion
      {
        canonical: 'mountain lion',
        aliases: ['cougar', 'puma', 'panther'],
      },
      // Note: cougar and puma are also standalone entries in the list
      {
        canonical: 'cougar',
        aliases: ['mountain lion cougar', 'puma cougar'],
      },
      {
        canonical: 'puma',
        aliases: ['mountain lion puma'],
      },
      // Grey Wolf
      {
        canonical: 'grey wolf',
        aliases: ['gray wolf', 'timber wolf'],
      },
      // Sea Horse
      {
        canonical: 'sea horse',
        aliases: ['seahorse'],
      },
      // Great White Shark
      {
        canonical: 'great white shark',
        aliases: ['great white', 'white shark'],
      },
      // Grizzly Bear
      {
        canonical: 'grizzly',
        aliases: ['grizzly bear', 'brown bear'],
      },
      // Snow Leopard
      {
        canonical: 'snow leopard',
        aliases: ['irbis'],
      },
      // American Bison
      {
        canonical: 'bison',
        aliases: ['american buffalo'],
      },
      // Bottlenose Dolphin
      {
        canonical: 'bottlenose dolphin',
        aliases: ['bottlenose'],
      },
      // Reindeer
      {
        canonical: 'reindeer',
        aliases: ['caribou'],
      },
      // Moose
      {
        canonical: 'moose',
        aliases: ['elk moose'],
      },
    ],

    plants: [],
  },

  he: {
    countries: [
      // ארה"ב
      {
        canonical: 'ארצות הברית',
        aliases: ['ארהב', 'ארה"ב', 'אמריקה', 'ארצות הברית של אמריקה', 'ה-usa', 'usa'],
      },
      // בריטניה
      {
        canonical: 'בריטניה',
        aliases: ['הממלכה המאוחדת', 'אנגליה', 'uk', 'גרייט בריטן'],
      },
      // רוסיה
      {
        canonical: 'רוסיה',
        aliases: ['הפדרציה הרוסית'],
      },
      // סין
      {
        canonical: 'סין',
        aliases: ['הרפובליקה העממית של סין', 'סין העממית'],
      },
      // גרמניה
      {
        canonical: 'גרמניה',
        aliases: ['דויטשלנד'],
      },
      // הולנד
      {
        canonical: 'הולנד',
        aliases: ['נדרלנד', 'ממלכת הולנד'],
      },
    ],
    cities: [
      // ניו יורק
      {
        canonical: 'ניו יורק',
        aliases: ['עיר ניו יורק', 'NYC'],
      },
      // לוס אנג׳לס
      {
        canonical: 'לוס אנג\'לס',
        aliases: ['לוס אנגלס', 'LA', 'ל.א.'],
      },
    ],
    animals: [],
    plants: [],
  },
};

// ─── Runtime lookup structure (built once at module load) ─────────────────────

type AliasLookup = Map<string, string>; // alias/canonical → canonical

const lookupCache: Partial<Record<Language, Partial<Record<Category, AliasLookup>>>> = {};

export function getAliasLookup(language: Language, category: Category): AliasLookup {
  if (!lookupCache[language]) lookupCache[language] = {};
  const langCache = lookupCache[language]!;
  if (langCache[category]) return langCache[category]!;

  const map: AliasLookup = new Map();
  const entries = ALIASES[language]?.[category] ?? [];
  for (const entry of entries) {
    const canon = entry.canonical.toLowerCase().trim();
    for (const alias of entry.aliases) {
      const norm = alias.toLowerCase().trim();
      if (norm && norm !== canon) {
        map.set(norm, canon);
      }
    }
  }
  langCache[category] = map;
  return map;
}
