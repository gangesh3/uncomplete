import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Store, Image, Link2, Settings2, Eye, Check, ArrowLeft,
  ArrowRight, Upload, QrCode, Copy, ExternalLink, Power,
} from 'lucide-react';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button, Input, Textarea, Select, Card, Spinner, Badge, Toggle } from '@/components/ui';
import { QRCodeDisplay, generateQRPNG, generateQRSVG } from '@/components/QRCode';
import {
  DEFAULT_BRAND, DEFAULT_PAGE, DEFAULT_SOCIAL, DEFAULT_FEEDBACK,
  THEME_PRESETS, type Cafe, type ThemeName, type BrandConfig,
  type PageConfig, type SocialLinks, type FeedbackConfig,
} from '@/lib/types';
import { resolveThemeTokens, applyThemeToElement, getButtonClass } from '@/lib/theme';
import { slugify, isSlugUnique, uploadCafeImage, isValidUrl, normalizeWhatsApp, downloadFile } from '@/lib/utils';

const STEPS = ['Details', 'Branding', 'Links', 'Content', 'Publish'] as const;

export function CafeWizard() {
  const { cafeId } = useParams<{ cafeId?: string }>();
  const isEditing = !!cafeId;
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [page, setPage] = useState<PageConfig>(DEFAULT_PAGE);
  const [social, setSocial] = useState<SocialLinks>(DEFAULT_SOCIAL);
  const [feedback, setFeedback] = useState<FeedbackConfig>(DEFAULT_FEEDBACK);
  const [isActive, setIsActive] = useState(false);
  const [savedCafe, setSavedCafe] = useState<Cafe | null>(null);

  useEffect(() => {
    if (!isEditing || !cafeId) return;
    (async () => {
      const { data } = await supabase.from('cafes').select('*').eq('id', cafeId).maybeSingle();
      if (data) {
        const c = data as Cafe;
        setName(c.name);
        setSlug(c.slug);
        setDescription(c.description || '');
        setAddress(c.address || '');
        setLogoUrl(c.logo_url);
        setBannerUrl(c.banner_url);
        setBrand(c.brand_config);
        setPage(c.page_config);
        setSocial(c.social_links);
        setFeedback(c.feedback_config);
        setIsActive(c.is_active);
        setSavedCafe(c);
      }
      setLoading(false);
    })();
  }, [cafeId, isEditing]);

  function handleNameChange(val: string) {
    setName(val);
    if (!isEditing) setSlug(slugify(val));
  }

  async function checkSlug(newSlug: string) {
    setSlug(newSlug);
    if (!newSlug) { setSlugError(null); return; }
    if (!/^[a-z0-9-]+$/.test(newSlug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens.');
      return;
    }
    const unique = await isSlugUnique(newSlug, cafeId);
    setSlugError(unique ? null : 'This slug is already taken.');
  }

  async function handleUpload(file: File, type: 'logo' | 'banner') {
    if (!savedCafe && !cafeId) {
      // Need to save café first to get an ID
      return;
    }
    const id = cafeId || savedCafe?.id;
    if (!id) return;
    const url = await uploadCafeImage(file, id, type);
    if (url) {
      if (type === 'logo') setLogoUrl(url);
      else setBannerUrl(url);
    }
  }

  function applyTheme(themeName: ThemeName) {
    setBrand({ ...THEME_PRESETS[themeName], theme: themeName });
  }

  async function saveCafe(publish: boolean): Promise<string | null> {
    setError(null);
    if (!name.trim()) { setError('Café name is required.'); setStep(0); return null; }
    if (!slug.trim()) { setError('URL slug is required.'); setStep(0); return null; }
    if (slugError) { setError(slugError); setStep(0); return null; }

    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      address: address.trim() || null,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      brand_config: brand,
      page_config: page,
      social_links: social,
      feedback_config: feedback,
      is_active: publish,
    };

    let resultId: string | null = null;

    if (isEditing && cafeId) {
      const { data, error: err } = await supabase.from('cafes').update(payload).eq('id', cafeId).select().single();
      if (err) { setError(err.message); setSaving(false); return null; }
      if (data) { setSavedCafe(data as Cafe); resultId = data.id; }
    } else {
      const { data, error: err } = await supabase.from('cafes').insert(payload).select().single();
      if (err) { setError(err.message); setSaving(false); return null; }
      if (data) {
        setSavedCafe(data as Cafe);
        resultId = data.id;
        // Create platform default presets for this café (copy from platform defaults)
        // Only if this is a new café — presets are managed separately
      }
    }

    setSaving(false);
    if (publish) setIsActive(true);
    return resultId;
  }

  async function handlePublish() {
    const id = await saveCafe(true);
    if (id) {
      setShowQR(true);
    }
  }

  async function handleSaveDraft() {
    const id = await saveCafe(false);
    if (id) {
      navigate('/dashboard/cafes');
    }
  }

  if (!isAdmin) {
    return <p className="text-sm text-slate-600">Only platform administrators can create or edit cafés.</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/c/${slug || 'your-cafe'}`;
  const canProceed = step === 0 ? (!!name.trim() && !!slug.trim() && !slugError) : true;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/cafes')} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Edit café' : 'Add new café'}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => {
          const Icon = [Store, Image, Link2, Settings2, Eye][i];
          return (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              {i > 0 && <div className={`w-6 h-px ${i <= step ? 'bg-slate-900' : 'bg-slate-200'}`} />}
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  i === step ? 'bg-slate-900 text-white' : i < step ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Step 0: Details */}
      {step === 0 && (
        <Card className="p-6 space-y-4">
          <Input label="Café name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="BrewBite Café" required />
          <Input
            label="URL slug"
            value={slug}
            onChange={(e) => checkSlug(e.target.value)}
            placeholder="brewbite-cafe"
            error={slugError || undefined}
            hint={`Public page: ${window.location.origin}/c/${slug || '...'}`}
            required
          />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A cozy neighborhood café serving artisanal coffee..." rows={3} />
          <Textarea label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="42 Wellness Street, Indiranagar, Bengaluru" rows={2} />
          <Input label="Welcome headline" value={page.welcomeHeadline} onChange={(e) => setPage({ ...page, welcomeHeadline: e.target.value })} placeholder="Welcome to BrewBite" />
          <Input label="Welcome subtitle" value={page.welcomeSubtitle} onChange={(e) => setPage({ ...page, welcomeSubtitle: e.target.value })} placeholder="Brewed with love, served with a smile" />
        </Card>
      )}

      {/* Step 1: Branding */}
      {step === 1 && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {(['editorial', 'dark', 'fresh'] as ThemeName[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => applyTheme(t)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${brand.theme === t ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="h-12 rounded-lg mb-2" style={{
                      background: THEME_PRESETS[t].backgroundColor,
                      color: THEME_PRESETS[t].primaryColor,
                    }}>
                      <div className="h-full flex items-center justify-center text-xs font-medium" style={{ color: THEME_PRESETS[t].primaryColor }}>
                        {t === 'editorial' ? 'Editorial' : t === 'dark' ? 'Dark' : 'Fresh'}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 capitalize">{t}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Primary color" value={brand.primaryColor} onChange={(v) => setBrand({ ...brand, primaryColor: v })} />
              <ColorInput label="Secondary color" value={brand.secondaryColor} onChange={(v) => setBrand({ ...brand, secondaryColor: v })} />
              <ColorInput label="Background color" value={brand.backgroundColor} onChange={(v) => setBrand({ ...brand, backgroundColor: v })} />
              <ColorInput label="Accent color" value={brand.accentColor} onChange={(v) => setBrand({ ...brand, accentColor: v })} />
            </div>

            <Select label="Button style" value={brand.buttonStyle} onChange={(e) => setBrand({ ...brand, buttonStyle: e.target.value as typeof brand.buttonStyle })}>
              <option value="rounded">Rounded</option>
              <option value="pill">Pill</option>
              <option value="square">Square</option>
            </Select>

            <Select label="Font family" value={brand.fontFamily} onChange={(e) => setBrand({ ...brand, fontFamily: e.target.value })}>
              <option value="'Georgia', 'Times New Roman', serif">Georgia (Serif)</option>
              <option value="'Inter', 'Helvetica', sans-serif">Inter (Sans-serif)</option>
              <option value="'Playfair Display', Georgia, serif">Playfair Display (Elegant Serif)</option>
            </Select>
          </Card>

          {/* Image uploads */}
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                  {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-slate-300" />}
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    <Upload className="w-4 h-4" /> Upload logo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'logo'); }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Banner image</label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                  {bannerUrl ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" /> : <Image className="w-6 h-6 text-slate-300" />}
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    <Upload className="w-4 h-4" /> Upload banner
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'banner'); }}
                  />
                </label>
              </div>
            </div>
            {(!savedCafe && !cafeId) && (
              <p className="text-xs text-amber-600">Save the café first (step 5) to upload images. You can edit them after.</p>
            )}
          </Card>
        </div>
      )}

      {/* Step 2: Links */}
      {step === 2 && (
        <Card className="p-6 space-y-4">
          <UrlInput label="Instagram URL" value={social.instagram || ''} onChange={(v) => setSocial({ ...social, instagram: v })} placeholder="https://instagram.com/yourcafe" />
          <UrlInput label="Facebook URL" value={social.facebook || ''} onChange={(v) => setSocial({ ...social, facebook: v })} placeholder="https://facebook.com/yourcafe" />
          <UrlInput label="WhatsApp number or wa.me link" value={social.whatsapp || ''} onChange={(v) => setSocial({ ...social, whatsapp: v })} placeholder="https://wa.me/919999900001" hint="Enter a phone number or wa.me link. We'll format it automatically." />
          <UrlInput label="Website URL" value={social.website || ''} onChange={(v) => setSocial({ ...social, website: v })} placeholder="https://yourcafe.com" />
          <UrlInput label="Google Maps directions URL" value={social.googleMaps || ''} onChange={(v) => setSocial({ ...social, googleMaps: v })} placeholder="https://maps.google.com/?q=Your+Cafe" />
          <UrlInput label="Google review URL" value={social.googleReview || ''} onChange={(v) => setSocial({ ...social, googleReview: v })} placeholder="https://g.page/r/yourcafe/review" hint="Paste the actual review link from Google Business Profile. This is different from your Maps directions URL." />
          <UrlInput label="Menu URL" value={social.menu || ''} onChange={(v) => setSocial({ ...social, menu: v })} placeholder="https://yourcafe.com/menu" />
        </Card>
      )}

      {/* Step 3: Content */}
      {step === 3 && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <Input label="CTA button label" value={page.ctaLabel} onChange={(e) => setPage({ ...page, ctaLabel: e.target.value })} placeholder="Share Your Experience" />
            <Textarea label="Thank-you message" value={page.thankYouMessage} onChange={(e) => setPage({ ...page, thankYouMessage: e.target.value })} rows={2} />

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-slate-700">Visible sections</p>
              <Toggle checked={page.showSocial} onChange={(v) => setPage({ ...page, showSocial: v })} label="Social buttons" />
              <Toggle checked={page.showFeedback} onChange={(v) => setPage({ ...page, showFeedback: v })} label="Private feedback" />
              <Toggle checked={page.showGoogleReview} onChange={(v) => setPage({ ...page, showGoogleReview: v })} label="Google review section" />
              <Toggle checked={page.showMenu} onChange={(v) => setPage({ ...page, showMenu: v })} label="Menu link" />
              <Toggle checked={page.showDirections} onChange={(v) => setPage({ ...page, showDirections: v })} label="Directions link" />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Feedback categories</p>
              <Button size="sm" variant="outline" onClick={() => setFeedback({ ...feedback, categories: [...feedback.categories, { key: `cat-${Date.now()}`, label: 'New Category' }] })}>
                Add category
              </Button>
            </div>
            <div className="space-y-2">
              {feedback.categories.map((cat, i) => (
                <div key={cat.key} className="flex items-center gap-2">
                  <Input
                    value={cat.label}
                    onChange={(e) => {
                      const cats = [...feedback.categories];
                      cats[i] = { ...cat, label: e.target.value };
                      setFeedback({ ...feedback, categories: cats });
                    }}
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={() => setFeedback({ ...feedback, categories: feedback.categories.filter((c) => c.key !== cat.key) })}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="pt-2 space-y-3">
              <Toggle checked={feedback.showStarRatings} onChange={(v) => setFeedback({ ...feedback, showStarRatings: v })} label="Show star ratings" />
              <Toggle checked={feedback.showTextFeedback} onChange={(v) => setFeedback({ ...feedback, showTextFeedback: v })} label="Show text feedback field" />
            </div>
          </Card>
        </div>
      )}

      {/* Step 4: Preview & Publish */}
      {step === 4 && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Live preview</h3>
              <Badge variant={isActive ? 'success' : 'warning'}>{isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <CafePreview
              name={name || 'Your Café'}
              description={description}
              logoUrl={logoUrl}
              bannerUrl={bannerUrl}
              brand={brand}
              page={page}
              social={social}
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">QR code & public link</h3>
            </div>
            {savedCafe || cafeId ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <QRCodeDisplay url={publicUrl} size={160} />
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-sm text-slate-600 truncate flex-1">{publicUrl}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(publicUrl)}
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<ExternalLink className="w-3.5 h-3.5" />}
                      onClick={() => window.open(publicUrl, '_blank')}
                    >
                      Open page
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Save the café to generate its QR code.</p>
            )}
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handlePublish} loading={saving} size="lg" icon={<Power className="w-4 h-4" />}>
              {isActive ? 'Update & keep published' : 'Save & publish'}
            </Button>
            <Button onClick={handleSaveDraft} variant="outline" size="lg" loading={saving}>
              Save as draft
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed}>
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </div>
    </div>
  );
}

function UrlInput({ label, value, onChange, placeholder, hint, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${error ? 'border-red-400' : 'border-slate-300'}`}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function CafePreview({ name, description, logoUrl, bannerUrl, brand, page, social }: {
  name: string; description: string; logoUrl: string | null; bannerUrl: string | null;
  brand: BrandConfig; page: PageConfig; social: SocialLinks;
}) {
  const previewRef = <div className="" /> as unknown as React.RefObject<HTMLDivElement>;
  const tokens = resolveThemeTokens(brand);

  return (
    <div
      ref={previewRef}
      className="cafe-page rounded-2xl overflow-hidden border"
      style={{
        '--cafe-bg': tokens.bg,
        '--cafe-surface': tokens.surface,
        '--cafe-surface-alt': tokens.surfaceAlt,
        '--cafe-text': tokens.text,
        '--cafe-text-muted': tokens.textMuted,
        '--cafe-text-on-primary': tokens.textOnPrimary,
        '--cafe-primary': tokens.primary,
        '--cafe-secondary': tokens.secondary,
        '--cafe-accent': tokens.accent,
        '--cafe-border': tokens.border,
        '--cafe-font': tokens.fontFamily,
      } as React.CSSProperties}
    >
      <div className="h-32 relative overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: tokens.accent }}>
            <Store className="w-8 h-8 opacity-40" style={{ color: tokens.textOnPrimary }} />
          </div>
        )}
      </div>
      <div className="px-4 pb-4 -mt-8 relative">
        <div className="w-16 h-16 rounded-xl overflow-hidden border-4 cafe-surface flex items-center justify-center mx-auto">
          {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold cafe-primary-text">{name.charAt(0)}</span>}
        </div>
        <h3 className="mt-3 text-lg font-bold text-center" style={{ fontFamily: tokens.fontFamily }}>{name}</h3>
        <p className="text-sm text-center cafe-text-muted">{page.welcomeHeadline}</p>
        {description && <p className="mt-2 text-xs text-center cafe-text-muted">{description}</p>}

        <div className="mt-4 space-y-2">
          {social.instagram && (
            <div className={`flex items-center gap-2 px-3 py-2.5 text-white text-xs font-medium ${getButtonClass(brand.buttonStyle)}`} style={{ background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }}>
              Instagram
            </div>
          )}
          {social.whatsapp && (
            <div className={`flex items-center gap-2 px-3 py-2.5 text-white text-xs font-medium bg-green-500 ${getButtonClass(brand.buttonStyle)}`}>
              WhatsApp
            </div>
          )}
          <div className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium cafe-primary-btn ${getButtonClass(brand.buttonStyle)}`}>
            {page.ctaLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
