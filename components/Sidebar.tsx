import React from 'react';
import type { NavItem } from '../types';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (name: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// Icon components (Heroicons)
const LayoutDashboardIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const BookOpenIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const UsersIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
  </svg>
);

const ClipboardCheckIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BellIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboardIcon },
  { name: 'Courses', icon: BookOpenIcon },
  { name: 'Users', icon: UsersIcon },
  { name: 'Exams', icon: ClipboardCheckIcon },
  { name: 'Notifications', icon: BellIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, isSidebarOpen, setIsSidebarOpen }) => {
  const handleItemClick = (name: string) => {
    setActiveItem(name);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <aside className={`group fixed top-0 left-0 h-full bg-black/50 backdrop-blur-lg border-r border-white/10 p-4 transition-all duration-300 ease-in-out z-30
      ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
      md:translate-x-0 md:w-20 md:hover:w-64`}
    >
      <div className="flex items-center justify-center md:justify-start gap-4 mb-10 h-16 overflow-hidden">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">V</div>
        <h1 className="text-xl font-bold whitespace-nowrap transition-opacity duration-200 md:opacity-0 group-hover:md:opacity-100">VANTUTOR ADMIN</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(item.name);
                }}
                className={`flex items-center p-3 rounded-lg transition-opacity duration-200 overflow-hidden ${
                  activeItem === item.name
                    ? 'text-white font-semibold'
                    : 'text-white opacity-70 hover:opacity-100'
                }`}
              >
                <item.icon className="h-6 w-6 flex-shrink-0" />
                <span className="ml-4 font-medium whitespace-nowrap transition-opacity duration-200 md:opacity-0 group-hover:md:opacity-100">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;