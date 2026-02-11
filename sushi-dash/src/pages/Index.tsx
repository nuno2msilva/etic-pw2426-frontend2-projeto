/**
 * ==========================================================================
 * Index Page — Landing page / Table selection
 * ==========================================================================
 *
 * This is the home page of Sushi Dash. It displays a grid of available
 * tables as clickable links. Each table routes to /table/:id where
 * customers can browse the menu and place orders.
 *
 * Also shows staff access links at the bottom (Kitchen & Manager).
 *
 * Route: /
 * Auth: None required (public page)
 * ==========================================================================
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSushi } from "@/context/SushiContext";
import { SEOHead } from "@/components/sushi";

const Index = () => {
  const { tables } = useSushi();

  // useMemo — avoid re-creating the tables array reference on every render
  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => Number(a.id) - Number(b.id)),
    [tables]
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Dynamic SEO for this page */}
      <SEOHead
        title="Select Your Table"
        description="Choose your table to start ordering from our menu of 100+ all-you-can-eat sushi items."
      />

      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">
          🍣 Welcome to Sushi Dash
        </h1>
        <p className="text-lg text-muted-foreground">
          Select your table to start ordering
        </p>
      </div>

      {/* Table Grid — each links to /table/:id */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-3xl mx-auto">
        {sortedTables.map((table) => (
          <Link
            key={table.id}
            to={`/table/${table.id}`}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all group"
          >
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">
              🍽️
            </span>
            <span className="font-semibold text-foreground">{table.label}</span>
          </Link>
        ))}
      </div>

      {/* Footer Links */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p className="mb-2">Staff Access:</p>
        <div className="flex justify-center gap-4">
          <Link 
            to="/staff" 
            className="hover:text-foreground transition-colors underline font-medium"
          >
            🔐 Staff Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Index;
