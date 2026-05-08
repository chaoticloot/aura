import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Info, X, Download, ExternalLink, Image as ImageIcon, Loader2, Sparkles, ChevronLeft } from 'lucide-react';
import { ArtPiece } from './types';
import { searchArtworks } from './services/artApi';

// Component: Artwork Modal
function ArtworkModal({ 
  artwork, 
  onClose,
  onAuthorClick,
  onSimilarClick
}: { 
  artwork: ArtPiece; 
  onClose: () => void;
  onAuthorClick: (author: string) => void;
  onSimilarClick: (art: ArtPiece) => void;
}) {
  const [similarArtworks, setSimilarArtworks] = useState<ArtPiece[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        // Fetch similar by medium or query words
        let q = artwork.artist && artwork.artist !== 'Artist Unknown' ? 'author:' + artwork.artist : '';
        const data = await searchArtworks(q, artwork.medium || 'painting', false, undefined);
        if (active) {
          // Remove the current one and take more just in case some fail to load
          const filtered = data.filter(a => a.id !== artwork.id).slice(0, 6);
          setSimilarArtworks(filtered);
        }
      } catch(e) {
        // Safe to ignore
      } finally {
        if (active) setLoadingSimilar(false);
      }
    };
    fetchSimilar();
    return () => { active = false; };
  }, [artwork]);

  if (!artwork) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 modal-overlay bg-ink/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-paper w-full h-full md:h-auto md:max-w-6xl md:max-h-[90vh] overflow-hidden md:rounded-[2px] shadow-2xl flex flex-col md:flex-row relative"
      >
        <div className="flex-1 bg-ink/5 flex items-center justify-center p-4 md:p-12 min-h-[300px] overflow-auto relative group">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="max-w-full max-h-[50vh] md:max-h-[75vh] object-contain shadow-sm"
            referrerPolicy="no-referrer"
          />
          <a href={artwork.imageUrl} target="_blank" rel="noreferrer" className="absolute bottom-6 right-6 p-3 bg-white/80 hover:bg-white text-ink rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={16} />
          </a>
        </div>
        
        <div className="w-full md:w-[440px] p-8 md:p-12 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-border bg-paper">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full transition-colors z-10 hidden md:block"
          >
            <X size={18} />
          </button>

          <button 
            onClick={onClose}
            className="md:hidden flex items-center gap-2 mb-8 opacity-40 uppercase tracking-widest font-bold text-[10px]"
          >
            <ChevronLeft size={16} />
            Back to Gallery
          </button>

          <div className="mb-10">
            <span className="text-[10px] uppercase tracking-[0.15em] text-accent font-bold mb-3 block">
              {artwork.museum} &middot; {artwork.date}
            </span>
            <h2 className="text-3xl font-serif italic mb-6 leading-tight select-text">{artwork.title}</h2>
            <div className="space-y-1">
              <button 
                onClick={() => {
                  if (artwork.artist !== 'Artist Unknown') {
                    onAuthorClick(artwork.artist);
                  }
                }}
                className={`text-lg font-serif opacity-80 text-left ${artwork.artist !== 'Artist Unknown' ? 'hover:text-accent underline decoration-border underline-offset-4 transition-colors cursor-pointer' : ''}`}
              >
                {artwork.artist}
              </button>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div className="grid grid-cols-1 gap-6 text-[12px]">
              {artwork.medium && (
                <div>
                  <p className="text-ink/40 uppercase tracking-widest text-[10px] mb-1 font-bold">Medium</p>
                  <p className="font-medium opacity-80">{artwork.medium}</p>
                </div>
              )}
              {artwork.dimensions && (
                <div>
                  <p className="text-ink/40 uppercase tracking-widest text-[10px] mb-1 font-bold">Dimensions</p>
                  <p className="font-medium opacity-80">{artwork.dimensions}</p>
                </div>
              )}
              
              {artwork.attribution && (
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-ink/40 uppercase tracking-widest text-[10px] mb-1 font-bold flex items-center gap-1"><Info size={12}/> Attribution Required</p>
                  <p className="font-medium text-[11px] opacity-80 whitespace-pre-wrap leading-relaxed">{artwork.attribution}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-ink/40 uppercase tracking-widest text-[10px] font-bold">License</p>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 text-white font-bold bg-ink px-3 py-1 rounded-[2px] text-[9px] uppercase tracking-wider">
                    {artwork.rights}
                  </span>
                  {artwork.rights.toUpperCase().includes('CC0') || artwork.rights.toUpperCase().includes('PUBLIC DOMAIN') ? (
                    <span className="text-[9px] opacity-40">Free for commercial use</span>
                  ) : (
                    <span className="text-[9px] opacity-40">Attribution required</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-3 mt-auto">
              {similarArtworks.length > 0 && (
                <div className="mb-8 pt-6 border-t border-border">
                  <p className="text-ink/40 uppercase tracking-widest text-[10px] mb-4 font-bold flex items-center gap-2">
                    <Sparkles size={12} /> Similar Works
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {similarArtworks.map(sim => (
                      <div 
                        key={sim.id}
                        className="aspect-[3/4] cursor-pointer group rounded-[2px] overflow-hidden bg-ink/5"
                        onClick={() => onSimilarClick(sim)}
                        title={sim.title}
                      >
                        <img 
                          src={sim.imageUrlSmall || sim.imageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <a 
                href={artwork.imageUrl} 
                target="_blank" 
                rel="noreferrer"
                download
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-ink text-paper rounded-[2px] hover:bg-ink/90 transition-colors uppercase text-[11px] tracking-[0.1em] font-bold"
              >
                <Download size={14} />
                Download Hi-Res Archive
              </a>
              <a 
                href={artwork.objectUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-border hover:bg-museum-gray rounded-[2px] transition-colors uppercase text-[11px] tracking-[0.1em] font-bold"
              >
                <ExternalLink size={14} />
                Museum Record
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Component: Artwork Card
function getBadge(rights: string) {
  const r = rights.toUpperCase();
  if (r.includes('CC0') || r.includes('ZERO')) return 'CC0';
  if (r.includes('PUBLIC DOMAIN') || r.includes('PD')) return 'PD';
  if (r.includes('CC BY-SA')) return 'CC BY-SA';
  if (r.includes('CC BY')) return 'CC BY';
  return 'CC';
}

const ArtworkCard: React.FC<{ artwork: ArtPiece; onClick: (id: string | number) => void }> = ({ artwork, onClick }) => {
  const [error, setError] = useState(false);
  
  if (error) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group cursor-pointer flex flex-col gap-3"
      onClick={() => onClick(artwork.id)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-museum-gray rounded-[2px] artwork-card-shadow">
        <img
          src={artwork.imageUrlSmall}
          alt={artwork.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setError(true)}
        />
        <div className="cc0-badge group-hover:bg-accent group-hover:text-white transition-colors uppercase">
          {getBadge(artwork.rights)}
        </div>
        <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="art-info min-w-0">
        <h3 className="art-title text-[15px] font-serif italic line-clamp-1 group-hover:text-accent transition-colors" title={artwork.title}>
          {artwork.title}
        </h3>
        <p className="text-[11px] uppercase tracking-[0.03em] opacity-50 mt-0.5 truncate" title={`${artwork.artist} · ${artwork.date || 'n.d.'}`}>
          {artwork.artist} &middot; {artwork.date || 'n.d.'}
        </p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [artworks, setArtworks] = useState<ArtPiece[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArt, setSelectedArt] = useState<ArtPiece | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [mediumFilter, setMediumFilter] = useState('');
  const [isStrict, setIsStrict] = useState(false);
  const [yearEnd, setYearEnd] = useState<number | undefined>(1900);
  const [licenseGuideOpen, setLicenseGuideOpen] = useState(false);

  const fetchFeatured = useCallback(async (currentMedium: string, currentYearEnd?: number) => {
    setLoading(true);
    try {
      const data = await searchArtworks('Masterpiece', currentMedium, false, currentYearEnd);
      setArtworks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent, currentMedium = mediumFilter, overrideQuery?: string, strict = isStrict, currentYearEnd = yearEnd) => {
    if (e) e.preventDefault();
    const q = overrideQuery !== undefined ? overrideQuery : query;
    if (!q.trim() && !currentMedium) {
      fetchFeatured(currentMedium, currentYearEnd);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setLoading(true);
    try {
      const data = await searchArtworks(q, currentMedium, strict, currentYearEnd);
      setArtworks(data);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchFeatured(mediumFilter, yearEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setMediumFilter(value);
    handleSearch(undefined, value);
  };

  const handleStrictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsStrict(checked);
    handleSearch(undefined, mediumFilter, undefined, checked, yearEnd);
  };

  const handleYearEndChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
    setYearEnd(value);
    handleSearch(undefined, mediumFilter, undefined, isStrict, value);
  };

  const openArtwork = async (id: string | number) => {
    const art = artworks.find(a => a.id === id);
    if (art) {
      setSelectedArt(art);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col selection:bg-accent selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-border min-h-20 flex items-center px-6 lg:px-10 py-4">
        <div className="max-w-[1440px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto shrink-0">
            <div className="text-2xl font-serif italic font-bold tracking-tighter select-none cursor-pointer" onClick={() => window.location.reload()}>
              AURA<span className="text-accent ring-accent">.</span>
            </div>
            
            {/* Mobile View Indicators */}
            <div className="sm:hidden flex items-center gap-3">
              {searching && <Loader2 className="animate-spin text-accent" size={18} />}
              <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-none">
                {artworks.length} Arts
              </div>
            </div>
          </div>

          {/* Search Bar - Always visible and immediate */}
          <form onSubmit={handleSearch} className="w-full sm:max-w-[480px] sm:mx-8 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-50 transition-opacity" size={16} />
            <input
              type="text"
              placeholder="Search Public Domain Collections..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-3 bg-museum-gray border border-border rounded-full outline-none focus:border-accent/40 transition-all text-sm placeholder:text-ink/30 shadow-sm sm:shadow-none"
            />
            <button type="submit" className="hidden">Search</button>
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                <Loader2 className="animate-spin text-accent" size={16} />
              </div>
            )}
          </form>

          <div className="hidden lg:flex items-center gap-10 font-sans text-[12px] font-bold tracking-[0.08em] uppercase">
            <div className="flex items-center gap-6">
              <span className="opacity-30 cursor-default">EN</span>
              <button onClick={() => setLicenseGuideOpen(true)} className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors">
                <Info size={14}/> License Guide
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <nav className="h-[64px] border-b border-border flex items-center px-6 lg:px-10 gap-6 max-w-[1440px] mx-auto w-full font-sans text-[11px] font-bold uppercase tracking-[0.08em] overflow-x-auto whitespace-nowrap">
        <label className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity select-none shrink-0">
           <select 
             value={mediumFilter} 
             onChange={handleFilterChange}
             className="bg-transparent border border-border px-3 py-1.5 focus:border-accent rounded-[2px] outline-none text-ink font-bold cursor-pointer"
           >
             <option value="">All Techniques</option>
             <option value="oil painting">Oil Painting</option>
             <option value="watercolor">Watercolor</option>
             <option value="pencil drawing sketch">Pencil Sketch</option>
             <option value="charcoal drawing">Charcoal</option>
             <option value="pastel">Pastel</option>
             <option value="ink">Ink</option>
             <option value="fresco">Fresco</option>
           </select>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity select-none shrink-0 ml-2">
           <select 
             value={yearEnd || ''} 
             onChange={handleYearEndChange}
             className="bg-transparent border border-border px-3 py-1.5 focus:border-accent rounded-[2px] outline-none text-ink font-bold cursor-pointer"
           >
             <option value="">Any Year</option>
             <option value="1900">Before 20th Century</option>
             <option value="1800">Before 19th Century</option>
             <option value="1500">Renaissance & Earlier</option>
           </select>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity select-none shrink-0 ml-2">
           <input 
             type="checkbox" 
             checked={isStrict} 
             onChange={handleStrictChange}
             className="accent-accent w-3.5 h-3.5"
           />
           <span>Strict Match</span>
        </label>

        <span className="opacity-20 hidden md:inline ml-2">|</span>
        
        <div className="flex items-center gap-6">
          {['Impressionism', 'Renaissance', 'Baroque', 'Ukiyo-e'].map((filter) => (
            <button 
              key={filter} 
              onClick={() => {
                setQuery(filter);
                handleSearch(undefined, mediumFilter, filter);
              }}
              className="opacity-40 hover:opacity-100 transition-opacity uppercase tracking-[0.08em] font-bold"
            >
              {filter}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 lg:px-10 py-12 max-w-[1440px] mx-auto w-full">
        {loading && artworks.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-ink/20">
            <Loader2 size={40} className="animate-spin text-accent/40 mb-4" />
            <p className="text-[12px] uppercase tracking-[0.2em] font-bold">Accessing Archive</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-10 border-b border-border pb-6">
              <h2 className="text-[12px] uppercase tracking-[0.15em] font-bold flex items-center gap-3">
                {hasSearched ? `Displaying "${query}"` : 'Curated Masterworks'}
                {loading && <Loader2 size={14} className="animate-spin text-accent" />}
              </h2>
              <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                {artworks.length} EXHIBITS LOADED
              </span>
            </div>

            {artworks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 pb-24">
                {artworks.map((art) => (
                  <ArtworkCard 
                    key={art.id} 
                    artwork={art} 
                    onClick={openArtwork} 
                  />
                ))}
              </div>
            ) : (
              <div className="h-[40vh] flex flex-col items-center justify-center text-center opacity-30">
                <ImageIcon size={48} className="mb-4" />
                <h3 className="text-lg font-serif italic mb-2">No matching works</h3>
                <p className="text-xs max-w-xs uppercase tracking-wide">
                  Try searching for a different era or master painter
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-10 flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1440px] mx-auto w-full text-[11px] font-bold tracking-[0.1em] uppercase opacity-40">
        <div>&copy; 2024 Aura Public Domain Archive</div>
        <div className="flex items-center gap-2">
          Powered by Global Museum Open Data
          <span className="bg-ink text-paper px-2 py-0.5 rounded-[2px] text-[9px] ml-2">Public Domain CC0</span>
        </div>
      </footer>

      {/* Modal Details */}
      <AnimatePresence>
        {selectedArt && (
          <ArtworkModal 
            artwork={selectedArt} 
            onClose={() => setSelectedArt(null)} 
            onAuthorClick={(author) => {
              setSelectedArt(null);
              const authorQuery = 'author:' + author;
              setQuery(authorQuery);
              handleSearch(undefined, mediumFilter, authorQuery, true, yearEnd);
            }}
            onSimilarClick={(art) => setSelectedArt(art)}
          />
        )}
        
        {licenseGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 modal-overlay bg-ink/60"
            onClick={() => setLicenseGuideOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-paper w-full max-w-xl p-8 rounded-[2px] shadow-2xl relative"
            >
              <button 
                onClick={() => setLicenseGuideOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full transition-colors z-10"
              >
                <X size={18} />
              </button>
              
              <h2 className="text-2xl font-serif italic mb-6">Understanding Licenses</h2>
              
              <div className="space-y-6 text-sm opacity-80 leading-relaxed font-serif">
                <div>
                  <h3 className="font-bold font-sans uppercase tracking-widest text-[11px] mb-2 text-ink flex items-center gap-2">
                    <span className="bg-ink text-paper px-2 py-0.5 rounded-[2px]">CC0</span> 
                    Public Domain
                  </h3>
                  <p>CC0 (Creative Commons Zero) and Public Domain mean the creator has waived all their copyright and related rights to the work. You are free to copy, modify, distribute, and perform the work, even for **commercial purposes**, all without asking permission or giving credit to the artist (though it is often appreciated).</p>
                </div>
                
                <div className="border-t border-border pt-6">
                  <h3 className="font-bold font-sans uppercase tracking-widest text-[11px] mb-2 text-ink flex items-center gap-2">
                    <span className="bg-ink text-paper px-2 py-0.5 rounded-[2px]">CC BY</span> 
                    Attribution Required
                  </h3>
                  <p>This license lets you distribute, remix, adapt, and build upon the material in any medium or format, including for **commercial purposes**, as long as you **attribute the creator**. We provide the required attribution text on the artwork details page.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
