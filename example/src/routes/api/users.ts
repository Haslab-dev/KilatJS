import { RouteContext } from "../../../../src/core/types";

// In-memory user storage for demo
const users: User[] = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "admin", createdAt: new Date().toISOString() },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "user", createdAt: new Date().toISOString() },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "user", createdAt: new Date().toISOString() },
];

interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
}

/**
 * API Route: /api/users
 * 
 * RESTful API for user management.
 * API routes are server-only - they leverage Bun's fast server
 * and don't render HTML.
 */

// GET /api/users - List all users
export async function GET(ctx: RouteContext) {
    const page = parseInt(ctx.query.get("page") || "1");
    const limit = parseInt(ctx.query.get("limit") || "10");
    const role = ctx.query.get("role");

    let filteredUsers = [...users];

    // Filter by role if specified
    if (role && (role === "admin" || role === "user")) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    return new Response(JSON.stringify({
        success: true,
        data: paginatedUsers,
        pagination: {
            page,
            limit,
            total: filteredUsers.length,
            totalPages: Math.ceil(filteredUsers.length / limit),
        },
    }), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
        },
    });
}

// POST /api/users - Create a new user
export async function POST(ctx: RouteContext) {
    try {
        const body = await ctx.request.json();
        const { name, email, role = "user" } = body;

        // Validation
        if (!name || typeof name !== "string" || name.length < 2) {
            return new Response(JSON.stringify({
                success: false,
                error: "Name is required and must be at least 2 characters",
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return new Response(JSON.stringify({
                success: false,
                error: "Valid email is required",
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check for duplicate email
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return new Response(JSON.stringify({
                success: false,
                error: "Email already exists",
            }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
            });
        }

        const newUser: User = {
            id: String(users.length + 1),
            name,
            email,
            role: role === "admin" ? "admin" : "user",
            createdAt: new Date().toISOString(),
        };

        users.push(newUser);

        return new Response(JSON.stringify({
            success: true,
            data: newUser,
            message: "User created successfully",
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: "Invalid JSON body",
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
}


