'use client';

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { userApi, moduleApi, activityLogApi, ActivityLog } from "../lib/api";
import { useApi } from "../lib/hooks";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { FormError } from "../components/FormError";
import {
  Users,
  BarChart,
  Settings,
  FileText,
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  Clock,
} from 'lucide-react';
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: usersData, loading: usersLoading, error: usersError } = useApi(userApi.getAllUsers);
  const { data: modulesData, loading: modulesLoading, error: modulesError } = useApi(moduleApi.getAllModules);
  const { data: activityLogsData, loading: activityLogsLoading, error: activityLogsError } = useApi(() => activityLogApi.getAllActivityLogs({ limit: 5 }));

  const stats = useMemo(() => {
    const totalUsers = usersData?.length || 0;
    const activeUsers = usersData?.filter(u => u.is_active).length || 0;
    const totalModules = modulesData?.length || 0;
    const activeSessions = usersData?.filter(u => u.isLoggedIn).length || 0;
    return { totalUsers, activeUsers, totalModules, activeSessions };
  }, [usersData, modulesData]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.first_name}!</h1>
          <p className="text-muted">Here&apos;s your dashboard overview.</p>
        </div>
        {(usersError || modulesError || activityLogsError) && <FormError error={usersError || modulesError || activityLogsError || ''} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} title="Total Users" value={stats.totalUsers} loading={usersLoading} />
          <StatCard icon={Users} title="Active Users" value={stats.activeUsers} loading={usersLoading} color="text-green-500" />
          <StatCard icon={BarChart} title="Active Sessions" value={stats.activeSessions} loading={usersLoading} color="text-blue-500" />
          <StatCard icon={FileText} title="Total Modules" value={stats.totalModules} loading={modulesLoading} color="text-purple-500" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-background-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
              <Link
                href="/activity-logs"
                className="text-primary hover:underline text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {activityLogsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-background-offset rounded-lg animate-pulse" />)
              ) : activityLogsData?.logs && activityLogsData.logs.length > 0 ? (
                activityLogsData.logs.map(log => <ActivityItem key={log.activity_log_id} log={log} />)
              ) : (
                <div className="text-center py-8 text-muted">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <p>No recent activity found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-background-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <QuickAction icon={UserPlus} title="Add New User" description="Create a new user account" href="/users" />
              <QuickAction icon={Settings} title="System Settings" description="Configure system parameters" href="/settings/general" />
              <QuickAction icon={BarChart} title="View Analytics" description="Check system and user reports" href="/roles-permissions" />
              <QuickAction icon={FileText} title="Activity Logs" description="Monitor all system events" href="/activity-logs" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
}

const QuickAction = ({ icon: Icon, title, description, href }: QuickActionProps) => (
  <Link
    href={href}
    className="flex items-center p-4 bg-background-offset rounded-lg hover:bg-background-offset-hover transition-colors duration-200 group">

    <div className="p-3 bg-primary/10 rounded-lg mr-4">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted">{description}</p>
    </div>

  </Link>
);

const ActivityItem = ({ log }: { log: ActivityLog }) => {
    const getIcon = (action: string) => {
      switch (action) {
        case 'login': return <LogIn className="w-5 h-5 text-green-500" />;
        case 'logout': return <LogOut className="w-5 h-5 text-red-500" />;
        case 'create_user': return <UserPlus className="w-5 h-5 text-blue-500" />;
        case 'update_user': return <Users className="w-5 h-5 text-yellow-500" />;
        case 'delete_user': return <Users className="w-5 h-5 text-red-500" />;
        case 'security_alert': return <Shield className="w-5 h-5 text-orange-500" />;
        default: return <FileText className="w-5 h-5 text-gray-500" />;
      }
    };

    return (
      <div className="flex items-start space-x-4 p-4 bg-background-offset rounded-lg">
        <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
          {getIcon(log.action)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-medium truncate">{log.details}</p>
          <div className="flex items-center text-muted text-sm mt-1">
            <Clock className="w-4 h-4 mr-1.5" />
            <span>{new Date(log.created_date).toLocaleString()}</span>
            {log.users && <span className="ml-2 font-medium">{`${log.users.first_name} ${log.users.last_name}`}</span>}
          </div>
        </div>
      </div>
    );
  };

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  loading: boolean;
  color?: string;
}

const StatCard = ({ icon: Icon, title, value, loading, color = 'text-primary' }: StatCardProps) => (
  <div className="bg-background-card p-6 rounded-2xl">
    <div className="flex items-center justify-between">
      <div className={`p-3 bg-primary/10 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      {loading ? (
        <div className="h-8 w-1/2 bg-background-offset rounded-md animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
      )}
    </div>
    <p className="text-muted mt-2">{title}</p>
  </div>
);