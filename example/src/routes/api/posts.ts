import { RouteContext } from "../../../../src/core/types";

// In-memory posts storage for demo
const posts: Post[] = [
    {
        id: "1",
        title: "Getting Started with KilatJS",
        slug: "getting-started-with-kilatjs",
        content: "KilatJS is a Bun-native, HTML-first framework that makes building fast, SEO-friendly websites a breeze...",
        excerpt: "Learn how to build your first KilatJS application from scratch.",
        authorId: "1",
        tags: ["tutorial", "kilatjs", "getting-started"],
        status: "published",
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
        id: "2",
        title: "Server-Side Rendering Best Practices",
        slug: "ssr-best-practices",
        content: "Server-side rendering (SSR) offers many benefits for SEO and initial page load performance...",
        excerpt: "Discover the best practices for implementing SSR in your web applications.",
        authorId: "2",
        tags: ["ssr", "performance", "seo"],
        status: "published",
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        id: "3",
        title: "HTMX Integration Guide",
        slug: "htmx-integration-guide",
        content: "HTMX allows you to access modern browser features directly from HTML...",
        excerpt: "A comprehensive guide to integrating HTMX with KilatJS for hypermedia-driven apps.",
        authorId: "1",
        tags: ["htmx", "hypermedia", "integration"],
        status: "published",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
];

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    authorId: string;
    tags: string[];
    status: "draft" | "published";
    createdAt: string;
    updatedAt: string;
}

/**
 * API Route: /api/posts
 * 
 * RESTful API for blog post management.
 * API routes are server-only - they leverage Bun's fast server
 * and don't render HTML.
 */

// GET /api/posts - List all posts
export async function GET(ctx: RouteContext) {
    const page = parseInt(ctx.query.get("page") || "1");
    const limit = parseInt(ctx.query.get("limit") || "10");
    const status = ctx.query.get("status");
    const tag = ctx.query.get("tag");
    const search = ctx.query.get("search")?.toLowerCase();

    let filteredPosts = [...posts];

    // Filter by status
    if (status && (status === "draft" || status === "published")) {
        filteredPosts = filteredPosts.filter(p => p.status === status);
    }

    // Filter by tag
    if (tag) {
        filteredPosts = filteredPosts.filter(p => p.tags.includes(tag.toLowerCase()));
    }

    // Search in title and content
    if (search) {
        filteredPosts = filteredPosts.filter(p =>
            p.title.toLowerCase().includes(search) ||
            p.content.toLowerCase().includes(search) ||
            p.excerpt.toLowerCase().includes(search)
        );
    }

    // Sort by date (newest first)
    filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    // Return without content for list view
    const postsWithoutContent = paginatedPosts.map(({ content, ...rest }) => rest);

    return new Response(JSON.stringify({
        success: true,
        data: postsWithoutContent,
        pagination: {
            page,
            limit,
            total: filteredPosts.length,
            totalPages: Math.ceil(filteredPosts.length / limit),
        },
    }), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
        },
    });
}

// POST /api/posts - Create a new post
export async function POST(ctx: RouteContext) {
    try {
        const body = await ctx.request.json();
        const { title, content, excerpt, authorId, tags = [], status = "draft" } = body;

        // Validation
        if (!title || typeof title !== "string" || title.length < 5) {
            return new Response(JSON.stringify({
                success: false,
                error: "Title is required and must be at least 5 characters",
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!content || typeof content !== "string" || content.length < 20) {
            return new Response(JSON.stringify({
                success: false,
                error: "Content is required and must be at least 20 characters",
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!authorId) {
            return new Response(JSON.stringify({
                success: false,
                error: "Author ID is required",
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        // Check for duplicate slug
        if (posts.find(p => p.slug === slug)) {
            return new Response(JSON.stringify({
                success: false,
                error: "A post with a similar title already exists",
            }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
            });
        }

        const now = new Date().toISOString();
        const newPost: Post = {
            id: String(posts.length + 1),
            title,
            slug,
            content,
            excerpt: excerpt || content.substring(0, 150) + "...",
            authorId,
            tags: Array.isArray(tags) ? tags.map(t => String(t).toLowerCase()) : [],
            status: status === "published" ? "published" : "draft",
            createdAt: now,
            updatedAt: now,
        };

        posts.push(newPost);

        return new Response(JSON.stringify({
            success: true,
            data: newPost,
            message: "Post created successfully",
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


