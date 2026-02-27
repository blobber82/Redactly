import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, 
  Moon, 
  LogOut, 
  Settings, 
  ArrowLeft, 
  PlusCircle, 
  ChevronDown,
  Heart,
  Zap,
  Trash2
} from 'lucide-react';
import { UserIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface JoisstNavbarProps {
  onBack?: () => void;
  onClear?: () => void;
  onUpload?: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

const translations: Record<string, any> = {
  English: {
    moreApps: "More free apps at joisst.com",
    install: "Install Redactly",
  },
  Español: {
    moreApps: "Más apps gratis en joisst.com",
    install: "Instalar Redactly",
  },
  Français: {
    moreApps: "Plus d'apps gratuites sur joisst.com",
    install: "Installer Redactly",
  },
  Deutsch: {
    moreApps: "Mehr kostenlose Apps auf joisst.com",
    install: "Redactly installieren",
  }
};

const JoisstIcon = () => (
  <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="256" height="256" rx="48" fill="#d90168"/>
    <path d="m136.57 197.62c0 7.11-1.53 13.23-4.7 18.26a34.47 34.47 0 0 1 -11.81 11.7 28.57 28.57 0 0 1 -14.87 4.16 7.75 7.75 0 0 1 -5.8-2.3 7.89 7.89 0 0 1 -2.19-5.44v-1.42a6.29 6.29 0 0 1 2.08-5 12 12 0 0 1 5.25-2.73 23.87 23.87 0 0 0 8.2-3.94 18.62 18.62 0 0 0 5.27-6.91 24.16 24.16 0 0 0 1.86-10.17v-103.49a8.51 8.51 0 0 1 2.41-6.13 8.17 8.17 0 0 1 6-2.51 8.07 8.07 0 0 1 6.13 2.51 8.7 8.7 0 0 1 2.29 6.13v107.28zm-8.64-131.45c-3.5 0-6.12-.66-7.76-2.08a8.16 8.16 0 0 1 -2.52-6.45v-3c0-3 .88-5.14 2.74-6.45 1.86-1.53 4.37-2.19 7.76-2.19s5.91.66 7.55 2.08 2.51 3.61 2.51 6.45v3c0 2.95-.87 5.14-2.62 6.45-1.75 1.53-4.27 2.19-7.66 2.19z" fill="#fff"/>
  </svg>
);

const UKFlag = () => (
  <svg viewBox="0 0 60 30" className="w-6 h-4 rounded-sm shrink-0">
    <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

const ESFlag = () => (
  <svg viewBox="0 0 750 500" className="w-6 h-4 rounded-sm shrink-0">
    <rect width="750" height="500" fill="#c60b1e"/>
    <rect width="750" height="250" y="125" fill="#ffc400"/>
  </svg>
);

const FRFlag = () => (
  <svg viewBox="0 0 3 2" className="w-6 h-4 rounded-sm shrink-0">
    <rect width="1" height="2" fill="#002395"/>
    <rect width="1" height="2" x="1" fill="#fff"/>
    <rect width="1" height="2" x="2" fill="#ed2939"/>
  </svg>
);

const DEFlag = () => (
  <svg viewBox="0 0 5 3" className="w-6 h-4 rounded-sm shrink-0">
    <rect width="5" height="3" y="0" fill="#000"/>
    <rect width="5" height="2" y="1" fill="#d00"/>
    <rect width="5" height="1" y="2" fill="#ffce00"/>
  </svg>
);

export const JoisstNavbar: React.FC<JoisstNavbarProps> = ({ onBack, onClear, onUpload, language, onLanguageChange }) => {
  const [isPwaActive, setIsPwaActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = translations[language] || translations.English;

  const languages = [
    { name: 'English', flag: <UKFlag /> },
    { name: 'Español', flag: <ESFlag /> },
    { name: 'Français', flag: <FRFlag /> },
    { name: 'Deutsch', flag: <DEFlag /> },
  ];

  const currentFlag = useMemo(() => {
    return languages.find(l => l.name === language)?.flag || <UKFlag />;
  }, [language]);

  // Joisst Pink: #d90168
  const JOISST_PINK = '#d90168';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setIsPwaActive(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const returnUrl = useMemo(() => {
    if (typeof document !== 'undefined' && document.referrer.includes('joisst.com')) {
      return document.referrer;
    }
    return 'https://joisst.com';
  }, []);

  const UtilityBox = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-center rounded-xl border border-slate-200 transition-all duration-200",
        "w-10 h-10 sm:w-14 sm:h-14",
        "bg-slate-400/5 dark:bg-slate-400/10",
        "hover:border-[#d90168]",
        className
      )}
    >
      <div className="text-slate-500 group-hover:text-[#d90168] transition-colors duration-200">
        {children}
      </div>
    </button>
  );

  const CurrencyButton = ({ icon: Icon, value, color }: { icon: any, value: string, color: string }) => (
    <div
      className={cn(
        "group flex items-center gap-2 px-5 rounded-xl border border-slate-200 transition-all duration-200",
        "h-10 sm:h-14",
        "hover:border-[#d90168]"
      )}
    >
      <Icon className="w-5 h-5 sm:w-7 sm:h-7 transition-colors duration-200" style={{ color }} />
      <span className="font-black uppercase tracking-tighter text-sm sm:text-base transition-colors duration-200" style={{ color }}>
        {value}
      </span>
    </div>
  );

  return (
    <nav className={cn(
      "sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b",
      isDarkMode ? "border-slate-800" : "border-slate-100",
      isPwaActive ? "h-24 sm:h-40" : "h-16 sm:h-28"
    )}>
      <div className="max-w-7xl mx-auto h-full px-2 sm:px-6 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          {/* Left Cluster */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a 
              href={returnUrl}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#d90168]/20"
            >
              <JoisstIcon />
            </a>
            
            <div className="hidden md:flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-slate-900 dark:text-white" />
              <a 
                href="https://joisst.com"
                className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 dark:text-white hover:text-[#d90168] transition-colors"
              >
                {t.moreApps}
              </a>
            </div>
          </div>

          {/* Right Cluster */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Currency - Hidden on mobile (<640px) */}
            <div className="hidden sm:flex items-center gap-2">
              <CurrencyButton icon={Heart} value="1.2K" color="#F43E5D" />
              <CurrencyButton icon={Zap} value="450" color="#7C3AED" />
            </div>

            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="group flex items-center gap-2 px-3 sm:px-4 h-10 sm:h-14 rounded-xl border border-slate-200 transition-all duration-200 hover:border-[#d90168]"
              >
                {currentFlag}
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-[#d90168] transition-colors" />
              </button>
              
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.name}
                        onClick={() => { onLanguageChange(lang.name); setShowLangMenu(false); }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-colors"
                      >
                        {lang.flag}
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Utilities - Hidden on mobile (<640px) */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <UtilityBox onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Sun className="w-5 h-5 sm:w-7 sm:h-7" /> : <Moon className="w-5 h-5 sm:w-7 sm:h-7" />}
              </UtilityBox>
              <UtilityBox onClick={onUpload}>
                <PlusCircle className="w-5 h-5 sm:w-7 sm:h-7" />
              </UtilityBox>
              <UtilityBox onClick={onClear}>
                <Trash2 className="w-5 h-5 sm:w-7 sm:h-7" />
              </UtilityBox>
              <UtilityBox>
                <Settings className="w-5 h-5 sm:w-7 sm:h-7" />
              </UtilityBox>
            </div>

            {/* Profile */}
            <button className="group w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-slate-200 flex items-center justify-center transition-all duration-200 hover:border-[#d90168] bg-slate-100 overflow-hidden">
              <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-[#d90168] transition-colors" />
            </button>
          </div>
        </div>

        {/* Row 2: PWA Prompt */}
        <AnimatePresence>
          {isPwaActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-3 sm:mt-5"
            >
              <button className="px-6 py-2 rounded-full bg-white/90 shadow-lg shadow-black/5 flex items-center gap-2 border border-slate-100">
                <PlusCircle className="w-4 h-4 text-[#d90168]" />
                <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.25em] text-slate-900">
                  {t.install}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};
