import React from "react";

interface LayoutProps {
    children: React.ReactNode;
    currentPath?: string;
}

export function Layout({ children, currentPath = "/" }: LayoutProps) {
    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/posts", label: "Posts" },
        { href: "/users", label: "Users" },
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 h-[72px] flex items-center bg-white/80 backdrop-blur-xl border-b border-neutral-200 md:h-auto">
                <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center md:flex-col md:gap-4 md:p-4">
                    <a href="/" className="flex items-center gap-2.5 text-2xl font-bold text-neutral-900 no-underline transition-colors duration-150 hover:text-primary-600">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg bg-gradient-to-br from-violet-500 to-orange-500">K</div>
                        <span>KilatJS</span>
                    </a>
                    <nav className="flex gap-2">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2.5 text-neutral-600 no-underline font-medium text-sm rounded-full transition-all duration-150 hover:text-primary-600 hover:bg-primary-50 ${
                                    currentPath === link.href ? "text-primary-700 bg-primary-100" : ""
                                }`}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="flex-1 py-12">
                {children}
            </main>

            <footer className="bg-neutral-900 text-neutral-300 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center flex-wrap gap-6 md:flex-col md:text-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm flex items-center justify-center text-white font-extrabold text-sm bg-gradient-to-br from-violet-500 to-orange-500">K</div>
                        <span className="text-sm">
                            KilatJS &copy; {new Date().getFullYear()} — Built with 💜 using Bun
                        </span>
                    </div>
                    <div className="flex gap-6">
                        <a href="https://github.com" className="text-neutral-400 no-underline text-sm transition-colors duration-150 hover:text-white">GitHub</a>
                        <a href="/about" className="text-neutral-400 no-underline text-sm transition-colors duration-150 hover:text-white">About</a>
                        <a href="/contact" className="text-neutral-400 no-underline text-sm transition-colors duration-150 hover:text-white">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
