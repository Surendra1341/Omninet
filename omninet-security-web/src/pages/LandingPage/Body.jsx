import { createElement, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FolderIcon,
  LockClosedIcon,
  RectangleStackIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: FolderIcon,
    title: 'A place for every file',
    description: 'Keep projects, documents, and assets neatly structured with rapid preview and storage quota management.',
  },
  {
    icon: RectangleStackIcon,
    title: 'Notes that stay useful',
    description: 'Capture markdown notes, organize into intuitive categories, and search instantly across your personal repository.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Tasks with clear momentum',
    description: 'Manage priorities, subtask checklists, and recurring routines with daily and weekly productivity insights.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Real-time team messaging',
    description: 'Communicate directly and in groups with live presence, delivery receipts, quoted replies, and emoji reactions.',
  },
  {
    icon: SparklesIcon,
    title: 'Contextual AI assistance',
    description: 'Call upon intelligent conversational assistance for drafting, summarizing, and reasoning without noisy distractions.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Unified security & auth',
    description: 'Private by default with multi-provider OAuth, session management, and microservice token security.',
  },
];

export default function Body() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from('[data-intro]', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
      });
      gsap.from('[data-feature]', {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        delay: 0.25,
        ease: 'power2.out',
      });
    }, root);
    return () => context.revert();
  }, []);

  return (
    <main ref={root}>
      <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:pb-28 sm:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <div data-intro className="badge badge-outline border-base-300 bg-base-100 px-3 py-3 text-base-content/65">
            <LockClosedIcon className="mr-1.5 size-3.5" />Private & unified workspace
          </div>
          <h1 data-intro className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Your work, in a calmer place.
          </h1>
          <p data-intro className="mx-auto mt-6 max-w-2xl text-base leading-7 text-base-content/65 sm:text-lg">
            OmniNet brings your files, notes, tasks, real-time discussions, and AI conversations together into one focused, serene workspace.
          </p>
          <div data-intro className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn btn-primary">
              Create your workspace <ArrowRightIcon className="size-4 ml-1" />
            </Link>
            <Link to="/login" className="btn btn-ghost">
              I already have an account
            </Link>
          </div>
          <p data-intro className="mt-4 text-xs text-base-content/45">
            Seamless setup. No noisy feeds.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-base-300 bg-base-100 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Unified Ecosystem</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything in harmony, exactly where you expect.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon, title, description }) => (
              <article
                data-feature
                key={title}
                className="card border border-base-300 bg-base-100/60 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="card-body gap-3 p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-base-200 text-base-content/80">
                    {createElement(icon, { className: 'size-5' })}
                  </span>
                  <h3 className="card-title text-base font-semibold">{title}</h3>
                  <p className="text-sm leading-6 text-base-content/60">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="px-5 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-8 rounded-box border border-base-300 bg-base-100 p-7 sm:p-10 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Architecture & Confidence</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Built on robust microservices.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-base-content/60">
              Each core pillar—Storage, Auth, Real-time Chat, Tasks, and AI—is architected as an independent, resilient service with dedicated database persistence and end-to-end security.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-base-content/80">
            <CheckCircleIcon className="size-5 shrink-0 text-success" />
            <span>Standardized on modern web protocols and calm aesthetics.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
