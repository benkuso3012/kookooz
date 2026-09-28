import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  BarChart3, ShoppingBag, UtensilsCrossed, Users, MapPin, Tag,
  Settings, Shield, Activity, Package, LogOut, Home, HelpCircle,
  FileSpreadsheet, Monitor, MessageSquare, Truck, UserCog, Gift, MapPinned, Bell, ChefHat,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resetAdminOnboarding } from './AdminOnboarding';

const dashboardItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'pos', label: 'POS Cashier', icon: Monitor },
  { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'specials', label: 'Daily Specials', icon: Tag },
  { id: 'stores', label: 'Stores', icon: MapPin },
  { id: 'kds', label: 'Kitchen Display', icon: ChefHat },
];

const managementItems = [
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'staff', label: 'Staff', icon: UserCog },
  { id: 'comms', label: 'Communications', icon: MessageSquare },
  { id: 'promotions', label: 'Promotions', icon: Gift },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'supplier-orders', label: 'Supplier Orders', icon: Package },
  { id: 'delivery-zones', label: 'Delivery Zones', icon: MapPinned },
];

const systemItems = [
  { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
  { id: 'roles', label: 'Role Management', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit', label: 'Activity Log', icon: Activity },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingOrders?: number;
  allowed?: string[];
  roleLabel?: string;
}

export default function AdminSidebar({ activeTab, onTabChange, pendingOrders = 0, allowed, roleLabel = 'Admin Panel' }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const renderGroup = (label: string, all: typeof dashboardItems) => {
    const items = allowed ? all.filter(i => allowed.includes(i.id)) : all;
    if (items.length === 0) return null;
    return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onTabChange(item.id)}
                isActive={activeTab === item.id}
                tooltip={item.label}
                className="cursor-pointer"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.id === 'orders' && pendingOrders > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrders}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );};

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Kookoos</h1>
              <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup('Dashboard', dashboardItems)}
        {renderGroup('Management', managementItems)}
        {renderGroup('System', systemItems)}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { resetAdminOnboarding(); window.location.reload(); }} tooltip="Restart Tour" className="cursor-pointer">
              <HelpCircle className="w-4 h-4" />
              <span>Help Tour</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate('/')} tooltip="Back to Site" className="cursor-pointer">
              <Home className="w-4 h-4" />
              <span>Back to Site</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sign Out" className="cursor-pointer text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
