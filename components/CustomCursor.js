'use client';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let animId;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
      animId = requestAnimationFrame(animateRing);
    };

    const onEnterButton = () => {
      ring.style.width = '44px';
      ring.style.height = '44px';
      ring.style.borderColor = 'var(--color-red)';
      ring.style.background = 'rgba(201,8,42,0.08)';
      dot.style.background = 'var(--color-red)';
    };

    const onLeaveButton = () => {
      ring.style.width = '36px';
      ring.style.height = '36px';
      ring.style.borderColor = 'rgba(201,8,42,0.6)';
      ring.style.background = 'transparent';
      dot.style.background = 'white';
    };

    window.addEventListener('mousemove', onMove);
    animateRing();

    document.querySelectorAll('button, a, input, [role="button"]').forEach(el => {
      el.addEventListener('mouseenter', onEnterButton);
      el.addEventListener('mouseleave', onLeaveButton);
    });

    const observer = new MutationObserver(() => {
      document.querySelectorAll('button, a, input, [role="button"]').forEach(el => {
        el.removeEventListener('mouseenter', onEnterButton);
        el.removeEventListener('mouseleave', onLeaveButton);
        el.addEventListener('mouseenter', onEnterButton);
        el.addEventListener('mouseleave', onLeaveButton);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'white',
          zIndex: 99999,
          pointerEvents: 'none',
          transition: 'background 0.15s ease',
          boxShadow: '0 0 6px rgba(255,255,255,0.6)',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 36, height: 36,
          borderRadius: '50%',
          border: '1.5px solid rgba(201,8,42,0.6)',
          zIndex: 99998,
          pointerEvents: 'none',
          transition: 'width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background 0.2s ease',
        }}
      />
    </>
  );
}
