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
              This is not just a website. It’s a quiet place that’s yours.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 text-base md:text-lg font-light text-muted-foreground leading-relaxed">

            <section className="space-y-4">
              <p>
                I don’t know where life will take you. I don’t know how much things will change.
                But I know that the moments you’ve lived, the smiles you’ve had,
                and the version of you that exists today deserves to be remembered.
              </p>
              <p className="text-foreground">
                Thank you for everything.
              </p>
            </section>

            <section className="space-y-4">
              <p>
                This space is for the memories that matter.
              </p>
            </section>

            <section className="space-y-4">
              <p>
                There are no eyes here. No noise. No world watching.
                Just a calm corner of the internet where your life can quietly exist,
                exactly the way it was.
              </p>
            </section>

            <section className="space-y-4">
              <p>
                You can keep what you love. You can delete what you outgrow.
                This space will grow with you, just like you are meant to.
              </p>
              <p className="text-foreground italic">
                Only save what you would want to remember forever.
              </p>
            </section>

            <section className="pt-8 border-t border-border/40 space-y-4">
              <p className="text-muted-foreground">
                Happy Birthday, baby. This little space was made with care, just for you.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
