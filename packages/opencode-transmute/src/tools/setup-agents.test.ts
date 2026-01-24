import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupAgents } from "./setup-agents";
import * as execCore from "../core/exec";
import * as fs from "node:fs/promises";

vi.mock("../core/exec");
// We don't mock fs globally because we want to test copying, but we will mock specific calls if needed or use temp dirs.
// Actually mocking fs for copy operations is safer/faster.
vi.mock("node:fs/promises");

describe("setupAgents Tool", () => {
    
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(execCore.getGitRoot).mockResolvedValue("/repo/root");
        
        // Mock fs access to simulate source finding
        vi.mocked(fs.access).mockResolvedValue(undefined); // Success
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    });
    
    it("should locate source agents and copy them", async () => {
        // Mock readdir to return our agents
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(fs.readdir).mockResolvedValue(["task-manager.md", "cleaner.md"] as any);
        
        // Mock access to fail for target files (so they don't exist yet)
        // Mock access to fail for target files (so they don't exist yet)
        vi.mocked(fs.access).mockImplementation(async (p) => {
            const pStr = p as string;
            
            // Simulate finding package.json in "root" (simulated via up-search)
            if (pStr.endsWith("package.json")) {
                // Return success immediately to simulate we are at root
                 return undefined;
            }

            // Simulate source directory exists (now relative to found root)
            if (pStr.includes(".opencode/agents") && !pStr.endsWith(".md")) {
                return undefined;
            }
            // Simulate source files exist (checking if they are in our list)
            if (pStr.includes("task-manager.md") || pStr.includes("cleaner.md")) {
                 if (pStr.includes("/repo/root/") && !pStr.includes("node_modules")) {
                     // Fails for TARGET (unless overwrite test)
                     // But wait, setup-agents.ts resolves targetDir based on input.
                     // The test default uses .opencode/agents.
                     // We need to distinguish Source vs Target access checks.
                     // Source is constructed from __dirname + up-search.
                     // Target is repoRoot + .opencode/agents.
                     
                     // In the test context `execCore.getGitRoot` returns `/repo/root`.
                     // So target paths start with `/repo/root`.
                     // Setup-agents finds pkgRoot relative to __dirname. 
                     // We haven't mocked __dirname but we can assume source path is diff.
                     
                     if (pStr.startsWith("/repo/root")) {
                        throw new Error("ENOENT");
                     }
                 }
                 return undefined;
            }
            
            // Default fail
            throw new Error("ENOENT");
        });
        
        const result = await setupAgents({ overwrite: false });
        
        expect(result.success).toBe(true);
        expect(result.installedAgents).toEqual(["task-manager.md", "cleaner.md"]);
        expect(fs.copyFile).toHaveBeenCalledTimes(2);
        // Verify target path constructed correctly
        expect(fs.copyFile).toHaveBeenCalledWith(
            expect.stringContaining("task-manager.md"),
            "/repo/root/.opencode/agents/task-manager.md"
        );
    });
    
    it("should skip existing files if overwrite is false", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(fs.readdir).mockResolvedValue(["task-manager.md"] as any);
        
        // Mock access to succeed for target file (it exists)
        vi.mocked(fs.access).mockResolvedValue(undefined);

        const result = await setupAgents({ overwrite: false });
        
        expect(result.installedAgents).toEqual([]);
        expect(result.skippedAgents).toEqual(["task-manager.md"]);
        expect(fs.copyFile).not.toHaveBeenCalled();
    });

    it("should overwrite existing files if overwrite is true", async () => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         vi.mocked(fs.readdir).mockResolvedValue(["task-manager.md"] as any);
         vi.mocked(fs.access).mockResolvedValue(undefined); // exists

         const result = await setupAgents({ overwrite: true });
         
         expect(result.installedAgents).toEqual(["task-manager.md"]);
         expect(fs.copyFile).toHaveBeenCalledTimes(1);
    });
});
