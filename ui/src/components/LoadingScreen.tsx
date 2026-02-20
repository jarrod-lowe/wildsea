import { ReactNode } from 'react';

interface LoadingScreenProps {
  message: ReactNode;
  testId?: string;
}

export function LoadingScreen({ message, testId }: LoadingScreenProps) {
  return (
    <div className="loading-screen" data-testid={testId ?? 'loading-screen'}>
      <div className="loading-spinner" role="status" aria-label="Loading" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
