"use client";

import { usePathname } from "next/navigation";
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import {
  Building,
  FileText,
  Heart,
  Home,
  Menu,
  Settings,
  X,
  Search,
  Briefcase,
  UserCircle,
  ShieldCheck,
  User,
  Coins,
  Wallet,
  Bell,
  Tag,
  TrendingUp,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "../lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useGetAuthUserQuery, useGetNotificationsQuery } from "@/state/api";

interface AppSidebarProps {
  userType: "manager" | "tenant" | "landlord" | "buyer" | "superadmin" | string;
}

const AppSidebar = ({ userType }: AppSidebarProps) => {
  const pathname = usePathname();
  const { toggleSidebar, open } = useSidebar();
  const { data: authUser } = useGetAuthUserQuery();
  const { data: notificationsData } = useGetNotificationsQuery(
    { isRead: false },
    {
      skip: !authUser?.cognitoInfo?.userId,
      pollingInterval: 30000 // Poll every 30 seconds
    }
  );

  const notificationCount = notificationsData?.data?.unreadCount || 0;

  let navLinks: any[] = [];
  let sidebarTitle = "Dashboard";

  switch (userType) {
    case "manager":
      sidebarTitle = "Manager View";
      navLinks = [
        { icon: User, label: "Profile", href: "/managers/profile" },
        { icon: Bell, label: "Notifications", href: "/managers/notifications", badge: notificationCount },
        { icon: Building, label: "Properties", href: "/managers/properties" },
        {
          icon: FileText,
          label: "Applications",
          href: "/managers/applications",
        },
        { icon: Settings, label: "Settings", href: "/managers/settings" },
      ];
      break;
    case "tenant":
      sidebarTitle = "Renter View";
      navLinks = [
        { icon: User, label: "Profile", href: "/tenants/profile" },
        { icon: Bell, label: "Notifications", href: "/tenants/notifications", badge: notificationCount },
        { icon: Heart, label: "Favorites", href: "/tenants/favorites" },
        {
          icon: FileText,
          label: "Applications",
          href: "/tenants/applications",
        },
        { icon: Home, label: "Residences", href: "/tenants/contracts" },
        { icon: Settings, label: "Settings", href: "/tenants/settings" },
      ];
      break;
    case "landlord":
      sidebarTitle = "Landlord View";
      navLinks = [
        { icon: User, label: "Profile", href: "/landlords/profile" },
        { icon: Bell, label: "Notifications", href: "/landlords/notifications", badge: notificationCount },
        {
          icon: Briefcase,
          label: "My Properties",
          href: "/landlords/properties",
        },
        {
          icon: Coins,
          label: "Token Offerings",
          href: "/landlords/token-offerings",
        },
        {
          icon: FileText,
          label: "Applications",
          href: "/landlords/applications",
        },
        {
          icon: FileText,
          label: "Token Requests",
          href: "/landlords/token-requests",
        },
        { icon: Settings, label: "Settings", href: "/landlords/settings" },
      ];
      break;
    case "buyer":
      sidebarTitle = "Buyer View";
      navLinks = [
        { icon: User, label: "Profile", href: "/buyers/profile" },
        { icon: Bell, label: "Notifications", href: "/buyers/notifications", badge: notificationCount },
        { icon: Search, label: "Search Properties", href: "/marketplace" },
        { icon: Heart, label: "My Favorites", href: "/buyers/favorites" },
        {
          icon: Coins,
          label: "Token Marketplace",
          href: "/buyers/tokens",
        },
        {
          icon: TrendingUp,
          label: "P2P Token Market",
          href: "/token-marketplace",
        },
        {
          icon: Wallet,
          label: "My Portfolio",
          href: "/buyers/portfolio",
        },
        {
          icon: Tag,
          label: "My Listings",
          href: "/buyers/my-listings",
        },
        {
          icon: FileText,
          label: "Applications",
          href: "/buyers/applications",
        },
        {
          icon: FileText,
          label: "Token Requests",
          href: "/buyers/token-requests",
        },
        { icon: Settings, label: "Settings", href: "/buyers/settings" },
      ];
      break;
    case "superadmin":
      sidebarTitle = "Admin Panel";
      navLinks = [
        { href: "/superadmins/profile", label: "User Management", icon: User },
        { href: "/superadmins/properties", label: "All Properties", icon: Home },
        { href: "/superadmins/token-approvals", label: "Token Approvals", icon: Coins },
        {
          href: "/superadmins/allmaintenence",
          label: "All Applications",
          icon: FileText,
        },
        {
          href: "/superadmins/maintenance",
          label: "Maintenance",
          icon: Briefcase,
        },
        { href: "/superadmins/banking", label: "Banking", icon: Building },
      ];
      break;
    default:
      sidebarTitle = "My Account";
      navLinks = [
        { icon: Home, label: "Dashboard", href: "/" },
        { icon: Settings, label: "Settings", href: "/profile" },
      ];
      break;
  }

  return (
    <Sidebar
      collapsible="icon"
      className="fixed left-0 bg-white shadow-lg z-40"
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
      }}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={cn(
                "flex min-h-[56px] w-full items-center pt-3 mb-3",
                open ? "justify-between px-6" : "justify-center"
              )}
            >
              {open ? (
                <>
                  <h1 className="text-xl font-bold text-gray-800">
                    {sidebarTitle}
                  </h1>
                  <button
                    className="hover:bg-gray-100 p-2 rounded-md transition-colors"
                    onClick={toggleSidebar}
                    aria-label="Close sidebar"
                  >
                    <X className="h-6 w-6 text-gray-600" />
                  </button>
                </>
              ) : (
                <button
                  className="hover:bg-gray-100 p-2 rounded-md transition-colors"
                  onClick={toggleSidebar}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-6 w-6 text-gray-600" />
                </button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarMenu>
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href + "/"));

            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "flex items-center w-full text-left transition-all duration-200",
                    open ? "px-6 py-3" : "justify-center py-3 px-2 mx-1",
                    isActive
                      ? "bg-primary-100 text-primary-700 font-semibold border-r-2 border-primary-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                    "rounded-md"
                  )}
                >
                  <Link href={link.href} className="w-full flex items-center" scroll={false}>
                    <div
                      className={cn(
                        "flex items-center gap-3 relative w-full",
                        !open && "justify-center"
                      )}
                    >
                      <div className="relative">
                        <link.icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0",
                            isActive ? "text-primary-600" : "text-gray-500"
                          )}
                          aria-hidden="true"
                        />
                        {link.badge !== undefined && link.badge > 0 && !open && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                            {link.badge > 9 ? '9+' : link.badge}
                          </span>
                        )}
                      </div>
                      {open && (
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm truncate">
                            {link.label}
                          </span>
                          {link.badge !== undefined && link.badge > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-medium ml-2">
                              {link.badge > 99 ? '99+' : link.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
