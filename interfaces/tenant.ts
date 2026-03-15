// Tenant configuration interface for multitenancy parametrization
// All values can be overridden per-tenant from the API

export interface TenantIdentity {
  companyName: string;
  companyNameShort: string; // e.g. "ZerosTour" (no spaces)
  companyNameLegal: string; // e.g. "Solomillo Inc"
  logoUrl: string | null;
  faviconUrl: string | null;
  tagline: string;
}

export interface TenantColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface TenantThemeVars {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  radius: string;
}

export interface TenantTheme {
  light: TenantThemeVars;
  dark: TenantThemeVars;
  brandColors: TenantColorScale;
  accentColor: string; // for stars, highlights (e.g. yellow-400)
}

export interface TenantTypography {
  bodyFont: string;
  displayFont: string;
}

export interface TenantImages {
  heroBackground: string | null;
  aboutPhoto: string | null;
  routesMap: string | null;
  openGraphImage: string | null;
}

export interface TenantFeature {
  icon: string; // lucide icon name
  title: string;
  description: string;
}

export interface TenantTestimonial {
  name: string;
  comment: string;
  rating: number;
}

export interface TenantRoute {
  label: string;
  duration: string;
}

export interface TenantHeroContent {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface TenantAboutContent {
  title: string;
  paragraphs: string[];
  features: TenantFeature[];
}

export interface TenantCtaContent {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface TenantLandingContent {
  hero: TenantHeroContent;
  about: TenantAboutContent;
  routesTitle: string;
  routesSubtitle: string;
  routes: TenantRoute[];
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonials: TenantTestimonial[];
  cta: TenantCtaContent;
}

export interface TenantContact {
  address: string;
  phone: string;
  email: string;
  bookingsEmail: string;
  schedule: string[];
}

export interface TenantLegal {
  termsText: string;
  cancellationPolicy: string;
}

export interface TenantSeo {
  title: string;
  description: string;
  keywords: string[];
}

export interface TenantConfig {
  code: string;
  publicKey: string | null;
  identity: TenantIdentity;
  theme: TenantTheme;
  typography: TenantTypography;
  images: TenantImages;
  landing: TenantLandingContent;
  contact: TenantContact;
  legal: TenantLegal;
  seo: TenantSeo;
}
