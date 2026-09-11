import { Link } from 'react-router-dom';
import { BoltIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  return (
    <header className="border-b border-base-300/75 bg-base-100/80 backdrop-blur-xl">
      <div className="navbar mx-auto min-h-16 max-w-6xl px-5">
        <div className="navbar-start"><Link to="/landing_page" className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-neutral text-neutral-content"><BoltIcon className="size-5" /></span><span className="text-lg font-semibold tracking-tight">OmniNet</span></Link></div>
        <nav className="navbar-center hidden md:flex"><a className="btn btn-ghost btn-sm" href="#how-it-works">How it works</a><a className="btn btn-ghost btn-sm" href="#privacy">Privacy</a></nav>
        <div className="navbar-end"><Link to="/login" className="btn btn-sm px-4">Sign in</Link></div>
      </div>
    </header>
  );
}
