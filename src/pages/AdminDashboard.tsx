import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth, allowedTabs } from '@/hooks/useAdminAuth';
import AdminSupplierOrdersTab from '@/components/admin/AdminSupplierOrdersTab';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { RefreshCw, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminOnboarding from '@/components/admin/AdminOnboarding';
import OrderNotifications from '@/components/admin/OrderNotifications';
import AdminNotificationCenter from '@/components/admin/AdminNotificationCenter';
import AdminOverviewTab from '@/components/admin/AdminOverviewTab';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import AdminMenuTab from '@/components/admin/AdminMenuTab';
import AdminDailySpecialsTab from '@/components/admin/AdminDailySpecialsTab';
import AdminCustomersTab from '@/components/admin/AdminCustomersTab';
import AdminRolesTab from '@/components/admin/AdminRolesTab';
import AdminInventoryTab from '@/components/admin/AdminInventoryTab';
import AdminSettingsTab from '@/components/admin/AdminSettingsTab';
import AdminAuditTab from '@/components/admin/AdminAuditTab';
import AdminReportsTab from '@/components/admin/AdminReportsTab';
import AdminPOSTab from '@/components/admin/AdminPOSTab';
import AdminCommsTab from '@/components/admin/AdminCommsTab';
import AdminStaffTab from '@/components/admin/AdminStaffTab';
import AdminSuppliersTab from '@/components/admin/AdminSuppliersTab';
import AdminPromotionsTab from '@/components/admin/AdminPromotionsTab';
import AdminDeliveryZonesTab from '@/components/admin/AdminDeliveryZonesTab';
import AdminKDSTab from '@/components/admin/AdminKDSTab';
import MenuItemModal from '@/components/admin/MenuItemModal';
import StoreModal from '@/components/admin/StoreModal';

// Shared types
import type { AdminDashboardState } from '@/components/admin/adminTypes';

type Order = {
  id: string; status: string; total_amount: number;
  delivery_address: string; phone: string; notes: string | null;
  created_at: string; user_id: string;
};
type MenuItem = {
  id: string; name: string; price: number; category_id: string | null;
  is_available: boolean; is_featured: boolean; is_spicy: boolean;
  is_vegetarian: boolean; is_vegan: boolean; is_gluten_free: boolean;
  calories: number | null; rating: number; prep_time: number;
  description: string | null; image_url: string | null;
};
type Category = { id: string; name: string };
type Store = {
  id: string; name: string; address: string; phone: string | null;
  hours: string | null; is_active: boolean; is_flagship: boolean;
  latitude: number | null; longitude: number | null;
};
type DailyStats = {
  totalOrders: number; totalRevenue: number; pendingOrders: number;
  avgOrderValue: number; totalMenuItems: number; totalCustomers: number;
};

export default function AdminDashboard() {
  const { isStaff, roles, loading, userId } = useAdminAuth();
  const isAdmin = isStaff;
  const tabs = allowedTabs(roles);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<DailyStats>({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, avgOrderValue: 0, totalMenuItems: 0, totalCustomers: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !isAdmin) {
      if (userId) toast.error('This account has no staff access.');
      navigate('/staff');
    }
  }, [loading, isAdmin, navigate, userId]);

  useEffect(() => {
    if (tabs.length && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs.join(','), activeTab]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  // Real-time subscription: auto-refresh when new orders come in (cashier payments)
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchOrders(), fetchMenuItems(), fetchCategories(), fetchStores()]);
    setRefreshing(false);
  }, []);

  const fetchStats = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [ordersRes, menuRes, profilesRes] = await Promise.all([
      (supabase as any).from('orders').select('*'),
      (supabase as any).from('menu_items').select('id', { count: 'exact', head: true }),
      (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    const allOrders: Order[] = ordersRes.data || [];
    const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today);
    const totalRevenue = todayOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    setStats({
      totalOrders: todayOrders.length, totalRevenue,
      pendingOrders: allOrders.filter(o => o.status === 'pending').length,
      avgOrderValue: todayOrders.length ? totalRevenue / todayOrders.length : 0,
      totalMenuItems: menuRes.count || 0, totalCustomers: profilesRes.count || 0,
    });
  };

  const fetchOrders = async () => {
    const { data } = await (supabase as any).from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    setOrders(data || []);
  };
  const fetchMenuItems = async () => {
    const { data } = await (supabase as any).from('menu_items').select('*').order('name');
    setMenuItems(data || []);
  };
  const fetchCategories = async () => {
    const { data } = await (supabase as any).from('menu_categories').select('id, name').order('sort_order');
    setCategories(data || []);
  };
  const fetchStores = async () => {
    const { data } = await (supabase as any).from('stores').select('*').order('name');
    setStores(data || []);
  };

  const toggleStoreActive = async (storeId: string, currentActive: boolean) => {
    const { error } = await (supabase as any).from('stores').update({ is_active: !currentActive }).eq('id', storeId);
    if (error) { toast.error('Failed to update store'); return; }
    toast.success(`Store ${!currentActive ? 'activated' : 'deactivated'}`);
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, is_active: !currentActive } : s));
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await (supabase as any).from('orders').update({ status }).eq('id', orderId);
    if (error) { toast.error('Failed to update order'); return; }
    toast.success(`Order updated to ${status}`);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    fetchStats();
  };

  const toggleMenuAvailability = async (itemId: string, available: boolean) => {
    const { error } = await (supabase as any).from('menu_items').update({ is_available: !available }).eq('id', itemId);
    if (error) { toast.error('Failed to update item'); return; }
    toast.success(`Item ${!available ? 'enabled' : 'disabled'}`);
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, is_available: !available } : i));
  };

  const toggleFeatured = async (itemId: string, featured: boolean) => {
    const { error } = await (supabase as any).from('menu_items').update({ is_featured: !featured }).eq('id', itemId);
    if (error) { toast.error('Failed to update'); return; }
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, is_featured: !featured } : i));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'delivered': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const tabTitles: Record<string, string> = {
    overview: 'Overview', orders: 'Orders', pos: 'POS Cashier', menu: 'Menu Items',
    inventory: 'Inventory', specials: 'Daily Specials', stores: 'Stores', kds: 'Kitchen Display',
    customers: 'Customers', staff: 'Staff', comms: 'Communications',
    promotions: 'Promotions', suppliers: 'Suppliers', 'supplier-orders': 'Supplier Orders', 'delivery-zones': 'Delivery Zones',
    reports: 'Reports & Export', roles: 'Role Management', settings: 'Settings', audit: 'Activity Log',
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <AdminOnboarding onComplete={() => {}} />
        <OrderNotifications onNewOrder={fetchAll} />

        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} pendingOrders={stats.pendingOrders} allowed={tabs}
          roleLabel={roles.includes('admin') ? 'Owner' : roles.includes('manager') ? 'Manager' : roles.includes('cashier') ? 'Cashier' : 'Kitchen'} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h2 className="text-lg font-semibold text-foreground">{tabTitles[activeTab] || 'Dashboard'}</h2>
            </div>
            <div className="flex items-center gap-2">
              <AdminNotificationCenter />
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchAll} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </header>

          {/* Stats Row */}
          <div className={`px-4 sm:px-6 pt-4 ${tabs.includes('overview') ? '' : 'hidden'}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {[
                { label: "Today's Orders", value: stats.totalOrders, color: 'text-primary' },
                { label: "Revenue", value: `TSh ${stats.totalRevenue.toLocaleString()}`, color: 'text-green-600' },
                { label: 'Pending', value: stats.pendingOrders, color: 'text-yellow-600' },
                { label: 'Avg Order', value: `TSh ${Math.round(stats.avgOrderValue).toLocaleString()}`, color: 'text-blue-600' },
                { label: 'Menu Items', value: stats.totalMenuItems, color: 'text-purple-600' },
                { label: 'Customers', value: stats.totalCustomers, color: 'text-pink-600' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-lg border border-border p-3"
                >
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <main className="flex-1 px-4 sm:px-6 pb-6">
            {activeTab === 'overview' && (
              <AdminOverviewTab stats={stats} orders={orders} menuItems={menuItems} stores={stores} statusColor={statusColor} onNavigateTab={setActiveTab} />
            )}
            {activeTab === 'orders' && (
              <AdminOrdersTab orders={orders} statusColor={statusColor} updateOrderStatus={updateOrderStatus} />
            )}
            {activeTab === 'menu' && (
              <AdminMenuTab
                menuItems={menuItems}
                onOpenCreate={() => { setEditItem(null); setModalOpen(true); }}
                onOpenEdit={(item) => { setEditItem(item); setModalOpen(true); }}
                onToggleAvailability={toggleMenuAvailability}
                onToggleFeatured={toggleFeatured}
                onRefresh={() => { fetchMenuItems(); fetchStats(); }}
              />
            )}
            {activeTab === 'inventory' && <AdminInventoryTab />}
            {activeTab === 'specials' && <AdminDailySpecialsTab />}
            {activeTab === 'stores' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => { setEditStore(null); setStoreModalOpen(true); }} className="gap-1.5">
                    + Add Store
                  </Button>
                </div>
                {/* Reuse existing store table inline */}
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {['Name', 'Address', 'Phone', 'Hours', 'Flagship', 'Active', 'Edit'].map(h => (
                          <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map(store => (
                        <tr key={store.id} className={`border-t border-border ${!store.is_active ? 'opacity-50' : ''}`}>
                          <td className="p-3 font-medium text-foreground">{store.name}</td>
                          <td className="p-3 text-muted-foreground max-w-[200px] truncate">{store.address}</td>
                          <td className="p-3 text-muted-foreground">{store.phone || '—'}</td>
                          <td className="p-3 text-muted-foreground">{store.hours || '—'}</td>
                          <td className="p-3">{store.is_flagship ? '⭐' : '—'}</td>
                          <td className="p-3">
                            <Button size="sm" variant={store.is_active ? 'default' : 'outline'} className="text-xs h-7"
                              onClick={() => toggleStoreActive(store.id, store.is_active)}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </Button>
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm" onClick={() => { setEditStore(store); setStoreModalOpen(true); }}>✏️</Button>
                          </td>
                        </tr>
                      ))}
                      {stores.length === 0 && (
                        <tr><td colSpan={7} className="text-center text-muted-foreground p-8">No stores yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'customers' && <AdminCustomersTab />}
            {activeTab === 'pos' && <AdminPOSTab />}
            {activeTab === 'staff' && <AdminStaffTab />}
            {activeTab === 'comms' && <AdminCommsTab orders={orders} />}
            {activeTab === 'promotions' && <AdminPromotionsTab />}
            {activeTab === 'suppliers' && <AdminSuppliersTab />}
            {activeTab === 'supplier-orders' && <AdminSupplierOrdersTab />}
            {activeTab === 'delivery-zones' && <AdminDeliveryZonesTab />}
            {activeTab === 'kds' && <AdminKDSTab />}
            {activeTab === 'reports' && <AdminReportsTab orders={orders} />}
            {activeTab === 'roles' && <AdminRolesTab />}
            {activeTab === 'settings' && <AdminSettingsTab />}
            {activeTab === 'audit' && <AdminAuditTab />}
          </main>
        </div>

        <MenuItemModal open={modalOpen} onClose={() => setModalOpen(false)} item={editItem}
          onSaved={() => { fetchMenuItems(); fetchStats(); }} categories={categories} />
        <StoreModal open={storeModalOpen} onClose={() => setStoreModalOpen(false)}
          store={editStore} onSaved={fetchStores} />
      </div>
    </SidebarProvider>
  );
}
