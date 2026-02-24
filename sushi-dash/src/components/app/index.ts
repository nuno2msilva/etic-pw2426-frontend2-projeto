// Barrel export — re-exports all app-level components from a single entry point.

// Core UI components
export { default as CollapsibleSection } from "./CollapsibleSection";
export { default as OrderCard } from "./OrderCard";
export { default as AppHeader } from "./AppHeader";
export { default as TableSelector } from "./TableSelector";
export { default as MenuGrid } from "./MenuGrid";
export { default as OrderConfirmation } from "./OrderConfirmation";
export { default as CartSummaryBanner } from "./CartSummaryBanner";
export { default as OrderProgressModal } from "./OrderProgressModal";
export { default as MenuOrderingView } from "./MenuOrderingView";
export { default as TableManager } from "./TableManager";
export { default as MenuManager } from "./MenuManager";

// Auth components
export { PasswordManager } from "./PasswordManager";
export { PinPad } from "./PinPad";
export { StaffLoginModal } from "./StaffLoginModal";
export { StaffLoginForm } from "./StaffLoginForm";
export { TableQRModal } from "./TableQRModal";

// Settings components
export { OrderSettingsManager } from "./OrderSettingsManager";

// SEO component
export { SEOHead } from "./SEOHead";
