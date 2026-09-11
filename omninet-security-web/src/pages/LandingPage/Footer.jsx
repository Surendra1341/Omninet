import { Link } from 'react-router-dom';
import { BoltIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return <footer className="border-t border-base-300 bg-base-100 px-5 py-10"><div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 font-semibold"><span className="grid size-7 place-items-center rounded-lg bg-neutral text-neutral-content"><BoltIcon className="size-4" /></span>OmniNet</div><p className="mt-2 max-w-sm leading-6 text-base-content/55">A composed place for the work and information you want to keep close.</p></div><div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base-content/60"><a className="inline-flex items-center gap-2 hover:text-base-content" href="mailto:contact@omninet.security"><EnvelopeIcon className="size-4" />Contact</a><Link className="hover:text-base-content" to="/login">Sign in</Link><span className="text-base-content/40">© {new Date().getFullYear()} OmniNet</span></div></div></footer>;
}
