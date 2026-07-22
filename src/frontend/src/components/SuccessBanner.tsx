import { useEffect, useState } from "react";

interface SuccessBannerProps {
  /** Text to display while the banner is visible. */
  message: string;
  /** Called once the fade-out transition finishes, so the caller can unmount/clear the banner. */
  onDone: () => void;
}

/**
 * Transient confirmation banner. Shows immediately, holds for a beat, then
 * eases out — `onDone()` fires once the fade transition actually finishes.
 */
export function SuccessBanner({ message, onDone }: SuccessBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`success-banner${isVisible ? "" : " success-banner-hidden"}`}
      role="status"
      onTransitionEnd={(event) => {
        if (event.propertyName === "opacity" && !isVisible) {
          onDone();
        }
      }}
    >
      {message}
    </div>
  );
}
