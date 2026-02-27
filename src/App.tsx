import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JoisstNavbar } from './components/JoisstNavbar';
import { 
  ShieldAlert, 
  Copy, 
  Download, 
  Trash2, 
  RefreshCw, 
  Check, 
  Eye, 
  EyeOff,
  Search,
  FileText,
  AlertCircle,
  Upload,
  Sparkles,
  X,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toPng } from 'html-to-image';
import { createWorker } from 'tesseract.js';
import { detectSensitiveInfoRegex, detectSensitiveInfoAI, type DetectedEntity } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RedactionState {
  [key: string]: boolean;
}

const appTranslations: Record<string, any> = {
  English: {
    sourceText: "Source Text",
    regexActive: "Regex Active",
    characters: "characters",
    placeholder: "Paste your logs, emails, or any text containing sensitive data here...",
    regexInfo: "Regex automatically scans as you type. Use AI for advanced detection (names, context).",
    aiScanning: "AI Scanning...",
    advancedAiScan: "Advanced AI Scan",
    detectedEntities: "Detected Entities",
    redactAll: "Redact All",
    undoAll: "Undo All",
    noEntities: "No entities detected yet.",
    redactedPreview: "Redacted Preview",
    copied: "Copied",
    copy: "Copy",
    downloadImage: "Download as Image",
    previewPlaceholder: "Preview will appear here.",
    hybridDetection: "Hybrid Detection",
    hybridInfo: "Redactly uses high-speed Regex for common patterns (emails, IPs) and Advanced AI for context-aware entities like names and addresses.",
    ocrEngine: "OCR Engine",
    ocrInfo: "Built-in Tesseract.js OCR allows you to extract text directly from screenshots or shared windows for instant redaction.",
    fileSupport: "File Support",
    fileInfo: "Import .txt, .log, .csv, or .json files. Perfect for anonymizing large datasets or system logs before sharing.",
    entityTypes: {
      NAME: "NAME",
      EMAIL: "EMAIL",
      PHONE: "PHONE",
      ADDRESS: "ADDRESS",
      IP_ADDRESS: "IP ADDRESS",
      CREDIT_CARD: "CREDIT CARD",
    },
    cookieTitle: "Simple Cookies (no “trackers”)",
    cookieContent: "We only use cookies to sync your hearts, brains, and preferences across the Joisst ecosystem. By clicking below, you're cool with this platform-wide synchronisation.",
    cookieButton: "Cool!"
  },
  Español: {
    sourceText: "Texto Fuente",
    regexActive: "Regex Activo",
    characters: "caracteres",
    placeholder: "Pega tus registros, correos o cualquier texto con datos sensibles aquí...",
    regexInfo: "Regex escanea automáticamente mientras escribes. Usa IA para detección avanzada (nombres, contexto).",
    aiScanning: "Escaneando con IA...",
    advancedAiScan: "Escaneo IA Avanzado",
    detectedEntities: "Entidades Detectadas",
    redactAll: "Redactar Todo",
    undoAll: "Deshacer Todo",
    noEntities: "No se detectaron entidades aún.",
    redactedPreview: "Vista Previa Redactada",
    copied: "Copiado",
    copy: "Copiar",
    downloadImage: "Descargar como Imagen",
    previewPlaceholder: "La vista previa aparecerá aquí.",
    hybridDetection: "Detección Híbrida",
    hybridInfo: "Redactly usa Regex de alta velocidad para patrones comunes (correos, IPs) e IA avanzada para entidades sensibles al contexto como nombres y direcciones.",
    ocrEngine: "Motor OCR",
    ocrInfo: "El OCR Tesseract.js integrado te permite extraer texto directamente de capturas de pantalla o ventanas compartidas.",
    fileSupport: "Soporte de Archivos",
    fileInfo: "Importa archivos .txt, .log, .csv o .json. Perfecto para anonimizar grandes conjuntos de datos o registros del sistema.",
    entityTypes: {
      NAME: "NOMBRE",
      EMAIL: "EMAIL",
      PHONE: "TELÉFONO",
      ADDRESS: "DIRECCIÓN",
      IP_ADDRESS: "DIRECCIÓN IP",
      CREDIT_CARD: "TARJETA CRÉDITO",
    },
    cookieTitle: "Cookies Simples (sin “rastreadores”)",
    cookieContent: "Solo usamos cookies para sincronizar tus corazones, cerebros y preferencias en todo el ecosistema Joisst. Al hacer clic abajo, aceptas esta sincronización en toda la plataforma.",
    cookieButton: "¡Genial!"
  },
  Français: {
    sourceText: "Texte Source",
    regexActive: "Regex Actif",
    characters: "caractères",
    placeholder: "Collez vos logs, emails ou tout texte contenant des données sensibles ici...",
    regexInfo: "Regex scanne automatiquement pendant la saisie. Utilisez l'IA pour une détection avancée (noms, contexte).",
    aiScanning: "Analyse IA...",
    advancedAiScan: "Analyse IA Avancée",
    detectedEntities: "Entités Détectées",
    redactAll: "Tout Rédiger",
    undoAll: "Tout Annuler",
    noEntities: "Aucune entité détectée pour le moment.",
    redactedPreview: "Aperçu Rédigé",
    copied: "Copié",
    copy: "Copier",
    downloadImage: "Télécharger en Image",
    previewPlaceholder: "L'aperçu apparaîtra ici.",
    hybridDetection: "Détection Hybride",
    hybridInfo: "Redactly utilise le Regex haute vitesse pour les motifs courants (emails, IPs) et l'IA avancée pour les entités contextuelles comme les noms et adresses.",
    ocrEngine: "Moteur OCR",
    ocrInfo: "L'OCR Tesseract.js intégré vous permet d'extraire du texte directement à partir de captures d'écran ou de fenêtres partagées.",
    fileSupport: "Support de Fichiers",
    fileInfo: "Importez des fichiers .txt, .log, .csv ou .json. Parfait pour anonymiser de grands ensembles de données ou des logs système.",
    entityTypes: {
      NAME: "NOM",
      EMAIL: "EMAIL",
      PHONE: "TÉLÉPHONE",
      ADDRESS: "ADRESSE",
      IP_ADDRESS: "ADRESSE IP",
      CREDIT_CARD: "CARTE CRÉDIT",
    },
    cookieTitle: "Cookies Simples (pas de “traceurs”)",
    cookieContent: "Nous utilisons uniquement des cookies pour synchroniser vos cœurs, vos cerveaux et vos préférences dans l'écosystème Joisst. En cliquant ci-dessous, vous acceptez cette synchronisation sur toute la plateforme.",
    cookieButton: "Cool !"
  },
  Deutsch: {
    sourceText: "Quelltext",
    regexActive: "Regex Aktiv",
    characters: "Zeichen",
    placeholder: "Fügen Sie hier Ihre Protokolle, E-Mails oder Texte mit sensiblen Daten ein...",
    regexInfo: "Regex scannt automatisch während der Eingabe. Nutzen Sie KI für fortgeschrittene Erkennung (Namen, Kontext).",
    aiScanning: "KI-Scan läuft...",
    advancedAiScan: "Erweiterter KI-Scan",
    detectedEntities: "Erkannte Entitäten",
    redactAll: "Alles schwärzen",
    undoAll: "Alles rückgängig",
    noEntities: "Noch keine Entitäten erkannt.",
    redactedPreview: "Geschwärzte Vorschau",
    copied: "Kopiert",
    copy: "Kopieren",
    downloadImage: "Als Bild herunterladen",
    previewPlaceholder: "Vorschau wird hier angezeigt.",
    hybridDetection: "Hybride Erkennung",
    hybridInfo: "Redactly verwendet Hochgeschwindigkeits-Regex für gängige Muster (E-Mails, IPs) und fortgeschrittene KI für kontextsensitive Entitäten wie Namen und Adressen.",
    ocrEngine: "OCR-Engine",
    ocrInfo: "Integriertes Tesseract.js OCR ermöglicht es Ihnen, Text direkt aus Screenshots oder geteilten Fenstern zu extrahieren.",
    fileSupport: "Datei-Unterstützung",
    fileInfo: "Importieren Sie .txt-, .log-, .csv- oder .json-Dateien. Perfekt zum Anonymisieren großer Datensätze oder Systemprotokolle.",
    entityTypes: {
      NAME: "NAME",
      EMAIL: "EMAIL",
      PHONE: "TELEFON",
      ADDRESS: "ADRESSE",
      IP_ADDRESS: "IP-ADRESSE",
      CREDIT_CARD: "KREDITKARTE",
    },
    cookieTitle: "Einfache Cookies (keine „Tracker“)",
    cookieContent: "Wir verwenden Cookies nur, um Ihre Herzen, Gehirne und Einstellungen im gesamten Joisst-Ökosystem zu synchronisieren. Mit einem Klick auf die Schaltfläche unten erklären Sie sich mit dieser plattformweiten Synchronisierung einverstanden.",
    cookieButton: "Cool!"
  }
};

export default function App() {
  const [language, setLanguage] = useState('English');
  const [inputText, setInputText] = useState('');
  const [entities, setEntities] = useState<DetectedEntity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [redactionState, setRedactionState] = useState<RedactionState>({});
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cookieConsent, setCookieConsent] = useState(true); // Default true to hide initially
  
  const [ocrProgress, setOcrProgress] = useState(0);

  const t = appTranslations[language] || appTranslations.English;

  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Joisst Cookie Handshake
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const res = await fetch('https://api.joisst.com/api/user', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          setCookieConsent(!!user.cookieConsent);
        } else {
          // If API fails or user not logged in, we might still want to show it if we don't know
          setCookieConsent(false);
        }
      } catch (err) {
        console.error("Handshake failed:", err);
        setCookieConsent(false);
      }
    };
    checkConsent();
  }, []);

  const acceptCookies = async () => {
    try {
      await fetch('https://api.joisst.com/api/user?action=cookie_consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ consent: true })
      });
      setCookieConsent(true);
    } catch (err) {
      console.error("Failed to update consent:", err);
      // Still hide it for UX if they clicked it
      setCookieConsent(true);
    }
  };

  // Auto-scan with Regex whenever input changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputText.trim()) {
        const regexEntities = detectSensitiveInfoRegex(inputText);
        // Merge with existing AI entities if any
        setEntities(prev => {
          const aiEntities = prev.filter(e => e.source === 'AI');
          // Filter out regex entities that might overlap or be duplicates
          const newEntities = [...aiEntities];
          regexEntities.forEach(re => {
            if (!newEntities.some(e => e.text === re.text)) {
              newEntities.push(re);
            }
          });
          return newEntities;
        });
      } else {
        setEntities([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputText]);

  // Initialize redaction state for new entities
  useEffect(() => {
    setRedactionState(prev => {
      const newState = { ...prev };
      entities.forEach(entity => {
        if (newState[entity.text] === undefined) {
          newState[entity.text] = true;
        }
      });
      return newState;
    });
  }, [entities]);

  const handleAiScan = async () => {
    if (!inputText.trim()) return;
    setIsAiAnalyzing(true);
    setError(null);
    try {
      const aiDetected = await detectSensitiveInfoAI(inputText);
      setEntities(prev => {
        const regexEntities = prev.filter(e => e.source === 'REGEX');
        const combined = [...regexEntities];
        aiDetected.forEach(ae => {
          if (!combined.some(e => e.text === ae.text)) {
            combined.push(ae);
          }
        });
        return combined;
      });
    } catch (err) {
      setError('AI Scan failed. Please try again.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    if (isImage) {
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        await performOcr(imageData);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInputText(content);
      };
      reader.readAsText(file);
    }
    // Reset input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const performOcr = async (imageData: string) => {
    setIsAnalyzing(true);
    setOcrProgress(0);
    setError(null);
    
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();
      
      setInputText(prev => (prev ? prev + "\n\n--- OCR Result ---\n" + text : text));
    } catch (err) {
      console.error("OCR Error:", err);
      setError("OCR failed to process the image.");
    } finally {
      setIsAnalyzing(false);
      setOcrProgress(0);
    }
  };

  const toggleRedaction = (text: string) => {
    setRedactionState(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  const redactAll = (status: boolean) => {
    const newState: RedactionState = {};
    entities.forEach(entity => {
      newState[entity.text] = status;
    });
    setRedactionState(newState);
  };

  const redactedText = useMemo(() => {
    let result = inputText;
    const sortedEntities = [...entities].sort((a, b) => b.text.length - a.text.length);
    
    sortedEntities.forEach(entity => {
      if (redactionState[entity.text]) {
        const escapedText = entity.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedText, 'g');
        result = result.replace(regex, `[${entity.type}]`);
      }
    });
    return result;
  }, [inputText, entities, redactionState]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(redactedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownloadImage = async () => {
    if (resultRef.current === null) return;
    try {
      const dataUrl = await toPng(resultRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `redacted-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  const clearAll = () => {
    setInputText('');
    setEntities([]);
    setRedactionState({});
    setError(null);
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'NAME': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EMAIL': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PHONE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ADDRESS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'IP_ADDRESS': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'CREDIT_CARD': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getEntityHighlightColor = (type: string) => {
    switch (type) {
      case 'NAME': return 'bg-blue-200/50 border-blue-300';
      case 'EMAIL': return 'bg-emerald-200/50 border-emerald-300';
      case 'PHONE': return 'bg-amber-200/50 border-amber-300';
      case 'ADDRESS': return 'bg-purple-200/50 border-purple-300';
      case 'IP_ADDRESS': return 'bg-rose-200/50 border-rose-300';
      case 'CREDIT_CARD': return 'bg-orange-200/50 border-orange-300';
      default: return 'bg-slate-200/50 border-slate-300';
    }
  };

  const renderHighlightedText = () => {
    if (!inputText) return null;

    // Sort entities by length descending to handle overlapping matches correctly
    const sortedEntities = [...entities].sort((a, b) => b.text.length - a.text.length);
    
    // We need to find all occurrences of all entities and mark their ranges
    let parts: { text: string; entity?: DetectedEntity; start: number; end: number }[] = [
      { text: inputText, start: 0, end: inputText.length }
    ];

    sortedEntities.forEach(entity => {
      const newParts: typeof parts = [];
      parts.forEach(part => {
        if (part.entity) {
          newParts.push(part);
          return;
        }

        const escapedText = entity.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedText, 'g');
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(part.text)) !== null) {
          if (match.index > lastIndex) {
            newParts.push({ 
              text: part.text.substring(lastIndex, match.index), 
              start: part.start + lastIndex, 
              end: part.start + match.index 
            });
          }
          newParts.push({ 
            text: match[0], 
            entity, 
            start: part.start + match.index, 
            end: part.start + match.index + match[0].length 
          });
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < part.text.length) {
          newParts.push({ 
            text: part.text.substring(lastIndex), 
            start: part.start + lastIndex, 
            end: part.end 
          });
        }
      });
      parts = newParts;
    });

    return (
      <div className="whitespace-pre-wrap break-words pointer-events-none">
        {parts.map((part, i) => (
          part.entity ? (
            <span 
              key={i} 
              className={cn(
                "rounded-sm border-b-2 transition-all",
                redactionState[part.entity.text] ? getEntityHighlightColor(part.entity.type) : "bg-transparent border-transparent"
              )}
            >
              {part.text}
            </span>
          ) : (
            <span key={i}>{part.text}</span>
          )
        ))}
      </div>
    );
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const highlightDiv = document.getElementById('highlight-layer');
    if (highlightDiv) {
      highlightDiv.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-indigo-100">
      <JoisstNavbar 
        onUpload={() => fileInputRef.current?.click()} 
        onClear={clearAll} 
        language={language}
        onLanguageChange={setLanguage}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".txt,.log,.csv,.json,image/png,image/jpeg"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t.sourceText}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <Check className="w-3 h-3" />
                    {t.regexActive}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {inputText.length} {t.characters}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 relative overflow-hidden">
                {/* Highlight Layer */}
                <div 
                  id="highlight-layer"
                  className="absolute inset-0 p-6 text-slate-800 font-mono text-sm leading-relaxed overflow-y-auto pointer-events-none"
                  style={{ color: 'transparent' }}
                >
                  {renderHighlightedText()}
                </div>
                
                {/* Textarea Layer */}
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onScroll={handleScroll}
                  placeholder={t.placeholder}
                  className="absolute inset-0 w-full h-full p-6 resize-none focus:outline-none text-slate-800 font-mono text-sm leading-relaxed placeholder:text-slate-300 bg-transparent caret-indigo-600"
                  spellCheck={false}
                />
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="text-sm text-slate-400 max-w-[300px]">
                  {t.regexInfo}
                </div>
                <button
                  onClick={handleAiScan}
                  disabled={isAiAnalyzing || !inputText.trim()}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm",
                    isAiAnalyzing || !inputText.trim() 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] active:scale-95"
                  )}
                >
                  {isAiAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t.aiScanning}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="m491.9 288.1c48.1-57 2.4-117.4-63.7-177.5-7.8 27.4-29.8 48.4-57.5 55-5.2-.1-9.4-4.3-9.4-9.6 0-4.1 2.7-7.7 6.6-8.9 23.1-7 40.2-26.4 44.3-50.1-25.6-22-55.3-38.6-87.4-49.1-27.7 24.3-58.2 61.8-31.9 113.3 2.4 4.6.7 10.3-4 12.8-4.5 2.4-10.1.7-12.6-3.7-28.9-56.1-2.7-97 26.8-128.2-60.8-11.6-123.8-1.4-177.9 28.7 22.4 1.2 43.5 11.1 58.8 27.5 3.8 3.6 3.9 9.6.2 13.4-3.6 3.8-9.6 3.9-13.4.2 0 0-.1-.1-.1-.1-37.7-40.2-94.2-20.6-117.1 24.2-30.5 54.7-5.9 84.6 33.9 91.8 5.2.7 8.8 5.5 8 10.7-.7 5.1-5.5 8.7-10.6 8-1.7-.2-41.6-6.1-57.6-37.4-1.4-2.7-2.6-5.5-3.5-8.4-33.4 42.3-31.2 75.3 5.5 113.8 10.2 11.4 25.8 16.3 40.6 12.6 29.8-7.5 70.1-24.2 78.4-45.7 7.6-18.9-8.8-20.8 3.6-31.5 16.2-7.3 21.3 20.4 14.2 38.1-6.5 18.3-31.7 36-53.9 44.6 5.1 16.1 15.9 29.7 30.3 38.5 30 18.6 70.1 14.8 87.1 10.2 4.6-1.3 9.6-.2 13.3 2.9 11.3 9.7 24.7 16.5 39.2 19.9 6.2 1.1 11.7 4.5 15.4 9.6l39.5 56.7c1.8 2.5 4.7 4.1 7.8 4.1h33.1c5.2 0 9.5-4.2 9.5-9.5v-38.6c79.3-18.8 131.1-56.1 102.8-127.2-1.8-3.7-1.1-8.1 1.7-11.1zm-91.9-64.5 38.6-8.8c5.1-1.1 10.2 2.2 11.2 7.3 1.1 5-2 9.9-7 11.2l-38.6 8.8c-.7.2-1.4.2-2.1.2-5.2-.1-9.4-4.3-9.4-9.6.1-4.4 3.1-8.1 7.3-9.1zm-73.5 49.4c10-18.4 19.8-58.1-10-70.6-4.7-2.3-6.7-8-4.4-12.7 11.8-17.8 39.8 16.5 41.2 28.4 6.7 23.3-3.1 49.5-9.6 62.8 21.3 14.7 36.8 36.2 44.2 60.9 1.8 4.9-.8 10.4-5.7 12.2s-10.4-.8-12.2-5.7v-.1c-24.7-74.3-84.8-67.3-122.4-44.7-4.5 2.7-10.3 1.3-13.1-3.2-2.6-4.3-1.3-10 2.8-12.8 2-1.1 45.9-28.6 89.2-14.5zm-169.6-75.4c-9.5-1-39.1-.9-34.7-17.5 1.7-4.9 7.1-7.5 12-5.8 24.3 11.3 53.1.7 64.4-23.6 1.1-2.5 2.1-5 2.8-7.7 1.7-5 7.1-7.7 12-6 4.8 1.6 7.5 6.6 6.2 11.5-3.4 10.1-8.8 19.4-15.7 27.5 2.1 9.2 7.1 17.4 14.3 23.4 8.3 5.6 18.5 7.6 28.2 5.3 5.2-.8 10 2.7 10.9 7.8.8 5.2-2.7 10-7.9 10.9-26.1 5.4-52.3-9.2-61.2-34.4-9.3 5.8-20.2 8.8-31.3 8.6z" fill="currentColor"/></svg>
                      {t.advancedAiScan}
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Analysis & Results */}
          <div className="lg:col-span-5 space-y-6">
            {/* Detected Entities */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t.detectedEntities}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => redactAll(true)}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    {t.redactAll}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    onClick={() => redactAll(false)}
                    className="text-[11px] font-bold text-slate-500 hover:underline"
                  >
                    {t.undoAll}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {entities.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm italic">{t.noEntities}</p>
                  </div>
                ) : (
                  entities.map((entity, idx) => (
                    <motion.div
                      key={`${entity.text}-${idx}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                        redactionState[entity.text] 
                          ? "bg-slate-50 border-slate-200" 
                          : "bg-white border-slate-100 hover:border-slate-200"
                      )}
                      onClick={() => toggleRedaction(entity.text)}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tight",
                            getEntityColor(entity.type)
                          )}>
                            {t.entityTypes[entity.type] || entity.type}
                          </span>
                          <span className={cn(
                            "text-[9px] font-mono px-1 rounded",
                            entity.source === 'AI' ? "bg-indigo-50 text-indigo-500" : "bg-emerald-50 text-emerald-500"
                          )}>
                            {entity.source}
                          </span>
                        </div>
                        <span className={cn(
                          "text-sm font-mono truncate",
                          redactionState[entity.text] ? "text-slate-400 line-through" : "text-slate-700"
                        )}>
                          {entity.text}
                        </span>
                      </div>
                      
                      <div className={cn(
                        "w-10 h-6 rounded-full relative transition-colors shrink-0",
                        redactionState[entity.text] ? "bg-indigo-600" : "bg-slate-200"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                          redactionState[entity.text] ? "left-5" : "left-1"
                        )} />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Output Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t.redactedPreview}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-bold transition-colors",
                      copied ? "text-emerald-600" : "text-indigo-600 hover:text-indigo-700"
                    )}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t.copied : t.copy}
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title={t.downloadImage}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div 
                ref={resultRef}
                className="flex-1 p-6 overflow-y-auto bg-slate-900 text-slate-300 font-mono text-sm leading-relaxed"
              >
                {inputText ? (
                  <div className="whitespace-pre-wrap">
                    {showOriginal ? inputText : redactedText}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                    <FileText className="w-8 h-8 opacity-20" />
                    <p className="text-sm italic">{t.previewPlaceholder}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-500">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.hybridDetection}</h3>
            <p className="text-sm leading-relaxed">
              {t.hybridInfo}
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.ocrEngine}</h3>
            <p className="text-sm leading-relaxed">
              {t.ocrInfo}
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.fileSupport}</h3>
            <p className="text-sm leading-relaxed">
              {t.fileInfo}
            </p>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Modal */}
      <AnimatePresence>
        {!cookieConsent && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#d90168]/10 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-[#d90168]" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    {t.cookieTitle}
                  </h2>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.cookieContent}
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={acceptCookies}
                    className="px-10 py-4 bg-[#d90168] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#d90168]/20"
                  >
                    {t.cookieButton}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
