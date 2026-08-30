import { designTokens, cn, type DesignTokens } from '@campus-os/ui-kit';

export { designTokens, cn };
export type { DesignTokens };

export function getSemanticColor(name: keyof typeof designTokens.colors): any {
  return designTokens.colors[name];
}
