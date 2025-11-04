'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  return (
    <header className="glass border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
             <div className="relative w-12 h-12 md:w-14 md:h-14 group">
               <Image
                 src="/superadmin/images/logos/Square logo.jpg"
                 alt="DAV Creations Logo"
                 fill
                 className="object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                 priority
               />
               <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-primary-hover/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             </div>
            <div className="relative w-12 h-12 md:w-14 md:h-14 group">
              <Image
                src="/superadmin/images/logos/square-logo.jpg"
                alt="DAV Creations Logo"
                fill
                className="object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-primary-hover/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">SuperAdmin</h1>
              <p className="text-sm text-muted font-medium">by DAV Creations</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-foreground">SuperAdmin</h1>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links - Hidden on mobile, shown on larger screens */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
              </Link>
              <Link
                href="/login"
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium relative group"
              >
                Login
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
              </Link>
              <a
                href="#features"
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
              </a>
            </nav>

            {/* Theme Toggle */}
            <div className="flex items-center">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg glass hover:bg-background/50 transition-colors duration-200"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};