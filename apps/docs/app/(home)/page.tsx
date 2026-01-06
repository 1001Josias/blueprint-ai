import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 text-4xl font-bold">BlueprintAI</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Intelligent Task Management System designed for Agents and Humans.
      </p>
      
      <div className="flex justify-center gap-4 mb-16">
        <Link 
          href="/docs" 
          className="rounded-full bg-foreground text-background px-6 py-3 font-medium transition-colors hover:bg-muted-foreground"
        >
          Get Started
        </Link>
        <a 
          href="https://github.com/1001Josias/blueprint-ai" 
          target="_blank" 
          rel="noreferrer"
          className="rounded-full border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
        >
          GitHub
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4 text-left">
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h3 className="font-semibold text-xl mb-2">Designed for Agents</h3>
          <p className="text-muted-foreground">
            Generate PRDs and Tasks using standard Markdown. A simple interface ideal for LLMs.
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h3 className="font-semibold text-xl mb-2">Built for Humans</h3>
          <p className="text-muted-foreground">
            Rich, interactive interfaces that parse agent-generated files into a premium UI experience.
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h3 className="font-semibold text-xl mb-2">Bridge to Enterprise</h3>
          <p className="text-muted-foreground">
            Designed to integrate with enterprise systems like Jira and Linear, closing the loop.
          </p>
        </div>
      </div>
    </main>
  );
}
