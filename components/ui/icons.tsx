import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ClipboardListIcon,
  UserCircleIcon,
  CircleArrowRight01Icon,
  CircleArrowLeft01Icon,
  StarSquareIcon,
  FilePlusIcon,
  LogoutSquare02Icon,
  BulbIcon,
  TransactionHistoryIcon,
  JusticeScale01Icon,
  Store03Icon,
} from '@hugeicons/core-free-icons';

interface IconProps {
  className?: string;
  size?: number;
}

export function IconStore({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={Store03Icon} size={size} className={className} />;
}

export function IconScale({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={JusticeScale01Icon} size={size} className={className} />;
}


export function IconHistory({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={TransactionHistoryIcon} size={size} className={className} />;
}

export function IconLamp({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={BulbIcon} size={size} className={className} />;
}

export function IconLogout({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={LogoutSquare02Icon} size={size} className={className} />;
}

export function IconPlus({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={FilePlusIcon} size={size} className={className} />;
}

export function IconClipboard({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={ClipboardListIcon} size={size} className={className} />;
}

export function IconStar({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={StarSquareIcon} size={size} className={className} />;
}

export function IconAccount({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={UserCircleIcon} size={size} className={className} />;
}

export function IconArrowRight({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={CircleArrowRight01Icon} size={size} className={className} />;
}
export function IconArrowLeft({ className = 'text-main', size = 20 }: IconProps) {
  return <HugeiconsIcon icon={CircleArrowLeft01Icon} size={size} className={className} />;
}
