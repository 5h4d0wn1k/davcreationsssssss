'use client';

import dynamic from "next/dynamic";

const BarChartOne = dynamic(() => import("./BarChartOne"), {
  ssr: false,
  loading: () => <div>Loading chart...</div>,
});

export default function BarChartClient() {
  return <BarChartOne />;
}