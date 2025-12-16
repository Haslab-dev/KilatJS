import React from "react";
import { Layout } from "../components/Layout";

export const meta = {
    title: "KilatJS - HTML-First Web Framework for Bun",
    description: "A Bun-native, HTML-first framework that renders real pages, treats UI frameworks as renderers, and makes SEO the default.",
    robots: "index,follow",
    ogTitle: "KilatJS - HTML-First Web Framework",
    ogDescription: "Build blazing-fast, SEO-friendly websites with the simplicity of PHP and the power of Bun.",
};

export async function load() {
    return {
        serverTime: new Date().toLocaleTimeString(),
        features: [
            {
                icon: "⚡",
                title: "Bun-Native Performance",
                description: "Built from the ground up for Bun runtime, delivering unmatched speed and efficiency."
            },
            {
                icon: "🔍",
                title: "SEO First",
                description: "Every page is fully server-rendered HTML. No hydration tricks, just real content for search engines."
            },
            {
                icon: "📄",
                title: "HTML is the Protocol",
                description: "The server owns all truth. Every meaningful change happens via HTTP request — no client-side magic."
            },
            {
                icon: "⚛️",
                title: "UI Frameworks as Renderers",
                description: "React renders HTML, it doesn't orchestrate. Keep complexity on the server."
            },
            {
                icon: "🎯",
                title: "Zero JavaScript Required",
                description: "Your site works without JS by default. Add progressive enhancement only when you truly need it."
            },
            {
                icon: "🔄",
                title: "PRG Pattern Built-In",
                description: "Forms submit via POST, redirect on success. Classic pattern, battle-tested and cache-friendly."
            }
        ]
    };
}

export default function HomePage({ data }: { data: any; params: any; state: any }) {
    return (
        <Layout currentPath="/">
            <section className="py-20 text-center relative overflow-hidden before:content-[''] before:absolute before:-top-1/2 before:-left-1/2 before:w-[200%] before:h-[200%] before:opacity-50 before:-z-10 before:bg-[radial-gradient(circle_at_center,#ede9fe_0%,transparent_50%)] before:animate-[hero-pulse_8s_ease-in-out_infinite] md:py-12">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-primary-700 mb-6 border border-primary-200 bg-gradient-to-br from-[#ede9fe] to-[rgba(251,146,60,0.1)]">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-[blink_2s_ease-in-out_infinite]"></span>
                        Server time: {data.serverTime}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 bg-gradient-to-br from-[#18181b] via-[#6d28d9] to-[#f97316] bg-clip-text text-transparent">
                        Build for the cool,<br />
                        <span className="bg-gradient-to-br from-[#7c3aed] to-[#f97316] bg-clip-text text-transparent">Not Against It</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        KilatJS is a Bun-native, HTML-first framework that makes SEO the default — not a feature.
                        No hydration. No client routing. Just fast, real HTML.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap md:flex-col">
                        <a href="/about" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-base rounded-xl cursor-pointer border-none transition-all duration-150 text-white shadow-lg bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_0_30px_-10px_#8b5cf6] hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/0.1),0_0_40px_-10px_#8b5cf6] md:w-full">
                            Learn More →
                        </a>
                        <a href="/blog" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-base rounded-xl cursor-pointer border-none transition-all duration-150 bg-white text-neutral-700 border border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 hover:-translate-y-0.5 md:w-full">
                            Read the Blog
                        </a>
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">Why KilatJS?</h2>
                        <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                            We believe the web was already great. KilatJS brings back the simplicity of server-rendered HTML
                            with modern developer ergonomics.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:grid-cols-1">
                        {data.features.map((feature: any, index: number) => (
                            <div key={index} className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm transition-all duration-250 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-primary-200 group">
                                <div className="absolute top-0 left-0 right-0 h-1 opacity-0 transition-opacity duration-250 bg-gradient-to-r from-violet-500 to-orange-500 group-hover:opacity-100"></div>
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-5 bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff]">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-neutral-900 mb-3">{feature.title}</h3>
                                <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
}