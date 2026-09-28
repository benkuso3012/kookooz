import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type StaffRole = 'admin' | 'manager' | 'cashier' | 'kitchen';

const ALL_TABS = ['overview','orders','pos','menu','inventory','specials','stores','kds','customers','staff','comms','promotions','suppliers','supplier-orders','delivery-zones','reports','roles','settings','audit'];

/** Which dashboard sections each staff role can open. Database rules enforce the same limits. */
export const ROLE_TABS: Record<StaffRole, string[]> = {
  admin: ALL_TABS,
  manager: ALL_TABS.filter(t => t !== 'roles'),
  cashier: ['overview', 'orders', 'pos', 'kds'],
  kitchen: ['kds', 'orders'],
};

export function allowedTabs(roles: StaffRole[]): string[] {
  return Array.from(new Set(roles.flatMap(r => ROLE_TABS[r] ?? [])));
}

export function useAdminAuth() {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRoles([]); setUserId(null); setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      setRoles(((data || []).map(r => r.role).filter(r => r !== 'customer')) as StaffRole[]);
      setLoading(false);
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setTimeout(check, 0); });
    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes('admin');
  const isStaff = roles.length > 0;
  return { isAdmin, isStaff, roles, loading, userId };
}
