"use client";

import { ReactNode } from "react";

import ExecutiveSidebar from "./ExecutiveSidebar";
import ExecutiveTopbar from "./ExecutiveTopbar";

type Props = {
  children: ReactNode;
  rightPanel?: ReactNode;
};

export default function ExecutiveShell({
  children,
  rightPanel,
}: Props) {
  return (
    <div className="min-h-screen bg-[#F6F8FC]">

      <ExecutiveTopbar />

      <div className="flex">

        {/* Left Navigation */}

        <aside className="hidden w-[290px] border-r border-slate-200 bg-white xl:flex">

          <ExecutiveSidebar />

        </aside>

        {/* Workspace */}

        <main className="flex-1">

          <div className="mx-auto max-w-[1700px]">

            <div className="grid grid-cols-12 gap-10 p-10">

              <section className="col-span-12 xl:col-span-9">

                {children}

              </section>

              {rightPanel && (

                <aside className="hidden xl:col-span-3 xl:block">

                  <div className="sticky top-24">

                    {rightPanel}

                  </div>

                </aside>

              )}

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
