# PrePa design system

## Foundations

- **Brand:** Deep Navy `#001832`, Royal Blue `#012A63`, Bright Cyan `#0A89D5`, Sky Blue `#53B8E5`, and Lime `#C0F279` for intentional positive emphasis.
- **Typography:** Inter system stack. Use the global display/H1/H2/H3 scale; body text is 16px with a 1.55 line-height.
- **Spacing:** `--space-1` through `--space-10` follow a 4px rhythm. Page gutters use `--page-gutter`.
- **Radius:** `--radius-sm`, `--radius-md`, `--radius-lg`, and `--radius-full`. Cards are not pills.
- **Elevation:** `--shadow-sm`, `--shadow-md`, and `--shadow-lg`; prefer borders and subtle elevation.

## Reusable primitives

- `Button` (`components/ui/button.tsx`): primary, secondary, outline, ghost, destructive, and success variants; supports `loading`.
- `Badge`, `Alert`, `EmptyState`, and `PageLoading` (`components/ui/state.tsx`).
- CSS classes: `ui-card`, `ui-card--interactive`, `ui-card--dark`, `ui-input`, `ui-field`, `ui-skeleton`, `ui-dialog`, and `ui-tooltip` are available for future phases.

## Interaction and accessibility

- All interactive controls use a visible cyan focus ring via `:focus-visible`.
- Motion is limited to short opacity, color, and transform transitions and is disabled under `prefers-reduced-motion`.
- Use semantic labels for fields, native buttons for actions, and `role="alert"` only for errors.
- Maintain sufficient contrast; lime is reserved for accents/success, never primary body text.

## Responsive principles

- Use the page gutter and spacing tokens instead of arbitrary margins.
- Grids collapse at the supplied 900px and 620px breakpoints.
- Keep tap targets at least 44px high and allow action groups to wrap.
