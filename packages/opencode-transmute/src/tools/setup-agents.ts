import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getGitRoot } from "../core/exec";

export const setupAgentsInputSchema = z.object({
  /** Destination directory (defaults to .opencode/agents in repo root) */
  targetDir: z.string().optional(),
  /** Whether to overwrite existing agents */
  overwrite: z.boolean().default(false),
});

export type SetupAgentsInput = z.infer<typeof setupAgentsInputSchema>;

export const setupAgentsOutputSchema = z.object({
  success: z.boolean(),
  installedAgents: z.array(z.string()),
  skippedAgents: z.array(z.string()),
  message: z.string(),
});

export type SetupAgentsOutput = z.infer<typeof setupAgentsOutputSchema>;

/**
 * Setup Agents Tool
 * 
 * Installs (copies) the agent markdown definitions from this plugin 
 * to the user's project .opencode/agents directory.
 */
export async function setupAgents(input: SetupAgentsInput): Promise<SetupAgentsOutput> {
    const validated = setupAgentsInputSchema.parse(input);
    const repoRoot = await getGitRoot();
    
    // Determine source directory (plugin's .opencode/agents)
    // We assume the structure is:
    // node_modules/opencode-transmute/
    //   ├── dist/
    //   ├── .opencode/
    //   │     └── agents/
    //   │           ├── task-manager.md
    //   │           └── cleaner.md
    
    // In dev: src/tools/setup-agents.ts -> ../../.opencode/agents
    // In prod (dist): dist/index.js -> ../.opencode/agents
    
    // We try to find the directory relative to this file's location (which might vary depending on build)
    // A robust way often is resolving relative to package root if possible, or trying adjacent paths.
    
    // Since we are running from 'dist' usually in prod, or 'src' in dev/test.
    // Let's try to locate the agents dir.
    
    // Robustly find the package root by searching up for package.json
    let currentDir = __dirname;
    let pkgRoot = "";
    
    // Search up to 5 levels
    for (let i = 0; i < 5; i++) {
        const checkPath = path.join(currentDir, "package.json");
        try {
            await fs.access(checkPath);
            // Found it
            pkgRoot = currentDir;
            break;
        } catch {
            // ignore
            const parent = path.dirname(currentDir);
            if (parent === currentDir) break; // root
            currentDir = parent;
        }
    }

    if (!pkgRoot) {
         // Fallback to relative assumptions if package.json not found (unlikely)
         pkgRoot = path.resolve(__dirname, "../..");
    }

    const sourceDir = path.join(pkgRoot, ".opencode/agents");
    
    try {
        await fs.access(sourceDir);
    } catch {
        throw new Error(`Could not locate source agents directory at ${sourceDir}. Ensure the plugin is installed correctly.`);
    }
    
    // Determine target directory
    const targetDir = validated.targetDir 
        ? path.resolve(repoRoot, validated.targetDir)
        : path.resolve(repoRoot, ".opencode/agents");
        
    await fs.mkdir(targetDir, { recursive: true });
    
    // List agents to copy
    const agents = await fs.readdir(sourceDir);
    const installed: string[] = [];
    const skipped: string[] = [];
    
    for (const agentFile of agents) {
        if (!agentFile.endsWith(".md")) continue;
        
        const sourcePath = path.join(sourceDir, agentFile);
        const targetPath = path.join(targetDir, agentFile);
        
        // Check existence
        let exists = false;
        try {
            await fs.access(targetPath);
            exists = true;
        } catch {
            // ignore
        }
        
        if (exists && !validated.overwrite) {
            skipped.push(agentFile);
            continue;
        }
        
        await fs.copyFile(sourcePath, targetPath);
        installed.push(agentFile);
    }
    
    return {
        success: true,
        installedAgents: installed,
        skippedAgents: skipped,
        message: `Installed ${installed.length} agents. Skipped ${skipped.length}.`
    };
}
