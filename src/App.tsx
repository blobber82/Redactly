import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JoisstNavbar } from './components/JoisstNavbar';
import { 
  ShieldAlert, 
  Copy, 
  Download, 
  Trash2, 
  RefreshCw, 
  Loader2,
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
import { jsPDF } from 'jspdf';
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
    cookieButton: "Cool!",
    exportCleaned: "Export Cleaned File",
    downloadTxt: "Download as .txt",
    exportPdf: "Export Redacted PDF",
    actions: "Actions",
    uploadFile: "Upload File",
    clearAll: "Clear All",
    downloadOriginal: "Download Original Format",
    acceptedFormats: "Accepted: .txt, .log, .csv, .json, .jpg, .png",
    costsOneBrain: "Costs 1 brain",
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
    cookieButton: "¡Genial!",
    exportCleaned: "Exportar Archivo Limpio",
    downloadTxt: "Descargar como .txt",
    exportPdf: "Exportar PDF Redactado",
    actions: "Acciones",
    uploadFile: "Subir Archivo",
    clearAll: "Limpiar Todo",
    downloadOriginal: "Descargar Formato Original",
    acceptedFormats: "Aceptados: .txt, .log, .csv, .json, .jpg, .png",
    costsOneBrain: "Cuesta 1 cerebro",
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
    cookieButton: "Cool !",
    exportCleaned: "Exporter le Fichier Nettoyé",
    downloadTxt: "Télécharger en .txt",
    exportPdf: "Exporter en PDF Rédigé",
    actions: "Actions",
    uploadFile: "Téléverser",
    clearAll: "Tout Effacer",
    downloadOriginal: "Télécharger Format Original",
    acceptedFormats: "Acceptés : .txt, .log, .csv, .json, .jpg, .png",
    costsOneBrain: "Coûte 1 cerveau",
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
    cookieButton: "Cool!",
    exportCleaned: "Bereinigte Datei exportieren",
    downloadTxt: "Als .txt herunterladen",
    exportPdf: "Geschwärztes PDF exportieren",
    actions: "Aktionen",
    uploadFile: "Datei hochladen",
    clearAll: "Alles löschen",
    downloadOriginal: "Originalformat herunterladen",
    acceptedFormats: "Akzeptiert: .txt, .log, .csv, .json, .jpg, .png",
    costsOneBrain: "Kostet 1 Gehirn",
  }
};

export default function App() {
  const [language, setLanguage] = useState('English');
  const [inputText, setInputText] = useState('');
  const [entities, setEntities] = useState<DetectedEntity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [redactionState, setRedactionState] = useState<RedactionState>({});
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cookieConsent, setCookieConsent] = useState(true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  const [ocrProgress, setOcrProgress] = useState(0);

  const t = useMemo(() => appTranslations[language] || appTranslations.English, [language]);

  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Joisst SSO Handshake
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const ref = new URLSearchParams(window.location.search).get('ref');
        if (ref) setReferralCode(ref);
        
        const res = await fetch(`https://api.joisst.com/api/auth?action=me${ref ? '&ref='+ref : ''}`, {
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (res.status === 401) {
          // Guest User: 1 heart, 0 brains
          setUser({ hearts: 1, brains: 0, isGuest: true });
          setCookieConsent(false);
          return;
        }

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setCookieConsent(!!userData.cookieConsent);
        } else {
          setUser({ hearts: 1, brains: 0, isGuest: true });
          setCookieConsent(false);
        }
      } catch (err) {
        console.error("Auth handshake failed:", err);
        setUser({ hearts: 1, brains: 0, isGuest: true });
        setCookieConsent(false);
      }
    };
    
    const timer = setTimeout(checkAuth, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Theme Management
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const spendBrain = async () => {
    if (user?.isGuest) {
      if ((user.brains || 0) <= 0) {
        window.location.href = 'https://api.joisst.com/login';
        return false;
      }
      setUser((prev: any) => ({ ...prev, brains: prev.brains - 1 }));
      return true;
    }
    try {
      const res = await fetch('https://api.joisst.com/api/brains?action=spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: 1 })
      });

      if (res.status === 401) {
        window.location.href = 'https://api.joisst.com/login';
        return false;
      }
      if (res.status === 400) {
        window.location.href = 'https://api.joisst.com/hearts';
        return false;
      }
      
      if (res.ok) {
        // Optimistic update
        setUser((prev: any) => prev ? { ...prev, brains: Math.max(0, (prev.brains || 0) - 1) } : prev);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to spend brain:", err);
      return false;
    }
  };

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
      const success = await spendBrain();
      if (!success) {
        setError('Insufficient Brains. Please log in or get more brains.');
        setIsAiAnalyzing(false);
        return;
      }

      const aiDetected = await detectSensitiveInfoAI(inputText);
      console.log("AI Detected Entities:", aiDetected);
      if (aiDetected.length === 0) {
        setError('AI Scan complete: No additional sensitive entities detected.');
      }
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

    setUploadedFile({ name: file.name, type: file.type });
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

  const handleDownloadTxt = () => {
    const blob = new Blob([redactedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = uploadedFile ? `redacted-${uploadedFile.name.split('.')[0]}.txt` : `redacted-${Date.now()}.txt`;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadOriginalFormat = () => {
    if (!uploadedFile) return;
    
    // If it was an image, we can't really "download in original format" as text
    // unless we mean the text extracted from it. We'll default to .txt for images
    // or the original extension for text-based files.
    const isImage = uploadedFile.type.startsWith('image/');
    const mimeType = isImage ? 'text/plain' : uploadedFile.type;
    const extension = isImage ? 'txt' : uploadedFile.name.split('.').pop();
    
    const blob = new Blob([redactedText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `redacted-${uploadedFile.name.split('.')[0]}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const splitText = doc.splitTextToSize(redactedText, pageWidth - margin * 2);
    doc.text(splitText, margin, 20);
    doc.save(`redacted-${Date.now()}.pdf`);
  };

  const clearAll = () => {
    setInputText('');
    setEntities([]);
    setRedactionState({});
    setError(null);
    setUploadedFile(null);
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'NAME': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'EMAIL': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'PHONE': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'ADDRESS': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'IP_ADDRESS': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'CREDIT_CARD': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getEntityHighlightColor = (type: string) => {
    switch (type) {
      case 'NAME': return 'bg-blue-200/50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700';
      case 'EMAIL': return 'bg-emerald-200/50 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700';
      case 'PHONE': return 'bg-amber-200/50 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700';
      case 'ADDRESS': return 'bg-purple-200/50 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700';
      case 'IP_ADDRESS': return 'bg-rose-200/50 dark:bg-rose-900/50 border-rose-300 dark:border-rose-700';
      case 'CREDIT_CARD': return 'bg-orange-200/50 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700';
      default: return 'bg-slate-200/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700';
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
      if (!entity.text) return;
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
    <div className={cn("min-h-screen transition-colors duration-300 font-sans selection:bg-indigo-100", isDarkMode && "dark")}>
      <div className={cn("min-h-screen", isDarkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900")}>
        <JoisstNavbar 
        onUpload={() => fileInputRef.current?.click()} 
        onClear={clearAll} 
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        referralCode={referralCode}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".txt,.log,.csv,.json,image/png,image/jpeg"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* App Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
            <svg enable-background="new 0 0 492 492" viewBox="0 0 492 492" xmlns="http://www.w3.org/2000/svg">
              <g clip-rule="evenodd" fill-rule="evenodd">
                <path d="m0 0h492v492h-492z" fill="#e8baba"/>
                <path d="m347.1 342-38.3 39.8-8.9-54.5z" fill="#66737c"/>
                <path d="m412.4 132.7-64.7 207.5-.6 1.8-47.1-14.7 47.7-152.9 17.6-56.3z" fill="#f2ae96"/>
                <path d="m418.3 82.8c4.9 1.5 7.6 6.7 6.1 11.6l-12 38.4-47.1-14.8 12-38.4c1.5-4.9 6.7-7.6 11.6-6.1z" fill="#9e66aa"/>
                <path d="m347.7 340.2v74.2c0 3.3-2.7 5.9-5.9 5.9h-268.2c-3.3 0-5.9-2.7-5.9-5.9v-335.3c0-3.3 2.7-5.9 5.9-5.9h268.1c3.3 0 5.9 2.7 5.9 5.9v95.2l-47.6 153 8.9 54.5 38.3-39.8z" fill="#e1e5e8"/>
                <g fill="#333333">
                  <path d="m308.8 387.5c-.6 0-1.2-.1-1.7-.3-2.1-.6-3.6-2.4-4-4.6l-8.9-54.5c-.1-.9-.1-1.8.2-2.6l77.3-247.6c1.2-3.8 3.8-6.9 7.3-8.8s7.6-2.2 11.4-1l29.6 9.2c7.9 2.5 12.3 10.9 9.8 18.8l-77.3 247.6c-.3.9-.7 1.6-1.3 2.3l-38.2 39.8c-1.1 1.1-2.6 1.7-4.2 1.7zm-2.9-59.8 6.8 41.8 29.3-30.5 76.9-246.3c.6-1.8-.5-3.8-2.3-4.3l-29.6-9.2c-.9-.3-1.8-.2-2.6.2s-1.4 1.2-1.7 2z"/>
                  <path d="m412.4 138.5c-.6 0-1.1-.1-1.7-.3l-47.2-14.7c-3-.9-4.7-4.2-3.8-7.2s4.2-4.7 7.2-3.8l47.2 14.7c3 .9 4.7 4.2 3.8 7.2-.7 2.5-3 4.1-5.5 4.1z"/>
                  <path d="m347.1 347.7c-.6 0-1.1-.1-1.7-.3l-47.2-14.7c-3-.9-4.7-4.2-3.8-7.2s4.2-4.7 7.2-3.8l47.2 14.7c3 .9 4.7 4.2 3.8 7.2-.8 2.6-3 4.1-5.5 4.1z"/>
                  <path d="m300 119h-184.6c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h184.6c3.2 0 5.8 2.6 5.8 5.8s-2.7 5.8-5.8 5.8z"/>
                  <path d="m300 157.1h-184.6c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h184.6c3.2 0 5.8 2.6 5.8 5.8s-2.7 5.8-5.8 5.8z"/>
                  <path d="m297.6 195.3h-182.2c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h182.1c3.2 0 5.8 2.6 5.8 5.8s-2.6 5.8-5.7 5.8z"/>
                  <path d="m288 233.4h-172.6c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h172.6c3.2 0 5.8 2.6 5.8 5.8-.1 3.2-2.7 5.8-5.8 5.8z"/>
                  <path d="m278.4 271.6h-163c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h162.9c3.2 0 5.8 2.6 5.8 5.8s-2.6 5.8-5.7 5.8z"/>
                  <path d="m265.8 309.7h-150.4c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h150.4c3.2 0 5.8 2.6 5.8 5.8-.1 3.3-2.6 5.8-5.8 5.8z"/>
                  <path d="m251.7 347.9h-136.3c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h136.3c3.2 0 5.8 2.6 5.8 5.8-.1 3.2-2.6 5.8-5.8 5.8z"/>
                  <path d="m266.4 386h-151c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8h150.9c3.2 0 5.8 2.6 5.8 5.8s-2.6 5.8-5.7 5.8z"/>
                  <path d="m341.7 426.1h-268.1c-6.5 0-11.7-5.2-11.7-11.7v-335.3c0-6.5 5.2-11.7 11.7-11.7h268.1c6.5 0 11.7 5.2 11.7 11.7v95.2c0 3.2-2.6 5.8-5.8 5.8s-5.8-2.6-5.8-5.8v-95.2c0-.1-.1-.2-.2-.2h-268c-.1 0-.2.1-.2.2v335.3c0 .1.1.2.2.2h268.1c.1 0 .2-.1.2-.2v-74.2c0-3.2 2.6-5.8 5.8-5.8s5.8 2.6 5.8 5.8v74.2c-.1 6.4-5.3 11.7-11.8 11.7z"/>
                </g>
              </g>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-black dark:text-white tracking-tighter uppercase">Redactly</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Professional Redaction Tool</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{t.sourceText}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-600 hover:text-indigo-600 transition-all text-xs font-bold"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {t.uploadFile}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                      {t.acceptedFormats}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900" />
                    </div>
                  </div>

                  <button
                    onClick={clearAll}
                    disabled={!inputText}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold",
                      !inputText 
                        ? "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-rose-600 hover:border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.clearAll}
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                      <Check className="w-3 h-3" />
                      {t.regexActive}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {inputText.length} {t.characters}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 relative overflow-hidden">
                {/* Highlight Layer */}
                <div 
                  id="highlight-layer"
                  className="absolute inset-0 p-6 text-slate-800 dark:text-slate-100 font-mono text-sm leading-relaxed overflow-y-auto pointer-events-none"
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
                  className="absolute inset-0 w-full h-full p-6 resize-none focus:outline-none text-slate-800 dark:text-slate-100 font-mono text-sm leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 bg-transparent caret-indigo-600"
                  spellCheck={false}
                />
              </div>
              
              <div className="p-4 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="text-sm text-slate-400 dark:text-slate-500 max-w-[300px]">
                    {t.regexInfo}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-1">
                    {t.costsOneBrain}
                  </div>
                </div>
                <button
                  onClick={handleAiScan}
                  disabled={isAiAnalyzing || !inputText.trim()}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm",
                    !inputText.trim() 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed" 
                      : isAiAnalyzing
                        ? "bg-indigo-600 text-white cursor-wait"
                        : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] active:scale-95"
                  )}
                >
                  {isAiAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
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
                className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Analysis & Results */}
          <div className="lg:col-span-5 space-y-6">
            {/* Detected Entities */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{t.detectedEntities}</h2>
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
                  <div className="h-32 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
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
                          ? "bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
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
                            entity.source === 'AI' 
                              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400" 
                              : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400"
                          )}>
                            {entity.source}
                          </span>
                        </div>
                        <span className={cn(
                          "text-sm font-mono truncate",
                          redactionState[entity.text] 
                            ? "text-slate-400 dark:text-slate-600 line-through" 
                            : "text-slate-700 dark:text-slate-200"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[450px]">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{t.redactedPreview}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
                      title={t.actions}
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {showActionsMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden"
                          >
                            <div className="p-1">
                              {uploadedFile && !uploadedFile.type.startsWith('image/') && (
                                <button onClick={() => { handleDownloadOriginalFormat(); setShowActionsMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                  <RefreshCw className="w-4 h-4" /> {t.downloadOriginal}
                                </button>
                              )}
                              <button onClick={() => { handleDownloadTxt(); setShowActionsMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <FileText className="w-4 h-4" /> {t.downloadTxt}
                              </button>
                              <button onClick={() => { handleExportPdf(); setShowActionsMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <Download className="w-4 h-4" /> {t.exportPdf}
                              </button>
                              <button onClick={() => { handleDownloadImage(); setShowActionsMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" /> {t.downloadImage}
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div 
                ref={resultRef}
                className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300 font-mono text-sm leading-relaxed"
              >
                {inputText ? (
                  <div className="whitespace-pre-wrap">
                    {showOriginal ? inputText : redactedText}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
                    <FileText className="w-8 h-8 opacity-20" />
                    <p className="text-sm italic">{t.previewPlaceholder}</p>
                  </div>
                )}
              </div>

              {/* Primary Actions */}
              <div className="p-4 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleCopy}
                  disabled={!inputText}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all shadow-sm",
                    !inputText ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                  )}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 dark:border-slate-800 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-500 dark:text-slate-400">
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
      <AnimatePresence mode="wait">
        {!cookieConsent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
