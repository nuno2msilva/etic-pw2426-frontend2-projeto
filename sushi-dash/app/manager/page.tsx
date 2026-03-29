/**
 * Manager panel — Admin controls
 * Route: /manager
 */
import type { Metadata } from "next";
import ManagerPage from "@/views/ManagerPage";
import WithAppProvider from "@/components/app/WithAppProvider";

export const metadata: Metadata = {
	title: "Manager Panel | Sushi Dash",
	description: "Manage menu, tables, PINs, and order settings.",
};

export default function Page() {
	return (
		<WithAppProvider>
			<ManagerPage />
		</WithAppProvider>
	);
}
