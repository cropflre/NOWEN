/** @vitest-environment jsdom */

import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Bookmark, Category } from '../../../types/bookmark';
import { AmbientBookmarkStage } from '../AmbientBookmarkStage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
  }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_target, tag: string) => ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
      React.createElement(tag, props, children),
  }),
}));

vi.mock('../../ui/spotlight-card', () => ({
  SpotlightCard: ({ children, onClick, onContextMenu, className }: {
    children: React.ReactNode;
    onClick?: () => void;
    onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
    className?: string;
  }) => (
    <div className={className} onClick={onClick} onContextMenu={onContextMenu}>
      {children}
    </div>
  ),
}));

vi.mock('../../IconRenderer', () => ({
  IconRenderer: ({ icon }: { icon?: string }) => <span data-testid="category-icon">{icon}</span>,
}));

vi.mock('../../../lib/api', () => ({
  visitsApi: { track: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../hooks/useNetworkEnv', () => ({
  getBookmarkUrl: (bookmark: Bookmark) => bookmark.url,
}));

const categories: Category[] = [
  { id: 'dev', name: '开发', icon: 'Code', color: '#667eea', orderIndex: 0 },
  { id: 'productivity', name: '效率', icon: 'Zap', color: '#f093fb', orderIndex: 1 },
];

const bookmarks: Bookmark[] = [
  {
    id: 'linux',
    url: 'https://linux.do',
    title: 'linux.do',
    category: 'dev',
    orderIndex: 0,
    createdAt: 1,
    updatedAt: 1,
    isPinned: true,
  },
  {
    id: 'note',
    url: 'https://note.example.com',
    title: '异文笔记',
    category: 'productivity',
    orderIndex: 1,
    createdAt: 1,
    updatedAt: 1,
    isReadLater: true,
    isRead: false,
  },
  {
    id: 'bookmark',
    url: 'https://bookmark.example.com',
    title: '异文书签',
    category: 'productivity',
    orderIndex: 2,
    createdAt: 1,
    updatedAt: 1,
  },
];

const baseProps = {
  bookmarks,
  categories,
  cardViewMode: 'standard' as const,
  isInternal: false,
  onSelectCollection: vi.fn(),
  onContextMenu: vi.fn(),
  onTagSelect: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AmbientBookmarkStage', () => {
  it('renders all sparse bookmarks and deliberate fallback initials', () => {
    const { getByText } = render(
      <AmbientBookmarkStage {...baseProps} activeCollection="all" />,
    );

    expect(getByText('linux.do')).toBeTruthy();
    expect(getByText('异文笔记')).toBeTruthy();
    expect(getByText('异文书签')).toBeTruthy();
    expect(getByText('L')).toBeTruthy();
  });

  it('filters the stage by category', () => {
    const { getByText, queryByText } = render(
      <AmbientBookmarkStage {...baseProps} activeCollection="dev" />,
    );

    expect(getByText('linux.do')).toBeTruthy();
    expect(queryByText('异文笔记')).toBeNull();
    expect(queryByText('异文书签')).toBeNull();
  });

  it('supports pinned and read-later collections', () => {
    const { getByText, queryByText, rerender } = render(
      <AmbientBookmarkStage {...baseProps} activeCollection="pinned" />,
    );

    expect(getByText('linux.do')).toBeTruthy();
    expect(queryByText('异文笔记')).toBeNull();

    rerender(<AmbientBookmarkStage {...baseProps} activeCollection="read-later" />);
    expect(getByText('异文笔记')).toBeTruthy();
    expect(queryByText('linux.do')).toBeNull();
  });

  it('reports collection chip selection to the homepage state owner', () => {
    const onSelectCollection = vi.fn();
    const { getByRole } = render(
      <AmbientBookmarkStage
        {...baseProps}
        activeCollection="all"
        onSelectCollection={onSelectCollection}
      />,
    );

    fireEvent.click(getByRole('tab', { name: /效率 2/ }));
    expect(onSelectCollection).toHaveBeenCalledWith('productivity');
  });
});
