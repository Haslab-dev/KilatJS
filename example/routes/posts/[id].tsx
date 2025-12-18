import React from "react";
import { Layout } from "../../components/Layout";
import { RouteContext } from "kilatjs";

/**
 * Dynamic Route: /posts/[id]
 * 
 * Shows a single post with comments.
 * This page is SSR at runtime - fetches fresh data on each request.
 */

interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    company: { name: string };
}

interface Comment {
    id: number;
    postId: number;
    name: string;
    email: string;
    body: string;
}

export const meta = {
    title: "Post - KilatJS",
    description: "Read the full post and comments.",
};

export async function load({ params }: RouteContext) {
    const postId = params.id;

    // Fetch post, user, and comments in parallel
    const [postRes, commentsRes] = await Promise.all([
        fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`),
        fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`),
    ]);

    if (!postRes.ok) {
        throw new Response("Post not found", { status: 404 });
    }

    const post: Post = await postRes.json();
    const comments: Comment[] = await commentsRes.json();

    // Fetch author info
    const userRes = await fetch(`https://jsonplaceholder.typicode.com/users/${post.userId}`);
    const author: User = await userRes.json();

    return { post, author, comments };
}

export default function PostDetailPage({ data }: { data: Awaited<ReturnType<typeof load>> }) {
    const { post, author, comments } = data;

    return (
        <Layout currentPath="/posts">
            <div className="max-w-4xl mx-auto px-6 w-full">
                <article>
                    {/* Back link */}
                    <a
                        href="/posts"
                        className="inline-flex items-center gap-2 text-primary-600 no-underline text-sm font-medium mb-6 hover:text-primary-700"
                    >
                        ← Back to Posts
                    </a>

                    {/* Post header */}
                    <header className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-4 capitalize">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4 text-neutral-600">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                                    {author.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">{author.name}</p>
                                    <p className="text-sm text-neutral-500">{author.company.name}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Post body */}
                    <div className="prose prose-lg max-w-none mb-12">
                        <p className="text-neutral-700 leading-relaxed text-lg">{post.body}</p>
                        <p className="text-neutral-700 leading-relaxed text-lg">{post.body}</p>
                        <p className="text-neutral-700 leading-relaxed text-lg">{post.body}</p>
                    </div>

                    {/* Author card */}
                    <div className="bg-primary-50 rounded-xl p-6 mb-12">
                        <h3 className="font-semibold text-neutral-900 mb-2">About the Author</h3>
                        <p className="text-neutral-600">
                            <strong>{author.name}</strong> works at {author.company.name}.
                            Contact: {author.email}
                        </p>
                    </div>

                    {/* Comments section */}
                    <section>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                            Comments ({comments.length})
                        </h2>
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="bg-white rounded-lg border border-neutral-200 p-5"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm font-medium">
                                            {comment.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-900 capitalize">{comment.name}</p>
                                            <p className="text-sm text-neutral-500">{comment.email}</p>
                                        </div>
                                    </div>
                                    <p className="text-neutral-600 pl-11">{comment.body}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </article>
            </div>
        </Layout>
    );
}
