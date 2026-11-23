'use client';

import React, { useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { X } from '@phosphor-icons/react';

interface DrawerContextType {
  onClose: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

function useDrawerContext() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('Drawer subcomponents must be used within a Drawer component');
  }
  return context;
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    full: 'md:max-w-2xl',
  };

  return (
    <DrawerContext.Provider value={{ onClose }}>
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-8 pointer-events-none">
          <div
            className={cn(
              'w-screen h-full max-h-[100dvh] pointer-events-auto bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-hidden min-h-0 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right',
              sizes[size],
              className
            )}
          >
            {title ? (
              <DrawerHeader>
                <div>
                  <DrawerTitle>{title}</DrawerTitle>
                  {description && <DrawerDescription>{description}</DrawerDescription>}
                </div>
              </DrawerHeader>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </DrawerContext.Provider>
  );
}

export function DrawerHeader({
  className,
  children,
  showClose = true,
}: {
  className?: string;
  children: React.ReactNode;
  showClose?: boolean;
}) {
  const { onClose } = useDrawerContext();

  return (
    <div
      className={cn(
        'flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--card)] shrink-0',
        className
      )}
    >
      <div className="flex-1 min-w-0 pr-2">{children}</div>
      {showClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          aria-label="Tutup panel"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function DrawerTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      className={cn(
        'text-base md:text-lg font-bold text-[var(--foreground)] font-[family-name:var(--font-bricolage)] truncate',
        className
      )}
    >
      {children}
    </h3>
  );
}

export function DrawerDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn('text-xs md:text-sm text-[var(--muted-foreground)] mt-0.5', className)}>
      {children}
    </p>
  );
}

export function DrawerContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-sm text-[var(--foreground)] overscroll-contain',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DrawerFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-3 p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--card)] shrink-0 mt-auto',
        className
      )}
    >
      {children}
    </div>
  );
}
