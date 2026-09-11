import { createElement, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ArchiveBoxIcon, Bars3Icon, BoltIcon, ChatBubbleLeftRightIcon,
  CheckCircleIcon, FolderIcon, MoonIcon, RectangleStackIcon,
  SparklesIcon, SunIcon, TagIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const navigation = [
  { label: 'Files', to: '/home/storage', icon: FolderIcon },
  { label: 'Notes', to: '/home/notes', icon: RectangleStackIcon },
  { label: 'Tasks', to: '/home/todo', icon: CheckCircleIcon },
  { label: 'Chat', to: '/home/chat', icon: ChatBubbleLeftRightIcon },
  { label: 'Assistant', to: '/home/ai-chat', icon: SparklesIcon },
];

const initials = (name = 'User') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

export default function Navbar({ handleLogout, handleLogoutAll, user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-base-300/80 bg-base-100/85 backdrop-blur-xl">
      <div className="navbar mx-auto min-h-16 max-w-[1440px] px-4 sm:px-6">
        <div className="navbar-start gap-2">
          <button className="btn btn-ghost btn-square btn-sm lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Bars3Icon className="size-5" /></button>
          <Link to="/home/dashboard" className="flex items-center gap-2.5 text-base-content">
            <span className="grid size-9 place-items-center rounded-xl bg-neutral text-neutral-content shadow-sm"><BoltIcon className="size-5" /></span>
            <span className="text-lg font-semibold tracking-tight">OmniNet</span>
          </Link>
        </div>

        <nav className="navbar-center hidden lg:flex" aria-label="Workspace navigation">
          <ul className="menu menu-horizontal gap-1 px-1 text-sm">
            {navigation.map(({ label, to, icon }) => <li key={to}><NavLink to={to} className={({ isActive }) => isActive ? 'menu-active font-medium' : ''}>{createElement(icon, { className: 'size-4' })}{label}</NavLink></li>)}
          </ul>
        </nav>

        <div className="navbar-end gap-1.5">
          <button className="btn btn-ghost btn-circle btn-sm" onClick={toggleDarkMode} aria-label="Toggle color theme">{isDarkMode ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}</button>
          <details className="dropdown dropdown-end">
            <summary className="btn btn-ghost h-10 min-h-10 gap-2 rounded-full px-1.5 sm:px-2.5">
              <div className="avatar avatar-placeholder"><div className="w-7 rounded-full bg-neutral text-xs text-neutral-content">{user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user?.name)}</div></div>
              <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">{user?.name || 'Workspace'}</span>
            </summary>
            <ul className="menu dropdown-content z-50 mt-3 w-60 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
              <li className="menu-title px-3 pt-2"><span className="normal-case text-base-content/55">Signed in as</span><span className="normal-case text-base-content">{user?.email || user?.name || 'User'}</span></li>
              <li><Link to="/home/profile"><UserCircleIcon className="size-4" />Profile</Link></li>
              <li><button onClick={handleLogout}><ArchiveBoxIcon className="size-4" />Sign out</button></li>
              <li><button className="text-error" onClick={handleLogoutAll}><ArchiveBoxIcon className="size-4" />Sign out everywhere</button></li>
            </ul>
          </details>
        </div>
      </div>

      {mobileOpen && <div className="fixed inset-0 z-50 bg-neutral/25 lg:hidden" onClick={() => setMobileOpen(false)}>
        <aside className="h-full w-80 max-w-[85vw] bg-base-100 p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="mb-6 flex items-center justify-between"><span className="font-semibold">Navigate</span><button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(false)}>Close</button></div>
          <ul className="menu gap-1">{navigation.map(({ label, to, icon }) => <li key={to}><NavLink to={to} onClick={() => setMobileOpen(false)}>{createElement(icon, { className: 'size-5' })}{label}</NavLink></li>)}</ul>
        </aside>
      </div>}
    </header>
  );
}
