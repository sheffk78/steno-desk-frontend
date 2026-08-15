/**
 * SkipToContent — visually-hidden link that appears on focus.
 * Accessibility: keyboard users can jump directly to #main-content.
 */
export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#1F2937] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
      data-testid="skip-to-content"
    >
      Skip to content
    </a>
  );
}