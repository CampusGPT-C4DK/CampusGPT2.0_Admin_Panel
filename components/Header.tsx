'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15,19,29,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      <div>
        <h1 style={{
          fontSize: '22px', fontWeight: '800',
          letterSpacing: '-0.03em', color: '#f0f4ff',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {actions}

        {/* Time & Date display */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '10px',
        }}>
          <Clock size={13} color="#475569" />
          <span style={{
            fontSize: '13px', fontWeight: '600', color: '#64748b',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {time}
          </span>
          <span style={{ fontSize: '11px', color: '#334155' }}>•</span>
          <span style={{
            fontSize: '12px', fontWeight: '500', color: '#475569',
          }}>
            {date}
          </span>
        </div>

        {/* Notification bell */}
        <button
          style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b', position: 'relative',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(96,165,250,0.08)';
            e.currentTarget.style.color = '#60a5fa';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <Bell size={16} />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute', top: '8px', right: '9px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#60a5fa',
              boxShadow: '0 0 6px rgba(96,165,250,0.6)',
            }}
          />
        </button>
      </div>
    </motion.div>
  );
}
