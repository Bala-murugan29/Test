import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAntiCheatOptions {
  onAutoSubmit: () => void;
  maxViolations?: number;
}

export function useAntiCheat({ onAutoSubmit, maxViolations = 3 }: UseAntiCheatOptions) {
  const [violations, setViolations] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(
    typeof document !== 'undefined' ? !!document.fullscreenElement : true
  );
  const { toast } = useToast();
  
  const onAutoSubmitRef = useRef(onAutoSubmit);
  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  const handleViolation = useCallback((reason: string) => {
    setViolations((prev) => {
      const next = prev + 1;
      
      if (next >= maxViolations) {
        toast({
          title: "Exam Auto-Submitted",
          description: `You have reached the maximum number of violations (${maxViolations}).`,
          variant: "destructive",
        });
        onAutoSubmitRef.current();
      } else {
        toast({
          title: "Warning: Violation Detected",
          description: `${reason}. Violation ${next} of ${maxViolations}.`,
          variant: "destructive",
        });
      }
      
      return next;
    });
  }, [maxViolations, toast]);

  useEffect(() => {
    // 1. Full-screen mode request
    const requestFullScreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Could not request full screen", err);
      }
    };
    
    const handleFullScreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullScreen(isFull);
      
      // If they were just in full screen and exited, it's a violation.
      // (The browser allows exiting via ESC).
      if (!isFull) {
        handleViolation("Exiting full screen is not allowed");
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    // We try to request fullscreen on the first click
    const handleFirstInteraction = () => {
      requestFullScreen();
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);

    // 2. Disable right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });

    // 3. Disable copy-paste & text selection
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      handleViolation("Copy/Paste is disabled during the exam");
    };
    window.addEventListener('copy', handleCopyPaste, { capture: true });
    window.addEventListener('cut', handleCopyPaste, { capture: true });
    window.addEventListener('paste', handleCopyPaste, { capture: true });

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.closest('.monaco-editor') ||
        target.closest('.react-monaco-editor-container')
      ) {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener('selectstart', handleSelectStart, { capture: true });

    // 4. Disable specific keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C, Ctrl+V, Ctrl+S, Ctrl+U
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 's', 'u'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handleViolation(`Keyboard shortcut Ctrl+${e.key.toUpperCase()} is disabled`);
          return;
        }
      }
      // F12 or Ctrl+Shift+I
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleViolation("Developer tools are disabled");
        return;
      }
      // Alt+F4 (Mostly handled by OS, but we can intercept it in some browsers)
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleViolation("Closing the window is not allowed");
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    // 5. Warn on tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation("Tab switching or minimizing the browser is not allowed");
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange, { capture: true });
    
    const handleBlur = () => {
      // Ignore blur if it's clicking inside the document (like an iframe)
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        return;
      }
      
      // Use a small timeout to distinguish between native dropdowns (which might blur briefly)
      // and actually leaving the browser window.
      setTimeout(() => {
        if (!document.hasFocus()) {
          handleViolation("Switching away from the exam window is not allowed");
        }
      }, 100);
    };
    window.addEventListener('blur', handleBlur, { capture: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('copy', handleCopyPaste, { capture: true });
      window.removeEventListener('cut', handleCopyPaste, { capture: true });
      window.removeEventListener('paste', handleCopyPaste, { capture: true });
      window.removeEventListener('selectstart', handleSelectStart, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange, { capture: true });
      window.removeEventListener('blur', handleBlur, { capture: true });
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn(err));
      }
    };
  }, [handleViolation]);

  return { violations, isFullScreen, requestFullScreen: () => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    }
  } };
}
