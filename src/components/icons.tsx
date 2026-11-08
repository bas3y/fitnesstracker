import type { SVGProps } from 'react';
import { ICON_PATHS, type IconName } from './iconPaths';

export type { IconName } from './iconPaths';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'>;

/** Liniensymbol aus `ICON_PATHS`; Größe/Farbe über `className` (Standard 1,25 rem, `currentColor`) */
export function Icon({
  name,
  filled = false,
  className = 'h-5 w-5',
  ...props
}: IconProps & { name: IconName; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export const HomeIcon = (props: IconProps) => <Icon {...props} name="home" />;
export const DumbbellIcon = (props: IconProps) => <Icon {...props} name="dumbbell" />;
export const SunIcon = (props: IconProps) => <Icon {...props} name="sun" />;
export const ChartIcon = (props: IconProps) => <Icon {...props} name="chart" />;
export const SettingsIcon = (props: IconProps) => <Icon {...props} name="settings" />;
export const TrophyIcon = (props: IconProps) => <Icon {...props} name="trophy" />;
export const ChevronLeftIcon = (props: IconProps) => <Icon {...props} name="chevronLeft" />;
export const ChevronRightIcon = (props: IconProps) => <Icon {...props} name="chevronRight" />;
export const CheckIcon = (props: IconProps) => <Icon strokeWidth={2.6} {...props} name="check" />;
export const StarIcon = ({ filled, ...props }: IconProps & { filled?: boolean }) => (
  <Icon {...props} name="star" filled={filled} />
);
