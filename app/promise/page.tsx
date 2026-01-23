"use client";

export default function PromisePage() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-6 pt-20 pb-20 max-w-3xl">
        <div className="space-y-16">
          {/* Title */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">
              Promise
            </h2>
            <p className="text-base md:text-lg font-light text-muted-foreground leading-relaxed">
              This is not a website. It’s a place.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-12 text-base md:text-lg font-light text-muted-foreground leading-relaxed">
            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                This is yours
              </h3>
              <p>
                Every memory you save here belongs to you. Not to algorithms.
                Not to timelines. Not to anyone else. This space is private,
                quiet, and only for you.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                Built for the long term
              </h3>
              <p>
                This is made for the version of you who will open it ten years
                later. The photos. The videos. The tiny moments that once felt
                ordinary… but later become priceless.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                Privacy by design
              </h3>
              <p>
                No likes. No followers. No public profiles. No noise. Just a
                calm place to remember, reflect, and grow. Some parts of life
                should stay yours.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                Your data, your control
              </h3>
              <p>
                You will always be in control of what you keep here. You can
                delete anything. You can export everything. This is your space
                and you decide what it becomes.
              </p>
            </section>

            <section className="pt-8 border-t border-border/40 space-y-4">
              <p className="text-foreground italic">
                Only save what you want to remember forever.
              </p>
              <p className="text-muted-foreground">
                Happy Birthday, baby. This is your quiet corner of the internet.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
