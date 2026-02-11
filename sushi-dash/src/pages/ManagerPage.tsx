/**
 * ==========================================================================
 * ManagerPage — Restaurant management panel
 * ==========================================================================
 *
 * Provides administrative controls for the restaurant:
 *   - Order Settings: Configure max items per order and active order limits
 *   - Table Management: Add/remove tables
 *   - Password Management: Update kitchen and manager passwords
 *   - Menu Management: Add/remove menu items
 *
 * All sections are collapsible for a clean interface.
 *
 * Note: For order management (cancel/delete), use the Kitchen page with
 *       manager credentials. This page focuses on restaurant settings only.
 *
 * Security:
 *   - Password-protected via LoginModal (manager password)
 *   - Third-party users can close the modal and see "Access Denied"
 *
 * Route: /manager
 * Auth: Manager password required
 * ==========================================================================
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSushi } from "@/context/SushiContext";
import { useAuth } from "@/context/AuthContext";
import {
  AddMenuItemForm,
  TableManager,
  MenuList,
  PasswordManager,
  OrderSettingsManager,
  SEOHead,
} from "@/components/sushi";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertTriangle } from "lucide-react";
const ManagerPage = () => {
  const {
    menu,
    categories,
    tables,
    settings,
    addMenuItem,
    removeMenuItem,
    addTable,
    removeTable,
    updateSettings,
  } = useSushi();

  const { isInitialized, checkAccess, logout } = useAuth();
  const navigate = useNavigate();

  // Collapsible state for each section
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Check if user has manager access
  const hasManagerAccess = checkAccess('manager');

  // Redirect to /staff login if not authenticated
  useEffect(() => {
    if (isInitialized && !hasManagerAccess) {
      navigate('/staff');
    }
  }, [isInitialized, hasManagerAccess, navigate]);

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
          onRemoveTable={removeTable}
        />
      ),
    },
    {
      id: "passwords",
      title: "🔑 Password Management",
      description: "Update kitchen and manager passwords",
      content: <PasswordManager />,
    },
    {
      id: "add-menu",
      title: "➕ Add Menu Item",
      description: "Add new items to the menu",
      content: <AddMenuItemForm onAddItem={addMenuItem} />,
    },
    {
      id: "menu",
      title: "📋 Menu Items",
      description: `${menu.length} items in ${categories.length} categories`,
      content: (
        <MenuList
          menu={menu}
          categories={categories}
          onRemoveItem={removeMenuItem}
        />
      ),
    },
  ], [settings, updateSettings, tables, addTable, removeTable, addMenuItem, menu, categories, removeMenuItem]);

  // Show loading while auth initializes
  if (!isInitialized) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
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
    <main className="max-w-5xl mx-auto px-4 py-8">
      <SEOHead
        title="Manager Panel"
        description="Configure menu items, tables, order limits, and passwords for Sushi Dash."
      />
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-display font-bold text-foreground">
          ⚙️ Manager Panel
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to="/kitchen"
            className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            ← Kitchen Dashboard
          </Link>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      <p className="text-muted-foreground mb-8">
        Configure menu items, tables, order limits, and passwords.
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
              <Collapsible
                key={section.id}
                open={isOpen}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border-2 border-border hover:border-primary/50 transition-colors">
                    <div className="text-left">
                      <span className="text-lg font-semibold block">
                        {section.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {section.description}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 pb-2">
                  <div className="pl-2 pr-2">
                    {section.content}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default ManagerPage;
