#!/usr/bin/env python3
import os
import re
from pathlib import Path

mappings = {
    '@/lib/config': '@/features/shared/lib/config',
    '@/lib/notify': '@/features/shared/lib/notify',
    '@/lib/ui-text': '@/features/shared/lib/ui-text',
    '@/lib/api': '@/features/shared/lib/api',
    '@/lib/auth': '@/features/shared/lib/auth',
    '@/lib/order-status': '@/features/shared/lib/order-status',
    '@/lib/utils': '@/features/shared/lib/utils',
    '@/context/AuthContext': '@/features/shared/context/AuthContext',
    '@/context/QueryRuntimeProvider': '@/features/shared/context/QueryRuntimeProvider',
    '@/types/models': '@/features/shared/types/models',
    '@/hooks/useOrderingFlow': '@/features/customer/hooks/useOrderingFlow',
    '@/hooks/useProtectedStaffRoute': '@/features/staff/hooks/useProtectedStaffRoute',
    '@/hooks/useServerEvents': '@/features/shared/hooks/useServerEvents',
    '@/hooks/useTablePresence': '@/features/shared/hooks/useTablePresence',
    '@/hooks/useApiQueries': '@/features/shared/hooks/useApiQueries',
    '@/components/app/TableSelector': '@/features/customer/components/TableSelector',
    '@/components/app/PinPad': '@/features/customer/components/PinPad',
    '@/components/app/CartSummaryBanner': '@/features/customer/components/CartSummaryBanner',
    '@/components/app/MenuGrid': '@/features/customer/components/MenuGrid',
    '@/components/app/OrderCard': '@/features/customer/components/OrderCard',
    '@/components/app/OrderConfirmation': '@/features/customer/components/OrderConfirmation',
    '@/components/app/OrderProgressModal': '@/features/customer/components/OrderProgressModal',
    '@/components/app/MenuOrderingView': '@/features/customer/components/MenuOrderingView',
    '@/components/app/CollapsibleSection': '@/features/customer/components/CollapsibleSection',
    '@/components/app/StaffLoginModal': '@/features/staff/components/StaffLoginModal',
    '@/components/app/StaffLoginForm': '@/features/staff/components/StaffLoginForm',
    '@/components/app/PasswordManager': '@/features/staff/components/PasswordManager',
    '@/components/app/StaffHeaderMenu': '@/features/staff/components/StaffHeaderMenu',
    '@/components/app/AdminPanel': '@/features/admin/components/AdminPanel',
    '@/components/app/TableManager': '@/features/admin/components/TableManager',
    '@/components/app/MenuManager': '@/features/admin/components/MenuManager',
    '@/components/app/TableQRModal': '@/features/admin/components/TableQRModal',
    '@/components/app/OrderSettingsManager': '@/features/admin/components/OrderSettingsManager',
    '@/components/app/AppHeader': '@/features/shared/components/AppHeader',
    '@/components/app/SEOHead': '@/features/shared/components/SEOHead',
    '@/components/app/CRTScreen': '@/features/shared/components/CRTScreen',
    '@/components/app/LiveUpdatesClient': '@/features/shared/components/LiveUpdatesClient',
    '@/components/app/WebVitalsReporter': '@/features/shared/components/WebVitalsReporter',
    '@/components/app/WithAppProvider': '@/features/shared/components/WithAppProvider',
    '@/views/CustomerPage': '@/features/customer/components/CustomerPage',
    '@/views/DeferredCustomerMenu': '@/features/customer/components/DeferredCustomerMenu',
    '@/views/TablePage': '@/features/customer/components/TablePage',
    '@/views/KitchenPage': '@/features/kitchen/components/KitchenPage',
    '@/views/ManagerPage': '@/features/admin/components/ManagerPage',
    '@/views/NotFound': '@/features/shared/components/NotFound',
}

count = 0
for src in Path('src').rglob('*.ts*'):
    try:
        content = src.read_text()
        updated = False
        for old, new in mappings.items():
            pattern = rf'from\s+(["\']){re.escape(old)}\1'
            if re.search(pattern, content):
                content = re.sub(pattern, rf'from \1{new}\1', content)
                updated = True
        if updated:
            src.write_text(content)
            count += 1
            print(f'✓ {src}')
    except:
        pass

print(f'\nUpdated {count} files')
