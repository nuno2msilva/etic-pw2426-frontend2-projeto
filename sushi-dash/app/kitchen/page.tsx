/**
 * Kitchen dashboard — Real-time order management
 * Route: /kitchen
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Kitchen Dashboard | Sushi Dash",
	description: "Prepare and track incoming orders in real time.",
};

export { default } from "@/views/KitchenPage";
