import { useCallback, useEffect, useRef, useState } from "react";
export interface Notice {
  id: number;
  message: string;
  undo?: () => void;
}
export function useToast() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setNotice(null);
  }, []);
  const notify = useCallback((message: string, undo?: () => void) => {
    clearTimeout(timer.current);
    setNotice({ id: ++sequence.current, message, undo });
    timer.current = setTimeout(() => setNotice(null), 7000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { notice, notify, dismiss };
}
