"use client";

import { motion } from "framer-motion";

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export function PageEnter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={fade.initial} animate={fade.animate} transition={fade.transition}>
      {children}
    </motion.div>
  );
}

export function StaggerList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06 },
        },
      }}
      className={className}
    >
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {children}
    </motion.li>
  );
}
