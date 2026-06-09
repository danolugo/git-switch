interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="banner banner-error">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="btn btn-danger" onClick={onRetry}>
          [ retry ]
        </button>
      ) : null}
    </div>
  );
}
