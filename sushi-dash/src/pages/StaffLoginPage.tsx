/**
 * ==========================================================================
 * StaffLoginPage — Unified login for Kitchen and Manager
 * ==========================================================================
 *
 * Single login page that automatically routes to:
 *   - Kitchen dashboard if kitchen password is entered
 *   - Manager panel if manager password is entered
 *
 * Route: /staff
 * ==========================================================================
 */

import { Link } from "react-router-dom";
import { SEOHead } from "@/components/sushi";
import { StaffLoginForm } from "@/components/sushi/StaffLoginForm";
import { Button } from "@/components/ui/button";

const StaffLoginPage = () => {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/20">
      <SEOHead
        title="Staff Login"
        description="Login to access kitchen dashboard or manager panel"
      />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            🔐 Staff Login
          </h1>
          <p className="text-muted-foreground">
            Enter your password to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card border rounded-xl p-8 shadow-lg">
          <StaffLoginForm />
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button variant="ghost" asChild>
            <Link to="/">← Back to Table Selection</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default StaffLoginPage;
