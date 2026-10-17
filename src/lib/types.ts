export type ThemeName = 'editorial' | 'dark' | 'fresh';
export type ButtonStyle = 'rounded' | 'pill' | 'square';
export type MemberRole = 'admin' | 'owner' | 'manager';

export interface BrandConfig {
  theme: ThemeName;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  accentColor: string;
  fontFamily: string;
  buttonStyle: ButtonStyle;
}

export interface PageConfig {
  welcomeHeadline: string;
  welcomeSubtitle: string;
  ctaLabel: string;
  thankYouMessage: string;
  showSocial: boolean;
  showFeedback: boolean;
  showGoogleReview: boolean;
  showMenu: boolean;
  showDirections: boolean;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  website?: string;
  googleMaps?: string;
  googleReview?: string;
  menu?: string;
}

export interface FeedbackCategory {
  key: string;
  label: string;
}

export interface FeedbackConfig {
  categories: FeedbackCategory[];
  showStarRatings: boolean;
  showTextFeedback: boolean;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  logo_url: string | null;
  banner_url: string | null;
  brand_config: BrandConfig;
  page_config: PageConfig;
  social_links: SocialLinks;
  feedback_config: FeedbackConfig;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CafeMember {
  id: string;
  cafe_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface FeedbackSubmission {
  id: string;
  cafe_id: string;
  food_rating: number | null;
  service_rating: number | null;
  ambience_rating: number | null;
  cleanliness_rating: number | null;
  overall_rating: number | null;
  private_feedback_text: string | null;
  selected_feedback_tags: string[];
  created_at: string;
}

export interface EngagementEvent {
  id: string;
  cafe_id: string;
  event_type: string;
  section: string | null;
  created_at: string;
}

export interface FeedbackPreset {
  id: string;
  cafe_id: string | null;
  text: string;
  short_label: string | null;
  category: string;
  is_active: boolean;
  display_order: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  theme: 'editorial',
  primaryColor: '#6B4423',
  secondaryColor: '#B08968',
  backgroundColor: '#FAF5F0',
  accentColor: '#D4A574',
  fontFamily: 'Georgia, serif',
  buttonStyle: 'rounded',
};

export const DEFAULT_PAGE: PageConfig = {
  welcomeHeadline: 'Welcome',
  welcomeSubtitle: 'We would love to hear about your experience',
  ctaLabel: 'Share Your Experience',
  thankYouMessage: 'Thank you for your feedback! We truly appreciate you taking the time to share your experience.',
  showSocial: true,
  showFeedback: true,
  showGoogleReview: true,
  showMenu: true,
  showDirections: true,
};

export const DEFAULT_SOCIAL: SocialLinks = {};

export const DEFAULT_FEEDBACK: FeedbackConfig = {
  categories: [
    { key: 'food', label: 'Food Quality' },
    { key: 'service', label: 'Service' },
    { key: 'ambience', label: 'Ambience' },
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'overall', label: 'Overall Experience' },
  ],
  showStarRatings: true,
  showTextFeedback: true,
};

export const THEME_PRESETS: Record<ThemeName, BrandConfig> = {
  editorial: {
    theme: 'editorial',
    primaryColor: '#6B4423',
    secondaryColor: '#B08968',
    backgroundColor: '#FAF5F0',
    accentColor: '#D4A574',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    buttonStyle: 'rounded',
  },
  dark: {
    theme: 'dark',
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    backgroundColor: '#0F172A',
    accentColor: '#22D3EE',
    fontFamily: "'Inter', 'Helvetica', sans-serif",
    buttonStyle: 'pill',
  },
  fresh: {
    theme: 'fresh',
    primaryColor: '#4A7C59',
    secondaryColor: '#8FBC8F',
    backgroundColor: '#F5F3EC',
    accentColor: '#C1D7AE',
    fontFamily: "'Inter', 'Helvetica', sans-serif",
    buttonStyle: 'pill',
  },
};
