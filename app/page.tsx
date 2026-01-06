import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-lg font-light tracking-wide text-foreground">A Space for Arunima</h1>
          <nav className="flex items-center gap-8">
            <Link
              href="/vault"
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              Memories
            </Link>
            <Link
              href="/goals"
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              Goals
            </Link>
            <Link
              href="/promise"
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              Promise
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <p className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-balance text-foreground">
              A quiet place to hold <span className="italic">your moments</span>
            </p>
            <p className="text-base md:text-lg font-light text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
  Store the memories that matter.
  <br />
  Keep the promises you make.
  <br />
  <span className="font-normal">
    Build a vault of your life.
  </span>
</p>


          </div>

          <div className="pt-6">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-light text-base px-12 py-6 rounded-lg transition-all"
            >
              <Link href="/vault">Enter Your Space</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/40">
        <div className="container mx-auto text-center">
          <p className="text-sm font-light text-muted-foreground"> This will grow with you.</p>
        </div>
      </footer>
    </div>
  )
}
