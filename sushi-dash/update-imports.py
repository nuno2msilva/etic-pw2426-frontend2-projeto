#!/usr/bin/env python3
import re
import sys
from pathlib import Path

# Mapping of old import paths to new paths
import_map = {
    # lib files
    '@/lib/config': '@/features/shared/lib/config',
    '@/lib/notify': '@/features/shared/lib/notify',
    '@/lib/ui-text': '@/features/shared/lib/ui-text',
    '@/lib/api': '@/features/shared/lib/api',
    '@/lib/auth': '@/features/shared/lib/auth',
    '@/lib/order-status': '@/features/shared/lib/order-status',
    '@/lib/utils': '@/features/shared/lib/utils',
    
    # context
    '@/context/AuthContext': '@/features/shared/context/AuthContext',
    '@/context/AppContext': '@/features/customer/context/AppContext',
    '@/context/QueryRuntimeProvider': '@/features/shared/context/QueryRuntimeProvider',
    
    # types
    '@/types/models': '@/features/shared/types/models',
    
    # hooks
    '@/hooks/useOrderingFlow': '@/features/customer/hooks/useOrderingFlow',
    '@/hooks/useProtectedStaffRoute': '@/features/staff/hooks/useProtectedStaffRoute',
    '@/hooks/useServerEvents': '@/features/shared/hooks/useServerEvents',
    '@/hooks/useTablePresence': '@/features/shared/hooks/useTablePresence',
    '@/hooks/useApiQueries': '@/features/shared/hooks/useApiQueries',
    
    # components/app - customer
    '@/components/app/TableSelector': '@/features/customer/components/TableSelector',
    '@/components/app/PinPad': '@/features/customer/components/PinPad',
    '@/components/app/CartSummaryBanner': '@/features/customer/components/CartSummaryBanner',
    '@/components/app/MenuGrid': '@/features/customer/components/MenuGrid',
    '@/components/app/OrderCard': '@/features/customer/components/OrderCard',
    '@/components/app/OrderConfirmation': '@/features/customer/components/OrderConfirmation',
    '@/components/app/OrderProgressModal': '@/features/customer/components/OrderProgressModal',
    '@/components/app/MenuOrderingView': '@/features/customer/components/MenuOrderingView',
    '@/components/app/CollapsibleSection': '@/features/customer/components/CollapsibleSection',
    '@/components/app/DeferredCustomerMenu': '@/features/customer/components/DeferredCustomerMenu',
    '@/components/app/CustomerMenuStep': '@/features/customer/components/CustomerMenuStep',
    '@/components/app/CustomerPage': '@/features/customer/components/CustomerPage',
    
    # components/app - staff
    '@/components/app/StaffLoginModal': '@/features/staff/components/StaffLoginModal',
    '@/components/app/StaffLoginForm': '@/features/staff/components/StaffLoginForm',
    '@/components/app/PasswordManager': '@/features/staff/components/PasswordManager',
    '@/components/app/PasswordChangeModal': '@/features/staff/components/PasswordChangeModal',
    '@/components/app/StaffHeaderMenu': '@/features/staff/components/StaffHeaderMenu',
    
    # components/app - admin
    '@/components/app/AdminPanel': '@/features/admin/components/AdminPanel',
    '@/components/app/TableManager': '@/features/admin/components/TableManager',
    '@/components/app/MenuManager': '@/features/admin/components/MenuManager',
    '@/components/app/TableQRModal': '@/features/admin/components/TableQRModal',
    '@/components/app/OrderSettingsManager': '@/features/admin/components/OrderSettingsManager',
    '@/components/app/ManagerPage': '@/features/admin/components/ManagerPage',
    
    # components/app - kitchen
    '@/components/app/KitchenPage': '@/features/kitchen/components/KitchenPage',
    
    # components/app - shared
    '@/components/app/AppHeader': '@/features/shared/components/AppHeader',
    '@/components/app/SEOHead': '@/features/shared/components/SEOHead',
    '@/components/app/CRTScreen': '@/features/shared/components/CRTScreen',
    '@/components/app/LiveUpdatesClient': '@/features/shared/components/LiveUpdatesClient',
    '@/components/app/WebVitalsReporter': '@/features/shared/components/WebVitalsReporter',
    '@/components/app/WithAppProvider': '@/features/shared/components/WithAppProvider',
    
    # views
    '@/views/CustomerPage': '@/features/customer/components/CustomerPage',
    '@/views/DeferredCustomerMenu': '@/features/customer/components/DeferredCustomerMenu',
    '@/views/TablePage': '@/features/customer/components/TablePage',
    '@/views/KitchenPage': '@/features/kitchen/components/KitchenPage',
    '@/views/ManagerPage': '@/features/admin/components/ManagerPage',
    '@/views/NotFound': '@/features/shared/components/NotFound',
}

def update_imports_in_file(filepath):
    """Update imports in a single file."""
    try:
        content = Path(filepath).read_text(encoding='utf-8')
        original = content
        
        for old, new in import_map.items():
            # Match: from '...' or from "..."
            pattern = r'from\s+(["\'])' + re.escape(old) + r'\1'
            content = re.sub(pattern, rf'from \1{new}\1', content)
        
        if content != original:
            Path(filepath).write_text(content, encoding='utf-8')
            return True
    except Exception as e:
        print(f'Error processing {filepath}: {e}', file=sys.stderr)
    
    return False

# Update all .ts and .tsx files
count = 0
for filepath in Path('src').rglob('*.ts*'):
    if update_imports_in_file(filepath):
        print(f'✓ {filepath}')
        count += 1

for filepath in Path('app').rglob('*.ts*'):
    if update_imports_in_file(filepath):
        print(f'✓ {filepath}')
        count += 1

for filepath in Path('pages').rglob('*.ts*'):
    if update_imports_in_file(filepath):
        print(f'✓ {filepath}')
        count += 1

print(f'\nUpdated {count} files')
