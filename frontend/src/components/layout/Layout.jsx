import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

import Footer from './Footer';
import TopNav from './TopNav';
import './Layout.css';

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(4px)' },
  enter: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
};

export default function Layout() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem('ims-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('ims-theme', theme);
  }, [theme]);

  const workspaceMeta = useMemo(
    () => ({
      dateLabel: new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      syncLabel: 'Live sync enabled',
    }),
    []
  );

  return (
    <div className="app-shell">
      <TopNav
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        workspaceMeta={workspaceMeta}
      />
      <div className="app-shell__body">
        <main className="app-shell__content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="app-shell__page"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          <Footer />
        </main>
      </div>
    </div>
  );
}
