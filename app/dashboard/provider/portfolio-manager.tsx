'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { addPortfolioItemAction, deletePortfolioItemAction } from './actions';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

type PortfolioItem = { id: string; storage_path: string; caption: string };
const bucket = 'doorstep-provider-portfolio';
const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function PortfolioManager({ items, loadError }: { items: PortfolioItem[]; loadError: boolean }) {
  const router = useRouter();
  const { notify } = useToast();
  const [busy, startTransition] = useTransition();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadUrls() {
      try {
        const client = createBrowserSupabaseClient();
        const entries = await Promise.all(
          items.map(async (item) => {
            const { data } = await client.storage.from(bucket).createSignedUrl(item.storage_path, 3600);
            return [item.id, data?.signedUrl || ''] as const;
          }),
        );
        if (!cancelled) setUrls(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setFeedback('Portfolio images could not be loaded. Check your Supabase Storage setup.');
      }
    }
    void loadUrls();
    return () => {
      cancelled = true;
    };
  }, [items]);

  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get('image');
    const caption = String(data.get('caption') || '').trim();
    if (!(file instanceof File) || file.size === 0) {
      setFeedback('Choose an image to upload.');
      return;
    }
    if (!allowedTypes.has(file.type) || file.size > maxFileSize) {
      setFeedback('Choose a JPEG, PNG, or WebP image under 5 MB.');
      return;
    }
    startTransition(async () => {
      try {
        const client = createBrowserSupabaseClient();
        const {
          data: { user },
          error: authError,
        } = await client.auth.getUser();
        if (authError || !user) {
          setFeedback('Sign in again to upload portfolio images.');
          return;
        }
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage
          .from(bucket)
          .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
        if (uploadError) {
          setFeedback('The image could not be uploaded. Check the portfolio migration and Storage policies.');
          return;
        }
        const itemData = new FormData();
        itemData.set('storage_path', path);
        itemData.set('caption', caption);
        const result = await addPortfolioItemAction(itemData);
        if (result.error) {
          await client.storage.from(bucket).remove([path]);
          setFeedback(result.error);
          notify(result.error, 'error');
          return;
        }
        form.reset();
        setSelectedFile('');
        const msg = result.message || 'Portfolio image added.';
        setFeedback(msg);
        notify(msg, 'success');
        router.refresh();
      } catch {
        setFeedback('The image could not be uploaded. Check your connection and try again.');
      }
    });
  }

  function confirmRemove() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    const data = new FormData();
    data.set('id', target.id);
    startTransition(async () => {
      const result = await deletePortfolioItemAction(data);
      const msg = result.error || result.message || '';
      setFeedback(msg);
      notify(msg, result.error ? 'error' : 'success');
      if (!result.error) router.refresh();
    });
  }

  return (
    <section className="ds-card ds-panel">
      <div className="ds-panel-head">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImagePlus size={20} aria-hidden="true" />
            Work portfolio
          </h2>
          <p className="ds-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
            Showcase finished projects. Upload JPEG, PNG, or WebP photos up to 5 MB each. Never upload IDs or private
            documents here.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="ds-alert ds-alert-error" role="alert">
          <span>Portfolio data could not load. Apply the portfolio and availability migration.</span>
        </div>
      )}

      <form className="ds-dropzone" onSubmit={upload}>
        <div className="ds-form-grid">
          <label className="ds-field">
            Select portfolio photograph
            <input
              className="ds-input"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={busy}
              onChange={(event) => setSelectedFile(event.target.files?.[0]?.name || '')}
            />
          </label>
          <label className="ds-field">
            Caption (optional)
            <input
              className="ds-input"
              name="caption"
              maxLength={240}
              placeholder="e.g. Kitchen mixer replacement in Kilimani"
              disabled={busy}
            />
          </label>
        </div>
        <div className="ds-actions-row">
          <button className="ds-btn ds-btn-primary ds-btn-sm" type="submit" disabled={busy}>
            <UploadCloud size={15} aria-hidden="true" />
            {busy ? 'Uploading…' : 'Upload photo'}
          </button>
          {selectedFile && (
            <span className="ds-muted" style={{ fontSize: '0.86rem' }}>
              Selected: {selectedFile}
            </span>
          )}
        </div>
      </form>

      {items.length > 0 ? (
        <div className="ds-portfolio-grid">
          {items.map((item) => (
            <article className="ds-card ds-portfolio-card" key={item.id}>
              {urls[item.id] ? (
                <div style={{ position: 'relative', aspectRatio: '4 / 3', width: '100%', overflow: 'hidden', borderRadius: 6 }}>
                  <Image
                    src={urls[item.id]}
                    alt={item.caption || 'Provider portfolio work'}
                    fill
                    unoptimized
                    sizes="220px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div className="ds-skeleton" style={{ aspectRatio: '4 / 3', width: '100%' }} />
              )}
              <p className="ds-muted" style={{ fontSize: '0.86rem' }}>
                {item.caption || 'Portfolio image'}
              </p>
              <button
                className="ds-btn ds-btn-danger ds-btn-sm"
                type="button"
                disabled={busy}
                onClick={() => setPendingDelete(item)}
              >
                <Trash2 size={14} aria-hidden="true" />
                Remove
              </button>
            </article>
          ))}
        </div>
      ) : (
        !loadError && (
          <EmptyState
            title="No portfolio photos yet"
            description="Upload photos of your real craft work so Kenyan homeowners and businesses can inspect quality before requesting."
          />
        )
      )}

      {feedback && (
        <p className="ds-muted" role="status" aria-live="polite" style={{ fontSize: '0.9rem' }}>
          {feedback}
        </p>
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Remove portfolio photo?"
        description="This permanently removes the photo from your public provider profile."
        footer={
          <>
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setPendingDelete(null)}>
              Cancel
            </button>
            <button type="button" className="ds-btn ds-btn-danger ds-btn-sm" onClick={confirmRemove}>
              Remove photo
            </button>
          </>
        }
      />
    </section>
  );
}
