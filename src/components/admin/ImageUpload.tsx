import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

const BUCKET = 'menu-images';
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Downscale + re-encode to WebP in the browser so uploads stay small. */
async function compress(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/webp', quality));
  return blob ?? file;
}

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
};

export default function ImageUpload({ value, onChange, folder = 'items' }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    setBusy(true);
    try {
      const blob = await compress(file);
      const path = `${folder}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
      if (signErr) throw signErr;
      onChange(data.signedUrl);
      toast.success('Photo uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-36 rounded-md overflow-hidden border border-border">
          <img src={value} alt="Menu item preview" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          <Button type="button" size="icon" variant="secondary" className="absolute top-1 right-1 h-7 w-7"
            onClick={() => onChange(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1.5" />
          {busy ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>
      <Input
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        placeholder="…or paste an image link"
      />
    </div>
  );
}
