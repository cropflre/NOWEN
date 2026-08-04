import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutList, Minimize2, Pin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconRenderer } from "../IconRenderer";
import { useQuickNotesContext } from "../../hooks/QuickNotesContext";
import { useCloudDrawer } from "../../hooks/CloudDrawerContext";

interface NavItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count: number;
  kind?: "category" | "module";
  badge?: { value: number; tone?: "warn" | "danger" | "info" } | null;
  onClick?: () => void;
}

interface SidebarNavProps {
  items: NavItem[];
  pinnedCount?: number;
  className?: string;
}

type ViewMode = "orb" | "collapsed" | "expanded";
const SIDEBAR_VIEW_MODE_KEY = "sidebar-nav-view-mode";

function loadViewMode(): ViewMode {
  if (typeof window === "undefined") return "orb";
  try {
    const value = window.localStorage.getItem(SIDEBAR_VIEW_MODE_KEY);
    if (value === "orb" || value === "collapsed" || value === "expanded") return value;
  } catch {
    // Persistence is optional.
  }
  return "orb";
}

function badgeColors(tone: "warn" | "danger" | "info" = "warn") {
  if (tone === "danger") return { solid: "#f97316", soft: "rgba(249,115,22,0.18)" };
  if (tone === "info") return { solid: "#3b82f6", soft: "rgba(59,130,246,0.18)" };
  return { solid: "#eab308", soft: "rgba(234,179,8,0.18)" };
}

export function SidebarNav({ items, pinnedCount = 0, className = "" }: SidebarNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const [isDark, setIsDark] = useState(false);
  const { t } = useTranslation();
  const notesCtx = useQuickNotesContext();
  const cloudDrawer = useCloudDrawer();

  const isCollapsed = viewMode === "collapsed";
  const isOrb = viewMode === "orb";

  const updateViewMode = useCallback((next: ViewMode) => {
    setViewMode(next);
    try {
      window.localStorage.setItem(SIDEBAR_VIEW_MODE_KEY, next);
    } catch {
      // Persistence is optional.
    }
  }, []);

  useEffect(() => {
    const syncTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const cloudModuleItem: NavItem | null = useMemo(() => {
    if (!notesCtx) return null;

    let local = 0;
    let conflict = 0;
    notesCtx.notes.forEach((note) => {
      if (note.syncStatus === "conflict") conflict += 1;
      else if (note.syncStatus !== "synced" && note.syncStatus !== "syncing") local += 1;
    });

    const badge = conflict > 0
      ? { value: conflict, tone: "danger" as const }
      : local > 0
        ? { value: local, tone: "warn" as const }
        : null;

    return {
      id: "__module__cloud",
      name: t("quickNotes.cloud.navName", { defaultValue: "灵感云" }),
      icon: "Cloud",
      color: "#22c55e",
      count: notesCtx.notes.length,
      kind: "module",
      badge,
      onClick: () => cloudDrawer.open(),
    };
  }, [cloudDrawer, notesCtx, t]);

  const allItems = useMemo<NavItem[]>(() => {
    const categoryItems = items.filter((item) => item.kind !== "module");
    const moduleItems = items.filter((item) => item.kind === "module");
    const pinned: NavItem[] = pinnedCount > 0
      ? [{
          id: "pinned",
          name: t("sidebar.pinned"),
          icon: "Pin",
          color: "#eab308",
          count: pinnedCount,
          kind: "category",
        }]
      : [];
    return [...pinned, ...categoryItems, ...moduleItems, ...(cloudModuleItem ? [cloudModuleItem] : [])];
  }, [cloudModuleItem, items, pinnedCount, t]);

  const categoryIds = useMemo(
    () => allItems.filter((item) => item.kind !== "module").map((item) => item.id),
    [allItems],
  );
  const categoryKey = categoryIds.join("|");

  // IntersectionObserver performs visibility calculation in the browser's async
  // observation phase. It replaces the previous scroll handler that synchronously
  // called getBoundingClientRect() for every category on every scroll event.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || categoryIds.length === 0) return;

    const observed = new Set<Element>();
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("data-section") === "pinned"
          ? "pinned"
          : entry.target.getAttribute("data-category-id");
        if (!id) return;
        if (entry.isIntersecting) visible.set(id, entry.intersectionRatio);
        else visible.delete(id);
      });

      let nextId: string | null = null;
      let bestRatio = -1;
      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          nextId = id;
        }
      });
      setActiveId((previous) => previous === nextId ? previous : nextId);
    }, {
      root: null,
      rootMargin: "-16% 0px -64% 0px",
      threshold: [0, 0.01, 0.2, 0.5, 0.8],
    });

    const connect = () => {
      categoryIds.forEach((id) => {
        const element = id === "pinned"
          ? document.querySelector("[data-section='pinned']")
          : document.querySelector(`[data-category-id="${CSS.escape(id)}"]`);
        if (element && !observed.has(element)) {
          observed.add(element);
          observer.observe(element);
        }
      });
    };

    connect();
    const frame = window.requestAnimationFrame(connect);
    const retry = window.setTimeout(connect, 250);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      observer.disconnect();
    };
  }, [categoryIds, categoryKey]);

  const handleItemClick = useCallback((item: NavItem) => {
    if (item.kind === "module") {
      item.onClick?.();
      return;
    }

    const section = item.id === "pinned"
      ? document.querySelector("[data-section='pinned']")
      : document.querySelector(`[data-category-id="${CSS.escape(item.id)}"]`);

    if (section instanceof HTMLElement) {
      section.style.scrollMarginTop = "100px";
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const totalCount = useMemo(
    () => allItems
      .filter((item) => item.kind !== "module")
      .reduce((sum, item) => sum + (item.count || 0), 0),
    [allItems],
  );

  if (allItems.length === 0) return null;

  return (
    <div
      className={`fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 select-none lg:block ${className}`}
      style={{ maxHeight: "calc(100vh - 2rem)" }}
      data-sidebar-observer="intersection"
    >
      {isOrb ? (
        <button
          type="button"
          onClick={() => updateViewMode("expanded")}
          title={t("sidebar.expand")}
          aria-label={t("sidebar.expand")}
          className="relative flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95"
          style={{
            background: isDark ? "rgba(17,19,28,0.9)" : "rgba(255,255,255,0.9)",
            border: "1px solid var(--color-glass-border)",
            boxShadow: isDark
              ? "0 0 18px rgba(34,211,238,0.14), 0 6px 22px rgba(0,0,0,0.3)"
              : "0 0 18px rgba(59,130,246,0.1), 0 6px 22px rgba(63,76,116,0.12)",
            color: "var(--color-text-secondary)",
          }}
        >
          <LayoutList
            className="h-5 w-5"
            style={{ color: isDark ? "rgba(34,211,238,0.9)" : "rgb(59,130,246)" }}
          />
          {totalCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
              style={{ background: isDark ? "rgb(34,211,238)" : "rgb(59,130,246)" }}
            >
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
          <span
            className="pointer-events-none absolute inset-0 animate-pulse rounded-full"
            style={{ border: `1px solid ${isDark ? "rgba(34,211,238,0.22)" : "rgba(59,130,246,0.16)"}` }}
          />
        </button>
      ) : (
        <div className="relative flex flex-col" style={{ maxHeight: "calc(100vh - 2rem)" }}>
          <button
            type="button"
            onClick={() => updateViewMode(isCollapsed ? "expanded" : "collapsed")}
            className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-transform hover:scale-105"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-light)",
              color: "var(--color-text-muted)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
            title={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => updateViewMode("orb")}
              className="absolute -right-3 -top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-105"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border-light)",
                color: "var(--color-text-muted)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              title={t("sidebar.collapse_to_orb")}
            >
              <Minimize2 className="h-3 w-3" />
            </button>
          )}

          <div
            className={`flex flex-col overflow-hidden rounded-2xl transition-[width] duration-200 ${isCollapsed ? "w-14" : "w-[168px]"}`}
            style={{
              background: isDark ? "rgba(17,19,28,0.92)" : "rgba(255,255,255,0.92)",
              border: "1px solid var(--color-glass-border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              maxHeight: "calc(100vh - 2rem)",
            }}
          >
            <nav className="scrollbar-thin flex-1 overflow-y-auto overflow-x-hidden py-3">
              <ul className="space-y-1 px-2">
                {allItems.map((item, index) => {
                  const isActive = activeId === item.id;
                  const isPinned = item.id === "pinned";
                  const isModule = item.kind === "module";
                  const firstModuleIndex = allItems.findIndex((entry) => entry.kind === "module");
                  const showDivider = isModule && index === firstModuleIndex && firstModuleIndex > 0;
                  const badgePalette = badgeColors(item.badge?.tone);

                  return (
                    <React.Fragment key={item.id}>
                      {showDivider && (
                        <li aria-hidden className="mx-2 my-1.5 h-px" style={{ background: "var(--color-border-light)" }} />
                      )}
                      <li>
                        <button
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className="relative flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-150"
                          style={{
                            background: isActive ? `${item.color || "var(--color-primary)"}15` : "transparent",
                            color: isActive ? item.color || "var(--color-primary)" : "var(--color-text-secondary)",
                          }}
                          title={item.name}
                        >
                          {!isModule && (
                            <span
                              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
                              style={{
                                background: isActive ? item.color || "var(--color-primary)" : "transparent",
                                opacity: isActive ? 1 : 0,
                              }}
                            />
                          )}

                          <span
                            className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: isActive
                                ? `${item.color || "var(--color-primary)"}20`
                                : "var(--color-bg-tertiary)",
                            }}
                          >
                            {isPinned ? (
                              <Pin className="h-4 w-4" style={{ color: isActive ? item.color : "var(--color-text-muted)" }} />
                            ) : (
                              <IconRenderer
                                icon={item.icon || "folder"}
                                className="h-4 w-4"
                                style={{ color: isActive ? item.color : "var(--color-text-muted)" }}
                              />
                            )}
                            {isModule && item.badge && item.badge.value > 0 && (
                              <span
                                className="absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] font-semibold text-white"
                                style={{ background: badgePalette.solid }}
                              >
                                {item.badge.value > 99 ? "99+" : item.badge.value}
                              </span>
                            )}
                          </span>

                          {!isCollapsed && (
                            <span className="flex min-w-0 flex-1 items-center justify-between overflow-hidden">
                              <span className="truncate text-sm font-medium">{item.name}</span>
                              <span
                                className="ml-1 flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px]"
                                style={{
                                  background: isModule && item.badge ? badgePalette.soft : "var(--color-bg-tertiary)",
                                  color: isModule && item.badge ? badgePalette.solid : "var(--color-text-muted)",
                                }}
                              >
                                {item.badge?.value ?? item.count}
                              </span>
                            </span>
                          )}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}
              </ul>
            </nav>

            {!isCollapsed && (
              <div
                className="flex-shrink-0 border-t px-4 py-2 text-xs"
                style={{ borderColor: "var(--color-border-light)", color: "var(--color-text-muted)" }}
              >
                {t("sidebar.click_to_navigate")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
