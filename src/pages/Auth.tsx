import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

function safeNext(raw: string | null): string {
  if (!raw) return "/";
  // Only allow same-origin relative paths
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

const Auth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) navigate(nextPath);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) navigate(nextPath);
    });
    return () => subscription.unsubscribe();
  }, [navigate, nextPath]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const fullName = formData.get("full-name") as string;

    if (!email || !password || !fullName) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName } }
    });

    if (error) toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
    else toast({ title: "Success!", description: "Please check your email to confirm your account" });
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: "Sign In Error", description: error.message, variant: "destructive" });
    else toast({ title: "Karibu! 🎉", description: "Welcome back to Kookoos" });
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Check your email", description: "We've sent you a password reset link" });
    setLoading(false);
    setForgotMode(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Brand Header */}
              <div className="text-center mb-8">
                <h1 className="font-heading text-4xl font-bold text-primary mb-2">KOOKOOS</h1>
                <p className="text-muted-foreground">Hapa Kuku Tu! 🍗</p>
              </div>

              <Card className="border-0 shadow-card">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-heading text-2xl">
                    {forgotMode ? "Reset Password" : "Welcome"}
                  </CardTitle>
                  <CardDescription>
                    {forgotMode
                      ? "Enter your email to receive a reset link"
                      : "Sign in or create your account"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {forgotMode ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="your@email.com"
                            className="pl-10"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full font-bold" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setForgotMode(false)}
                      >
                        Back to Sign In
                      </Button>
                    </form>
                  ) : (
                    <Tabs defaultValue="signin" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="signin" className="font-bold">Sign In</TabsTrigger>
                        <TabsTrigger value="signup" className="font-bold">Sign Up</TabsTrigger>
                      </TabsList>

                      <TabsContent value="signin">
                        <form onSubmit={handleSignIn} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signin-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input id="signin-email" name="signin-email" type="email" placeholder="your@email.com" className="pl-10" required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signin-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input id="signin-password" name="signin-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" required />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <button type="button" onClick={() => setForgotMode(true)} className="text-sm text-primary hover:underline">
                              Forgot password?
                            </button>
                          </div>
                          <Button type="submit" className="w-full font-bold group" disabled={loading}>
                            {loading ? "Signing In..." : "Sign In"}
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="signup">
                        <form onSubmit={handleSignUp} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input id="full-name" name="full-name" type="text" placeholder="John Doe" className="pl-10" required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input id="signup-email" name="signup-email" type="email" placeholder="your@email.com" className="pl-10" required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input id="signup-password" name="signup-password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" className="pl-10 pr-10" required minLength={6} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <Button type="submit" className="w-full font-bold group" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Account"}
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
