import { useEffect, useRef, useState } from "react";

export const PDF_PAGE_WIDTH = 1055;
export const PDF_PAGE_HEIGHT = 1491;

/**
 * The composition always lives on the fixed design canvas.  Only this outer
 * wrapper changes size in the on-screen preview, so page coordinates remain
 * identical on desktop, mobile and when printing.
 */
export default function PdfPage({
  children,
  ariaLabel,
  pageClassName = "",
  as: Element = "section",
}) {
  const itemRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return undefined;

    const updateScale = () => {
      // The item has no horizontal padding. Its content box is therefore the
      // actual width left by the preview viewport after that viewport padding.
      const availableWidth = item.clientWidth || 0;
      const nextScale = Math.min(availableWidth / PDF_PAGE_WIDTH, 1);

      if (Number.isFinite(nextScale) && nextScale > 0) {
        setScale((current) => (Math.abs(current - nextScale) < 0.0001 ? current : nextScale));
      }
    };

    updateScale();

    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateScale);
    observer?.observe(item);
    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, []);

  const scaledWidth = PDF_PAGE_WIDTH * scale;
  const scaledHeight = PDF_PAGE_HEIGHT * scale;

  return (
    <Element ref={itemRef} className="pdf-preview-item" aria-label={ariaLabel}>
      <div
        className="pdf-page-scaler"
        style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
      >
        <div
          className={`pdf-page ${pageClassName}`.trim()}
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </Element>
  );
}
