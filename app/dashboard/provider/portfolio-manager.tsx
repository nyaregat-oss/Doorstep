'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addPortfolioItemAction, deletePortfolioItemAction } from './actions';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type PortfolioItem = { id: string; storage_path: string; caption: string };
const bucket = 'doorstep-provider-portfolio';
const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function PortfolioManager({ items, loadError }: { items: PortfolioItem[]; loadError: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [selectedFile, setSelectedFile] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadUrls() {
      try {
        const client = createBrowserSupabaseClient();
        const entries = await Promise.all(items.map(async (item) => {
          const { data } = await client.storage.from(bucket).createSignedUrl(item.storage_path, 3600);
          return [item.id, data?.signedUrl || ''] as const;
        }));
        if (!cancelled) setUrls(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setFeedback('Portfolio images could not be loaded. Check your Supabase Storage setup.');
      }
    }
    void loadUrls();
    return () => { cancelled = true; };
  }, [items]);

  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get('image');
    const caption = String(data.get('caption') || '').trim();
    if (!(file instanceof File) || file.size === 0) { setFeedback('Choose an image to upload.'); return; }
    if (!allowedTypes.has(file.type) || file.size > maxFileSize) { setFeedback('Choose a JPEG, PNG, or WebP image under 5 MB.'); return; }
    startTransition(async () => {
      try {
        const client = createBrowserSupabaseClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) { setFeedback('Sign in again to upload portfolio images.'); return; }
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
        if (uploadError) { setFeedback('The image could not be uploaded. Check the portfolio migration and Storage policies.'); return; }
        const itemData = new FormData();
        itemData.set('storage_path', path);
        itemData.set('caption', caption);
        const result = await addPortfolioItemAction(itemData);
        if (result.error) {
          await client.storage.from(bucket).remove([path]);
          setFeedback(result.error);
          return;
        }
        form.reset();
        setSelectedFile('');
        setFeedback(result.message || 'Portfolio image added.');
        router.refresh();
      } catch {
        setFeedback('The image could not be uploaded. Check your connection and try again.');
      }
    });
  }

  function remove(item: PortfolioItem) {
    if (!window.confirm('Remove this image from your portfolio?')) return;
    const data = new FormData();
    data.set('id', item.id);
    startTransition(async () => {
      const result = await deletePortfolioItemAction(data);
      setFeedback(result.error || result.message || '');
      if (!result.error) router.refresh();
    });
  }

  return <section className="card provider-panel">
    <div className="panel-heading"><div><h2>Portfolio</h2><p className="muted">Upload up to 5 MB per image. Only JPEG, PNG, and WebP files are accepted.</p></div></div>
    {loadError && <p className="auth-error" role="alert">Portfolio data could not load. Apply the portfolio and availability migration.</p>}
    <form className="portfolio-upload" onSubmit={upload}>
      <label>Portfolio image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={(event) => setSelectedFile(event.target.files?.[0]?.name || '')}/></label>
      <label>Caption (optional)<input name="caption" maxLength={240} placeholder="Describe the work shown" disabled={busy}/></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload image'}</button>
      {selectedFile && <p className="note">Selected: {selectedFile}</p>}
    </form>
    {items.length > 0 ? <div className="portfolio-grid">{items.map((item) => <article className="card portfolio-item" key={item.id}>
      {urls[item.id] ? <img src={urls[item.id]} alt={item.caption || 'Provider portfolio work'} loading="lazy"/> : <div className="portfolio-placeholder">Loading image…</div>}
      <p>{item.caption || 'Portfolio image'}</p>
      <button className="btn ghost small danger" type="button" disabled={busy} onClick={() => remove(item)}>Remove</button>
    </article>)}</div> : !loadError && <p className="banner">No portfolio images yet. Your uploads will appear on your public provider profile.</p>}
    <p className="provider-feedback" role="status" aria-live="polite">{feedback}</p>
  </section>;
}
