"use client";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/user/logout", {
        method: "POST",
        credentials: "include",
      });
      onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Dashboard</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-300">Welcome!</h3>
          <div className="mt-2 space-y-2 text-gray-300">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role === 3 ? "Admin" : "User"}</p>
            {user.picture && (
              <div>
                <strong>Picture:</strong>
                <img
                  src={user.picture}
                  alt="Profile"
                  className="mt-2 w-16 h-16 rounded-full"
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
}