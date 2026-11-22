'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleSaveProviderAction } from '@/app/dashboard/customer/actions';
import { useToast } from '@/components/ui/toast';

export function SaveProviderButton({
  providerId,
  initialSaved,
  canSave,
}: {
  providerId: string;
  initialSaved: boolean;
  canSave: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, startTransition] = useTransition();
  const { notify } = useToast();

  function handleClick() {
    if (!canSave) {
      notify('Sign in as a customer on a live provider profile to save professionals.', 'info');
      return;
    }
    const formData = new FormData();
    formData.set('provider_id', providerId);
    startTransition(async () => {
      const result = await toggleSaveProviderAction(formData);
      if (result.error) {
        notify(result.error, 'error');
        return;
      }
      if (typeof result.saved === 'boolean') {
        setSaved(result.saved);
      }
      if (result.message) {
        notify(result.message, 'success');
      }
    });
  }

  return (
    <button
      type="button"
      className={`ds-btn ds-btn-sm ${saved ? 'ds-btn-amber' : 'ds-btn-secondary'}`}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
    >
      <Heart size={15} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {saved ? 'Saved' : 'Save Professional'}
    </button>
  );
}
