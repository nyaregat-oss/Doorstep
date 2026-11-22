import { categories } from './catalog';
import { getCategoryImage } from './kenya';

export const sampleAreas = [
  'Nairobi — Westlands',
  'Nairobi — Kilimani',
  'Mombasa — Nyali',
  'Kisumu — Milimani',
  'Nakuru — Section 58',
  'Uasin Gishu — Eldoret',
  'Kiambu — Thika',
  'Nairobi — Karen',
] as const;

const names = [
  'Wanjiku Kamau',
  'Brian Ochieng',
  'Amina Hassan',
  'David Kipchoge',
  'Faith Mutua',
  'Samuel Njoroge',
  'Grace Akinyi',
  'Peter Mwangi',
  'Mercy Chebet',
  'Joseph Otieno',
  'Esther Nyambura',
  'Hassan Omar',
];

const suffixes = ['Pro', '& Co.', 'Works', 'Studio'];

const sampleAvailability = [
  { key: 'today', label: 'Sample availability: today' },
  { key: 'tomorrow', label: 'Sample availability: tomorrow' },
  { key: 'this-week', label: 'Sample availability: this week' },
  { key: 'weekends', label: 'Sample availability: weekends' },
];

const basePricesKes = [3500, 4500, 3000, 4000, 6000, 5000, 2500, 12000, 15000, 8000, 3500, 9000, 4000, 15000, 2500, 4500];

const categorySkills: Record<string, string[]> = {
  Plumbing: ['Leak detection', 'Solar water heaters', 'Drain unblocking', 'Bathroom fittings'],
  Electrical: ['DB board wiring', 'Inverter & solar', 'Lighting installs', 'Fault diagnostics'],
  Cleaning: ['Deep apartment clean', 'Post-renovation', 'Sofa & carpet care', 'Office upkeep'],
  'Home repairs': ['TV & shelf mounting', 'Lock & hinge repair', 'Grout & tiling', 'General handyman'],
  Painting: ['Interior emulsions', 'Exterior weatherguard', 'Gypsum finishing', 'Timber varnish'],
  Carpentry: ['Custom wardrobes', 'Kitchen cabinets', 'Door fitting', 'Hardwood furniture'],
  Beauty: ['Knotless braiding', 'Bridal styling', 'Barbering & fades', 'Mobile manicure'],
  Photography: ['Event coverage', 'Commercial shoots', 'Portrait sessions', 'Product photography'],
  'Event planning': ['Corporate setups', 'Tents & decor', 'Sound & lighting', 'Private events'],
  Moving: ['Apartment moves', 'Careful packing', 'Furniture assembly', 'Inter-county delivery'],
  Gardening: ['Compound landscaping', 'Hedge trimming', 'Lawn care', 'Irrigation setup'],
  Catering: ['Private dining', 'Office lunches', 'Nyama choma & grill', 'Pastry & tea'],
  'IT support': ['Laptop repair', 'Home mesh Wi-Fi', 'CCTV setup', 'Printer & network'],
  'Web and design': ['Business websites', 'Brand identity', 'E-commerce setup', 'UI design'],
  Tutoring: ['KCSE & IGCSE prep', 'Primary literacy', 'Coding basics', 'Kiswahili & English'],
  Automotive: ['On-site diagnostics', 'Oil & filter service', 'Brake inspection', 'Interior detailing'],
};

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
  image: string;
  experienceLabel: string;
  skills: string[];
  isSample: true;
};

export function getSampleProviders(): SampleProvider[] {
  return categories.flatMap(([category, categoryDescription], categoryIndex) =>
    [0, 1, 2].map((providerIndex) => {
      const name = names[(categoryIndex * 3 + providerIndex) % names.length];
      const firstName = name.split(' ')[0];
      return {
        id: `sample-${categoryIndex}-${providerIndex}`,
        name,
        businessName: `${firstName}’s ${category} ${suffixes[(categoryIndex + providerIndex) % suffixes.length]}`,
        category,
        categoryDescription,
        location: sampleAreas[(categoryIndex * 2 + providerIndex) % sampleAreas.length],
        startingPrice: Math.round(basePricesKes[categoryIndex] * (0.8 + providerIndex * 0.2)),
        currency: 'KES',
        availability: sampleAvailability[(categoryIndex + providerIndex) % sampleAvailability.length].label,
        availabilityKey: sampleAvailability[(categoryIndex + providerIndex) % sampleAvailability.length].key,
        about: `Illustrative preview profile demonstrating how ${category.toLowerCase()} specialists present their scope, area coverage, and transparent starting prices on Doorstep.`,
        image: getCategoryImage(category),
        experienceLabel: `${3 + ((categoryIndex + providerIndex) % 8)} years (Sample)`,
        skills: categorySkills[category] || [category, 'Local service'],
        isSample: true as const,
      };
    }),
  );
}

export function getSampleProvider(id: string) {
  return getSampleProviders().find((provider) => provider.id === id) || null;
}
