---
name: Artisan Brew System
colors:
  surface: '#fff8f4'
  surface-dim: '#f5d5ab'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e4'
  surface-container: '#ffebd3'
  surface-container-high: '#ffe4c2'
  surface-container-highest: '#feddb3'
  on-surface: '#281801'
  on-surface-variant: '#504442'
  inverse-surface: '#402d10'
  inverse-on-surface: '#ffeedb'
  outline: '#827472'
  outline-variant: '#d3c3c0'
  surface-tint: '#745853'
  primary: '#271310'
  on-primary: '#ffffff'
  primary-container: '#3e2723'
  on-primary-container: '#ae8d87'
  inverse-primary: '#e3beb8'
  secondary: '#5e604d'
  on-secondary: '#ffffff'
  secondary-container: '#e1e1c9'
  on-secondary-container: '#636451'
  tertiary: '#141b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#273103'
  on-tertiary-container: '#8d9a61'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#e3beb8'
  on-primary-fixed: '#2b1613'
  on-primary-fixed-variant: '#5b403c'
  secondary-fixed: '#e4e4cc'
  secondary-fixed-dim: '#c8c8b0'
  on-secondary-fixed: '#1b1d0e'
  on-secondary-fixed-variant: '#474836'
  tertiary-fixed: '#dbe9a9'
  tertiary-fixed-dim: '#bfcd8f'
  on-tertiary-fixed: '#171e00'
  on-tertiary-fixed-variant: '#404b1b'
  background: '#fff8f4'
  on-background: '#281801'
  surface-variant: '#feddb3'
typography:
  display-lg:
    fontFamily: notoSerif
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg:
    fontFamily: notoSerif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: notoSerif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: beVietnamPro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: beVietnamPro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: beVietnamPro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: beVietnamPro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  gutter: 16px
---

## Brand & Style

The brand personality of the design system is centered on "Quiet Luxury"—a sophisticated, calm, and artisanal approach to the coffee-ordering experience. It targets discerning coffee enthusiasts who value quality and ritual over speed and convenience alone.

The visual style is a blend of **Minimalism** and **Tactile** design. It leverages generous whitespace and a restricted, earthy palette to create a sense of breathability, while using subtle shadows and high-quality photography to make the interface feel physical and inviting. The emotional goal is to evoke the warmth of a boutique café, transitioning the user from a state of rush to a state of intentional enjoyment.

## Colors

The design system utilizes a palette inspired by the coffee bean's journey from harvest to cup. 

- **Primary (Espresso):** A deep, rich brown used for primary actions, headings, and high-contrast elements.
- **Secondary (Crema):** A warm, off-white/cream used for main surface backgrounds to reduce eye strain compared to pure white.
- **Tertiary (Botanical):** A muted forest green used for success states, sustainability indicators, and subtle accents.
- **Neutral (Tan):** A soft sand tone used for secondary surfaces, inactive states, and borders.

The default color mode is light, ensuring the "creamy" aesthetic remains the dominant visual theme.

## Typography

The typography strategy pairs the timeless elegance of **notoSerif** for editorial headings with the modern clarity of **beVietnamPro** for functional text. 

Headings should be used sparingly to create a hierarchy of "moments" within the app, such as the name of a blend or a welcoming message. Body text remains highly legible even at small sizes, with a slightly increased line height to maintain a relaxed, premium feel. Labels and buttons use a medium weight in the sans-serif face to ensure clear calls to action.

## Layout & Spacing

This design system employs a **Fluid Grid** model optimized for mobile devices. The layout relies on a 4-column structure for most screens, with 20px side margins to ensure content doesn't feel cramped against the bezel.

The spacing rhythm is built on a 4px baseline grid. Use `lg` (24px) for vertical spacing between distinct content sections and `md` (16px) for internal component padding. Negative space is a key component of the "premium" feel; do not be afraid of generous vertical padding between elements to allow imagery and text to breathe.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Instead of harsh drop shadows, this design system uses soft, multi-layered shadows with a slight warm tint (#3E2723 at 5-10% opacity) to make cards appear as if they are resting gently on the surface.

Lower elevation levels (Level 1) are used for product cards in a list, while higher elevation (Level 2) is reserved for floating buttons or active modals. Additionally, tonal layering—placing a Tan surface on a Crema background—is preferred for less prominent UI elements to maintain a clean, flat appearance without sacrificing structure.

## Shapes

The shape language is consistently **Rounded**, reflecting the organic nature of coffee beans and liquid. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Cards:** Product and promotional cards use a 1rem (16px) radius to create a soft, approachable frame for imagery.
- **Full Rounded:** Small chips, tags, and progress bars use a pill-shaped (full) radius to distinguish them from functional interactive elements.

## Components

### Buttons
Primary buttons use the deep Espresso background with Crema text. Secondary buttons use a Tan border with Espresso text. All buttons feature a 56px height for optimal touch target on mobile.

### Cards
Product cards should feature full-bleed imagery at the top with a 16px padding for the text container below. Use a subtle Level 1 shadow to separate cards from the secondary background.

### Input Fields
Inputs are styled with a soft Tan background and a 1px border that darkens when focused. Use the sans-serif font for placeholders to maintain a functional look.

### Chips & Selectors
Used for milk types, sizes, or flavor profiles. Unselected chips use a Tan background; selected chips transition to the Primary Espresso color with a subtle scale-up animation.

### Lists
Menu items follow a structured list format with high-quality thumbnails. Use a 1px soft Tan divider to separate items without creating visual clutter.

### Steppers & Modifiers
For quantity or customization, use circular icon buttons with thin strokes to maintain a lightweight, sophisticated feel.