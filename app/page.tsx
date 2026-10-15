import BookingFlow from "@/components/BookingFlow";
import { Suspense } from "react";

function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-art-orbit" />
      <div className="hero-art-card">
        <span className="hero-art-label">A little time for you</span>
        <span className="hero-art-date">Your health,<br />on your schedule.</span>
        <span className="hero-art-bottom"><span className="hero-art-dot" /> Thoughtful care, made simple</span>
      </div>
      <span className="hero-spark hero-spark-one">✳</span>
      <span className="hero-spark hero-spark-two">✦</span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="page-shell">
      <section className="booking-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-mark" /> Care that fits your life</p>
          <h1>Good care starts<br /><span>with a good time.</span></h1>
          <p className="hero-description">
            Choose your doctor, find a time that feels right, and get back to the things that matter.
          </p>
          <div className="hero-proof">
            <span className="proof-icon" aria-hidden="true">✓</span>
            <span>Secure patient account</span><span className="proof-divider" />
            <span>All times shown in IST</span>
          </div>
        </div>
        <HeroArt />
      </section>

      <div className="section-intro">
        <div>
          <p className="eyebrow eyebrow-dark">MAKE IT YOURS</p>
          <h2>Let’s find your moment.</h2>
        </div>
        <p>Monday–Saturday <span>·</span> 10 AM–6 PM</p>
      </div>

      <Suspense fallback={<div className="booking-skeleton" aria-label="Loading booking form"><div /><div /></div>}>
        <BookingFlow />
      </Suspense>

      <footer className="page-footer">
        <span>Care, at your own pace.</span>
        <span>All times shown in India Standard Time</span>
      </footer>
    </main>
  );
}
