interface LoadingProps {
  /** Text shown next to the spinner. Defaults to `"Loading..."`. */
  message?: string;
}

/** Spinner with a status message, for in-progress fetches. */
export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="loading">
      <span className="loading-spinner" />
      <span>{message}</span>
    </div>
  );
}
