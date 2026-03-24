// ManagerPage — Password-protected admin panel for managing tables, menu, passwords, and order settings.

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  TableManager,
  MenuManager,
  OrderSettingsManager,
  SEOHead,
  CollapsibleSection,
} from "@/components/app";
const ManagerPage = () => {
  const {
    menu,
    categories,
    categoryList,
    tables,
    settings,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    toggleItemAvailability,
    addCategory,
    deleteCategory,
    addTable,
    updateTable,
    removeTable,
    updateSettings,
  } = useApp();

  const { isInitialized, staffSession } = useAuth();
  const router = useRouter();

  // Collapsible state for each section
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["menu-management"]));

  // Route access is strict by role: only manager staff may access /manager.
  const staffRole = typeof staffSession?.role === "string" ? staffSession.role.toLowerCase() : undefined;
  const staffPermission =
    (typeof staffSession?.permission === "string" ? staffSession.permission.toLowerCase() : undefined) ??
    (staffRole === "customer" ? undefined : staffRole);
  const hasManagerAccess = staffPermission === "manager";

  // If unauthorized, go back to previous page (or home when no history is available).
  useEffect(() => {
    if (isInitialized && !hasManagerAccess) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.replace("/");
      }
    }
  }, [isInitialized, hasManagerAccess, router]);

  // useCallback — toggle a section open/closed
  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // useMemo — section configuration, only recalculates when data changes
  // (declared before early returns to satisfy Rules of Hooks)
  const sections = useMemo(() => [
    {
      id: "settings",
      title: "⚡ Order Settings",
      content: (
        <OrderSettingsManager 
          settings={settings} 
          onUpdateSettings={updateSettings} 
        />
      ),
    },
    {
      id: "tables",
      title: "🍽️ Table Management",
      content: (
        <TableManager
          tables={tables}
          onAddTable={addTable}
          onUpdateTable={updateTable}
          onRemoveTable={removeTable}
        />
      ),
    },
    {
      id: "menu-management",
      title: "📋 Menu Management",
      content: (
        <MenuManager
          menu={menu}
          categoryList={categoryList}
          onAddItem={addMenuItem}
          onUpdateItem={updateMenuItem}
          onRemoveItem={removeMenuItem}
          onToggleAvailability={toggleItemAvailability}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
        />
      ),
    },
  ], [settings, updateSettings, tables, addTable, removeTable, updateTable, addMenuItem, menu, categoryList, removeMenuItem, updateMenuItem, toggleItemAvailability, addCategory, deleteCategory]);

  // Show loading while auth initializes
  if (!isInitialized) {
    return (
      <main className="h-[100dvh] sm:h-full overflow-y-auto overflow-x-hidden max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <SEOHead title="Manager Panel" description="Restaurant management dashboard" />
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  // Redirect to /staff if not authenticated (handled by useEffect)
  if (!hasManagerAccess) {
    return null;
  }

  return (
    <main className="h-[100dvh] sm:h-full overflow-y-auto overflow-x-hidden max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <SEOHead
        title="Manager Panel"
        description="Configure menu items, tables, and order limits for Sushi Dash."
      />
      <section>
        <div className="space-y-3">
          {sections.map((section) => {
            const isOpen = openSections.has(section.id);

            return (
              <CollapsibleSection
                key={section.id}
                title={section.title}
                open={isOpen}
                onToggle={() => toggleSection(section.id)}
                contentClassName="pt-2 pb-2"
              >
                {section.content}
              </CollapsibleSection>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default ManagerPage;
