import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BarChartClient from "@/components/charts/bar/BarChartClient";
import { Metadata } from "next";
import React from "react";
export const dynamic = 'force-dynamic';


export const metadata: Metadata = {
  title: "Next.js Bar Chart | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Bar Chart page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <BarChartClient />
        </ComponentCard>
      </div>
    </div>
  );
}
