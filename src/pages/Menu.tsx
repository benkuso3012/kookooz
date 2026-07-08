import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, ShoppingBag, Plus, Minus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMenuItemImage } from "@/lib/menuImages";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_featured: boolean;
  is_spicy: boolean;
  rating?: number;
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
  sort_order?: number;
  display_order?: number;
};


const Menu = () => {
  const { toast } = useToast();
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [user, setUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadMenu = async () => {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('menu_items').select('*').eq('is_available', true).order('name'),
        supabase.from('menu_categories').select('*').order('display_order'),
      ]);
      setMenuItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    };
    loadMenu();
  }, []);

  const getBadgeText = (item: MenuItem) => {
    if (item.is_featured) return "SIGNATURE";
    if (item.is_spicy) return "SPICY";
    return null;
  };

  const addToCart = (itemId: string, itemName: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    toast({
      title: "Added to cart!",
      description: `${itemName} has been added to your cart.`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const proceedToCheckout = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place an order",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (getTotalItems() === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart first",
        variant: "destructive",
      });
      return;
    }

    const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
      const item = menuItems.find(i => i.id === itemId);
      return {
        id: itemId,
        name: item?.name || '',
        price: item?.price || 0,
        quantity
      };
    }).filter(item => item.quantity > 0);

    navigate("/checkout", { state: { cartItems } });
  };

  const groupedItems = categories.map(cat => ({
    category: cat,
    items: menuItems.filter(item => item.category_id === cat.id)
  })).filter(group => group.items.length > 0);

  // Add uncategorized items
  const uncategorized = menuItems.filter(item => !item.category_id);
  if (uncategorized.length > 0) {
    groupedItems.push({
      category: { id: 'uncategorized', name: 'Other Items', sort_order: 999 },
      items: uncategorized
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-primary border-primary">
              FULL MENU
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Taste the <span className="text-primary">Bold</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our complete menu of bold Tanzanian flavors and street food favorites.
            </p>
          </div>

          {groupedItems.map((group) => (
            <div key={group.category.id} className="mb-16">
              <h2 className="font-heading text-3xl font-bold text-foreground mb-8 text-center">
                {group.category.name}
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.items.map((item) => {
                  const badge = getBadgeText(item);
                  return (
                    <Card 
                      key={item.id} 
                      className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-2 border-0 shadow-card overflow-hidden"
                    >
                      <div className="relative overflow-hidden">
                        <img 
                          src={getMenuItemImage(item.name, item.image_url)} 
                          alt={item.name}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {badge && (
                          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold">
                            {badge}
                          </Badge>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold">{Number(item.rating).toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <CardContent className="p-6">
                        <h3 className="font-heading text-xl font-bold mb-2">{item.name}</h3>
                        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                          {item.description || 'Delicious menu item'}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-heading text-2xl font-bold text-primary">
                            TSh {Number(item.price).toLocaleString()}
                          </span>
                        </div>

                        {cart[item.id] ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-bold text-lg">{cart[item.id]}</span>
                              <Button 
                                size="sm"
                                onClick={() => addToCart(item.id, item.name)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 font-bold group"
                            onClick={() => addToCart(item.id, item.name)}
                          >
                            ADD TO CART
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {groupedItems.length === 0 && (
            <p className="text-center text-muted-foreground py-16">No menu items available yet.</p>
          )}
        </div>
      </main>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 shadow-glow rounded-full px-6 py-6"
            onClick={proceedToCheckout}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Checkout ({getTotalItems()})
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Menu;