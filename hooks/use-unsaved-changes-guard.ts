'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Warns on tab close/reload, browser back, and offers a confirm flow before in-app navigation.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  options?: { message?: string }
) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const allowLeaveRef = useRef(false);
  const historyTrapPushedRef = useRef(false);
  const backNavigationRef = useRef(false);

  /** Re-arm the guard after the user edits again (confirmLeave sets allowLeaveRef once). */
  useEffect(() => {
    if (isDirty) {
      allowLeaveRef.current = false;
    }
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || allowLeaveRef.current) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || allowLeaveRef.current) {
      historyTrapPushedRef.current = false;
      return;
    }

    if (!historyTrapPushedRef.current) {
      window.history.pushState(
        { __unsavedGuard: true },
        '',
        window.location.href
      );
      historyTrapPushedRef.current = true;
    }

    const onPopState = () => {
      if (allowLeaveRef.current) return;

      backNavigationRef.current = true;
      pendingActionRef.current = () => {
        allowLeaveRef.current = true;
        historyTrapPushedRef.current = false;
        window.history.back();
      };
      setLeaveOpen(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isDirty]);

  const requestLeave = useCallback(
    (action: () => void) => {
      if (allowLeaveRef.current || !isDirty) {
        action();
        return;
      }
      backNavigationRef.current = false;
      pendingActionRef.current = action;
      setLeaveOpen(true);
    },
    [isDirty]
  );

  const confirmLeave = useCallback(() => {
    setLeaveOpen(false);
    const action = pendingActionRef.current;
    const isBackNav = backNavigationRef.current;
    pendingActionRef.current = null;
    backNavigationRef.current = false;
    action?.();
    // Re-arm after in-app discard (product/tab change). Browser-back actions set allow inside action.
    if (!isBackNav) {
      allowLeaveRef.current = false;
      historyTrapPushedRef.current = false;
    }
  }, []);

  const cancelLeave = useCallback(() => {
    setLeaveOpen(false);
    pendingActionRef.current = null;

    if (backNavigationRef.current && isDirty && !allowLeaveRef.current) {
      backNavigationRef.current = false;
      window.history.pushState(
        { __unsavedGuard: true },
        '',
        window.location.href
      );
      historyTrapPushedRef.current = true;
    }
  }, [isDirty]);

  /** Allow one navigation while still dirty (e.g. after save then redirect). */
  const allowNextNavigation = useCallback(() => {
    allowLeaveRef.current = true;
    historyTrapPushedRef.current = false;
    backNavigationRef.current = false;
  }, []);

  return {
    leaveOpen,
    leaveMessage:
      options?.message ??
      'You have unsaved changes. Leave this page without saving?',
    requestLeave,
    confirmLeave,
    cancelLeave,
    allowNextNavigation,
  };
}
