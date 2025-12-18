import React from "react";
import { Layout } from "../../components/Layout";
import { RouteContext } from "kilatjs";

/**
 * SSR Route: /posts
 * 
 * Lists all posts from JSONPlaceholder API.
 * Rendered on each request for fresh data.
 */

export const mode = "ssr";

interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

export const meta = {
    title: "Posts - KilatJS",
    description: "Browse all posts from our community.",
    robots: "index,follow",
};

export async function load({ query }: RouteContext) {
    const page = parseInt(query.get("page") || "1");
    const limit = 10;

    // Fetch posts from JSONPlaceholder
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const allPosts: Post[] = await response.json();

    // Paginate
    const start = (page - 1) * limit;
    const posts = allPosts.slice(start, start + limit);
    const totalPages = Math.ceil(allPosts.length / limit);

    return { posts, page, totalPages, total: allPosts.length };
}

export default function PostsPage({ data }: { data: Awaited<ReturnType<typeof load>> }) {
    const { posts, page, totalPages, total } = data;

    return (
        <Layout currentPath="/posts">
            <div className="max-w-4xl mx-auto px-6 w-full">
                <header className="mb-10">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-3">Posts</h1>
                    <p className="text-neutral-600">
                        Showing {posts.length} of {total} posts from JSONPlaceholder API
                    </p>
                </header>

                <div className="space-y-6">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-200"
                        >
                            <a href={`/posts/${post.id}`} className="block no-underline">
                                <h2 className="text-xl font-semibold text-neutral-900 mb-2 hover:text-primary-600 transition-colors capitalize">
                                    {post.title}
                                </h2>
                                <p className="text-neutral-600 line-clamp-2">{post.body}</p>
                                <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
                                    <span className="px-2 py-1 bg-neutral-100 rounded">Post #{post.id}</span>
                                    <span>User #{post.userId}</span>
                                </div>
                            </a>
                        </article>
                    ))}
                </div>

                {/* Pagination */}
                <nav className="mt-10 flex justify-center gap-2">
                    {page > 1 && (
                        <a
                            href={`/posts?page=${page - 1}`}
                            className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 no-underline"
                        >
                            ← Previous
                        </a>
                    )}

                    <span className="px-4 py-2 text-neutral-600">
                        Page {page} of {totalPages}
                    </span>

                    {page < totalPages && (
                        <a
                            href={`/posts?page=${page + 1}`}
                            className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 no-underline"
                        >
                            Next →
                        </a>
                    )}
                </nav>
            </div>
        </Layout>
    );
}
