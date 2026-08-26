"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    Building2,
    ShieldCheck,
    FileText,
    BrainCircuit,
    BarChart3,
    Wallet,
    Briefcase,
    Settings
} from "lucide-react";

const sections = [
    {
        title: "Executive",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
            { icon: BrainCircuit, label: "AI Brain", href: "/brain" },
        ],
    },
    {
        title: "Organisation",
        items: [
            { icon: Building2, label: "Workspace", href: "/register" },
            { icon: ShieldCheck, label: "Compliance", href: "#" },
            { icon: FileText, label: "Documents", href: "#" },
        ],
    },
    {
        title: "Growth",
        items: [
            { icon: Wallet, label: "Funding", href: "#" },
            { icon: Briefcase, label: "Procurement", href: "#" },
            { icon: BarChart3, label: "Analytics", href: "#" },
        ],
    },
];

export default function ExecutiveSidebar() {
    return (
        <aside className="h-screen w-72 bg-[#0B1220] border-r border-white/10 flex flex-col">

            <div className="px-8 py-8 border-b border-white/10">

                <div className="text-sm uppercase tracking-[0.35em] text-blue-400 font-semibold">
                    ComplianceOS
                </div>

                <h1 className="mt-2 text-2xl font-bold text-white">
                    Executive AI
                </h1>

            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">

                {sections.map((section) => (

                    <div key={section.title} className="mb-10">

                        <div className="mb-4 px-3 text-xs uppercase tracking-[0.25em] text-slate-500">
                            {section.title}
                        </div>

                        <div className="space-y-2">

                            {section.items.map((item) => {

                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="group flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
                                    >
                                        <Icon
                                            size={20}
                                            className="text-slate-400 group-hover:text-blue-400 transition"
                                        />

                                        <span className="font-medium">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}

                        </div>

                    </div>

                ))}

            </div>

            <div className="border-t border-white/10 p-6">

                <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white">

                    <Settings size={20} />

                    <span>Settings</span>

                </button>

            </div>

        </aside>
    );
}
