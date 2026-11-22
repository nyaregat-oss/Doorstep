import { createClient } from '@/lib/supabase/server';
import { getSampleProviders } from '@/lib/marketplace-data';
import type { ProfessionalCardData } from '@/components/cards/professional-card';
import { HomeClient } from '@/components/home/home-client';

type HomeServiceRow = {
  id: string;
  name: string;
  description: string;
  starting_price: number | string;
  currency: string;
  provider_profiles:
    | Array<{
        profile_id: string;
        business_name: string;
        location: string;
        verified: boolean;
        categories: { name: string }[] | { name: string } | null;
      }>
    | {
        profile_id: string;
        business_name: string;
        location: string;
        verified: boolean;
        categories: { name: string }[] | { name: string } | null;
      };
};

export default async function HomePage() {
  let liveFeatured: ProfessionalCardData[] = [];
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('services')
        .select(
          'id, name, description, starting_price, currency, provider_profiles!inner(profile_id, business_name, location, verified, categories(name))',
        )
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      const rows = (data || []) as unknown as HomeServiceRow[];
      liveFeatured = rows.flatMap((service) => {
        const provider = Array.isArray(service.provider_profiles)
          ? service.provider_profiles[0]
          : service.provider_profiles;
        if (!provider) return [];
        const joinedCategory = Array.isArray(provider.categories)
          ? provider.categories[0]
          : provider.categories;
        return [
          {
            id: service.id,
            providerId: provider.profile_id,
            businessName: provider.business_name,
            serviceName: service.name,
            description: service.description,
            location: provider.location,
            category: joinedCategory?.name || 'Other service',
            price: Number(service.starting_price),
            currency: service.currency,
            source: 'live' as const,
            verified: provider.verified,
          },
        ];
      });
    } catch {
      liveFeatured = [];
    }
  }

  const samples = getSampleProviders();
  // Select 6 distinct categories for a balanced showcase across Kenyan trades.
  const featuredIndices = [0, 3, 6, 15, 18, 45];
  const sampleFeatured: ProfessionalCardData[] = featuredIndices
    .map((idx) => samples[idx])
    .filter(Boolean)
    .map((provider) => ({
      id: provider.id,
      providerId: provider.id,
      businessName: provider.businessName,
      serviceName: provider.category,
      description: provider.categoryDescription,
      location: provider.location,
      category: provider.category,
      price: provider.startingPrice,
      currency: provider.currency,
      source: 'sample' as const,
      imageUrl: provider.image,
      availabilityLabel: provider.availability,
    }));

  const featuredProfessionals = liveFeatured.length > 0 ? liveFeatured : sampleFeatured;

  return (
    <HomeClient
      featuredProfessionals={featuredProfessionals}
      hasLiveListings={liveFeatured.length > 0}
    />
  );
}
