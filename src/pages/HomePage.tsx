import { Link } from 'react-router-dom';
import {
  QrCode, Smartphone, Star, Palette, BarChart3, Zap, Shield,
  ArrowRight, Check, Instagram, MessageCircle, Globe, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { StarRating } from '@/components/StarRating';

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-900">CaféQR</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <Link to="/c/brewbite-cafe" className="hover:text-slate-900 transition-colors">Demo</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link to="/login">
              <Button size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/50 to-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-orange-200/30 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 text-xs font-medium text-slate-700 mb-6">
                <Zap className="w-3.5 h-3.5" />
                One QR code. Every café. Zero code.
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.05] tracking-tight">
                Turn every café visit into a{' '}
                <span className="italic font-serif text-amber-700">conversation</span>.
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-lg">
                CaféQR builds branded QR-code landing pages for cafés and restaurants. Customers scan, share feedback, follow socials, and leave honest Google reviews — all from one beautiful page.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/login">
                  <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                    Get started
                  </Button>
                </Link>
                <Link to="/c/brewbite-cafe">
                  <Button size="lg" variant="outline">
                    See a live demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  No app install
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Works on any phone
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Setup in minutes
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              How QR engagement works
            </h2>
            <p className="mt-4 text-slate-600">
              Three simple steps from scan to insight. No app, no signup for customers.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <StepCard
              num="01"
              icon={<QrCode className="w-6 h-6" />}
              title="Customer scans the QR"
              description="A beautifully branded page loads instantly on their phone — no app install needed."
            />
            <StepCard
              num="02"
              icon={<Smartphone className="w-6 h-6" />}
              title="They engage with your café"
              description="Follow Instagram, chat on WhatsApp, view the menu, share private feedback, or leave a Google review."
            />
            <StepCard
              num="03"
              icon={<BarChart3 className="w-6 h-6" />}
              title="You see everything in one dashboard"
              description="Track feedback, ratings, link clicks, and review activity — all in real time, per café."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Everything a café needs to stay connected
            </h2>
            <p className="mt-4 text-slate-600">
              A complete engagement platform that works for a single café or hundreds.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Palette className="w-5 h-5" />}
              title="Fully branded pages"
              description="Custom logos, banners, colors, fonts, and three premium themes. Every café looks unique."
            />
            <FeatureCard
              icon={<Star className="w-5 h-5" />}
              title="Private feedback"
              description="Five-star ratings by category, randomized feedback presets, and text comments — all private to the café team."
            />
            <FeatureCard
              icon={<MessageCircle className="w-5 h-5" />}
              title="Social & WhatsApp"
              description="Instagram, Facebook, WhatsApp, website, menu, and directions — all one tap away."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Honest Google reviews"
              description="Guide customers to leave genuine Google reviews. No rating manipulation, ever."
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Real-time analytics"
              description="Page views, social clicks, review clicks, and feedback trends — all in one dashboard."
            />
            <FeatureCard
              icon={<QrCode className="w-5 h-5" />}
              title="QR codes & posters"
              description="Download QR as PNG or SVG, print table posters, and copy the public link."
            />
          </div>
        </div>
      </section>

      {/* Multi-café showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                One platform. Unlimited cafés.
              </h2>
              <p className="mt-4 text-slate-600 text-lg">
                Onboard a new café in minutes using the same template. Enter their details, upload their logo, paste their links, choose a theme, and publish. No code. No redeployment.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'Branded pages at /c/brewbite-cafe, /c/tea-o-tale, and more',
                  'Per-café themes, colors, and content',
                  'Per-café feedback presets and categories',
                  'Owner and manager role-based access',
                  'Duplicate café configs in one click',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CafePreviewCard name="BrewBite" theme="editorial" color="#6B4423" />
              <CafePreviewCard name="Tea-O-Tale" theme="fresh" color="#4A7C59" />
              <CafePreviewCard name="Dark Roast" theme="dark" color="#0F172A" />
              <CafePreviewCard name="Bakery 42" theme="editorial" color="#B08968" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-slate-600">
              Start with one café. Scale to hundreds. Pricing can be configured later.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricingCard
              name="Starter"
              price="₹0"
              period="per café / month"
              features={['1 café page', 'Custom branding', 'Private feedback', 'QR code download', 'Basic analytics']}
              cta="Start free"
            />
            <PricingCard
              name="Growth"
              price="₹999"
              period="per café / month"
              features={['Everything in Starter', 'Up to 3 staff accounts', 'Advanced analytics', 'CSV export', 'Custom feedback presets', 'Priority support']}
              cta="Start trial"
              highlighted
            />
            <PricingCard
              name="Platform"
              price="Custom"
              period="for multi-café operators"
              features={['Unlimited cafés', 'White-label option', 'API access', 'Dedicated manager', 'Custom integrations']}
              cta="Contact us"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to engage your café customers?
          </h2>
          <p className="mt-4 text-slate-300 text-lg">
            Sign in to the dashboard to manage cafés, or explore a live demo first.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login">
              <Button size="lg" variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
                Go to dashboard
              </Button>
            </Link>
            <Link to="/c/brewbite-cafe">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                Explore demo café
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              <span className="font-medium text-white">CaféQR</span>
            </div>
            <p className="text-sm">Built for café owners who care about their customers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative w-64 h-[520px] bg-slate-900 rounded-[2.5rem] shadow-2xl border-[6px] border-slate-800 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl z-10" />
      <div className="h-full overflow-hidden bg-[#FAF5F0]">
        <div className="h-32 bg-gradient-to-br from-amber-700 to-amber-900 relative">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-amber-800">B</span>
          </div>
        </div>
        <div className="pt-10 px-4 text-center">
          <h3 className="font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>BrewBite Café</h3>
          <p className="text-xs text-slate-500 mt-1">Welcome to BrewBite</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-xs font-medium" style={{ background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }}>
              <Instagram className="w-4 h-4" /> Follow on Instagram
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-xs font-medium bg-green-500">
              <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-xs font-medium bg-amber-800">
              <Star className="w-4 h-4 fill-current" /> Share Your Experience
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <StarRating value={5} readOnly size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ num, icon, title, description }: { num: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <div className="absolute top-4 right-4 text-3xl font-bold text-slate-100">{num}</div>
      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function CafePreviewCard({ name, theme, color }: { name: string; theme: string; color: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-20 flex items-center justify-center" style={{ background: color }}>
        <span className="text-white font-bold text-lg">{name.charAt(0)}</span>
      </div>
      <div className="p-3 bg-white">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500 capitalize">{theme} theme</p>
      </div>
    </div>
  );
}

function PricingCard({
  name, price, period, features, cta, highlighted,
}: {
  name: string; price: string; period: string; features: string[]; cta: string; highlighted?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 border-2 ${highlighted ? 'border-slate-900 bg-white shadow-lg' : 'border-slate-200 bg-white'}`}>
      {highlighted && (
        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-medium mb-3">
          Most popular
        </span>
      )}
      <h3 className="font-semibold text-slate-900 text-lg">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">{price}</span>
        <span className="text-xs text-slate-500">{period}</span>
      </div>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link to="/login" className="block mt-6">
        <Button fullWidth variant={highlighted ? 'primary' : 'outline'}>{cta}</Button>
      </Link>
    </div>
  );
}
