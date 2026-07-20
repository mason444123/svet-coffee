---
name: Luminous Minimalism
colors:
  surface: '#fef8f4'
  surface-dim: '#ded9d5'
  surface-bright: '#fef8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2ef'
  surface-container: '#f3ede9'
  surface-container-high: '#ede7e3'
  surface-container-highest: '#e7e1de'
  on-surface: '#1d1b19'
  on-surface-variant: '#4d4540'
  inverse-surface: '#32302e'
  inverse-on-surface: '#f6f0ec'
  outline: '#7f7570'
  outline-variant: '#d0c4be'
  surface-tint: '#645d59'
  primary: '#171310'
  on-primary: '#ffffff'
  primary-container: '#2c2724'
  on-primary-container: '#968d89'
  inverse-primary: '#cec5c0'
  secondary: '#5e5e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdb'
  on-secondary-container: '#63635f'
  tertiary: '#141410'
  on-tertiary: '#ffffff'
  tertiary-container: '#292824'
  on-tertiary-container: '#918f89'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebe0dc'
  primary-fixed-dim: '#cec5c0'
  on-primary-fixed: '#1f1b18'
  on-primary-fixed-variant: '#4c4642'
  secondary-fixed: '#e4e2dd'
  secondary-fixed-dim: '#c8c6c2'
  on-secondary-fixed: '#1b1c19'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#e6e2db'
  tertiary-fixed-dim: '#cac6bf'
  on-tertiary-fixed: '#1c1c17'
  on-tertiary-fixed-variant: '#484742'
  background: '#fef8f4'
  on-background: '#1d1b19'
  surface-variant: '#e7e1de'
typography:
  headline-xl:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

The brand identity centers on the concept of "Свет" (Light)—purity, warmth, and the quiet ritual of a morning coffee. The design system evokes a sense of calm and high-end sophistication, targeting a discerning audience that values slow living and aesthetic precision.

The visual style is **High-End Minimalism** with a focus on negative space and architectural clarity. It avoids clutter, using generous white space to allow high-quality imagery to act as the primary visual anchor. The interface should feel breathable and weightless, mirroring the experience of a sun-drenched, minimalist cafe interior. Emotional responses should range from serene and professional to welcoming and premium.

## Colors

The palette is rooted in organic, light-reflective tones. 
- **Primary:** A deep, roasted coffee-brown (#2C2724) used exclusively for typography and high-emphasis iconography to ensure grounded legibility.
- **Secondary:** A soft cream (#F9F7F2) serving as the main canvas color to reduce the harshness of pure white while maintaining an airy feel.
- **Tertiary:** A warm light gray (#E5E1DA) used for subtle containers, dividers, and background depth.
- **Neutral:** A muted taupe-gray (#8C8885) for secondary text and UI elements that require less prominence.

The interaction of these colors should mimic natural light hitting various surfaces, avoiding high-saturation tones in favor of a sophisticated, tonal harmony.

## Typography

This design system utilizes a sophisticated typographic pairing to balance tradition and modernity. 

**Libre Caslon Text** is used for headlines to convey editorial elegance and "Style." It should be set with tight tracking in larger sizes to emphasize its classical proportions. 

**DM Sans** provides a clean, geometric contrast for body copy and UI labels. It ensures maximum readability and a contemporary feel. Use uppercase styling for small labels and navigation items to introduce a rhythmic, structured quality to the layout. Large headlines must transition to mobile-specific sizes to maintain the "airy" feel without overwhelming the smaller viewport.

## Layout & Spacing

The layout philosophy is based on a **Fixed Grid** for desktop to maintain strict editorial control, transitioning to a fluid model for smaller breakpoints.

- **Desktop (1440px+):** 12-column grid with 64px side margins. Use wide gutters to prevent content density.
- **Tablet (768px - 1024px):** 8-column grid with 40px margins.
- **Mobile (Under 768px):** 4-column fluid grid with 20px margins.

Spacing should be intentionally generous. Vertical rhythm is driven by "Section Gaps" of 120px+, creating a gallery-like experience where each piece of content has its own breathing room. Elements should often be offset or asymmetrical to mimic the organic nature of light and shadows.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layers** and **Ambient Shadows** rather than traditional elevation.

Surfaces should feel like light-colored stone or matte paper. Use very soft, diffused shadows (Blur: 30px-60px, Opacity: 3-5%) with a slight warm tint (#2C2724) to suggest objects resting gently on a surface. 

Avoid heavy borders. Instead, use thin, low-contrast outlines (1px, Tertiary color) or subtle shifts in background color to define boundaries. High-quality imagery should occasionally "break" the grid or overlap subtle cream containers to create a sense of physical layering.

## Shapes

The shape language is **Soft (Level 1)**. While the brand is minimalist and structured, sharp 0px corners are avoided to maintain a welcoming, "human" atmosphere. 

Standard components (buttons, input fields) use a 4px (0.25rem) radius. Larger cards or featured image containers may use an 8px (0.5rem) radius. This subtle rounding provides a premium, tailored feel that mimics high-end furniture or stationery without appearing "bubbly" or overly casual.

## Components

### Buttons
Primary buttons are solid Primary Color (#2C2724) with white text, featuring a subtle hover lift. Secondary buttons use a "Ghost" style with a 1px border in the Primary Color. All buttons use the `label-md` typographic style.

### Input Fields
Minimalist execution: A single bottom border (1px, Tertiary Color) that darkens on focus. Labels sit above the field in `label-sm` style. Error states are indicated by a shift to a muted terracotta, avoiding bright "system" reds.

### Cards
Cards are defined by a shift in background color to Tertiary (#E5E1DA) or by the use of an Ambient Shadow on a Secondary (#F9F7F2) background. Content within cards must maintain the 24px internal padding.

### Chips & Tags
Small, pill-shaped elements with Tertiary backgrounds and Neutral text. Used for coffee notes (e.g., "Fruity," "Light Roast") to provide information without visual noise.

### Imagery
Images are a core component. They should be high-resolution, featuring natural lighting, soft focus backgrounds, and a warm color grade. Large, full-bleed hero sections are encouraged to establish the "Luminous" brand narrative.