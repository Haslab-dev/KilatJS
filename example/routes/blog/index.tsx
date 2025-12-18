import React from "react";
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Blog - KilatJS",
    description: "Read our latest articles about KilatJS, server-first development, and building SEO-friendly websites.",
    robots: "index,follow"
};

export async function load() {
    // In a real app, you would fetch this from a database or CMS
    const posts = [
        {
            slug: "hello-kilatjs",
            title: "Hello KilatJS: A New Way to Build for the Web",
            excerpt: "Introducing KilatJS — a framework that embraces the simplicity of server-rendered HTML while leveraging modern developer ergonomics and the blazing-fast Bun runtime.",
            date: "December 10, 2024",
            tag: "Announcement",
            readTime: "4 min read"
        },
        {
            slug: "server-first-development",
            title: "Why Server-First Development is the Future",
            excerpt: "The pendulum is swinging back. After years of client-heavy SPAs, developers are rediscovering the power of server-rendered HTML. Here's why.",
            date: "December 8, 2024",
            tag: "Philosophy",
            readTime: "6 min read"
        },
        {
            slug: "seo-without-compromise",
            title: "SEO Without Compromise: How KilatJS Guarantees Indexability",
            excerpt: "Learn how KilatJS's HTML-first approach means your content is always indexable, without meta-frameworks or complex configurations.",
            date: "December 5, 2024",
            tag: "SEO",
            readTime: "5 min read"
        }
    ];

    return { posts };
}

export default function BlogIndexPage({ data }: { data: any; params: any; state: any }) {
    return (
        <Layout currentPath="/blog">
            <div className="max-w-7xl mx-auto px-6 w-full">
                <section className="py-20 text-center relative overflow-hidden before:content-[''] before:absolute before:-top-1/2 before:-left-1/2 before:w-[200%] before:h-[200%] before:opacity-50 before:-z-10 before:bg-[radial-gradient(circle_at_center,#ede9fe_0%,transparent_50%)] before:animate-[hero-pulse_8s_ease-in-out_infinite] pb-5 md:py-12">
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 bg-gradient-to-br from-[#18181b] via-[#6d28d9] to-[#f97316] bg-clip-text text-transparent">
                        The <span className="bg-gradient-to-br from-[#7c3aed] to-[#f97316] bg-clip-text text-transparent">Blog</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Thoughts on server-first development, web performance, and building for the real web.
                    </p>
                </section>

                <section className="py-10">
                    <div className="grid gap-6">
                        {data.posts.map((post: any) => (
                            <a key={post.slug} href={`/blog/${post.slug}`} className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm transition-all duration-250 no-underline block hover:-translate-y-1 hover:shadow-lg hover:border-primary-200 group">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{post.tag}</span>
                                    <span className="text-sm text-neutral-500">{post.date}</span>
                                    <span className="text-sm text-neutral-500">• {post.readTime}</span>
                                </div>
                                <h2 className="text-2xl font-semibold text-neutral-900 mb-3 transition-colors duration-150 group-hover:text-primary-600">{post.title}</h2>
                                <p className="text-neutral-600 leading-relaxed mb-4">{post.excerpt}</p>
                                <span className="text-primary-600 font-medium inline-flex items-center gap-1.5">
                                    Read article →
                                </span>
                            </a>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
}