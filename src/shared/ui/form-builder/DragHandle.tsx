import { theme } from 'antd';
import { Icon } from '@iconify/react';

interface DragHandleProps {
  dragProps: React.HTMLAttributes<HTMLDivElement>;
}

export const DragHandle = ({ dragProps }: DragHandleProps) => {
  const { token } = theme.useToken();

  return (
    <div
      {...dragProps}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 24,
        cursor: 'grab',
        color: token.colorTextQuaternary,
        transition: `color ${token.motionDurationFast}`,
        touchAction: 'none',
        userSelect: 'none',
      }}
      aria-label="Переместить поле"
    >
      <div
        style={{
          transform: 'rotate(90deg)',
        }}
      >
        <Icon icon="material-symbols:drag-indicator" width={20} height={20} />
      </div>
    </div>
  );
};
