'use client';

import { useState, useEffect, useRef } from 'react';

export function useTypewriter(text: string, speed = 25) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const prevTextRef = useRef('');

  useEffect(() => {
    if (text !== prevTextRef.current) {
      setDisplayedText('');
      setIsComplete(false);
      indexRef.current = 0;
      prevTextRef.current = text;
    }
  }, [text]);

  useEffect(() => {
    if (!text) return;

    if (indexRef.current >= text.length) {
      setIsComplete(true);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayedText(text.slice(0, indexRef.current + 1));
      indexRef.current += 1;
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, displayedText, speed]);

  return { displayedText, isComplete };
}
