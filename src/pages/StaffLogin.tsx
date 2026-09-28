import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChefHat } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { isStaff, loading, userId } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isStaff) navigate('/admin');
  }, [loading, isStaff, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-5 shadow-lg">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-foreground">Kookoos Staff</h1>
          <p className="text-sm text-muted-foreground">Kitchen, cashier and management sign-in</p>
        </div>
        {!loading && userId && !isStaff && (
          <p className="text-sm text-destructive text-center">This account has no staff access. Ask an owner to assign you a role.</p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">Back to website</Link>
      </form>
    </div>
  );
}
