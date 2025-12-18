import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-white">
          KilatJS + React haha
        </h1>
        <p className="text-slate-400 mb-8">
          This is a full React client-side application running inside the KilatJS framework.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl font-mono font-bold text-white mb-4">
            {count}
          </div>
          <div className="flex gap-4 items-center justify-center">
            <button 
              onClick={() => setCount(c => c - 1)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-semibold"
            >
              Decrease
            </button>
            <button 
              onClick={() => setCount(c => c + 1)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold shadow-lg shadow-blue-500/20"
            >
              Increase
            </button>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-sm text-slate-500 mb-4">KilatJS handles the bundling and serving of this React app.</p>
          <a href="/about" className="text-blue-400 hover:underline">Go to SSR Page</a>
        </div>
      </div>
    </div>
  );
}
