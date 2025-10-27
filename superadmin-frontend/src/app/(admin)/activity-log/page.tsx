import type { Metadata } from "next";
import ActivityLogClient from "./ActivityLogClient";

export const metadata: Metadata = {
  title: "Activity Log | SuperAdmin Dashboard",
  description: "Comprehensive activity logging and audit trails",
};

export default function ActivityLogPage() {
  return <ActivityLogClient />;
}