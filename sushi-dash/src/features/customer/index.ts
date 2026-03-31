// Customer feature barrel export
export { default as CustomerPage } from './components/CustomerPage';
export { default as MenuOrderingView } from './components/MenuOrderingView';
export { default as TableSelector } from './components/TableSelector';
export { PinPad } from './components/PinPad';
export { default as CartSummaryBanner } from './components/CartSummaryBanner';
export { default as MenuGrid } from './components/MenuGrid';
export { default as TablePage } from './components/TablePage';
export { default as DeferredCustomerMenu } from './components/DeferredCustomerMenu';
export { default as CustomerMenuStep } from './components/CustomerMenuStep';
export { default as OrderCard } from './components/OrderCard';
export { OrderProgressModal } from './components/OrderProgressModal';
export { default as OrderConfirmation } from './components/OrderConfirmation';
export { default as CollapsibleSection } from './components/CollapsibleSection';

export { AppProvider, useApp } from './context/AppContext';

export { useOrderingFlow } from './hooks/useOrderingFlow';
