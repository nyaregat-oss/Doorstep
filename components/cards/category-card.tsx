import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Camera,
  Car,
  Cpu,
  Droplets,
  Hammer,
  HardHat,
  Paintbrush,
  Scissors,
  Sparkles,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import { getCategoryBrowseUrl, type HomepageCategory } from '@/lib/kenya';

const ICONS = {
  Droplets,
  Zap,
  Sparkles,
  Hammer,
  Paintbrush,
  Wrench,
  Truck,
  Scissors,
  Car,
  Cpu,
  HardHat,
  Camera,
} as const;

export function CategoryCard({ category }: { category: HomepageCategory }) {
  const Icon = ICONS[category.iconName] || Wrench;
  return (
    <Link className="ds-cat-card" href={getCategoryBrowseUrl(category)}>
      <div className="ds-cat-media">
        <Image
          src={category.image}
          alt={`${category.displayName} specialist at work`}
          fill
          sizes="(max-width: 420px) 100vw, (max-width: 1040px) 33vw, 25vw"
          style={{ objectFit: 'cover' }}
        />
        <span className="ds-cat-icon-pill" aria-hidden="true">
          <Icon size={17} />
        </span>
      </div>
      <div className="ds-cat-body">
        <span className="ds-cat-title">
          <span>{category.displayName}</span>
          <ArrowUpRight size={16} aria-hidden="true" className="ds-muted" />
        </span>
        <span className="ds-cat-desc">{category.description}</span>
      </div>
    </Link>
  );
}
