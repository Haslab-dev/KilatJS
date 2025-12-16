import React from "react";
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Interactive Examples - KilatJS",
    description: "Examples of client-side interactivity without React hydration",
};

export default function ExamplesIndexPage() {
    const examples = [
        {
            href: "/examples/alpine",
            title: "Alpine.js",
            description: "Lightweight reactivity with declarative HTML attributes. Perfect for simple interactions.",
            icon: "🏔️",
            features: ["Counter", "Toggle/Accordion", "Tabs", "Form Validation"],
        },
        {
            href: "/examples/htmx",
            title: "HTMX",
            description: "Server-driven UI updates. Make HTTP requests directly from HTML attributes. (Pure HTML file)",
            icon: "🔄",
            features: ["Click to Load", "Live Search", "Form Submit", "Polling"],
        },
        {
            href: "/examples/vanilla",
            title: "Vanilla JavaScript",
            description: "Pure JavaScript with no dependencies. Full control, zero overhead.",
            icon: "📜",
            features: ["Counter", "Modal", "Toggle", "Clipboard"],
        },
    ];

    return (
        <Layout currentPath="/examples">
            <div className="max-w-4xl mx-auto px-6">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Interactive Examples</h1>
                <p className="text-neutral-500 mb-8">
                    KilatJS is server-first, but you can add client-side interactivity using these patterns.
                    No React hydration needed!
                </p>

                <div className="grid gap-6">
                    {examples.map((example) => (
                        <a
                            key={example.href}
                            href={example.href}
                            className="block bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{example.icon}</div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-violet-600 transition-colors">
                                        {example.title}
                                    </h2>
                                    <p className="text-neutral-600 mt-1">{example.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {example.features.map((feature) => (
                                            <span
                                                key={feature}
                                                className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-neutral-400 group-hover:text-violet-600 transition-colors">→</span>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-violet-50 rounded-2xl border border-violet-200">
                    <h3 className="font-semibold text-violet-900 mb-2">Why not React hooks?</h3>
                    <p className="text-violet-700 text-sm">
                        KilatJS uses <code className="bg-violet-100 px-1 rounded">renderToStaticMarkup</code> for 
                        pure HTML output. This means no React runtime on the client, faster page loads, and 
                        better SEO. For interactivity, these lightweight alternatives work great without 
                        the complexity of hydration.
                    </p>
                </div>
            </div>
        </Layout>
    );
}
