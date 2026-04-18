/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useScroll, useTransform, motion, AnimatePresence, Variants } from "motion/react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useInView } from "react-intersection-observer";
import { cn } from "./lib/utils";
import { 
  Menu, X, Send, Info, LayoutDashboard, Server, Scroll, RefreshCw, Terminal,
  ExternalLink, Users, Cpu, Activity, ShieldAlert, Plus, Trash2, CheckCircle2,
  AlertCircle, Copy, Check, BookOpen, Map, HelpCircle, MessageSquare, Bug,
  FileText, Search, Download, Eye, Filter, ChevronRight, Clock, Shield, Sword,
  ChevronDown, ChevronUp, Sun, Moon, Zap, Database, FileOutput, History as LucideHistory
} from "lucide-react";
import { useTheme } from "./context/ThemeContext";
import { GoogleGenAI } from "@google/genai";
import html2canvas from "html2canvas";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from "axios";

interface DiscordMessage {
  id: string;
  author: {
    id?: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  isOptimistic?: boolean;
}

// Real images provided by the user (Minecraft/Gaming focused)
const REAL_IMAGES = [
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/Minecraft%20Shaders%20Scenery.jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/Minecraft%20Wallpaper%20_%20Steve.jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(12).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(1).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(13).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(14).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(2).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(4).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(6).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(7).jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download.jpg?raw=true",
  "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/ebabfc6cae3c5a5bca34a08950d0dbc9.jpg?raw=true"
];

// Data generator for EternalSMP gallery
const SECTION_SIZE = 200;
const ALL_GALLERY_IMAGES = Array.from({ length: 3500 }, (_, i) => {
  const imageUrl = REAL_IMAGES[i % REAL_IMAGES.length];
  const categories = [
    'ETERNAL ENVIRONMENT', 
    'SERVER ARCHIVE', 
    'GALLERY SNAPSHOT', 
    'LEGACY DATA'
  ];
  const category = categories[i % categories.length];

  return {
    id: i + 1,
    url: imageUrl,
    thumb: imageUrl,
    title: `ETERNAL RECORD #${i + 1}`,
    category: category,
    section: Math.floor(i / SECTION_SIZE) + 1
  };
});
const TOTAL_SECTIONS = Math.ceil(ALL_GALLERY_IMAGES.length / SECTION_SIZE);

const PAGE_BACKGROUNDS: Record<string, string> = {
  overview: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/Minecraft%20Shaders%20Scenery.jpg?raw=true",
  resources: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(13).jpg?raw=true",
  docs: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/ebabfc6cae3c5a5bca34a08950d0dbc9.jpg?raw=true",
  rules: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(7).jpg?raw=true",
  maps: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(6).jpg?raw=true",
  gallery: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(14).jpg?raw=true",
  support: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download.jpg?raw=true",
  'discord-support': "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(1).jpg?raw=true",
  bugs: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(2).jpg?raw=true",
  apply: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(4).jpg?raw=true",
  info: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(12).jpg?raw=true",
  ai: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/Minecraft%20Wallpaper%20_%20Steve.jpg?raw=true",
  profiles: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/Minecraft%20Shaders%20Scenery.jpg?raw=true",
  'support-connection': "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(8).jpg?raw=true",
  'support-billing': "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(9).jpg?raw=true",
  'support-account': "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(10).jpg?raw=true",
  'support-texture': "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(11).jpg?raw=true"
};

const PageBackground = ({ page }: { page: string }) => {
  const imageUrl = PAGE_BACKGROUNDS[page];
  if (!imageUrl) return null;
  return (
    <div className="fantasy-page-bg">
      <motion.img 
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 0.15, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        src={imageUrl} 
        alt="" 
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// Components for Modern Gallery
const downloadImage = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed, falling back to direct link", err);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.click();
  }
};

const FlipImageCard = ({ image, onPreview }: { image: typeof ALL_GALLERY_IMAGES[0], onPreview: (img: typeof ALL_GALLERY_IMAGES[0]) => void }) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '400px' });
  const [loaded, setLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !loaded) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    await downloadImage(image.url, `EternalSMP_${image.id}.jpg`);
    setIsDownloading(false);
  };

  return (
    <div 
      ref={ref} 
      className="w-[180px] md:w-[240px] aspect-[3/4] group perspective-1000 shrink-0"
      onMouseMove={handleMouseMove}
    >
      <div ref={cardRef} className="flip-card-inner">
        <div className={cn(
          "flip-card-front overflow-hidden rounded-2xl border border-white/5 shadow-2xl relative bg-surface",
          !loaded && "shimmer-bg"
        )}>
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
              <div className="relative w-12 h-12 mb-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-accent/20 rounded-full border-t-accent"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Terminal className="text-accent/20 animate-pulse" size={14} />
                </div>
              </div>
              <div className="text-[6px] font-black uppercase tracking-[3px] text-accent/30 text-center animate-pulse">Initializing Buffer</div>
            </div>
          )}
          
          {inView ? (
            <img 
              src={image.thumb} 
              alt={image.title} 
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-all duration-1000 ease-out fill-available", 
                !loaded ? "scale-110 blur-xl opacity-0" : "scale-100 blur-0 opacity-100"
              )}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full shimmer-bg opacity-20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
             <span className="text-[7px] font-black text-accent uppercase tracking-[4px] mb-1">{image.category}</span>
             <p className="text-[9px] font-bold text-white uppercase tracking-wider truncate">{image.title}</p>
          </div>
        </div>
        <div className="flip-card-back shadow-2xl relative overflow-hidden bg-surface border border-accent/20">
          {/* Subtle circuit pattern background for the back */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]" />
          
          {isDownloading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center rounded-2xl">
              <RefreshCw className="text-accent animate-spin mb-3" size={32} />
              <span className="text-[10px] font-black text-accent uppercase tracking-[4px] animate-pulse">Retrieving Data...</span>
            </div>
          )}
          
          <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full space-y-5">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5"
            >
              <Terminal size={28} className="text-accent" />
            </motion.div>
            
            <div className="text-center space-y-1">
              <h4 className="text-[9px] font-black uppercase tracking-[4px] text-accent">SEC_0{image.section} / DATA_{image.id}</h4>
              <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">{image.category}</p>
              <div className="w-8 h-0.5 bg-accent/30 mx-auto mt-2 rounded-full" />
            </div>

            <div className="flex flex-col items-center gap-2.5 w-full">
               <button 
                 onClick={() => onPreview(image)} 
                 className="w-full py-3 bg-accent text-black font-black text-[9px] rounded-lg uppercase tracking-[3px] shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
               >
                 PREVIEW ARCHIVE
               </button>
               <button 
                 onClick={handleDownload} 
                 className="w-full py-3 bg-white/5 border border-white/10 text-white font-black text-[9px] rounded-lg uppercase tracking-[3px] hover:bg-white/10 hover:border-accent/30 transition-all active:scale-95"
               >
                 DOWNLOAD HD
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GallerySection = ({ sectionNum, images, onPreview, variant = 'grid' }: { sectionNum: number, images: typeof ALL_GALLERY_IMAGES, onPreview: (img: typeof ALL_GALLERY_IMAGES[0]) => void, variant?: 'marquee' | 'grid' }) => {
  const { ref, inView } = useInView({ threshold: 0.01, triggerOnce: false });
  const [isExpanded, setIsExpanded] = useState(false); // All sectors hidden by default
  const marqueeImages = useMemo(() => [...images, ...images], [images]);
  const sectionTitle = `ALBUM KENANGAN ${sectionNum}`;

  return (
    <motion.div 
      ref={ref} 
      initial={{ opacity: 0, y: -20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 px-6 md:px-12 gap-6 bg-surface/30 py-8 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="text-6xl md:text-8xl font-serif text-white/5 font-black leading-none select-none">
            {sectionNum < 10 ? `0${sectionNum}` : sectionNum}
          </div>
          <div className="space-y-2">
             <div className="px-3 py-1 bg-accent-dim border border-accent/20 rounded-full text-[8px] font-bold text-accent uppercase tracking-[4px] w-fit">Registry Active</div>
             <h3 className="text-xl md:text-3xl font-serif font-black text-white uppercase tracking-[4px]">{sectionTitle}</h3>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
           <div className="flex flex-col items-start md:items-end gap-1">
              <div className="text-[10px] font-bold text-text-dim uppercase tracking-[3px] opacity-40">Segment: {images.length} Units</div>
              {variant === 'marquee' && <div className="text-[8px] text-accent font-black uppercase tracking-widest animate-pulse">Auto-Scroll Active</div>}
           </div>
           
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setIsExpanded(!isExpanded)}
             className={cn(
               "py-4 px-8 rounded-xl font-black text-[10px] tracking-[4px] uppercase flex items-center gap-3 transition-all",
               isExpanded 
                ? "bg-white/5 text-white border border-white/10 hover:bg-white/10" 
                : "btn-fantasy shadow-[0_0_30px_rgba(221,160,221,0.2)]"
             )}
           >
             {isExpanded ? (
               <><ChevronUp size={18} /> HIDE SECTOR</>
             ) : (
               <><ChevronDown size={18} /> UNLOCK SECTOR</>
             )}
           </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {variant === 'marquee' ? (
              <div className="gallery-marquee-container pb-12">
                <div className="marquee-track" style={{ '--duration': `180s` } as any}>
                  {marqueeImages.map((img, idx) => (
                    <FlipImageCard key={`sec-${sectionNum}-${img.id}-${idx}`} image={img} onPreview={onPreview} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 md:gap-12 px-6 md:px-12 py-8">
                 {images.map((img) => (
                   <FlipImageCard key={`grid-${img.id}`} image={img} onPreview={onPreview} />
                 ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ImageModal = ({ image, onClose }: { image: typeof ALL_GALLERY_IMAGES[0], onClose: () => void }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadImage(image.url, `EternalSMP_${image.id}_HD.jpg`);
    setIsDownloading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative max-w-5xl w-full max-h-full flex flex-col md:flex-row gap-8 bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 overflow-hidden bg-black/40 flex items-center justify-center min-h-[400px] relative">
          {!imgLoaded && !isDownloading && (
            <div className="absolute inset-0 shimmer-bg flex flex-col items-center justify-center p-12 text-center">
              <div className="relative mb-10">
                <div className="w-32 h-32 border-2 border-accent/10 rounded-full animate-[spin_12s_linear_infinite]" />
                <div className="absolute inset-0 m-auto w-24 h-24 border-2 border-accent/20 rounded-full animate-[spin_8s_linear_infinite_reverse] border-dashed" />
                <Activity className="absolute inset-0 m-auto text-accent/40 animate-pulse" size={40} />
              </div>
              <p className="text-xl font-serif font-black text-white uppercase tracking-[12px] animate-pulse">Summoning HD Data</p>
              <p className="text-accent/50 text-[10px] uppercase font-bold tracking-[6px] mt-4">Retrieving packets from chronosphere</p>
            </div>
          )}
          
          {isDownloading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                <Download className="absolute inset-0 m-auto text-accent animate-bounce" size={32} />
              </div>
              <p className="mt-8 text-lg font-serif font-black text-white uppercase tracking-[8px] animate-pulse">Transferring Archive...</p>
              <p className="text-accent text-[10px] uppercase font-bold tracking-[4px] mt-2">Allocating packets to local terminal</p>
            </div>
          )}
          <img 
            src={image.url} 
            alt={image.title} 
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={cn("max-w-full max-h-[80vh] object-contain transition-opacity duration-1000", imgLoaded ? "opacity-100" : "opacity-0")} 
            referrerPolicy="no-referrer" 
          />
        </div>
        <div className="w-full md:w-80 p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-accent uppercase tracking-[4px]">{image.category} Archive</span>
                 <h2 className="text-xl md:text-2xl font-serif font-bold text-white uppercase leading-tight">{image.title}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
               <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim uppercase tracking-widest font-bold font-sans">Metadata ID</span>
                  <span className="text-accent font-black">#EL-{image.id.toString().padStart(4, '0')}</span>
               </div>
               <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim uppercase tracking-widest font-bold font-sans">Resolution</span>
                  <span className="text-white font-bold font-sans">1200 x 1600</span>
               </div>
               <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim uppercase tracking-widest font-bold font-sans">Access Level</span>
                  <span className="text-green-500 font-bold uppercase tracking-widest font-sans">Public</span>
               </div>
            </div>
          </div>

          <div className="space-y-3 mt-10">
            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className={cn(
                "w-full py-4 font-black text-xs rounded-xl uppercase tracking-[4px] shadow-lg flex items-center justify-center gap-3 transition-all",
                isDownloading 
                  ? "bg-white/10 text-accent cursor-not-allowed" 
                  : "bg-accent text-black shadow-accent/20 hover:brightness-110 active:scale-95"
              )}
            >
              {isDownloading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD HD'}
            </button>
            <button onClick={onClose} className="w-full py-4 border border-white/10 hover:bg-white/5 text-text-dim text-[10px] font-black uppercase tracking-[4px] rounded-xl transition-all">
              CLOSE TERMINAL
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Initialize ETER AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Konfigurasi Webhook
const WEBHOOK_ANNOUNCEMENT = process.env.WEBHOOK_ANNOUNCEMENT || "https://discord.com/api/webhooks/1494550869960691835/wGkLMvkZ4kWLSdk2dmQttcao8suzoO7C4cTbVgDWFszyxISV2AqHtLkpm0X8eNePbdS2";
const WEBHOOK_DEFAULT = process.env.WEBHOOK_DEFAULT || "https://discord.com/api/webhooks/1494550869960691835/wGkLMvkZ4kWLSdk2dmQttcao8suzoO7C4cTbVgDWFszyxISV2AqHtLkpm0X8eNePbdS2";
const WEBHOOK_REPORT = process.env.WEBHOOK_REPORT || "https://discord.com/api/webhooks/1494550869960691835/wGkLMvkZ4kWLSdk2dmQttcao8suzoO7C4cTbVgDWFszyxISV2AqHtLkpm0X8eNePbdS2";
const ROLE_ID = process.env.ROLE_ID || "1472246426414350336"; // Role ID LegendofFeeloria[S15]

const FORM_CONFIG = {
  announcement: ['Judul', 'Kategori', 'Status', 'Description', 'Catatan'],
  quest: ['Nama', 'Type', 'Tier', 'Description', 'Progress', 'Reward'],
  event: ['Nama Event', 'Waktu', 'Lokasi', 'Description', 'Syarat'],
  update: ['Versi', 'Tanggal', 'Log Perubahan', 'New Update', 'Buff', 'Fix'],
  info: ['Topik', 'Description']
};

type Category = keyof typeof FORM_CONFIG;

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ACCEPT_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

const BUTTON_VARIANTS = {
  hover: { 
    scale: 1.02, 
    filter: "brightness(1.2)", 
    transition: { duration: 0.2 } 
  },
  tap: { scale: 0.98, transition: { duration: 0.1 } }
};

const QUICK_ACTION_VARIANTS = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  hover: { 
    scale: 1.02, 
    x: 10,
    backgroundColor: "rgba(221, 160, 221, 0.1)",
    borderColor: "rgba(221, 160, 221, 0.4)",
    boxShadow: "0 10px 30px -10px rgba(221, 160, 221, 0.2)",
    transition: { type: "spring", stiffness: 400, damping: 17 } as const
  },
  tap: { scale: 0.96 }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const ACCEPTED_PLAYERS = Array.from(new Set([
  "Chillatomboy", "AldianGG", "Lackykz", "Reza3487", "vexevitrix", "Svennnz", "FuraChan7332", "Noi nge sad",
  "Arjuna5222", "Nohanniiel", "Fayynx01", "ZANMODE", "Yaanviee5033", "Mytsukizon", "D4rkxCraftt", "keyzzz",
  "EryezetNoKai", "DigiCraft4120", "ItzGreetaa", "Schannx", "LYvanvin", "REXDI9421", "MythXenn", "SchDxion",
  "OutCaster3827", "NishhCH", "Alansyah77", "SkynicSC", "Aerztwin", "XennN6298", "LordDean2663", "Somekk07",
  "kentang aek", "IxSouw", "Aileen3112", "Chisaki17", "ElseBridge4976", "ABYSSLIME9684", "MythHoloo", "JosKelvin",
  "AnimalYapper164", "MyPinn", "glifligary", "Kazzuya2007", "QueennnzMe", "Afdanzzzz", "sunnyic7947", "PudingBeku",
  "AmiiLunaa", "Awaaadesu3", "KHOIRULLLGMG", "AdilPorphyr", "Zaxs", "Chyntia136", "Alfaln0", "Bobby98257",
  "Jinoo77", "Primmbee", "Nyctotenz", "zenaaa03", "Notsmile1122", "Sheptian159", "Azkii3394", "FadilAzrial70",
  "TRIXIER24", "king maharaja", "Schhannzee", "Xyloraine", "Xyliarae", "Schmitzeareza", "Apitt_", "Mzba09",
  "Myiyutrara", "Schmikchella", "KyraannnnN", "Bang Reza PE", "haaanzet", "Seelreei", "PublicCheese624",
  "TaimairuChan", "ItzLM8569", "PraisedPE", "Schmitzealgi", "CelCelxyh"
]));

const PlayerMarquee = () => {
  return (
    <div className="shrink-0 border-b border-border" style={{ background: 'var(--header-bg)' }}>
      <div className="px-3 md:px-6 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 border-b border-border overflow-hidden">
        <div className="p-1 md:p-1.5 bg-accent-dim rounded-lg text-accent shrink-0 relative">
          <Users size={12} className="md:w-[14px] md:h-[14px]" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse border border-bg"></span>
        </div>
        <span className="text-[8px] md:text-[10px] font-black tracking-[1px] md:tracking-[2px] text-accent uppercase truncate">
          📢 DAFTAR PEMAIN YANG DITERIMA DI ETERNAL SMP SEASON 15
        </span>
      </div>
      <div className="relative flex overflow-x-hidden py-2 md:py-3 group">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-6 md:gap-8">
          {ACCEPTED_PLAYERS.map((player, i) => (
            <div key={`marquee-p1-${i}`} className="flex items-center gap-1.5 md:gap-2">
              <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] md:text-xs font-bold tracking-widest text-text-dim hover:text-accent transition-colors cursor-default uppercase">
                {player}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center gap-6 md:gap-8 ml-6 md:ml-8">
          {ACCEPTED_PLAYERS.map((player, i) => (
            <div key={`marquee-p2-${i}`} className="flex items-center gap-1.5 md:gap-2">
              <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] md:text-xs font-bold tracking-widest text-text-dim hover:text-accent transition-colors cursor-default uppercase">
                {player}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MAP_LINKS: Record<number, string> = {
  2: "https://drive.google.com/file/d/1zSmSZATUbfLejsajeHkycwa2YbtW_ZCV/view?usp=drivesdk",
  3: "https://drive.google.com/file/d/1BefwY4B2xeonDINqVFM876fLdfv-CbDq/view?usp=drivesdk",
  4: "https://drive.google.com/file/d/1OByhPLCXKZKpGwoalFWvQFxgoIMwq_RC/view?usp=drivesdk",
  5: "https://drive.google.com/file/d/1INKxnTtngL0kL3xq8IbjUCm69S44utMn/view?usp=drivesdk",
  6: "https://drive.google.com/file/d/1RvyiVSs49H3MZ2XxdNBvf9VI9UcSMUVY/view?usp=drivesdk",
  7: "https://drive.google.com/file/d/1aKwi_l1BS98JvtESZDxKTxNYSUGwQVvC/view?usp=drivesdk",
  10: "https://drive.google.com/file/d/1_157Dv3GRYZwFMZ5ChQFUQ-c0huixAWz/view?usp=drivesdk",
  11: "https://drive.google.com/file/d/1Mm_iKXaEhF8jNnD4UiGfFWWU4fZLEbe0/view?usp=drivesdk",
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [init, setInit] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category>("announcement");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'restarting'>('online');
  const [serverUptime, setServerUptime] = useState("1h 8m");
  const [serverStats, setServerStats] = useState({
    players: 242,
    tps: 19.8,
    cpu: 4.42,
    ram: 742,
    disk: 3.45,
    inbound: 5.81,
    outbound: 26.39,
    ping: 18
  });
  const [historyData, setHistoryData] = useState<any[]>([]);

  // Simulation for live dashboard data
  useEffect(() => {
    if (serverStatus !== 'online') return;
    
    const interval = setInterval(() => {
      setServerStats(prev => ({
        ...prev,
        tps: Math.min(20, Math.max(18, prev.tps + (Math.random() * 0.4 - 0.2))),
        cpu: Math.max(2, Math.min(25, prev.cpu + (Math.random() * 2 - 1))),
        ram: Math.max(600, Math.min(1024, prev.ram + (Math.random() * 10 - 5))),
        inbound: prev.inbound + (Math.random() * 0.1),
        outbound: prev.outbound + (Math.random() * 0.2),
        ping: Math.floor(15 + Math.random() * 10)
      }));

      setHistoryData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          cpu: Number(serverStats.cpu.toFixed(2)),
          ram: Number(serverStats.ram.toFixed(0)),
          net: Number((serverStats.inbound + serverStats.outbound).toFixed(2))
        }].slice(-20);
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [serverStatus, serverStats.cpu, serverStats.ram, serverStats.inbound, serverStats.outbound]);

  // Quick Action States
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [pendingGalleryFile, setPendingGalleryFile] = useState<File | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<DiscordMessage[]>(() => {
    try {
      const saved = localStorage.getItem('eternalsmp_chat_history');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to load chat history:", e);
      return [];
    }
  });

  const [chatInput, setChatInput] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'live' | 'simulated'>('simulated');
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Save chat history to local storage
  useEffect(() => {
    localStorage.setItem('eternalsmp_chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);
  
  // Fetch Discord messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get("/api/chat/messages");
      if (Array.isArray(response.data)) {
        setChatMessages(response.data);
      } else {
        console.warn("Chat API returned non-array data:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, []);

  // Polling for new messages
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get("/api/chat/status");
        setConnectionStatus(res.data.status);
      } catch (e) {
        setConnectionStatus('simulated');
      }
    };
    checkStatus();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    const statusInterval = setInterval(checkStatus, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [fetchMessages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const optimisticMessage: DiscordMessage = {
      id: `temp-${Date.now()}`,
      author: { username: "EternalSMP", discriminator: "0000" },
      content,
      timestamp: new Date().toISOString(),
      isOptimistic: true
    };

    setChatMessages(prev => [optimisticMessage, ...prev]);
    setIsSending(true);

    try {
      await axios.post("/api/chat/send", {
        content,
        username: "EternalSMP"
      });
      setTimeout(fetchMessages, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the failed optimistic message
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      addToast("Failed to sync with Discord", "error");
    } finally {
      setIsSending(false);
    }
  };

  // Gallery States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGalleryCategory, setCurrentGalleryCategory] = useState("All");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<typeof ALL_GALLERY_IMAGES[0] | null>(null);
  const [aiKeywords, setAiKeywords] = useState<string[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [chartTab, setChartTab] = useState<'cpu' | 'ram' | 'net'>('cpu');

  const aiSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAiGallerySearch = async (query: string) => {
    if (aiSearchTimeoutRef.current) clearTimeout(aiSearchTimeoutRef.current);
    
    if (!query || query.length < 3) {
      setAiKeywords([]);
      return;
    }
    
    aiSearchTimeoutRef.current = setTimeout(async () => {
      setIsAiSearching(true);
      try {
        const prompt = `You are a professional image search assistant for the EternalSMP Chronosphere Archives.
        Context: The gallery contains 3,000 images related to Minecraft, Server Records, Environment, and Legacy Gaming.
        
        The user query: "${query}"
        
        Task: 
        1. Analyze the user's intent.
        2. Extract 4-6 highly relevant semantic keywords or tags that would appear in image titles or categories (e.g., "archive", "legacy", "snapshot", "environment", "record").
        3. If the user mentions colors or themes (e.g., "dark", "glow", "green"), include them if relevant to the metadata.
        
        Output: ONLY a comma-separated list of keywords. No explanations.
        Target Format: keyword1, keyword2, keyword3, ...`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt
        });

        const keywords = response.text.split(',').map(k => k.trim().toLowerCase());
        setAiKeywords(keywords);
      } catch (err) {
        console.error("AI Gallery Search Error:", err);
      } finally {
        setIsAiSearching(false);
      }
    }, 500);
  };

  const filteredImages = useMemo(() => {
    return ALL_GALLERY_IMAGES.filter(img => {
      const s = searchQuery.toLowerCase();
      const t = img.title.toLowerCase();
      const c = img.category.toLowerCase();
      
      const matchesText = !searchQuery || 
        t.includes(s) || 
        c.includes(s) || 
        aiKeywords.some(kw => t.includes(kw) || c.includes(kw));
        
      const matchCat = currentGalleryCategory === "All" || img.category === currentGalleryCategory;
      return matchesText && matchCat;
    });
  }, [searchQuery, currentGalleryCategory, aiKeywords]);

  const filteredProfiles = useMemo(() => {
    return ACCEPTED_PLAYERS.filter(p => p.toLowerCase().includes(playerSearch.toLowerCase()));
  }, [playerSearch]);

  const [showBackToTop, setShowBackToTop] = useState(false);

  // AI Assistant States
  const MAX_AI_HISTORY = 30;
  const [aiMessage, setAiMessage] = useState("");
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'ai', content: string, timestamp?: number }[]>(() => {
    try {
      const saved = localStorage.getItem('eternal_ai_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse AI history:", e);
      return [];
    }
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Parallax Effect
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 1000], [0, -200]);

  useEffect(() => {
    let historyToSave = aiHistory;
    if (aiHistory.length > MAX_AI_HISTORY) {
      historyToSave = aiHistory.slice(-MAX_AI_HISTORY);
    }
    localStorage.setItem('eternal_ai_history', JSON.stringify(historyToSave));
  }, [aiHistory]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Particles
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsClearingCache(false);
    addToast("Cache cleared successfully", "success");
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    for (let i = 0; i <= 100; i += 20) {
      setSyncProgress(i);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    setIsSyncing(false);
    addToast("Database synced successfully", "success");
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGeneratingReport(false);
    setShowReportModal(true);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast("Copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAiChat = async (overrideMessage?: string) => {
    const msg = overrideMessage || aiMessage;
    if (!msg.trim()) return;

    if (!process.env.GEMINI_API_KEY) {
      addToast("API Key tidak ditemukan. Harap konfigurasi GEMINI_API_KEY di environment variables.", "error");
      return;
    }

    const newUserMsg = { role: 'user' as const, content: msg, timestamp: Date.now() };
    setAiHistory(prev => [...prev, newUserMsg]);
    setAiMessage("");
    setIsAiLoading(true);

    try {
      // Add a placeholder for the AI response
      setAiHistory(prev => [...prev, { role: 'ai' as const, content: "", timestamp: Date.now() }]);

      const response = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: msg,
        config: {
          systemInstruction: "Anda adalah ETER AI ASSISTANT, asisten AI yang cerdas untuk EternalSMP. Berikan respon dalam Bahasa Indonesia. Fokus pada membantu administrator mengelola server, memberikan tips gameplay, dan menjelaskan lore Feeloria. Gunakan markdown."
        }
      });

      let fullText = "";
      for await (const chunk of response) {
        fullText += chunk.text;
        setAiHistory(prev => {
          const newHistory = [...prev];
          if (newHistory.length > 0) {
            newHistory[newHistory.length - 1] = { role: 'ai', content: fullText, timestamp: Date.now() };
          }
          return newHistory;
        });
      }

    } catch (err: any) {
      console.error("AI Error:", err);
      addToast(err.message || "Oracle sedang bermeditasi. Coba lagi nanti.", "error");
      setAiHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].content === "") {
          return newHistory.slice(0, -1);
        }
        return newHistory;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearChat = () => {
    setAiHistory([]);
    addToast("Arsip percakapan telah dibersihkan.", "success");
  };

  const clearDiscordChat = () => {
    if (window.confirm("Hapus riwayat chat Discord lokal?")) {
      setChatMessages([]);
      localStorage.removeItem('eternalsmp_chat_history');
      addToast("Riwayat chat Discord telah dibersihkan.", "success");
    }
  };

  const sendReportToDiscord = async () => {
    if (isExporting) return;
    setIsExporting(true);
    addToast("Mengirim laporan Dashboard ke Discord...", "success");

    try {
      const element = dashboardRef.current;
      if (!element) throw new Error("Element not found");

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 1, 
        useCORS: true,
        backgroundColor: "#050505",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Fix for html2canvas not supporting modern CSS color functions like oklab/oklch
          // We recursively walk the cloned DOM and replace problematic color functions
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            try {
              const style = window.getComputedStyle(htmlEl);
              
              // Helper to replace modern colors with safe fallbacks
              const sanitizeColor = (color: string) => {
                if (!color) return color;
                if (color.includes('oklab') || color.includes('oklch') || color.includes('color(')) {
                  // Fallback to a neutral semi-transparent white if it's a dynamic background
                  if (color.includes('rgba') || color.includes('hsla') || color.includes('/')) {
                    return 'rgba(255, 255, 255, 0.1)';
                  }
                  return '#DDA0DD'; // Fallback to accent color
                }
                return color;
              };

              if (htmlEl.style) {
                htmlEl.style.backgroundColor = sanitizeColor(style.backgroundColor);
                htmlEl.style.color = sanitizeColor(style.color);
                htmlEl.style.borderColor = sanitizeColor(style.borderColor);
              }
            } catch (e) {
              // Silently ignore elements that can't be computed
            }
          });

          // Add a forced style block to the clone to ensure compatibility
          const styleBlock = clonedDoc.createElement('style');
          styleBlock.innerHTML = `
            * {
              color-rendering: optimizeSpeed !important;
              shape-rendering: optimizeSpeed !important;
              text-rendering: optimizeSpeed !important;
              -webkit-font-smoothing: antialiased !important;
            }
            .custom-scrollbar::-webkit-scrollbar { display: none !important; }
          `;
          clonedDoc.head.appendChild(styleBlock);
        }
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Canvas to Blob failed");

      const formData = new FormData();
      const payload = {
        content: `<@&${ROLE_ID}>`,
        embeds: [{
          title: "📜 SURAT LAPORAN OPERASIONAL SISTEM",
          description: `**Perihal:** Laporan Diagnostik Rutin EternalSMP\n\nKepada Yth. Seluruh Jajaran Staff,\n\nBersama dengan laporan ini, kami lampirkan ringkasan visual mengenai status operasional sistem dan aktivitas terbaru dalam kedaulatan Feeloria. Laporan ini dihasilkan secara otomatis untuk menjaga transparansi dan efisiensi koordinasi tim.\n\n**Detail Laporan:**\n• **Waktu:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n• **Versi:** v2.5.0-STABLE\n• **Integritas:** Seluruh sistem berstatus *Operational*\n\nMohon Bapak/Ibu sekalian untuk meninjau lampiran gambar terlampir sebagai acuan dalam pengambilan keputusan strategis hari ini.\n\nDemikian laporan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.\n\n\nPelapor,\n**Sistem Administrasi EternalSMP**`,
          color: parseInt("DDA0DD", 16),
          image: { url: "attachment://dashboard-report.png" },
          footer: { 
            text: "EternalSMP Admin Portal • Feeloria Realm",
            icon_url: "https://github.com/marcellnw/paneleternalsmp/blob/main/1775664361126.png?raw=true"
          }
        }]
      };

      formData.append("payload_json", JSON.stringify(payload));
      formData.append("file", blob, "dashboard-report.png");

      const response = await fetch(WEBHOOK_REPORT, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        addToast("Laporan berhasil dikirim ke Discord!", "success");
      } else {
        throw new Error("Discord API Response Error");
      }
    } catch (err) {
      console.error("Discord Report Error:", err);
      addToast("Gagal mengirim ke Discord.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingGalleryFile(file);
    addToast(`File ${file.name} terpilih. Siap untuk dikirim!`, "success");
  };

  const executeGalleryUpload = async () => {
    if (!pendingGalleryFile) {
      addToast("Pilih file terlebih dahulu!", "error");
      return;
    }
    const file = pendingGalleryFile;
    setIsUploadingGallery(true);
    addToast("Mengunggah foto ke Gallery...", "success");

    try {
      const formData = new FormData();
      const payload = {
        content: `📸 **GALLERY UPDATE: ETERNALSMP**`,
        embeds: [{
          title: "New World Memory Uploaded",
          description: `Seorang administrator telah menambahkan kenangan baru ke dalam archive.\n\n**File:** ${file.name}\n**Waktu:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
          color: parseInt("DDA0DD", 16),
          image: { url: `attachment://${file.name}` },
          footer: { text: "EternalSMP Gallery System" }
        }]
      };

      formData.append("payload_json", JSON.stringify(payload));
      formData.append("file", file, file.name);

      const response = await fetch(WEBHOOK_REPORT, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        addToast("Foto berhasil dikirim ke Gallery Discord!", "success");
        setPendingGalleryFile(null);
      } else {
        throw new Error("Discord Upload Failed");
      }
    } catch (err) {
      console.error(err);
      addToast("Gagal mengunggah foto.", "error");
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileRef.current) galleryFileRef.current.value = "";
    }
  };

  const sendToDiscord = async () => {
    if (!formData['judul'] && !formData['nama'] && !formData['nama_event'] && !formData['versi'] && !formData['topik']) {
      addToast("Harap isi field utama!", "error");
      return;
    }

    setIsSending(true);
    const fields = FORM_CONFIG[currentCategory];
    const thumbnail = "https://github.com/marcellnw/paneleternalsmp/blob/main/1775664361126.png?raw=true";
    const targetWebhook = (currentCategory === 'announcement') ? WEBHOOK_ANNOUNCEMENT : WEBHOOK_DEFAULT;

    const embedFields = fields
      .filter(f => !['Description', 'Log Perubahan', 'Reward'].includes(f))
      .map(f => ({
        name: f,
        value: formData[f.toLowerCase().replace(/ /g, '_')] || "-",
        inline: true
      }));

    const payload = {
      content: `<@&${ROLE_ID}>`,
      embeds: [{
        title: currentCategory.toUpperCase(),
        color: parseInt("B22222", 16),
        description: formData['description'] || formData['log_perubahan'] || formData['reward'] || "",
        fields: embedFields,
        timestamp: new Date().toISOString(),
        thumbnail: { url: thumbnail },
        footer: { text: "EternalSMP Panel • 2026" }
      }]
    };

    try {
      const response = await fetch(targetWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        addToast(`Notifikasi ${currentCategory.toUpperCase()} berhasil dikirim!`);
        setFormData({});
      } else {
        addToast('Gagal mengirim ke Discord. Periksa Webhook.', "error");
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan koneksi.', "error");
    } finally {
      setIsSending(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'ADM', icon: Terminal, tooltip: 'Admin Panel' },
    { id: 'dashboard', label: 'DSH', icon: LayoutDashboard, tooltip: 'Webhook Dispatcher' },
    { id: 'server', label: 'SVR', icon: Server, tooltip: 'Server Management' },
    { id: 'info', label: 'INF', icon: Info, tooltip: 'Server Information' },
    { id: 'ai', label: 'AI', icon: Cpu, tooltip: 'ETER AI ASSISTANT' },
    { id: 'profiles', label: 'PRF', icon: Users, tooltip: 'Player Profiles' },
    { id: 'gallery', label: 'GLR', icon: Scroll, tooltip: 'Gallery' },
    { id: 'console', label: 'CON', icon: ExternalLink, href: 'https://paneldiscord-delta.vercel.app/#', tooltip: 'External Console' },
  ];

  const secondaryNavItems = [
    { id: 'resources', label: 'Resources', icon: Scroll, tooltip: 'Download Hub' },
    { id: 'docs', label: 'Documentation', icon: BookOpen, tooltip: 'Knowledge Base' },
    { id: 'rules', label: 'Server Rules', icon: ShieldAlert, tooltip: 'Server Rules' },
    { id: 'maps', label: 'Map Archive', icon: Map, tooltip: 'WORLD SERVER' },
    { id: 'support', label: 'Support', icon: HelpCircle, tooltip: 'Help Center' },
    { id: 'discord-support', label: 'Discord Support', icon: MessageSquare, tooltip: 'Community Hub' },
    { id: 'bugs', label: 'Bug Report', icon: Bug, tooltip: 'Registry of Flaws' },
    { id: 'apply', label: 'Staff Application', icon: FileText, tooltip: 'Join the Order' },
  ];

  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredY, setHoveredY] = useState<number | null>(null);
  const allNavItems = [...navItems, ...secondaryNavItems];
  const activeNavItem = allNavItems.find(item => item.id === activePage);
  const hoveredItem = allNavItems.find(item => item.id === hoveredNav || item.label === hoveredNav);

  const particlesOptions = useMemo(() => ({
    particles: {
      number: { value: 80, density: { enable: true, area: 800 } },
      color: { value: ["#DDA0DD", "#FFD700", "#FF4D4D"] },
      shape: { type: "circle" },
      opacity: { 
        value: { min: 0.1, max: 0.5 },
        animation: { enable: true, speed: 1, minimumValue: 0.1, sync: false }
      },
      size: { 
        value: { min: 1, max: 3 },
        animation: { enable: true, speed: 2, minimumValue: 0.1, sync: false }
      },
      move: { 
        enable: true, 
        speed: 0.8, 
        direction: "none" as const, 
        random: true,
        straight: false,
        outModes: { default: "out" as const },
        attract: { enable: true, rotateX: 600, rotateY: 1200 }
      },
      links: {
        enable: true,
        distance: 150,
        color: "#DDA0DD",
        opacity: 0.2,
        width: 1
      }
    },
    interactivity: {
      events: { 
        onHover: { enable: true, mode: "grab" },
        onClick: { enable: true, mode: "push" }
      },
      modes: { 
        grab: { distance: 200, links: { opacity: 0.5 } },
        push: { quantity: 4 }
      }
    },
    detectRetina: true,
  }), []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-bg overflow-hidden">
      {init && (
        <Particles
          id="tsparticles"
          options={particlesOptions}
          className="fixed inset-0 -z-10 pointer-events-none"
        />
      )}

      {/* Desktop Navigation Rail */}
      <nav className={cn(
        "nav-rail transition-all duration-500",
        isSidebarOpen ? "nav-rail-open translate-x-0" : "nav-rail-closed -translate-x-full md:translate-x-0 md:w-0 md:opacity-0"
      )}>
        <div className="flex flex-col items-center py-8 gap-6 h-full overflow-y-auto custom-scrollbar-hidden">
          <div className="mb-4 md:hidden">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-accent"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex flex-col gap-4 w-full items-center px-4">
            <div className="group relative">
              <div className="text-[10px] font-black text-accent/40 uppercase tracking-[3px] mb-2 hidden md:block cursor-help hover:text-accent transition-colors">Core</div>
              <div className="absolute left-full ml-4 top-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50">
                <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg backdrop-blur-md">
                   <div className="w-1 h-1 bg-accent rounded-full animate-pulse"></div>
                   <span className="text-[9px] font-black text-accent uppercase tracking-[2px]">Systems Management Core</span>
                </div>
              </div>
            </div>
            {navItems.map((item) => (
              item.href ? (
                <a
                  key={`side-href-${item.id}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 text-text-dim hover:text-accent hover:bg-accent-dim rounded-xl transition-all group relative flex items-center justify-center"
                  onClick={() => setIsSidebarOpen(false)}
                  onMouseEnter={(e) => {
                    setHoveredNav(item.id);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const parentRect = dashboardRef.current?.getBoundingClientRect();
                    if (parentRect) {
                      setHoveredY(rect.top - parentRect.top + (rect.height / 2));
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredNav(null);
                    setHoveredY(null);
                  }}
                >
                  <item.icon size={22} />
                </a>
              ) : (
                <motion.button
                  key={`side-btn-${item.id}`}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsSidebarOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredNav(item.id);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const parentRect = dashboardRef.current?.getBoundingClientRect();
                    if (parentRect) {
                      setHoveredY(rect.top - parentRect.top + (rect.height / 2));
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredNav(null);
                    setHoveredY(null);
                  }}
                  whileHover={{ scale: 1.1, color: "#DDA0DD" }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-3 rounded-xl transition-all group relative flex items-center justify-center",
                    activePage === item.id 
                      ? "text-accent bg-accent/10 shadow-[0_0_20px_rgba(221,160,221,0.2)] border border-accent/20" 
                      : "text-text-dim hover:text-accent hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <item.icon size={22} />
                </motion.button>
              )
            ))}
          </div>

          <div className="w-8 h-px bg-white/10 my-2" />

          <div className="flex flex-col gap-4 w-full items-center px-4">
            <div className="group relative">
              <div className="text-[10px] font-black text-accent/40 uppercase tracking-[3px] mb-2 hidden md:block cursor-help hover:text-accent transition-colors">Portal</div>
            </div>
            {secondaryNavItems.map((item) => (
              <motion.button
                key={`sec-btn-${item.id}`}
                onClick={() => {
                  setActivePage(item.id);
                  setIsSidebarOpen(false);
                }}
                onMouseEnter={(e) => {
                  setHoveredNav(item.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const parentRect = dashboardRef.current?.getBoundingClientRect();
                  if (parentRect) {
                    setHoveredY(rect.top - parentRect.top + (rect.height / 2));
                  }
                }}
                onMouseLeave={() => {
                  setHoveredNav(null);
                  setHoveredY(null);
                }}
                whileHover={{ scale: 1.1, color: "#DDA0DD" }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-3 rounded-xl transition-all group relative flex items-center justify-center",
                  activePage === item.id 
                    ? "text-accent bg-accent/10 shadow-[0_0_20px_rgba(221,160,221,0.2)] border border-accent/20" 
                    : "text-text-dim hover:text-accent hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <item.icon size={22} />
              </motion.button>
            ))}
          </div>

          <div className="mt-auto pt-6 w-full flex flex-col items-center">
             <div className="status-badge flex flex-col items-center gap-1 p-2 w-[65px] md:w-[75px]">
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse"></span>
                   <span className="text-[7px] font-bold text-accent">STATUS</span>
                </div>
                <div className="text-[6px] text-text-dim uppercase text-center leading-[1.2] tracking-tighter">
                   System Status<br />
                   <span className="text-text-main/60">All systems operational</span>
                </div>
             </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Bar */}
      <nav className="nav-mobile">
        {navItems.map((item) => (
          item.href ? (
            <a
              key={`mob-href-${item.id}`}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-text-dim hover:text-accent transition-colors"
            >
              <item.icon size={16} />
              <span className="text-[7px] uppercase tracking-tighter">{item.label}</span>
            </a>
          ) : (
            <div
              key={`mob-btn-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activePage === item.id ? 'text-accent scale-110 drop-shadow-[0_0_8px_rgba(221,160,221,0.5)]' : 'text-text-dim hover:text-accent/70'}`}
            >
              <item.icon size={16} />
              <span className="text-[7px] uppercase tracking-tighter">{item.label}</span>
            </div>
          )
        ))}
      </nav>

      {/* Main Layout */}
      <div className={cn(
        "main-layout",
        isSidebarOpen ? "md:ml-0" : ""
      )}>
        <header className="h-14 md:h-20 flex items-center justify-between px-3 md:px-10 border-b border-border backdrop-blur-md z-40 transition-all duration-500" style={{ background: 'var(--header-bg)' }}>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 md:p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-accent flex items-center justify-center"
            >
              <Menu size={20} className="md:w-6 md:h-6" />
            </button>
            <motion.img 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              src="https://github.com/marcellnw/paneleternalsmp/blob/main/1775664361126.png?raw=true" 
              alt="Logo" 
              className="w-6 h-6 md:w-10 md:h-10"
              referrerPolicy="no-referrer"
            />
            <div className="font-serif text-sm md:text-xl tracking-[1px] md:tracking-[2px] text-accent font-bold uppercase">
              ETERNALSMP <span className="hidden sm:inline">PANEL</span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <motion.button
              whileTap={{ rotate: 180, scale: 0.8 }}
              onClick={toggleTheme}
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all text-accent group relative border border-border"
            >
              {theme === 'dark' ? <Sun size={20} className="md:w-6 md:h-6" /> : <Moon size={20} className="md:w-6 md:h-6" />}
              <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-accent text-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </span>
            </motion.button>

            <button 
              onClick={sendReportToDiscord}
              disabled={isExporting}
              className={cn(
                "p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all text-accent group relative",
                isExporting && "animate-pulse opacity-50 cursor-not-allowed"
              )}
            >
              <Send size={20} className="md:w-6 md:h-6" />
              <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-accent text-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {isExporting ? 'Sending...' : 'Kirim ke Discord'}
              </span>
            </button>

            <div className="status-badge flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 text-[9px] md:text-xs">
              <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-[#22c55e] rounded-full animate-pulse"></span>
              <span className="hidden xs:inline">Operational</span>
              <span className="xs:hidden">Online</span>
            </div>
            <div className="text-[9px] md:text-[10px] text-text-dim uppercase tracking-widest hidden md:block">
              v2.5.0-STABLE
            </div>
          </div>
        </header>

        {activePage === 'home' && <PlayerMarquee />}

        <div 
          ref={dashboardRef}
          className="content-area overflow-y-auto custom-scrollbar flex-1 scroll-smooth relative"
        >
          {/* Follower Status Badge */}
          <div className="hidden md:block absolute left-4 top-0 z-[60] pointer-events-none w-full">
            <AnimatePresence>
              {hoveredItem && (
                <motion.div 
                  key="follower-badge"
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ 
                    y: hoveredY !== null ? (hoveredY - 18) : 0,
                    opacity: 1,
                    scale: 1,
                    x: 0
                  }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 32
                  }}
                  className="flex items-center gap-2.5 bg-surface/95 backdrop-blur-3xl border border-accent/40 px-3 py-1.5 rounded-xl w-fit shadow-[0_0_30px_rgba(0,0,0,0.4)]"
                >
                   <div className="p-1.5 bg-accent/20 rounded-lg text-accent border border-accent/20 scale-90">
                      <hoveredItem.icon size={14} />
                   </div>
                   <div className="flex flex-col pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] font-black text-accent/80 uppercase tracking-[3px]">
                          SYSTEM LINK
                        </span>
                        <motion.div 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-1 h-1 bg-accent rounded-full shadow-[0_0_6px_#DDA0DD]"
                        ></motion.div>
                      </div>
                      <span className="text-[11px] font-serif font-black text-text-main/90 uppercase tracking-[1.2px] whitespace-nowrap">
                        {hoveredItem.tooltip}
                      </span>
                   </div>
                   
                   {/* Pointing Indicator */}
                   <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-surface/95 border-l border-b border-accent/30 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-10 md:h-12" /> {/* Compact Spacer */}

          <AnimatePresence mode="wait">
            {activePage === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="page-container"
              >
                <PageBackground page="overview" />
                <div className="content-grid">
                  <div className="main-content">
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                      className="rpg-card fantasy-border p-6 md:p-16 text-center md:text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                      <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-h1 mb-4 md:mb-8 leading-tight moving-title"
                      >
                        Selamat Datang, <br /> 
                        <span className="text-white">Administrator</span>
                      </motion.h1>
                      <p className="text-body text-text-dim leading-relaxed max-w-2xl font-light">
                        Sistem manajemen pusat EternalSMP. Pantau status server, kelola quest, dan kirim pengumuman penting secara real-time melalui antarmuka administratif yang aman.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-12 justify-center md:justify-start">
                        <motion.button 
                          variants={BUTTON_VARIANTS}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => setActivePage('dashboard')} 
                          className="btn-fantasy px-8 md:px-12 py-4 md:py-5 w-full sm:w-auto"
                        >
                          BUKA DASHBOARD
                        </motion.button>
                        <motion.button 
                          variants={BUTTON_VARIANTS}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => setActivePage('server')} 
                          className="btn-fantasy-outline px-8 md:px-12 py-4 md:py-5 w-full sm:w-auto"
                        >
                          STATUS SERVER
                        </motion.button>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="rpg-card group"
                      >
                        <div className="flex items-center gap-6 mb-8">
                          <div className="p-5 bg-accent-dim rounded-2xl text-accent group-hover:bg-accent-muted transition-all duration-300">
                            <Users size={32} />
                          </div>
                          <div>
                            <div className="text-4xl font-serif text-accent font-black">1,240</div>
                            <div className="text-xs text-text-dim uppercase tracking-[3px] font-bold">Total Players</div>
                          </div>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "75%" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="bg-accent h-full shadow-[0_0_15px_rgba(221,160,221,0.5)]"
                          ></motion.div>
                        </div>
                      </motion.div>
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="rpg-card group"
                      >
                        <div className="flex items-center gap-6 mb-8">
                          <div className="p-5 bg-crimson/10 rounded-2xl text-crimson group-hover:bg-crimson/20 transition-all duration-300">
                            <ShieldAlert size={32} />
                          </div>
                          <div>
                            <div className="text-4xl font-serif text-crimson font-black">0</div>
                            <div className="text-xs text-text-dim uppercase tracking-[3px] font-bold">Active Alerts</div>
                          </div>
                        </div>
                        <div className="text-xs text-green-400 mt-2 font-semibold tracking-wide flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          All systems are secure and operational.
                        </div>
                      </motion.div>
                    </div>
                    </div>

                    <div className="side-content">
                      <div className="rpg-card">
                        <h3 className="text-xs uppercase tracking-[3px] mb-6 flex items-center gap-3 text-accent font-bold">
                          <Activity size={18} />
                          Quick Actions
                        </h3>
                        <div className="space-y-4">
                          <motion.button 
                            variants={QUICK_ACTION_VARIANTS}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleClearCache}
                            disabled={isClearingCache}
                            className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl transition-all text-xs flex items-center justify-between group disabled:opacity-50 relative overflow-hidden backdrop-blur-md"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 -translate-x-full group-hover:animate-shimmer" />
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                                <Zap size={14} className="text-accent" />
                              </div>
                              <span className="font-bold tracking-wider uppercase">{isClearingCache ? "Purifying..." : "Clear Cache"}</span>
                            </div>
                            <RefreshCw size={16} className={`${isClearingCache ? 'animate-spin text-accent' : 'group-hover:rotate-180 transition-transform text-text-dim relative z-10'}`} />
                          </motion.button>

                          <motion.button 
                            variants={QUICK_ACTION_VARIANTS}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleSyncDatabase}
                            disabled={isSyncing}
                            className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl transition-all text-xs flex flex-col gap-3 group disabled:opacity-50 relative overflow-hidden backdrop-blur-md"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 -translate-x-full group-hover:animate-shimmer" />
                            <div className="flex items-center justify-between w-full relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                                  <Database size={14} className="text-accent" />
                                </div>
                                <span className="font-bold tracking-wider uppercase">{isSyncing ? `Syncing (${syncProgress}%)...` : "Sync Database"}</span>
                              </div>
                              <LayoutDashboard size={16} className="text-text-dim group-hover:text-accent group-hover:scale-120 transition-all font-bold" />
                            </div>
                            {isSyncing && (
                              <div className="w-full bg-border/20 h-1.5 rounded-full overflow-hidden relative z-10">
                                <div className="bg-accent h-full transition-all duration-300 shadow-[0_0_10px_rgba(221,160,221,0.5)]" style={{ width: `${syncProgress}%` }}></div>
                              </div>
                            )}
                          </motion.button>

                          <motion.button 
                            variants={QUICK_ACTION_VARIANTS}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport}
                            className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl transition-all text-xs flex items-center justify-between group disabled:opacity-50 relative overflow-hidden backdrop-blur-md"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 -translate-x-full group-hover:animate-shimmer" />
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                                <FileOutput size={14} className="text-accent" />
                              </div>
                              <span className="font-bold tracking-wider uppercase">{isGeneratingReport ? "Scribing..." : "Generate Report"}</span>
                            </div>
                            <Scroll size={16} className="text-text-dim group-hover:text-accent group-hover:rotate-12 transition-all relative z-10" />
                          </motion.button>
                        </div>
                      </div>

                      <div className="rpg-card">
                        <h3 className="text-xs uppercase tracking-[3px] mb-6 flex items-center gap-3 text-accent font-bold">
                          <LucideHistory size={18} />
                          Recent System Logs
                        </h3>
                        <div className="space-y-4 font-mono text-[9px] opacity-70">
                          <div className="flex gap-2">
                            <span className="text-accent">[04:52:10]</span>
                            <span>INFO: Neural Link established with Feeloria Core.</span>
                          </div>
                          <div className="flex gap-2 text-green-400">
                            <span className="opacity-60">[04:52:12]</span>
                            <span>SUCCESS: Memory Archives synchronized (3,000 sectors).</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-accent">[04:52:15]</span>
                            <span>WARN: Minor instability detected in the resource flow.</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-accent">[04:55:38]</span>
                            <span>INFO: Admin session initialized via Web Terminal.</span>
                          </div>
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                             <span className="text-[7px] uppercase tracking-widest text-text-dim">Log level: Detailed</span>
                             <button className="text-[7px] uppercase tracking-widest text-accent hover:underline">View All Logs</button>
                          </div>
                        </div>
                      </div>

                      <div className="rpg-card">
                        <h3 className="text-xs uppercase tracking-[3px] mb-6 flex items-center gap-3 text-accent font-bold">
                          <Cpu size={18} />
                          System Load
                        </h3>
                        <div className="space-y-6">
                        <div>
                          <div className="flex justify-between text-[10px] mb-2 font-bold tracking-widest">
                            <span>CPU USAGE</span>
                            <span className="text-accent">24%</span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="bg-accent h-full w-[24%] shadow-[0_0_10px_rgba(221,160,221,0.5)]"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] mb-2 font-bold tracking-widest">
                            <span>RAM USAGE</span>
                            <span className="text-accent">4.2GB / 16GB</span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="bg-accent h-full w-[35%] shadow-[0_0_10px_rgba(221,160,221,0.5)]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="page-container"
              >
                <PageBackground page="ai" />
                <div className="content-grid">
                  <div className="main-content">
                    <div className="mb-12">
                      <motion.h2 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-h2 mb-4 moving-title"
                      >
                        Webhook Dispatcher
                      </motion.h2>
                      <p className="text-text-dim text-lg max-w-2xl font-light">Broadcast high-priority notifications to Discord channels with custom embeds and real-time delivery.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-10">
                      {(Object.keys(FORM_CONFIG) as Category[]).map((cat) => (
                        <motion.button
                          key={`cat-tab-${cat}`}
                          whileHover={{ scale: 1.05, borderColor: "#DDA0DD" }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[2px] md:tracking-[3px] transition-all border",
                            currentCategory === cat 
                              ? "bg-accent text-black border-accent shadow-[0_0_20px_rgba(221,160,221,0.4)]" 
                              : "bg-white/5 text-text-dim border-white/10 hover:border-accent-glow hover:text-accent"
                          )}
                          onClick={() => {
                            setCurrentCategory(cat);
                            setFormData({});
                          }}
                        >
                          {cat}
                        </motion.button>
                      ))}
                    </div>

                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                      className="rpg-card fantasy-border space-y-6 md:space-y-10 p-6 md:p-12"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {FORM_CONFIG[currentCategory].map((field) => {
                          const id = field.toLowerCase().replace(/ /g, '_');
                          const isTextarea = ['Description', 'Log Perubahan', 'Reward'].includes(field);
                          
                          return (
                            <div key={`field-id-${field}`} className={isTextarea ? "md:col-span-2" : ""}>
                              <label className="block text-[9px] md:text-[10px] font-bold uppercase tracking-[2px] md:tracking-[3px] text-accent mb-3 md:mb-4">{field}</label>
                              {isTextarea ? (
                                <textarea
                                  id={id}
                                  rows={5}
                                  placeholder={`Enter ${field.toLowerCase()}...`}
                                  value={formData[id] || ""}
                                  onChange={(e) => handleInputChange(id, e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 text-sm focus:border-accent-glow focus:ring-1 focus:ring-accent-glow transition-all outline-none placeholder:text-white/10"
                                />
                              ) : (
                                <input
                                  type="text"
                                  id={id}
                                  placeholder={`Enter ${field.toLowerCase()}...`}
                                  value={formData[id] || ""}
                                  onChange={(e) => handleInputChange(id, e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 text-sm focus:border-accent-glow focus:ring-1 focus:ring-accent-glow transition-all outline-none placeholder:text-white/10"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <motion.button 
                        variants={BUTTON_VARIANTS}
                        whileHover="hover"
                        whileTap="tap"
                        className="btn-fantasy w-full py-4 md:py-6 text-sm md:text-base tracking-[3px] md:tracking-[4px]"
                        onClick={sendToDiscord}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <div className="flex items-center gap-3 md:gap-4">
                            <RefreshCw size={20} className="animate-spin" />
                            EXECUTING...
                          </div>
                        ) : (
                          <>
                            <Send size={20} />
                            EXECUTE DISPATCH
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  </div>

                  <aside className="side-content">
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={1}
                      className="rpg-card group"
                    >
                      <div className="text-3xl font-serif text-accent group-hover:scale-110 transition-transform">12ms</div>
                      <div className="text-[10px] text-text-dim uppercase tracking-[3px] font-bold">API Latency</div>
                    </motion.div>
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={2}
                      className="rpg-card flex flex-col h-[500px]"
                    >
                      <h3 className="text-xs uppercase tracking-[3px] mb-6 text-accent font-bold flex items-center gap-2">
                        <Activity size={16} />
                        Recent Dispatches
                      </h3>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <div key={`dispatch-item-${i}`} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-accent/30 transition-all group">
                            <div className="font-bold text-accent text-xs mb-1 group-hover:translate-x-1 transition-transform">Announcement Sent</div>
                            <div className="text-[10px] text-text-dim mb-2">Target: #general-announcements</div>
                            <div className="text-[9px] opacity-40 flex items-center gap-1">
                              <div className="w-1 h-1 bg-accent rounded-full"></div>
                              {i * 5} mins ago
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </aside>
                </div>
              </motion.div>
            )}

            {activePage === 'server' && (
              <motion.div
                key="server"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="page-container max-w-full px-4 md:px-12"
              >
                <PageBackground page="server" />
                
                {/* 🔝 Minimal Top Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8 bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-dim uppercase font-black tracking-[3px] opacity-40">Dimensional Server</span>
                      <h2 className="text-xl font-serif font-black text-white uppercase tracking-tight">EternalSMP Season 15</h2>
                    </div>
                    <div className="h-10 w-px bg-white/10 hidden md:block" />
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        serverStatus === 'online' ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : 
                        serverStatus === 'restarting' ? "bg-yellow-500 shadow-[0_0_10px_#eab308]" : 
                        "bg-red-500 shadow-[0_0_10px_#ef4444]"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        serverStatus === 'online' ? "text-green-500" : 
                        serverStatus === 'restarting' ? "text-yellow-500" : 
                        "text-red-500"
                      )}>
                        {serverStatus === 'online' ? '🟢 Online' : serverStatus === 'restarting' ? '🟡 Restarting' : '🔴 Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5 hover:border-accent/40 transition-all group">
                       <span className="text-[10px] font-mono text-accent">private.senuxcloud.store:19132</span>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText("private.senuxcloud.store:19132");
                           addToast("IP Address copied to clipboard", "success");
                         }}
                         className="p-1 hover:bg-accent/20 rounded transition-colors"
                       >
                         <Copy size={12} className="text-text-dim group-hover:text-accent" />
                       </button>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-xl border border-white/5">
                      <Clock size={14} className="text-text-dim" />
                      <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Uptime: {serverStatus === 'online' ? serverUptime : '0h 0m'}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                      <motion.button whileHover={{ scale: 1.1 }} className="p-2 text-text-dim hover:text-accent relative">
                        <MessageSquare size={18} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-surface"></span>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center overflow-hidden">
                        <img src="https://mc-heads.net/avatar/Marcellnw/32" alt="Admin" className="w-full h-full" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        className="p-2 text-accent/60 hover:text-accent"
                        onClick={() => addToast("Backup reminder: System scheduled for automatic backup in 2 hours.", "info")}
                      >
                        <Shield size={18} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* ⚡ Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Stats & Control */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* 🟩 1. Quick Stats Card */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Players', val: serverStats.players, max: 3000, unit: '', icon: Users, color: 'text-blue-400', key: 'players' },
                        { label: 'TPS', val: serverStats.tps.toFixed(1), max: 20, unit: '', icon: Activity, color: serverStats.tps > 19 ? 'text-green-400' : 'text-yellow-400', key: 'tps' },
                        { label: 'CPU', val: serverStats.cpu.toFixed(2), max: 100, unit: '%', icon: Cpu, color: 'text-purple-400', key: 'cpu' },
                        { label: 'RAM', val: serverStats.ram, max: 4096, unit: 'MB', icon: Database, color: 'text-cyan-400', key: 'ram' },
                        { label: 'Disk', val: serverStats.disk.toFixed(2), max: 50, unit: 'GB', icon: LayoutDashboard, color: 'text-orange-400', key: 'disk' }
                      ].map((stat, i) => (
                        <div key={stat.label} className="rpg-card p-4 flex flex-col justify-between h-32 group hover:border-accent">
                          <div className="flex justify-between items-start">
                            <stat.icon size={14} className={stat.color} />
                            <span className="text-[14px] font-mono font-bold text-white leading-none">
                              {serverStatus === 'online' ? stat.val : '0'}<span className="text-[8px] opacity-40 ml-0.5">{stat.unit}</span>
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="text-[8px] font-black uppercase tracking-[2px] text-text-dim opacity-50">{stat.label}</div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: serverStatus === 'online' ? `${(Number(stat.val) / stat.max) * 100}%` : 0 }}
                                className={cn("h-full", stat.color.replace('text-', 'bg-'))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 📊 2. Real-Time Graph */}
                    <div className="rpg-card p-6 flex flex-col h-[350px]">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg text-accent"><Activity size={16} /></div>
                          <h3 className="text-xs font-black uppercase tracking-[3px] text-white">System Resource flow</h3>
                        </div>
                        <div className="flex gap-2">
                           {[
                             { id: 'cpu', label: 'CPU' },
                             { id: 'ram', label: 'Memory' },
                             { id: 'net', label: 'Network' }
                           ].map(tab => (
                             <button 
                               key={tab.id} 
                               onClick={() => setChartTab(tab.id as any)}
                               className={cn(
                                 "px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                 chartTab === tab.id ? "bg-accent/20 border-accent/40 text-accent" : "bg-white/5 border-white/5 text-text-dim hover:text-accent"
                               )}
                             >
                                {tab.label}
                             </button>
                           ))}
                        </div>
                      </div>
                      <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={historyData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#DDA0DD" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#DDA0DD" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                              itemStyle={{ color: '#DDA0DD' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey={chartTab} 
                              stroke="#DDA0DD" 
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 💬 4. Live Core Chat (Discord) */}
                    <div className="rpg-card p-0 flex flex-col h-[400px] border-accent/20 shadow-[0_0_40px_rgba(221,160,221,0.05)]">
                       <div className="p-4 border-b border-white/5 bg-accent/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <MessageSquare size={14} className="text-accent" />
                           <span className="text-[10px] font-black uppercase tracking-[4px] text-accent">Live Core Chat</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                           <button 
                             onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                             className={cn(
                               "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all border",
                               autoScrollEnabled 
                                 ? "bg-accent/20 border-accent/40 text-accent" 
                                 : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                             )}
                             title={autoScrollEnabled ? "Auto-scroll: Enabled" : "Auto-scroll: Paused"}
                           >
                              {autoScrollEnabled ? "STK_LOCK: ON" : "STK_LOCK: OFF"}
                           </button>
                           <div className="w-px h-3 bg-white/10 mx-1" />
                           <button 
                             onClick={() => fetchMessages()}
                             className="p-1.5 hover:bg-white/5 rounded-md text-text-dim hover:text-white transition-colors"
                             title="Manual Sync"
                           >
                             <RefreshCw size={12} className={cn(isSending && "animate-spin")} />
                           </button>
                           <button 
                             onClick={clearDiscordChat}
                             className="p-1.5 hover:bg-white/5 rounded-md text-text-dim hover:text-red-400 transition-colors"
                             title="Clear History"
                           >
                             <Trash2 size={12} />
                           </button>
                           <div className={cn(
                             "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                             connectionStatus === 'live' ? "bg-accent/10" : "bg-yellow-500/10 cursor-help"
                           )} title={connectionStatus === 'live' ? "Synchronized with Neural Link" : "Set Discord credentials in Settings to enable Live Member Chat"}>
                             <div className={cn(
                               "w-1.5 h-1.5 rounded-full",
                               connectionStatus === 'live' ? "bg-accent animate-pulse" : "bg-yellow-500"
                             )}></div>
                             <span className={cn(
                               "text-[8px] font-bold uppercase tracking-widest",
                               connectionStatus === 'live' ? "text-accent" : "text-yellow-500"
                             )}>
                               {connectionStatus === 'live' ? "Core_Bridge: Active" : "Bridge: Simulation"}
                             </span>
                           </div>
                         </div>
                      </div>
                      <div className={cn(
                        "flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-3 bg-black/40 custom-scrollbar relative flex",
                        autoScrollEnabled ? "flex-col-reverse" : "flex-col"
                      )}>
                         <div ref={consoleEndRef} />
                         {!isBannerDismissed && (chatMessages.some(m => m.content.includes("MISSING ACCESS")) || (chatMessages.length > 0 && chatMessages.every(m => !m.content && m.author.username !== "System" && !m.isOptimistic))) && (
                           <div className="absolute inset-x-4 top-4 z-20 p-4 bg-red-900/60 border border-red-500/50 rounded-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-4 shadow-2xl">
                             <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3 text-red-400 font-black uppercase tracking-widest text-[10px]">
                                 <ShieldAlert size={14} /> SECURITY & ACCESS ALERT
                               </div>
                               <button 
                                 onClick={() => setIsBannerDismissed(true)}
                                 className="text-white/40 hover:text-white transition-colors"
                               >
                                 <X size={14} />
                               </button>
                             </div>
                             <p className="text-[9px] text-white/70 mb-3 leading-relaxed">
                               Bot is connected but cannot see text content. You MUST enable 'MESSAGE CONTENT INTENT' in the Discord Developer Portal.
                             </p>
                             <div className="flex flex-col gap-1.5">
                               <a 
                                 href="https://discord.com/oauth2/authorize?client_id=1494913239186931732&permissions=8&integration_type=0&scope=bot" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-[8px] font-black text-accent bg-accent/10 px-3 py-2 rounded-md hover:bg-accent hover:text-black transition-all flex items-center justify-center gap-2 border border-accent/20"
                               >
                                 <Users size={12} /> RE-INVITE BOT (FIX PERMISSIONS)
                               </a>
                               <a 
                                 href="https://discord.com/developers/applications" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-[8px] font-bold text-white/60 hover:text-white flex items-center gap-1 justify-center mt-1 transition-colors"
                               >
                                 <ExternalLink size={10} /> OPEN DISCORD DEVELOPER PORTAL
                               </a>
                               <p className="text-[8px] text-white/40 italic text-center">Required Intents: View Channel, Read History, Message Content</p>
                             </div>
                           </div>
                         )}
                         {(!Array.isArray(chatMessages) || chatMessages.length === 0) ? (
                           <div className="h-full flex items-center justify-center text-text-dim italic opacity-30 select-none">
                             [ CHANNEL SILENT : AWAITING TRANSMISSION ]
                           </div>
                         ) : (
                           chatMessages.map((msg) => (
                             <div key={msg.id} className={cn(
                               "flex flex-col gap-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                               msg.isOptimistic && "opacity-60"
                             )}>
                               <div className="flex items-center gap-2">
                                 <span className="opacity-30 text-[9px]">[{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                                 {msg.author.id && msg.author.avatar && (
                                   <div className="w-4 h-4 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                                     <img 
                                       src={`https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png?size=32`} 
                                       alt=""
                                       onError={(e) => (e.currentTarget.style.display = 'none')}
                                       referrerPolicy="no-referrer"
                                       className="w-full h-full object-cover"
                                     />
                                   </div>
                                 )}
                                 <span className={cn(
                                   "font-black uppercase tracking-widest",
                                   msg.author.username === "EternalSMP" || msg.author.username === "Admin"
                                     ? "text-accent" 
                                     : msg.author.username === "System" 
                                       ? "text-text-dim italic" 
                                       : "text-white"
                                 )}>
                                   {msg.author.username}
                                 </span>
                               </div>
                               <div className={cn(
                                 "ml-2 pl-3 border-l-2 border-white/5 leading-relaxed break-words text-[11px]",
                                 msg.author.username === "System" ? "text-text-dim italic" : "text-white/90"
                               )}>
                                 {msg.content || (
                                    <div className="opacity-60 text-red-400/80 italic flex flex-col gap-1 uppercase tracking-tighter">
                                       <span className="flex items-center gap-1">
                                      {((msg as any).embeds?.length || (msg as any).attachments?.length) 
                                        ? <><FileText size={10} /> [RICH CONTENT / ATTACHMENT]</> 
                                        : <><AlertCircle size={10} /> [CONTENT INTENT REQUIRED]</>}
                                       </span>
                                      {!msg.isOptimistic && !((msg as any).embeds?.length || (msg as any).attachments?.length) && (
                                        <span className="text-[7px] opacity-40 lowercase">Enable "Message Content Intent" in Discord Dev Portal to fix.</span>
                                      )}
                                    </div>
                                  )}
                               </div>
                             </div>
                           ))
                         )}
                      </div>
                      <div className="p-4 bg-black/60 border-t border-white/5 space-y-3">
                         <div className="flex gap-2">
                           <button 
                             onClick={() => setChatInput(prev => prev + "@everyone ")}
                             className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[9px] font-bold text-accent uppercase tracking-widest hover:bg-accent/20 transition-colors"
                           >
                             @everyone
                           </button>
                           <button 
                             onClick={() => setChatInput(prev => prev + "@Member ")}
                             className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 transition-colors hover:text-white"
                           >
                             @member
                           </button>
                         </div>
                         <div className="relative group">
                           <ChevronRight size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
                           <input 
                             type="text" 
                             disabled={isSending}
                             value={chatInput}
                             onChange={(e) => setChatInput(e.target.value)}
                             placeholder={isSending ? "Syncing with Discord..." : "Execute command… (use wisely 👀)"}
                             className="w-full bg-surface border border-white/5 rounded-xl pl-10 pr-24 py-3.5 text-xs outline-none focus:border-accent/40 transition-all font-mono disabled:opacity-50"
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 if (!chatInput) return;
                                 handleSendMessage(chatInput);
                                 setChatInput("");
                               }
                             }}
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-text-dim uppercase tracking-widest opacity-40 group-focus-within:opacity-100 transition-opacity">
                             ENTER TO SEND
                           </div>
                         </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Actions, Network, Players */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* 🎛️ 3. Control Panel */}
                    <div className="rpg-card p-6 space-y-6 flex flex-col">
                       <h3 className="text-xs font-black uppercase tracking-[3px] text-accent flex items-center gap-2">
                         <Zap size={14} /> Control Flux
                       </h3>
                       <div className="grid grid-cols-1 gap-3">
                         <motion.button 
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           disabled={serverStatus !== 'offline'}
                           onClick={() => {
                             setServerStatus('restarting');
                             addToast("Initiating server startup sequence...", "success");
                             setTimeout(() => {
                               setServerStatus('online');
                               addToast("Server is now Online", "success");
                             }, 3000);
                           }}
                           className={cn(
                             "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[4px] transition-all",
                             serverStatus === 'offline' ? "bg-green-500/80 hover:bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.3)]" : "bg-white/5 text-white/20 border border-white/5 opacity-50 cursor-not-allowed"
                           )}
                         >
                           {serverStatus === 'online' ? 'ALREADY ONLINE' : serverStatus === 'restarting' ? 'STARTING...' : <><Plus size={16} /> START CORE</>}
                         </motion.button>

                         <motion.button 
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           disabled={serverStatus === 'restarting'}
                           onClick={() => {
                             if (confirm("Confirm server restart sequence? All dimensions will temporarily collapse.")) {
                               setServerStatus('restarting');
                               addToast("Restarting...", "info");
                               setTimeout(() => {
                                 setServerStatus('online');
                                 addToast("Resonance Restored", "success");
                               }, 4000);
                             }
                           }}
                           className="w-full py-4 bg-yellow-500/80 hover:bg-yellow-500 text-black rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[4px] transition-all"
                         >
                           <RefreshCw size={16} className={cn(serverStatus === 'restarting' && "animate-spin")} />
                           {serverStatus === 'restarting' ? 'SYNCING...' : 'RESTART FLUX'}
                         </motion.button>

                         <motion.button 
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           disabled={serverStatus === 'offline'}
                           onClick={() => {
                             if (confirm("DANGER: This will forcefully collapse all active rifts. Proceed?")) {
                               setServerStatus('offline');
                               addToast("Critical Stop Executed", "error");
                             }
                           }}
                           className="w-full py-4 bg-red-500/80 hover:bg-red-500 text-black rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[4px] transition-all"
                         >
                           <X size={16} /> STOP SESSION
                         </motion.button>
                       </div>

                       <div className="pt-4 border-t border-white/5 mt-auto">
                          {/* ⚙️ 7. System Health */}
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-3 h-3 rounded-full",
                                  serverStats.tps >= 19 ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-yellow-500 shadow-[0_0_8px_#eab308]"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  serverStats.tps >= 19 ? "text-green-500" : "text-yellow-500"
                                )}>
                                  {serverStats.tps >= 19 ? 'System Stable' : 'Warning (TPS Drop)'}
                                </span>
                             </div>
                             <div className="text-[10px] text-text-dim/40 font-bold uppercase tracking-widest">Health Score: 98</div>
                          </div>
                       </div>
                    </div>

                    {/* 🌐 5. Network & Traffic Panel */}
                    <div className="rpg-card p-6 space-y-4">
                       <h3 className="text-xs font-black uppercase tracking-[3px] text-accent flex items-center gap-2">
                         <Map size={14} /> Dimensional Traffic
                       </h3>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center group">
                             <div className="flex items-center gap-3">
                                <FileOutput size={14} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                                <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Inbound</span>
                             </div>
                             <span className="text-sm font-mono text-white">{serverStats.inbound.toFixed(2)} MiB</span>
                          </div>
                          <div className="flex justify-between items-center group">
                             <div className="flex items-center gap-3">
                                <FileOutput size={14} className="rotate-180 text-purple-400 group-hover:-rotate-[162deg] transition-transform" />
                                <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Outbound</span>
                             </div>
                             <span className="text-sm font-mono text-white">{serverStats.outbound.toFixed(2)} MiB</span>
                          </div>
                          <div className="flex justify-between items-center group pt-2 border-t border-white/5">
                             <div className="flex items-center gap-3">
                                <Activity size={14} className="text-green-400" />
                                <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Latency</span>
                             </div>
                             <span className="text-sm font-mono text-green-400">{serverStats.ping}ms</span>
                          </div>
                       </div>
                    </div>

                    {/* 👥 6. Player Section */}
                    <div className="rpg-card p-6 space-y-6 flex-1 max-h-[450px] flex flex-col">
                       <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-[3px] text-accent flex items-center gap-2">
                           <Users size={14} /> Entity Radar
                         </h3>
                         <span className="text-[10px] font-black text-text-dim opacity-30 uppercase tracking-widest">{serverStats.players} online</span>
                       </div>

                       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                          {serverStatus !== 'online' ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20">
                               <ShieldAlert size={32} />
                               <span className="text-[10px] font-black uppercase tracking-[4px]">Player tracking not configured</span>
                            </div>
                          ) : (
                            ACCEPTED_PLAYERS.map((p, i) => (
                              <div key={p} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-accent/40 transition-all group">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 p-0.5 group-hover:border-accent/30 transition-all overflow-hidden">
                                     <img 
                                      src={`https://mc-heads.net/avatar/${(p === "QueennnzMe" ? "Marcellnw" : p).replace(/\s+/g, '_')}/32`} 
                                      alt="p" 
                                      className="w-full h-full rounded" 
                                     />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white group-hover:text-accent transition-colors">{p}</span>
                                    <span className="text-[8px] text-green-500 font-black uppercase tracking-widest">Active Rift</span>
                                  </div>
                                </div>
                                <div className="text-[9px] font-mono text-text-dim pr-1">{10 + Math.floor(Math.random() * 40)}ms</div>
                              </div>
                            ))
                          )}
                       </div>
                       
                       <button className="w-full py-3 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-text-dim hover:bg-white/10 transition-all">
                          Manage All dimensional visitors
                       </button>
                    </div>

                  </div>

                </div>

                {/* Optional Footer Ref */}
                <div className="mt-12 text-center">
                  <p className="text-[9px] font-black text-text-dim/20 uppercase tracking-[10px]">SenuxCloud Dimensions Control Core V.4.2</p>
                </div>
              </motion.div>
            )}

            {activePage === 'resources' && (
              <motion.div key="resources" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="resources" />
                <div className="mb-12">
                  <h2 className="text-h2 mb-4 moving-title">Resources Hub</h2>
                  <p className="text-text-dim text-lg font-light">Essential assets and downloads for every EternalSMP member.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'Modrinth Archives', platform: 'Modrinth', desc: 'Official modpack and optimization collection.', url: 'https://modrinth.com' },
                    { name: 'MCPEDL Portal', platform: 'MCPEDL', desc: 'Bedrock edition Add-ons and Texture Packs.', url: 'https://mcpedl.com' },
                    { name: 'CurseForge Repository', platform: 'CurseForge', desc: 'Legacy mods and heritage resource packs.', url: 'https://curseforge.com' },
                    { name: 'Texture Pack V2.5', platform: 'Direct', desc: 'Exclusive server-side visuals and assets.', url: '#' },
                    { name: 'Resource Pack S15', platform: 'Direct', desc: 'Latest season compatibility pack.', url: '#' }
                  ].map((res, i) => (
                    <motion.div key={`res-card-${i}`} variants={cardVariants} initial="hidden" animate="visible" custom={i} className="rpg-card group">
                      <div className="flex justify-between items-start mb-4">
                        <Scroll className="text-accent" size={24} />
                        <span className="text-[8px] border border-accent/30 px-2 py-0.5 rounded-full text-accent font-black tracking-widest uppercase">{res.platform}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">{res.name}</h4>
                      <p className="text-[10px] text-text-dim mb-4 leading-relaxed">{res.desc}</p>
                      <button 
                        onClick={() => window.open(res.url === '#' ? 'https://paneldiscord-delta.vercel.app/#' : res.url, '_blank')}
                        className="text-[10px] font-black tracking-widest text-accent uppercase hover:scale-105 transition-all flex items-center gap-2 group/btn"
                      >
                        Mulai <ExternalLink size={12} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activePage === 'docs' && (
              <motion.div key="docs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="docs" />
                <div className="mb-12"><h2 className="text-h2 mb-4 moving-title">Documentation</h2><p className="text-text-dim text-lg font-light">The comprehensive codex of Feeloria's systems and world-building.</p></div>
                <div className="space-y-6">
                  {['Introduction to Feeloria', 'The Lore of EternalSMP', 'Magic Systems Guide', 'Trading & Economy 101'].map((doc, i) => (
                    <motion.div key={`doc-card-${i}`} variants={cardVariants} initial="hidden" animate="visible" custom={i} className="rpg-card flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent-dim rounded-lg text-accent"><BookOpen size={20} /></div>
                        <div><h4 className="text-sm font-bold text-white uppercase tracking-wider">{doc}</h4><p className="text-[10px] text-text-dim">Last updated 2 days ago</p></div>
                      </div>
                      <ExternalLink size={20} className="text-white/20 group-hover:text-accent transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activePage === 'rules' && (
              <motion.div key="rules" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="rules" />
                <div className="mb-12"><h2 className="text-h2 mb-4 moving-title">Server Rules</h2><p className="text-text-dim text-lg font-light">The foundational laws that govern the EternalSMP community.</p></div>
                <div className="rpg-card fantasy-border p-8 space-y-8">
                  <div className="border-l-4 border-crimson pl-6 space-y-2">
                    <h4 className="text-xs font-black text-crimson uppercase tracking-[3px]">I. No Griefing</h4>
                    <p className="text-xs text-text-dim leading-relaxed">Destroying or altering other players' structures without consent is strictly forbidden and punishable by exile.</p>
                  </div>
                  <div className="border-l-4 border-accent pl-6 space-y-2">
                    <h4 className="text-xs font-black text-accent uppercase tracking-[3px]">II. Respect All Members</h4>
                    <p className="text-xs text-text-dim leading-relaxed">Harassment, discrimination, or toxic behavior will not be tolerated in any form across all platforms.</p>
                  </div>
                  <div className="border-l-4 border-gold pl-6 space-y-2">
                    <h4 className="text-xs font-black text-gold uppercase tracking-[3px]">III. Fair Play</h4>
                    <p className="text-xs text-text-dim leading-relaxed">The use of hacks, exploits, or third-party advantages is strictly prohibited. Play fair, play eternal.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'maps' && (
              <motion.div key="maps" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="maps" />
                <div className="mb-12">
                   <h2 className="text-h2 mb-4 moving-title">WORLD SERVER</h2>
                   <p className="text-text-dim text-lg font-light">Explore the detailed cartography of our past and present worlds.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(season => {
                    const link = MAP_LINKS[season];
                    // Custom images provided by the user (EternalSMP themed)
                    const mcImages = [
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/Minecraft%20Shaders%20Scenery.jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/Minecraft%20Wallpaper%20_%20Steve.jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(12).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(1).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(13).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(14).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(2).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(4).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(6).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download%20(7).jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/download.jpg?raw=true",
                      "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/logo%20world%202026/ebabfc6cae3c5a5bca34a08950d0dbc9.jpg?raw=true"
                    ];
                    const bgImage = mcImages[season % mcImages.length];
                    
                    return (
                      <motion.div key={`map-card-${season}`} className="rpg-card p-0 overflow-hidden group border border-white/5 hover:border-accent/30 transition-all">
                        <div className="h-48 overflow-hidden relative">
                          <img 
                            src={bgImage} 
                            alt={`Season ${season} Map`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 blur-[1px] group-hover:blur-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-4 left-4">
                             <div className="px-2 py-1 bg-accent/20 border border-accent/40 rounded text-[8px] font-black text-accent uppercase tracking-widest">
                               Season {season}
                             </div>
                          </div>
                        </div>
                        <div className="p-6">
                           <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tighter">WORLD MAP SEASON {season}</h4>
                           <p className="text-[10px] text-text-dim mb-4 leading-relaxed line-clamp-2">Complete rendering of the historical landscape of Season {season}. Explore every legend ever built.</p>
                           <button 
                             onClick={() => {
                               if (link) {
                                 window.open(link, '_blank');
                                 addToast(`Membuka berkas Map Season ${season}...`, "success");
                               } else {
                                 addToast(`Link belum tersedia untuk Season ${season}`, "error");
                               }
                             }} 
                             className={cn(
                               "w-full py-3 text-[10px] font-black tracking-[2px] rounded-xl transition-all border",
                               link ? "btn-fantasy" : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                             )}
                           >
                             {link ? 'DOWNLOAD ARCHIVE' : 'NOT YET AVAILABLE'}
                           </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activePage === 'support' && (
              <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="support" />
                <div className="mb-12"><h2 className="text-h2 mb-4 moving-title">General Support</h2><p className="text-text-dim text-lg font-light">Our administrative team is here to assist you with any inquiries.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="rpg-card space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[3px] text-accent">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-xs text-text-dim"><MessageSquare size={16} /> help@eternalsmp.com</div>
                      <div className="flex items-center gap-4 text-xs text-text-dim"><Users size={16} /> Official Staff Team</div>
                    </div>
                  </div>
                  <div className="rpg-card space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[3px] text-accent">Support Categories</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'Connection Issues', id: 'support-connection' },
                        { label: 'Pembelian Item', id: 'support-billing' },
                        { label: 'Account Support', id: 'support-account' },
                        { label: 'Texture Packs & Mods', id: 'support-texture' }
                      ].map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setActivePage(item.id)}
                          className="p-4 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-black transition-all cursor-pointer border border-white/5 hover:border-transparent flex items-center justify-between group"
                        >
                          {item.label}
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'support-connection' && (
              <motion.div key="support-connection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="support-connection" />
                <div className="mb-12">
                   <button onClick={() => setActivePage('support')} className="text-accent text-[10px] font-black uppercase tracking-[2px] mb-4 flex items-center gap-2 hover:translate-x-[-4px] transition-all">← Back to Hub</button>
                   <h2 className="text-h2 mb-4 moving-title">Connection Issues</h2>
                   <p className="text-text-dim text-lg font-light">Diagnostic protocols for re-establishing your link to the realm.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="rpg-card p-8 space-y-4 col-span-2">
                    <h3 className="text-h3 font-serif">Restoration Protocol</h3>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 text-accent font-black">01</div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold">Synchronize IP Address</div>
                          <p className="text-xs text-text-dim">Ensure your terminal is connected to the official gateway: `play.eternalsmp.com`</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 text-accent font-black">02</div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold">Bypass Firewalls</div>
                          <p className="text-xs text-text-dim">Add an exception for Minecraft on port 25565 in your local defensive barriers.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 text-accent font-black">03</div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold">Flush DNS Cache</div>
                          <p className="text-xs text-text-dim">Use `ipconfig /flushdns` in your local command console to purge stale routing data.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rpg-card p-8 bg-accent/5 border-accent/20 flex flex-col items-center justify-center text-center space-y-6">
                    <RefreshCw size={40} className="text-accent animate-spin-slow" />
                    <div className="space-y-2">
                      <div className="text-xs font-black uppercase tracking-[3px] text-accent">Gateway Status</div>
                      <p className="text-[10px] text-text-dim leading-relaxed">External connections are currently STABLE across all known nodes.</p>
                    </div>
                    <button className="btn-fantasy w-full text-[9px] py-3">RUN DIAGNOSTICS</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'support-billing' && (
              <motion.div key="support-billing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="support-billing" />
                <div className="mb-12">
                   <button onClick={() => setActivePage('support')} className="text-accent text-[10px] font-black uppercase tracking-[2px] mb-4 flex items-center gap-2 hover:translate-x-[-4px] transition-all">← Back to Hub</button>
                   <h2 className="text-h2 mb-4 moving-title">Pembelian Item</h2>
                   <p className="text-text-dim text-lg font-light">Ethereal marketplace for all your realm progression needs.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="rpg-card p-8 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[3px] text-accent">Official Terminal</h3>
                    <div className="space-y-6">
                       <p className="text-xs text-text-dim leading-relaxed">Secure your ranks and rare items through our approved contribution link. Automated delivery is processed immediately upon successful transfer.</p>
                       <a 
                         href="https://lynk.id/eternalsmp" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="btn-fantasy w-full flex items-center justify-center gap-3"
                       >
                         <ExternalLink size={16} /> GO TO MARKETPLACE
                       </a>
                    </div>
                  </div>
                  <div className="rpg-card p-8 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[3px] text-accent">Contribution Support</h3>
                    <div className="space-y-4">
                       <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                          <div className="flex justify-between items-center"><span className="text-[10px] text-text-dim uppercase font-bold">Verification Note</span><CheckCircle2 size={16} className="text-green-500" /></div>
                          <p className="text-[9px] text-text-dim italic">"If items do not manifest within 15 mins, contact our council via Discord support."</p>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'support-account' && (
              <motion.div key="support-account" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="support-account" />
                <div className="mb-12">
                   <button onClick={() => setActivePage('support')} className="text-accent text-[10px] font-black uppercase tracking-[2px] mb-4 flex items-center gap-2 hover:translate-x-[-4px] transition-all">← Back to Hub</button>
                   <h2 className="text-h2 mb-4 moving-title">Account Support</h2>
                   <p className="text-text-dim text-lg font-light">Fortifying your identity and connecting with the EternalSMP social network.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="rpg-card p-8 md:col-span-2 space-y-6">
                      <h3 className="text-h3 font-serif">Official Channels</h3>
                      <div className="space-y-6">
                         <p className="text-sm text-text-dim">Connect with our administrative teams and stay updated across all social platforms.</p>
                         <a 
                           href="https://linktr.ee/eternalsmpserver" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="btn-fantasy w-full flex items-center justify-center gap-3"
                         >
                           <MessageSquare size={16} /> ALL SOCIAL MEDIA & SUPPORT
                         </a>
                      </div>
                   </div>
                   <div className="rpg-card p-8 border-accent/20 bg-accent/5 space-y-6">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center"><Users className="text-accent" /></div>
                      <h3 className="text-xs font-black uppercase tracking-[3px] text-accent">Community Reach</h3>
                      <p className="text-[10px] text-text-dim leading-relaxed">Join thousands of other players. Our Linktree contains all valid portals to our multi-dimensional social presence.</p>
                   </div>
                </div>
              </motion.div>
            )}

            {activePage === 'support-texture' && (
              <motion.div key="support-texture" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="support-texture" />
                <div className="mb-12">
                   <button onClick={() => setActivePage('support')} className="text-accent text-[10px] font-black uppercase tracking-[2px] mb-4 flex items-center gap-2 hover:translate-x-[-4px] transition-all">← Back to Hub</button>
                   <h2 className="text-h2 mb-4 moving-title">Texture Packs & Mods</h2>
                   <p className="text-text-dim text-lg font-light">Official repositories for enhancing your visual and mechanical experience.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { name: 'MODRINTH', url: 'https://modrinth.com/', icon: Activity, desc: 'Modern high-performance mod hosting.' },
                     { name: 'CURSEFORGE', url: 'https://www.curseforge.com/', icon: Sword, desc: 'The classic repository for all add-ons.' },
                     { name: 'MCPEDL', url: 'https://mcpedl.com/', icon: Map, desc: 'Universal portal for bedrock enhancements.' }
                   ].map((platform) => (
                     <a 
                       key={platform.name}
                       href={platform.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="rpg-card p-6 flex flex-col items-center text-center space-y-4 hover:border-accent transition-all group"
                     >
                       <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                         <platform.icon size={24} />
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-[3px] text-white">{platform.name}</h4>
                          <p className="text-[10px] text-text-dim leading-relaxed">{platform.desc}</p>
                       </div>
                       <div className="text-[8px] font-black text-accent uppercase tracking-widest flex items-center gap-1">
                         VISIT PORTAL <ExternalLink size={10} />
                       </div>
                     </a>
                   ))}
                </div>
              </motion.div>
            )}

            {activePage === 'discord-support' && (
              <motion.div key="discord-support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="discord-support" />
                <div className="mb-12"><h2 className="text-h2 mb-4 moving-title">Discord Support</h2><p className="text-text-dim text-lg font-light">Join our vibrant community for instant help and collaboration.</p></div>
                <div className="rpg-card text-center p-12 space-y-8">
                  <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare size={40} className="text-accent" /></div>
                  <h3 className="text-h3 font-serif">Community Discord Server</h3>
                  <p className="text-text-dim max-w-md mx-auto">Get real-time updates, participate in events, and chat with fellow legends on our official Discord server.</p>
                  <button 
                    onClick={() => window.open('https://discord.gg/YCGvq8W3Bp', '_blank')}
                    className="btn-fantasy px-12 py-4"
                  >
                    JOIN DISCORD CHANNEL
                  </button>
                </div>
              </motion.div>
            )}

            {activePage === 'bugs' && (
              <motion.div key="bugs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="bugs" />
                <div className="mb-12"><h2 className="text-h2 mb-4 moving-title">Bug Registry</h2><p className="text-text-dim text-lg font-light">Report inconsistencies to help us maintain the realm's integrity.</p></div>
                <div className="rpg-card fantasy-border p-8">
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-[2px] text-accent">Type of Flaw</label><select className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs outline-none"><option>Gameplay Bug</option><option>Visual Artifact</option><option>Server Issue</option><option>Other</option></select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-[2px] text-accent">Severity</label><select className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs outline-none"><option>Critical</option><option>Moderate</option><option>Low</option></select></div>
                     </div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-[2px] text-accent">Description of Event</label><textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs outline-none" rows={4} placeholder="How did the flaw manifest?"></textarea></div>
                     <button className="btn-fantasy w-full">SUBMIT BUG REPORT</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'apply' && (
              <motion.div key="apply" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="page-container">
                <PageBackground page="apply" />
                <div className="mb-12"><h2 className="text-h2 mb-4 moving-title">Staff Applications</h2><p className="text-text-dim text-lg font-light">Ascend the ranks and serve the EternalSMP community.</p></div>
                <div className="rpg-card overflow-hidden">
                   <div className="p-8 bg-accent/5 border-b border-border flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-[3px] text-accent">Open Positions</h3><div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full border border-green-500/20 uppercase tracking-widest">Recruiting</div></div>
                   <div className="p-8 space-y-6">
                      {['Trial Moderator', 'Creative Builder', 'Lore Writer', 'Technical Staff'].map((role, i) => (
                        <div key={role} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-accent/30 transition-all">
                           <div><div className="text-sm font-bold text-white mb-1">{role}</div><div className="text-[10px] text-text-dim uppercase tracking-widest">Status: Open</div></div>
                           <button 
                             onClick={() => addToast(`Mengajukan lamaran sebagai ${role}...`, "success")}
                             className="px-6 py-2 bg-accent-dim hover:bg-accent text-accent hover:text-black font-bold text-[9px] uppercase tracking-widest rounded-lg transition-all border border-accent-muted"
                           >
                             APPLY NOW
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {activePage === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="page-container"
              >
                <PageBackground page="info" />
                <div className="mb-12">
                  <h2 className="text-h2 mb-4 moving-title">Info System: Feeloria</h2>
                  <p className="text-text-dim text-lg max-w-2xl font-light">Comprehensive guide to the systems and hierarchy of the Feeloria realm.</p>
                </div>
                
                <div className="content-grid">
                  <div className="main-content">
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                      className="rpg-card fantasy-border p-6 md:p-12"
                    >
                      <h3 className="text-h3 mb-6 md:mb-10 text-accent flex items-center gap-3 md:gap-4 font-serif">
                        <Users size={24} className="md:w-8 md:h-8" /> Gameplay System
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:gap-8">
                        <motion.div 
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          custom={1}
                          className="glass-panel p-5 md:p-8 rounded-xl md:rounded-2xl border-l-4 border-gold bg-white/[0.02]"
                        >
                          <h4 className="font-serif font-black text-gold mb-3 md:mb-4 text-base md:text-lg tracking-widest uppercase">E. Player's Stats</h4>
                          <ul className="list-disc list-inside text-text-dim space-y-2 md:space-y-3 text-sm md:text-base leading-relaxed font-light">
                            <li>Vitality, Strength, Endurance, Agility, Gathering, Mastery</li>
                            <li>Stats Level → requirement for equipment</li>
                            <li>Stats Point → from leveling & quest</li>
                          </ul>
                        </motion.div>
                        <motion.div 
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          custom={2}
                          className="glass-panel p-5 md:p-8 rounded-xl md:rounded-2xl border-l-4 border-gold bg-white/[0.02]"
                        >
                          <h4 className="font-serif font-black text-gold mb-3 md:mb-4 text-base md:text-lg tracking-widest uppercase">F. Adventure Leveling System</h4>
                          <ul className="list-disc list-inside text-text-dim space-y-2 md:space-y-3 text-sm md:text-base leading-relaxed font-light">
                            <li>Adventure Level → main progression</li>
                            <li>Adventure XP → from: Quest, Farming, Mining, Killing mobs, Events</li>
                          </ul>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="page-container"
              >
                <PageBackground page="ai" />
                <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <h2 className="text-h2 mb-4 moving-title">ETER AI ASSISTANT</h2>
                    <p className="text-text-dim text-lg max-w-2xl font-light">Asisten cerdas untuk membantu berbagai kebutuhan Anda secara cepat dan akurat.</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <motion.button 
                      whileHover={{ 
                        scale: 1.05, 
                        backgroundColor: "rgba(255, 77, 77, 0.2)",
                        borderColor: "rgba(255, 77, 77, 0.4)",
                        boxShadow: "0 0 20px rgba(255, 77, 77, 0.2)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat percakapan?")) {
                          clearChat();
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-crimson/10 text-crimson border border-crimson/20 rounded-xl text-[10px] font-black uppercase tracking-[3px] transition-all backdrop-blur-md"
                    >
                      <Trash2 size={16} />
                      HAPUS RIWAYAT
                    </motion.button>
                    <div className="text-[9px] uppercase tracking-widest text-text-dim/60 font-bold">
                      Otomatis menyimpan {MAX_AI_HISTORY} pesan terakhir
                    </div>
                  </div>
                </div>

                <div className="content-grid">
                  <div className="main-content">
                    <div className="rpg-card flex flex-col h-[500px] md:h-[600px] p-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">
                        {aiHistory.map((chat, i) => (
                          <div key={`chat-bubble-${i}-${chat.role}`} className={cn("flex flex-col gap-2", chat.role === 'user' ? "items-end" : "items-start")}>
                            <div className={cn(
                              "max-w-[90%] md:max-w-[85%] px-4 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm shadow-lg group relative",
                              chat.role === 'user' ? "bg-accent text-black font-medium" : "bg-white/5 border border-white/10 text-text-main"
                            )}>
                              <div className="prose-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{chat.content}</ReactMarkdown>
                              </div>
                              {chat.role === 'ai' && chat.content && (
                                <motion.button 
                                  whileHover={{ scale: 1.2, color: "#DDA0DD" }}
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => copyToClipboard(chat.content, i)}
                                  className="absolute -right-2 -bottom-2 p-1.5 bg-surface border border-white/10 rounded-lg text-text-dim hover:text-accent opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                                  title="Copy response"
                                >
                                  {copiedId === i ? <Check size={12} /> : <Copy size={12} />}
                                </motion.button>
                              )}
                            </div>
                          </div>
                        ))}
                        {isAiLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex gap-1.5">
                              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="p-4 md:p-6 border-t border-border bg-black/20">
                        <div className="flex gap-3 md:gap-4">
                          <input 
                            type="text" 
                            placeholder="Ask the Oracle..."
                            value={aiMessage}
                            onChange={(e) => setAiMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm focus:border-accent-glow outline-none transition-all"
                          />
                          <motion.button 
                            variants={BUTTON_VARIANTS}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => handleAiChat()}
                            disabled={isAiLoading}
                            className="btn-fantasy px-6 md:px-8"
                          >
                            <Send size={18} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="side-content">
                    <div className="rpg-card">
                      <h3 className="text-xs uppercase tracking-[3px] mb-6 text-accent font-bold">Topik Bantuan</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-accent/30 transition-all cursor-pointer" onClick={() => handleAiChat("Apa itu EternalSMP?")}>
                          <div className="text-xs font-bold text-accent mb-1">Tentang Server</div>
                          <div className="text-[10px] text-text-dim">Pelajari lebih lanjut tentang komunitas EternalSMP.</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-accent/30 transition-all cursor-pointer" onClick={() => handleAiChat("Berikan tips produktivitas hari ini")}>
                          <div className="text-xs font-bold text-accent mb-1">Tips Umum</div>
                          <div className="text-[10px] text-text-dim">Dapatkan saran praktis untuk keseharian Anda.</div>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </motion.div>
            )}

            {activePage === 'profiles' && (
              <motion.div
                key="profiles"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="page-container"
              >
                <PageBackground page="profiles" />
                <div className="mb-12">
                   <h2 className="text-h2 mb-4 moving-title">PLAYER PROFILES</h2>
                   <p className="text-text-dim text-lg font-light">Daftar pemain resmi EternalSMP Season 15.</p>
                </div>

                <div className="mb-12 relative max-w-md">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search legend name..." 
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-accent transition-all text-sm font-bold tracking-widest backdrop-blur-md"
                  />
                  {playerSearch && (
                    <button 
                      onClick={() => setPlayerSearch("")}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                  <AnimatePresence>
                    {filteredProfiles.map((player, idx) => (
                      <motion.div
                         key={`profile-${player}-${idx}`}
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         whileHover={{ 
                           y: -10, 
                           scale: 1.05,
                           borderColor: "var(--color-accent)",
                           boxShadow: "0 0 20px var(--color-accent-glow)"
                         }}
                         className="rpg-card p-6 flex flex-col items-center gap-6 group transition-all relative overflow-hidden"
                      >
                         <div className="absolute top-0 left-0 w-full h-1 bg-accent/20 group-hover:bg-accent transition-colors" />
                         
                         <div className="relative w-24 h-32 md:w-32 md:h-40 flex items-center justify-center p-2">
                            <div className="absolute inset-0 bg-accent-dim rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <img 
                              src={`https://mc-heads.net/body/${(player === "QueennnzMe" ? "Marcellnw" : player).replace(/\s+/g, '_')}/right`} 
                              alt={player}
                              className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://mc-heads.net/body/MHF_Steve/right`;
                              }}
                            />
                            
                            {/* Decorative elements */}
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 border-b-2 border-r-2 border-accent/20 group-hover:border-accent transition-colors rounded-br-lg" />
                         </div>

                         <div className="text-center w-full">
                            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[3px] text-accent mb-1 truncate px-2">{player}</h4>
                            <div className="flex justify-center mb-3">
                               <motion.div 
                                 whileHover={{ scale: 1.1, rotate: 5 }}
                                 className="w-10 h-10 rounded-full border-2 border-accent/40 overflow-hidden bg-black/40 p-0.5 shadow-[0_0_15px_rgba(221,160,221,0.2)] shadow-accent/10"
                               >
                                  <img 
                                    src={`https://mc-heads.net/head/${(player === "QueennnzMe" ? "Marcellnw" : player).replace(/\s+/g, '_')}/64`} 
                                    alt={`${player} head`}
                                    className="w-full h-full rounded-full object-contain"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/MHF_Steve/64`;
                                    }}
                                  />
                               </motion.div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                               <span className="text-[8px] text-text-dim font-black uppercase tracking-[2px]">MEMBER</span>
                            </div>
                         </div>
                         
                         {/* Hover info badge */}
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="px-2 py-1 bg-accent text-black text-[7px] font-black rounded-sm uppercase tracking-widest">LEGEND</div>
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {filteredProfiles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Search size={48} className="text-text-dim mb-4" />
                    <h3 className="text-h3 font-serif uppercase tracking-widest">No Legend Found</h3>
                    <p className="text-xs uppercase tracking-widest">Seeker, try another name in the archives.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activePage === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="page-container"
              >
                <PageBackground page="gallery" />
                <div className="mb-16 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 px-6 md:px-12">
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-3">
                       <span className="w-12 h-[1px] bg-accent/30"></span>
                       <span className="text-[10px] uppercase font-bold tracking-[8px] text-accent">Chronosphere Archives</span>
                    </div>
                    <h2 className="text-4xl md:text-7xl mb-4 font-serif font-black uppercase tracking-tighter leading-[0.9] text-shimmer-float">
                      ALBUM <span className="underline decoration-accent/30 decoration-8 underline-offset-[-2px]">ETERNALSMP</span>
                    </h2>
                    <p className="text-text-dim text-sm md:text-base font-light leading-relaxed max-w-xl font-sans">
                      3,000 legendary images preserved for eternity. Navigate through the sectors of time and space in our most advanced visual terminal.
                    </p>
                  </div>
                  
                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                      <input 
                        type="file" 
                        ref={galleryFileRef}
                        onChange={handleGalleryUpload}
                        className="hidden" 
                        accept="image/*"
                      />
                      <div className="relative group flex-1 md:w-80">
                        <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", isAiSearching ? "text-accent animate-pulse" : "text-text-dim group-focus-within:text-accent")} size={16} />
                        <input 
                          type="text" 
                          placeholder="Ask AI to find memories..."
                          className="w-full pl-12 pr-12 py-4 bg-surface border border-white/5 rounded-xl text-xs focus:border-accent-glow outline-none transition-all font-bold tracking-widest placeholder:text-white/10"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleAiGallerySearch(e.target.value);
                          }}
                        />
                        {isAiSearching && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                            <div className="w-1 h-1 bg-accent rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        )}
                      </div>

                      {aiKeywords.length > 0 && searchQuery.length >= 3 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-wrap gap-2 mt-2 px-2"
                        >
                          <span className="text-[8px] font-black text-accent uppercase tracking-widest mt-1.5 mr-1">AI Keywords:</span>
                          {aiKeywords.map((kw, i) => (
                            <motion.span 
                              key={i}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="px-2 py-1 bg-accent/10 border border-accent/20 rounded-md text-[9px] text-accent font-bold uppercase tracking-wider"
                            >
                              {kw}
                            </motion.span>
                          ))}
                        </motion.div>
                      )}
                      
                      <div className="flex gap-2">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => galleryFileRef.current?.click()}
                          className={cn(
                            "py-4 px-6 rounded-xl border flex items-center justify-center gap-3 transition-all",
                            pendingGalleryFile 
                              ? "bg-surface border-white/20 text-white" 
                              : "btn-fantasy border-accent-glow shadow-[0_0_30px_rgba(221,160,221,0.15)]"
                          )}
                        >
                          <Plus size={18} />
                          <span className="text-[10px] font-black tracking-[4px] uppercase">
                            {pendingGalleryFile ? 'CHANGE FILE' : 'UPLOAD DATA'}
                          </span>
                        </motion.button>

                        {pendingGalleryFile && (
                          <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={executeGalleryUpload}
                            disabled={isUploadingGallery}
                            className="bg-green-500 hover:bg-green-600 text-black py-4 px-8 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.3)] disabled:opacity-50"
                          >
                            {isUploadingGallery ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                            <span className="text-[10px] font-black tracking-[4px] uppercase">KIRIM</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                </div>

                {/* Categories Filter */}
                <div className="flex flex-wrap gap-2 mb-20 px-6 md:px-12 items-center">
                  <Filter size={14} className="text-accent mr-3" />
                  {['All', 'PIXEL ART', 'MINECRAFT PIXEL', 'FANTASY PIXEL', 'RETRO GAMING'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCurrentGalleryCategory(cat)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                        currentGalleryCategory === cat 
                          ? "bg-accent text-black border-accent shadow-lg shadow-accent/20" 
                          : "bg-surface text-text-dim border-white/5 hover:border-accent-muted"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-3">
                     <span className="text-[9px] font-bold text-text-dim uppercase tracking-[3px]">Indexing:</span>
                     <span className="text-[10px] font-black text-accent">{filteredImages.length} OF {ALL_GALLERY_IMAGES.length}</span>
                  </div>
                </div>

                {/* Vertical Stacking of Gallery Sections */}
                <div className="space-y-0">
                  {Array.from({ length: TOTAL_SECTIONS }).map((_, i) => {
                    const sectionImages = filteredImages.filter(img => img.section === i + 1);
                    if (sectionImages.length === 0) return null;
                    return (
                      <GallerySection 
                        key={`gallery-section-${i + 1}`} 
                        sectionNum={i + 1} 
                        images={sectionImages} 
                        onPreview={setSelectedPreviewImage}
                        variant={i === 0 ? 'marquee' : 'grid'}
                      />
                    );
                  })}
                </div>

                {/* Footer Gallery Info */}
                <div className="mt-20 py-32 border-t border-white/5 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-accent/50 to-transparent"></div>
                   <h3 className="text-accent text-[11px] font-black uppercase tracking-[15px] mb-10 opacity-30">Archive Deep Level reached</h3>
                   <div className="flex justify-center items-center gap-8 opacity-20 hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center">
                         <span className="text-2xl font-serif font-black">{ALL_GALLERY_IMAGES.length.toLocaleString()}</span>
                         <span className="text-[8px] uppercase tracking-widest font-sans font-bold opacity-60">Images</span>
                      </div>
                      <div className="flex flex-col items-center">
                         <span className="text-2xl font-serif font-black">{TOTAL_SECTIONS < 10 ? `0${TOTAL_SECTIONS}` : TOTAL_SECTIONS}</span>
                         <span className="text-[8px] uppercase tracking-widest font-sans font-bold opacity-60">Sectors</span>
                      </div>
                      <div className="flex flex-col items-center">
                         <span className="text-2xl font-serif font-black">∞</span>
                         <span className="text-[8px] uppercase tracking-widest font-sans font-bold opacity-60">Feeloria</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedPreviewImage && (
              <ImageModal 
                image={selectedPreviewImage} 
                onClose={() => setSelectedPreviewImage(null)} 
              />
            )}
          </AnimatePresence>

          {/* Footer */}
          <footer className="mt-auto py-12 px-4 border-t border-border bg-black/40 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <motion.img 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    src="https://github.com/marcellnw/paneleternalsmp/blob/main/1775664361126.png?raw=true" 
                    alt="Logo" 
                    className="w-8 h-8"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-serif text-lg tracking-[2px] text-accent font-bold uppercase">ETERNALSMP</span>
                </div>
                <p className="text-text-dim text-xs leading-relaxed max-w-xs">
                  The ultimate administration portal for the Feeloria realm. Managing legends, one tick at a time.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Resources</h4>
                  <ul className="space-y-2 text-[10px] text-text-dim">
                    <li className="hover:text-accent cursor-pointer transition-colors">Documentation</li>
                    <li className="hover:text-accent cursor-pointer transition-colors">Server Rules</li>
                    <li className="hover:text-accent cursor-pointer transition-colors">Map Archive</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Support</h4>
                  <ul className="space-y-2 text-[10px] text-text-dim">
                    <li 
                      onClick={() => window.open('https://discord.gg/YCGvq8W3Bp', '_blank')}
                      className="hover:text-accent cursor-pointer transition-colors"
                    >
                      Discord Support
                    </li>
                    <li className="hover:text-accent cursor-pointer transition-colors">Bug Report</li>
                    <li className="hover:text-accent cursor-pointer transition-colors">Staff Application</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">System Status</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-text-dim">All systems operational</span>
                </div>
                <div className="text-[9px] text-white/20 font-mono">
                  &copy; 2024 EternalSMP. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "toast-item",
                toast.type === 'error' ? 'border-crimson' : 'border-accent'
              )}
            >
              {toast.type === 'error' ? <AlertCircle className="text-crimson" size={20} /> : <CheckCircle2 className="text-accent" size={20} />}
              <span className="text-xs font-bold tracking-wide">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="modal-content max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowReportModal(false)} 
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all text-text-dim hover:text-accent group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform" />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-accent-dim rounded-2xl text-accent shadow-[0_0_20px_rgba(221,160,221,0.2)]">
                  <Activity size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif text-accent font-black uppercase tracking-widest">System Report</h2>
                  <p className="text-[10px] text-text-dim font-bold tracking-[2px] uppercase">Generated on {new Date().toLocaleDateString()} • v2.5.0</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent/30 transition-all">
                    <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Accepted Players</div>
                    <div className="text-2xl font-serif text-white">{ACCEPTED_PLAYERS.length}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent/30 transition-all">
                    <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Server Uptime</div>
                    <div className="text-2xl font-serif text-white">99.9%</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent/30 transition-all col-span-2 md:col-span-1">
                    <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Stability Index</div>
                    <div className="text-2xl font-serif text-green-400">EXCELLENT</div>
                  </div>
                </div>

                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Resource Analytics</h4>
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[8px] font-bold rounded uppercase tracking-tighter">Healthy</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold tracking-widest">
                        <span>CPU PERFORMANCE</span>
                        <span className="text-accent">OPTIMAL</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-[85%] shadow-[0_0_10px_rgba(221,160,221,0.5)]"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold tracking-widest">
                        <span>MEMORY ALLOCATION</span>
                        <span className="text-accent">4.2GB / 16GB</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-[35%] shadow-[0_0_10px_rgba(221,160,221,0.5)]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-crimson/5 rounded-xl border border-crimson/10 text-[10px] text-crimson/80 italic text-center">
                  "This report is an automated diagnostic of the EternalSMP infrastructure."
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <motion.button 
                  variants={BUTTON_VARIANTS}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowReportModal(false)} 
                  className="btn-fantasy flex-1 py-4 text-xs font-bold tracking-[3px]"
                >
                  CLOSE DIAGNOSTICS
                </motion.button>
                <motion.button 
                  variants={BUTTON_VARIANTS}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={sendReportToDiscord}
                  className="btn-fantasy-outline flex-1 py-4 text-xs font-bold tracking-[3px] flex items-center justify-center gap-2"
                >
                  <Send size={16} /> KIRIM KE DISCORD
                </motion.button>
                <motion.button 
                  variants={BUTTON_VARIANTS}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={sendReportToDiscord}
                  disabled={isExporting}
                  className="btn-fantasy flex-1 py-4 text-xs font-bold tracking-[3px] flex items-center justify-center gap-2"
                >
                  <Send size={16} /> {isExporting ? "MENGIRIM..." : "KIRIM DIAGNOSTIK"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-20 md:bottom-10 right-6 p-4 bg-accent text-black rounded-2xl shadow-2xl z-[150] hover:scale-110 active:scale-95 transition-all"
            >
              <Plus className="rotate-45" size={24} />
            </motion.button>
          )}
        </AnimatePresence>
      </AnimatePresence>

      {/* Hidden professional report for PDF/Print */}
      <div className="absolute -left-[9999px] top-0 print:static print:left-0 print:block">
        <div 
          ref={reportRef}
          className="bg-white p-12 text-black w-[210mm] min-h-[297mm] shadow-none flex flex-col gap-8"
          id="printable-report"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#DDA0DD] pb-6">
            <div className="flex items-center gap-4">
               <img 
                 src="https://github.com/marcellnw/paneleternalsmp/blob/main/1775664361126.png?raw=true" 
                 alt="Logo" 
                 className="w-16 h-16"
                 referrerPolicy="no-referrer"
               />
               <div>
                  <h1 className="text-3xl font-serif text-black uppercase tracking-widest font-black">EternalSMP</h1>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-[2px]">Official System Report</p>
               </div>
            </div>
            <div className="text-right">
               <div className="text-xs font-bold text-gray-400 uppercase">Document ID</div>
               <div className="text-lg font-serif">#RP-{new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6">
             <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Total Players</div>
                <div className="text-3xl font-serif">{ACCEPTED_PLAYERS.length}</div>
             </div>
             <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Server Uptime</div>
                <div className="text-3xl font-serif">99.9%</div>
             </div>
             <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Performance</div>
                <div className="text-3xl font-serif text-green-600">STABLE</div>
             </div>
          </div>

          {/* Resource Analytics */}
          <div className="space-y-6 flex-1">
             <h2 className="text-xl font-serif border-b border-gray-200 pb-2 uppercase tracking-widest text-[#DDA0DD]">Resource Analytics</h2>
             <div className="space-y-6">
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold uppercase">
                      <span>CPU Performance</span>
                      <span>85% (Optimal)</span>
                   </div>
                   <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-[#DDA0DD] w-[85%]"></div>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold uppercase">
                      <span>Memory Allocation</span>
                      <span>4.2GB / 16GB</span>
                   </div>
                   <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-[#DDA0DD] w-[35%]"></div>
                   </div>
                </div>
             </div>

             <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-600 text-sm leading-relaxed">
                "This document summarizes the server's operational status over the last collection cycle. Average TPS remained at a stable 19.8, with zero critical interruptions recorded. System integrity is verified as nominal. All node parameters are within the expected security compliance envelope."
             </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
             <div>Generated on {new Date().toLocaleString()}</div>
             <div>EternalSMP Management Panel • v2.5.0-STABLE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
