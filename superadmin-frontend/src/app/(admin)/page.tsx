import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "SuperAdmin Dashboard | davcreations - Next.js Dashboard Template",
  description: "Role-based dashboard for superadmin system management",
};

export default function Dashboard() {
  return <DashboardClient />;
}