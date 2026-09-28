import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Instagram, Facebook, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="font-heading text-3xl font-bold text-primary mb-4">
              KOOKOOS
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              Bold Tanzanian street food that celebrates flavor, community, and the vibrant spirit of Dar es Salaam.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:text-primary hover:bg-white/10">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-primary hover:bg-white/10">
                <Facebook className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#menu" className="text-white/80 hover:text-primary transition-colors">Our Menu</a></li>
              <li><a href="#locations" className="text-white/80 hover:text-primary transition-colors">Locations</a></li>
              <li><a href="#about" className="text-white/80 hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#careers" className="text-white/80 hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#contact" className="text-white/80 hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Order Info */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Order Info</h3>
            <ul className="space-y-2">
              <li><a href="#delivery" className="text-white/80 hover:text-primary transition-colors">Delivery Areas</a></li>
              <li><a href="#pickup" className="text-white/80 hover:text-primary transition-colors">Pickup Orders</a></li>
              <li><a href="#catering" className="text-white/80 hover:text-primary transition-colors">Catering</a></li>
              <li><a href="#group-orders" className="text-white/80 hover:text-primary transition-colors">Group Orders</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white/80">+255 123 456 789</div>
                  <div className="text-white/60 text-sm">Main Hotline</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white/80">hello@kookoos.co.tz</div>
                  <div className="text-white/60 text-sm">General Inquiries</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white/80">10:00 AM - 11:00 PM</div>
                  <div className="text-white/60 text-sm">Daily Operating Hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/60 text-sm mb-4 md:mb-0">
            © 2024 Kookoos Restaurant. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#privacy" className="text-white/60 hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-white/60 hover:text-primary transition-colors">Terms of Service</a>
            <a href="/staff" className="text-white/60 hover:text-primary transition-colors">Staff Login</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;