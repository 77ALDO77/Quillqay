'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Terminal, ArrowRight, Blocks, FolderTree, Pen, Zap, Shield, Globe, Menu, X,
} from 'lucide-react';

const features = [
  {
    icon: Blocks,
    title: 'Block-Based Editing',
    description: 'Headers, paragraphs, lists, checklists, and code blocks. Compose freely with intuitive tools that adapt to every type of content.',
  },
  {
    icon: FolderTree,
    title: 'Hierarchical Pages',
    description: 'Organize your knowledge with nested pages. Build a personal wiki that grows naturally with your thinking.',
  },
  {
    icon: Pen,
    title: 'Minimal Distraction',
    description: 'Clean interface designed for focus. Nothing between you and your ideas. Just write and let your thoughts flow.',
  },
  {
    icon: Zap,
    title: 'Auto-Save',
    description: 'Never lose a thought. Every change is automatically saved so you can focus on what matters: writing.',
  },
  {
    icon: Shield,
    title: 'Your Data, Your Control',
    description: 'Built with Rust and PostgreSQL. High performance. Reliable. Your notes stay safe and accessible.',
  },
  {
    icon: Globe,
    title: 'Accessible Anywhere',
    description: 'Modern web app that works on any device. Start on desktop, continue on mobile. Seamless experience.',
  },
];

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-on-surface font-display overflow-x-hidden">
      {/* Background Accents */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 px-4 py-3 mt-4 mx-4">
        <nav className="max-w-6xl mx-auto flex justify-between items-center bg-surface/60 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center glow-accent">
              <Terminal className="w-4 h-4 text-on-primary-container" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-primary">Quillqay</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
              Features
            </a>
            <a href="#cta" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
              Docs
            </a>
            <Link
              href="/login"
              className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden mt-2 mx-2 bg-surface/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
            <a
              href="#features"
              className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium py-2 px-4 rounded-xl hover:bg-white/5"
              onClick={() => setMobileMenu(false)}
            >
              Features
            </a>
            <a
              href="#cta"
              className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium py-2 px-4 rounded-xl hover:bg-white/5"
              onClick={() => setMobileMenu(false)}
            >
              Docs
            </a>
            <Link
              href="/login"
              className="text-sm font-medium bg-primary text-on-primary px-4 py-2 rounded-xl text-center shadow-lg shadow-primary/20"
              onClick={() => setMobileMenu(false)}
            >
              Login
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 tracking-wider uppercase">
          Quillqay &mdash; &quot;To Write&quot; in Quechua
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-on-surface leading-tight mb-6">
          Where your
          <br />
          <span className="bg-gradient-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
            ideas take shape
          </span>
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          A minimalist note-taking experience inspired by the ancient art of writing.
          Block-based editor, hierarchical pages, and auto-save. All open source.
          Built with Rust and React.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/notes"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/30 hover:saturate-150 hover:scale-105 transition-all duration-300"
          >
            Start Writing
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-sm hover:bg-white/10 transition-all"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Floating Preview Card */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 -mt-12 mb-20">
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-on-surface-variant/50 font-mono">Quillqay — Untitled Note</span>
          </div>
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-surface-container rounded-xl" />
            <div className="space-y-2">
              <div className="h-3 bg-surface-container rounded w-full" />
              <div className="h-3 bg-surface-container rounded w-5/6" />
              <div className="h-3 bg-surface-container rounded w-4/6" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="w-5 h-5 rounded bg-surface-container" />
              <div className="h-3 bg-surface-container rounded w-32" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-surface-container rounded w-full" />
              <div className="h-3 bg-surface-container rounded w-3/4" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-4">
            Everything you need to
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              organize your mind
            </span>
          </h2>
          <p className="text-on-surface-variant/70 max-w-xl mx-auto text-sm md:text-base">
            Powerful features wrapped in a clean, distraction-free interface.
            Take notes the way your brain works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-panel group relative overflow-hidden rounded-2xl border border-white/10 p-8 hover:border-primary/30 transition-all duration-500"
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl transition-all duration-500 group-hover:bg-primary/15" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-on-surface-variant/80 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="glass-panel rounded-3xl border border-primary/20 shadow-2xl p-10 md:p-16 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-6">
              Ready to start writing?
            </h2>
            <p className="text-on-surface-variant/80 max-w-lg mx-auto mb-10 text-sm md:text-base">
              No sign-ups. No distractions. Just open the app and start capturing your ideas.
              Your thoughts deserve a beautiful home.
            </p>
            <Link
              href="/notes"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/30 hover:saturate-150 hover:scale-105 transition-all duration-300"
            >
              Enter Quillqay
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-container rounded flex items-center justify-center">
              <Terminal className="w-3 h-3 text-on-primary-container" />
            </div>
            <span className="text-sm text-on-surface-variant/60 font-medium">Quillqay</span>
          </div>
          <p className="text-xs text-on-surface-variant/40">
            Quillqay &mdash; &quot;To Write&quot; in Quechua. Built with Rust + Next.js. Open Source.
          </p>
        </div>
      </footer>
    </div>
  );
}
