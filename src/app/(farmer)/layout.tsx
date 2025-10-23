"use client"
import React from "react";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { Book, Coins, Handshake, LayoutDashboard, Tractor } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { UserNav } from "@/components/app/UserNav";
import AppLogo from "@/components/app/AppLogo";

const navItems = [
    { href: "/farmer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/farmer/equipment", label: "Book Equipment", icon: Tractor },
    { href: "/farmer/produce", label: "Sell Produce", icon: Handshake },
    { href: "/farmer/bookings", label: "My Bookings", icon: Book },
    { href: "/farmer/carbon-credits", label: "Carbon Credits", icon: Coins },
];

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarContent>
                    <SidebarHeader>
                        <AppLogo />
                    </SidebarHeader>
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href}>
                                    <SidebarMenuButton 
                                        isActive={pathname === item.href}
                                        tooltip={item.label}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                    <SidebarTrigger className="md:hidden"/>
                    <div className="flex-1">
                        <h1 className="font-semibold text-lg">{navItems.find(i => pathname.startsWith(i.href))?.label}</h1>
                    </div>
                    <UserNav />
                </header>
                <main className="flex-1 p-4 md:p-6 bg-gray-50/50 dark:bg-card">
                  {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
