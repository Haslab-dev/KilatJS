import React from "react";
import { Layout } from "../../components/Layout";
import { RouteContext } from "kilatjs";

/**
 * Dynamic Route: /blog/[slug]
 * 
 * Dynamic routes are server-rendered (SSR) on each request.
 * They leverage Bun's fast server for on-demand rendering.
 * No static pre-building - content is fetched fresh each time.
 */

export async function load({ params }: RouteContext) {
    // In a real app, you would fetch this from a database or CMS
    const posts: Record<string, { title: string; content: string[]; date: string; tag: string; readTime: string }> = {
        "hello-kilatjs": {
            title: "Hello KilatJS: A New Way to Build for the Web",
            content: [
                "We're excited to introduce KilatJS, a framework that challenges the complexity of modern web development by returning to what always worked: server-rendered HTML.",
                "For years, we've been told that SPAs are the future. That we need hydration, client-side routing, and complex state management. But for most websites, this added complexity comes with significant costs: slower initial loads, SEO challenges, and debugging nightmares.",
                "KilatJS takes a different approach. We believe that HTML is the protocol of the web, and that the server should own all truth. Every page response is complete, semantic HTML that works in any browser, on any device, with or without JavaScript.",
                "Built natively for Bun, KilatJS delivers exceptional performance. Routes are file-based, loaders run only on the server, and React is used purely for rendering — it never orchestrates application logic.",
                "This isn't a step backward. It's a recognition that the web was always great, and that sometimes the best innovations come from embracing proven patterns with modern tools."
            ],
            date: "December 10, 2024",
            tag: "Announcement",
            readTime: "4 min read"
        },
        "server-first-development": {
            title: "Why Server-First Development is the Future",
            content: [
                "The JavaScript ecosystem has spent the last decade pushing computation to the client. The results? Massive bundle sizes, poor SEO, and applications that break without JS.",
                "Server-first development flips this model. Instead of shipping your entire application to the browser and hoping it renders correctly, you render on the server and send complete HTML.",
                "This approach has several advantages. First, performance: HTML is the fastest thing a browser can render. Second, SEO: search engines index your content without executing JavaScript. Third, reliability: your site works even when JS fails.",
                "Critics argue that server rendering is slower for interactivity. But modern techniques like progressive enhancement and targeted AJAX updates give you the best of both worlds — fast initial loads with smooth interactions.",
                "The tools have caught up too. Bun makes server-side JavaScript blazing fast. React Server Components show that even Facebook recognizes the value of server rendering. The tide is turning.",
                "KilatJS builds on these insights. We're not anti-JavaScript — we're pro-HTML. Use JS where it adds value, but don't make your entire site dependent on it."
            ],
            date: "December 8, 2024",
            tag: "Philosophy",
            readTime: "6 min read"
        },
        "seo-without-compromise": {
            title: "SEO Without Compromise: How KilatJS Guarantees Indexability",
            content: [
                "If your content isn't indexable, it doesn't exist to search engines. Many modern frameworks make SEO an afterthought — something you 'configure' or 'enable'.",
                "KilatJS takes the opposite approach. SEO isn't a feature; it's the default. Every route returns complete HTML with proper meta tags, semantic structure, and zero client-side requirements.",
                "Here's how it works: when a request comes in, KilatJS runs your loader function on the server, gathers the data, and renders your component to static HTML. The response includes everything the browser (or search bot) needs.",
                "No hydration delays. No JavaScript required for content. No 'loading...' placeholder that search engines can't read. Just real HTML, served fast.",
                "Meta tags are first-class citizens too. Export a meta object from your route, and KilatJS handles title tags, descriptions, Open Graph, Twitter Cards — all the SEO essentials.",
                "The result? Sites that rank well without extra effort. Content that loads instantly. A development experience that doesn't fight the web."
            ],
            date: "December 5, 2024",
            tag: "SEO",
            readTime: "5 min read"
        }
    };

    const post = posts[params.slug];

    if (!post) {
        throw new Response("Post not found", { status: 404 });
    }

    return { post, slug: params.slug };
}

// Dynamic meta based on post
export const meta = {
    title: "Blog Post - KilatJS",
    description: "Read our latest articles about KilatJS and server-first development.",
    robots: "index,follow"
};

export default function BlogPostPage({ data }: { data: any; params: any; state: any }) {
    return (
        <Layout currentPath="/blog">
            <div className="max-w-7xl mx-auto px-6 w-full">
                <article className="max-w-3xl mx-auto">
                    <header className="mb-12">
                        <a
                            href="/blog"
                            className="inline-flex items-center gap-2 text-primary-600 no-underline text-sm font-medium mb-6"
                        >
                            ← Back to Blog
                        </a>
                        <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 leading-tight mb-5">{data.post.title}</h1>
                        <div className="flex items-center gap-4 text-neutral-500">
                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{data.post.tag}</span>
                            <span>{data.post.date}</span>
                            <span>• {data.post.readTime}</span>
                        </div>
                    </header>

                    <div className="text-lg leading-loose text-neutral-700 space-y-6">
                        {data.post.content.map((paragraph: string, index: number) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>

                    <div className="mt-16 p-8 bg-primary-50 rounded-2xl text-center">
                        <h3 className="mb-3 text-neutral-900 font-semibold text-xl">
                            Ready to try KilatJS?
                        </h3>
                        <p className="text-neutral-600 mb-5">
                            Get started with the HTML-first framework for the modern web.
                        </p>
                        <a href="/about" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-base rounded-xl cursor-pointer border-none transition-all duration-150 text-white shadow-lg bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_0_30px_-10px_#8b5cf6] hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/0.1),0_0_40px_-10px_#8b5cf6]">
                            Learn More →
                        </a>
                    </div>
                </article>
            </div>
        </Layout>
    );
}