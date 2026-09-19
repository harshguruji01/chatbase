import { useEffect } from 'react';
import { backNavigation, type BackHandlerFn } from './backNavigation';

/**
 * Hook to register a back action for a component when active.
 * Automatically unregisters when the component unmounts or active becomes false.
 */
export const useBackButton = (
  handler: BackHandlerFn,
  isActive: boolean = true,
  priority: number = 20
) => {
  useEffect(() => {
    if (!isActive) return;
    const unregister = backNavigation.register(handler, priority);
    return () => {
      unregister();
    };
  }, [handler, isActive, priority]);
};
