/**
 * Kitchen dashboard — Real-time order management
 * Route: /kitchen
 */
import type { Metadata } from "next";
import KitchenPage from "@/views/KitchenPage";
import WithAppProvider from "@/components/app/WithAppProvider";

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
