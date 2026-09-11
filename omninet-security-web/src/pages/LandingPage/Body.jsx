import { createElement, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRightIcon, CheckCircleIcon, FolderIcon, LockClosedIcon, RectangleStackIcon, SparklesIcon } from '@heroicons/react/24/outline';

const features = [
  { icon: FolderIcon, title: 'A place for every file', description: 'Keep projects, references, and attachments together without losing the thread.' },
  { icon: RectangleStackIcon, title: 'Notes that stay useful', description: 'Capture the detail now, then find it quickly when the work resumes.' },
  { icon: SparklesIcon, title: 'Help when you need it', description: 'Use the assistant for a thoughtful second pass, not a noisy distraction.' },
];

export default function Body() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from('[data-intro]', { y: 18, opacity: 0, duration: 0.72, stagger: 0.1, ease: 'power2.out' });
      gsap.from('[data-feature]', { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.35, ease: 'power2.out' });
    }, root);
    return () => context.revert();
  }, []);

  return <main ref={root}>
    <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:pb-28 sm:pt-28">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <div data-intro className="badge badge-outline border-base-300 bg-base-100 px-3 py-3 text-base-content/65"><LockClosedIcon className="mr-1 size-3.5" />Private by design</div>
        <h1 data-intro className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">Your work, in a calmer place.</h1>
        <p data-intro className="mx-auto mt-6 max-w-2xl text-base leading-7 text-base-content/65 sm:text-lg">OmniNet gives your notes, tasks, files, and useful AI conversations one quiet home—so you can focus on the next important thing.</p>
        <div data-intro className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/register" className="btn btn-primary">Create your workspace <ArrowRightIcon className="size-4" /></Link><Link to="/login" className="btn btn-ghost">I already have an account</Link></div>
        <p data-intro className="mt-4 text-xs text-base-content/45">No setup maze. Start with one small thing.</p>
      </div>
    </section>

    <section id="how-it-works" className="border-y border-base-300 bg-base-100 px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl"><div className="mb-9 max-w-xl"><p className="text-sm font-medium text-primary">A focused workspace</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Everything has a clear next step.</h2></div><div className="grid gap-4 md:grid-cols-3">{features.map(({ icon, title, description }) => <article data-feature key={title} className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body gap-3 p-6"><span className="grid size-10 place-items-center rounded-xl bg-base-200">{createElement(icon, { className: 'size-5' })}</span><h3 className="card-title text-base">{title}</h3><p className="text-sm leading-6 text-base-content/60">{description}</p></div></article>)}</div></div>
    </section>

    <section id="privacy" className="px-5 py-16"><div className="mx-auto grid max-w-5xl items-center gap-8 rounded-box border border-base-300 bg-base-100 p-7 sm:p-10 md:grid-cols-[1fr_auto]"><div><p className="text-sm font-medium text-primary">Thoughtful protection</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Private work should feel simple.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-base-content/60">Authentication and account controls are built into your workspace, so your day-to-day tools do not ask you to trade convenience for confidence.</p></div><div className="flex gap-3 text-sm"><CheckCircleIcon className="size-5 shrink-0 text-success" /><span>Designed around a secure account and familiar, predictable controls.</span></div></div></section>
  </main>;
}
