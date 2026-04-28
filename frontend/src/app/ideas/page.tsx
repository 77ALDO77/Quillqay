'use client';

import { Search, Terminal, FolderOpen, FileText, ListTree, Edit, Bell, Settings, Filter, ChevronDown, Bookmark, MoreVertical, Heart, Share, Code, Plus } from 'lucide-react';

const ideaCards = [
  {
    id: 1,
    tags: ['Web3', 'Auth'],
    title: 'Decentralized Vault Identity',
    description: 'Implementing a zero-knowledge proof system for merchant onboarding on the Quillqay network.',
    code: 'const zkProof = await vault.verify(user_id);',
    author: 'JD',
    authorName: 'John Doe',
    time: '2H AGO',
    featured: true,
    accent: 'primary',
  },
  {
    id: 2,
    tags: ['Payments'],
    title: 'Atomic Swap Flow',
    description: 'Refining the checkout sequence to support cross-chain atomic swaps without slippage.',
    image: true,
    author: 'AM',
    authorName: 'Alex Moon',
    time: '5H AGO',
    accent: 'secondary',
  },
  {
    id: 3,
    tags: ['React', 'UI'],
    title: 'Luminous Input Fields',
    description: 'Creating a set of highly accessible, liquid-glass-styled inputs for the merchant dashboard.',
    code: '@apply blur-md saturate-150;',
    author: 'SS',
    authorName: 'Sarah Smith',
    time: 'YESTERDAY',
    accent: 'tertiary',
  },
  {
    id: 4,
    tags: ['API'],
    title: 'Webhooks Monitoring',
    description: 'Visualizing real-time payload delivery rates across global endpoints.',
    chart: true,
    author: 'KB',
    authorName: 'Kevin B.',
    time: '2D AGO',
    accent: 'primary',
  },
];

const snippetCard = {
  id: 'snippet-1',
  title: 'Middleware Pattern v2.4',
  file: 'quillqay-edge-adapter.ts',
  code: `export function quillMiddleware(config: AdapterConfig) {
  return async (req: Request, res: Response) => {
    // Initialize secure context
    const context = await Quill.createContext(config.key);
    
    if (!context.active) {
      return res.status(401).json({ error: 'Invalid Context' });
    }
    
    return next();
  }
}`,
};

export default function IdeaExplorer() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)] text-[var(--color-on-surface)] font-display">
      {/* Background Accents */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-surface/60 backdrop-blur-lg tracking-tight rounded-xl mt-4 mx-4 border border-white/10 shadow-[0_0_15px_rgba(157,92,255,0.1)]">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tighter text-primary">Quillqay</span>
        </div>
        <div className="hidden md:flex items-center gap-1 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-white/5">
          <Search className="w-4 h-4 text-on-surface-variant" />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-outline/50 text-on-surface"
            placeholder="Search ideas..."
            type="text"
          />
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-outline">CMD + K</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/5 transition-all">
            <Bell className="w-5 h-5 text-on-surface-variant" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5 transition-all">
            <Settings className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div className="h-8 w-8 rounded-full border border-primary/40 p-0.5">
            <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-6 mt-6 min-h-[calc(100vh-140px)] relative z-10">
        {/* SideNavBar */}
        <nav className="fixed left-0 top-20 bottom-4 w-64 flex flex-col z-40 bg-surface/40 backdrop-blur-xl text-sm font-medium rounded-2xl m-4 border border-white/10 shadow-2xl overflow-hidden hidden md:flex">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center glow-accent">
                <Terminal className="w-5 h-5 text-on-primary-container" />
              </div>
              <div>
                <div className="text-on-surface font-bold">Quillqay</div>
                <div className="text-[10px] text-on-surface-variant/60 tracking-widest uppercase">Developer Hub</div>
              </div>
            </div>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant opacity-70 hover:bg-white/5 hover:opacity-100 transition-all">
                <FolderOpen className="w-5 h-5" />
                <span>Projects</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant opacity-70 hover:bg-white/5 hover:opacity-100 transition-all">
                <FileText className="w-5 h-5" />
                <span>Docs</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant opacity-70 hover:bg-white/5 hover:opacity-100 transition-all">
                <ListTree className="w-5 h-5" />
                <span>Diagrams</span>
              </a>
              <a href="/ideas" className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary bg-primary/10 transition-all">
                <Edit className="w-5 h-5" />
                <span>Notes</span>
              </a>
            </div>
          </div>
          <div className="mt-auto p-6">
            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <div className="text-[10px] text-outline-variant font-bold mb-2 uppercase tracking-tighter">Storage Usage</div>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%]" />
              </div>
              <div className="mt-2 text-[10px] text-on-surface-variant/50">6.5GB of 10GB used</div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-[280px] lg:ml-[280px] mr-0">
          <div className="glass-panel rounded-3xl min-h-full border border-white/10 shadow-2xl flex flex-col p-8">
            {/* Content Header & Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-bold text-on-surface tracking-tighter mb-2">Idea Explorer</h1>
                <p className="text-on-surface-variant/70 max-w-md">Browse and experiment with architectural patterns, web3 workflows, and payment flow snippets.</p>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low p-1.5 rounded-2xl border border-white/5">
                <button className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-on-primary shadow-lg shadow-primary/20 hover:saturate-150 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Idea
                </button>
                <button className="px-5 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-white/5 transition-all">
                  Collections
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-white/5 text-xs font-medium text-on-surface-variant">
                <Filter className="w-4 h-4" />
                All Tags
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-white/5 text-xs font-medium text-on-surface-variant">
                Latest First
                <ChevronDown className="w-4 h-4" />
              </div>
              <div className="h-4 w-px bg-white/10 mx-2" />
              <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] rounded-full border border-secondary/20 uppercase tracking-widest font-bold">Drafts</span>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] rounded-full border border-primary/20 uppercase tracking-widest font-bold">Approved</span>
            </div>

            {/* Bento Grid of Ideas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 custom-scrollbar">
              {/* Snippet Card */}
              <div className="glass-panel group relative overflow-hidden rounded-[24px] border border-white/10 p-6 flex flex-col h-full col-span-1 xl:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                      <Code className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">{snippetCard.title}</h3>
                      <div className="text-[10px] text-on-surface-variant/50 font-mono">{snippetCard.file}</div>
                    </div>
                  </div>
                  <button className="bg-primary/5 hover:bg-primary/10 text-primary text-xs px-4 py-2 rounded-xl transition-all font-bold">
                    Copy Snippet
                  </button>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-6 border border-white/5 font-mono text-xs leading-relaxed overflow-x-auto">
                  <pre className="text-on-surface-variant">
                    <code>
                      <span className="text-primary">export function</span>{' '}
                      <span className="text-secondary">quillMiddleware</span>(config:{' '}
                      <span className="text-tertiary">AdapterConfig</span>) {'{'}
                      {'\n'}
                      {'  '}<span className="text-primary">return async</span> (req: Request, res: Response) =&gt; {'{'}
                      {'\n'}
                      {'    '}<span className="text-outline-variant">// Initialize secure context</span>
                      {'\n'}
                      {'    '}<span className="text-primary">const</span> context = <span className="text-on-surface">await</span> Quill.createContext(config.key);
                      {'\n\n'}
                      {'    '}<span className="text-primary">if</span> (!context.active) {'{'}
                      {'\n'}
                      {'      '}<span className="text-primary">return</span> res.status(401).json({'{'} error:{' '}
                      <span className="text-secondary-container">'Invalid Context'</span> {'}'});
                      {'\n'}
                      {'    '}
                      {'}'}
                      {'\n\n'}
                      {'    '}<span className="text-primary">return next</span>();
                      {'\n'}
                      {'  '}
                      {'}'}
                      {'\n'}
                      {'}'}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Idea Cards */}
              {ideaCards.map((card) => (
                <div
                  key={card.id}
                  className={`glass-panel group relative overflow-hidden rounded-[24px] border border-white/10 p-6 flex flex-col h-full hover:border-${card.accent}/40 transition-all duration-500`}
                >
                  {/* Background Glow */}
                  {card.featured && (
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-all duration-500 group-hover:bg-primary/20" />
                  )}

                  {/* Tags & Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2">
                      {card.tags.map((tag) => (
                        <span key={tag} className="bg-surface-container px-2 py-1 rounded text-[10px] font-bold text-outline uppercase tracking-tighter">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {card.featured ? (
                      <Bookmark className="w-5 h-5 text-on-surface-variant/40 group-hover:text-primary transition-colors cursor-pointer" />
                    ) : card.accent === 'secondary' ? (
                      <MoreVertical className="w-5 h-5 text-on-surface-variant/40 group-hover:text-secondary transition-colors cursor-pointer" />
                    ) : card.accent === 'tertiary' ? (
                      <Heart className="w-5 h-5 text-on-surface-variant/40 group-hover:text-tertiary transition-colors cursor-pointer" />
                    ) : (
                      <Share className="w-5 h-5 text-on-surface-variant/40 group-hover:text-primary transition-colors cursor-pointer" />
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold mb-3 tracking-tight">{card.title}</h3>
                  <p className="text-sm text-on-surface-variant/80 mb-6 leading-relaxed">{card.description}</p>

                  {/* Code / Image / Chart */}
                  {card.code && (
                    <div className={`mt-auto bg-surface-container-highest/50 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-${card.accent}`}>
                      <code>{card.code}</code>
                    </div>
                  )}
                  {card.image && (
                    <div className="mt-auto bg-surface-container-highest/50 rounded-xl p-4 border border-white/5">
                      <div className="w-full h-24 rounded-lg bg-surface-container-low flex items-center justify-center text-outline-variant text-xs">
                        Diagram placeholder
                      </div>
                    </div>
                  )}
                  {card.chart && (
                    <div className="mt-auto flex gap-1 h-12 items-end px-2">
                      {[40, 60, 90, 50, 100, 70, 30].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/20 h-[${h}%] rounded-t-sm" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  )}

                  {/* Author & Time */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full bg-${card.accent}/20 flex items-center justify-center`}>
                        <span className={`text-[10px] font-bold text-${card.accent}`}>{card.author}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{card.authorName}</span>
                    </div>
                    <span className="text-[10px] text-outline font-bold">{card.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button - Mobile Only */}
      <div className="fixed bottom-8 right-8 md:hidden z-50">
        <button className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center scale-100 active:scale-90 transition-transform">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
