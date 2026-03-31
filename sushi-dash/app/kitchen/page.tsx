/**
 * Kitchen dashboard — Real-time order management
 * Route: /kitchen
 */
import type { Metadata } from "next";
import KitchenPage from "@/features/kitchen/components/KitchenPage";
import WithAppProvider from "@/features/shared/components/WithAppProvider";

export const metadata: Metadata = {
	title: "Kitchen Dashboard | Sushi Dash",
	description: "Prepare and track incoming orders in real time.",
};

export default function Page() {
	return (
		<WithAppProvider>
			<KitchenPage />
		</WithAppProvider>
	);
}
