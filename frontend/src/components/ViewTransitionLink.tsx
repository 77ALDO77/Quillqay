import { useNavigate } from 'react-router-dom';
import { ReactNode, useCallback, memo } from 'react';

interface Props {
  href?: string;
  to?: string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  onClick?: () => void;
}

function ViewTransitionLink({ href, to, className, style, children, onClick }: Props) {
  const navigate = useNavigate();
  const target = to || href || '#';

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClick?.();

      if (document.startViewTransition) {
        document.startViewTransition(() => {
          navigate(target);
        });
      } else {
        navigate(target);
      }
    },
    [target, navigate, onClick]
  );

  return (
    <a href={target} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}

export default memo(ViewTransitionLink);
