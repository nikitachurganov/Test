import { useState } from 'react';
import { Typography, theme } from 'antd';
import { useDraggable } from '@dnd-kit/core';
import { Icon } from '@iconify/react';
import type { PanelDragData } from '../../types/form-builder.types';

const { Text } = Typography;

export interface DraggableFieldItemProps {
  fieldKey: string;
  label: string;
  iconName: string;
  /** Icon foreground color resolved from a category token. Falls back to token.colorPrimary. */
  iconColor?: string;
  /** Icon container background color resolved from a category token. Falls back to token.colorPrimaryBg. */
  iconBackground?: string;
}

export const DraggableFieldItem = ({
  fieldKey,
  label,
  iconName,
  iconColor,
  iconBackground,
}: DraggableFieldItemProps) => {
  const [hovered, setHovered] = useState(false);
  const { token } = theme.useToken();

  const dragData: PanelDragData = { source: 'panel', fieldKey, label };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `panel-${fieldKey}`,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 4px',
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: token.borderRadiusSM,
        background: isDragging
          ? token.colorPrimaryBg
          : hovered
            ? token.colorFillSecondary
            : 'transparent',
        transition: `background ${token.motionDurationFast}`,
        userSelect: 'none',
        opacity: isDragging ? 0.35 : 1,
        touchAction: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          background: iconBackground ?? token.colorPrimaryBg,
          borderRadius: token.borderRadiusSM,
          color: iconColor ?? token.colorPrimary,
          flexShrink: 0,
        }}
      >
        <Icon icon={iconName} width={16} height={16} />
      </span>
      <Text style={{ flex: 1, fontSize: 13 }}>{label}</Text>
    </div>
  );
};
