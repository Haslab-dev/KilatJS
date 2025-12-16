import React from "react";
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Alpine.js Example - KilatJS",
    description: "Interactive components using Alpine.js with server-rendered HTML",
};

export default function AlpineExamplePage() {
    return (
        <Layout currentPath="/examples/alpine">
            <div className="max-w-4xl mx-auto px-6">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Alpine.js Examples</h1>
                <p className="text-neutral-500 mb-8">
                    Lightweight reactivity with Alpine.js - no build step required.
                </p>

                <div className="space-y-8">
                    {/* Counter Example */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Counter</h2>
                        <div 
                            x-data="{ count: 0 }"
                            className="flex items-center gap-4"
                        >
                            <button 
                                x-on:click="count--"
                                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xl font-bold"
                            >
                                -
                            </button>
                            <span x-text="count" className="text-3xl font-bold text-violet-600 min-w-[60px] text-center">0</span>
                            <button 
                                x-on:click="count++"
                                className="w-10 h-10 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xl font-bold"
                            >
                                +
                            </button>
                        </div>
                        <pre className="mt-4 p-3 bg-neutral-50 rounded-lg text-sm overflow-x-auto">
{`<div x-data="{ count: 0 }">
  <button x-on:click="count--">-</button>
  <span x-text="count">0</span>
  <button x-on:click="count++">+</button>
</div>`}
                        </pre>
                    </section>

                    {/* Toggle Example */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Toggle / Accordion</h2>
                        <div x-data="{ open: false }">
                            <button 
                                x-on:click="open = !open"
                                className="w-full flex items-center justify-between p-4 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium"
                            >
                                <span>Click to toggle content</span>
                                <span x-text="open ? '▲' : '▼'">▼</span>
                            </button>
                            <div 
                                x-show="open" 
                                x-transition
                                className="p-4 bg-violet-50 rounded-lg mt-2"
                            >
                                <p>This content is hidden by default and revealed on click!</p>
                            </div>
                        </div>
                        <pre className="mt-4 p-3 bg-neutral-50 rounded-lg text-sm overflow-x-auto">
{`<div x-data="{ open: false }">
  <button x-on:click="open = !open">Toggle</button>
  <div x-show="open" x-transition>
    Hidden content here
  </div>
</div>`}
                        </pre>
                    </section>

                    {/* Tabs Example */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Tabs</h2>
                        <div x-data="{ tab: 'home' }">
                            <div className="flex gap-2 border-b border-neutral-200 mb-4">
                                <button 
                                    x-on:click="tab = 'home'"
                                    x-bind:class="tab === 'home' ? 'border-violet-600 text-violet-600' : 'border-transparent text-neutral-500'"
                                    className="px-4 py-2 border-b-2 font-medium transition-colors"
                                >
                                    Home
                                </button>
                                <button 
                                    x-on:click="tab = 'profile'"
                                    x-bind:class="tab === 'profile' ? 'border-violet-600 text-violet-600' : 'border-transparent text-neutral-500'"
                                    className="px-4 py-2 border-b-2 font-medium transition-colors"
                                >
                                    Profile
                                </button>
                                <button 
                                    x-on:click="tab = 'settings'"
                                    x-bind:class="tab === 'settings' ? 'border-violet-600 text-violet-600' : 'border-transparent text-neutral-500'"
                                    className="px-4 py-2 border-b-2 font-medium transition-colors"
                                >
                                    Settings
                                </button>
                            </div>
                            <div x-show="tab === 'home'" className="p-4 bg-neutral-50 rounded-lg">
                                <p>Welcome to the home tab!</p>
                            </div>
                            <div x-show="tab === 'profile'" className="p-4 bg-neutral-50 rounded-lg">
                                <p>This is your profile information.</p>
                            </div>
                            <div x-show="tab === 'settings'" className="p-4 bg-neutral-50 rounded-lg">
                                <p>Adjust your settings here.</p>
                            </div>
                        </div>
                    </section>

                    {/* Form Validation */}
                    <section className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Live Form Validation</h2>
                        <div x-data="{ email: '', isValid: false }">
                            <input 
                                type="email"
                                x-model="email"
                                x-on:input="isValid = email.includes('@') && email.includes('.')"
                                placeholder="Enter your email"
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <p 
                                x-show="email.length > 0"
                                x-bind:class="isValid ? 'text-emerald-600' : 'text-red-500'"
                                className="mt-2 text-sm"
                            >
                                <span x-show="isValid">✓ Valid email</span>
                                <span x-show="!isValid">✗ Invalid email</span>
                            </p>
                        </div>
                    </section>
                </div>

                <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-800">
                        <strong>Note:</strong> Alpine.js is loaded via CDN in the Layout component. 
                        No build step or npm install required!
                    </p>
                </div>
            </div>
        </Layout>
    );
}
