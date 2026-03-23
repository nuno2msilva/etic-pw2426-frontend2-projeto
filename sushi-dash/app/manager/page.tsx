/**
 * Manager panel — Admin controls
 * Route: /manager
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Manager Panel | Sushi Dash",
	description: "Manage menu, tables, PINs, and order settings.",
};

export { default } from "@/views/ManagerPage";
