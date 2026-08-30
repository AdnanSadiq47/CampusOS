/**
 * CAMPUSOS DESIGN SYSTEM — MASTER COMPONENT & STANDARD REGISTRY
 *
 * Defines the consolidated logical catalog of UI standards across all 26 categories.
 * Each item has truthful status (LIVE, PLANNED, LEGACY, DEPRECATED),
 * token bindings, searchable aliases for merged synonyms, accurate consumer tracking,
 * and isolated preview mapping.
 */

export type ComponentStatus = 'LIVE' | 'PLANNED' | 'LEGACY' | 'DEPRECATED';

export interface CatalogItem {
  id: string;
  displayName: string;
  canonicalName: string;
  category: string;
  categoryNumber: string;
  description: string;
  status: ComponentStatus;
  sharedSource: string;
  tokenSource: string;
  aliases: string[];
  variants: string[];
  states: string[];
  usedIn: string[];
  previewType: string;
  overrideSupport: {
    globalDefault: boolean;
    moduleVariant: boolean;
    pageVariant: boolean;
    explicitException: boolean;
  };
}

export const DESIGN_SYSTEM_CATEGORIES = [
  "01. Foundation / Global Theme",
  "02. Main Application Layout",
  "03. Page Header",
  "04. Tabs & Navigation",
  "05. Cards & Summary",
  "06. Tables",
  "07. Row Actions",
  "08. Connected Units / Relationships",
  "09. Search / Filters / Pagination",
  "10. Buttons",
  "11. Forms — Structure",
  "12. Form Controls",
  "13. Files / Images",
  "14. Modals / Popups / Overlays",
  "15. View Details",
  "16. Status / Badges / Tags",
  "17. Feedback / Messages",
  "18. Loading / Empty / Error States",
  "19. Hierarchy",
  "20. Notifications",
  "21. Audit / History",
  "22. Workflow / Progress",
  "23. Calendar / Scheduling",
  "24. Dashboard / Reporting",
  "25. Help / Utility",
  "26. Advanced / Future ERP Components"
];

export const COMPONENT_REGISTRY: CatalogItem[] = [
  {
    "id": "std-01-campustheme",
    "displayName": "Campus Theme",
    "canonicalName": "CampusTheme",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Root CSS custom properties, dark/light mode wrapper, and global typography resets.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens",
    "aliases": [
      "Theme",
      "GlobalTheme",
      "RootTheme"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "CampusTheme",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-colortokens",
    "displayName": "Color Tokens",
    "canonicalName": "ColorTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Complete centralized semantic color palette across all brand, neutral, and state scales.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors",
    "aliases": [
      "Colors",
      "Palette",
      "ColorPalette",
      "SemanticColors"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ColorTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-primarycolortoken",
    "displayName": "Primary Color Token",
    "canonicalName": "PrimaryColorToken",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Core Indigo brand token scale (50-950) with hover, active, and focus states.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "PrimaryColor",
      "BrandColor",
      "IndigoScale",
      "PrimaryBrand"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PrimaryColorToken",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-secondarycolortoken",
    "displayName": "Secondary Color Token",
    "canonicalName": "SecondaryColorToken",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Slate secondary neutral token for subtle backgrounds and secondary components.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.secondary",
    "aliases": [
      "SecondaryColor",
      "SlateScale",
      "NeutralScale"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SecondaryColorToken",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-accentcolortokens",
    "displayName": "Accent Color Tokens",
    "canonicalName": "AccentColorTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Cyan, Violet, and Sky accents for counters, badges, and highlights.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.accent",
    "aliases": [
      "AccentColors",
      "CyanAccent",
      "VioletAccent",
      "SkyAccent"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AccentColorTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-pagebackground",
    "displayName": "Page Background",
    "canonicalName": "PageBackground",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Page canvas (#f8fafc) and container background tokens.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.pageBackground",
    "aliases": [
      "CanvasBackground",
      "PageBg",
      "BodyBackground"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PageBackground",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-surfacetokens",
    "displayName": "Surface Tokens",
    "canonicalName": "SurfaceTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Surface container background tokens for cards, sidebars, and modals.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.surface",
    "aliases": [
      "SurfaceColor",
      "CardBackground",
      "ContainerBackground"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SurfaceTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-textcolortokens",
    "displayName": "Text Color Tokens",
    "canonicalName": "TextColorTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Text contrast hierarchy: primary (slate-900), secondary (slate-600), muted (slate-400).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.textPrimary",
    "aliases": [
      "TextColors",
      "FontColors",
      "ContrastHierarchy"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TextColorTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-bordercolortokens",
    "displayName": "Border Color Tokens",
    "canonicalName": "BorderColorTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Border colors: standard border, muted separator, and focus outline.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "BorderColors",
      "SeparatorColor",
      "StrokeColor"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "BorderColorTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-statuscolortokens",
    "displayName": "Status Color Tokens",
    "canonicalName": "StatusColorTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Semantic state colors: Success (Emerald), Danger (Rose), Warning (Amber), Info (Blue).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.success",
    "aliases": [
      "StateColors",
      "SuccessColor",
      "DangerColor",
      "WarningColor",
      "InfoColor"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "StatusColorTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-typographytokens",
    "displayName": "Typography Tokens",
    "canonicalName": "TypographyTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Typography scale (xs to 3xl), font weights (400 to 800), and presets.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.typography",
    "aliases": [
      "Typography",
      "FontScale",
      "FontSize",
      "FontWeight",
      "TypePresets"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TypographyTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-spacingtokens",
    "displayName": "Spacing Tokens",
    "canonicalName": "SpacingTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Spacing scale (0.5 to 16), page padding, section gap, card padding, and form gaps.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.spacing",
    "aliases": [
      "Spacing",
      "PaddingScale",
      "MarginScale",
      "Gaps"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SpacingTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-radiustokens",
    "displayName": "Radius Tokens",
    "canonicalName": "RadiusTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Corner radii: xs (4px), sm (6px), md (8px), lg (12px), xl (16px), 2xl (24px), pill (9999px).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.radius",
    "aliases": [
      "BorderRadius",
      "RoundedCorners",
      "CornerRadius",
      "Radii"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "RadiusTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-shadowtokens",
    "displayName": "Shadow Tokens",
    "canonicalName": "ShadowTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Elevation depths: card, cardHover, dropdown, popover, modal, floatingAction.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.shadows",
    "aliases": [
      "Elevation",
      "BoxShadow",
      "DepthScale",
      "Shadows"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ShadowTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-bordertokens",
    "displayName": "Border Tokens",
    "canonicalName": "BorderTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Border width tokens: thin (1px), medium (2px), thick (3px) with border-solid style.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "BorderWidth",
      "StrokeWidth",
      "Borders"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "BorderTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-responsivetokens",
    "displayName": "Responsive Tokens",
    "canonicalName": "ResponsiveTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Viewport breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.breakpoints",
    "aliases": [
      "Breakpoints",
      "MediaQueries",
      "ResponsiveBreakpoints",
      "ScreenSizes"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ResponsiveTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-layertokens",
    "displayName": "Layer Tokens",
    "canonicalName": "LayerTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Z-index hierarchy: base (0), header (30), nav (40), modal (100), nestedModal (120), toast (150).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.zIndex",
    "aliases": [
      "ZIndex",
      "StackingOrder",
      "Layers",
      "LayerHierarchy"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "LayerTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-motiontokens",
    "displayName": "Motion Tokens",
    "canonicalName": "MotionTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Transition timing: fast (100ms), normal (150ms), slow (250ms), easeInOut curves.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.motion",
    "aliases": [
      "Transitions",
      "Animations",
      "Easing",
      "Durations"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "MotionTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-focusring",
    "displayName": "Focus Ring",
    "canonicalName": "FocusRing",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Accessible focus ring token (ring-2 ring-indigo-500/40 ring-offset-1).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.focus",
    "aliases": [
      "FocusOutline",
      "FocusIndicator",
      "AccessibilityRing"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FocusRing",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-01-scrollbartokens",
    "displayName": "Scrollbar Tokens",
    "canonicalName": "ScrollbarTokens",
    "category": "01. Foundation / Global Theme",
    "categoryNumber": "01",
    "description": "Scrollbar styles: thin-scrollbar and scrollbar-none for horizontal overflow containers.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.spacing",
    "aliases": [
      "Scrollbar",
      "CustomScrollbar",
      "ThinScrollbar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ScrollbarTokens",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-pagecontainer",
    "displayName": "Page Container",
    "canonicalName": "PageContainer",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Max-width bounded responsive page wrapper with horizontal padding.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.spacing.pagePadding",
    "aliases": [
      "Container",
      "LayoutWrapper",
      "PageWrapper"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PageContainer",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-pagesection",
    "displayName": "Page Section",
    "canonicalName": "PageSection",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Structural page content section with standard bottom margin and title spacing.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.spacing.sectionGap",
    "aliases": [
      "ContentSection",
      "LayoutSection"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PageSection",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-appheader",
    "displayName": "App Header",
    "canonicalName": "AppHeader",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Enterprise dual top-header shell: Tier 1 Utility (44px) & Tier 2 ERP Modules (40px).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/AppHeader.tsx",
    "tokenSource": "designTokens.zIndex.header",
    "aliases": [
      "Header",
      "TopHeader",
      "DualHeader",
      "EnterpriseHeader"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AppHeader",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-headerbrand",
    "displayName": "Header Brand",
    "canonicalName": "HeaderBrand",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Brand logo badge (\"CampusOS Core\") located in Tier 1 top header.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/AppHeader.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "BrandLogo",
      "CoreBadge",
      "CampusOSLogo"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "HeaderBrand",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-workingcontextselector",
    "displayName": "Working Context Selector",
    "canonicalName": "WorkingContextSelector",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Hierarchy node switcher (Head Office / Region / School / Campus) in Tier 1 top header.",
    "status": "LIVE",
    "sharedSource": "apps/web/components/WorkingContextPicker.tsx",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "WorkingContextPicker",
      "CampusPicker",
      "HierarchySwitcher"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "WorkingContextSelector",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-globalsearch",
    "displayName": "Global Search",
    "canonicalName": "GlobalSearch",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Top-bar shortcut input (⌘K) opening full system omnibox command palette.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "Omnibox",
      "CommandPalette",
      "QuickSearch"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "GlobalSearch",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-notificationcenter",
    "displayName": "Notification Center",
    "canonicalName": "NotificationCenter",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Top-bar notification bell and alert feed popover.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.popover",
    "aliases": [
      "AlertFeed",
      "NotificationPopover"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "NotificationCenter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-userprofilemenu",
    "displayName": "User Profile Menu",
    "canonicalName": "UserProfileMenu",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Avatar initials button with role label and session actions dropdown.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/AppHeader.tsx",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "UserAvatar",
      "ProfileDropdown",
      "UserBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "UserProfileMenu",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-adminconfigbutton",
    "displayName": "Admin Config Button",
    "canonicalName": "AdminConfigButton",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Dedicated header button for Administration Configuration Control Center.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/AppHeader.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "AdminConfigLink",
      "ControlCenterButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminConfigButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-mainnavigation",
    "displayName": "Main Navigation",
    "canonicalName": "MainNavigation",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Tier 2 ERP module horizontal navigation bar (Dashboard, Student, Billing, HR, etc.).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/MainNavigation.tsx",
    "tokenSource": "designTokens.zIndex.navigation",
    "aliases": [
      "NavBar",
      "ERPNavigation",
      "ModuleNavigation",
      "TopNav"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "MainNavigation",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-navigationitem",
    "displayName": "Navigation Item",
    "canonicalName": "NavigationItem",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Single ERP module navigation item with icon and active indicator in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/MainNavigation.tsx",
    "tokenSource": "designTokens.typography.semantic.button",
    "aliases": [
      "NavItem",
      "ModuleTab",
      "NavLink"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "NavigationItem",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-navigationdropdown",
    "displayName": "Navigation Dropdown",
    "canonicalName": "NavigationDropdown",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Multi-column cascading flyout navigation menu for complex ERP modules.",
    "status": "LIVE",
    "sharedSource": "apps/web/components/StudentCascadingMenu.tsx",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "CascadingMenu",
      "MegaMenu",
      "FlyoutNav",
      "NavDropdown"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "NavigationDropdown",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-dropdownmenu",
    "displayName": "Dropdown Menu",
    "canonicalName": "DropdownMenu",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Generic absolute-positioned dropdown menu panel with shadow and border in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/AppHeader.tsx",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "MenuPanel",
      "ContextMenu",
      "DropdownPanel"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DropdownMenu",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-appfooter",
    "displayName": "App Footer",
    "canonicalName": "AppFooter",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Bottom system footer with version string, copyright, and status indicator.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "Footer",
      "SystemFooter"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AppFooter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-02-systembanner",
    "displayName": "System Banner",
    "canonicalName": "SystemBanner",
    "category": "02. Main Application Layout",
    "categoryNumber": "02",
    "description": "Top broadcast announcement or maintenance banner.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.colors.warning",
    "aliases": [
      "BroadcastBanner",
      "AnnouncementBar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "SystemBanner",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-adminpageheader",
    "displayName": "Admin Page Header",
    "canonicalName": "AdminPageHeader",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Standard top-level page header with breadcrumbs, title, description, and actions.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/headers/AdminPageHeader.tsx",
    "tokenSource": "designTokens.typography.semantic.pageTitle",
    "aliases": [
      "PageHeader",
      "HeaderComposition"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminPageHeader",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-adminbreadcrumb",
    "displayName": "Admin Breadcrumb",
    "canonicalName": "AdminBreadcrumb",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Hierarchical navigation trail with clickable category links.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/headers/AdminPageHeader.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "Breadcrumbs",
      "NavigationTrail"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminBreadcrumb",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-breadcrumbmenu",
    "displayName": "Breadcrumb Menu",
    "canonicalName": "BreadcrumbMenu",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Compact breadcrumb dropdown menu for deeply nested entity paths.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/headers/AdminPageHeader.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "CollapsedBreadcrumb"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "BreadcrumbMenu",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-pagetitle",
    "displayName": "Page Title",
    "canonicalName": "PageTitle",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Bold page headline typography (text-2xl font-black).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.typography.semantic.pageTitle",
    "aliases": [
      "Heading",
      "PageHeading"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PageTitle",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-pagedescription",
    "displayName": "Page Description",
    "canonicalName": "PageDescription",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Sub-heading contextual description (text-xs text-slate-500).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.typography.semantic.body",
    "aliases": [
      "Subtitle",
      "PageSubtitle"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PageDescription",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-favoritebutton",
    "displayName": "Favorite Button",
    "canonicalName": "FavoriteButton",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Pill button (★ Favorite) to pin configuration pages to user dashboard.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/headers/AdminPageHeader.tsx",
    "tokenSource": "designTokens.colors.warning",
    "aliases": [
      "BookmarkButton",
      "PinPageButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FavoriteButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-quickactionbutton",
    "displayName": "Quick Action Button",
    "canonicalName": "QuickActionButton",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Pill button (⚡ In Quick Actions) to pin shortcuts to the top toolbar.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/headers/AdminPageHeader.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "ShortcutButton",
      "QuickActionPin"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "QuickActionButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-primaryactionbutton",
    "displayName": "Primary Action Button",
    "canonicalName": "PrimaryActionButton",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Canonical \"+ Add <Entity>\" button with icon, spinner, and semantic tokens.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/PrimaryActionButton.tsx",
    "tokenSource": "designTokens.controls.actionButton",
    "aliases": [
      "AddEntityButton",
      "CreateButton",
      "AddButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PrimaryActionButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-03-pageactions",
    "displayName": "Page Actions",
    "canonicalName": "PageActions",
    "category": "03. Page Header",
    "categoryNumber": "03",
    "description": "Flex container for header buttons, export options, and status toggles.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/headers/AdminPageHeader.tsx",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "HeaderActions",
      "ActionToolbar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PageActions",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-04-adminmoduletabs",
    "displayName": "Admin Module Tabs",
    "canonicalName": "AdminModuleTabs",
    "category": "04. Tabs & Navigation",
    "categoryNumber": "04",
    "description": "Primary section horizontal tabs with icons, badge counters, and active highlight.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tabs/AdminModuleTabs.tsx",
    "tokenSource": "designTokens.controls.tabHeight",
    "aliases": [
      "ModuleTabs",
      "SectionTabs",
      "PrimaryTabs"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminModuleTabs",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-04-adminsubtabs",
    "displayName": "Admin SubTabs / Segmented Control",
    "canonicalName": "AdminSubTabs",
    "category": "04. Tabs & Navigation",
    "categoryNumber": "04",
    "description": "Secondary pill-style tab segment for switching sub-views within an admin module.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tabs/AdminModuleTabs.tsx",
    "tokenSource": "designTokens.radius.semantic.pill",
    "aliases": [
      "SegmentedControl",
      "SubTabs",
      "PillTabs",
      "ViewSwitcher"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminSubTabs",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-04-formstepper",
    "displayName": "Form Stepper",
    "canonicalName": "FormStepper",
    "category": "04. Tabs & Navigation",
    "categoryNumber": "04",
    "description": "Numbered step-by-step progress indicator for multi-stage forms.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "StepIndicator",
      "MultiStepProgress"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "FormStepper",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-04-verticalnavigation",
    "displayName": "Vertical Navigation",
    "canonicalName": "VerticalNavigation",
    "category": "04. Tabs & Navigation",
    "categoryNumber": "04",
    "description": "Sidebar vertical navigation menu for module settings.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "SidebarNav",
      "VerticalMenu"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "VerticalNavigation",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-04-accordion",
    "displayName": "Accordion",
    "canonicalName": "Accordion",
    "category": "04. Tabs & Navigation",
    "categoryNumber": "04",
    "description": "Vertically stacked collapsible disclosure panels with header toggle.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "CollapsiblePanels",
      "DisclosureGroup"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "Accordion",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-04-collapsiblepanel",
    "displayName": "Collapsible Panel",
    "canonicalName": "CollapsiblePanel",
    "category": "04. Tabs & Navigation",
    "categoryNumber": "04",
    "description": "Individual expandable panel with smooth height transition.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "ExpandableCard",
      "DisclosurePanel"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "CollapsiblePanel",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-05-admincard",
    "displayName": "Admin Card / Section Card",
    "canonicalName": "AdminCard",
    "category": "05. Cards & Summary",
    "categoryNumber": "05",
    "description": "White/dark elevated card container with subtle border, 16px radius, and padding.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.radius.semantic.card",
    "aliases": [
      "SectionCard",
      "CardContainer",
      "BaseCard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-05-statcard",
    "displayName": "Stat Card / KPI Card / Metric Card",
    "canonicalName": "StatCard",
    "category": "05. Cards & Summary",
    "categoryNumber": "05",
    "description": "Summary metric card with large KPI number, semantic icon, and trend percentage delta.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/cards/StatCard.tsx",
    "tokenSource": "designTokens.shadows.card",
    "aliases": [
      "KpiCard",
      "MetricCard",
      "KPI Card",
      "Metric Card",
      "AnalyticsCard",
      "SummaryCard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "/admin-config/head-offices",
      "/admin-config/regions",
      "/admin-config/schools",
      "/admin-config/branches",
      "/admin-config/academic-years",
      "/admin-config/academic-levels",
      "/admin-config/classes",
      "/admin-config/sections",
      "/admin-config/subjects",
      "/admin-config/boards",
      "/admin-config/school-types",
      "/admin-config/languages",
      "/admin-config/countries",
      "/admin-config/states",
      "/admin-config/cities",
      "/admin-config/areas",
      "/admissions/tests",
      "/admissions/pre-admissions"
    ],
    "previewType": "StatCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-05-clickablecard",
    "displayName": "Clickable Card",
    "canonicalName": "ClickableCard",
    "category": "05. Cards & Summary",
    "categoryNumber": "05",
    "description": "Interactive card with hover elevation and click navigation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/cards/StatCard.tsx",
    "tokenSource": "designTokens.shadows.cardHover",
    "aliases": [
      "InteractiveCard",
      "ActionCard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ClickableCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-05-recordsummary",
    "displayName": "Record Summary",
    "canonicalName": "RecordSummary",
    "category": "05. Cards & Summary",
    "categoryNumber": "05",
    "description": "Compact summary block showing record details and relationships.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "EntitySummary",
      "ProfileSummary"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "RecordSummary",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-05-infocard",
    "displayName": "Info Card",
    "canonicalName": "InfoCard",
    "category": "05. Cards & Summary",
    "categoryNumber": "05",
    "description": "Informational banner card with contextual guidance and tinted border.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.info",
    "aliases": [
      "NoticeCard",
      "CalloutCard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "InfoCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-05-emptycard",
    "displayName": "Empty Card",
    "canonicalName": "EmptyCard",
    "category": "05. Cards & Summary",
    "categoryNumber": "05",
    "description": "Card container displaying empty state placeholder.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "BlankCard",
      "PlaceholderCard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "EmptyCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-admintable",
    "displayName": "Admin Table",
    "canonicalName": "AdminTable",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Standard data table container with density support and horizontal scrolling.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.spacing.tableCellPadding",
    "aliases": [
      "DataTable",
      "GridTable",
      "TableGrid"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminTable",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-tableheader",
    "displayName": "Table Header",
    "canonicalName": "TableHeader",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Table header row with uppercase tracking, sort indicators, and select-all.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.typography.semantic.tableHeader",
    "aliases": [
      "TableHead",
      "HeadRow"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TableHeader",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-tablerow",
    "displayName": "Table Row",
    "canonicalName": "TableRow",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Data table row with hover state, click handler, and zebra striping in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.colors.surface",
    "aliases": [
      "DataRow",
      "RecordRow"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TableRow",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-tablecell",
    "displayName": "Table Cell",
    "canonicalName": "TableCell",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Data table cell with aligned content and density-aware padding in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.spacing.tableCellPadding",
    "aliases": [
      "DataCell",
      "TableCol"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TableCell",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-sortcontrol",
    "displayName": "Sort Control",
    "canonicalName": "SortControl",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Sort direction chevron and toggle button (Unsorted, Ascending, Descending).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.colors.textSecondary",
    "aliases": [
      "SortIndicator",
      "SortButton",
      "ColumnSort"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SortControl",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-bulkselection",
    "displayName": "Bulk Selection",
    "canonicalName": "BulkSelection",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Header and row checkboxes for multi-record selection and batch operations.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "MultiSelectTable",
      "SelectAllCheckbox"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "BulkSelection",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-bulkactionbar",
    "displayName": "Bulk Action Bar",
    "canonicalName": "BulkActionBar",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Floating bottom bar appearing when multiple records are selected.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.header",
    "aliases": [
      "FloatingActionBar",
      "BatchToolbar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "BulkActionBar",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-columnselector",
    "displayName": "Column Selector",
    "canonicalName": "ColumnSelector",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Dropdown menu to toggle visible table columns.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "ColumnToggle",
      "VisibleColumns"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ColumnSelector",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-tabledensity",
    "displayName": "Table Density Switcher",
    "canonicalName": "TableDensity",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Density switcher toggle (compact: 6px, normal: 10px, comfortable: 14px).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.spacing.tableCellPadding",
    "aliases": [
      "DensityToggle",
      "CompactTableToggle"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TableDensity",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-tablefooter",
    "displayName": "Table Footer",
    "canonicalName": "TableFooter",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Table footer row displaying totals, record counts, and pagination.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.spacing.tableCellPadding",
    "aliases": [
      "FooterRow",
      "SummaryRow"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TableFooter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-stickytableheader",
    "displayName": "Sticky Table Header",
    "canonicalName": "StickyTableHeader",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Table header that stays pinned at top while scrolling scrollable table body.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.zIndex.header",
    "aliases": [
      "PinnedHeader",
      "FixedTableHeader"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "StickyTableHeader",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-06-responsivetable",
    "displayName": "Responsive Table",
    "canonicalName": "ResponsiveTable",
    "category": "06. Tables",
    "categoryNumber": "06",
    "description": "Horizontally scrollable table wrapper with boundary shadow indicators on narrow viewports.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.breakpoints",
    "aliases": [
      "ScrollableTable",
      "MobileTable"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ResponsiveTable",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-rowactions",
    "displayName": "Row Actions",
    "canonicalName": "RowActions",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Standard group of subtle rounded-square action buttons (h-7 w-7) for View, Edit, Delete.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.controls.rowAction",
    "aliases": [
      "ActionGroup",
      "TableActions",
      "RowActionSuite"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "RowActions",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-viewaction",
    "displayName": "View Action",
    "canonicalName": "ViewAction",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Dedicated View Details button (h-7 w-7, Blue tint #2563eb, Eye icon).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.colors.info",
    "aliases": [
      "ViewButton",
      "EyeButton",
      "InspectAction"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "/admin-config/head-offices",
      "/admin-config/regions",
      "/admin-config/schools",
      "/admin-config/branches",
      "/admin-config/academic-years",
      "/admin-config/academic-levels",
      "/admin-config/classes",
      "/admin-config/sections",
      "/admin-config/subjects",
      "/admin-config/boards",
      "/admin-config/school-types",
      "/admin-config/languages",
      "/admin-config/countries",
      "/admin-config/states",
      "/admin-config/cities",
      "/admin-config/areas",
      "/admin-config/application-fee",
      "/admissions/tests"
    ],
    "previewType": "ViewAction",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-editaction",
    "displayName": "Edit Action",
    "canonicalName": "EditAction",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Dedicated Edit Record button (h-7 w-7, Emerald tint #059669, Edit2 icon).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.colors.success",
    "aliases": [
      "EditButton",
      "PencilButton",
      "ModifyAction"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "EditAction",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-deleteaction",
    "displayName": "Delete Action",
    "canonicalName": "DeleteAction",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Dedicated Delete Record button (h-7 w-7, Rose tint #e11d48, Trash2 icon).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "DeleteButton",
      "TrashButton",
      "RemoveAction"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DeleteAction",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-statusaction",
    "displayName": "Status Action",
    "canonicalName": "StatusAction",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Activate/Deactivate toggle action button in table row.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.controls.rowAction",
    "aliases": [
      "ToggleStatusAction",
      "ActivateAction"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "StatusAction",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-moreactionsmenu",
    "displayName": "More Actions Menu",
    "canonicalName": "MoreActionsMenu",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Three-dots dropdown menu for secondary row operations.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "ThreeDotsMenu",
      "RowMenu",
      "OverflowMenu"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "MoreActionsMenu",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-contextmenu",
    "displayName": "Context Menu",
    "canonicalName": "ContextMenu",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Right-click context menu for table rows.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "RightClickMenu"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ContextMenu",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-buttongroup",
    "displayName": "Button Group",
    "canonicalName": "ButtonGroup",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Connected set of action buttons sharing border radius.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.radius.semantic.button",
    "aliases": [
      "ConnectedButtons",
      "ActionCluster"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ButtonGroup",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-07-splitbutton",
    "displayName": "Split Button",
    "canonicalName": "SplitButton",
    "category": "07. Row Actions",
    "categoryNumber": "07",
    "description": "Dual-action button with main action and dropdown chevron.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.buttonHeight",
    "aliases": [
      "DropdownButton",
      "ActionSplit"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "SplitButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-08-connectedcountpill",
    "displayName": "Connected Count Pill / Relationship Badge",
    "canonicalName": "ConnectedCountPill",
    "category": "08. Connected Units / Relationships",
    "categoryNumber": "08",
    "description": "Compact clickable pill (🔗 <count>) showing relationship links.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/relationships/ConnectedCountPill.tsx",
    "tokenSource": "designTokens.radius.semantic.pill",
    "aliases": [
      "RelationshipBadge",
      "CountPill",
      "ConnectedPill",
      "LinkPill"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "/admin-config/head-offices",
      "/admin-config/regions",
      "/admin-config/schools"
    ],
    "previewType": "ConnectedCountPill",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-08-connectedunitsmodal",
    "displayName": "Connected Units Modal / Dependency Modal",
    "canonicalName": "ConnectedUnitsModal",
    "category": "08. Connected Units / Relationships",
    "categoryNumber": "08",
    "description": "Nested modal popup (zIndex: 120) listing child/related units and deletion dependencies.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/ConnectedUnitsModalDemo.tsx",
    "tokenSource": "designTokens.zIndex.nestedModal",
    "aliases": [
      "DependencyModal",
      "LinkedUnitsModal",
      "RelationModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ConnectedUnitsModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-08-entitylistitem",
    "displayName": "Entity List Item",
    "canonicalName": "EntityListItem",
    "category": "08. Connected Units / Relationships",
    "categoryNumber": "08",
    "description": "Standardized record list row in relationship popups.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/ConnectedUnitsModalDemo.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "UnitRow",
      "RelationRow"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "EntityListItem",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-08-hierarchylink",
    "displayName": "Hierarchy Link / Parent Entity Link",
    "canonicalName": "HierarchyLink",
    "category": "08. Connected Units / Relationships",
    "categoryNumber": "08",
    "description": "Clickable breadcrumb-style link traversing organizational nodes (HO -> Region -> School).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "ParentEntityLink",
      "ParentLink",
      "AncestryLink"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "HierarchyLink",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-adminsearch",
    "displayName": "Admin Search",
    "canonicalName": "AdminSearch",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Standard search input with search icon, clear button, and real-time query filter.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "SearchInput",
      "FilterSearch",
      "TableSearch"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminSearch",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-adminfilterbar",
    "displayName": "Admin Filter Bar",
    "canonicalName": "AdminFilterBar",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Multi-attribute filter bar with dropdowns and active chips.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "FilterToolbar",
      "FilterBar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminFilterBar",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-filterselect",
    "displayName": "Filter Select",
    "canonicalName": "FilterSelect",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Single category/attribute filter dropdown in toolbar.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "CategoryFilter",
      "AttributeSelect"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FilterSelect",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-filterchip",
    "displayName": "Filter Chip",
    "canonicalName": "FilterChip",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Removable active filter tag with dismiss \"x\" icon.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.radius.semantic.pill",
    "aliases": [
      "ActiveFilterTag",
      "RemovableTag"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FilterChip",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-datefilter",
    "displayName": "Date Filter",
    "canonicalName": "DateFilter",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Date picker filter for filtering table records by date.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "CalendarFilter"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "DateFilter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-daterangepickerfilter",
    "displayName": "Date Range Picker Filter",
    "canonicalName": "DateRangePickerFilter",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Start and end date range selector for report tables.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "PeriodFilter",
      "RangeSelector"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "DateRangePickerFilter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-statusfilter",
    "displayName": "Status Filter",
    "canonicalName": "StatusFilter",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Preset status filter (All, Active, Inactive, Pending).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "StateDropdownFilter"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "StatusFilter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-clearfilters",
    "displayName": "Clear Filters",
    "canonicalName": "ClearFilters",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Reset button to clear all active filter parameters.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "ResetFiltersButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ClearFilters",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-adminpagination",
    "displayName": "Admin Pagination",
    "canonicalName": "AdminPagination",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Footer pagination controls: records range and page navigation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.spacing.tableCellPadding",
    "aliases": [
      "PaginationBar",
      "PageControls"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminPagination",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-pagesizeselector",
    "displayName": "Page Size Selector",
    "canonicalName": "PageSizeSelector",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Dropdown to select records per page (10, 25, 50, 100).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "RowsPerPage",
      "EntriesPerPage"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PageSizeSelector",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-09-recordscounter",
    "displayName": "Records Counter",
    "canonicalName": "RecordsCounter",
    "category": "09. Search / Filters / Pagination",
    "categoryNumber": "09",
    "description": "Text showing \"Showing X to Y of Z entries\".",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "EntriesCount",
      "TotalRecords"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "RecordsCounter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-button",
    "displayName": "Button (Base Family)",
    "canonicalName": "Button",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "General button family supporting variants, sizes, and loading states.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/Button.tsx",
    "tokenSource": "designTokens.controls.buttonHeight",
    "aliases": [
      "Buttons",
      "BaseButton",
      "Btn"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Button",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-primarybutton",
    "displayName": "Primary Button",
    "canonicalName": "PrimaryButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Solid Indigo-600 button with focus ring for primary actions in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/Button.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "SolidButton",
      "BrandButton",
      "MainButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PrimaryButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-secondarybutton",
    "displayName": "Secondary Button",
    "canonicalName": "SecondaryButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Slate-100 neutral button for secondary or cancel actions in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/Button.tsx",
    "tokenSource": "designTokens.colors.secondary",
    "aliases": [
      "CancelButton",
      "NeutralButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SecondaryButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-outlinebutton",
    "displayName": "Outline Button",
    "canonicalName": "OutlineButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Bordered button with transparent background for tertiary actions in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/Button.tsx",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "BorderedButton",
      "GhostButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "OutlineButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-dangerbutton",
    "displayName": "Danger Button",
    "canonicalName": "DangerButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Rose-600 destructive button for delete and cancellation confirmations in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/Button.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "DestructiveButton",
      "DeleteConfirmButton",
      "RedButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DangerButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-iconbutton",
    "displayName": "Icon Button",
    "canonicalName": "IconButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Square button containing an icon with tooltip support in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.controls.rowAction",
    "aliases": [
      "SquareIconButton",
      "ToolButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "IconButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-loadingbutton",
    "displayName": "Loading Button",
    "canonicalName": "LoadingButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Button with integrated circular spinner demonstrating active loading state.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/Button.tsx",
    "tokenSource": "designTokens.motion.duration",
    "aliases": [
      "SpinnerButton",
      "PendingButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "LoadingButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-disabledbutton",
    "displayName": "Disabled Button",
    "canonicalName": "DisabledButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Inactive button with muted background and not-allowed cursor.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/Button.tsx",
    "tokenSource": "designTokens.colors.textMuted",
    "aliases": [
      "InactiveButton",
      "BlockedButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DisabledButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-copybutton",
    "displayName": "Copy Button",
    "canonicalName": "CopyButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "One-click button to copy IDs or credentials to clipboard.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.rowAction",
    "aliases": [
      "ClipboardButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "CopyButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-externallink",
    "displayName": "External Link",
    "canonicalName": "ExternalLink",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Button/link opening external portals with external icon.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.colors.info",
    "aliases": [
      "ExtLink",
      "OutboundLink"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ExternalLink",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-10-primaryactionbutton",
    "displayName": "Primary Action Button (+ Add Entity)",
    "canonicalName": "PrimaryActionButton",
    "category": "10. Buttons",
    "categoryNumber": "10",
    "description": "Canonical \"+ Add <Entity>\" button (+ Add School, + Add Region, etc.).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/buttons/PrimaryActionButton.tsx",
    "tokenSource": "designTokens.controls.actionButton",
    "aliases": [
      "AddEntityButton",
      "CreateEntityButton",
      "AddSchoolButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PrimaryActionButton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-adminformmodal",
    "displayName": "Admin Form Modal",
    "canonicalName": "AdminFormModal",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Standard 5xl wide modal with 2-col field grid and action footer.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.modals.width.form",
    "aliases": [
      "5xlFormModal",
      "CreateModal",
      "FormModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminFormModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-formcontainer",
    "displayName": "Form Container",
    "canonicalName": "FormContainer",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Form wrapper handling validation state and submission boundaries.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.spacing.formGap",
    "aliases": [
      "FormWrapper"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FormContainer",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-formsection",
    "displayName": "Form Section",
    "canonicalName": "FormSection",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Section header and divider separating logical field groups.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.spacing.formSectionGap",
    "aliases": [
      "FieldGroup",
      "FormDivider"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FormSection",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-formgrid",
    "displayName": "Form Grid",
    "canonicalName": "FormGrid",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Responsive multi-column form grid (1, 2, 3, 4 columns) in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.spacing.formGap",
    "aliases": [
      "2ColGrid",
      "FormColumns"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FormGrid",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-formfield",
    "displayName": "Form Field (Composition)",
    "canonicalName": "FormField",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Field wrapper with label, required asterisk (*), and error rendering.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.typography.semantic.label",
    "aliases": [
      "FieldWrapper",
      "InputGroupWrapper"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FormField",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-formlabel",
    "displayName": "Form Label",
    "canonicalName": "FormLabel",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Standard field label typography (text-xs font-semibold) with required state.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.typography.semantic.label",
    "aliases": [
      "FieldLabel",
      "InputLabel"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FormLabel",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-formhelptext",
    "displayName": "Form Help Text",
    "canonicalName": "FormHelpText",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Contextual guidance text below form input fields.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.typography.semantic.helper",
    "aliases": [
      "HelperText",
      "FieldHint"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FormHelpText",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-fielderror",
    "displayName": "Field Error",
    "canonicalName": "FieldError",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Validation error text and red highlight input state.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "ValidationError",
      "ErrorMessage"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FieldError",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-fieldstate",
    "displayName": "Field State Comparison",
    "canonicalName": "FieldState",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Visual border/ring state: normal, focus, error, disabled.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "InputStates",
      "ControlStates"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FieldState",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-formfooter",
    "displayName": "Form Footer",
    "canonicalName": "FormFooter",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Action bar containing Cancel, Reset, and Submit buttons.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "FormActionsBar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "FormFooter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-stickyactionbar",
    "displayName": "Sticky Action Bar",
    "canonicalName": "StickyActionBar",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Pinned bottom action toolbar for long multi-section forms.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.zIndex.header",
    "aliases": [
      "PinnedActionBar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "StickyActionBar",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-11-unsavedchangesguard",
    "displayName": "Unsaved Changes Guard",
    "canonicalName": "UnsavedChangesGuard",
    "category": "11. Forms — Structure",
    "categoryNumber": "11",
    "description": "Prompt warning user before navigating away from unsaved forms.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.modal",
    "aliases": [
      "NavigationGuard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "UnsavedChangesGuard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-textinput",
    "displayName": "Text Input",
    "canonicalName": "TextInput",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Standard text input with consistent height (38px) and focus ring in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "TextField",
      "InputBox",
      "StringInput"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TextInput",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-numberinput",
    "displayName": "Number Input",
    "canonicalName": "NumberInput",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Numeric input with step increment and integer masks in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "NumericInput",
      "IntegerInput"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "NumberInput",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-passwordfield",
    "displayName": "Password Field",
    "canonicalName": "PasswordField",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Secure input with toggle password visibility eye button in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "PasswordInput",
      "SecureInput"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PasswordField",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-phoneinput",
    "displayName": "Phone Input",
    "canonicalName": "PhoneInput",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Phone field with country dialing code prefix.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "TelephoneInput",
      "MobileNumberInput"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PhoneInput",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-emailinput",
    "displayName": "Email Input",
    "canonicalName": "EmailInput",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Email field with email syntax validation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "EmailField"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "EmailInput",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-textarea",
    "displayName": "Text Area",
    "canonicalName": "TextArea",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Multi-line text area for descriptions and notes.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.radius.semantic.button",
    "aliases": [
      "MultiLineInput",
      "NotesField"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TextArea",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-selectfield",
    "displayName": "Select Field",
    "canonicalName": "SelectField",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Standard native dropdown select with styled options in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "DropdownSelect",
      "NativeSelect",
      "OptionPicker"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SelectField",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-searchableselect",
    "displayName": "Searchable Select",
    "canonicalName": "SearchableSelect",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Combobox dropdown with autocomplete text search.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "Combobox",
      "AutocompleteSelect"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "SearchableSelect",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-multiselect",
    "displayName": "Multi-Select",
    "canonicalName": "MultiSelect",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Enterprise multi-select control with searchable options, checkbox selection, and removable chips.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/MultiSelect.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "MultiSelect",
      "MultipleSelect",
      "MultipleSelection",
      "TagSelect",
      "MultiOptionPicker",
      "CampusMultiSelect"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "MultiSelect",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-hierarchypicker",
    "displayName": "Hierarchy Picker / Tree Select",
    "canonicalName": "HierarchyPicker",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Organizational node picker modal traversing HO -> Region -> School.",
    "status": "LIVE",
    "sharedSource": "apps/web/components/HierarchyScopePickerModal.tsx",
    "tokenSource": "designTokens.zIndex.modal",
    "aliases": [
      "TreeSelect",
      "ScopeTree",
      "NodePicker"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "HierarchyPicker",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-checkbox",
    "displayName": "Checkbox",
    "canonicalName": "Checkbox",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Square boolean checkbox with checkmark icon and states in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "Checkmark",
      "TickBox",
      "BooleanCheck"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Checkbox",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-radiogroup",
    "displayName": "Radio Group",
    "canonicalName": "RadioGroup",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Mutually exclusive radio options for single choices.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "RadioButton",
      "OptionGroup"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "RadioGroup",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-toggleswitch",
    "displayName": "Toggle Switch",
    "canonicalName": "ToggleSwitch",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Smooth slider toggle switch for instant on/off states with live click toggle.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "Switch",
      "Toggle",
      "OnOffSwitch"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ToggleSwitch",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-datepicker",
    "displayName": "Date Picker",
    "canonicalName": "DatePicker",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Date picker with calendar popup.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "CalendarInput"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "DatePicker",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-timepicker",
    "displayName": "Time Picker",
    "canonicalName": "TimePicker",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Time selection input for schedules and periods.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "ClockPicker"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "TimePicker",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-datetimepicker",
    "displayName": "Date Time Picker",
    "canonicalName": "DateTimePicker",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Combined calendar and time picker.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "SchedulePicker"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "DateTimePicker",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-otpinput",
    "displayName": "OTP Input",
    "canonicalName": "OtpInput",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Individual digit boxes for SMS verification codes.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "VerificationCodeInput",
      "PinCode"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "OtpInput",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-12-inputgroup",
    "displayName": "Input Group with Addons",
    "canonicalName": "InputGroup",
    "category": "12. Form Controls",
    "categoryNumber": "12",
    "description": "Input with attached prefix or suffix addon buttons.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/FormControls.tsx",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "PrefixInput",
      "AddonInput"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "InputGroup",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-fileupload",
    "displayName": "File Upload",
    "canonicalName": "FileUpload",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "Drag-and-drop document upload area with progress bar.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "DocumentUpload",
      "Dropzone"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "FileUpload",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-logoupload",
    "displayName": "Logo Upload / Image Upload",
    "canonicalName": "LogoUpload",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "Dedicated institution logo and picture uploader with crop preview.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.radius.semantic.card",
    "aliases": [
      "ImageUpload",
      "AvatarUpload"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "LogoUpload",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-filepreview",
    "displayName": "File Preview",
    "canonicalName": "FilePreview",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "PDF, DOCX, and image file viewer modal.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.radius.semantic.card",
    "aliases": [
      "DocumentViewer",
      "PdfViewer"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "FilePreview",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-imagepreview",
    "displayName": "Image Preview",
    "canonicalName": "ImagePreview",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "Lightbox preview modal for high-resolution images.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/EntityLogoDemo.tsx",
    "tokenSource": "designTokens.radius.semantic.card",
    "aliases": [
      "Lightbox",
      "PicturePreview"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ImagePreview",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-attachmentlist",
    "displayName": "Attachment List",
    "canonicalName": "AttachmentList",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "List of uploaded files with download and remove actions.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "FileList",
      "UploadedDocs"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "AttachmentList",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-entitylogo",
    "displayName": "Entity Logo / Logo Placeholder",
    "canonicalName": "EntityLogo",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "Institution branding logo with clean fallback emoji/icons (🏫, 🏢, 🌐).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/EntityLogoDemo.tsx",
    "tokenSource": "designTokens.radius.semantic.card",
    "aliases": [
      "LogoPlaceholder",
      "BrandLogo",
      "InstitutionLogo"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "EntityLogo",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-avatar",
    "displayName": "Avatar",
    "canonicalName": "Avatar",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "User profile avatar circle with initials fallback.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/EntityLogoDemo.tsx",
    "tokenSource": "designTokens.radius.semantic.pill",
    "aliases": [
      "UserAvatar",
      "ProfileImage"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Avatar",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-13-avatargroup",
    "displayName": "Avatar Group",
    "canonicalName": "AvatarGroup",
    "category": "13. Files / Images",
    "categoryNumber": "13",
    "description": "Overlapping group of user avatars with overflow count.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing",
    "aliases": [
      "OverlappingAvatars"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "AvatarGroup",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-adminmodal",
    "displayName": "Admin Modal (Base Dialog)",
    "canonicalName": "AdminModal",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Portal-backed modal dialog with viewport backdrop, escape key, and scroll lock.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.modals.width.form",
    "aliases": [
      "ModalDialog",
      "Popup",
      "Dialog",
      "ModalWindow"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AdminModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-smallmodal",
    "displayName": "Small Modal (sm: 400px)",
    "canonicalName": "SmallModal",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Compact modal (400px) for quick confirmation prompts.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.modals.width.sm",
    "aliases": [
      "CompactModal",
      "PromptModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SmallModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-mediummodal",
    "displayName": "Medium Modal (md: 600px)",
    "canonicalName": "MediumModal",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Medium modal (600px) for standard dialogs.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.modals.width.md",
    "aliases": [
      "StandardModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "MediumModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-widemodal",
    "displayName": "Wide Modal (wide: 900px)",
    "canonicalName": "WideModal",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Wide modal (900px) for medium data forms.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.modals.width.wide",
    "aliases": [
      "LargeModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "WideModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-confirmmodal",
    "displayName": "Confirm Modal",
    "canonicalName": "ConfirmModal",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Action confirmation dialog with Cancel and Confirm buttons.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.modals.width.sm",
    "aliases": [
      "ActionPrompt",
      "ConfirmationDialog"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ConfirmModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-deleteconfirmmodal",
    "displayName": "Delete Confirm Modal",
    "canonicalName": "DeleteConfirmModal",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Destructive confirmation modal with red warning badge.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "DestructiveDialog",
      "DeletePrompt"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DeleteConfirmModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-popover",
    "displayName": "Popover",
    "canonicalName": "Popover",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Floating contextual container anchored to a trigger element.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.popover",
    "aliases": [
      "ContextPopover",
      "FloatingPanel"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "Popover",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-admindrawer",
    "displayName": "Admin Drawer / Details Drawer",
    "canonicalName": "AdminDrawer",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Side slide-out panel for configuration drawers and quick inspection.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.modal",
    "aliases": [
      "DetailsDrawer",
      "SideDrawer",
      "SlideOver"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "AdminDrawer",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-modaloverlay",
    "displayName": "Modal Overlay (Backdrop)",
    "canonicalName": "ModalOverlay",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Full viewport backdrop (bg-slate-900/60 backdrop-blur-xs).",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.colors.overlay",
    "aliases": [
      "BackdropLayer",
      "DimmerOverlay"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ModalOverlay",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-modalheader",
    "displayName": "Modal Header",
    "canonicalName": "ModalHeader",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Modal title, subtitle, and close button bar in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.typography.semantic.pageTitle",
    "aliases": [
      "DialogHeader"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ModalHeader",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-modalbody",
    "displayName": "Modal Body",
    "canonicalName": "ModalBody",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Scrollable content container inside modal dialog in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.spacing.modalPadding",
    "aliases": [
      "DialogContent"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ModalBody",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-modalfooter",
    "displayName": "Modal Footer",
    "canonicalName": "ModalFooter",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Bottom action bar for modal buttons in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.spacing.modalPadding",
    "aliases": [
      "DialogActions"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ModalFooter",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-nestedmodal",
    "displayName": "Nested Modal (Z-Index Layering)",
    "canonicalName": "NestedModal",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Higher z-index modal (zIndex: 120) opening above parent modal.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/ConnectedUnitsModalDemo.tsx",
    "tokenSource": "designTokens.zIndex.nestedModal",
    "aliases": [
      "StackedModal",
      "LayeredModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "NestedModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-14-modalclose",
    "displayName": "Modal Close Button",
    "canonicalName": "ModalClose",
    "category": "14. Modals / Popups / Overlays",
    "categoryNumber": "14",
    "description": "Dismiss \"x\" button located at top right of modal.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/modals/AdminModal.tsx",
    "tokenSource": "designTokens.controls.rowAction",
    "aliases": [
      "DismissButton",
      "CloseX"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ModalClose",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-detailsheader",
    "displayName": "Details Header",
    "canonicalName": "DetailsHeader",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Profile title and status badge at top of View Details modal.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.typography.semantic.pageTitle",
    "aliases": [
      "ProfileHeader"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DetailsHeader",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-entityidentitycard",
    "displayName": "Entity Identity Card",
    "canonicalName": "EntityIdentityCard",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Hero card displaying institution name, code, logo, and board.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.radius.semantic.card",
    "aliases": [
      "IdentityCard",
      "ProfileHero"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "EntityIdentityCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-detailssection",
    "displayName": "Details Section",
    "canonicalName": "DetailsSection",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Collapsible or bordered section in View Details modal.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.spacing.sectionGap",
    "aliases": [
      "InspectionSection"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DetailsSection",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-detailsgrid",
    "displayName": "Details Grid",
    "canonicalName": "DetailsGrid",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Key-value data grid showing record attributes.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.spacing.formGap",
    "aliases": [
      "AttributeGrid"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DetailsGrid",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-detailsfield",
    "displayName": "Details Field",
    "canonicalName": "DetailsField",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Single attribute label and value pair in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "AttributeRow"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DetailsField",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-sociallink",
    "displayName": "Social / Contact Link",
    "canonicalName": "SocialLink",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "WhatsApp chat link (wa.me) and website link button.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.colors.success",
    "aliases": [
      "WhatsAppLink",
      "WebLink"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SocialLink",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-linkedaccountcard",
    "displayName": "Linked Account Card",
    "canonicalName": "LinkedAccountCard",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Card showing linked IAM administrator credentials.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "AdminCredentialsCard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "LinkedAccountCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-hierarchydetails",
    "displayName": "Hierarchy Details Block",
    "canonicalName": "HierarchyDetails",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Affiliated Head Office and Region info block.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "AffiliationBlock"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "HierarchyDetails",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-auditsummary",
    "displayName": "Audit Summary",
    "canonicalName": "AuditSummary",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Created/modified timestamps and author attribution footer.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.typography.semantic.helper",
    "aliases": [
      "AuditStamp",
      "TimestampFooter"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AuditSummary",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-15-activitytimeline",
    "displayName": "Activity Timeline",
    "canonicalName": "ActivityTimeline",
    "category": "15. View Details",
    "categoryNumber": "15",
    "description": "Vertical chronological log of recent record updates.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "AuditTrail",
      "ChangeLog"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ActivityTimeline",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-statusbadge",
    "displayName": "Status Badge (Family)",
    "canonicalName": "StatusBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Semantic status badge with dot indicator for all enterprise states.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.radius.semantic.badge",
    "aliases": [
      "StateBadge",
      "StatusPill",
      "Badges"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "StatusBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-activebadge",
    "displayName": "Active Badge",
    "canonicalName": "ActiveBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Emerald badge indicating active operational state in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.success",
    "aliases": [
      "ActiveStatus",
      "GreenBadge",
      "LiveStatus"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ActiveBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-inactivebadge",
    "displayName": "Inactive Badge",
    "canonicalName": "InactiveBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Slate badge indicating deactivated state in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.neutral",
    "aliases": [
      "InactiveStatus",
      "GrayBadge",
      "DisabledBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "InactiveBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-pendingbadge",
    "displayName": "Pending Badge",
    "canonicalName": "PendingBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Amber badge indicating pending verification or approval in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.warning",
    "aliases": [
      "PendingStatus",
      "YellowBadge",
      "UnderReviewBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PendingBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-approvedbadge",
    "displayName": "Approved Badge",
    "canonicalName": "ApprovedBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Blue badge indicating verified and approved entity in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.info",
    "aliases": [
      "VerifiedBadge",
      "BlueBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ApprovedBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-rejectedbadge",
    "displayName": "Rejected Badge",
    "canonicalName": "RejectedBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Rose badge indicating rejected or disapproved submission in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "DisapprovedBadge",
      "RedBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "RejectedBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-draftbadge",
    "displayName": "Draft Badge",
    "canonicalName": "DraftBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Slate badge indicating draft unpublished state in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.neutral",
    "aliases": [
      "UnpublishedBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DraftBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-archivedbadge",
    "displayName": "Archived Badge",
    "canonicalName": "ArchivedBadge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Gray badge indicating archived historical record in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.neutral",
    "aliases": [
      "HistoryBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ArchivedBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-badge",
    "displayName": "Generic Badge",
    "canonicalName": "Badge",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Generic pill badge for labels, tiers, and roles.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.radius.semantic.badge",
    "aliases": [
      "LabelBadge",
      "PillBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Badge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-tag",
    "displayName": "Tag",
    "canonicalName": "Tag",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Compact keyword or attribute tag.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.radius.semantic.pill",
    "aliases": [
      "Chip",
      "AttributeTag"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Tag",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-16-permissionstate",
    "displayName": "Permission State Badge",
    "canonicalName": "PermissionState",
    "category": "16. Status / Badges / Tags",
    "categoryNumber": "16",
    "description": "Security access level badge (Read, Write, SuperAdmin).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.info",
    "aliases": [
      "RoleBadge",
      "AccessBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "PermissionState",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-17-alert",
    "displayName": "Alert (Base Banner)",
    "canonicalName": "Alert",
    "category": "17. Feedback / Messages",
    "categoryNumber": "17",
    "description": "Inline notification banner with icon and message.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.info",
    "aliases": [
      "AlertBanner",
      "NoticeBanner",
      "NotificationBox"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Alert",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-17-successalert",
    "displayName": "Success Alert",
    "canonicalName": "SuccessAlert",
    "category": "17. Feedback / Messages",
    "categoryNumber": "17",
    "description": "Emerald banner confirming successful operation in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.success",
    "aliases": [
      "GreenAlert",
      "SuccessBanner"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "SuccessAlert",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-17-erroralert",
    "displayName": "Error Alert",
    "canonicalName": "ErrorAlert",
    "category": "17. Feedback / Messages",
    "categoryNumber": "17",
    "description": "Rose banner explaining failed operation in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "FailureBanner",
      "DangerAlert"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ErrorAlert",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-17-warningalert",
    "displayName": "Warning Alert",
    "canonicalName": "WarningAlert",
    "category": "17. Feedback / Messages",
    "categoryNumber": "17",
    "description": "Amber banner warning of potential conflicts in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.warning",
    "aliases": [
      "AmberAlert",
      "CautionBanner"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "WarningAlert",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-17-infoalert",
    "displayName": "Info Alert",
    "canonicalName": "InfoAlert",
    "category": "17. Feedback / Messages",
    "categoryNumber": "17",
    "description": "Blue banner providing neutral guidance in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.info",
    "aliases": [
      "InformationBanner",
      "BlueAlert"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "InfoAlert",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-17-toast",
    "displayName": "Toast",
    "canonicalName": "Toast",
    "category": "17. Feedback / Messages",
    "categoryNumber": "17",
    "description": "Floating temporary notification toast at bottom right of screen.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.zIndex.toast",
    "aliases": [
      "FloatingToast",
      "Snackbar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Toast",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-17-validationmessage",
    "displayName": "Validation Message",
    "canonicalName": "ValidationMessage",
    "category": "17. Feedback / Messages",
    "categoryNumber": "17",
    "description": "Form field specific error or warning prompt.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "InlineError",
      "FieldValidation"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ValidationMessage",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-loadingstate",
    "displayName": "Loading State",
    "canonicalName": "LoadingState",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "Full-page or container loading state wrapper.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.motion.duration",
    "aliases": [
      "PageLoading",
      "ContainerLoading"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "LoadingState",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-skeleton",
    "displayName": "Skeleton",
    "canonicalName": "Skeleton",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "Pulsing placeholder shapes matching layout structure.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.motion.duration",
    "aliases": [
      "PlaceholderSkeleton",
      "Shimmer"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Skeleton",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-spinner",
    "displayName": "Spinner",
    "canonicalName": "Spinner",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "Circular loading animation spinner for buttons and cards.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "CircularProgress",
      "LoadingSpinner"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Spinner",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-emptystate",
    "displayName": "Empty State",
    "canonicalName": "EmptyState",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "Card with illustration, title, and action for empty lists.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "EmptyListCard",
      "ZeroData"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "EmptyState",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-noresultsstate",
    "displayName": "No Results State / No Connections State",
    "canonicalName": "NoResultsState",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "Empty state when search query yields no matching rows or an entity has 0 connected units.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "NoConnectionsState",
      "EmptySearchState",
      "ZeroResults"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "NoResultsState",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-errorstate",
    "displayName": "Error State",
    "canonicalName": "ErrorState",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "Error card with retry button when API fails to load.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "ApiErrorCard",
      "RetryState"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ErrorState",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-accessdenied",
    "displayName": "Access Denied (403)",
    "canonicalName": "AccessDenied",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "403 Access Denied screen when lacking IAM capabilities.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "ForbiddenScreen",
      "PermissionDenied"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AccessDenied",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-18-notfoundstate",
    "displayName": "Not Found State (404)",
    "canonicalName": "NotFoundState",
    "category": "18. Loading / Empty / Error States",
    "categoryNumber": "18",
    "description": "404 record not found display card.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/feedback/FeedbackStates.tsx",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "404State",
      "MissingRecord"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "NotFoundState",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-19-treeview",
    "displayName": "Tree View",
    "canonicalName": "TreeView",
    "category": "19. Hierarchy",
    "categoryNumber": "19",
    "description": "Collapsible tree structure representing multi-level organization.",
    "status": "LIVE",
    "sharedSource": "apps/web/components/HierarchyScopePickerModal.tsx",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "HierarchyTree",
      "OrgChart"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TreeView",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-19-treenode",
    "displayName": "Tree Node",
    "canonicalName": "TreeNode",
    "category": "19. Hierarchy",
    "categoryNumber": "19",
    "description": "Single node in hierarchy tree (HO, Region, School, Branch).",
    "status": "LIVE",
    "sharedSource": "apps/web/components/HierarchyScopePickerModal.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "TreeBranch",
      "OrgNode"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TreeNode",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-19-hierarchypath",
    "displayName": "Hierarchy Path",
    "canonicalName": "HierarchyPath",
    "category": "19. Hierarchy",
    "categoryNumber": "19",
    "description": "Visual breadcrumb showing current node lineage.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/headers/AdminPageHeader.tsx",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "NodeLineage",
      "OrgTrail"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "HierarchyPath",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-19-workingcontexttree",
    "displayName": "Working Context Tree / Scope Selector",
    "canonicalName": "WorkingContextTree",
    "category": "19. Hierarchy",
    "categoryNumber": "19",
    "description": "Modal tree and dropdown allowing selection of working campus.",
    "status": "LIVE",
    "sharedSource": "apps/web/components/WorkingContextPicker.tsx",
    "tokenSource": "designTokens.zIndex.modal",
    "aliases": [
      "ScopeSelector",
      "CampusSwitcher",
      "ContextModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "WorkingContextTree",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-19-hierarchymultiselect",
    "displayName": "Hierarchy Multi-Select",
    "canonicalName": "HierarchyMultiSelect",
    "category": "19. Hierarchy",
    "categoryNumber": "19",
    "description": "Multi-node organizational tree selection with tri-state checkboxes and search.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/controls/HierarchyMultiSelect.tsx",
    "tokenSource": "designTokens.zIndex.modal",
    "aliases": [
      "HierarchyMultiSelect",
      "TreeMultiSelect",
      "ScopeMultiSelect",
      "CampusMultiSelect",
      "MultiCampusSelector",
      "HierarchyMultiSelection"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "HierarchyMultiSelect",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-20-notificationitem",
    "displayName": "Notification Item",
    "canonicalName": "NotificationItem",
    "category": "20. Notifications",
    "categoryNumber": "20",
    "description": "Single alert item in notification list with timestamp.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "AlertRow"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "NotificationItem",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-20-notificationbadge",
    "displayName": "Notification Badge",
    "canonicalName": "NotificationBadge",
    "category": "20. Notifications",
    "categoryNumber": "20",
    "description": "Red dot counter on top header notification bell.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/AppHeader.tsx",
    "tokenSource": "designTokens.colors.danger",
    "aliases": [
      "UnreadCounter",
      "BellBadge",
      "DotBadge"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "NotificationBadge",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-20-unreadnotification",
    "displayName": "Unread Notification",
    "canonicalName": "UnreadNotification",
    "category": "20. Notifications",
    "categoryNumber": "20",
    "description": "Highlighted unread notification row.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "HighlightedAlert"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "UnreadNotification",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-20-notificationpopover",
    "displayName": "Notification Popover",
    "canonicalName": "NotificationPopover",
    "category": "20. Notifications",
    "categoryNumber": "20",
    "description": "Dropdown container showing recent notification feed.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.popover",
    "aliases": [
      "AlertFeedDropdown"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "NotificationPopover",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-21-auditviewer",
    "displayName": "Audit Viewer / Audit Summary",
    "canonicalName": "AuditViewer",
    "category": "21. Audit / History",
    "categoryNumber": "21",
    "description": "Footer bar displaying creation author and last edit timestamp.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/details/DetailsLayoutDemo.tsx",
    "tokenSource": "designTokens.typography.semantic.helper",
    "aliases": [
      "AuditSummary",
      "TimestampStamp",
      "ModificationLog"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "AuditViewer",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-21-changediff",
    "displayName": "Change Diff",
    "canonicalName": "ChangeDiff",
    "category": "21. Audit / History",
    "categoryNumber": "21",
    "description": "Visual before/after diff viewer for record field updates.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.colors.warning",
    "aliases": [
      "BeforeAfterDiff",
      "VersionComparison"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ChangeDiff",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-21-historymodal",
    "displayName": "History Modal",
    "canonicalName": "HistoryModal",
    "category": "21. Audit / History",
    "categoryNumber": "21",
    "description": "Modal displaying full audit log revisions of an entity.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.modals.width.wide",
    "aliases": [
      "RevisionHistory",
      "AuditLogModal"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "HistoryModal",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-22-progressbar",
    "displayName": "Progress Bar",
    "canonicalName": "ProgressBar",
    "category": "22. Workflow / Progress",
    "categoryNumber": "22",
    "description": "Linear completion percentage bar (0% - 100%).",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "LinearProgress"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ProgressBar",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-22-stepprogress",
    "displayName": "Step Progress / Workflow Stepper",
    "canonicalName": "StepProgress",
    "category": "22. Workflow / Progress",
    "categoryNumber": "22",
    "description": "Multi-stage workflow tracker with step circles.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "WorkflowStepper",
      "MultiStepTracker"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "StepProgress",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-22-approvalstatus",
    "displayName": "Approval Status",
    "canonicalName": "ApprovalStatus",
    "category": "22. Workflow / Progress",
    "categoryNumber": "22",
    "description": "Current workflow state badge (Under Review, Approved).",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/badges/StatusBadge.tsx",
    "tokenSource": "designTokens.colors.warning",
    "aliases": [
      "WorkflowBadge",
      "DecisionState"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ApprovalStatus",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-22-approvalactions",
    "displayName": "Approval Actions",
    "canonicalName": "ApprovalActions",
    "category": "22. Workflow / Progress",
    "categoryNumber": "22",
    "description": "Approve / Reject decision buttons toolbar.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/actions/RowActions.tsx",
    "tokenSource": "designTokens.controls.rowAction",
    "aliases": [
      "DecisionButtons",
      "ApproveRejectBar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ApprovalActions",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-22-kanbancard",
    "displayName": "Kanban Card",
    "canonicalName": "KanbanCard",
    "category": "22. Workflow / Progress",
    "categoryNumber": "22",
    "description": "Draggable card in workflow board stages.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.shadows.card",
    "aliases": [
      "TaskCard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "KanbanCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-23-calendarview",
    "displayName": "Calendar View",
    "canonicalName": "CalendarView",
    "category": "23. Calendar / Scheduling",
    "categoryNumber": "23",
    "description": "Monthly/weekly academic term and timetable grid.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "TimetableGrid",
      "AcademicCalendar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "CalendarView",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-23-calendarevent",
    "displayName": "Calendar Event",
    "canonicalName": "CalendarEvent",
    "category": "23. Calendar / Scheduling",
    "categoryNumber": "23",
    "description": "Color-coded scheduled class or exam slot.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.colors.primary",
    "aliases": [
      "ScheduledSlot"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "CalendarEvent",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-23-schedulecard",
    "displayName": "Schedule Card",
    "canonicalName": "ScheduleCard",
    "category": "23. Calendar / Scheduling",
    "categoryNumber": "23",
    "description": "Daily routine schedule summary card.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.shadows.card",
    "aliases": [
      "DailyRoutine"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ScheduleCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-23-timeslot",
    "displayName": "Time Slot",
    "canonicalName": "TimeSlot",
    "category": "23. Calendar / Scheduling",
    "categoryNumber": "23",
    "description": "Individual period interval block in timetable.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "PeriodBlock"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "TimeSlot",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-23-datenavigator",
    "displayName": "Date Navigator",
    "canonicalName": "DateNavigator",
    "category": "23. Calendar / Scheduling",
    "categoryNumber": "23",
    "description": "Prev/Next date switcher with current month label.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.buttonHeight",
    "aliases": [
      "MonthSwitcher"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "DateNavigator",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-chartcard",
    "displayName": "Chart Card",
    "canonicalName": "ChartCard",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Analytics chart container card with header and actions.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.shadows.card",
    "aliases": [
      "AnalyticsContainer"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ChartCard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-chartheader",
    "displayName": "Chart Header",
    "canonicalName": "ChartHeader",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Chart title, subtitle, and date filter dropdown.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.typography.semantic.sectionTitle",
    "aliases": [
      "ChartTitleBar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ChartHeader",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-chartlegend",
    "displayName": "Chart Legend",
    "canonicalName": "ChartLegend",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Series color indicators and toggle switches.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "SeriesLegend"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ChartLegend",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-trendindicator",
    "displayName": "Trend Indicator",
    "canonicalName": "TrendIndicator",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Percentage growth indicator arrow with green/red tint.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/cards/StatCard.tsx",
    "tokenSource": "designTokens.colors.success",
    "aliases": [
      "GrowthBadge",
      "DeltaIndicator"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "TrendIndicator",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-reportfilterbar",
    "displayName": "Report Filter Bar",
    "canonicalName": "ReportFilterBar",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Date and branch scoping toolbar for report generation.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/filters/AdminFilterBar.tsx",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "AnalyticsToolbar"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ReportFilterBar",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-reporttable",
    "displayName": "Report Table",
    "canonicalName": "ReportTable",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Aggregated financial and student enrollment data table.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/tables/AdminTable.tsx",
    "tokenSource": "designTokens.spacing.tableCellPadding",
    "aliases": [
      "FinancialReportGrid",
      "AggregatedTable"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ReportTable",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-exportmenu",
    "displayName": "Export Menu",
    "canonicalName": "ExportMenu",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Dropdown menu to export data as CSV, Excel, or PDF.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "DownloadMenu",
      "CsvExport"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ExportMenu",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-24-printaction",
    "displayName": "Print Action",
    "canonicalName": "PrintAction",
    "category": "24. Dashboard / Reporting",
    "categoryNumber": "24",
    "description": "Trigger formatted printable invoice or roster layout.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.buttonHeight",
    "aliases": [
      "PrintChallanButton"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "PrintAction",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-25-tooltip",
    "displayName": "Tooltip / Help Tooltip",
    "canonicalName": "Tooltip",
    "category": "25. Help / Utility",
    "categoryNumber": "25",
    "description": "Hover popover explaining icon buttons and onboarding guidance.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.popover",
    "aliases": [
      "HelpTooltip",
      "InfoTooltip",
      "HoverHint"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "Tooltip",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-25-infohint",
    "displayName": "Info Hint",
    "canonicalName": "InfoHint",
    "category": "25. Help / Utility",
    "categoryNumber": "25",
    "description": "Subtle inline hint text below form controls.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/forms/FormLayout.tsx",
    "tokenSource": "designTokens.typography.semantic.helper",
    "aliases": [
      "FieldGuidance",
      "InlineTip"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "InfoHint",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-25-divider",
    "displayName": "Divider",
    "canonicalName": "Divider",
    "category": "25. Help / Utility",
    "categoryNumber": "25",
    "description": "Horizontal line separating sections or card blocks.",
    "status": "LIVE",
    "sharedSource": "packages/ui-kit/src/tokens.ts",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "Separator",
      "HorizontalRule"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "Divider",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-25-shortcuthint",
    "displayName": "Shortcut Hint",
    "canonicalName": "ShortcutHint",
    "category": "25. Help / Utility",
    "categoryNumber": "25",
    "description": "Keyboard key badge (e.g. ⌘K, Esc) indicating hotkeys.",
    "status": "LIVE",
    "sharedSource": "apps/web/design-system/components/layout/AppHeader.tsx",
    "tokenSource": "designTokens.typography.size.xs",
    "aliases": [
      "KeyboardBadge",
      "Hotkey"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "ShortcutHint",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-commentcomposer",
    "displayName": "Comment Composer",
    "canonicalName": "CommentComposer",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Rich text comment box for application notes.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "DiscussionBox"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "CommentComposer",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-mentioninput",
    "displayName": "Mention Input",
    "canonicalName": "MentionInput",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "@username mention autocomplete in communications.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.zIndex.dropdown",
    "aliases": [
      "UserMention"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "MentionInput",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-richtexteditor",
    "displayName": "Rich Text Editor",
    "canonicalName": "RichTextEditor",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "WYSIWYG editor for email templates and announcements.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.radius.semantic.card",
    "aliases": [
      "WysiwygEditor"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "RichTextEditor",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-filemanager",
    "displayName": "File Manager",
    "canonicalName": "FileManager",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Multi-folder institutional document library browser.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "DocumentLibrary"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "FileManager",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-reportviewer",
    "displayName": "Report Viewer",
    "canonicalName": "ReportViewer",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Full-page paginated report display canvas.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing.pagePadding",
    "aliases": [
      "PrintCanvas"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ReportViewer",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-printlayout",
    "displayName": "Print Layout",
    "canonicalName": "PrintLayout",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "A4 print preview CSS template for fee challans.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing.pagePadding",
    "aliases": [
      "A4FeeChallan"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "PrintLayout",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-dynamicformbuilder",
    "displayName": "Dynamic Form Builder",
    "canonicalName": "DynamicFormBuilder",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Drag-and-drop dynamic form schema designer.",
    "status": "LIVE",
    "sharedSource": "apps/web/app/(admin)/admin-config/form-builder/page.tsx",
    "tokenSource": "designTokens.spacing.formSectionGap",
    "aliases": [
      "FormDesigner",
      "SchemaBuilder"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DynamicFormBuilder",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-draggablefield",
    "displayName": "Draggable Field",
    "canonicalName": "DraggableField",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Form builder palette field item in isolation.",
    "status": "LIVE",
    "sharedSource": "apps/web/app/(admin)/admin-config/form-builder/page.tsx",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "PaletteItem"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "CampusOS Design System",
      "Legacy Consumers (Migration Pending)"
    ],
    "previewType": "DraggableField",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-kanbanboard",
    "displayName": "Kanban Board",
    "canonicalName": "KanbanBoard",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Multi-column task and application pipeline board.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.spacing.cardPadding",
    "aliases": [
      "PipelineBoard"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "KanbanBoard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-timelineview",
    "displayName": "Timeline View",
    "canonicalName": "TimelineView",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Horizontal Gantt or event timeline.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.borders",
    "aliases": [
      "GanttChart"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "TimelineView",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-importwizard",
    "displayName": "Import Wizard",
    "canonicalName": "ImportWizard",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Step-by-step CSV/Excel student and employee bulk importer.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.modals.width.wide",
    "aliases": [
      "BulkCsvImporter"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ImportWizard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-exportwizard",
    "displayName": "Export Wizard",
    "canonicalName": "ExportWizard",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "Customizable report export column selection wizard.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.modals.width.wide",
    "aliases": [
      "ReportExporter"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ExportWizard",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  },
  {
    "id": "std-26-columnmapper",
    "displayName": "Column Mapper",
    "canonicalName": "ColumnMapper",
    "category": "26. Advanced / Future ERP Components",
    "categoryNumber": "26",
    "description": "CSV column to database schema mapping UI.",
    "status": "PLANNED",
    "sharedSource": "Pending Implementation",
    "tokenSource": "designTokens.controls.inputHeight",
    "aliases": [
      "FieldMappingUi"
    ],
    "variants": [
      "Standard",
      "Compact",
      "Comfortable"
    ],
    "states": [
      "normal",
      "hover",
      "active",
      "disabled"
    ],
    "usedIn": [
      "Migration Pending"
    ],
    "previewType": "ColumnMapper",
    "overrideSupport": {
      "globalDefault": true,
      "moduleVariant": true,
      "pageVariant": true,
      "explicitException": true
    }
  }
];
