#!/usr/bin/env bun

/**
 * KilatJS CLI
 * 
 * Uses `bun --hot` for module-level hot reloading in development.
 * This provides fast reloads without full process restarts.
 */

const args = process.argv.slice(2);
const command = args[0];

// Check if we're already running with --hot
const isHotMode = process.env.__KILAT_HOT === "1";
const isProduction = args.includes("--production");

if (command === "dev" && !isHotMode && !isProduction) {
    // Re-launch with bun --hot for native hot reloading (silent)
    const scriptPath = import.meta.path;
    const proc = Bun.spawn(["bun", "--hot", scriptPath, ...args], {
        stdio: ["inherit", "inherit", "inherit"],
        env: { ...process.env, __KILAT_HOT: "1" },
        cwd: process.cwd(),
    });
    
    // Forward exit code
    const exitCode = await proc.exited;
    process.exit(exitCode);
} else {
    // Run the CLI normally
    const { runCLI } = await import("./index");
    
    runCLI(args).catch(error => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
}
