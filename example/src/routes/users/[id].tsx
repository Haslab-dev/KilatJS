import React from "react";
import { Layout } from "../../components/Layout";
import { RouteContext } from "../../../../src/core/types";

/**
 * Dynamic Route: /users/[id]
 * 
 * Shows user profile with their posts and todos.
 * SSR at runtime - fetches fresh data on each request.
 */

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    website: string;
    company: { name: string; catchPhrase: string; bs: string };
    address: { street: string; suite: string; city: string; zipcode: string };
}

interface Post {
    id: number;
    title: string;
    body: string;
}

interface Todo {
    id: number;
    title: string;
    completed: boolean;
}

export const meta = {
    title: "User Profile - KilatJS",
    description: "View user profile and activity.",
};

export async function load({ params }: RouteContext) {
    const userId = params.id;

    // Fetch user, posts, and todos in parallel
    const [userRes, postsRes, todosRes] = await Promise.all([
        fetch(`https://jsonplaceholder.typicode.com/users/${userId}`),
        fetch(`https://jsonplaceholder.typicode.com/users/${userId}/posts`),
        fetch(`https://jsonplaceholder.typicode.com/users/${userId}/todos`),
    ]);

    if (!userRes.ok) {
        throw new Response("User not found", { status: 404 });
    }

    const user: User = await userRes.json();
    const posts: Post[] = await postsRes.json();
    const todos: Todo[] = await todosRes.json();

    return { user, posts: posts.slice(0, 5), todos: todos.slice(0, 10) };
}

export default function UserProfilePage({ data }: { data: Awaited<ReturnType<typeof load>> }) {
    const { user, posts, todos } = data;
    const completedTodos = todos.filter((t) => t.completed).length;

    return (
        <Layout currentPath="/users">
            <div className="max-w-4xl mx-auto px-6 w-full">
                {/* Back link */}
                <a
                    href="/users"
                    className="inline-flex items-center gap-2 text-primary-600 no-underline text-sm font-medium mb-6 hover:text-primary-700"
                >
                    ← Back to Users
                </a>

                {/* Profile header */}
                <div className="bg-gradient-to-br from-primary-500 to-orange-500 rounded-2xl p-8 text-white mb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                            <p className="text-white/80 text-lg">@{user.username}</p>
                        </div>
                    </div>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <h3 className="font-semibold text-neutral-900 mb-4">Contact Info</h3>
                        <div className="space-y-3 text-sm">
                            <p className="flex items-center gap-3">
                                <span className="text-neutral-400">📧</span>
                                <span className="text-neutral-700">{user.email}</span>
                            </p>
                            <p className="flex items-center gap-3">
                                <span className="text-neutral-400">📱</span>
                                <span className="text-neutral-700">{user.phone}</span>
                            </p>
                            <p className="flex items-center gap-3">
                                <span className="text-neutral-400">🌐</span>
                                <span className="text-neutral-700">{user.website}</span>
                            </p>
                            <p className="flex items-center gap-3">
                                <span className="text-neutral-400">📍</span>
                                <span className="text-neutral-700">
                                    {user.address.street}, {user.address.city}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <h3 className="font-semibold text-neutral-900 mb-4">Company</h3>
                        <div className="space-y-3">
                            <p className="font-medium text-neutral-900">{user.company.name}</p>
                            <p className="text-sm text-neutral-600 italic">"{user.company.catchPhrase}"</p>
                            <p className="text-sm text-neutral-500">{user.company.bs}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-primary-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-primary-600">{posts.length}</p>
                        <p className="text-sm text-neutral-600">Recent Posts</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{completedTodos}</p>
                        <p className="text-sm text-neutral-600">Completed</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-orange-600">{todos.length - completedTodos}</p>
                        <p className="text-sm text-neutral-600">Pending</p>
                    </div>
                </div>

                {/* Recent posts */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4">Recent Posts</h2>
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <a
                                key={post.id}
                                href={`/posts/${post.id}`}
                                className="block bg-white rounded-lg border border-neutral-200 p-4 hover:border-primary-200 hover:shadow transition-all no-underline"
                            >
                                <h3 className="font-medium text-neutral-900 capitalize mb-1">{post.title}</h3>
                                <p className="text-sm text-neutral-500 line-clamp-1">{post.body}</p>
                            </a>
                        ))}
                    </div>
                </section>

                {/* Todos */}
                <section>
                    <h2 className="text-xl font-bold text-neutral-900 mb-4">Recent Todos</h2>
                    <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                        {todos.map((todo) => (
                            <div key={todo.id} className="flex items-center gap-3 p-4">
                                <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                        todo.completed
                                            ? "bg-green-100 text-green-600"
                                            : "bg-neutral-100 text-neutral-400"
                                    }`}
                                >
                                    {todo.completed ? "✓" : "○"}
                                </span>
                                <span
                                    className={`flex-1 ${
                                        todo.completed ? "text-neutral-400 line-through" : "text-neutral-700"
                                    }`}
                                >
                                    {todo.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
}
