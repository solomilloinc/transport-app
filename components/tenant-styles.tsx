'use client';

import { useTenant } from '@/contexts/TenantContext';

/**
 * Injects tenant brand colors as CSS custom properties on :root.
 * These map to the `brand-*` utility classes defined in tailwind.config.ts.
 */
export function TenantStyles() {
  const { theme } = useTenant();
  const b = theme.brandColors;

  const css = `
:root {
  --brand-50: ${b[50]};
  --brand-100: ${b[100]};
  --brand-200: ${b[200]};
  --brand-300: ${b[300]};
  --brand-400: ${b[400]};
  --brand-500: ${b[500]};
  --brand-600: ${b[600]};
  --brand-700: ${b[700]};
  --brand-800: ${b[800]};
  --brand-900: ${b[900]};
  --brand-950: ${b[950]};
  --brand-accent: ${theme.accentColor};
  --primary: ${theme.light.primary};
  --primary-foreground: ${theme.light.primaryForeground};
  --ring: ${theme.light.ring};
  --radius: ${theme.light.radius};
}
.dark {
  --primary: ${theme.dark.primary};
  --primary-foreground: ${theme.dark.primaryForeground};
  --ring: ${theme.dark.ring};
}
`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
