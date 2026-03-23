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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Route access is strict by role: only manager staff may access /manager.
  const hasManagerAccess = staffSession?.permission === "manager";

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
      description: "Configure order limits",
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
      description: `${tables.length} tables configured`,
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
      description: `${menu.length} items in ${categories.length} categories`,
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
  ], [settings, updateSettings, tables, addTable, removeTable, updateTable, addMenuItem, menu, categories, categoryList, removeMenuItem, updateMenuItem, toggleItemAvailability, addCategory, deleteCategory]);

  // Show loading while auth initializes
  if (!isInitialized) {
    return (
      <main className="h-full overflow-y-auto max-w-5xl mx-auto px-4 py-8">
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
    <main className="h-full overflow-y-auto max-w-5xl mx-auto px-4 py-8">
      <SEOHead
        title="Manager Panel"
        description="Configure menu items, tables, and order limits for Sushi Dash."
      />
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-display font-bold text-foreground">
          ⚙️ Manager Panel
        </h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Configure menu items, tables, and order limits.
      </p>

      {/* Management Settings - Collapsible Sections */}
      <section>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">
          ⚙️ Restaurant Settings
        </h2>
        <div className="space-y-3">
          {sections.map((section) => {
            const isOpen = openSections.has(section.id);

            return (
              <CollapsibleSection
                key={section.id}
                title={section.title}
                subtitle={section.description}
                open={isOpen}
                onToggle={() => toggleSection(section.id)}
                contentClassName="pt-3 pb-2"
              >
                <div className="pl-2 pr-2">
                  {section.content}
                </div>
              </CollapsibleSection>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default ManagerPage;
