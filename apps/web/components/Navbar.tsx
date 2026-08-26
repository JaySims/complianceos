"use client";

import { useEffect, useState } from "react";
import Container from "./ui/Container";
import PrimaryButton from "./ui/PrimaryButton";

const navigation = [
  "Solutions",
  "Dashboard",
  "Trust Score",
  "Impact",
  "Contact",
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <Container>

        <div
          className={`flex items-center justify-between transition-all duration-500 ${
            scrolled ? "py-4" : "py-6"
          }`}
        >

          {/* Logo */}

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-700 shadow-xl shadow-blue-600/40">

              <span className="text-2xl font-black text-white">
                C
              </span>

            </div>

            <div>

              <h1 className="text-2xl font-black tracking-tight text-white">
                ComplianceOS
              </h1>

              <p className="text-sm text-slate-400">
                AI Business Platform
              </p>

            </div>

          </div>

          {/* Navigation */}

          <nav className="hidden lg:block">

            <ul className="flex items-center gap-10">

              {navigation.map((item) => (

                <li key={item}>

                  <a
                    href="#"
                    className="group relative text-[15px] font-medium text-slate-300 transition hover:text-white"
                  >

                    {item}

                    <span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 group-hover:w-full" />

                  </a>

                </li>

              ))}

            </ul>

          </nav>

          {/* Right */}

          <div className="flex items-center gap-6">

            <button className="font-medium text-slate-300 transition hover:text-white">

              Sign In

            </button>

            <PrimaryButton>

              Register Business

            </PrimaryButton>

          </div>

        </div>

      </Container>

    </header>
  );
}