'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useCallback } from 'react';

interface Props {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  onClick?: () => void;
}

export default function ViewTransitionLink({ href, className, style, children, onClick }: Props) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClick?.();

      // Use View Transitions API if available
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          router.push(href);
        });
      } else {
        router.push(href);
      }
    },
    [href, router, onClick]
  );

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
