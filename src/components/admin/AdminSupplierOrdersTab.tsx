import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, PackageCheck, Send, X } from 'lucide-react';

type Supplier = { id: string; name: string };
type Inv = { id: string; item_name: string; unit: string | null; unit_cost: number | null };
type Line = { inventory_id: string; item_name: string; quantity: number; unit_cost: number };
type PO = {
  id: string; status: string; expected_date: string | null; total_cost: number; created_at: string;
  notes: string | null; suppliers: { name: string } | null;
  supplier_order_items: { item_name: string; quantity: number }[];
};

const STATUS_VARIANT: Record<string, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  draft: 'secondary', ordered: 'default', received: 'outline', cancelled: 'destructive',
};

export default function AdminSupplierOrdersTab() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<Inv[]>([]);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [expected, setExpected] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  const load = useCallback(async () => {
    const [o, s, i] = await Promise.all([
      supabase.from('supplier_orders').select('*, suppliers(name), supplier_order_items(item_name, quantity)').order('created_at', { ascending: false }),
      supabase.from('suppliers').select('id, name').order('name'),
      supabase.from('inventory').select('id, item_name, unit, unit_cost').order('item_name'),
    ]);
    if (o.error) toast.error(o.error.message);
    setOrders((o.data as unknown as PO[]) || []);
    setSuppliers(s.data || []);
    setInventory((i.data as Inv[]) || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addLine = (invId: string) => {
    const inv = inventory.find(x => x.id === invId);
    if (!inv || lines.some(l => l.inventory_id === invId)) return;
    setLines([...lines, { inventory_id: inv.id, item_name: inv.item_name, quantity: 1, unit_cost: Number(inv.unit_cost || 0) }]);
  };
  const total = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);

  const save = async () => {
    if (!supplierId || lines.length === 0) { toast.error('Pick a supplier and add at least one item'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('supplier_orders').insert({
      supplier_id: supplierId, expected_date: expected || null, notes: notes || null,
      total_cost: total, status: 'draft', created_by: user?.id,
    }).select('id').single();
    if (error || !data) { toast.error(error?.message || 'Could not save'); return; }
    const { error: e2 } = await supabase.from('supplier_order_items').insert(lines.map(l => ({ ...l, supplier_order_id: data.id })));
    if (e2) { toast.error(e2.message); return; }
    toast.success('Supplier order created');
    setOpen(false); setLines([]); setSupplierId(''); setExpected(''); setNotes('');
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('supplier_orders').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'received' ? 'Received — stock levels updated' : `Marked ${status}`);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('supplier_orders').delete().eq('id', id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Order stock from suppliers. Marking an order as received adds the quantities to inventory.</p>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" /> New order</Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>Items</TableHead>
              <TableHead>Expected</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{o.suppliers?.name || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                  {o.supplier_order_items.map(i => `${i.quantity}× ${i.item_name}`).join(', ')}
                </TableCell>
                <TableCell className="text-xs">{o.expected_date || '—'}</TableCell>
                <TableCell>TSh {Number(o.total_cost).toLocaleString()}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[o.status] || 'secondary'} className="capitalize">{o.status}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  {o.status === 'draft' && <Button size="sm" variant="outline" onClick={() => setStatus(o.id, 'ordered')}><Send className="w-3.5 h-3.5 mr-1" />Send</Button>}
                  {o.status === 'ordered' && <Button size="sm" onClick={() => setStatus(o.id, 'received')}><PackageCheck className="w-3.5 h-3.5 mr-1" />Receive</Button>}
                  {(o.status === 'draft' || o.status === 'ordered') && <Button size="sm" variant="ghost" onClick={() => setStatus(o.id, 'cancelled')}><X className="w-3.5 h-3.5" /></Button>}
                  {o.status === 'draft' && <Button size="sm" variant="ghost" onClick={() => remove(o.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No supplier orders yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New supplier order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                  <option value="">Select…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Expected delivery</Label>
                <Input type="date" value={expected} onChange={e => setExpected(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Add stock item</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value="" onChange={e => addLine(e.target.value)}>
                <option value="">Choose from inventory…</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.item_name}{i.unit ? ` (${i.unit})` : ''}</option>)}
              </select>
            </div>
            {lines.map((l, idx) => (
              <div key={l.inventory_id} className="flex items-center gap-2">
                <span className="flex-1 text-sm truncate">{l.item_name}</span>
                <Input type="number" min={0} className="w-20" value={l.quantity}
                  onChange={e => setLines(lines.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))} />
                <Input type="number" min={0} className="w-28" value={l.unit_cost}
                  onChange={e => setLines(lines.map((x, i) => i === idx ? { ...x, unit_cost: Number(e.target.value) } : x))} />
                <Button size="icon" variant="ghost" onClick={() => setLines(lines.filter((_, i) => i !== idx))}><X className="w-4 h-4" /></Button>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <p className="text-right font-semibold">Total: TSh {total.toLocaleString()}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
