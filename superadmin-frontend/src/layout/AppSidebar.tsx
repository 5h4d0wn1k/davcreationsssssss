"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  GridIcon,
  HorizontaLDots,
  UserCircleIcon,
  UserIcon,
  LockIcon,
  BoxIcon,
  GroupIcon,
  TimeIcon,
} from "../icons/index";
import { useAuth } from "../contexts/AuthContext";
import SidebarWidget from "./SidebarWidget";


const navigationConfig = {
  superadmin: [
    { name: 'Dashboard', path: '/dashboard', icon: GridIcon },
    { name: 'Users', path: '/users', icon: UserIcon },
    { name: 'Modules', path: '/modules', icon: BoxIcon },
    { name: 'Permissions', path: '/permissions', icon: LockIcon },
    { name: 'User Types', path: '/user-types', icon: GroupIcon },
    { name: 'Activity Log', path: '/activity-log', icon: TimeIcon },
    { name: 'Profile', path: '/profile', icon: UserCircleIcon }
  ],
  admin: [
    { name: 'Dashboard', path: '/dashboard', icon: GridIcon },
    { name: 'Users', path: '/users', icon: UserIcon },
    { name: 'Modules', path: '/modules', icon: BoxIcon },
    { name: 'Permissions', path: '/permissions', icon: LockIcon },
    { name: 'Activity Log', path: '/activity-log', icon: TimeIcon },
    { name: 'Profile', path: '/profile', icon: UserCircleIcon }
  ],
  manager: [
    { name: 'Dashboard', path: '/dashboard', icon: GridIcon },
    { name: 'Users', path: '/users', icon: UserIcon },
    { name: 'Activity Log', path: '/activity-log', icon: TimeIcon },
    { name: 'Profile', path: '/profile', icon: UserCircleIcon }
  ],
  user: [
    { name: 'Dashboard', path: '/dashboard', icon: GridIcon },
    { name: 'Activity Log', path: '/activity-log', icon: TimeIcon },
    { name: 'Profile', path: '/profile', icon: UserCircleIcon }
  ]
};

const getRoleBasedNavigation = (userRole?: string) => {
  if (!userRole) return navigationConfig.user;

  const role = userRole.toLowerCase();
  return navigationConfig[role as keyof typeof navigationConfig] || navigationConfig.user;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole = user?.userType?.name;
  const navItems = getRoleBasedNavigation(userRole);

  const renderMenuItems = (navItems: typeof navigationConfig.superadmin) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav) => (
        <li key={nav.name}>
          <Link
            href={nav.path}
            className={`menu-item group ${
              isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
            }`}
          >
            <span
              className={`${
                isActive(nav.path)
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
              }`}
            >
              <nav.icon />
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className={`menu-item-text`}>{nav.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/square-logo.jpg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/square-logo.jpg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/square-logo.jpg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
