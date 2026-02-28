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
  user?: any;
  referralCode?: string | null;
  isDarkMode: boolean;
  onThemeToggle: () => void;
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

const BrainIcon = () => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7">
    <path d="m491.9 288.1c48.1-57 2.4-117.4-63.7-177.5-7.8 27.4-29.8 48.4-57.5 55-5.2-.1-9.4-4.3-9.4-9.6 0-4.1 2.7-7.7 6.6-8.9 23.1-7 40.2-26.4 44.3-50.1-25.6-22-55.3-38.6-87.4-49.1-27.7 24.3-58.2 61.8-31.9 113.3 2.4 4.6.7 10.3-4 12.8-4.5 2.4-10.1.7-12.6-3.7-28.9-56.1-2.7-97 26.8-128.2-60.8-11.6-123.8-1.4-177.9 28.7 22.4 1.2 43.5 11.1 58.8 27.5 3.8 3.6 3.9 9.6.2 13.4-3.6 3.8-9.6 3.9-13.4.2 0 0-.1-.1-.1-.1-37.7-40.2-94.2-20.6-117.1 24.2-30.5 54.7-5.9 84.6 33.9 91.8 5.2.7 8.8 5.5 8 10.7-.7 5.1-5.5 8.7-10.6 8-1.7-.2-41.6-6.1-57.6-37.4-1.4-2.7-2.6-5.5-3.5-8.4-33.4 42.3-31.2 75.3 5.5 113.8 10.2 11.4 25.8 16.3 40.6 12.6 29.8-7.5 70.1-24.2 78.4-45.7 7.6-18.9-8.8-20.8 3.6-31.5 16.2-7.3 21.3 20.4 14.2 38.1-6.5 18.3-31.7 36-53.9 44.6 5.1 16.1 15.9 29.7 30.3 38.5 30 18.6 70.1 14.8 87.1 10.2 4.6-1.3 9.6-.2 13.3 2.9 11.3 9.7 24.7 16.5 39.2 19.9 6.2 1.1 11.7 4.5 15.4 9.6l39.5 56.7c1.8 2.5 4.7 4.1 7.8 4.1h33.1c5.2 0 9.5-4.2 9.5-9.5v-38.6c79.3-18.8 131.1-56.1 102.8-127.2-1.8-3.7-1.1-8.1 1.7-11.1zm-91.9-64.5 38.6-8.8c5.1-1.1 10.2 2.2 11.2 7.3 1.1 5-2 9.9-7 11.2l-38.6 8.8c-.7.2-1.4.2-2.1.2-5.2-.1-9.4-4.3-9.4-9.6.1-4.4 3.1-8.1 7.3-9.1zm-73.5 49.4c10-18.4 19.8-58.1-10-70.6-4.7-2.3-6.7-8-4.4-12.7 11.8-17.8 39.8 16.5 41.2 28.4 6.7 23.3-3.1 49.5-9.6 62.8 21.3 14.7 36.8 36.2 44.2 60.9 1.8 4.9-.8 10.4-5.7 12.2s-10.4-.8-12.2-5.7v-.1c-24.7-74.3-84.8-67.3-122.4-44.7-4.5 2.7-10.3 1.3-13.1-3.2-2.6-4.3-1.3-10 2.8-12.8 2-1.1 45.9-28.6 89.2-14.5zm-169.6-75.4c-9.5-1-39.1-.9-34.7-17.5 1.7-4.9 7.1-7.5 12-5.8 24.3 11.3 53.1.7 64.4-23.6 1.1-2.5 2.1-5 2.8-7.7 1.7-5 7.1-7.7 12-6 4.8 1.6 7.5 6.6 6.2 11.5-3.4 10.1-8.8 19.4-15.7 27.5 2.1 9.2 7.1 17.4 14.3 23.4 8.3 5.6 18.5 7.6 28.2 5.3 5.2-.8 10 2.7 10.9 7.8.8 5.2-2.7 10-7.9 10.9-26.1 5.4-52.3-9.2-61.2-34.4-9.3 5.8-20.2 8.8-31.3 8.6z" fill="#7C3AED"/>
  </svg>
);

export const JoisstNavbar: React.FC<JoisstNavbarProps> = ({ onBack, onClear, onUpload, language, onLanguageChange, user, referralCode, isDarkMode, onThemeToggle }) => {
  const [isPwaActive, setIsPwaActive] = useState(false);
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

  const appendRef = (url: string) => {
    if (!referralCode) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}ref=${referralCode}`;
  };

  const returnUrl = useMemo(() => {
    const base = (typeof document !== 'undefined' && document.referrer.includes('joisst.com')) 
      ? document.referrer 
      : 'https://joisst.com';
    return appendRef(base);
  }, [referralCode]);

  const UtilityBox = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200",
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

  const CurrencyButton = ({ icon: Icon, value, color, customIcon }: { icon?: any, value: string, color: string, customIcon?: React.ReactNode }) => (
    <div
      className={cn(
        "group flex items-center gap-2 px-5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200",
        "h-10 sm:h-14",
        "hover:border-[#d90168]"
      )}
    >
      {customIcon ? customIcon : <Icon className="w-5 h-5 sm:w-7 sm:h-7 transition-colors duration-200" style={{ color }} />}
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
                href={appendRef("https://joisst.com")}
                className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 dark:text-white hover:text-[#d90168] transition-colors"
              >
                {t.moreApps}
              </a>
            </div>
          </div>

          {/* Right Cluster */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* 1. Heart Counter */}
            <div className="hidden sm:flex items-center">
              <CurrencyButton icon={Heart} value={user?.hearts?.toString() || "0"} color="#F43E5D" />
            </div>

            {/* 2. Brain Counter */}
            <div className="hidden sm:flex items-center">
              <CurrencyButton value={user?.brains?.toString() || "0"} color="#7C3AED" customIcon={<BrainIcon />} />
            </div>

            {/* 3. Language selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="group flex items-center gap-2 px-3 sm:px-4 h-10 sm:h-14 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 hover:border-[#d90168]"
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

            {/* 4. Light/Dark mode toggle */}
            <UtilityBox onClick={onThemeToggle}>
              {isDarkMode ? <Sun className="w-5 h-5 sm:w-7 sm:h-7" /> : <Moon className="w-5 h-5 sm:w-7 sm:h-7" />}
            </UtilityBox>

            {/* 5. Settings (cog icon) */}
            <UtilityBox onClick={() => window.location.href = appendRef('https://elemental.joisst.com/management#/en/management')}>
              <Settings className="w-5 h-5 sm:w-7 sm:h-7" />
            </UtilityBox>

            {/* 6. Login/Logout icon */}
            <UtilityBox onClick={() => window.location.href = appendRef('https://api.joisst.com/login')}>
              <LogOut className="w-5 h-5 sm:w-7 sm:h-7" />
            </UtilityBox>

            {/* 7. Profile icon */}
            <a 
              href={appendRef("https://api.joisst.com/dashboard")}
              className="group w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all duration-200 hover:border-[#d90168] bg-slate-100 dark:bg-slate-800 overflow-hidden"
            >
              <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-[#d90168] transition-colors" />
            </a>
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
