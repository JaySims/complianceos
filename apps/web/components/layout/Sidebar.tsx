"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    LayoutDashboard,
    Building2,
    ShieldCheck,
    Sparkles,
    Bot,
    BadgeDollarSign,
    FileSearch,
    CheckCircle2,
    TriangleAlert,
    FolderKanban,
    Users,
    Settings,
} from "lucide-react";

const navigation = [
    {
        name: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Organizations",
        href: "/organizations",
        icon: Building2,
    },
    {
        name: "Compliance",
        href: "/compliance",
        icon: ShieldCheck,
    },
    {
        name: "Digital Trust™",
        href: "/trust-score",
        icon: Sparkles,
    },
    {
        name: "AI Assistant",
        href: "/ai",
        icon: Bot,
    },
    {
        name: "Funding",
        href: "/funding",
        icon: BadgeDollarSign,
    },
    {
        name: "Verification",
        href: "/verification",
        icon: CheckCircle2,
    },
    {
        name: "Procurement",
        href: "/procurement",
        icon: FileSearch,
    },
    {
        name: "Risk Centre",
        href: "/risks",
        icon: TriangleAlert,
    },
    {
        name: "Documents",
        href: "/documents",
        icon: FolderKanban,
    },
    {
        name: "Users",
        href: "/users",
        icon: Users,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export default function Sidebar() {

    const pathname = usePathname();

    return (

        <aside className="w-72 bg-[#050816] text-white flex flex-col">

            <div className="px-8 py-10 border-b border-slate-800">

                <h1 className="text-3xl font-black tracking-tight">
                    ComplianceOS
                </h1>

                <p className="text-slate-400 mt-2">
                    AI Business Operating System
                </p>

            </div>

            <nav className="flex-1 p-4 space-y-2">

                {navigation.map((item) => {

                    const Icon = item.icon;

                    const active = pathname === item.href;

                    return (

                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-300
                            ${
                                active
                                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg"
                                    : "hover:bg-slate-800 text-slate-300"
                            }`}
                        >

                            <Icon size={20} />

                            <span className="font-medium">
                                {item.name}
                            </span>

                        </Link>

                    );

                })}

            </nav>

            <div className="p-6 border-t border-slate-800">

                <div className="rounded-2xl bg-slate-900 p-5">

                    <p className="text-xs uppercase tracking-widest text-slate-500">
                        AI Status
                    </p>

                    <div className="flex items-center gap-3 mt-3">

                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />

                        <span className="text-green-400">
                            Online
                        </span>

                    </div>

                </div>

            </div>

        </aside>

    );

}