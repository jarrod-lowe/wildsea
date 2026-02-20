import { ReactNode } from 'react';

interface LoadingScreenProps {
  readonly message: ReactNode;
  readonly testId?: string;
}

export function LoadingScreen({ message, testId }: LoadingScreenProps) {
  return (
    <div className="loading-screen" data-testid={testId ?? 'loading-screen'}>
      <output className="loading-spinner" aria-label="Loading" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
