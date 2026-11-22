export const KENYAN_LOCATIONS = [
  'Westlands, Nairobi',
  'Kilimani, Nairobi',
  'Lavington, Nairobi',
  'Karen, Nairobi',
  'Kileleshwa, Nairobi',
  'Parklands, Nairobi',
  'South B, Nairobi',
  'South C, Nairobi',
  'Lang’ata, Nairobi',
  'Gigiri, Nairobi',
  'Ruaka, Kiambu',
  'Kasarani, Nairobi',
  'Syokimau, Machakos',
  'Ngong Road, Nairobi',
  'Nairobi CBD',
  'Mombasa — Nyali',
  'Mombasa — Bamburi',
  'Kisumu — Milimani',
  'Nakuru — Section 58',
  'Uasin Gishu — Eldoret',
  'Kiambu — Thika',
  'Kiambu — Ruiru',
  'Kajiado — Kitengela',
  'Kajiado — Ngong',
  'Machakos — Athi River',
  'Nyeri Town',
  'Nanyuki, Laikipia',
  'Naivasha, Nakuru',
  'Meru Town',
] as const;

export const QUICK_AREA_FILTERS = [
  { label: 'All Kenya', value: '' },
  { label: 'Westlands', value: 'Westlands' },
  { label: 'Kilimani', value: 'Kilimani' },
  { label: 'Karen', value: 'Karen' },
  { label: 'Mombasa · Nyali', value: 'Nyali' },
  { label: 'Kisumu', value: 'Kisumu' },
  { label: 'Nakuru', value: 'Nakuru' },
  { label: 'Eldoret', value: 'Eldoret' },
  { label: 'Thika', value: 'Thika' },
] as const;

export type HomepageCategory = {
  slug: string;
  displayName: string;
  filterCategory?: string;
  filterQuery?: string;
  description: string;
  image: string;
  iconName:
    | 'Droplets'
    | 'Zap'
    | 'Sparkles'
    | 'Hammer'
    | 'Paintbrush'
    | 'Wrench'
    | 'Truck'
    | 'Scissors'
    | 'Car'
    | 'Cpu'
    | 'HardHat'
    | 'Camera';
};

export const HOMEPAGE_CATEGORIES: readonly HomepageCategory[] = [
  {
    slug: 'plumbing',
    displayName: 'Plumbing',
    filterCategory: 'Plumbing',
    description: 'Pipe leaks, fixtures, drainage, and bathroom installs',
    image: '/images/cat-plumbing.jpg',
    iconName: 'Droplets',
  },
  {
    slug: 'electrical',
    displayName: 'Electrical',
    filterCategory: 'Electrical',
    description: 'Wiring, distribution boards, solar backup, and lighting',
    image: '/images/cat-electrical.jpg',
    iconName: 'Zap',
  },
  {
    slug: 'cleaning',
    displayName: 'Cleaning',
    filterCategory: 'Cleaning',
    description: 'Apartment deep cleans, offices, and upholstery care',
    image: '/images/cat-cleaning.jpg',
    iconName: 'Sparkles',
  },
  {
    slug: 'carpentry',
    displayName: 'Carpentry',
    filterCategory: 'Carpentry',
    description: 'Custom cabinetry, doors, repairs, and hardwood furniture',
    image: '/images/cat-carpentry.jpg',
    iconName: 'Hammer',
  },
  {
    slug: 'painting',
    displayName: 'Painting',
    filterCategory: 'Painting',
    description: 'Crisp interior walls, weatherproofing, and finishes',
    image: '/images/cat-painting.jpg',
    iconName: 'Paintbrush',
  },
  {
    slug: 'home-repairs',
    displayName: 'Home Repairs',
    filterCategory: 'Home repairs',
    description: 'Appliance servicing, mounting, tiling, and maintenance',
    image: '/images/cat-home-repairs.jpg',
    iconName: 'Wrench',
  },
  {
    slug: 'moving',
    displayName: 'Moving',
    filterCategory: 'Moving',
    description: 'Home relocations, packing, and town-to-town delivery',
    image: '/images/cat-moving.jpg',
    iconName: 'Truck',
  },
  {
    slug: 'beauty-wellness',
    displayName: 'Beauty & Wellness',
    filterCategory: 'Beauty',
    description: 'Mobile hairstyling, braiding, grooming, and makeup',
    image: '/images/cat-beauty.jpg',
    iconName: 'Scissors',
  },
  {
    slug: 'automotive',
    displayName: 'Automotive',
    filterCategory: 'Automotive',
    description: 'Diagnostics, routine servicing, and detailing at your door',
    image: '/images/cat-automotive.jpg',
    iconName: 'Car',
  },
  {
    slug: 'technology',
    displayName: 'Technology',
    filterCategory: 'IT support',
    description: 'Laptop repair, Wi-Fi setup, CCTV, and web design',
    image: '/images/cat-technology.jpg',
    iconName: 'Cpu',
  },
  {
    slug: 'construction',
    displayName: 'Construction',
    filterQuery: 'construction',
    description: 'Masonry, renovations, roofing, and structural works',
    image: '/images/cat-construction.jpg',
    iconName: 'HardHat',
  },
  {
    slug: 'other-services',
    displayName: 'Other Services',
    filterQuery: '',
    description: 'Photography, gardening, catering, events, and tutoring',
    image: '/images/cat-other.jpg',
    iconName: 'Camera',
  },
] as const;

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  Plumbing: '/images/cat-plumbing.jpg',
  Electrical: '/images/cat-electrical.jpg',
  Cleaning: '/images/cat-cleaning.jpg',
  'Home repairs': '/images/cat-home-repairs.jpg',
  'Home Repairs': '/images/cat-home-repairs.jpg',
  Painting: '/images/cat-painting.jpg',
  Carpentry: '/images/cat-carpentry.jpg',
  Beauty: '/images/cat-beauty.jpg',
  'Beauty & Wellness': '/images/cat-beauty.jpg',
  Photography: '/images/cat-other.jpg',
  'Event planning': '/images/cat-other.jpg',
  Moving: '/images/cat-moving.jpg',
  Gardening: '/images/cat-construction.jpg',
  Catering: '/images/cat-other.jpg',
  'IT support': '/images/cat-technology.jpg',
  'Web and design': '/images/cat-technology.jpg',
  Technology: '/images/cat-technology.jpg',
  Tutoring: '/images/cat-other.jpg',
  Automotive: '/images/cat-automotive.jpg',
  Construction: '/images/cat-construction.jpg',
};

export function getCategoryImage(categoryName: string): string {
  return CATEGORY_IMAGE_MAP[categoryName] || '/images/cat-other.jpg';
}

export function getCategoryBrowseUrl(item: HomepageCategory): string {
  const params = new URLSearchParams();
  if (item.filterCategory) params.set('category', item.filterCategory);
  else if (item.filterQuery) params.set('q', item.filterQuery);
  const query = params.toString();
  return query ? `/browse?${query}` : '/browse';
}

export function formatCurrency(amount: number | string, currency = 'KES'): string {
  const numeric = Number(amount);
  const code = (currency || 'KES').trim().toUpperCase();
  if (!Number.isFinite(numeric)) return `${code} 0`;
  const formattedNumber = numeric.toLocaleString('en-KE', {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${code} ${formattedNumber}`;
}

export function formatKenyanDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  }).format(date);
}
