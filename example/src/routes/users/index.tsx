import React from "react";
import { Layout } from "../../components/Layout";
import { RouteContext } from "kilatjs";

/**
 * Static Route: /users
 * 
 * Lists all users from JSONPlaceholder API.
 */

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    website: string;
    company: { name: string; catchPhrase: string };
    address: { city: string };
}

export const meta = {
    title: "Users - KilatJS",
    description: "Browse all users in our community.",
};

export async function load(_ctx: RouteContext) {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    const users: User[] = await response.json();
    return { users };
}

export default function UsersPage({ data }: { data: { users: User[] } }) {
    const { users } = data;

    return (
        <Layout currentPath="/users">
            <div className="max-w-6xl mx-auto px-6 w-full">
                <header className="mb-10">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-3">Users</h1>
                    <p className="text-neutral-600">
                        {users.length} users from JSONPlaceholder API
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <a
                            key={user.id}
                            href={`/users/${user.id}`}
                            className="block bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-200 no-underline"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-white text-xl font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-neutral-900">{user.name}</h2>
                                    <p className="text-sm text-neutral-500">@{user.username}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="text-neutral-600">
                                    <span className="text-neutral-400">📧</span> {user.email}
                                </p>
                                <p className="text-neutral-600">
                                    <span className="text-neutral-400">🏢</span> {user.company.name}
                                </p>
                                <p className="text-neutral-600">
                                    <span className="text-neutral-400">📍</span> {user.address.city}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
