'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from './ThemeToggle';

export const DashboardHeader: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    console.log('DashboardHeader: Logout initiated');
    try {
      await logout();
      console.log('DashboardHeader: Logout successful');
      // Redirect to login page after logout (using router for basePath support)
      router.push('/login');
    } catch (error) {
      console.error('DashboardHeader: Logout failed:', error);
      // Even if API logout fails, redirect to login
      router.push('/login');
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Dashboard title */}
        <div className="flex items-center space-x-4">
          <div className="relative w-45 h-10">
            <Image
              src="/superadmin/images/logos/Bannerlogo.jpg"
              alt="DAV Creations Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SuperAdmin</h1>
        </div>

        {/* Right side - Theme toggle and Profile dropdown */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors duration-200"
            aria-expanded={isProfileDropdownOpen}
            aria-haspopup="true"
          >
            {/* Profile Avatar */}
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* Profile Info */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground">Super Admin</p>
              <p className="text-xs text-muted">Administrator</p>
            </div>

            {/* Dropdown Arrow */}
            <svg
              className={`w-4 h-4 text-muted transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-foreground">Super Admin</p>
                <p className="text-xs text-muted">admin@superadmin.com</p>
              </div>

              <div className="py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors duration-200 flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>View Profile</span>
                </button>

                <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors duration-200 flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Profile Settings</span>
                </button>
              </div>

              <div className="border-t border-border py-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center space-x-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-bold">Logout</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};