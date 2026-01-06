import React from "react";
import { RouteContext, Middleware, PageProps } from "kilatjs";

// Page-specific middleware that adds a timestamp to the request state
const timeMiddleware: Middleware = async (ctx, next) => {
    ctx.state.middlewareTime = new Date().toISOString();
    return next();
};

export const middlewares = [timeMiddleware];

export const meta = {
    title: "Middleware SSR Demo",
    description: "Demonstrating middleware in SSR routes",
};

export async function load(ctx: RouteContext) {
    return {
        message: "This page was processed by page-specific middleware!",
        middlewareTime: ctx.state.middlewareTime,
    };
}

export default function MiddlewareSSRPage({ data }: PageProps) {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-xl w-full">
                <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Middleware SSR Demo
                </h1>
                
                <div className="space-y-6">
                    <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <p className="text-slate-300 mb-2 uppercase text-xs font-bold tracking-wider">Message from Loader</p>
                        <p className="text-xl">{data.message}</p>
                    </div>

                    <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <p className="text-slate-300 mb-2 uppercase text-xs font-bold tracking-wider">Data from Middleware (via State)</p>
                        <p className="font-mono text-blue-400">{data.middlewareTime}</p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-700">
                    <a href="/" className="text-blue-400 hover:underline">← Back to Home</a>
                </div>
            </div>
        </div>
    );
}
