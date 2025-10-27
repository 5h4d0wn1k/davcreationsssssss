"use client";
import React from "react";
import BarChartOne from "../charts/bar/BarChartOne";
import LineChartOne from "../charts/line/LineChartOne";
import ComponentCard from "../common/ComponentCard";

interface UserStatsProps {
  userRole: string;
  chartData?: {
    userRegistrations?: number[];
    userActivity?: number[];
    categories?: string[];
  } | null;
}

export const UserStats: React.FC<UserStatsProps> = ({ userRole, chartData }) => {
  const renderStatsByRole = () => {
    switch (userRole.toLowerCase()) {
      case 'superadmin':
        return (
          <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
            <ComponentCard title="User Registrations (Monthly)">
              <BarChartOne data={chartData?.userRegistrations} categories={chartData?.categories} />
            </ComponentCard>
            <ComponentCard title="User Activity Trends">
              <LineChartOne data={chartData?.userActivity} categories={chartData?.categories} />
            </ComponentCard>
          </div>
        );

      case 'admin':
      case 'manager':
        return (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <ComponentCard title="User Activity Under Management">
              <BarChartOne data={chartData?.userActivity} categories={chartData?.categories} />
            </ComponentCard>
          </div>
        );

      case 'user':
        return (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <ComponentCard title="Personal Activity">
              <LineChartOne data={chartData?.userActivity} categories={chartData?.categories} />
            </ComponentCard>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStatsByRole();
};