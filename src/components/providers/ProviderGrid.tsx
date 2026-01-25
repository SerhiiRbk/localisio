import { ProviderCard } from './ProviderCard';
import type { ProviderWithProfile } from '@/types/database';

interface ProviderGridProps {
  providers: ProviderWithProfile[];
}

export function ProviderGrid({ providers }: ProviderGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <ProviderCard key={provider.user_id} provider={provider} />
      ))}
    </div>
  );
}
