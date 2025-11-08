"use client";

import { NAVBAR_HEIGHT } from "../lib/constants";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { useGetAuthUserQuery, useGetNotificationsQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { Bell, MessageCircle, Plus, Search, HelpCircle, X } from "lucide-react";
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import TutorialModal from "./TutorialModal";
import { LanguageSwitcher } from "./LanguageSwitcher";

const Navbar = () => {
  const t = useTranslations();
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const { data: notificationsData } = useGetNotificationsQuery(
    { isRead: false },
    {
      skip: !authUser?.cognitoInfo?.userId,
      pollingInterval: 30000 // Poll every 30 seconds
    }
  );
  const router = useRouter();
  const pathname = usePathname();
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  console.log("authuser object", authUser);

  const notificationCount = notificationsData?.data?.unreadCount || 0;

  const isDashboardPage =
    pathname.includes("/managers") ||
    pathname.includes("/tenants") ||
    pathname.includes("/landlords") ||
    pathname.includes("/buyers");

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div
      className="fixed top-0 left-0 w-full z-50 shadow-xl"
      style={{ height: `${NAVBAR_HEIGHT}px` }}
    >
      <div className="flex justify-between items-center w-full py-3 px-8 bg-primary-700 text-white">
        <div className="flex items-center gap-4 md:gap-6">
          {isDashboardPage && (
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
          )}
          <Link
            href="/"
            className="cursor-pointer hover:!text-primary-300"
            scroll={false}
          >
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="AssetXToken Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="text-xl font-bold">
                AssetX
                <span className="text-secondary-500 font-light hover:!text-primary-300">
                  Token
                </span>
              </div>
            </div>
          </Link>
          {isDashboardPage && authUser && (
            <Button
              variant="secondary"
              className="md:ml-4 bg-primary-50 text-primary-700 hover:bg-secondary-500 hover:text-primary-50"
              onClick={() => {
                if (authUser.userRole?.toLowerCase() === "manager") {
                  router.push("/managers/newproperty");
                } else if (authUser.userRole?.toLowerCase() === "landlord") {
                  router.push("/landlords/newproperty");
                } else {
                  router.push("/search");
                }
              }}
            >
              {authUser.userRole?.toLowerCase() === "manager" ||
              authUser.userRole?.toLowerCase() === "landlord" ? (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:block ml-2">{t('navbar.addProperty')}</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span className="hidden md:block ml-2">
                    {t('navbar.searchProperties')}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
        {!isDashboardPage && (
          <p className="text-primary-200 hidden md:block">
            {t('navbar.tagline')}
          </p>
        )}
        <div className="flex items-center gap-5">
          <LanguageSwitcher />
          {authLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-pulse bg-primary-600 rounded-full h-10 w-10"></div>
              <div className="animate-pulse bg-primary-600 rounded h-4 w-24 hidden md:block"></div>
            </div>
          ) : authUser ? (
            <>
              <div className="relative hidden md:block">
                <div
                  className="w-6 h-6 cursor-pointer text-primary-200 hover:text-primary-400 transition-colors"
                  onClick={() => setIsTutorialModalOpen(!isTutorialModalOpen)}
                  title={isTutorialModalOpen ? t('navbar.closeTutorial') : t('navbar.openTutorial')}
                >
                  {isTutorialModalOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>
              </div>
              <div className="relative hidden md:block">
                <Bell
                  className="w-6 h-6 cursor-pointer text-primary-200 hover:text-primary-400"
                  onClick={() => {
                    // Navigate to notifications page based on user role
                    const role = authUser.userRole?.toLowerCase();
                    if (role) {
                      router.push(`/${role}s/notifications`);
                    }
                  }}
                />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                  <Avatar>
                    <AvatarImage src={authUser.userInfo?.image} />
                    <AvatarFallback className="bg-primary-600 hover:bg-primary-500 transition-colors">
                      {authUser.userRole?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-primary-200 hidden md:block">
                    {authUser.userInfo?.name}
                  </p>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-primary-700">
                  <DropdownMenuItem
                    className="cursor-pointer hover:!bg-primary-700 hover:!text-primary-100 font-bold"
                    onClick={() =>
                      router.push(
                        `/${authUser.userRole?.toLowerCase()}s/profile`,
                        { scroll: false }
                      )
                    }
                  >
                    {t('navbar.goToDashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary-200" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:!bg-primary-700 hover:!text-primary-100"
                    onClick={() =>
                      router.push(
                        `/${authUser.userRole?.toLowerCase()}s/settings`,
                        { scroll: false }
                      )
                    }
                  >
                    {t('common.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:!bg-primary-700 hover:!text-primary-100"
                    onClick={handleSignOut}
                  >
                    {t('common.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button
                  variant="outline"
                  className="text-white border-white bg-transparent hover:bg-white hover:text-primary-700 rounded-lg"
                >
                  {t('common.signIn')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  variant="secondary"
                  className="text-white bg-secondary-600 hover:bg-white hover:text-primary-700 rounded-lg"
                >
                  {t('common.signUp')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      {authUser && (
        <TutorialModal
          isOpen={isTutorialModalOpen}
          onClose={() => setIsTutorialModalOpen(false)}
          userRole={authUser.userRole}
        />
      )}
    </div>
  );
};

export default Navbar;
