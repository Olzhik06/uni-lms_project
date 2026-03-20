'use client';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
