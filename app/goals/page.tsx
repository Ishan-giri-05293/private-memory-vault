import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"

// Sample data
const goals = [
  {
    id: 1,
    title: "Build a garden sanctuary",
    targetDate: "Spring 2025",
    status: "In Progress",
  },
  {
    id: 2,
    title: "Learn to play piano",
    targetDate: "December 2025",
    status: "Not Started",
  },
  {
    id: 3,
    title: "Write morning pages daily",
    targetDate: "Ongoing",
    status: "In Progress",
  },
]

export default function GoalsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-lg font-light tracking-wide text-foreground">A Space for Arunima</h1>
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/vault"
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              Memories
            </Link>
            <Link href="/goals" className="text-sm font-light text-foreground transition-colors">
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

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-4xl">
        <div className="space-y-12">
          {/* Title Section */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">Goals & Milestones</h2>
            <p className="text-base font-light text-muted-foreground leading-relaxed max-w-2xl">
              Quiet intentions. Patient progress. A reflection of who you're becoming.
            </p>
          </div>

          {/* Add Goal Button */}
          <div>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-accent/50 text-foreground font-light text-sm px-8 py-5 gap-3 bg-transparent"
            >
              <Plus className="w-4 h-4" />
              Add a Goal
            </Button>
          </div>

          {/* Goals List */}
          <div className="space-y-4">
            {goals.map((goal) => (
              <Card
                key={goal.id}
                className="p-8 bg-card hover:bg-accent/30 border-border transition-all cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-light text-foreground">{goal.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-light text-muted-foreground">
                      <span>{goal.targetDate}</span>
                      <span className="text-border">•</span>
                      <span className={goal.status === "In Progress" ? "text-foreground/70" : ""}>{goal.status}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
