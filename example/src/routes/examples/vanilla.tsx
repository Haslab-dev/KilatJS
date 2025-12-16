import React from "react";
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Vanilla JS Example - KilatJS",
    description: "Interactive components using plain JavaScript",
};

// Client-side script - exported as function so LSP/TypeScript can check it
// This gets serialized and injected into the page
export function clientScript() {
    // Counter
    let count = 0;
    const countEl = document.getElementById("count")!;
    document.getElementById("decrement")!.onclick = () => {
        countEl.textContent = String(--count);
    };
    document.getElementById("increment")!.onclick = () => {
        countEl.textContent = String(++count);
    };

    // Toggle
    const toggleBtn = document.getElementById("toggle-btn")!;
    const toggleContent = document.getElementById("toggle-content")!;
    const toggleIcon = document.getElementById("toggle-icon")!;
    toggleBtn.onclick = () => {
        toggleContent.classList.toggle("hidden");
        toggleIcon.textContent = toggleContent.classList.contains("hidden") ? "▼" : "▲";
    };

    // Modal
    const modalBackdrop = document.getElementById("modal-backdrop")!;
    document.getElementById("open-modal")!.onclick = () => {
        modalBackdrop.classList.remove("hidden");
    };
    document.getElementById("close-modal")!.onclick = () => {
        modalBackdrop.classList.add("hidden");
    };
    modalBackdrop.onclick = (e) => {
        if (e.target === modalBackdrop) modalBackdrop.classList.add("hidden");
    };

    // Character Counter
    const textarea = document.getElementById("textarea") as HTMLTextAreaElement;
    const charCount = document.getElementById("char-count")!;
    textarea.oninput = () => {
        charCount.textContent = String(textarea.value.length);
    };

    // Copy to Clipboard
    const copyInput = document.getElementById("copy-input") as HTMLInputElement;
    const copyBtn = document.getElementById("copy-btn")!;
    const copyFeedback = document.getElementById("copy-feedback")!;
    copyBtn.onclick = async () => {
        await navigator.clipboard.writeText(copyInput.value);
        copyFeedback.classList.remove("hidden");
        setTimeout(() => copyFeedback.classList.add("hidden"), 2000);
    };
}

export default function VanillaJSExamplePage() {
    return (
        <Layout currentPath="/examples/vanilla">
            <div className="max-w-4xl mx-auto px-6">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Vanilla JavaScript Examples</h1>
                <p className="text-neutral-500 mb-8">
                    Pure JavaScript - no frameworks, no dependencies.
                </p>

                <div className="space-y-8">
                    {/* Counter Example */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Counter</h2>
                        <div className="flex items-center gap-4">
                            <button 
                                id="decrement"
                                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xl font-bold cursor-pointer"
                            >
                                -
                            </button>
                            <span id="count" className="text-3xl font-bold text-violet-600 min-w-[60px] text-center">0</span>
                            <button 
                                id="increment"
                                className="w-10 h-10 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xl font-bold cursor-pointer"
                            >
                                +
                            </button>
                        </div>
                    </section>

                    {/* Toggle Example */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Toggle Panel</h2>
                        <button 
                            id="toggle-btn"
                            className="w-full flex items-center justify-between p-4 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium cursor-pointer"
                        >
                            <span>Click to toggle</span>
                            <span id="toggle-icon">▼</span>
                        </button>
                        <div 
                            id="toggle-content"
                            className="hidden p-4 bg-violet-50 rounded-lg mt-2"
                        >
                            <p>This content toggles on click!</p>
                        </div>
                    </section>

                    {/* Modal Example */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Modal Dialog</h2>
                        <button 
                            id="open-modal"
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium cursor-pointer"
                        >
                            Open Modal
                        </button>
                        
                        <div 
                            id="modal-backdrop"
                            className="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        >
                            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                                <h3 className="text-xl font-semibold mb-4">Modal Title</h3>
                                <p className="text-neutral-600 mb-6">
                                    This is a simple modal built with vanilla JavaScript. 
                                    Click outside or press the button to close.
                                </p>
                                <button 
                                    id="close-modal"
                                    className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-lg font-medium cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Character Counter */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Character Counter</h2>
                        <textarea 
                            id="textarea"
                            placeholder="Type something..."
                            maxLength={200}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                            rows={3}
                        ></textarea>
                        <p className="mt-2 text-sm text-neutral-500">
                            <span id="char-count">0</span> / 200 characters
                        </p>
                    </section>

                    {/* Copy to Clipboard */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Copy to Clipboard</h2>
                        <div className="flex gap-2">
                            <input 
                                id="copy-input"
                                type="text"
                                defaultValue="bun add kilatjs"
                                readOnly
                                className="flex-1 px-4 py-2 bg-neutral-100 border border-neutral-300 rounded-lg font-mono text-sm"
                            />
                            <button 
                                id="copy-btn"
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium cursor-pointer"
                            >
                                Copy
                            </button>
                        </div>
                        <p id="copy-feedback" className="mt-2 text-sm text-emerald-600 hidden">
                            ✓ Copied to clipboard!
                        </p>
                    </section>
                </div>
            </div>
            {/* clientScript is auto-injected by the framework! */}
        </Layout>
    );
}
