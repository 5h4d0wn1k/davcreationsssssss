export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="text-center max-w-4xl">
        <div className="mb-8">
          <h1 className="text-7xl font-bold text-emerald-900 mb-4 tracking-tight">DAV Creations</h1>
          <div className="w-24 h-1 bg-emerald-600 mx-auto rounded-full"></div>
        </div>

        <h2 className="text-4xl font-semibold text-emerald-800 mb-6">Customer Portal</h2>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-emerald-100">
          <div className="text-6xl mb-6">🌟</div>
          <h3 className="text-3xl font-bold text-emerald-900 mb-4">Coming Soon</h3>
          <p className="text-lg text-emerald-700 mb-6 leading-relaxed">
            We&apos;re excited to launch our customer portal where you can easily access your orders,
            track shipments, and manage your account with DAV Creations.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-600">
            <span className="bg-emerald-100 px-3 py-1 rounded-full">Order Tracking</span>
            <span className="bg-emerald-100 px-3 py-1 rounded-full">Account Management</span>
            <span className="bg-emerald-100 px-3 py-1 rounded-full">Support Center</span>
            <span className="bg-emerald-100 px-3 py-1 rounded-full">Product Catalog</span>
          </div>
        </div>

        <p className="text-emerald-600 mt-8 text-sm">
          © 2025 DAV Creations. All rights reserved.
        </p>
      </div>
    </div>
  );
}
