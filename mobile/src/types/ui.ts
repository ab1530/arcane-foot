export type CardVariant = 'soft' | 'default' | 'elevated' | 'bordered' | 'featured';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type InputState = 'default' | 'focused' | 'error' | 'disabled';

export interface SegmentOption<T extends string = string> {
  key: T;
  label: string;
  disabled?: boolean;
}

export type RoleColorMap = Record<'ALL' | 'AGENTS' | 'SCOUTS' | 'PLAYERS', string>;
