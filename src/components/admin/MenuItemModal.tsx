import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_spicy: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  calories: number | null;
  prep_time: number;
  image_url: string | null;
  rating: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null; // null = create mode
  onSaved: () => void;
  categories: { id: string; name: string }[];
};

const defaults: Omit<MenuItem, 'id'> = {
  name: '',
  price: 0,
  description: '',
  category_id: null,
  is_available: true,
  is_featured: false,
  is_spicy: false,
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
  calories: null,
  prep_time: 15,
  image_url: null,
  rating: 4.5,
};

export default function MenuItemModal({ open, onClose, item, onSaved, categories }: Props) {
  const [form, setForm] = useState<Omit<MenuItem, 'id'>>(defaults);
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    if (item) {
      const { id, ...rest } = item;
      setForm(rest);
    } else {
      setForm({ ...defaults });
    }
  }, [item, open]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (form.price <= 0) { toast.error('Price must be greater than 0'); return; }
    setSaving(true);

    const payload = {
      name: form.name,
      price: form.price,
      description: form.description || null,
      category_id: form.category_id || null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_spicy: form.is_spicy,
      is_vegetarian: form.is_vegetarian,
      is_vegan: form.is_vegan,
      is_gluten_free: form.is_gluten_free,
      calories: form.calories,
      prep_time: form.prep_time,
      image_url: form.image_url || null,
    };

    let error;
    if (isEdit) {
      ({ error } = await (supabase as any).from('menu_items').update(payload).eq('id', item.id));
    } else {
      ({ error } = await (supabase as any).from('menu_items').insert(payload));
    }

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Item updated!' : 'Item created!');
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Menu Item' : 'Create Menu Item'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Kuku Choma" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Price (TSh) *</Label>
              <Input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Prep Time (min)</Label>
              <Input type="number" value={form.prep_time} onChange={e => set('prep_time', Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Calories</Label>
              <Input type="number" value={form.calories ?? ''} onChange={e => set('calories', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.category_id || ''}
                onChange={e => set('category_id', e.target.value || null)}
              >
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} />
          </div>

          <div className="grid gap-1.5">
            <Label>Photo</Label>
            <ImageUpload value={form.image_url || null} onChange={url => set('image_url', url)} folder="menu" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'is_available', label: 'Available' },
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_spicy', label: 'Spicy 🌶️' },
              { key: 'is_vegetarian', label: 'Vegetarian' },
              { key: 'is_vegan', label: 'Vegan' },
              { key: 'is_gluten_free', label: 'Gluten-Free' },
            ].map(toggle => (
              <div key={toggle.key} className="flex items-center justify-between">
                <Label className="text-sm">{toggle.label}</Label>
                <Switch
                  checked={form[toggle.key as keyof typeof form] as boolean}
                  onCheckedChange={v => set(toggle.key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
