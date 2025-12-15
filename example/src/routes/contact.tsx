import React from "react";
import { Layout } from "../components/Layout";
import { RouteContext } from "../../../src/core/types";
export const meta = {
    title: "Contact Us - KilatJS",
    description: "Get in touch with the KilatJS team. We'd love to hear from you!",
    robots: "index,follow"
};

export async function load() {
    return {
        submitted: false
    };
}

export async function POST({ request }: RouteContext) {
    try {
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const subject = formData.get("subject") as string;
        const message = formData.get("message") as string;

        // Validate
        if (!name || !email || !message) {
            console.error("Missing required fields");
            return Response.redirect("/contact?error=missing-fields", 302);
        }

        // In a real app, you would:
        // - Save to database
        // - Send email notification
        // - Queue for processing
        console.log("📧 Contact form submission:", { name, email, subject, message });

        // PRG Pattern: Redirect after successful POST
        return Response.redirect("/contact/success", 302);
    } catch (error) {
        console.error("Error processing contact form:", error);
        return Response.redirect("/contact?error=server-error", 302);
    }
}

export default function ContactPage({ data }: { data: any; params: any; state: any }) {
    return (
        <Layout currentPath="/contact">
            <div className="max-w-7xl mx-auto px-6 w-full">
                <section className="py-20 text-center relative overflow-hidden before:content-[''] before:absolute before:-top-1/2 before:-left-1/2 before:w-[200%] before:h-[200%] before:opacity-50 before:-z-10 before:bg-[radial-gradient(circle_at_center,#ede9fe_0%,transparent_50%)] before:animate-[hero-pulse_8s_ease-in-out_infinite] pb-5 md:py-12">
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 bg-gradient-to-br from-[#18181b] via-[#6d28d9] to-[#f97316] bg-clip-text text-transparent">
                        Get in <span className="bg-gradient-to-br from-[#7c3aed] to-[#f97316] bg-clip-text text-transparent">Touch</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Have a question or want to learn more about KilatJS? We'd love to hear from you.
                    </p>
                </section>

                <div className="max-w-xl mx-auto bg-white rounded-2xl p-12 border border-neutral-200 shadow-md md:py-8 md:px-6">
                    <form method="POST" action="/contact">
                        <div className="mb-6">
                            <label htmlFor="name" className="block text-sm font-semibold text-neutral-700 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="w-full px-4 py-3.5 font-sans text-base text-neutral-900 bg-neutral-50 border-2 border-neutral-200 rounded-lg transition-all duration-150 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="w-full px-4 py-3.5 font-sans text-base text-neutral-900 bg-neutral-50 border-2 border-neutral-200 rounded-lg transition-all duration-150 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
                                placeholder="john@example.com"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="subject" className="block text-sm font-semibold text-neutral-700 mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                className="w-full px-4 py-3.5 font-sans text-base text-neutral-900 bg-neutral-50 border-2 border-neutral-200 rounded-lg transition-all duration-150 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
                                placeholder="What's this about?"
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="message" className="block text-sm font-semibold text-neutral-700 mb-2">
                                Message *
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                className="w-full px-4 py-3.5 font-sans text-base text-neutral-900 bg-neutral-50 border-2 border-neutral-200 rounded-lg transition-all duration-150 min-h-[160px] resize-y focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
                                placeholder="Tell us what you're thinking..."
                                required
                            />
                        </div>

                        <button type="submit" className="w-full py-4 text-white font-semibold text-base border-none rounded-lg cursor-pointer transition-all duration-150 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/0.1),0_0_30px_-10px_#8b5cf6]">
                            Send Message →
                        </button>
                    </form>

                    <p className="mt-6 text-center text-neutral-500 text-sm">
                        This form works without JavaScript — powered by KilatJS's PRG pattern.
                    </p>
                </div>
            </div>
        </Layout>
    );
}