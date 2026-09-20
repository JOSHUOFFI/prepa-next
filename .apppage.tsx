import { ButtonLink } from "@/components/button-link";

const steps = [
  {
    title: "Choose",
    description: "Select the subject you want to focus on and begin with a clear study target.",
  },
  {
    title: "Practice",
    description: "Work through a structured CBT-style session designed for focused preparation.",
  },
  {
    title: "Submit",
    description: "Finish the session and move straight into a review-ready experience.",
  },
  {
    title: "Improve",
    description: "Use your results to guide the next revision step and build better habits over time.",
  },
];

const features = [
  {
    title: "CBT practice",
    status: "Active",
    description: "Take subject-based practice in a clean, exam-style experience built for students.",
  },
  {
    title: "Subject-based preparation",
    status: "Active",
    description: "Choose a subject and focus your session on the most relevant preparation path.",
  },
  {
    title: "Instant results",
    status: "Available",
    description: "Review exam outcomes clearly and understand what needs attention next.",
  },
  {
    title: "Performance tracking",
    status: "Coming soon",
    description: "A clearer view of progress across study sessions is being developed.",
  },
  {
    title: "Exam preparation",
    status: "Active",
    description: "Use PrePa as a practical tool to prepare for assessments in a more organised way.",
  },
  {
    title: "Continuous improvement",
    status: "Coming soon",
    description: "The learning experience is being shaped to support steady progress over time.",
  },
];

const reasons = [
  {
    title: "Structured practice",
    description: "Students can work through a subject in a focused, manageable way instead of moving aimlessly between tasks.",
  },
  {
    title: "Focused preparation",
    description: "Each session encourages deliberate revision and helps students build a stronger study rhythm.",
  },
  {
    title: "Immediate feedback",
    description: "Clear outcomes help students quickly see what they understand and where they still need support.",
  },
  {
    title: "Accessible learning",
    description: "PrePa is designed to make digital study more practical, consistent, and easy to return to.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" id="top">
        <div className="landing-hero__copy">
          <p className="landing-kicker">PrePa CBT practice</p>
          <h1>Build exam confidence with focused, subject-based preparation.</h1>
          <p>
            PrePa is a digital study platform for students who want a clearer, more structured way to practise,
            review, and improve before exams.
          </p>

          <div className="landing-hero__actions">
            <ButtonLink href="/register">Start Practising</ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary">Explore PrePa</ButtonLink>
          </div>

          <div className="landing-hero__meta" aria-label="PrePa product highlights">
            <span>EdTech platform</span>
            <span>CBT practice</span>
            <span>Subject-focused learning</span>
          </div>
        </div>

        <div className="product-preview" aria-label="Representative PrePa product interface preview">
          <div className="product-preview__top">
            <span>PrePa</span>
            <span>Subject practice</span>
          </div>
          <div className="product-preview__body">
            <p>Question 04 of 20</p>
            <h2>Which option best completes the statement?</h2>
            <div className="product-preview__options">
              <span><b>A</b> First answer option</span>
              <span className="is-selected"><b>B</b> Selected answer option</span>
              <span><b>C</b> Another answer option</span>
            </div>
          </div>
          <aside className="product-preview__result">
            <span>Result preview</span>
            <strong>78%</strong>
            <small>Clear performance review</small>
            <i>Ready to review</i>
          </aside>
        </div>
      </section>

      <section className="landing-value" id="how-it-works">
        <div className="landing-value__intro">
          <p className="eyebrow">How PrePa works</p>
          <h2>Simple steps for a better study routine.</h2>
          <p>
            PrePa keeps the process practical: choose a subject, work through a guided practice session, and use the
            result to focus the next step.
          </p>
        </div>

        <div className="landing-value__items">
          {steps.map((step, index) => (
            <article key={step.title}>
              <span>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-heading">
          <p className="eyebrow">What students can do</p>
          <h2>Study with more clarity and less guesswork.</h2>
        </div>

        <div className="landing-feature-grid">
          {features.map(feature => (
            <article className="landing-feature-card" key={feature.title}>
              <div className="landing-feature-card__topline">
                <h3>{feature.title}</h3>
                <span>{feature.status}</span>
              </div>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-why" id="why-prepa">
        <div className="landing-section-heading">
          <p className="eyebrow">Why PrePa</p>
          <h2>Focused preparation for real learning progress.</h2>
        </div>

        <div className="landing-why__grid">
          {reasons.map(reason => (
            <article key={reason.title} className="landing-why__card">
              <h3>{reason.title}</h3>
              <p>{reason.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-showcase" aria-labelledby="product-preview-heading">
        <div className="landing-showcase__card">
          <p className="eyebrow">Product preview</p>
          <h2 id="product-preview-heading">A working practice experience, designed for everyday study.</h2>
          <p>
            PrePa is not just a concept. It is structured around a real student flow: choose a subject, take a
            practice exam, and review the outcome with clarity.
          </p>

          <div className="landing-showcase__score">
            <span>Session snapshot</span>
            <strong>Focused revision path</strong>
            <i>Review-ready practice</i>
          </div>
        </div>

        <div className="landing-showcase__benefits">
          <article>
            <h3>Subject-first flow</h3>
            <p>Students can work within a clear subject path instead of jumping between unrelated tasks.</p>
          </article>
          <article>
            <h3>Clear exam style layout</h3>
            <p>The platform follows a practice experience that feels familiar, direct, and focused.</p>
          </article>
          <article>
            <h3>Digital learning support</h3>
            <p>PrePa is designed to make revision more structured, manageable, and easy to return to.</p>
          </article>
        </div>
      </section>

      <section className="landing-brand-story" id="about">
        <div className="landing-brand-story__content">
          <p className="eyebrow">Built by JoLight Academy</p>
          <h2>PrePa is developed with purpose by JoLight Academy.</h2>
          <p>
            PrePa is an EdTech product created under JoLight Academy to support students with a more practical and
            structured approach to digital exam preparation.
          </p>
        </div>
      </section>

      <section className="landing-founder" aria-labelledby="founder-heading">
        <div className="landing-founder__card">
          <div className="landing-founder__portrait" aria-hidden="true">
            DJ
          </div>

          <div className="landing-founder__info">
            <p className="eyebrow">Founder</p>
            <h3 id="founder-heading">David Joshua — Founder, JoLight Academy</h3>
            <p>
              David Joshua leads the product direction behind PrePa, bringing together technology, education, and a
              practical approach to building useful learning experiences.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <p className="eyebrow">Ready to start practising?</p>
        <h2>Take the next step with a clearer study routine.</h2>
        <p>PrePa gives students a practical place to begin preparing with more focus and direction.</p>

        <div className="landing-cta__actions">
          <ButtonLink href="/register">Start Practising</ButtonLink>
          <ButtonLink href="/login" variant="secondary">Sign In</ButtonLink>
        </div>
      </section>
    </main>
  );
}
