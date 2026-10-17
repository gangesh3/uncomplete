import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Instagram, Facebook, MessageCircle, Globe, MapPin, Utensils, Star,
  Copy, Check, ExternalLink, AlertCircle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Cafe, FeedbackPreset } from '@/lib/types';
import { resolveThemeTokens, applyThemeToElement, getButtonClass } from '@/lib/theme';
import { pickRandom, normalizeWhatsApp } from '@/lib/utils';
import { StarRating } from '@/components/StarRating';
import { Spinner, EmptyState } from '@/components/ui';

export function CafePage() {
  const { slug } = useParams<{ slug: string }>();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [presets, setPresets] = useState<FeedbackPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const loggedViewRef = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    loggedViewRef.current = false;

    (async () => {
      const { data, error: queryError } = await supabase
        .from('cafes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (queryError) {
        setError('Something went wrong loading this page.');
        setLoading(false);
        return;
      }
      if (!data) {
        setError('not-found');
        setLoading(false);
        return;
      }
      if (!data.is_active) {
        setError('inactive');
        setLoading(false);
        return;
      }

      setCafe(data as Cafe);

      // Load presets: platform defaults + café-specific
      const { data: presetData } = await supabase
        .from('feedback_presets')
        .select('*')
        .or(`cafe_id.is.null,cafe_id.eq.${data.id}`)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (presetData) setPresets(presetData as FeedbackPreset[]);

      setLoading(false);
    })();
  }, [slug]);

  // Log page view once
  useEffect(() => {
    if (cafe && !loggedViewRef.current) {
      loggedViewRef.current = true;
      supabase.from('engagement_events').insert({
        cafe_id: cafe.id,
        event_type: 'page_view',
      }).then(() => {});
    }
  }, [cafe]);

  // Apply theme
  useEffect(() => {
    if (cafe && pageRef.current) {
      const tokens = resolveThemeTokens(cafe.brand_config);
      applyThemeToElement(pageRef.current, tokens);
    }
  }, [cafe]);

  const logEvent = useCallback((eventType: string, section?: string) => {
    if (!cafe) return;
    supabase.from('engagement_events').insert({
      cafe_id: cafe.id,
      event_type: eventType,
      section,
    }).then(() => {});
  }, [cafe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900">Café not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This café page doesn't exist. Check the link and try again.
          </p>
          <Link to="/" className="inline-block mt-4 text-sm font-medium text-slate-900 underline">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  if (error === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900">This page is temporarily unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">
            The café is currently not accepting feedback. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  if (error || !cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-sm text-slate-600">{error || 'Unable to load this page.'}</p>
        </div>
      </div>
    );
  }

  const btnClass = getButtonClass(cafe.brand_config.buttonStyle);
  const pageConfig = cafe.page_config;
  const social = cafe.social_links;
  const feedbackConfig = cafe.feedback_config;
  const isPreview = !user;

  return (
    <div ref={pageRef} className="cafe-page min-h-screen pb-12">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {cafe.banner_url ? (
          <img src={cafe.banner_url} alt={cafe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full cafe-accent-bg flex items-center justify-center">
            <Utensils className="w-12 h-12 opacity-40" style={{ color: 'var(--cafe-text-on-primary)' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Identity */}
      <div className="max-w-lg mx-auto px-4 -mt-12 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 shadow-lg cafe-surface flex items-center justify-center">
            {cafe.logo_url ? (
              <img src={cafe.logo_url} alt={cafe.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold cafe-primary-text">
                {cafe.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold" style={{ fontFamily: 'var(--cafe-font)' }}>
            {cafe.name}
          </h1>
          <p className="mt-1 text-base cafe-text-muted">
            {pageConfig.welcomeHeadline}
          </p>
          {pageConfig.welcomeSubtitle && (
            <p className="mt-1 text-sm cafe-text-muted max-w-sm">{pageConfig.welcomeSubtitle}</p>
          )}
          {cafe.description && (
            <p className="mt-3 text-sm leading-relaxed cafe-text-muted">{cafe.description}</p>
          )}
        </div>

        {/* Social Buttons */}
        {pageConfig.showSocial && (
          <div className="mt-6 space-y-2.5">
            {social.instagram && (
              <SocialButton
                href={social.instagram}
                icon={<Instagram className="w-5 h-5" />}
                label="Follow on Instagram"
                btnClass={btnClass}
                onClick={() => logEvent('instagram_click', 'social')}
                gradient="linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)"
              />
            )}
            {social.facebook && (
              <SocialButton
                href={social.facebook}
                icon={<Facebook className="w-5 h-5" />}
                label="Follow on Facebook"
                btnClass={btnClass}
                onClick={() => logEvent('facebook_click', 'social')}
                bg="#1877F2"
              />
            )}
            {social.whatsapp && (
              <SocialButton
                href={normalizeWhatsApp(social.whatsapp)}
                icon={<MessageCircle className="w-5 h-5" />}
                label="Chat on WhatsApp"
                btnClass={btnClass}
                onClick={() => logEvent('whatsapp_click', 'social')}
                bg="#25D366"
              />
            )}
            {social.website && (
              <SocialButton
                href={social.website}
                icon={<Globe className="w-5 h-5" />}
                label="Visit our Website"
                btnClass={btnClass}
                onClick={() => logEvent('website_click', 'social')}
              />
            )}
            {pageConfig.showMenu && social.menu && (
              <SocialButton
                href={social.menu}
                icon={<Utensils className="w-5 h-5" />}
                label="View our Menu"
                btnClass={btnClass}
                onClick={() => logEvent('menu_click', 'social')}
              />
            )}
            {pageConfig.showDirections && social.googleMaps && (
              <SocialButton
                href={social.googleMaps}
                icon={<MapPin className="w-5 h-5" />}
                label="Get Directions"
                btnClass={btnClass}
                onClick={() => logEvent('directions_click', 'social')}
              />
            )}
          </div>
        )}

        {/* Address */}
        {cafe.address && (
          <div className="mt-4 flex items-start gap-2 text-sm cafe-text-muted">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{cafe.address}</span>
          </div>
        )}

        {/* Private Feedback Section */}
        {pageConfig.showFeedback && (
          <FeedbackSection
            cafe={cafe}
            presets={presets}
            btnClass={btnClass}
            feedbackConfig={feedbackConfig}
            pageConfig={pageConfig}
          />
        )}

        {/* Google Review Section */}
        {pageConfig.showGoogleReview && social.googleReview && (
          <GoogleReviewSection
            cafe={cafe}
            reviewUrl={social.googleReview}
            btnClass={btnClass}
            onOpenReview={() => logEvent('google_review_click', 'review')}
          />
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t cafe-border text-center">
          <p className="text-xs cafe-text-muted">
            Powered by{' '}
            <Link to="/" className="font-medium underline">
              CaféQR
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

interface SocialButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  btnClass: string;
  onClick: () => void;
  gradient?: string;
  bg?: string;
}

function SocialButton({ href, icon, label, btnClass, onClick, gradient, bg }: SocialButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3.5 text-white font-medium text-sm transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 ${btnClass}`}
      style={gradient ? { background: gradient } : bg ? { background: bg } : { background: 'var(--cafe-primary)' }}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <ExternalLink className="w-4 h-4 opacity-70" />
    </a>
  );
}

function FeedbackSection({
  cafe, presets, btnClass, feedbackConfig, pageConfig,
}: {
  cafe: Cafe;
  presets: FeedbackPreset[];
  btnClass: string;
  feedbackConfig: Cafe['feedback_config'];
  pageConfig: Cafe['page_config'];
}) {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [randomPresets, setRandomPresets] = useState<FeedbackPreset[]>([]);

  // Pick 5 random presets on mount
  useEffect(() => {
    if (presets.length > 0) {
      setRandomPresets(pickRandom(presets, Math.min(5, presets.length)));
    }
  }, [presets]);

  function togglePreset(text: string) {
    setSelectedPresets((prev) =>
      prev.includes(text) ? prev.filter((p) => p !== text) : [...prev, text]
    );
  }

  async function handleSubmit() {
    if (selectedPresets.length === 0 && Object.keys(ratings).length === 0 && !feedbackText.trim()) {
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('feedback_submissions').insert({
      cafe_id: cafe.id,
      food_rating: ratings.food ?? null,
      service_rating: ratings.service ?? null,
      ambience_rating: ratings.ambience ?? null,
      cleanliness_rating: ratings.cleanliness ?? null,
      overall_rating: ratings.overall ?? null,
      private_feedback_text: feedbackText.trim() || null,
      selected_feedback_tags: selectedPresets,
    });

    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 cafe-surface border rounded-2xl p-6 text-center animate-scale-in">
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'var(--cafe-primary)' }}>
          <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--cafe-text-on-primary)' }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--cafe-font)' }}>
          {pageConfig.thankYouMessage}
        </h3>
        <p className="mt-2 text-sm cafe-text-muted">
          Your feedback has been shared privately with the café team.
        </p>
      </div>
    );
  }

  const fewerThanFive = randomPresets.length < 5 && presets.length < 5;

  return (
    <div className="mt-8 cafe-surface border rounded-2xl p-5 animate-fade-in-up">
      <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--cafe-font)' }}>
        {pageConfig.ctaLabel}
      </h2>
      <p className="mt-1 text-sm cafe-text-muted">
        Tap what matches your visit. Your feedback goes directly to the café team.
      </p>

      {/* Preset cards */}
      <div className="mt-4 space-y-2.5">
        {randomPresets.length === 0 && (
          <p className="text-sm cafe-text-muted py-4 text-center">
            Feedback options are being set up. Please check back soon.
          </p>
        )}
        {randomPresets.map((preset) => {
          const selected = selectedPresets.includes(preset.text);
          return (
            <button
              key={preset.id}
              onClick={() => togglePreset(preset.text)}
              className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium border transition-all duration-150 ${btnClass} ${
                selected
                  ? 'cafe-primary-bg border-transparent'
                  : 'cafe-surface-alt cafe-border hover:border-current'
              }`}
              style={selected ? { color: 'var(--cafe-text-on-primary)' } : {}}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'border-transparent' : 'cafe-border'}`}>
                {selected && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="flex-1">{preset.text}</span>
              {preset.short_label && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${selected ? 'bg-white/20' : 'cafe-surface cafe-border border'}`}>
                  {preset.short_label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {fewerThanFive && presets.length > 0 && (
        <p className="mt-3 text-xs cafe-text-muted italic">
          More feedback options coming soon.
        </p>
      )}

      {/* Star ratings toggle */}
      {feedbackConfig.showStarRatings && (
        <div className="mt-4">
          <button
            onClick={() => setShowRatings(!showRatings)}
            className="flex items-center gap-1 text-sm font-medium cafe-primary-text"
          >
            Rate by category
            <ChevronDown className={`w-4 h-4 transition-transform ${showRatings ? 'rotate-180' : ''}`} />
          </button>
          {showRatings && (
            <div className="mt-3 space-y-3 animate-fade-in">
              {feedbackConfig.categories.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between">
                  <span className="text-sm cafe-text-muted">{cat.label}</span>
                  <StarRating
                    value={ratings[cat.key] || 0}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [cat.key]: v }))}
                    size="sm"
                    color="var(--cafe-primary)"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text feedback */}
      {feedbackConfig.showTextFeedback && (
        <div className="mt-4">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Add a comment (optional)..."
            rows={3}
            className={`w-full px-3.5 py-2.5 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 cafe-surface cafe-border ${btnClass}`}
            style={{ borderColor: 'var(--cafe-border)', background: 'var(--cafe-surface)' }}
          />
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || (selectedPresets.length === 0 && Object.keys(ratings).length === 0 && !feedbackText.trim())}
        className={`mt-4 flex items-center justify-center gap-2 w-full px-4 py-3.5 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cafe-primary-btn ${btnClass}`}
      >
        {submitting ? <Spinner size="sm" /> : <Star className="w-4 h-4" />}
        Submit Feedback
      </button>
    </div>
  );
}

function GoogleReviewSection({
  cafe, reviewUrl, btnClass, onOpenReview,
}: {
  cafe: Cafe;
  reviewUrl: string;
  btnClass: string;
  onOpenReview: () => void;
}) {
  const [showHelper, setShowHelper] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function handleCopyAndOpen() {
    if (!draft.trim()) return;
    setCopyError(null);
    let success = false;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(draft);
        success = true;
      }
    } catch {
      success = false;
    }

    // Fallback for browsers without clipboard API
    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = draft;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        success = true;
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      onOpenReview();
      window.open(reviewUrl, '_blank', 'noopener,noreferrer');
    } else {
      setCopyError('Unable to copy automatically. Please copy your text manually using the button below, then open the Google review page.');
    }
  }

  function handleManualCopy() {
    if (!draft.trim()) return;
    const textarea = document.createElement('textarea');
    textarea.value = draft;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopyError('Copy failed. Please select the text and copy manually.');
    }
    document.body.removeChild(textarea);
  }

  return (
    <div className="mt-6 cafe-surface border rounded-2xl p-5 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--cafe-accent)' }}>
          <Star className="w-5 h-5 fill-current" style={{ color: 'var(--cafe-primary)' }} />
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--cafe-font)' }}>
            Leave an honest Google review
          </h2>
          <p className="mt-1 text-sm cafe-text-muted">
            Share your genuine experience publicly on Google. Your honest review helps others discover {cafe.name}.
          </p>
        </div>
      </div>

      {/* Direct Google review button */}
      <a
        href={reviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpenReview}
        className={`mt-4 flex items-center justify-center gap-2 w-full px-4 py-3.5 font-medium text-sm bg-white border-2 transition-all hover:shadow-md ${btnClass}`}
        style={{ borderColor: 'var(--cafe-primary)', color: 'var(--cafe-primary)' }}
      >
        <Star className="w-4 h-4 fill-current" />
        Write my own Google review
        <ExternalLink className="w-4 h-4" />
      </a>

      {/* Optional review helper toggle */}
      <button
        onClick={() => setShowHelper(!showHelper)}
        className="mt-3 flex items-center gap-1 text-xs cafe-text-muted hover:underline"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHelper ? 'rotate-180' : ''}`} />
        Need help writing your review? (optional)
      </button>

      {showHelper && (
        <div className="mt-3 space-y-3 animate-fade-in">
          <div className="rounded-xl p-3 cafe-surface-alt border cafe-border">
            <p className="text-xs cafe-text-muted mb-2">
              Write your review below based on your genuine experience. You can edit it freely. Copying a draft is not the same as submitting a Google review — you will paste and submit it yourself on Google.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Write about your experience at ${cafe.name} in your own words...`}
              rows={4}
              className="w-full px-3 py-2.5 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 cafe-surface"
              style={{ borderColor: 'var(--cafe-border)', background: 'var(--cafe-surface)' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopyAndOpen}
              disabled={!draft.trim()}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 cafe-primary-btn ${btnClass}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied! Opening Google...' : 'Copy my draft & open Google'}
            </button>

            <button
              onClick={handleManualCopy}
              disabled={!draft.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium cafe-text-muted hover:underline disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy draft only (if copy above didn't work)
            </button>
          </div>

          {copyError && (
            <div className="flex items-start gap-2 rounded-lg p-3 text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{copyError}</span>
            </div>
          )}

          <p className="text-xs cafe-text-muted italic">
            Note: We cannot fill in the review on Google for you. You must paste your text and submit it yourself.
          </p>
        </div>
      )}
    </div>
  );
}
