import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Navigation, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { mapEmbedUrl, openDirections } from "@/lib/storeMap";

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  hours: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  features: string[] | null;
  is_flagship: boolean;
}

const StoreLocator = () => {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await (supabase as any)
        .from("stores")
        .select("id, name, address, city, phone, hours, latitude, longitude, rating, features, is_flagship")
        .eq("is_active", true)
        .order("is_flagship", { ascending: false })
        .order("name");
      setLocations((data as StoreLocation[]) || []);
      setLoading(false);
    };
    fetchLocations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-32 text-center text-muted-foreground">Loading store locations…</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Find a <span className="text-primary">KOOKOOS</span> Near You
            </h1>
            <p className="text-lg text-muted-foreground">
              Visit us at any of our branches across Dar es Salaam — HAPA KUKU TU!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <Card key={location.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-44 w-full bg-muted">
                  <iframe
                    title={`Map of ${location.name}`}
                    src={mapEmbedUrl(location)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="font-heading">{location.name}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold">{Number(location.rating).toFixed(1)}</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{location.address}</p>
                      <p className="text-sm text-muted-foreground">{location.city}</p>
                    </div>
                  </div>

                  {location.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${location.phone}`} className="text-sm hover:text-primary">{location.phone}</a>
                    </div>
                  )}

                  {location.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{location.hours}</span>
                    </div>
                  )}

                  {location.features && location.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {location.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{feature}</Badge>
                      ))}
                    </div>
                  )}

                  <Button onClick={() => openDirections(location)} className="w-full" variant="outline">
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {locations.length === 0 && (
            <div className="text-center py-16">
              <MapPin className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No locations found</h2>
              <p className="text-muted-foreground">We're working on expanding to your area. Check back soon!</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StoreLocator;
