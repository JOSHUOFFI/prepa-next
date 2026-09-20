"use client";

export default function CatalogueError({ reset }: { reset: () => void }) {
  return (
    <main className="catalogue-page">
      <section className="catalogue-empty catalogue-empty--error" role="alert">
        <span className="catalogue-empty__mark" aria-hidden="true">!</span>
        <h1>Subjects are taking a moment</h1>
        <p>We could not load the catalogue right now. Please try again.</p>
        <button className="btn btn-primary" type="button" onClick={() => reset()}>Try again</button>
      </section>
    </main>
  );
}
