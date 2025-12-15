import React from "react";
import { Layout } from "../components/Layout";

export const meta = {
    title: "About KilatJS - Philosophy & Principles",
    description: "Learn about KilatJS's philosophy: HTML as the protocol, server-owned truth, and SEO-first development.",
    robots: "index,follow"
};

export async function load() {
    return {
        principles: [
            {
                title: "HTML is the Protocol",
                description: "The web was built on HTML. KilatJS embraces this reality instead of fighting it. Every response is complete, semantic HTML that works everywhere."
            },
            {
                title: "Server Owns All Truth",
                description: "No client-side state management nightmares. The server is the single source of truth. State changes happen via HTTP requests."
            },
            {
                title: "Every Change = HTTP Request",
                description: "Form submissions, data mutations, navigation — everything goes through HTTP. This makes caching, SEO, and debugging predictable."
            },
            {
                title: "UI Frameworks Render, Never Orchestrate",
                description: "React is excellent at rendering UI. That's exactly what it does in KilatJS — nothing more."
            },
            {
                title: "JavaScript is Optional",
                description: "Your site must work without JS. Progressive enhancement is welcome, but never required for core functionality."
            }
        ],
        nonGoals: [
            "Client-side rendering (CSR)",
            "Hydration or islands architecture",
            "Client-side routing",
            "Framework-specific hooks like useLoaderData",
            "Middleware chains",
            "Dependency injection containers",
            "SPA build assumptions",
            "Vite as a hard dependency"
        ]
    };
}

export default function AboutPage({ data }: { data: any; params: any; state: any }) {
    return (
        <Layout currentPath="/about">
            <div className="max-w-7xl mx-auto px-6 w-full">
                <section className="py-20 text-center relative overflow-hidden before:content-[''] before:absolute before:-top-1/2 before:-left-1/2 before:w-[200%] before:h-[200%] before:opacity-50 before:-z-10 before:bg-[radial-gradient(circle_at_center,#ede9fe_0%,transparent_50%)] before:animate-[hero-pulse_8s_ease-in-out_infinite] pb-10 md:py-12">
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 bg-gradient-to-br from-[#18181b] via-[#6d28d9] to-[#f97316] bg-clip-text text-transparent">
                        Built on <span className="bg-gradient-to-br from-[#7c3aed] to-[#f97316] bg-clip-text text-transparent">Principles</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        KilatJS isn't trying to be everything. It's a focused tool for building fast, SEO-friendly websites
                        with the developer experience you love.
                    </p>
                </section>

                <section className="py-20">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">Core Principles</h2>
                        <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                            These aren't just guidelines — they're the foundation of every decision we make.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:grid-cols-1">
                        {data.principles.map((principle: any, index: number) => (
                            <div key={index} className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm transition-all duration-250 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-primary-200 group">
                                <div className="absolute top-0 left-0 right-0 h-1 opacity-0 transition-opacity duration-250 bg-gradient-to-r from-violet-500 to-orange-500 group-hover:opacity-100"></div>
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] text-2xl font-bold">
                                    {index + 1}
                                </div>
                                <h3 className="text-xl font-semibold text-neutral-900 mb-3">{principle.title}</h3>
                                <p className="text-neutral-600 leading-relaxed">{principle.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-20 pt-5">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">What We Don't Do</h2>
                        <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                            KilatJS intentionally avoids patterns that add complexity without benefit for server-rendered sites.
                        </p>
                    </div>
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl p-12 border border-neutral-200 shadow-md md:py-8 md:px-6">
                        <ul className="list-none grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                            {data.nonGoals.map((item: string, index: number) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md text-sm text-neutral-600"
                                >
                                    <span className="text-red-500 text-lg">✕</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>
        </Layout>
    );
}