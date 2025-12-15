import React from "react";
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Message Sent - KilatJS",
    description: "Your message has been successfully sent.",
    robots: "noindex,nofollow"
};

export async function load() {
    return {};
}

export default function ContactSuccessPage() {
    return (
        <Layout currentPath="/contact">
            <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="max-w-[600px] mx-auto my-20 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 text-[40px] text-white">
                        ✓
                    </div>
                    <h1 className="text-4xl font-bold text-neutral-900 mb-4">
                        Message Sent!
                    </h1>
                    <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                        Thank you for reaching out. We'll get back to you as soon as possible.
                    </p>
                    <a href="/" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-base rounded-xl cursor-pointer border-none transition-all duration-150 text-white shadow-lg bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_0_30px_-10px_#8b5cf6] hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/0.1),0_0_40px_-10px_#8b5cf6]">
                        Back to Home
                    </a>
                </div>
            </div>
        </Layout>
    );
}
