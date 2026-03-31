#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Import mappings: old path → new path
const importMappings = [
  // lib imports
  ['@/lib/config',  '@/features/shared/lib/config'],
  ['@/lib/notify', '@/features/shared/lib/notify'],
  ['@/lib/ui-text',  '@/features/shared/lib/ui-text'],
  ['@/lib/api', '@/features/shared/lib/api'],
  ['@/lib/auth', '@/features/shared/lib/auth'],
  ['@/lib/order-status', '@/features/shared/lib/order-status'],
  ['@/lib/utils', '@/features/shared/lib/utils'],
  
  // context imports
  ['@/context/AuthContext', '@/features/shared/context/AuthContext'],
  ['@/context/QueryRuntimeProvider', '@/features/shared/context/QueryRuntimeProvider'],
  
  // types
  ['@/types/models', '@/features/shared/types/models'],
  
  // hooks
  ['@/hooks/useOrderingFlow', '@/features/customer/hooks/useOrderingFlow'],
  ['@/hooks/useProtectedStaffRoute', '@/features/staff/hooks/useProtectedStaffRoute'],
  ['@/hooks/useServerEvents', '@/features/shared/hooks/useServerEvents'],
  ['@/hooks/useTablePresence', '@/features/shared/hooks/useTablePresence'],
  ['@/hooks/useApiQueries', '@/features/shared/hooks/useApiQueries'],
  
  // components/app
  ['@/components/app/TableSelector', '@/features/customer/components/TableSelector'],
  ['@/components/app/PinPad', '@/features/customer/components/PinPad'],
  ['@/components/app/CartSummaryBanner', '@/features/customer/components/CartSummaryBanner'],
  ['@/components/app/MenuGrid', '@/features/customer/components/MenuGrid'],
  ['@/components/app/OrderCard', '@/features/customer/components/OrderCard'],
  ['@/components/app/OrderConfirmation', '@/features/customer/components/OrderConfirmation'],
  ['@/components/app/OrderProgressModal', '@/features/customer/components/OrderProgressModal'],
  ['@/components/app/MenuOrderingView', '@/features/customer/components/MenuOrderingView'],
  ['@/components/app/CollapsibleSection', '@/features/customer/components/CollapsibleSection'],
  
  // staff
  ['@/components/app/StaffLoginModal', '@/features/staff/components/StaffLoginModal'],
  ['@/components/app/StaffLoginForm', '@/features/staff/components/StaffLoginForm'],
  ['@/components/app/PasswordManager', '@/features/staff/components/PasswordManager'],
  ['@/components/app/StaffHeaderMenu', '@/features/staff/components/StaffHeaderMenu'],
  
  // admin
  ['@/components/app/AdminPanel', '@/features/admin/components/AdminPanel'],
  ['@/components/app/TableManager', '@/features/admin/components/TableManager'],
  ['@/components/app/MenuManager', '@/features/admin/components/MenuManager'],
  ['@/components/app/TableQRModal', '@/features/admin/components/TableQRModal'],
  ['@/components/app/OrderSettingsManager', '@/features/admin/components/OrderSettingsManager'],
  
  // shared
  ['@/components/app/AppHeader', '@/features/shared/components/AppHeader'],
  ['@/components/app/SEOHead', '@/features/shared/components/SEOHead'],
  ['@/components/app/CRTScreen', '@/features/shared/components/CRTScreen'],
  ['@/components/app/LiveUpdatesClient', '@/features/shared/components/LiveUpdatesClient'],
  ['@/components/app/WebVitalsReporter', '@/features/shared/components/WebVitalsReporter'],
  ['@/components/app/WithAppProvider', '@/features/shared/components/WithAppProvider'],
  
  // views
  ['@/views/CustomerPage', '@/features/customer/components/CustomerPage'],
  ['@/views/DeferredCustomerMenu', '@/features/customer/components/DeferredCustomerMenu'],
  ['@/views/TablePage', '@/features/customer/components/TablePage'],
  ['@/views/KitchenPage', '@/features/kitchen/components/KitchenPage'],
  ['@/views/ManagerPage', '@/features/admin/components/ManagerPage'],
  ['@/views/NotFound', '@/features/shared/components/NotFound'],
];

function updateFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;
  
  importMappings.forEach(([from, to]) => {
    // Create regex to match: from 'path' or from "path"
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`from\\s+(['\"])${escaped}\\1`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, (match, quote) => `from ${quote}${to}${quote}`);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filepath, content, 'utf8');
    return true;
  }
  return false;
}

const files = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });
let count = 0;

files.forEach(file => {
  if (updateFile(file)) {
    count++;
    console.log(`✓ ${file}`);
  }
});

console.log(`\nUpdated ${count} files`);
