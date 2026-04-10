"use client"

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
            <div className="container mx-auto flex h-16 md:h-20 items-center px-4 md:px-8">
                <Link href="/" className="font-extrabold text-xl md:text-2xl tracking-tighter text-primary">
                    Neo<span className="text-slate-900">Finance</span>
                </Link>

                {/* Desktop nav */}
                <div className="ml-auto hidden md:flex items-center space-x-2 md:space-x-4">
                    <nav className="flex items-center space-x-1">
                        <Link href="/">
                            <Button variant="ghost" className="rounded-full px-5 font-semibold text-slate-600 hover:text-primary hover:bg-primary/5">Painel</Button>
                        </Link>
                        <Link href="/advisor">
                            <Button variant="ghost" className="rounded-full px-5 font-semibold text-slate-600 hover:text-primary hover:bg-primary/5">Consultor IA</Button>
                        </Link>
                    </nav>
                    <div className="h-8 w-[1px] bg-slate-100 mx-2" />
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src="https://ui-avatars.com/api/?name=Giovanni+Neo&background=0075D9&color=fff" />
                        <AvatarFallback className="bg-primary text-white">GN</AvatarFallback>
                    </Avatar>
                </div>

                {/* Mobile: avatar + hamburguer */}
                <div className="ml-auto flex items-center gap-3 md:hidden">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src="https://ui-avatars.com/api/?name=Giovanni+Neo&background=0075D9&color=fff" />
                        <AvatarFallback className="bg-primary text-white text-xs">GN</AvatarFallback>
                    </Avatar>
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
                    <Link href="/" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start rounded-xl font-semibold text-slate-600 hover:text-primary hover:bg-primary/5">
                            Painel
                        </Button>
                    </Link>
                    <Link href="/advisor" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start rounded-xl font-semibold text-slate-600 hover:text-primary hover:bg-primary/5">
                            Consultor IA
                        </Button>
                    </Link>
                </div>
            )}
        </header>
    );
}
