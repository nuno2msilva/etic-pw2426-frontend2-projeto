// ManagerPage — Password-protected admin panel for managing tables, menu, passwords, and order settings.

"use client";

import { useState, useMemo, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { useProtectedStaffRoute } from "@/hooks/useProtectedStaffRoute";
import { UI_TEXT } from "@/lib/ui-text";
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

  const { isInitialized, hasAccess: hasManagerAccess } = useProtectedStaffRoute("manager");

  // Collapsible state for each section
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["tables"]));

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
      <main className="page-shell page-shell-roomy">
        <SEOHead title="Manager Panel" description="Restaurant management dashboard" />
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">{UI_TEXT.loading}</p>
        </div>
      </main>
    );
  }

  // Redirect to /staff if not authenticated (handled by useEffect)
  if (!hasManagerAccess) {
    return null;
  }

  return (
    <main className="page-shell page-shell-tight">
      <SEOHead
        title="Manager Panel"
        description="Configure menu items, tables, and order limits for Sushi Dash."
      />
      <section className="w-full min-w-0">
        <div className="space-y-3 sm:space-y-4 w-full min-w-0">
          {sections.map((section) => {
            const isOpen = openSections.has(section.id);

            return (
              <CollapsibleSection
                key={section.id}
                title={section.title}
                open={isOpen}
                onToggle={() => toggleSection(section.id)}
                contentClassName="pt-1.5 pb-2"
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
