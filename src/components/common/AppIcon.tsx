import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BookmarkPlus,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleAlert,
  Clock,
  Coffee,
  FileText,
  Home,
  Lightbulb,
  LoaderCircle,
  MessageCircle,
  Moon,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  Sunrise,
  Tags,
  Target,
  Timer,
  Trash2,
  Wind,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

const icons = {
  'arrow-right': ArrowRight,
  'bar-chart': BarChart3,
  bell: Bell,
  book: BookOpen,
  'bookmark-plus': BookmarkPlus,
  calendar: CalendarDays,
  check: Check,
  'check-circle': CheckCircle2,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  circle: Circle,
  alert: CircleAlert,
  clock: Clock,
  coffee: Coffee,
  file: FileText,
  home: Home,
  lightbulb: Lightbulb,
  loader: LoaderCircle,
  message: MessageCircle,
  moon: Moon,
  pencil: Pencil,
  refresh: RotateCcw,
  save: Save,
  search: Search,
  settings: Settings,
  sliders: SlidersHorizontal,
  sun: Sun,
  sunrise: Sunrise,
  tags: Tags,
  target: Target,
  timer: Timer,
  trash: Trash2,
  wind: Wind,
  x: X,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof icons;

interface AppIconProps extends Omit<LucideProps, 'ref'> {
  name: AppIconName;
  label?: string;
}

const AppIcon: React.FC<AppIconProps> = ({
  name,
  label,
  size = 18,
  strokeWidth = 1.9,
  ...props
}) => {
  const Icon = icons[name];

  return (
    <Icon
      aria-hidden={label ? undefined : true}
      aria-label={label}
      focusable="false"
      role={label ? 'img' : undefined}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
};

export default AppIcon;
