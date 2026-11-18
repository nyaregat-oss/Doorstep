import { categories } from './catalog';

export const sampleAreas = [
  'Nairobi — Westlands',
  'Mombasa — Nyali',
  'Kisumu — Milimani',
  'Nakuru — Section 58',
  'Uasin Gishu — Eldoret',
  'Kiambu — Thika',
] as const;

const names = ['Marco Reyes', 'Lena Okafor', 'Priya Nair', 'Sam Whitfield', 'Ana Torres', 'Kenji Mori', 'Rosa Delgado', 'Daniel Cho', 'Amara Obi', 'Tomas Novak', 'Grace Liu', 'Ibrahim Yusuf'];
const suffixes = ['Pro', '& Co.', 'Works', 'Studio'];
const sampleAvailability = [
  { key: 'today', label: 'Sample availability: today' },
  { key: 'tomorrow', label: 'Sample availability: tomorrow' },
  { key: 'this-week', label: 'Sample availability: this week' },
  { key: 'weekends', label: 'Sample availability: weekends' },
];
const basePricesKes = [3500, 4500, 3000, 4000, 6000, 5000, 2500, 12000, 15000, 8000, 3500, 9000, 4000, 15000, 2500, 4500];

export type SampleProvider = {
  id: string;
  name: string;
  businessName: string;
  category: string;
  categoryDescription: string;
  location: string;
  startingPrice: number;
  currency: 'KES';
  availability: string;
  availabilityKey: string;
  about: string;
  isSample: true;
};

export function getSampleProviders(): SampleProvider[] {
  return categories.flatMap(([category, categoryDescription], categoryIndex) => [0, 1, 2].map((providerIndex) => {
    const name = names[(categoryIndex * 3 + providerIndex) % names.length];
    return {
      id: `sample-${categoryIndex}-${providerIndex}`,
      name,
      businessName: `${name.split(' ')[0]}’s ${category} ${suffixes[(categoryIndex + providerIndex) % suffixes.length]}`,
      category,
      categoryDescription,
      location: sampleAreas[(categoryIndex * 2 + providerIndex) % sampleAreas.length],
      startingPrice: Math.round(basePricesKes[categoryIndex] * (0.8 + providerIndex * 0.2)),
      currency: 'KES',
      availability: sampleAvailability[(categoryIndex + providerIndex) % sampleAvailability.length].label,
      availabilityKey: sampleAvailability[(categoryIndex + providerIndex) % sampleAvailability.length].key,
      about: 'Illustrative sample profile for the Doorstep preview. A live provider will write and manage their own profile details.',
      isSample: true as const,
    };
  }));
}

export function getSampleProvider(id: string) {
  return getSampleProviders().find((provider) => provider.id === id) || null;
}
