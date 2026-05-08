import React, { useState, useEffect, ChangeEvent, useRef, FormEvent } from "react";
import { motion, AnimatePresence, Reorder, useDragControls, useScroll, useTransform } from "motion/react";
import { jsPDF } from 'jspdf';
import { 
  ArrowRight, 
  CheckCircle2, 
  Calendar,
  Shield,
  Briefcase,
  Home,
  FileText, 
  Globe, 
  Leaf, 
  Rocket, 
  Users, 
  MapPin, 
  Facebook, 
  Share2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  Save,
  LogIn,
  LogOut,
  X,
  Edit2,
  Upload,
  Link as LinkIcon,
  Search,
  Sparkles,
  Loader2
} from "lucide-react";
import PrivacyModal from "./components/PrivacyModal";
import TransparencyModal from "./components/TransparencyModal";
import CookieModal from "./components/CookieModal";
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInAnonymously,
  onAuthStateChanged, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  storage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  setDoc,
  increment,
  User
} from "./firebase";

// Avatar placeholder: use official logo for candidates without photo
const getAvatarImg = (name: string, img: string) => {
  if (img && !img.includes("picsum") && img !== "") return img + "?v=20260422";
  return "/logo-ufficiale.png";
};

interface Candidate {
  id?: string;
  name: string;
  img: string;
  age?: number;
  cvUrl?: string;
  cvText?: string;
  criminalRecordText?: string;
  criminalRecordUrl?: string;
  position: number;
  bio?: string;
  policies?: string[];
}

const Navbar = ({ user, isAdmin, onLogin, onLogout, onOpenContact, logo, onLogoChange }: { 
  user: User | null, 
  isAdmin: boolean, 
  onLogin: () => void, 
  onLogout: () => void, 
  onOpenContact: () => void,
  logo: string,
  onLogoChange: (url: string) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const uploadingRef = useRef(false);
  const base64Ref = useRef("");

  const handleUrlPaste = () => {
    const url = prompt("Incolla qui l'indirizzo (URL) dell'immagine del tuo logo:");
    if (url && url.startsWith("http")) {
      onLogoChange(url);
    } else if (url) {
      alert("Indirizzo non valido. Deve iniziare con http:// o https://");
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    uploadingRef.current = true;
    setProgress(0);
    progressRef.current = 0;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      base64Ref.current = base64;
      
      try {
        const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const fallbackTimer = setTimeout(() => {
          if (progressRef.current === 0 && uploadingRef.current) {
            console.log("Auto-fallback trigger: progress stuck at 0");
            onLogoChange(base64);
            setUploading(false);
            uploadingRef.current = false;
            alert("Il caricamento Cloud è lento. Logo applicato in modalità rapida!");
          }
        }, 5000);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const currentP = Math.round(p);
            setProgress(currentP);
            progressRef.current = currentP;
          }, 
          (error) => {
            clearTimeout(fallbackTimer);
            console.error("Logo upload failed, falling back to base64", error);
            onLogoChange(base64);
            setUploading(false);
            uploadingRef.current = false;
          }, 
          async () => {
            clearTimeout(fallbackTimer);
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            onLogoChange(url);
            setUploading(false);
            uploadingRef.current = false;
          }
        );
      } catch (error: any) {
        console.error("Logo upload initialization failed", error);
        onLogoChange(base64);
        setUploading(false);
        uploadingRef.current = false;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {(logo || isAdmin) && (
            <div className={`relative group cursor-pointer h-32 flex items-center justify-center overflow-hidden transition-all ${!logo && !isAdmin ? 'w-0 opacity-0' : 'min-w-[140px] opacity-100'}`}>
              {logo ? (
                <img 
                  src={logo} 
                  alt="Logo" 
                  className="h-full w-auto object-contain p-2 transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              ) : isAdmin && (
                <div className="flex items-center justify-center h-full w-full opacity-20 group-hover:opacity-40 transition-opacity">
                  <Upload size={40} className="text-primary" />
                </div>
              )}
      {isAdmin && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl text-white z-20 gap-2">
          {uploading ? (
            <div className="flex flex-col items-center gap-1 w-full px-2">
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="text-[10px] font-bold">{progress}%</span>
              <button 
                onClick={() => {
                  if (base64Ref.current) {
                    onLogoChange(base64Ref.current);
                    setUploading(false);
                    uploadingRef.current = false;
                    alert("Salvataggio forzato completato.");
                  }
                }}
                className="text-[8px] underline opacity-70 hover:opacity-100 font-bold"
              >
                Forza Salva Rapido
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 w-full px-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1 bg-primary text-on-primary py-1 px-2 rounded-lg text-[9px] font-bold uppercase w-full hover:bg-primary/90"
              >
                <Upload size={12} /> Carica
              </button>
              <button 
                onClick={handleUrlPaste}
                className="flex items-center justify-center gap-1 bg-surface-container-high text-on-surface py-1 px-2 rounded-lg text-[9px] font-bold uppercase w-full hover:bg-surface-container-highest"
              >
                <LinkIcon size={12} /> Incolla URL
              </button>
            </div>
          )}
        </div>
      )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
          )}
          <span className="text-xl md:text-2xl font-black tracking-tighter text-primary">Pierangelo Del Zotto</span>
        </div>
      <div className="hidden md:flex items-center gap-8">
        {["Visione", "Programma", "FAQ", "Biografia", "Candidati"].map((item) => (
          <a 
            key={item} 
            href={`#${item.toLowerCase()}`} 
            className="text-sm font-semibold text-on-surface/70 hover:text-primary transition-colors relative pb-1 group"
          >
            {item}
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
          </a>
        ))}
        <button 
          onClick={onOpenContact}
          className="text-sm font-semibold text-on-surface/70 hover:text-primary transition-colors relative pb-1 group"
        >
          Contatti
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
        </button>
      </div>
      
      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2 text-on-surface hover:text-primary transition-colors"
        onClick={() => {
          const menu = document.getElementById('mobile-menu');
          if (menu) menu.classList.toggle('hidden');
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      
      <div className="flex items-center gap-4 hidden md:flex">
        <button className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors">
          <Globe size={20} />
        </button>
        {user ? (
          <div className="flex items-center gap-4">
            {isAdmin && <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">Admin</span>}
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-sm font-bold text-on-surface/70 hover:text-primary transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Esci</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 text-sm font-bold text-on-surface/70 hover:text-primary transition-colors"
          >
            <LogIn size={18} />
            <span className="hidden sm:inline">Accedi</span>
          </button>
        )}
        <button 
          onClick={onOpenContact}
          className="bg-white text-primary border-2 border-primary px-6 py-2 rounded-md font-bold text-sm hover:bg-primary/5 transition-all"
        >
          Contattaci
        </button>
        <button className="bg-primary text-on-primary px-6 py-2 rounded-md font-bold text-sm shadow-lg hover:bg-primary-container transition-all">
          Sostieni
        </button>
      </div>
    </div>
    
    {/* Mobile dropdown menu */}
    <div id="mobile-menu" className="hidden md:hidden bg-white/95 backdrop-blur-xl border-t border-outline-variant/10 px-6 py-4">
      <div className="flex flex-col gap-3">
        {["Visione", "Programma", "FAQ", "Biografia", "Candidati"].map((item) => (
          <a 
            key={item} 
            href={`#${item.toLowerCase()}`} 
            className="text-base font-semibold text-on-surface/70 hover:text-primary transition-colors py-2"
            onClick={() => { const menu = document.getElementById('mobile-menu'); if (menu) menu.classList.add('hidden'); }}
          >
            {item}
          </a>
        ))}
        <button 
          onClick={() => { onOpenContact(); const menu = document.getElementById('mobile-menu'); if (menu) menu.classList.add('hidden'); }}
          className="text-base font-semibold text-on-surface/70 hover:text-primary transition-colors py-2 text-left"
        >
          Contatti
        </button>
      </div>
    </div>
  </nav>
);
};

const Hero = ({ isAdmin, onOpenContact }: { isAdmin: boolean, onOpenContact: () => void }) => {
  const targetRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const [heroImage, setHeroImage] = useState("/sindaco.jpg");
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "hero"), (doc) => {
      if (doc.exists()) {
        const url = doc.data().url;
        setHeroImage(url);
        localStorage.setItem("heroImage", url);
      } else {
        const local = localStorage.getItem("heroImage");
        if (local) {
          setHeroImage(local);
        } else {
          setHeroImage("/sindaco.jpg");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Il file è troppo grande. Il limite è 5MB.");
      return;
    }

    if (!isAdmin) {
      alert("Devi essere un amministratore per caricare immagini.");
      return;
    }

    setIsUploading(true);
    
    // Create local preview immediately
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      // Try cloud upload first
      try {
        const storageRef = ref(storage, `hero/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        // Persist to Firestore
        await setDoc(doc(db, "settings", "hero"), { url });
        setHeroImage(url);
        localStorage.setItem("heroImage", url);
      } catch (error: any) {
        console.error("Cloud upload failed, using local storage fallback:", error);
        // Fallback: save base64 to localStorage if it's not too large
        if (base64.length < 4 * 1024 * 1024) { // ~4MB limit for base64
          localStorage.setItem("heroImage", base64);
          setHeroImage(base64);
        }
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = async () => {
    if (!tempUrl) return;
    try {
      await setDoc(doc(db, "settings", "hero"), { url: tempUrl });
      setHeroImage(tempUrl);
      localStorage.setItem("heroImage", tempUrl);
      setShowUrlInput(false);
      setTempUrl("");
    } catch (error: any) {
      console.error("URL save error:", error);
      localStorage.setItem("heroImage", tempUrl);
      setHeroImage(tempUrl);
      setShowUrlInput(false);
      setTempUrl("");
    }
  };

  // Parallax and fade for the text
  const textY = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { 
        duration: 1.2, 
        ease: [0.21, 0.47, 0.32, 0.98] 
      }
    }
  };

  const handlePlaceholderClick = () => {
    if (!isAdmin) {
      alert("Per caricare una foto devi prima accedere come amministratore.");
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <section ref={targetRef} className="relative bg-surface overflow-hidden flex items-center py-10">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-1/2 hidden md:block opacity-30"></div>
      
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10 w-full py-10">
        <motion.div 
          style={{ y: textY, opacity: textOpacity }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="order-2 md:order-1 relative"
        >
          {/* Section for Name with Integrated Green Background */}
          <motion.div variants={itemVariants} className="mb-4 relative">
            <div className="relative z-10 p-2 md:p-4">
              <div className="inline-block bg-primary rounded-xl p-8 md:p-14 shadow-[0_30px_60px_-15px_rgba(0,107,44,0.4)] border-l-[12px] border-tertiary">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-tertiary text-xl md:text-3xl font-light italic tracking-[0.2em] whitespace-nowrap">
                    Pierangelo
                  </span>
                  <div className="h-[1px] flex-1 bg-tertiary/30"></div>
                </div>
                
                <h1 
                  className="text-white text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.85] tracking-tight mb-8"
                  style={{ 
                    letterSpacing: '-0.02em',
                    textShadow: '0 10px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  Del Zotto
                </h1>
                
                <div className="flex flex-col gap-1 border-t border-white/20 pt-6">
                  <span className="text-tertiary text-sm md:text-lg font-black uppercase tracking-[0.3em]">
                    Sindaco per Venezia
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="h-1 w-12 bg-tertiary rounded-full"></span>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Elezioni 24-25 Maggio</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Buttons moved to relevant sections */}
        </motion.div>
          
        <div className="order-1 md:order-2 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-tertiary rounded-full blur-3xl opacity-10 -z-10 translate-y-10 group-hover:opacity-20 transition-opacity duration-500"></div>
              {heroImage ? (
                <img 
                  src={heroImage} 
                  alt="Pierangelo Del Zotto" 
                  className="w-full h-auto max-w-sm object-contain drop-shadow-2xl rounded-2xl"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              ) : (
                <div 
                  onClick={handlePlaceholderClick}
                  className={`w-full aspect-[4/5] max-w-lg bg-surface-container-high border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center gap-4 text-on-surface/60 ${isAdmin ? 'cursor-pointer hover:bg-surface-container-highest transition-colors' : ''}`}
                >
                  <Upload size={48} />
                  <p className="font-bold">{isAdmin ? "Carica la tua foto" : "Accedi per caricare la foto"}</p>
                </div>
              )}
              <div className="mt-8 text-center">
                <p className="text-2xl md:text-3xl font-black text-primary italic tracking-tight drop-shadow-sm">
                  «Onestà e lealtà, prima di tutto»
                </p>
              </div>

              {isAdmin && (
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-30">
                  {showUrlInput && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-surface/90 backdrop-blur-md p-2 rounded-xl border border-outline-variant/30 shadow-xl flex gap-2"
                    >
                      <input 
                        type="text" 
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="Incolla URL immagine..."
                        className="bg-transparent border-none outline-none text-xs w-48"
                      />
                      <button 
                        onClick={handleUrlSubmit}
                        className="bg-primary text-on-primary px-3 py-1 rounded-lg text-[10px] font-bold"
                      >
                        OK
                      </button>
                      <button 
                        onClick={() => setShowUrlInput(false)}
                        className="text-on-surface/70 p-1"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="bg-surface/80 backdrop-blur-md border border-outline-variant/30 p-2 rounded-full shadow-lg hover:bg-tertiary hover:text-on-tertiary transition-all"
                      title="Usa URL"
                    >
                      <LinkIcon size={14} />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`bg-surface/80 backdrop-blur-md border border-outline-variant/30 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-primary hover:text-on-primary transition-all group ${!heroImage ? 'opacity-100' : ''}`}
                    >
                      {isUploading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} className="group-hover:animate-bounce" />
                      )}
                      {isUploading ? "Caricamento..." : "Carica Foto"}
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
        </div>

      </div>
    </section>
  );
};

const Biography = ({ logo, onLogoChange, isAdmin }: { logo: string, onLogoChange: (url: string) => void, isAdmin: boolean }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

  const handleUrlSubmit = async () => {
    if (!tempUrl) return;
    onLogoChange(tempUrl);
    localStorage.setItem("biographyLogo", tempUrl);
    setShowUrlInput(false);
    setTempUrl("");
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const storageRef = ref(storage, `biography/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        onLogoChange(url);
        localStorage.setItem("biographyLogo", url);
      } catch (error: any) {
        console.error("Cloud upload failed, using local storage fallback:", error);
        localStorage.setItem("biographyLogo", base64);
        onLogoChange(base64);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section id="biografia" className="py-8 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="md:w-1/3 flex flex-col items-center">
            <div className="text-center md:text-left mb-8 w-full">
              <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Profilo e Competenze</h2>
              <h3 className="text-4xl font-black text-on-surface tracking-tighter mb-8">Una vita per il <span className="text-primary">Bilancio Pubblico</span></h3>
            </div>
            
            <div className="relative group w-72 h-72 md:w-84 md:h-84">
              {logo ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="w-full h-full rounded-full overflow-hidden shadow-2xl relative cursor-pointer"
                >
                  <img 
                    src={logo} 
                    alt="Logo Biografia" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </motion.div>
              ) : (
                <div 
                  onClick={() => isAdmin && fileInputRef.current?.click()}
                  className={`w-full h-full rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-2 text-on-surface/30 ${isAdmin ? 'cursor-pointer hover:bg-surface-container-highest transition-colors' : ''}`}
                >
                  <Plus size={24} />
                  <span className="text-[10px] font-bold uppercase">Logo</span>
                </div>
              )}

              {isAdmin && (
                <div className="absolute -bottom-2 -right-2 z-30 flex flex-col items-end gap-2">
                  {showUrlInput && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-surface/90 backdrop-blur-md p-2 rounded-xl border border-outline-variant/30 shadow-xl flex gap-2 mb-2"
                    >
                      <input 
                        type="text" 
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="URL Logo..."
                        className="bg-transparent border-none outline-none text-[10px] w-32"
                      />
                      <button 
                        onClick={handleUrlSubmit}
                        className="bg-primary text-on-primary px-2 py-1 rounded-lg text-[9px] font-bold"
                      >
                        OK
                      </button>
                    </motion.div>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="bg-surface shadow-md border border-outline-variant/30 p-1.5 rounded-full text-on-surface hover:bg-tertiary hover:text-on-tertiary transition-all"
                    >
                      <LinkIcon size={12} />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-surface shadow-md border border-outline-variant/30 p-1.5 rounded-full text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                    >
                      {uploading ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
              )}
            </div>
          </div>
          <div className="md:w-2/3 pl-0 md:pl-12">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-light leading-relaxed text-on-surface mb-8 italic"
            >
              «La mia visione per Venezia non nasce da slogan, ma da quarant’anni di numeri, bilanci e responsabilità amministrativa.»
            </motion.p>
            <div className="text-lg text-on-surface/80 leading-relaxed space-y-8">
              <p>
                «Pierangelo Del Zotto è un commercialista veneziano con oltre 40 anni di esperienza nei bilanci pubblici e nelle revisioni contabili. Laureato in Economia a Ca' Foscari, ha dedicato la sua attività professionale alla trasparenza dei conti degli enti locali.»
              </p>
              <div className="bg-surface-container-high p-8 rounded-2xl border-l-4 border-primary shadow-sm">
                <h4 className="text-primary text-xs font-black uppercase tracking-widest mb-3">Esperienza negli enti pubblici</h4>
                <p className="text-on-surface/80">
                  «Già assessore al Bilancio della Provincia di Venezia, ha svolto incarichi di revisore dei conti per Comuni come Mirano, Vigonovo, Santa Maria di Sala, Albignasego e Marcon e ricoperto ruoli di controllo in enti chiave per il territorio, tra cui ULSS 12 Veneziana, ATER e Automobile Club di Venezia.»
                </p>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8">
              {[
                { value: "40+", label: "Anni di Esperienza", color: "primary" },
                { value: "20+", label: "Enti Pubblici Serviti", color: "primary" },
                { value: "100%", label: "Trasparenza", color: "primary" }
              ].map((stat, idx) => (
                <div key={stat.label} className="bg-surface-container p-6 rounded-xl border-b-4 border-primary">
                  <span className={`block text-3xl font-black text-${stat.color} mb-1`}>{stat.value}</span>
                  <span className="text-xs font-bold uppercase text-outline tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  </section>
  );
};

const InnovationDetail = ({ 
  isOpen,
  onClose,
  image, 
  onImageChange, 
  article, 
  onArticleChange, 
  isAdmin 
}: { 
  isOpen: boolean,
  onClose: () => void,
  image: string, 
  onImageChange: (url: string) => void, 
  article: string, 
  onArticleChange: (url: string) => void, 
  isAdmin: boolean 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const articleInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingArticle, setUploadingArticle] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showArticleUrlInput, setShowArticleUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [tempArticleUrl, setTempArticleUrl] = useState("");

  if (!isOpen) return null;

  const handleUrlSubmit = async () => {
    if (!tempUrl) return;
    onImageChange(tempUrl);
    localStorage.setItem("projectImage", tempUrl);
    setShowUrlInput(false);
    setTempUrl("");
  };

  const handleArticleUrlSubmit = async () => {
    if (!tempArticleUrl) return;
    onArticleChange(tempArticleUrl);
    localStorage.setItem("projectArticle", tempArticleUrl);
    setShowArticleUrlInput(false);
    setTempArticleUrl("");
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Il file è troppo grande. Il limite è 5MB.");
      return;
    }

    if (!isAdmin) {
      alert("Devi essere un amministratore per caricare immagini.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        onImageChange(url);
        localStorage.setItem("projectImage", url);
      } catch (error: any) {
        console.error("Cloud upload failed, using local storage fallback:", error);
        if (base64.length < 4 * 1024 * 1024) {
          localStorage.setItem("projectImage", base64);
          onImageChange(base64);
          alert("Caricamento cloud fallito, file salvato localmente.");
        }
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleArticleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Documento troppo grande. Il limite è 10MB.");
      return;
    }

    setUploadingArticle(true);
    try {
      const storageRef = ref(storage, `articles/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onArticleChange(url);
      localStorage.setItem("projectArticle", url);
      alert("Articolo caricato con successo!");
    } catch (error: any) {
      console.error("Article upload failed:", error);
      alert("Caricamento articolo fallito.");
    } finally {
      setUploadingArticle(false);
    }
  };

  const handlePlaceholderClick = () => {
    if (!isAdmin) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-surface w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-3 bg-surface shadow-lg text-on-surface/70 hover:text-primary rounded-full transition-all"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="md:w-3/5 relative z-10">
            <span className="text-primary text-xs font-black uppercase tracking-[0.4em] mb-6 block">Sviluppo e Innovazione</span>
            <h3 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-8 leading-[1.1]">
              Il <span className="text-primary">Palazzo Sansovino di Rialto</span>: il cuore da cui far rinascere Venezia
            </h3>
            <blockquote className="text-2xl md:text-3xl font-light italic text-on-surface/90 border-l-8 border-tertiary pl-8 mb-10 leading-snug">
              «Rialto non è un angolo qualsiasi: è il primo nucleo abitato, la vera nascita di Venezia. Da qui la città deve rinascere»
            </blockquote>
            
            <div className="flex flex-col gap-6 p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 mb-8">
              <p className="text-on-surface/60 text-sm italic">
                Le Fabbriche Nuove di Rialto sono un edificio rinascimentale situato sul Canal Grande a Venezia, vicino al Ponte di Rialto. Progettate da Jacopo Sansovino tra il 1553 e il 1555.
              </p>
              <div className="flex items-start gap-4">
                <div className="bg-tertiary/10 p-3 rounded-xl shrink-0">
                  <Rocket className="text-tertiary" size={24} />
                </div>
                <p className="text-on-surface/70 leading-relaxed text-sm md:text-base">
                  Pierangelo Del Zotto sostiene con forza la proposta di trasformare questo complesso storico in un <strong>Parco Scientifico</strong>. Venezia da Rialto può rinascere con un’innovazione che non cancella la tradizione, ma la mette al centro: tecnologia al servizio dei veneziani.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {article ? (
                <a 
                  href={article} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
                >
                  <FileText size={20} /> Leggi l'Articolo
                </a>
              ) : isAdmin && (
                <div className="text-on-surface/60 text-sm italic">Nessun articolo caricato.</div>
              )}

              {isAdmin && (
                <div className="flex gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => articleInputRef.current?.click()}
                      disabled={uploadingArticle}
                      className="bg-surface-container-highest text-on-surface p-4 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all flex items-center gap-2 text-xs font-bold"
                      title="Carica documento (PDF)"
                    >
                      {uploadingArticle ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                      Carica Articolo
                    </button>
                    <input 
                      type="file" 
                      ref={articleInputRef}
                      onChange={handleArticleUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowArticleUrlInput(!showArticleUrlInput)}
                      className="bg-surface-container-highest text-on-surface p-4 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all flex items-center gap-2 text-xs font-bold"
                      title="Usa URL Articolo"
                    >
                      <LinkIcon size={16} /> URL Articolo
                    </button>
                    <AnimatePresence>
                      {showArticleUrlInput && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 bg-surface p-3 rounded-2xl shadow-2xl border border-outline-variant/30 flex gap-2 z-50 min-w-[250px]"
                        >
                          <input 
                            type="text" 
                            value={tempArticleUrl}
                            onChange={(e) => setTempArticleUrl(e.target.value)}
                            placeholder="URL articolo..."
                            className="bg-surface-container-high p-2 rounded-lg outline-none text-xs flex-1"
                          />
                          <button 
                            onClick={handleArticleUrlSubmit}
                            className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-bold"
                          >
                            OK
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="md:w-2/5 rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/5] relative group shrink-0">
            {image ? (
              <img 
                src={image} 
                alt="Palazzo Sansovino di Rialto - Fabbriche Nuove" 
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div 
                onClick={handlePlaceholderClick}
                className={`w-full h-full bg-surface-container-high border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-4 text-on-surface/60 ${isAdmin ? 'cursor-pointer hover:bg-surface-container-highest transition-colors' : ''}`}
              >
                <Upload size={48} />
                <p className="font-bold">{isAdmin ? "Carica immagine progetto" : "Accedi per caricare"}</p>
              </div>
            )}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
                {showUrlInput && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface/90 backdrop-blur-md p-2 rounded-xl border border-outline-variant/30 shadow-xl flex gap-2"
                  >
                    <input 
                      type="text" 
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="Incolla URL immagine..."
                      className="bg-transparent border-none outline-none text-xs w-48"
                    />
                    <button 
                      onClick={handleUrlSubmit}
                      className="bg-primary text-on-primary px-3 py-1 rounded-lg text-[10px] font-bold"
                    >
                      OK
                    </button>
                    <button 
                      onClick={() => setShowUrlInput(false)}
                      className="text-on-surface/70 p-1"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="bg-white/20 backdrop-blur-md hover:bg-white/40 p-3 rounded-full text-white transition-all shadow-lg"
                    title="Usa URL"
                  >
                    <LinkIcon size={20} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`bg-white/20 backdrop-blur-md hover:bg-white/40 p-3 rounded-full text-white transition-all shadow-lg ${!image ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Carica Foto"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Pillars = ({ onOpenInnovation }: { onOpenInnovation: () => void }) => (
  <section id="visione" className="py-8 bg-surface">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-on-surface/70 max-w-2xl mx-auto text-lg">Un approccio integrato: dalla sicurezza nasce il lavoro, dal lavoro nasce la casa.</p>
      </div>
      
      <div className="relative mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-surface-container-highest p-10 rounded-3xl shadow-sm border border-outline-variant/10 flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="text-primary" size={32} />
            </div>
            <h3 className="text-2xl font-black text-on-surface mb-3">Sicurezza</h3>
            <p className="text-on-surface/60 leading-relaxed text-sm">
              Il fondamento: riorganizziamo la Polizia Locale per un presidio costante del territorio e degli spazi pubblici.
            </p>
          </motion.div>

          {/* Arrow 1 */}
          <div className="hidden md:flex absolute top-1/2 left-[30.5%] -translate-y-1/2 z-20 pointer-events-none">
            <motion.div 
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowRight className="text-primary/30" size={40} strokeWidth={3} />
            </motion.div>
          </div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-tertiary p-10 rounded-3xl text-on-tertiary shadow-lg flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="text-on-tertiary" size={32} />
            </div>
            <h3 className="text-2xl font-black mb-3">Lavoro</h3>
            <p className="opacity-80 leading-relaxed text-sm">
              Il motore: creiamo lavoro stabile per artigiani e giovani, sostenendo l'economia reale veneziana.
            </p>
          </motion.div>

          {/* Arrow 2 */}
          <div className="hidden md:flex absolute top-1/2 left-[64%] -translate-y-1/2 z-20 pointer-events-none">
            <motion.div 
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <ArrowRight className="text-primary/30" size={40} strokeWidth={3} />
            </motion.div>
          </div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-surface-container-highest p-10 rounded-3xl border border-outline-variant/10 flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Home className="text-primary" size={32} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-3">Casa</h3>
            <p className="text-on-surface/60 leading-relaxed text-sm">
              Il traguardo: regoliamo il turismo per restituire gli immobili ai cittadini e favorire la residenzialità.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={onOpenInnovation}
          className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex flex-col items-center text-center group cursor-pointer max-w-md w-full shadow-sm"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Rocket className="text-primary" size={20} />
          </div>
          <h3 className="text-lg font-black text-on-surface mb-2 tracking-tight uppercase tracking-widest text-[10px] opacity-60">Approfondimento</h3>
          <h4 className="text-xl font-black text-primary mb-3">Sviluppo e Innovazione</h4>
          <p className="text-on-surface/60 text-xs leading-relaxed mb-4 line-clamp-2">
            La visione tecnologica per far rinascere Venezia partendo dal cuore di Rialto.
          </p>
          <div className="text-primary text-[10px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-widest">
            Apri Progetto <ArrowRight size={12} />
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const Program = () => (
  <section id="programma" className="py-8 bg-surface">
    <div className="max-w-4xl mx-auto px-6">
      <div className="text-center mb-20">
        <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Il Documento Programmatico</h2>
        <h3 className="text-5xl font-black text-on-surface tracking-tighter">Concretezza al Servizio di Venezia</h3>
      </div>
      <div className="space-y-16">
        {[
          {
            id: "1",
            title: "Bilancio e gestione pubblica",
            description: "Rendiamo ogni euro trasparente e lo trasformiamo in servizi."
          },
          {
            id: "2",
            title: "Sicurezza urbana",
            description: "Riorganizziamo la Polizia Locale e rendiamo più sicuri quartieri e spazi pubblici."
          },
          {
            id: "3",
            title: "Lavoro ed economia locale",
            description: "Creiamo lavoro stabile per artigiani, imprese, porto e giovani."
          },
          {
            id: "4",
            title: "Casa, residenza e turismo che rispetta la città",
            description: "Restituiamo le case ai residenti e regoliamo il turismo."
          },
          {
            id: "5",
            title: "Terraferma, Mestre e Marghera – Arsenale, grandi opere e sport",
            description: "Riuniamo laguna e terraferma e rafforziamo gli impianti sportivi esistenti."
          }
        ].map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`group relative flex flex-col md:flex-row gap-8 items-center p-8 rounded-3xl transition-all border border-outline-variant/10 shadow-sm hover:shadow-md ${
              idx % 2 === 0 
                ? "bg-primary/5" 
                : "bg-surface-container-high/50"
            }`}
          >
            <div className={`flex shrink-0 w-14 h-14 rounded-full items-center justify-center text-2xl font-black ${
              idx % 2 === 0 ? "bg-primary text-on-primary" : "bg-tertiary text-on-tertiary"
            }`}>
              {item.id}
            </div>
            <div className="flex-1">
              <h4 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface mb-2">{item.title}</h4>
              <p className="text-lg italic leading-relaxed text-on-surface/70">
                «{item.description}»
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-20 p-10 bg-surface-container-high rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-t-8 border-primary shadow-sm">
        <div className="flex items-center gap-6">
          <FileText className="text-primary" size={48} />
          <div>
            <h5 className="text-xl font-black">Programma Integrale</h5>
            <p className="text-sm text-on-surface/60">Documento completo PDF</p>
          </div>
        </div>
        <a href="/programma-elettorale.pdf" download className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold shadow-lg hover:translate-y-[-2px] transition-all flex items-center gap-2">
          Scarica il Documento
        </a>
      </div>
    </div>
  </section>
);

const CandidateItem = ({ c, isAdmin, onEdit, onDelete }: { key?: string | number, c: Candidate, isAdmin: boolean, onEdit: (c: Candidate) => void, onDelete: (c: Candidate) => Promise<void> }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={c}
      dragListener={false}
      dragControls={dragControls}
      className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 flex items-center gap-4 group"
    >
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-surface-container-high rounded-lg transition-all"
      >
        <GripVertical className="text-on-surface/30 group-hover:text-primary transition-colors" size={20} />
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high shrink-0">
        <img src={getAvatarImg(c.name, c.img)} alt={c.name} className={`w-full h-full ${c.img && !c.img.includes("picsum") && c.img !== "" ? "object-cover" : "object-contain p-4 bg-white"}`} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{c.name}</h4>
        <p className="text-[10px] text-on-surface/70">Posizione: {c.position}</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onEdit(c)}
          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => onDelete(c)}
          className="p-2 hover:bg-error/10 text-error rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Reorder.Item>
  );
};

const CandidateModal = ({ 
  candidate, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  candidate: Partial<Candidate> | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (data: Partial<Candidate>) => Promise<void> 
}) => {
  const [formData, setFormData] = useState<Partial<Candidate>>({
    name: "",
    img: "",
    cvUrl: "",
    cvText: "",
    criminalRecordText: "",
    criminalRecordUrl: "",
    bio: "",
    policies: []
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvProgress, setCvProgress] = useState(0);
  const [uploadingCriminalRecord, setUploadingCriminalRecord] = useState(false);
  const [criminalRecordProgress, setCriminalRecordProgress] = useState(0);

  useEffect(() => {
    if (candidate) {
      setFormData({
        ...candidate,
        policies: candidate.policies || []
      });
    } else {
      setFormData({
        name: "",
        img: "",
        cvUrl: "",
        cvText: "",
        criminalRecordText: "",
        criminalRecordUrl: "",
        bio: "",
        policies: []
      });
    }
  }, [candidate, isOpen]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      try {
        const storageRef = ref(storage, `candidates/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(p));
          },
          (error) => {
            console.error("Upload failed, using local preview:", error);
            setFormData(prev => ({ ...prev, img: base64 }));
            alert("Caricamento cloud fallito, ma puoi vedere l'anteprima locale.");
            setUploading(false);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => ({ ...prev, img: url }));
            setUploading(false);
          }
        );
      } catch (error) {
        console.error("Upload initialization failed:", error);
        setFormData(prev => ({ ...prev, img: base64 }));
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCv(true);
    setCvProgress(0);
    try {
      const storageRef = ref(storage, `cvs/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setCvProgress(Math.round(p));
        },
        (error) => {
          console.error("CV Upload failed", error);
          alert(`Errore caricamento CV: ${error.message}`);
          setUploadingCv(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, cvUrl: url }));
          setUploadingCv(false);
        }
      );
    } catch (error: any) {
      console.error("CV Upload init failed", error);
      alert("Caricamento CV fallito all'avvio.");
      setUploadingCv(false);
    }
  };

  const handleCriminalRecordUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCriminalRecord(true);
    setCriminalRecordProgress(0);
    try {
      const storageRef = ref(storage, `criminal-records/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setCriminalRecordProgress(Math.round(p));
        },
        (error) => {
          console.error("Criminal Record Upload failed", error);
          alert(`Errore caricamento Casellario Giudiziale: ${error.message}`);
          setUploadingCriminalRecord(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, criminalRecordUrl: url }));
          setUploadingCriminalRecord(false);
        }
      );
    } catch (error: any) {
      console.error("Criminal Record Upload init failed", error);
      alert("Caricamento Casellario Giudiziale fallito all'avvio.");
      setUploadingCriminalRecord(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="text-xl font-black">{candidate?.id ? "Modifica Candidato" : "Nuovo Candidato"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">Nome e Cognome</label>
            <input 
              type="text" 
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/20 focus:border-primary outline-none transition-all"
              placeholder="es. Mario Rossi"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">Foto Candidato</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant/20 shrink-0 relative group">
                <img src={formData.img || undefined} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                    <span className="text-[8px] font-bold text-white">{uploadProgress}%</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-all">
                  <Upload size={16} className="text-primary" />
                  <span className="text-sm font-bold">Carica Foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
                <p className="text-[10px] text-on-surface/60">PNG, JPG o WEBP (max 5MB)</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">O inserisci URL Immagine</label>
            <input 
              type="text" 
              value={formData.img || ""}
              onChange={(e) => setFormData({ ...formData, img: e.target.value })}
              className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">Curriculum Vitae (Testo)</label>
            <textarea 
              value={formData.cvText || ""}
              onChange={(e) => setFormData({ ...formData, cvText: e.target.value })}
              className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/20 focus:border-primary outline-none transition-all text-sm min-h-[120px]"
              placeholder="Inserisci il CV del candidato..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">Casellario Giudiziale</label>
            <textarea 
              value={formData.criminalRecordText || ""}
              onChange={(e) => setFormData({ ...formData, criminalRecordText: e.target.value })}
              className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/20 focus:border-primary outline-none transition-all text-sm min-h-[100px]"
              placeholder="Inserisci le informazioni del casellario giudiziale..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">File PDF Casellario Giudiziale</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-all">
                  <Upload size={16} className="text-primary" />
                  <span className="text-sm font-bold">Carica PDF Casellario</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleCriminalRecordUpload} disabled={uploadingCriminalRecord} />
                </label>
                {uploadingCriminalRecord && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                    <span className="text-[10px] font-bold text-primary">{criminalRecordProgress}%</span>
                  </div>
                )}
                {formData.criminalRecordUrl && (
                  <p className="text-[10px] text-green-600 mt-1">PDF caricato con successo</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">Biografia Breve</label>
            <textarea 
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/20 focus:border-primary outline-none transition-all text-sm min-h-[100px]"
              placeholder="Inserisci una breve biografia..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/70 mb-2">Punti Chiave Programma (uno per riga)</label>
            <textarea 
              value={formData.policies?.join("\n") || ""}
              onChange={(e) => setFormData({ ...formData, policies: e.target.value.split("\n").filter(p => p.trim() !== "") })}
              className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/20 focus:border-primary outline-none transition-all text-sm min-h-[100px]"
              placeholder="es. Mobilità sostenibile&#10;Trasparenza amministrativa..."
            />
          </div>
        </div>
        <div className="p-6 bg-surface-container-low flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-bold text-on-surface/60">Annulla</button>
          <button 
            onClick={() => onSave(formData)}
            disabled={uploading || uploadingCv}
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {uploading || uploadingCv ? "Caricamento..." : "Salva"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Function to generate PDF from candidate CV
const generateCandidateCVPDF = (candidate: Candidate) => {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [128, 177, 34]; // #80B122
  const secondaryColor = [33, 28, 108]; // #211C6C
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Curriculum Vitae', 105, 30, { align: 'center' });
  
  // Candidate name
  doc.setFontSize(16);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(candidate.name, 105, 45, { align: 'center' });
  
  // Age if available
  if (candidate.age) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${candidate.age} anni`, 105, 55, { align: 'center' });
  }
  
  let yPosition = 70;
  
  // Bio section
  if (candidate.bio) {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Biografia', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const bioLines = doc.splitTextToSize(candidate.bio, 170);
    doc.text(bioLines, 20, yPosition);
    yPosition += bioLines.length * 5 + 10;
  }
  
  // CV section
  if (candidate.cvText) {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Curriculum Vitae', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const cvLines = doc.splitTextToSize(candidate.cvText, 170);
    doc.text(cvLines, 20, yPosition);
    yPosition += cvLines.length * 5 + 10;
  }
  
  // Criminal Record section
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Casellario Giudiziale', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const criminalRecordText = candidate.criminalRecordText || "Nessuna annotazione presente nel casellario giudiziale.";
  const criminalRecordLines = doc.splitTextToSize(criminalRecordText, 170);
  doc.text(criminalRecordLines, 20, yPosition);
  yPosition += criminalRecordLines.length * 5 + 10;
  
  // Policies section
  if (candidate.policies && candidate.policies.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Punti Chiave del Programma', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    candidate.policies.forEach((policy, index) => {
      const policyLines = doc.splitTextToSize(`${index + 1}. ${policy}`, 160);
      doc.text(policyLines, 25, yPosition);
      yPosition += policyLines.length * 5 + 5;
    });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Pierangelo Del Zotto - Candidato Sindaco di Venezia', 105, pageHeight - 20, { align: 'center' });
  doc.text('Elezioni Comunali 2026', 105, pageHeight - 10, { align: 'center' });
  
  // Save the PDF
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Open in new window
  window.open(pdfUrl, '_blank');
  
  // Download the PDF
  doc.save(`${candidate.name.replace(/\s+/g, '_')}_CV.pdf`);
};
// Funzione per generare il PDF del Casellario Giudiziale
const generateCandidateCasellario = (candidate: Candidate) => {
  const doc = new jsPDF();
  const primaryColor = [128, 177, 34]; // Verde coordinato
  
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Certificato del Casellario Giudiziale', 105, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Candidato: ${candidate.name}`, 105, 45, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);
  
  let yPosition = 70;
  doc.setFontSize(12);
  doc.text('Dichiarazione di trasparenza:', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  const recordText = candidate.criminalRecordText || "Nessuna annotazione presente nel casellario giudiziale alla data odierna.";
  const lines = doc.splitTextToSize(recordText, 170);
  doc.text(lines, 20, yPosition);
  
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento generato ai fini della trasparenza elettorale - Legge 3/2019', 105, pageHeight - 20, { align: 'center' });
  
  window.open(URL.createObjectURL(doc.output('blob')), '_blank');
  doc.save(`${candidate.name.replace(/\s+/g, '_')}_Casellario.pdf`);
};
const CandidateViewModal = ({ candidate, isOpen, onClose }: { candidate: Candidate | null, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen || !candidate) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
          <h3 className="text-xl font-black">Profilo Candidato</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            <div className="w-40 h-40 rounded-3xl overflow-hidden bg-surface-container-high border border-outline-variant/20 shrink-0 shadow-xl">
              <img src={getAvatarImg(candidate.name, candidate.img)} alt={candidate.name} className={`w-full h-full ${candidate.img && !candidate.img.includes("picsum") && candidate.img !== "" ? "object-cover" : "object-contain p-6 bg-white"}`} referrerPolicy="no-referrer" loading="lazy" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-on-surface mb-1 tracking-tighter">{candidate.name}</h4>
              {candidate.age && <p className="text-on-surface/60 text-sm mb-1">{candidate.age} anni</p>}
              <p className="text-primary font-bold uppercase tracking-widest text-xs mb-6">Candidato al Consiglio Comunale</p>
              <div className="flex flex-wrap gap-3">
                {candidate.cvText && (
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                    <FileText size={14} /> CV disponibile
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {candidate.bio && (
              <div>
                <h5 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-primary"></span> Biografia
                </h5>
                <p className="text-gray-900 leading-relaxed text-lg">
                  {candidate.bio}
                </p>
              </div>
            )}

            {candidate.cvText && (
              <div>
                <h5 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-primary"></span> Curriculum Vitae
                </h5>
                <p className="text-gray-900 leading-relaxed whitespace-pre-line">
                  {candidate.cvText}
                </p>
              </div>
            )}

            {candidate.policies && candidate.policies.length > 0 && (
              <div>
                <h5 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-primary"></span> Punti Chiave del Programma
                </h5>
                <div className="grid sm:grid-cols-2 gap-4">
                  {candidate.policies.map((policy, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                      <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                        <CheckCircle2 size={16} className="text-primary" />
                      </div>
                      <p className="text-on-surface/70 font-medium text-sm leading-tight">{policy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-center gap-4">
          {candidate.cvText && (
            <button 
              onClick={() => generateCandidateCVPDF(candidate)}
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <FileText size={18} />
              Scarica CV PDF
            </button>
          )}
          <button 
            onClick={onClose}
            className="bg-on-surface text-surface px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
          >
            Chiudi Profilo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Candidates = ({ user, isAdmin, onLogin, onLogout, devMode }: { user: User | null, isAdmin: boolean, onLogin: () => void, onLogout: () => void, devMode: boolean }) => {
  const [showAll, setShowAll] = useState(true);
  const defaultCandidates: Candidate[] = [
    { name: "Pierangelo Del Zotto", img: "/pierangelo-del-zotto.jpg", age: 72, position: 0, criminalRecordUrl: "/casellari/pierangelo-del-zotto.pdf", cvText: "" },
    { name: "Corrado Callegari", img: "/corrado-callegari.jpg", age: 65, position: 1, criminalRecordUrl: "/casellari/corrado-callegari.pdf", cvText: "Nato nel 1960, vive a Mestre. Dopo un lungo percorso come quadro direttivo nel settore bancario, dove ha lavorato dal 1981 al 2024 (con una pausa in aspettativa dal 2006 al 2013), oggi è pensionato.\n\nHa un diploma di ragioniere e una lunga esperienza politica e amministrativa sul territorio: è stato consigliere di quartiere a Mestre centro dal 2000 al 2005, segretario provinciale di partito dal 2001 al 2011, deputato dal 2008 al 2013. Ha ricoperto incarichi di vertice anche in società partecipate, come amministratore unico di Veneto Agricoltura dal 2006 al 2009 e consigliere di amministrazione di Intermizoo dal 2014 al 2017.\n\nHa svolto il servizio come sottotenente dell'esercito ed è stato presidente di una società di atletica leggera, mantenendo nel tempo un forte legame con il mondo dello sport e dell'associazionismo.\n\nSi candida al Consiglio comunale per mettere a disposizione l'esperienza maturata tra istituzioni, partecipate e territorio, con l'obiettivo di contribuire a una gestione seria e competente del Comune e di sostenere scelte amministrative vicine ai bisogni concreti dei cittadini." },
    { name: "Lucio Gianni", img: "/lucio-gianni.jpg", age: 68, position: 2, criminalRecordUrl: "/casellari/lucio-gianni.pdf", cvText: "Nato a Chioggia (VE) il 21 maggio 1958, diplomato Ragioniere e Perito Commerciale nel 1976/77 presso l'Istituto \"G. Maddalena\" di Adria.\n\nHa svolto il servizio militare nelle truppe Anfibie Lagunari, congedandosi con il grado di Sergente, esperienza che gli ha trasmesso disciplina, spirito di corpo e un forte attaccamento alla tradizione lagunare. Dopo un primo impiego come contabile in un'impresa, ha avviato e sviluppato la propria attività professionale come commercialista, maturando oltre quarant'anni di esperienza nel campo fiscale, amministrativo e societario.\n\nNel corso della sua carriera ha ricoperto diversi incarichi di revisore dei conti e di controllo in enti pubblici e partecipate, occupandosi in particolare di bilanci, gestione delle risorse e corretto utilizzo dei fondi pubblici. È stato, tra gli altri, revisore o componente di organi di controllo di realtà legate al territorio e all'amministrazione locale.\n\nHa svolto funzioni amministrative anche in ambito politico-istituzionale: è stato componente per due mandati del consiglio di amministrazione dell'azienda municipalizzata ASP di Chioggia, vicesindaco di Chioggia con delega al Turismo e assessore provinciale di Venezia alle Attività produttive, Agricoltura, Pro Loco, voga alla veneta, fiere e mercati.\n\nMette questa lunga esperienza professionale e amministrativa a disposizione di Venezia e dei suoi conti pubblici, con l'obiettivo di garantire una gestione rigorosa delle risorse e di fare in modo che ogni euro speso dal Comune torni in servizi concreti ai cittadini. Allo stesso tempo difende l'identità lagunare e il legame con Chioggia e la sua tradizione marinara, convinto che la storia e la cultura del territorio siano la base su cui costruire il futuro della città." },
    { name: "Lucia Baggio", img: "/lucia-baggio.jpg", age: 51, position: 3, criminalRecordUrl: "/casellari/lucia-baggio.pdf", cvText: "Nata a Padova il 24 settembre 1974, residente a Trebaseleghe (PD).\n\nDiplomata analista contabile, con studi universitari in Commercio Estero a Ca' Foscari e formazione in corsi motivazionali, PNL e public speaking.\n\nDopo esperienze come impiegata in Ascom Mestre, Generali e negli uffici giudiziari di Venezia, dal 2001 lavora in autonomia nel settore erboristico e dal 2003 come agente di commercio nelle telecomunicazioni, fino al ruolo di capo area con responsabilità di rete vendita e formazione.\n\nDal 2018 gestisce un CAF-Patronato che offre assistenza fiscale, legale e tributaria, gestione del debito e servizi ai cittadini, in collaborazione con un sindacato datoriale rappresentativo.\n\nDal 2026 affianca attività sindacale, con particolare impegno nelle pratiche di immigrazione e nei tirocini formativi extra UE previsti dalla DGR 296/2015 della Regione Veneto." },
    { name: "Carmine Barbaro", img: "/carmine-barbaro.jpg", age: 82, position: 4, criminalRecordUrl: "/casellari/carmine-barbaro.pdf", cvText: "Nato a Venezia il 28 gennaio 1944, ha lavorato per molti anni come dipendente dell'Enichem di Porto Marghera e come metalmeccanico in diverse imprese, oggi pensionato INPS.\n\nVanta una lunga esperienza nel mondo del calcio giovanile, dove ha allenato ed è stato protagonista nei settori giovanili di Marghera, Oriago, Mogliano, Gazzera Olimpia e Campalto.\n\nSi candida al Consiglio comunale per portare la voce dei quartieri popolari e del mondo dello sport di base, impegnandosi per impianti sportivi curati, spazi sicuri per i giovani e una città che sostenga davvero associazioni e volontari che lavorano ogni giorno con ragazzi e famiglie." },
    { name: "Fabio Bressanello", img: "/fabio-bressanello.jpg", age: 59, position: 5, criminalRecordUrl: "/casellari/fabio-bressanello.pdf", cvText: "Nato a Venezia il 12 settembre 1966, lavora come addetto in una fornace del vetro a Murano, parte della tradizione artigiana che affianca i maestri vetrai nella preparazione, fusione e lavorazione del vetro.\n\nSi candida per portare in Comune la voce dei lavoratori delle fornaci e dell'artigianato veneziano, difendendo un lavoro sicuro e dignitoso e chiedendo che il vetro di Murano continui a essere un cuore produttivo vivo, non solo una cartolina per turisti." },
    { name: "Giulia Buzzo", img: "/giulia-buzzo.jpg", age: 40, position: 6, criminalRecordUrl: "/casellari/giulia-buzzo.pdf", cvText: "40 anni, residente a Favaro, addetta alla ristorazione. Lavora in sala e al banco occupandosi dell'accoglienza dei clienti, del servizio ai tavoli, delle ordinazioni e delle operazioni di cassa, collaborando con la cucina per garantire un servizio rapido e di qualità.\n\nSi candida per portare in Comune l'esperienza di chi lavora nella ristorazione e nel turismo, chiedendo orari e trasporti più compatibili con i turni serali e festivi, più attenzione ai contratti precari e ai diritti di chi ogni giorno tiene aperti bar, ristoranti e locali che fanno vivere la città." },
    { name: "Lorena Della Togna", img: "/lorena-della-togna.jpg", age: 57, position: 7, criminalRecordUrl: "/casellari/lorena-della-togna.pdf", cvText: "Laureata in Storia e Antropologia, ha studiato i processi culturali e sociali che modellano le comunità e le città.\n\nPer 25 anni ha lavorato nei negozi di Piazza San Marco, vivendo ogni giorno il rapporto tra Venezia, i suoi abitanti e il turismo, e conoscendo da vicino difficoltà e potenzialità del centro storico.\n\nÈ direttrice artistica della scuola di danza OdilOdette Danza e Cultura, con cui promuove percorsi artistici, spettacoli e progetti in collaborazione con realtà culturali cittadine.\n\nCoreografa, coordina laboratori che usano la danza come linguaggio di espressione personale, inclusione e crescita per bambini, ragazzi e adulti.\n\nSi candida per portare in Comune lo sguardo di chi lavora nella cultura dal basso: vuole una Venezia che investa in scuole di danza, teatro, musica e associazioni, che apra spazi ai giovani, che consideri l'arte non un lusso ma un servizio pubblico, capace di tenere insieme bellezza, socialità e benessere delle persone." },
    { name: "Luciana Ferretti", img: "/luciana-ferretti-v3.jpg", age: 80, position: 8, criminalRecordUrl: "/casellari/luciana-ferretti.pdf", cvText: "Pensionata, porta con sé l'esperienza e il buon senso di una vita di lavoro e di famiglia.\n\nSi candida per rappresentare in Comune il punto di vista di pensionate e pensionati, chiedendo servizi di prossimità, sanità territoriale più accessibile e una città che non lasci soli gli anziani ma li coinvolga nella vita sociale e nel supporto alle nuove generazioni." },
    { name: "Sonia Franzoi", img: "/sonia-franzoi.jpg", age: 60, position: 9, criminalRecordUrl: "/casellari/sonia-franzoi.pdf", cvText: "Nata a Venezia il 17 dicembre 1965, risiede a Paese (TV).\n\nImpiegata amministrativa con oltre 20 anni di esperienza nel settore metalmeccanico, lavora presso Benetti Roberto e T.D.M. S.r.l.s. dove gestisce segreteria, contabilità generale e rapporti con fornitori, clienti e banche. Diploma Magistrale conseguito nel 1984 presso l'Istituto \"Duca degli Abruzzi\" di Treviso, Corso Operatore Fiscale CGIL.\n\nCoordinatrice della Provincia di Venezia di DSP dal gennaio 2024 al gennaio 2026.\n\nIscritta all'Associazione Popolo Unito, si impegna nella promozione di eventi culturali e sociali per giustizia sociale e diritti civili.\n\nSi candida al Consiglio comunale per mettere a servizio la sua esperienza amministrativa e organizzativa, contribuendo a una gestione comunale concreta e capace di rispondere ai bisogni reali dei veneziani, specialmente nella crisi abitativa che colpisce le famiglie." },
    { name: "Tiziana Fraticelli", img: "/tiziana-fraticelli.jpg", age: 58, position: 10, criminalRecordUrl: "/casellari/tiziana-fraticelli.pdf", cvText: "Residente a Venezia, gestisce un'edicola nel sestiere di San Marco." },
    { name: "Stefano Gabbanoto", img: "/stefano-gabbanoto.jpg", age: 60, position: 11, criminalRecordUrl: "/casellari/stefano-gabbanoto.pdf", cvText: "Già figura di riferimento nel settore del vetro a Murano, dove ha lavorato in fornace a fianco dei maestri vetrai, contribuendo a una delle tradizioni artigiane più preziose di Venezia.\n\nIn seguito è stato gestore di un'edicola, punto di riferimento quotidiano per residenti e pendolari, in un momento in cui le edicole restano uno degli ultimi presìdi di informazione e socialità di quartiere.\n\nPensionato da pochi giorni, si candida per portare in Comune la voce dei lavoratori dell'artigianato e del commercio di vicinato, difendendo le fornaci, le piccole attività e i servizi di prossimità come cuore vivo della città, non come semplici comparse del turismo di massa.\n\nSi candida per portare in Comune la voce di chi ha passato una vita tra fornace e chiosco, difendendo il lavoro artigiano del vetro di Murano e il commercio di vicinato come presìdi di comunità. Vuole una città che tuteli davvero le fornaci storiche, le edicole e le piccole attività, garantendo regole eque, meno burocrazia e più ascolto per chi ogni giorno alza la serranda e tiene vivi i nostri quartieri." },
    { name: "Silvana Gaggio", img: "/silvana-gaggio-v2.jpg", age: 76, position: 12, criminalRecordUrl: "/casellari/silvana-gaggio.pdf", cvText: "Nata a Napoli il 9 maggio 1950, risiede a Venezia Mestre.\n\nPensionata, ha alle spalle una lunga esperienza lavorativa che le ha permesso di conoscere da vicino il mondo del lavoro e le difficoltà quotidiane di molte famiglie. Nel corso degli anni ha affiancato all'impegno professionale una forte attenzione ai temi sociali e alla solidarietà.\n\nÈ presidente di un'associazione di volontariato, ruolo in cui coordina attività di aiuto e sostegno alle persone in difficoltà, promuove iniziative di comunità e mantiene un rapporto costante con il territorio. Questa esperienza le ha dato una conoscenza concreta dei bisogni dei quartieri e delle fragilità sociali.\n\nSi candida al Consiglio comunale per mettere a disposizione il proprio impegno nel volontariato e il proprio radicamento a Mestre, con l'obiettivo di difendere i diritti delle persone più deboli e promuovere politiche sociali vicine alla vita reale dei cittadini." },
    { name: "Martina Galvani", img: "/martina-galvani.jpg", age: 61, position: 13, criminalRecordUrl: "/casellari/martina-galvani.pdf", cvText: "Nata a Venezia il 23/01/1965, residente a Mestre.\n\nEditor, scrittrice, ghostwriter, insegnante di filosofia, formatrice.\n\nLaurea in Filosofia del vecchio ordinamento conseguita a Ca' Foscari. Master in discipline socio-letterarie presso Unicamillus University of Rome con conseguente abilitazione all'insegnamento delle materie letterarie in tutte le scuole di ogni ordine e grado.\n\nQualifica di Counselor gestaltico dopo corso triennale presso Istituto Punto Gestalt Pegasus di Mestre.\n\nDocente di Storia del pensiero occidentale presso Unitre Mestre.\n\nAutrice del saggio: \"La filosofia nelle relazioni di aiuto\" ed. Progetto Cultura, Roma 2024.\n\nVolontaria presso la fondazione Alvise Marotta ETS di Mestre che si occupa di disturbi dell'umore." },
    { name: "Valentina Garoli", img: "/valentina-garoli.jpg", age: 31, position: 14, criminalRecordUrl: "/casellari/valentina-garoli.pdf", cvText: "Nata il 21 aprile 1995, risiede a Mestre.\n\nDopo il diploma tecnico economico conseguito all'istituto Atestino di Este, ha maturato esperienze lavorative in contesti produttivi e logistici: come addetta al finissaggio presso un'azienda di abbigliamento a Vigonza si è occupata di confezionamento, controllo qualità e organizzazione delle attività in base ai carichi di lavoro; come addetta al magazzino per un grande operatore della logistica a Rovigo ha seguito il monitoraggio delle merci, lo stato di conservazione e il riordino degli scaffali secondo procedure aziendali.\n\nNegli ultimi anni ha scelto di orientare il proprio percorso verso l'ambito educativo e socio-assistenziale, formandosi come terapista ABA e tecnico del comportamento e lavorando con famiglie e scuole nel supporto a bambini e ragazzi con bisogni educativi speciali. È considerata una persona flessibile, affidabile, con buone capacità di ascolto, problem solving e attenzione ai dettagli.\n\nSi candida al Consiglio comunale per portare l'esperienza maturata tra lavoro manuale, servizi educativi e sostegno alle famiglie, con l'obiettivo di contribuire a politiche più vicine al mondo del lavoro precario, alla disabilità e ai bisogni reali dei quartieri." },
    { name: "Cristina Giacomazzi", img: "/cristina-giacomazzi.jpg", age: 61, position: 15, criminalRecordUrl: "/casellari/cristina-giacomazzi.pdf", cvText: "Nata a Vicenza nel 1964, vive a Martellago (VE). Lavora come addetta alla vendita nell'isola di Murano per la ditta Giordani snc, attività che svolge da quattro anni.\n\nHa un percorso di studi tecnico-scientifico e ha conseguito l'abilitazione all'insegnamento per la scuola primaria e per le materie di chimica nella scuola superiore.\n\nL'esperienza nel commercio e nella didattica le ha permesso di conoscere da vicino sia il mondo del lavoro che quello della scuola, tra spostamenti quotidiani, esigenze delle famiglie e servizi che funzionano o mancano sui territori.\n\nSi candida al Consiglio comunale per portare attenzione ai problemi concreti di chi ogni giorno lavora, accompagna i figli a scuola e si sposta tra quartieri e comuni, chiedendo trasporti più efficienti e servizi più vicini alle persone." },
    { name: "Marzia Lodoli", img: "/marzia-lodoli.jpg", age: 59, position: 16, criminalRecordUrl: "/casellari/marzia-lodoli.pdf", cvText: "Nata a Noale il 17 marzo 1967, residente a Santa Maria di Sala.\n\nOperaia, con licenza di terza media e corso di operatività commerciale, che le ha permesso di maturare competenze organizzative e di rapporto con il pubblico.\n\nÈ caposquadra di Protezione Civile, ruolo in cui coordina i volontari nelle attività di prevenzione e negli interventi in emergenza a supporto della popolazione." },
    { name: "Vincenzo Marchesi", img: "/vincenzo-marchesi.jpg", age: 73, position: 17, criminalRecordUrl: "/casellari/vincenzo-marchesi.pdf", cvText: "Nato e residente a Este (PD) nel 1952, pensionato e ancora attivo nel lavoro. Da oltre venticinque anni è legale rappresentante e responsabile tecnico di una società di servizi ambientali per enti pubblici e privati, fondata con il padre e il fratello; in passato è stato conducente di scuolabus per il Comune di Este e titolare di una ditta artigiana per lavori con macchine agricole e industriali.\n\nIscritto alla CNA di Este dal 1996, dove ha ricoperto vari incarichi fino alla carica di Presidente Onorario, è stato premiato come \"Imprenditore dell'anno CNA 2021\" per il contributo dato all'economia locale.\n\nSi candida per portare in Comune l'esperienza concreta di artigiano e imprenditore, difendendo chi crea lavoro nei territori e chiedendo regole semplici, burocrazia più leggera e servizi efficienti per piccole imprese, famiglie e lavoratori." },
    { name: "Giuseppe Marzato", img: "/giuseppe-marzato.jpg", age: 62, position: 18, criminalRecordUrl: "/casellari/giuseppe-marzato.pdf", cvText: "Commerciante, gestisce il negozio di tabacchi di famiglia a Mestre. La sua esperienza nel commercio di vicinato lo ha portato a conoscere da vicino le esigenze dei cittadini, delle famiglie e dei quartieri.\n\nSi candida al Consiglio comunale per portare dentro le istituzioni la voce di chi lavora tutti i giorni sulle strade e nelle botteghe della città, con l'obiettivo di valorizzare il commercio locale, difendere il piccolo esercizio di prossimità e sostenere scelte amministrative più vicine alla vita reale dei cittadini." },
    { name: "Patrizia Mel", img: "/patrizia-mel.jpg", age: 74, position: 19, criminalRecordUrl: "/casellari/patrizia-mel.pdf", cvText: "Ha frequentato con profitto i corsi dell'Accademia Cranio Sacrale di Trieste – Upledger Institute, specializzandosi nelle tecniche di CranioSacral Therapy.\n\nHa conseguito il Master in analisi scientifica del comportamento non verbale, organizzato da Neuro ComScience – laboratorio di analisi comportamentale.\n\nHa completato gli anni di medicina presso l'Università di Padova richiesti per l'accesso alla Scuola di Nuova Medicina di Bologna.\n\nÈ in possesso del diploma di linfodrenaggio metodo Vodder e del diploma di tecnica erboristica e antica erboristeria del bacino del Mediterraneo, oltre ad altri corsi di specializzazione per il benessere della persona.\n\nSi candida per portare in Comune la competenza di chi lavora ogni giorno sul benessere globale della persona: vuole una città che ascolti davvero i bisogni fisici e psicologici dei cittadini, che sostenga prevenzione, salute, relazioni di qualità e servizi di prossimità capaci di prendersi cura delle persone nelle diverse fasi della vita." },
    { name: "Christian Omiccioli", img: "/christian-omiccioli.jpg", age: 52, position: 20, criminalRecordUrl: "/casellari/christian-omiccioli.pdf", cvText: "Laureato all'Università Ca' Foscari di Venezia in Tecniche artistiche e dello spettacolo, unisce formazione culturale e esperienza pratica nel mondo del lavoro.\n\nMusicista, ha maturato competenze nella performance e nella produzione artistica, collaborando a progetti legati alla musica dal vivo e alle attività culturali. Parallelamente lavora come impiegato nel settore alberghiero, dove si occupa di accoglienza e servizi agli ospiti, sviluppando capacità organizzative, di relazione con il pubblico e gestione delle situazioni complesse tipiche dell'ospitalità.\n\nSi candida al Consiglio comunale per portare la sensibilità maturata tra cultura e turismo, con l'obiettivo di valorizzare la scena artistica locale, promuovere un turismo più rispettoso della città e rafforzare il legame tra offerta culturale, lavoro giovanile e qualità della vita dei residenti." },
    { name: "Marco Paggiaro", img: "/marco-paggiaro.jpg", age: 39, position: 21, criminalRecordUrl: "/casellari/marco-paggiaro.pdf", cvText: "Nato al Lido di Venezia il 15 novembre 1986, dal 2018 vive a Mestre.\n\nHa frequentato il Liceo scientifico Benedetti a Venezia, dove ha conseguito la maturità nel 2005. Dal febbraio 2006 all'ottobre 2007 ha lavorato come banconiere presso la gelateria Polo Nord, maturando esperienza quotidiana nel rapporto con il pubblico e nella gestione di un'attività commerciale nel cuore di Venezia.\n\nDa novembre 2007 è titolare della gelateria Polo Nord, che gestisce tuttora occupandosi direttamente dell'organizzazione del lavoro, degli acquisti, dei rapporti con i fornitori e dell'accoglienza della clientela, in un equilibrio costante tra turismo e residenti.\n\nSi candida al Consiglio comunale per portare la voce dei piccoli imprenditori e delle attività storiche, difendere il commercio di vicinato e contribuire a politiche che tengano insieme lavoro, residenza e qualità della vita nei quartieri di Venezia e Mestre." },
    { name: "Giovanni Pagotto", img: "/giovanni-pagotto.jpg", age: 36, position: 22, criminalRecordUrl: "/casellari/giovanni-pagotto.pdf", cvText: "Nato a Mestre il 9 settembre 1989, risiede a Marcon (VE).\n\nLavora nel settore assicurativo presso Generali Italia S.p.A., dove si occupa della gestione e del controllo dei fornitori esterni, con particolare attenzione alla verifica della conformità contrattuale al regolamento europeo DORA in materia di resilienza operativa digitale. In precedenza ha svolto un Graduate Program in Risk Management presso la Banca Europea per gli Investimenti, maturando esperienza in ambito corporate, pricing e gestione dei mandati.\n\nHa conseguito una Laurea Magistrale in Studi Europei presso l'Aalborg University e un Master in Politica Energetica in Eurasia alla European University at Saint Petersburg, approfondendo dinamiche economiche, regolatorie e geopolitiche europee.\n\nAtleta di handbike a livello internazionale nel paraciclismo, unisce disciplina sportiva e impegno civile. Si candida al Consiglio comunale per mettere a disposizione competenze su regolazione europea, gestione del rischio e servizi ai cittadini, con particolare attenzione ai temi dell'inclusione e dei diritti delle persone con disabilità." },
    { name: "Anna-Maria Palazzi", img: "/anna-maria-palazzi.jpg", age: 71, position: 23, criminalRecordUrl: "/casellari/anna-maria-palazzi.pdf", cvText: "Nata a Venezia il 13 marzo 1955, risiede a Venezia.\n\nPensionata, ha lavorato come dipendente amministrativa presso l'ULSS 3 Serenissima, maturando una lunga esperienza nella gestione di pratiche e servizi sanitari a contatto con l'utenza. Ha conseguito la maturità e, fin dalla fondazione, è iscritta al movimento Prima il Veneto, condividendone l'impegno per la tutela del territorio e dei cittadini veneti.\n\nÈ consigliera dell'associazione \"Insieme per Venezia – Biblioteca utenti Ospedale Civile Venezia\", realtà attiva nel sostegno ai pazienti e alle loro famiglie, e svolge il ruolo di tesoriera del Centro Diritti Malato di Venezia, occupandosi della gestione amministrativa e del supporto alle attività di difesa dei diritti dei malati.\n\nSi candida al Consiglio comunale per mettere a disposizione l'esperienza maturata nella sanità pubblica e nel volontariato, contribuendo a un Comune più vicino alle persone fragili e ai bisogni quotidiani dei veneziani." },
    { name: "Loris Peltrera", img: "/loris-peltrera.jpg", age: 46, position: 24, criminalRecordUrl: "/casellari/loris-peltrera.pdf", cvText: "Nato a Mestre il 17 agosto 1979, ha conseguito la licenza media e ha intrapreso il percorso nel settore artigianale del vetro, dove oggi è imprenditore.\n\nIn precedenza ha ricoperto il ruolo di responsabile di produzione nel medesimo settore, acquisendo esperienza diretta nella gestione del lavoro, dei processi produttivi e delle maestranze artigiane.\n\nSi candida portando in consiglio comunale la concretezza del mondo dell'artigianato, la conoscenza del territorio e la sensibilità per le imprese, con l'obiettivo di sostenere il lavoro, la produzione locale e le realtà economiche di Mestre." },
    { name: "Simonetta Puppa", img: "/simonetta-puppa.jpg", age: 64, position: 25, criminalRecordUrl: "/casellari/simonetta-puppa.pdf", cvText: "Con formazione classica e lunga esperienza nel mondo della cultura e dell'arte. Dopo gli studi ha lavorato all'ASAC, Archivio Storico delle Arti Contemporanee della Biennale di Venezia, occupandosi di programmazione e redazione cataloghi.\n\nHa proseguito il suo percorso come guida museale a Palazzo Mocenigo e San Stae, come assistente turistica a Venezia e come responsabile per il Gruppo Prospettive, società che allestiva mostre itineranti, sempre a stretto contatto con il pubblico e con il territorio.\n\nPorta in consiglio comunale la sua esperienza culturale, la sensibilità verso artisti, cittadini e turisti, e la volontà di sostenere politiche per la valorizzazione del patrimonio, della divulgazione artistica e di una città più accogliente e accessibile." },
    { name: "Fulvio Savio", img: "/fulvio-savio.jpg", age: 70, position: 26, criminalRecordUrl: "/casellari/fulvio-savio.pdf", cvText: "Ha lavorato per circa dieci anni presso la Fondazione Querini Stampalia, una delle più antiche e prestigiose istituzioni culturali di Venezia, situata nel cuore della città storica.\n\nSuccessivamente è stato autista ACTV sulla tratta Lido–Pellestrina, vivendo ogni giorno il rapporto diretto con residenti, pendolari e studenti che si spostano lungo la linea 11 del trasporto pubblico locale.\n\nOggi pensionato, si candida per portare in Comune l'esperienza di chi ha lavorato sia nella cultura che nel trasporto pubblico, chiedendo servizi efficienti, collegamenti migliori e più attenzione ai bisogni quotidiani di chi vive e lavora tra isole e centro storico." },
    { name: "Giorgio Tana", img: "/giorgio-tana.jpg", age: 83, position: 27, criminalRecordUrl: "/casellari/giorgio-tana.pdf", cvText: "Nato a Venezia/Lido il 24 aprile 1943, oggi pensionato. Nel corso della sua vita professionale e associativa ha maturato una lunga esperienza organizzativa e di rappresentanza.\n\nÈ stato fondatore del Circolo del Personale della Comit di Venezia e per molti anni organizzatore dei Campionati Nazionali di Sci della Comit. Ha inoltre ricoperto per 14 anni il ruolo di selezionatore e caposquadra dell'ex Banca Commerciale Italiana per i Campionati Europei Interbancari.\n\nNel suo percorso ha svolto anche incarichi di carattere istituzionale, come consigliere dell'Istituto Santa Maria della Pietà di Venezia per cinque anni e presidente, per un mandato, dell'ESU di Venezia, ente per il diritto allo studio.\n\nSi candida mettendo a disposizione della comunità l'esperienza maturata in ambito organizzativo, associativo e amministrativo, con l'obiettivo di contribuire con serietà e senso delle istituzioni alla vita pubblica cittadina." },
    { name: "Roberta Travaglia", img: "/roberta-travaglia.jpg", age: 60, position: 28, criminalRecordUrl: "/casellari/roberta-travaglia.pdf", cvText: "Nata a Este (PD) l'11 settembre 1965, risiede a Este.\n\nDiplomata addetta alla contabilità d'azienda e successivamente ragioniera e perito commerciale, si è iscritta nel 1992 al Ruolo Periti ed Esperti della Camera di Commercio di Padova come perito ed esperto tributario. Dopo un'esperienza iniziale come collaboratrice in uno studio di consulenza fiscale, dal 1993 al 2023 è stata socia dello Studio PET – Centro Elaborazione Dati Travaglia Roberta & C. S.a.s. a Ospedaletto Euganeo, occupandosi di consulenza fiscale, contabilità, documentazione tributaria e pratiche amministrative per imprese e cittadini.\n\nHa una lunga storia di impegno politico e civile: candidata al Consiglio comunale di Este nel 2016 con \"Prima il Veneto\", candidata alla Camera dei Deputati nel 2018 per \"Grande Nord\" (Padova), attivista per \"Prima il Veneto\" e \"Grande Nord Veneto\", dove ha gestito anche parte della comunicazione dei movimenti.\n\nSi candida al Consiglio comunale portando l'esperienza di professionista dei conti pubblici e delle piccole imprese, con l'obiettivo di promuovere una gestione trasparente delle risorse, vicina a artigiani, commercianti e famiglie." },
    { name: "Fiorella Trevisan", img: "/fiorella-trevisan.jpg", age: 59, position: 29, criminalRecordUrl: "/casellari/fiorella-trevisan.pdf", cvText: "Autista di mezzi pubblici a Venezia, abituata ogni giorno a muoversi tra le esigenze concrete di cittadini, studenti e lavoratori.\n\nAppassionata di running e di podismo, pratica regolarmente la corsa come momento di benessere e disciplina personale.\n\nÈ inoltre felice allevatrice di gatti, impegnata con passione nella cura degli animali e attenta al loro benessere." },
    { name: "Giorgio Tronca", img: "/giorgio-tronca.jpg", age: 58, position: 30, criminalRecordUrl: "/casellari/giorgio-tronca.pdf", cvText: "Nato a Vicenza il 9 ottobre 1967, risiede ad Arcugnano (VI).\n\nImpiegato tecnico presso Pietro Fiorentini S.p.A., azienda attiva negli impianti di distribuzione del gas metano, dove si occupa di controllo qualità. Il suo lavoro riguarda il controllo e l'approvazione dei materiali di costruzione e di produzione, garantendo standard elevati di sicurezza e affidabilità. Diplomato geometra, ha completato la propria formazione con la qualifica di ispettore di qualità, consolidando una solida competenza tecnica.\n\nHa svolto due mandati nell'amministrazione comunale di Arcugnano, maturando esperienza diretta nelle dinamiche istituzionali e nella gestione della cosa pubblica. Invalidato sul lavoro a seguito di un trauma nel 1990, è socio e per molti anni ha amministrato la sezione vicentina dell'ANMIL, portando avanti la tutela dei diritti dei lavoratori infortunati e delle persone più fragili. Figlio di un ex internato, unisce alla sua storia personale una forte sensibilità per la memoria e la giustizia sociale.\n\nSi candida al Consiglio comunale per mettere a disposizione la propria esperienza amministrativa e la propria attenzione al sociale, con l'obiettivo di difendere i diritti dei lavoratori, delle persone con disabilità e delle loro famiglie." },
    { name: "Ivana Varagnolo", img: "/ivana-varagnolo.jpg", age: 52, position: 31, criminalRecordUrl: "/casellari/ivana-varagnolo.pdf", cvText: "Nata il 2 luglio 1973, vive a Spinea (VE). Diplomata al CIF di Venezia come addetta alla contabilità aziendale.\n\nHa lavorato per molti anni come segretaria e addetta alla contabilità, gestendo pratiche amministrative, documenti e attività di ufficio in diversi contesti, sia con contratti stabili sia a termine.\n\nSi candida per mettere la sua esperienza amministrativa al servizio del Comune: vuole uffici più organizzati, pratiche più semplici per cittadini e imprese, sportelli che rispondano davvero e un'attenzione particolare a chi ha contratti precari o lavori discontinui ma tiene in piedi ogni giorno la macchina dei servizi." },
    { name: "Francesco Vianello", img: "/francesco-vianello.jpg", age: 48, position: 32, criminalRecordUrl: "/casellari/francesco-vianello.pdf", cvText: "Nato a Venezia il 3 settembre 1977, risiede a Mestre.\n\nInsegnante di scuola superiore statale, dipendente a tempo determinato del Ministero dell'Istruzione. Dopo una prima esperienza dal 2002 al 2007 come responsabile di servizio presso Acque del Basso Livenza SpA, ha lavorato dal 2007 al 2012 come agente di commercio, consulente e formatore per diverse realtà del settore chimico e formativo. Dal 2012 insegna matematica, fisica, chimica, biologia e sostegno ad alunni con disabilità presso scuole pubbliche, con una conoscenza diretta dei bisogni degli studenti e delle famiglie.\n\nLaureato a ciclo unico in Chimica Industriale nel 2002 presso l'Università Ca' Foscari di Venezia, collabora con l'associazione culturale di insegnanti \"Il Gessetto.com\", impegnata nella riflessione sulla scuola e sulle politiche educative. Le sue competenze principali riguardano welfare, scuola, servizi comunali, ambiente e servizi sociali.\n\nSi candida al Consiglio comunale per mettere a disposizione l'esperienza maturata tra scuola, servizi pubblici e associazionismo, con l'obiettivo di rafforzare i servizi educativi, sociali e ambientali a favore delle famiglie veneziane." },
    { name: "Michele Vio", img: "/michele-vio.jpg", age: 60, position: 33, criminalRecordUrl: "/casellari/michele-vio.pdf", cvText: "Vive a Mestre ed è un artigiano e taxista profondamente legato alla città. Il suo lavoro lo porta ogni giorno a conoscere i quartieri, le famiglie e le sfide concrete della vita quotidiana di chi qui vive e lavora.\n\nLa sua presenza nel progetto per il Consiglio comunale nasce proprio dalla volontà di far entrare dentro le istituzioni il punto di vista di chi conosce Mestre non da palazzo, ma dalla strada: chi alle 5 del mattino è già in giro, chi porta a casa un lavoro onesto, chi vede crescere i problemi prima che diventino vertici di palazzo.\n\nSi candida al Consiglio comunale per rappresentare la voce di chi lavora, per portare un'esperienza diretta nelle decisioni amministrative e per garantire che le scelte del Comune siano sempre vicine ai bisogni reali dei cittadini." },
    { name: "Laura Zaniol", img: "/laura-zaniol.jpg", age: 60, position: 34, criminalRecordUrl: "/casellari/laura-zaniol.pdf", cvText: "Nata a Venezia il 9 luglio 1965 e residente al Lido, proviene da una famiglia di Murano e ha una formazione artistica e creativa. Dopo il Liceo Artistico di Venezia e il diploma di designer di gioielli, ha lasciato l'università di Architettura per dedicarsi al design e ha aperto un'attività a Murano, collaborando con prestigiosi stilisti degli anni Novanta.\n\nAccanto al lavoro ha praticato il volontariato in diverse associazioni e oggi si dedica anche al wellness e al pilates, come fonte di equilibrio personale. Porta nel progetto di candidatura sensibilità, creatività e attenzione alla qualità della vita delle persone." },
    { name: "Gianfranco Zennaro", img: "/gianfranco-zennaro.jpg", age: 71, position: 35, criminalRecordUrl: "/casellari/gianfranco-zennaro.pdf", cvText: "Artigiano, oggi in pensione.\n\nHa maturato nel corso della vita una solida esperienza nel lavoro artigiano, sviluppando concretezza, serietà e attenzione alle esigenze quotidiane delle persone.\n\nÈ cultore della voga e del disegno artistico, passioni che esprimono il suo forte legame con la tradizione, la cultura e l'identità del territorio.\n\nÈ inoltre sostenitore di AVAPO, a conferma della sua sensibilità verso il volontariato e l'impegno sociale a favore delle persone più fragili." },
  ];

  const [candidates, setCandidates] = useState<Candidate[]>(defaultCandidates);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Partial<Candidate> | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "candidates"), orderBy("position", "asc"));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
      if (data.length > 0) {
        // Merge: code defaults are authoritative for name, img, position, cvText
        const merged = defaultCandidates.map(def => {
          const fb = data.find(d => d.name === def.name);
          return {
            ...def,
            ...(fb?.id ? { id: fb.id } : {}),
            img: def.img,
            cvText: def.cvText || (fb?.cvText ?? ""),
          };
        });
        setCandidates(merged);
        localStorage.setItem("candidates", JSON.stringify(merged));
      } else {
        setCandidates(defaultCandidates);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      const local = localStorage.getItem("candidates");
      if (local) {
        setCandidates(JSON.parse(local));
      }
      setLoading(false);
    });

    return () => {
      unsubscribeDocs();
    };
  }, []);

  const initializeData = async () => {
    if (!isAdmin) return;
    const initialData = [
      { name: "Corrado Callegari", img: "/corrado-callegari.jpg", age: 65, position: 1, cvText: "Nato nel 1960, vive a Mestre. Dopo un lungo percorso come quadro direttivo nel settore bancario, dove ha lavorato dal 1981 al 2024 (con una pausa in aspettativa dal 2006 al 2013), oggi è pensionato.\n\nHa un diploma di ragioniere e una lunga esperienza politica e amministrativa sul territorio: è stato consigliere di quartiere a Mestre centro dal 2000 al 2005, segretario provinciale di partito dal 2001 al 2011, deputato dal 2008 al 2013. Ha ricoperto incarichi di vertice anche in società partecipate, come amministratore unico di Veneto Agricoltura dal 2006 al 2009 e consigliere di amministrazione di Intermizoo dal 2014 al 2017.\n\nHa svolto il servizio come sottotenente dell'esercito ed è stato presidente di una società di atletica leggera, mantenendo nel tempo un forte legame con il mondo dello sport e dell'associazionismo.\n\nSi candida al Consiglio comunale per mettere a disposizione l'esperienza maturata tra istituzioni, partecipate e territorio, con l'obiettivo di contribuire a una gestione seria e competente del Comune e di sostenere scelte amministrative vicine ai bisogni concreti dei cittadini." },
      { name: "Lucio Gianni", img: "/lucio-gianni.jpg", age: 68, position: 2, cvText: "Nato a Chioggia (VE) il 21 maggio 1958, diplomato Ragioniere e Perito Commerciale nel 1976/77 presso l'Istituto \"G. Maddalena\" di Adria.\n\nHa svolto il servizio militare nelle truppe Anfibie Lagunari, congedandosi con il grado di Sergente, esperienza che gli ha trasmesso disciplina, spirito di corpo e un forte attaccamento alla tradizione lagunare. Dopo un primo impiego come contabile in un'impresa, ha avviato e sviluppato la propria attività professionale come commercialista, maturando oltre quarant'anni di esperienza nel campo fiscale, amministrativo e societario.\n\nNel corso della sua carriera ha ricoperto diversi incarichi di revisore dei conti e di controllo in enti pubblici e partecipate, occupandosi in particolare di bilanci, gestione delle risorse e corretto utilizzo dei fondi pubblici. È stato, tra gli altri, revisore o componente di organi di controllo di realtà legate al territorio e all'amministrazione locale.\n\nHa svolto funzioni amministrative anche in ambito politico-istituzionale: è stato componente per due mandati del consiglio di amministrazione dell'azienda municipalizzata ASP di Chioggia, vicesindaco di Chioggia con delega al Turismo e assessore provinciale di Venezia alle Attività produttive, Agricoltura, Pro Loco, voga alla veneta, fiere e mercati.\n\nMette questa lunga esperienza professionale e amministrativa a disposizione di Venezia e dei suoi conti pubblici, con l'obiettivo di garantire una gestione rigorosa delle risorse e di fare in modo che ogni euro speso dal Comune torni in servizi concreti ai cittadini. Allo stesso tempo difende l'identità lagunare e il legame con Chioggia e la sua tradizione marinara, convinto che la storia e la cultura del territorio siano la base su cui costruire il futuro della città." },
      { name: "Lucia Baggio", img: "/lucia-baggio.jpg", age: 51, position: 4, cvText: "Nata a Padova il 24 settembre 1974, residente a Trebaseleghe (PD).\n\nDiplomata analista contabile, con studi universitari in Commercio Estero a Ca' Foscari e formazione in corsi motivazionali, PNL e public speaking.\n\nDopo esperienze come impiegata in Ascom Mestre, Generali e negli uffici giudiziari di Venezia, dal 2001 lavora in autonomia nel settore erboristico e dal 2003 come agente di commercio nelle telecomunicazioni, fino al ruolo di capo area con responsabilità di rete vendita e formazione.\n\nDal 2018 gestisce un CAF-Patronato che offre assistenza fiscale, legale e tributaria, gestione del debito e servizi ai cittadini, in collaborazione con un sindacato datoriale rappresentativo.\n\nDal 2026 affianca attività sindacale, con particolare impegno nelle pratiche di immigrazione e nei tirocini formativi extra UE previsti dalla DGR 296/2015 della Regione Veneto." },
      { name: "Carmine Barbaro", img: "/carmine-barbaro.jpg", age: 82, position: 5, cvText: "Nato a Venezia il 28 gennaio 1944, ha lavorato per molti anni come dipendente dell'Enichem di Porto Marghera e come metalmeccanico in diverse imprese, oggi pensionato INPS.\n\nVanta una lunga esperienza nel mondo del calcio giovanile, dove ha allenato ed è stato protagonista nei settori giovanili di Marghera, Oriago, Mogliano, Gazzera Olimpia e Campalto.\n\nSi candida al Consiglio comunale per portare la voce dei quartieri popolari e del mondo dello sport di base, impegnandosi per impianti sportivi curati, spazi sicuri per i giovani e una città che sostenga davvero associazioni e volontari che lavorano ogni giorno con ragazzi e famiglie." },
      { name: "Fabio Bressanello", img: "/fabio-bressanello.jpg", age: 59, position: 6, cvText: "Nato a Venezia il 12 settembre 1966, lavora come addetto in una fornace del vetro a Murano, parte della tradizione artigiana che affianca i maestri vetrai nella preparazione, fusione e lavorazione del vetro.\n\nSi candida per portare in Comune la voce dei lavoratori delle fornaci e dell'artigianato veneziano, difendendo un lavoro sicuro e dignitoso e chiedendo che il vetro di Murano continui a essere un cuore produttivo vivo, non solo una cartolina per turisti." },
      { name: "Giulia Buzzo", img: "/giulia-buzzo.jpg", age: 40, position: 7, cvText: "40 anni, residente a Favaro, addetta alla ristorazione. Lavora in sala e al banco occupandosi dell'accoglienza dei clienti, del servizio ai tavoli, delle ordinazioni e delle operazioni di cassa, collaborando con la cucina per garantire un servizio rapido e di qualità.\n\nSi candida per portare in Comune l'esperienza di chi lavora nella ristorazione e nel turismo, chiedendo orari e trasporti più compatibili con i turni serali e festivi, più attenzione ai contratti precari e ai diritti di chi ogni giorno tiene aperti bar, ristoranti e locali che fanno vivere la città." },
      { name: "Lorena Della Togna", img: "/lorena-della-togna.jpg", age: 57, position: 8, cvText: "Laureata in Storia e Antropologia, ha studiato i processi culturali e sociali che modellano le comunità e le città.\n\nPer 25 anni ha lavorato nei negozi di Piazza San Marco, vivendo ogni giorno il rapporto tra Venezia, i suoi abitanti e il turismo, e conoscendo da vicino difficoltà e potenzialità del centro storico.\n\nÈ direttrice artistica della scuola di danza OdilOdette Danza e Cultura, con cui promuove percorsi artistici, spettacoli e progetti in collaborazione con realtà culturali cittadine.\n\nCoreografa, coordina laboratori che usano la danza come linguaggio di espressione personale, inclusione e crescita per bambini, ragazzi e adulti.\n\nSi candida per portare in Comune lo sguardo di chi lavora nella cultura dal basso: vuole una Venezia che investa in scuole di danza, teatro, musica e associazioni, che apra spazi ai giovani, che consideri l'arte non un lusso ma un servizio pubblico, capace di tenere insieme bellezza, socialità e benessere delle persone." },
      { name: "Luciana Ferretti", img: "/luciana-ferretti-v3.jpg", age: 80, position: 9, cvText: "Pensionata, porta con sé l'esperienza e il buon senso di una vita di lavoro e di famiglia.\n\nSi candida per rappresentare in Comune il punto di vista di pensionate e pensionati, chiedendo servizi di prossimità, sanità territoriale più accessibile e una città che non lasci soli gli anziani ma li coinvolga nella vita sociale e nel supporto alle nuove generazioni." },
      { name: "Sonia Franzoi", img: "/sonia-franzoi.jpg", age: 60, position: 10, cvText: "Nata a Venezia il 17 dicembre 1965, risiede a Paese (TV).\n\nImpiegata amministrativa con oltre 20 anni di esperienza nel settore metalmeccanico, lavora presso Benetti Roberto e T.D.M. S.r.l.s. dove gestisce segreteria, contabilità generale e rapporti con fornitori, clienti e banche. Diploma Magistrale conseguito nel 1984 presso l'Istituto \"Duca degli Abruzzi\" di Treviso, Corso Operatore Fiscale CGIL.\n\nCoordinatrice della Provincia di Venezia di DSP dal gennaio 2024 al gennaio 2026.\n\nIscritta all'Associazione Popolo Unito, si impegna nella promozione di eventi culturali e sociali per giustizia sociale e diritti civili.\n\nSi candida al Consiglio comunale per mettere a servizio la sua esperienza amministrativa e organizzativa, contribuendo a una gestione comunale concreta e capace di rispondere ai bisogni reali dei veneziani, specialmente nella crisi abitativa che colpisce le famiglie." },
      { name: "Tiziana Fraticelli", img: "/tiziana-fraticelli.jpg", age: 58, position: 11, cvText: "Residente a Venezia, gestisce un'edicola nel sestiere di San Marco." },
      { name: "Stefano Gabbanoto", img: "/stefano-gabbanoto.jpg", age: 60, position: 12, cvText: "Già figura di riferimento nel settore del vetro a Murano, dove ha lavorato in fornace a fianco dei maestri vetrai, contribuendo a una delle tradizioni artigiane più preziose di Venezia.\n\nIn seguito è stato gestore di un'edicola, punto di riferimento quotidiano per residenti e pendolari, in un momento in cui le edicole restano uno degli ultimi presìdi di informazione e socialità di quartiere.\n\nPensionato da pochi giorni, si candida per portare in Comune la voce dei lavoratori dell'artigianato e del commercio di vicinato, difendendo le fornaci, le piccole attività e i servizi di prossimità come cuore vivo della città, non come semplici comparse del turismo di massa.\n\nSi candida per portare in Comune la voce di chi ha passato una vita tra fornace e chiosco, difendendo il lavoro artigiano del vetro di Murano e il commercio di vicinato come presìdi di comunità. Vuole una città che tuteli davvero le fornaci storiche, le edicole e le piccole attività, garantendo regole eque, meno burocrazia e più ascolto per chi ogni giorno alza la serranda e tiene vivi i nostri quartieri." },
      { name: "Silvana Gaggio", img: "/silvana-gaggio-v2.jpg", age: 76, position: 13, cvText: "Nata a Napoli il 9 maggio 1950, risiede a Venezia Mestre.\n\nPensionata, ha alle spalle una lunga esperienza lavorativa che le ha permesso di conoscere da vicino il mondo del lavoro e le difficoltà quotidiane di molte famiglie. Nel corso degli anni ha affiancato all'impegno professionale una forte attenzione ai temi sociali e alla solidarietà.\n\nÈ presidente di un'associazione di volontariato, ruolo in cui coordina attività di aiuto e sostegno alle persone in difficoltà, promuove iniziative di comunità e mantiene un rapporto costante con il territorio. Questa esperienza le ha dato una conoscenza concreta dei bisogni dei quartieri e delle fragilità sociali.\n\nSi candida al Consiglio comunale per mettere a disposizione il proprio impegno nel volontariato e il proprio radicamento a Mestre, con l'obiettivo di difendere i diritti delle persone più deboli e promuovere politiche sociali vicine alla vita reale dei cittadini." },
      { name: "Martina Galvani", img: "/martina-galvani.jpg", age: 61, position: 14, cvText: "Nata a Venezia il 23/01/1965, residente a Mestre.\n\nEditor, scrittrice, ghostwriter, insegnante di filosofia, formatrice.\n\nLaurea in Filosofia del vecchio ordinamento conseguita a Ca' Foscari. Master in discipline socio-letterarie presso Unicamillus University of Rome con conseguente abilitazione all'insegnamento delle materie letterarie in tutte le scuole di ogni ordine e grado.\n\nQualifica di Counselor gestaltico dopo corso triennale presso Istituto Punto Gestalt Pegasus di Mestre.\n\nDocente di Storia del pensiero occidentale presso Unitre Mestre.\n\nAutrice del saggio: \"La filosofia nelle relazioni di aiuto\" ed. Progetto Cultura, Roma 2024.\n\nVolontaria presso la fondazione Alvise Marotta ETS di Mestre che si occupa di disturbi dell'umore." },
      { name: "Valentina Garoli", img: "/valentina-garoli.jpg", age: 31, position: 15, cvText: "Nata il 21 aprile 1995, risiede a Mestre.\n\nDopo il diploma tecnico economico conseguito all'istituto Atestino di Este, ha maturato esperienze lavorative in contesti produttivi e logistici: come addetta al finissaggio presso un'azienda di abbigliamento a Vigonza si è occupata di confezionamento, controllo qualità e organizzazione delle attività in base ai carichi di lavoro; come addetta al magazzino per un grande operatore della logistica a Rovigo ha seguito il monitoraggio delle merci, lo stato di conservazione e il riordino degli scaffali secondo procedure aziendali.\n\nNegli ultimi anni ha scelto di orientare il proprio percorso verso l'ambito educativo e socio-assistenziale, formandosi come terapista ABA e tecnico del comportamento e lavorando con famiglie e scuole nel supporto a bambini e ragazzi con bisogni educativi speciali. È considerata una persona flessibile, affidabile, con buone capacità di ascolto, problem solving e attenzione ai dettagli.\n\nSi candida al Consiglio comunale per portare l'esperienza maturata tra lavoro manuale, servizi educativi e sostegno alle famiglie, con l'obiettivo di contribuire a politiche più vicine al mondo del lavoro precario, alla disabilità e ai bisogni reali dei quartieri." },
      { name: "Cristina Giacomazzi", img: "/cristina-giacomazzi.jpg", age: 61, position: 16, cvText: "Nata a Vicenza nel 1964, vive a Martellago (VE). Lavora come addetta alla vendita nell'isola di Murano per la ditta Giordani snc, attività che svolge da quattro anni.\n\nHa un percorso di studi tecnico-scientifico e ha conseguito l'abilitazione all'insegnamento per la scuola primaria e per le materie di chimica nella scuola superiore.\n\nL'esperienza nel commercio e nella didattica le ha permesso di conoscere da vicino sia il mondo del lavoro che quello della scuola, tra spostamenti quotidiani, esigenze delle famiglie e servizi che funzionano o mancano sui territori.\n\nSi candida al Consiglio comunale per portare attenzione ai problemi concreti di chi ogni giorno lavora, accompagna i figli a scuola e si sposta tra quartieri e comuni, chiedendo trasporti più efficienti e servizi più vicini alle persone." },
      { name: "Marzia Lodoli", img: "/marzia-lodoli.jpg", age: 59, position: 17, cvText: "Nata a Noale il 17 marzo 1967, residente a Santa Maria di Sala.\n\nOperaia, con licenza di terza media e corso di operatività commerciale, che le ha permesso di maturare competenze organizzative e di rapporto con il pubblico.\n\nÈ caposquadra di Protezione Civile, ruolo in cui coordina i volontari nelle attività di prevenzione e negli interventi in emergenza a supporto della popolazione." },
      { name: "Vincenzo Marchesi", img: "/vincenzo-marchesi.jpg", age: 73, position: 18, cvText: "Nato e residente a Este (PD) nel 1952, pensionato e ancora attivo nel lavoro. Da oltre venticinque anni è legale rappresentante e responsabile tecnico di una società di servizi ambientali per enti pubblici e privati, fondata con il padre e il fratello; in passato è stato conducente di scuolabus per il Comune di Este e titolare di una ditta artigiana per lavori con macchine agricole e industriali.\n\nIscritto alla CNA di Este dal 1996, dove ha ricoperto vari incarichi fino alla carica di Presidente Onorario, è stato premiato come \"Imprenditore dell'anno CNA 2021\" per il contributo dato all'economia locale.\n\nSi candida per portare in Comune l'esperienza concreta di artigiano e imprenditore, difendendo chi crea lavoro nei territori e chiedendo regole semplici, burocrazia più leggera e servizi efficienti per piccole imprese, famiglie e lavoratori." },
      { name: "Giuseppe Marzato", img: "/giuseppe-marzato.jpg", age: 62, position: 19, cvText: "Commerciante, gestisce il negozio di tabacchi di famiglia a Mestre. La sua esperienza nel commercio di vicinato lo ha portato a conoscere da vicino le esigenze dei cittadini, delle famiglie e dei quartieri.\n\nSi candida al Consiglio comunale per portare dentro le istituzioni la voce di chi lavora tutti i giorni sulle strade e nelle botteghe della città, con l'obiettivo di valorizzare il commercio locale, difendere il piccolo esercizio di prossimità e sostenere scelte amministrative più vicine alla vita reale dei cittadini." },
      { name: "Patrizia Mel", img: "/patrizia-mel.jpg", age: 74, position: 20, cvText: "Ha frequentato con profitto i corsi dell'Accademia Cranio Sacrale di Trieste – Upledger Institute, specializzandosi nelle tecniche di CranioSacral Therapy.\n\nHa conseguito il Master in analisi scientifica del comportamento non verbale, organizzato da Neuro ComScience – laboratorio di analisi comportamentale.\n\nHa completato gli anni di medicina presso l'Università di Padova richiesti per l'accesso alla Scuola di Nuova Medicina di Bologna.\n\nÈ in possesso del diploma di linfodrenaggio metodo Vodder e del diploma di tecnica erboristica e antica erboristeria del bacino del Mediterraneo, oltre ad altri corsi di specializzazione per il benessere della persona.\n\nSi candida per portare in Comune la competenza di chi lavora ogni giorno sul benessere globale della persona: vuole una città che ascolti davvero i bisogni fisici e psicologici dei cittadini, che sostenga prevenzione, salute, relazioni di qualità e servizi di prossimità capaci di prendersi cura delle persone nelle diverse fasi della vita." },
      { name: "Christian Omiccioli", img: "/christian-omiccioli.jpg", age: 52, position: 21, cvText: "Laureato all'Università Ca' Foscari di Venezia in Tecniche artistiche e dello spettacolo, unisce formazione culturale e esperienza pratica nel mondo del lavoro.\n\nMusicista, ha maturato competenze nella performance e nella produzione artistica, collaborando a progetti legati alla musica dal vivo e alle attività culturali. Parallelamente lavora come impiegato nel settore alberghiero, dove si occupa di accoglienza e servizi agli ospiti, sviluppando capacità organizzative, di relazione con il pubblico e gestione delle situazioni complesse tipiche dell'ospitalità.\n\nSi candida al Consiglio comunale per portare la sensibilità maturata tra cultura e turismo, con l'obiettivo di valorizzare la scena artistica locale, promuovere un turismo più rispettoso della città e rafforzare il legame tra offerta culturale, lavoro giovanile e qualità della vita dei residenti." },
      { name: "Marco Paggiaro", img: "/marco-paggiaro.jpg", age: 39, position: 22, cvText: "Nato al Lido di Venezia il 15 novembre 1986, dal 2018 vive a Mestre.\n\nHa frequentato il Liceo scientifico Benedetti a Venezia, dove ha conseguito la maturità nel 2005. Dal febbraio 2006 all'ottobre 2007 ha lavorato come banconiere presso la gelateria Polo Nord, maturando esperienza quotidiana nel rapporto con il pubblico e nella gestione di un'attività commerciale nel cuore di Venezia.\n\nDa novembre 2007 è titolare della gelateria Polo Nord, che gestisce tuttora occupandosi direttamente dell'organizzazione del lavoro, degli acquisti, dei rapporti con i fornitori e dell'accoglienza della clientela, in un equilibrio costante tra turismo e residenti.\n\nSi candida al Consiglio comunale per portare la voce dei piccoli imprenditori e delle attività storiche, difendere il commercio di vicinato e contribuire a politiche che tengano insieme lavoro, residenza e qualità della vita nei quartieri di Venezia e Mestre." },
      { name: "Giovanni Pagotto", img: "/giovanni-pagotto.jpg", age: 36, position: 23, cvText: "Nato a Mestre il 9 settembre 1989, risiede a Marcon (VE).\n\nLavora nel settore assicurativo presso Generali Italia S.p.A., dove si occupa della gestione e del controllo dei fornitori esterni, con particolare attenzione alla verifica della conformità contrattuale al regolamento europeo DORA in materia di resilienza operativa digitale. In precedenza ha svolto un Graduate Program in Risk Management presso la Banca Europea per gli Investimenti, maturando esperienza in ambito corporate, pricing e gestione dei mandati.\n\nHa conseguito una Laurea Magistrale in Studi Europei presso l'Aalborg University e un Master in Politica Energetica in Eurasia alla European University at Saint Petersburg, approfondendo dinamiche economiche, regolatorie e geopolitiche europee.\n\nAtleta di handbike a livello internazionale nel paraciclismo, unisce disciplina sportiva e impegno civile. Si candida al Consiglio comunale per mettere a disposizione competenze su regolazione europea, gestione del rischio e servizi ai cittadini, con particolare attenzione ai temi dell'inclusione e dei diritti delle persone con disabilità." },
      { name: "Anna-Maria Palazzi", img: "/anna-maria-palazzi.jpg", age: 71, position: 24, cvText: "Nata a Venezia il 13 marzo 1955, risiede a Venezia.\n\nPensionata, ha lavorato come dipendente amministrativa presso l'ULSS 3 Serenissima, maturando una lunga esperienza nella gestione di pratiche e servizi sanitari a contatto con l'utenza. Ha conseguito la maturità e, fin dalla fondazione, è iscritta al movimento Prima il Veneto, condividendone l'impegno per la tutela del territorio e dei cittadini veneti.\n\nÈ consigliera dell'associazione \"Insieme per Venezia – Biblioteca utenti Ospedale Civile Venezia\", realtà attiva nel sostegno ai pazienti e alle loro famiglie, e svolge il ruolo di tesoriera del Centro Diritti Malato di Venezia, occupandosi della gestione amministrativa e del supporto alle attività di difesa dei diritti dei malati.\n\nSi candida al Consiglio comunale per mettere a disposizione l'esperienza maturata nella sanità pubblica e nel volontariato, contribuendo a un Comune più vicino alle persone fragili e ai bisogni quotidiani dei veneziani." },
      { name: "Loris Peltrera", img: "/loris-peltrera.jpg", age: 46, position: 25, cvText: "Nato a Mestre il 17 agosto 1979, ha conseguito la licenza media e ha intrapreso il percorso nel settore artigianale del vetro, dove oggi è imprenditore.\n\nIn precedenza ha ricoperto il ruolo di responsabile di produzione nel medesimo settore, acquisendo esperienza diretta nella gestione del lavoro, dei processi produttivi e delle maestranze artigiane.\n\nSi candida portando in consiglio comunale la concretezza del mondo dell'artigianato, la conoscenza del territorio e la sensibilità per le imprese, con l'obiettivo di sostenere il lavoro, la produzione locale e le realtà economiche di Mestre." },
      { name: "Simonetta Puppa", img: "/simonetta-puppa.jpg", age: 64, position: 26, cvText: "Con formazione classica e lunga esperienza nel mondo della cultura e dell'arte. Dopo gli studi ha lavorato all'ASAC, Archivio Storico delle Arti Contemporanee della Biennale di Venezia, occupandosi di programmazione e redazione cataloghi.\n\nHa proseguito il suo percorso come guida museale a Palazzo Mocenigo e San Stae, come assistente turistica a Venezia e come responsabile per il Gruppo Prospettive, società che allestiva mostre itineranti, sempre a stretto contatto con il pubblico e con il territorio.\n\nPorta in consiglio comunale la sua esperienza culturale, la sensibilità verso artisti, cittadini e turisti, e la volontà di sostenere politiche per la valorizzazione del patrimonio, della divulgazione artistica e di una città più accogliente e accessibile." },
      { name: "Fulvio Savio", img: "/fulvio-savio.jpg", age: 70, position: 27, cvText: "Ha lavorato per circa dieci anni presso la Fondazione Querini Stampalia, una delle più antiche e prestigiose istituzioni culturali di Venezia, situata nel cuore della città storica.\n\nSuccessivamente è stato autista ACTV sulla tratta Lido–Pellestrina, vivendo ogni giorno il rapporto diretto con residenti, pendolari e studenti che si spostano lungo la linea 11 del trasporto pubblico locale.\n\nOggi pensionato, si candida per portare in Comune l'esperienza di chi ha lavorato sia nella cultura che nel trasporto pubblico, chiedendo servizi efficienti, collegamenti migliori e più attenzione ai bisogni quotidiani di chi vive e lavora tra isole e centro storico." },
      { name: "Giorgio Tana", img: "/giorgio-tana.jpg", age: 83, position: 28, cvText: "Nato a Venezia/Lido il 24 aprile 1943, oggi pensionato. Nel corso della sua vita professionale e associativa ha maturato una lunga esperienza organizzativa e di rappresentanza.\n\nÈ stato fondatore del Circolo del Personale della Comit di Venezia e per molti anni organizzatore dei Campionati Nazionali di Sci della Comit. Ha inoltre ricoperto per 14 anni il ruolo di selezionatore e caposquadra dell'ex Banca Commerciale Italiana per i Campionati Europei Interbancari.\n\nNel suo percorso ha svolto anche incarichi di carattere istituzionale, come consigliere dell'Istituto Santa Maria della Pietà di Venezia per cinque anni e presidente, per un mandato, dell'ESU di Venezia, ente per il diritto allo studio.\n\nSi candida mettendo a disposizione della comunità l'esperienza maturata in ambito organizzativo, associativo e amministrativo, con l'obiettivo di contribuire con serietà e senso delle istituzioni alla vita pubblica cittadina." },
      { name: "Roberta Travaglia", img: "/roberta-travaglia.jpg", age: 60, position: 29, cvText: "Nata a Este (PD) l'11 settembre 1965, risiede a Este.\n\nDiplomata addetta alla contabilità d'azienda e successivamente ragioniera e perito commerciale, si è iscritta nel 1992 al Ruolo Periti ed Esperti della Camera di Commercio di Padova come perito ed esperto tributario. Dopo un'esperienza iniziale come collaboratrice in uno studio di consulenza fiscale, dal 1993 al 2023 è stata socia dello Studio PET – Centro Elaborazione Dati Travaglia Roberta & C. S.a.s. a Ospedaletto Euganeo, occupandosi di consulenza fiscale, contabilità, documentazione tributaria e pratiche amministrative per imprese e cittadini.\n\nHa una lunga storia di impegno politico e civile: candidata al Consiglio comunale di Este nel 2016 con \"Prima il Veneto\", candidata alla Camera dei Deputati nel 2018 per \"Grande Nord\" (Padova), attivista per \"Prima il Veneto\" e \"Grande Nord Veneto\", dove ha gestito anche parte della comunicazione dei movimenti.\n\nSi candida al Consiglio comunale portando l'esperienza di professionista dei conti pubblici e delle piccole imprese, con l'obiettivo di promuovere una gestione trasparente delle risorse, vicina a artigiani, commercianti e famiglie." },
      { name: "Fiorella Trevisan", img: "/fiorella-trevisan.jpg", age: 59, position: 30, cvText: "Autista di mezzi pubblici a Venezia, abituata ogni giorno a muoversi tra le esigenze concrete di cittadini, studenti e lavoratori.\n\nAppassionata di running e di podismo, pratica regolarmente la corsa come momento di benessere e disciplina personale.\n\nÈ inoltre felice allevatrice di gatti, impegnata con passione nella cura degli animali e attenta al loro benessere." },
      { name: "Giorgio Tronca", img: "/giorgio-tronca.jpg", age: 58, position: 31, cvText: "Nato a Vicenza il 9 ottobre 1967, risiede ad Arcugnano (VI).\n\nImpiegato tecnico presso Pietro Fiorentini S.p.A., azienda attiva negli impianti di distribuzione del gas metano, dove si occupa di controllo qualità. Il suo lavoro riguarda il controllo e l'approvazione dei materiali di costruzione e di produzione, garantendo standard elevati di sicurezza e affidabilità. Diplomato geometra, ha completato la propria formazione con la qualifica di ispettore di qualità, consolidando una solida competenza tecnica.\n\nHa svolto due mandati nell'amministrazione comunale di Arcugnano, maturando esperienza diretta nelle dinamiche istituzionali e nella gestione della cosa pubblica. Invalidato sul lavoro a seguito di un trauma nel 1990, è socio e per molti anni ha amministrato la sezione vicentina dell'ANMIL, portando avanti la tutela dei diritti dei lavoratori infortunati e delle persone più fragili. Figlio di un ex internato, unisce alla sua storia personale una forte sensibilità per la memoria e la giustizia sociale.\n\nSi candida al Consiglio comunale per mettere a disposizione la propria esperienza amministrativa e la propria attenzione al sociale, con l'obiettivo di difendere i diritti dei lavoratori, delle persone con disabilità e delle loro famiglie." },
      { name: "Ivana Varagnolo", img: "/ivana-varagnolo.jpg", age: 52, position: 32, cvText: "Nata il 2 luglio 1973, vive a Spinea (VE). Diplomata al CIF di Venezia come addetta alla contabilità aziendale.\n\nHa lavorato per molti anni come segretaria e addetta alla contabilità, gestendo pratiche amministrative, documenti e attività di ufficio in diversi contesti, sia con contratti stabili sia a termine.\n\nSi candida per mettere la sua esperienza amministrativa al servizio del Comune: vuole uffici più organizzati, pratiche più semplici per cittadini e imprese, sportelli che rispondano davvero e un'attenzione particolare a chi ha contratti precari o lavori discontinui ma tiene in piedi ogni giorno la macchina dei servizi." },
      { name: "Francesco Vianello", img: "/francesco-vianello.jpg", age: 48, position: 33, cvText: "Nato a Venezia il 3 settembre 1977, risiede a Mestre.\n\nInsegnante di scuola superiore statale, dipendente a tempo determinato del Ministero dell'Istruzione. Dopo una prima esperienza dal 2002 al 2007 come responsabile di servizio presso Acque del Basso Livenza SpA, ha lavorato dal 2007 al 2012 come agente di commercio, consulente e formatore per diverse realtà del settore chimico e formativo. Dal 2012 insegna matematica, fisica, chimica, biologia e sostegno ad alunni con disabilità presso scuole pubbliche, con una conoscenza diretta dei bisogni degli studenti e delle famiglie.\n\nLaureato a ciclo unico in Chimica Industriale nel 2002 presso l'Università Ca' Foscari di Venezia, collabora con l'associazione culturale di insegnanti \"Il Gessetto.com\", impegnata nella riflessione sulla scuola e sulle politiche educative. Le sue competenze principali riguardano welfare, scuola, servizi comunali, ambiente e servizi sociali.\n\nSi candida al Consiglio comunale per mettere a disposizione l'esperienza maturata tra scuola, servizi pubblici e associazionismo, con l'obiettivo di rafforzare i servizi educativi, sociali e ambientali a favore delle famiglie veneziane." },
      { name: "Michele Vio", img: "/michele-vio.jpg", age: 60, position: 34, cvText: "Vive a Mestre ed è un artigiano e taxista profondamente legato alla città. Il suo lavoro lo porta ogni giorno a conoscere i quartieri, le famiglie e le sfide concrete della vita quotidiana di chi qui vive e lavora.\n\nLa sua presenza nel progetto per il Consiglio comunale nasce proprio dalla volontà di far entrare dentro le istituzioni il punto di vista di chi conosce Mestre non da palazzo, ma dalla strada: chi alle 5 del mattino è già in giro, chi porta a casa un lavoro onesto, chi vede crescere i problemi prima che diventino vertici di palazzo.\n\nSi candida al Consiglio comunale per rappresentare la voce di chi lavora, per portare un'esperienza diretta nelle decisioni amministrative e per garantire che le scelte del Comune siano sempre vicine ai bisogni reali dei cittadini." },
      { name: "Laura Zaniol", img: "/laura-zaniol.jpg", age: 60, position: 35, cvText: "Nata a Venezia il 9 luglio 1965 e residente al Lido, proviene da una famiglia di Murano e ha una formazione artistica e creativa. Dopo il Liceo Artistico di Venezia e il diploma di designer di gioielli, ha lasciato l'università di Architettura per dedicarsi al design e ha aperto un'attività a Murano, collaborando con prestigiosi stilisti degli anni Novanta.\n\nAccanto al lavoro ha praticato il volontariato in diverse associazioni e oggi si dedica anche al wellness e al pilates, come fonte di equilibrio personale. Porta nel progetto di candidatura sensibilità, creatività e attenzione alla qualità della vita delle persone." },
      { name: "Gianfranco Zennaro", img: "/gianfranco-zennaro.jpg", age: 71, position: 36, cvText: "Artigiano, oggi in pensione.\n\nHa maturato nel corso della vita una solida esperienza nel lavoro artigiano, sviluppando concretezza, serietà e attenzione alle esigenze quotidiane delle persone.\n\nÈ cultore della voga e del disegno artistico, passioni che esprimono il suo forte legame con la tradizione, la cultura e l'identità del territorio.\n\nÈ inoltre sostenitore di AVAPO, a conferma della sua sensibilità verso il volontariato e l'impegno sociale a favore delle persone più fragili." }
    ];
    for (const c of initialData) {
      await addDoc(collection(db, "candidates"), c);
    }
  };

  const updatePositions = async (newOrder: Candidate[]) => {
    if (!isAdmin) return;
    const updates = newOrder.map((c, idx) => {
      if (c.id) {
        return updateDoc(doc(db, "candidates", c.id), { position: idx + 1 });
      }
      return Promise.resolve();
    });
    await Promise.all(updates);
  };

  const handleSaveCandidate = async (data: Partial<Candidate>) => {
    if (!isAdmin) return;
    try {
      if (data.id) {
        await updateDoc(doc(db, "candidates", data.id), data);
      } else {
        await addDoc(collection(db, "candidates"), {
          ...data,
          position: candidates.length + 1
        });
      }
      setModalOpen(false);
      setMessage({ text: "Candidato salvato!", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving candidate", error);
      setMessage({ text: "Errore durante il salvataggio.", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleShare = async (candidate: Candidate) => {
    const shareData = {
      title: `Candidato: ${candidate.name}`,
      text: `Scopri il profilo di ${candidate.name}, candidato per la lista Pierangelo Del Zotto Sindaco.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage({ text: "Link copiato negli appunti!", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Errore durante la condivisione:", err);
      }
    }
  };

  const handleDeleteCandidate = async (c: Candidate) => {
    if (!isAdmin || !c.id) return;
    if (confirm(`Sei sicuro di voler eliminare ${c.name}?`)) {
      try {
        await deleteDoc(doc(db, "candidates", c.id));
      } catch (error) {
        console.error("Error deleting candidate", error);
      }
    }
  };

  const displayedCandidates = showAll ? candidates : candidates.slice(0, 6);

  return (
    <section id="candidati" className="pt-16 pb-6 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">La Squadra</h2>
            <h3 className="text-5xl font-black text-on-surface tracking-tighter">Trasparenza e Competenze</h3>
            <p className="mt-4 text-on-surface/70 text-xl">
              {candidates.length > 0 ? candidates.length : "36"} cittadini pronti a servire Venezia con onestà e professionalità.
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setEditingCandidate({});
                  setModalOpen(true);
                }}
                className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
              >
                <Plus size={18} /> Aggiungi Candidato
              </button>
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="bg-tertiary text-on-tertiary px-6 py-3 rounded-md font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
              >
                <Edit2 size={18} /> Gestisci
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="text-primary/40"
            >
              <Loader2 size={64} strokeWidth={1.5} />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              className="text-on-surface/60 font-black uppercase tracking-[0.3em] text-[10px]"
            >
              Sincronizzazione squadra in corso...
            </motion.p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/30">
            <p className="text-on-surface/70 mb-6">Nessun candidato caricato nel database.</p>
            {isAdmin && (
              <button 
                onClick={initializeData}
                className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold hover:bg-primary/90 transition-all"
              >
                Inizializza con Dati Esempio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <AnimatePresence mode="popLayout">
              {displayedCandidates.map((c) => (
                <motion.div 
                  key={c.id || c.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 text-center hover:shadow-md transition-all group"
                >
                  <div className="relative w-20 h-20 mx-auto mb-4 overflow-hidden rounded-full grayscale group-hover:grayscale-0 transition-all duration-500">
                    <motion.img 
                      src={getAvatarImg(c.name, c.img)} 
                      alt={c.name} 
                      className={`w-full h-full ${c.img && !c.img.includes("picsum") && c.img !== "" ? "object-cover" : "object-contain p-3 bg-white"}`} 
                      referrerPolicy="no-referrer"
                      whileHover={{ scale: 1.15 }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => {
                          setViewingCandidate(c);
                          setViewModalOpen(true);
                        }}
                        className="bg-white text-primary p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                        title="Vedi Profilo"
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-on-surface text-sm mb-1">{c.name}</h4>
                  {c.age && <p className="text-xs text-on-surface/60 mb-3">{c.age} anni</p>}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setViewingCandidate(c);
                        setViewModalOpen(true);
                      }}
                      className="w-full text-[10px] uppercase tracking-widest font-black bg-primary/5 text-primary border border-primary/10 px-3 py-2 rounded-lg hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2"
                    >
                      Vedi Profilo
                    </button>
                    {c.cvText ? (
                      <button
                        onClick={() => generateCandidateCVPDF(c)}
                        className="w-full text-[10px] uppercase tracking-widest font-black text-primary border border-primary/20 px-3 py-2 rounded-lg hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                        title="Scarica CV"
                      >
                        <FileText size={12} />
                        CV
                      </button>
                    ) : (
                      <span className="w-full text-[10px] uppercase tracking-widest font-black text-on-surface/20 border border-outline-variant/10 px-3 py-2 rounded-lg text-center cursor-not-allowed">
                        CV non disponibile
                      </span>
                    )}
                    {c.criminalRecordUrl ? (
                      <button
                        onClick={() => setPdfViewerUrl(c.criminalRecordUrl!)}
                        className="w-full text-[10px] uppercase tracking-widest font-black text-primary border border-primary/20 px-3 py-2 rounded-lg hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                        title="Visualizza Casellario Giudiziale"
                      >
                        <Shield size={12} />
                        Casellario Giudiziale
                      </button>
                    ) : (
                      <button
                        onClick={() => generateCandidateCasellario(c)}
                        className="w-full text-[10px] uppercase tracking-widest font-black text-primary border border-primary/20 px-3 py-2 rounded-lg hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                        title="Casellario Giudiziale"
                      >
                        <Shield size={12} />
                        Casellario Giudiziale
                      </button>
                    )}
                    <div className="flex justify-center">
                      <button 
                        onClick={() => handleShare(c)}
                        className="p-1.5 text-on-surface/70 border border-outline-variant/20 rounded hover:bg-surface-container-high transition-all"
                        title="Condividi"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {candidates.length > 6 && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-primary font-black flex items-center justify-center gap-2 mx-auto hover:underline transition-all"
            >
              {showAll ? (
                <>Mostra meno <ChevronUp size={20} /></>
              ) : (
                <>Vedi tutti i {candidates.length} candidati <ChevronDown size={20} /></>
              )}
            </button>
          </div>
        )}

        {/* PDF Viewer Modal - Casellario Giudiziale */}
        {pdfViewerUrl && (
          <div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPdfViewerUrl(null)}
          >
            <div
              className="bg-surface rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2 text-on-surface font-black uppercase tracking-widest text-xs">
                  <Shield size={14} className="text-primary" />
                  Casellario Giudiziale
                </div>
                <button
                  onClick={() => setPdfViewerUrl(null)}
                  className="p-1.5 rounded hover:bg-surface-container-high text-on-surface/60 hover:text-on-surface transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <iframe
                src={pdfViewerUrl}
                className="flex-1 w-full border-0"
                title="Casellario Giudiziale"
              />
            </div>
          </div>
        )}

        {/* Admin Panel Overlay */}
        <AnimatePresence>
          {(showAdminPanel && isAdmin) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
                  <div>
                    <h3 className="text-2xl font-black">Gestione Squadra</h3>
                    <p className="text-sm text-on-surface/60">Trascina per riordinare i candidati</p>
                  </div>
                  <button 
                    onClick={() => setShowAdminPanel(false)}
                    className="p-2 hover:bg-surface-container-high rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <Reorder.Group 
                    axis="y" 
                    values={candidates} 
                    onReorder={(newOrder) => {
                      setCandidates(newOrder);
                    }}
                    className="space-y-2"
                  >
                    {candidates.map((c) => (
                      <CandidateItem 
                        key={c.id} 
                        c={c} 
                        isAdmin={isAdmin} 
                        onEdit={(cand) => {
                          setEditingCandidate(cand);
                          setModalOpen(true);
                        }}
                        onDelete={handleDeleteCandidate}
                      />
                    ))}
                  </Reorder.Group>

                  <button 
                    onClick={() => {
                      setEditingCandidate(null);
                      setModalOpen(true);
                    }}
                    className="w-full mt-6 py-4 border-2 border-dashed border-outline-variant/30 rounded-xl text-on-surface/70 font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all"
                  >
                    <Plus size={20} /> Aggiungi Candidato
                  </button>
                </div>

                <div className="p-8 border-t border-outline-variant/20 bg-surface-container-low flex justify-end gap-4">
                  <button 
                    onClick={() => setShowAdminPanel(false)}
                    className="px-6 py-3 font-bold text-on-surface/60 hover:text-on-surface transition-all"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={async () => {
                      await updatePositions(candidates);
                      setShowAdminPanel(false);
                      setMessage({ text: "Posizioni salvate con successo!", type: "success" });
                      setTimeout(() => setMessage(null), 3000);
                    }}
                    className="bg-primary text-on-primary px-8 py-3 rounded-md font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    <Save size={18} /> Salva Ordine
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Candidate Edit Modal */}
        <AnimatePresence>
          {modalOpen && (
            <CandidateModal 
              candidate={editingCandidate}
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              onSave={handleSaveCandidate}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewModalOpen && (
            <CandidateViewModal 
              isOpen={viewModalOpen}
              candidate={viewingCandidate}
              onClose={() => setViewModalOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Login/Logout Floating Button */}
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-2">
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`px-6 py-3 rounded-xl shadow-2xl font-bold text-sm ${
                  message.type === "success" ? "bg-primary text-on-primary" : "bg-error text-on-error"
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
          {user ? (
            <div className="flex flex-col items-end gap-2">
              <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-outline-variant/20">
                {user.email}
              </span>
              <button 
                onClick={onLogout}
                className="bg-error text-on-error p-3 rounded-full shadow-2xl hover:scale-110 transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="bg-surface-container-highest text-on-surface p-3 rounded-full shadow-2xl hover:scale-110 transition-all border border-outline-variant/30"
              title="Admin Login"
            >
              <LogIn size={20} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

// Countdown Section
const CountdownSection = () => {
  const electionDate = new Date("2026-05-24T07:00:00");
  const calcDays = () => Math.max(0, Math.floor((electionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const [timeLeft, setTimeLeft] = useState({ days: calcDays(), hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft({ days: calcDays(), hours: 0, minutes: 0, seconds: 0 });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-4 bg-primary/10 relative">
      <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-4 text-center">
        <span className="text-primary/70 text-sm font-bold uppercase tracking-widest">Elezioni Comunali Venezia — 24 e 25 maggio 2026</span>
        <span className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-black">-{timeLeft.days} giorni</span>
      </div>
    </section>
  );
};

// News Section
const newsItems = [
  {
    date: "Venerdì 24 aprile 2026",
    title: "Giovanni Pagotto ospite a Focus su Rete Veneta",
    excerpt: "Il candidato Giovanni Pagotto, lista Prima il Veneto, sarà ospite della trasmissione Focus su Rete Veneta (canale 14 digitale terrestre), venerdì 24 aprile alle ore 21.15.",
    tag: "Media",
    img: "/pagotto-crop.jpg"
  }
];

const NewsSection = () => (
  <section id="news" className="py-16 bg-surface-container-low/30">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Aggiornamenti</h2>
        <h3 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter">Ultime dalla campagna</h3>
      </div>
      
      <div className="max-w-2xl mx-auto">
        {newsItems.map((news, idx) => (
          <motion.article
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl overflow-hidden border border-outline-variant/10 shadow-lg"
          >
            <div className="flex items-center gap-6 p-8 pb-4">
              <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-md border border-outline-variant/10">
                <img src={news.img} alt={news.title} className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-black text-on-surface tracking-tight mb-1">Giovanni Pagotto</h4>
                <p className="text-primary font-bold text-sm uppercase tracking-widest">Prima il Veneto</p>
              </div>
              <div className="w-16 h-16 shrink-0 hidden md:block">
                <img src="/logo-ufficiale.png" alt="Prima il Veneto" className="w-full h-full object-contain" />
              </div>
            </div>
            
            <div className="px-8 py-3">
              <div className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-black text-sm tracking-wide shadow-md">
                <Calendar size={16} />
                {news.date} — ore 21.15
              </div>
            </div>
            
            <div className="px-8 pb-8 pt-2">
              <p className="text-gray-700 leading-relaxed">{news.excerpt}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{news.tag}</span>
                <span className="text-xs text-on-surface/70">Rete Veneta — Canale 14</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

// FAQ Section with Schema Markup
const faqData = [
  {
    q: "Chi è Pierangelo Del Zotto e perché si candida a Sindaco di Venezia?",
    a: "Pierangelo Del Zotto è un commercialista veneziano con oltre 40 anni di esperienza nei bilanci pubblici e nelle revisioni contabili degli enti locali. Si candida perché crede che Venezia abbia bisogno di trasparenza, competenza e concretezza nella gestione della cosa pubblica."
  },
  {
    q: "Cosa propone Del Zotto contro lo spopolamento di Venezia e delle isole?",
    a: "Il programma prevede misure concrete per riportare i residenti in centro storico e nelle isole: contrasto al caro-casa, difesa dei servizi essenziali, regolamentazione degli affitti turistici e tutela dell'identità delle comunità insulari come Burano, Murano, Pellestrina e Torcello."
  },
  {
    q: "Qual è la posizione di Del Zotto sull'overtourism a Venezia?",
    a: "Del Zotto vuole un turismo che rispetti la città e i suoi abitanti. Il programma propone di restituire le case ai residenti, regolamentare i flussi turistici e valorizzare le isole minori senza snaturarle. A Murano, ad esempio, si punta a rilanciare l'arte vetraia contro la concorrenza estera."
  },
  {
    q: "Come intende gestire il bilancio comunale?",
    a: "Con la stessa trasparenza applicata in 40 anni di revisioni contabili: ogni euro deve essere tracciabile e trasformato in servizi per i cittadini. Niente sprechi, niente opacità. Il bilancio pubblico è il primo pilastro del programma."
  },
  {
    q: "Cosa prevede il programma per Mestre e la terraferma?",
    a: "Il programma riunisce laguna e terraferma in un progetto unico: rafforzamento degli impianti sportivi, riqualificazione di Marghera, valorizzazione dell'Arsenale e investimenti nelle grandi opere infrastrutturali."
  },
  {
    q: "Come verrà affrontato il tema della sicurezza a Venezia?",
    a: "Riorganizzazione della Polizia Locale, maggiore presenza nei quartieri e negli spazi pubblici, e interventi mirati per rendere la città più sicura sia per i residenti che per i visitatori."
  },
  {
    q: "Cosa si propone per il lavoro e l'economia locale?",
    a: "Creare lavoro stabile per artigiani, imprese locali, il porto e i giovani. Sostenere le attività tradizionali — come l'arte vetraia di Murano e il merletto di Burano — e favorire nuove opportunità economiche radicate nel territorio."
  },
  {
    q: "Quando si vota per le elezioni comunali di Venezia?",
    a: "Le elezioni comunali di Venezia si tengono il 24 e 25 maggio 2026. Per informazioni su seggi e documenti necessari, consultare il sito del Comune di Venezia."
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {/* FAQ Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      })}} />
      
      <section id="faq" className="py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Domande Frequenti</h2>
            <h3 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter">Tutto quello che vuoi sapere</h3>
            <p className="mt-4 text-on-surface/60 text-lg">Le risposte alle domande più comuni sul programma e la candidatura</p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="border border-outline-variant/15 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-container-high/50 transition-all"
                >
                  <span className="font-bold text-on-surface text-lg pr-4">{faq.q}</span>
                  <ChevronDown 
                    size={20} 
                    className={`text-primary shrink-0 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {openIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-on-surface/70 leading-relaxed text-base">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

const ContactCTA = ({ onOpenContact }: { onOpenContact: () => void }) => (
  <section id="contatti" className="py-24 bg-surface border-y border-outline-variant/10 relative overflow-hidden text-center">
    {/* Yellow Accent Bar */}
    <div className="absolute top-0 left-0 w-full h-2 bg-tertiary"></div>
    
    <div className="max-w-4xl mx-auto px-6 relative z-10">
       <div className="inline-block px-8 py-3 bg-tertiary text-on-tertiary rounded-xl mb-8 shadow-[0_10px_30px_rgba(255,215,0,0.2)]">
         <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.4em]">Partecipazione Attiva</h2>
       </div>
       <h3 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-8 leading-tight">
         Hai una <span className="text-primary decoration-tertiary/30 underline underline-offset-8">proposta</span> o una <span className="text-primary decoration-tertiary/30 underline underline-offset-8">domanda</span>?
       </h3>
       <p className="text-on-surface/60 text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
         Pierangelo Del Zotto crede in una politica di ascolto. Inviaci le tue proposte, domande o segnalazioni per Venezia.
       </p>
       <button 
         onClick={onOpenContact}
         className="inline-flex items-center gap-3 bg-primary text-on-primary px-12 py-6 rounded-2xl font-black text-2xl shadow-xl hover:scale-105 hover:shadow-primary/20 transition-all group"
       >
         Contattami <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
       </button>
    </div>
  </section>
);

import emailjs from '@emailjs/browser';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "proposta",
    message: "",
    privacy: false
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.privacy) {
      alert("Devi accettare l'informativa sulla privacy.");
      return;
    }

    setStatus('sending');
    try {
      // 1. Send via EmailJS first (priority)
      const serviceId = 'service_qy7zqvm';
      const templateId = 'template_yx6xerq';
      const publicKey = 'LzW_a7EOSe4fymqxW';

      await emailjs.send(
        serviceId, 
        templateId, 
        {
          nome_cognome: formData.name,
          email: formData.email,
          tipo_messaggio: formData.type,
          tuo_messaggio: formData.message,
        },
        publicKey
      );
      console.log("Email sent successfully via EmailJS");

      // 2. Try to save to Firestore (backup archive)
      try {
        await addDoc(collection(db, "contacts"), {
          ...formData,
          createdAt: new Date().toISOString(),
          status: "new"
        });
      } catch (firestoreError) {
        console.warn("Firestore save failed, but email was sent:", firestoreError);
      }

      setStatus('success');
      setFormData({ name: "", email: "", type: "proposta", message: "", privacy: false });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border-t-8 border-t-tertiary border-x border-b border-outline-variant/10 relative w-full overflow-hidden">
      {/* Subtle yellow background accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-tertiary/20"></div>
      
      {status === 'success' ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h4 className="text-2xl font-black text-on-surface mb-4">Messaggio Inviato!</h4>
          <p className="text-on-surface/60">Grazie per il tuo contributo. Ti risponderemo al più presto.</p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-8 text-primary font-bold hover:underline"
          >
            Invia un altro messaggio
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface/70 ml-1">Nome e Cognome</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Esempio: Marco Rossi"
                className="w-full bg-surface-container-lowest border-2 border-primary/5 rounded-xl px-4 py-3 focus:border-primary/30 outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface/70 ml-1">Email</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="email@dominio.it"
                className="w-full bg-surface-container-lowest border-2 border-primary/5 rounded-xl px-4 py-3 focus:border-primary/30 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface/70 ml-1">Tipo di messaggio</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full bg-surface-container-lowest border-2 border-primary/5 rounded-xl px-4 py-3 focus:border-primary/30 outline-none transition-all font-medium appearance-none"
            >
              <option value="proposta">Voglio fare una proposta</option>
              <option value="domanda">Ho una domanda per il candidato</option>
              <option value="segnalazione">Voglio fare una segnalazione</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface/70 ml-1">Il tuo messaggio</label>
            <textarea 
              required
              rows={4}
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              placeholder="Scrivi qui..."
              className="w-full bg-surface-container-lowest border-2 border-primary/5 rounded-xl px-4 py-3 focus:border-primary/30 outline-none transition-all font-medium resize-none"
            />
          </div>

          <div className="flex items-start gap-3 ml-1">
            <input 
              type="checkbox" 
              id="privacy-form" 
              checked={formData.privacy}
              onChange={e => setFormData({...formData, privacy: e.target.checked})}
              className="mt-1 accent-primary"
            />
            <label htmlFor="privacy-form" className="text-[10px] text-on-surface/70 leading-tight">
              Accetto il trattamento dei dati personali secondo la normativa vigente.
            </label>
          </div>

          <button 
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-black text-lg shadow-lg hover:bg-primary-container hover:shadow-tertiary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {status === 'sending' ? (
              <>Inviando... <Loader2 size={20} className="animate-spin" /></>
            ) : (
              <>Invia Messaggio <ArrowRight size={20} className="group-hover:translate-x-1 group-hover:text-tertiary transition-all" /></>
            )}
          </button>
          
          {status === 'error' && (
            <p className="text-center text-xs text-error font-bold">Errore nell'invio.</p>
          )}
        </form>
      )}
    </div>
  );
};

const ContactModule = () => {
  return (
    <section id="contatti" className="py-12 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
        <motion.div
           initial={{ opacity: 0, x: -50 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
        >
          <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Partecipazione Attiva</h2>
          <h3 className="text-5xl font-black text-on-surface tracking-tighter mb-8 leading-tight">
            I cittadini al centro del <span className="text-primary">cambiamento</span>
          </h3>
          <p className="text-on-surface/70 text-xl leading-relaxed mb-8">
            Pierangelo Del Zotto crede in una politica di ascolto. Inviaci le tue proposte, le tue domande o le tue segnalazioni.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-on-surface mb-1">Ascolto Reale</h4>
                <p className="text-sm text-on-surface/60">Tutte le proposte vengono valutate per il programma elettorale.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-on-surface mb-1">Risposte Dirette</h4>
                <p className="text-sm text-on-surface/60">Cerchiamo di rispondere nel minor tempo possibile.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full"
        >
          <ContactForm />
        </motion.div>
      </div>
    </section>
  );
};

const ContactModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-3 bg-surface shadow-lg text-on-surface/70 hover:text-primary rounded-full transition-all"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10 w-full">
            <div className="text-center mb-10">
              <span className="text-primary text-xs font-black uppercase tracking-[0.4em] mb-4 block">Contatto Diretto</span>
              <h3 className="text-3xl font-black text-on-surface tracking-tighter leading-tight">
                Invia il tuo <span className="text-primary">messaggio</span>
              </h3>
            </div>
            
            <ContactForm />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Footer = ({ onOpenPrivacy, onOpenTransparency, onOpenCookieSettings, onOpenContact, logo, onLogoChange, isAdmin }: { 
  onOpenPrivacy: () => void, 
  onOpenTransparency: () => void, 
  onOpenCookieSettings: () => void,
  onOpenContact: () => void,
  logo: string,
  onLogoChange: (url: string) => void,
  isAdmin: boolean
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const uploadingRef = useRef(false);
  const base64Ref = useRef("");

  const handleUrlPaste = () => {
    const url = prompt("Incolla qui l'indirizzo (URL) dell'immagine del tuo logo:");
    if (url && url.startsWith("http")) {
      onLogoChange(url);
    } else if (url) {
      alert("Indirizzo non valido. Deve iniziare con http:// o https://");
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    uploadingRef.current = true;
    setProgress(0);
    progressRef.current = 0;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      base64Ref.current = base64;

      try {
        const storageRef = ref(storage, `logos/footer_${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Auto-fallback timer
        const fallbackTimer = setTimeout(() => {
          if (progressRef.current === 0 && uploadingRef.current) {
            onLogoChange(base64);
            setUploading(false);
            uploadingRef.current = false;
            alert("Salvataggio rapido completato per il footer!");
          }
        }, 5000);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const currentP = Math.round(p);
            setProgress(currentP);
            progressRef.current = currentP;
          }, 
          (error) => {
            clearTimeout(fallbackTimer);
            console.error("Logo upload failed, falling back to base64", error);
            onLogoChange(base64);
            setUploading(false);
            uploadingRef.current = false;
          }, 
          async () => {
            clearTimeout(fallbackTimer);
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            onLogoChange(url);
            setUploading(false);
            uploadingRef.current = false;
          }
        );
      } catch (error: any) {
        console.error("Footer Logo upload initialization failed", error);
        onLogoChange(base64);
        setUploading(false);
        uploadingRef.current = false;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <footer id="contatti-info" className="bg-white border-t border-outline-variant/30 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-4 mb-6">
              {(logo || isAdmin) && (
                <div className={`relative group cursor-pointer h-20 flex items-center justify-center overflow-hidden transition-all ${!logo && !isAdmin ? 'w-0 opacity-0' : 'min-w-[80px] opacity-100'}`}>
                  {logo ? (
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="h-full w-auto object-contain transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : isAdmin && (
                    <div className="flex items-center justify-center h-full w-full opacity-10 group-hover:opacity-30 transition-opacity">
                      <Upload size={24} className="text-primary" />
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl text-white z-20 gap-1 px-1">
                      {uploading ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 size={16} className="animate-spin text-primary" />
                          <span className="text-[8px] font-bold">{progress}%</span>
                          <button 
                            onClick={() => {
                              if (base64Ref.current) {
                                onLogoChange(base64Ref.current);
                                setUploading(false);
                                uploadingRef.current = false;
                                alert("Salvataggio forzato footer.");
                              }
                            }}
                            className="text-[7px] underline opacity-70 hover:opacity-100 font-bold"
                          >
                            Forza Salva
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 w-full">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-primary text-on-primary py-0.5 rounded text-[8px] font-bold uppercase hover:bg-primary/90 flex items-center justify-center gap-1"
                          >
                            <Upload size={10} /> Carica
                          </button>
                          <button 
                            onClick={handleUrlPaste}
                            className="bg-surface-container-high text-on-surface py-0.5 rounded text-[8px] font-bold uppercase hover:bg-surface-container-highest flex items-center justify-center gap-1"
                          >
                            <LinkIcon size={10} /> Incolla
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
              )}
              <span className="font-black text-primary text-xl tracking-tighter">Pierangelo Del Zotto</span>
            </div>
            <p className="text-on-surface/60 text-sm leading-relaxed">
              Comitato Elettorale per la candidatura a Sindaco di Venezia. Dalla parte di chi vive e lavora a Venezia e Terraferma.
            </p>
          </div>
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          {["Contatti", "Privacy Policy", "Trasparenza", "Cookie"].map(link => (
            <button 
              key={link} 
              onClick={
                link === "Contatti" ? onOpenContact :
                link === "Privacy Policy" ? onOpenPrivacy : 
                link === "Trasparenza" ? onOpenTransparency : 
                link === "Cookie" ? onOpenCookieSettings :
                undefined
              }
              className="text-sm font-bold text-on-surface/60 hover:text-tertiary transition-colors relative group"
            >
              {link}
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-tertiary group-hover:w-full transition-all"></span>
            </button>
          ))}
        </div>
        <div className="flex flex-col items-end gap-6">
          <div className="flex gap-3">
            <a href="https://www.facebook.com/profile.php?id=61576827857516" target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center text-on-surface/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all border border-outline-variant/30"><Facebook size={18} /></a>
            <button onClick={() => { if (navigator.share) { navigator.share({ title: 'Pierangelo Del Zotto - Candidato Sindaco di Venezia', url: 'https://delzottosindaco.github.io' }); } else { navigator.clipboard.writeText('https://delzottosindaco.github.io'); } }} className="w-10 h-10 flex items-center justify-center text-on-surface/70 hover:text-tertiary hover:bg-tertiary/5 rounded-full transition-all border border-outline-variant/30"><Share2 size={18} /></button>
          </div>
          <div className="text-right">
            <p className="text-on-surface/30 text-[9px] font-black uppercase tracking-[0.3em]">
              © 2026 Comitato Elettorale
            </p>
            <p className="text-primary/40 text-[9px] font-black uppercase tracking-[0.3em]">
              Pierangelo Del Zotto
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
  );
};

// ============================================================
// PAGINA GESTIONE (nascosta, /gestione)
// ============================================================
interface DocItem {
  tipo: string;
  titolo: string;
  persona?: string;
  area?: string;
  stato: 'ok' | 'bozza' | 'prioritario' | 'mancante';
  link?: string;
  data: string;
  note?: string;
}

interface PressItem {
  data: string;
  testata: string;
  titolo: string;
  tipo: string;
  tema?: string;
  persona?: string;
  link?: string;
  sintesi?: string;
  priorita: 'alta' | 'normale';
}

interface EventoItem {
  data: string;
  ora: string;
  titolo: string;
  luogo: string;
  descrizione?: string;
  contatto?: string;
  note?: string;
}

const calendario: EventoItem[] = [
  { data: '2026-04-27', ora: '17:00–19:00', titolo: 'Dibattito Candidati Sindaco — Associazioni Ambientaliste', luogo: 'Sala S. Leonardo, Venezia', descrizione: 'Dibattito pubblico sulle principali problematiche ambientali di Venezia e laguna. Organizzato da: Italia Nostra, Ambiente Venezia, Comitato No Grandi Navi, Lipu, Venezia Cambia.', contatto: 'Federico Antinori', note: 'Confermata presenza' },
];

const biografiaBreve = `Pierangelo Del Zotto, commercialista veneziano con oltre 40 anni di esperienza nei bilanci pubblici e nelle revisioni contabili. Laureato in Economia a Ca' Foscari, ha dedicato la sua attività professionale alla trasparenza dei conti degli enti locali. Già assessore al Bilancio della Provincia di Venezia, ha svolto incarichi di revisore dei conti per Comuni come Mirano, Vigonovo, Santa Maria di Sala, Albignasego e Marcon, e ricoperto ruoli di controllo in enti chiave per il territorio, tra cui ULSS 12 Veneziana, ATER e Automobile Club di Venezia. Conosce direttamente le trasformazioni del territorio degli ultimi decenni. La sua candidatura a sindaco nasce dall'impegno civico e dalla volontà di mettere esperienza e competenza al servizio della città.`;

const biografiaMoltoBreve = `Pierangelo Del Zotto, commercialista veneziano, laureato in Economia a Ca' Foscari. Oltre 40 anni di esperienza in bilanci pubblici e revisioni contabili. Ex assessore al Bilancio della Provincia di Venezia, revisore dei conti per diversi Comuni e per enti come ULSS 12, ATER e ACI Venezia. Conosce direttamente le trasformazioni del territorio degli ultimi decenni. Si candida a sindaco per mettere rigore, trasparenza e competenza al servizio della città.`;

const dichiarazioneCandidatura = `La mia visione per Venezia non nasce da slogan, ma da quarant'anni di numeri, bilanci e responsabilità amministrativa. Sono un veneziano che ha visto con i propri occhi i cambiamenti della città e ha memoria storica delle dinamiche del territorio, positive e negative. Conosco dall'interno il funzionamento degli enti pubblici: so dove si sprecano risorse, dove manca trasparenza e dove serve rigore. Mi candido per mettere questa competenza al servizio di Venezia.`;

interface ContattoItem {
  nome: string;
  email?: string;
  tel?: string;
  sito?: string;
  professione?: string;
  note?: string;
}

const contattiCampagna: ContattoItem[] = [
  { nome: 'Giannicola Pittalis', email: 'giannicola.pittalis@gmail.com', tel: '3458426144', sito: 'www.enordest.it', professione: 'Giornalista' },
  { nome: 'Federico Antinori', email: 'antinori51@gmail.com', professione: 'Referente associazioni ambientaliste', note: 'Organizzatore dibattito 27/04' },
];

const mailGiornale = `Buongiorno,
in allegato il materiale richiesto su Pierangelo Del Zotto, candidato sindaco di Venezia:
• dichiarazione sui motivi della candidatura
• biografia (versione estesa e versione breve)
• foto in alta risoluzione
• dati essenziali
Resto a disposizione per eventuali chiarimenti o ulteriori materiali.
Cordiali saluti.`;

const materialiStampa = [
  { titolo: 'Foto primo piano', desc: 'Formato quadrato, alta risoluzione', link: '/sindaco.jpg', tipo: '📸' },
  { titolo: 'Foto figura intera', desc: 'Formato verticale, alta risoluzione', link: '/sindaco-figura-intera.jpg', tipo: '📸' },
  { titolo: 'Logo campagna (PNG)', desc: 'Sfondo trasparente', link: '/logo-ufficiale.png', tipo: '🏷️' },
  { titolo: 'Programma elettorale', desc: 'Documento integrale PDF', link: '/programma-elettorale.pdf', tipo: '📄' },
  { titolo: 'Lista candidati — Professioni', desc: 'Nome, età, professione — PDF', link: '/lista-candidati.pdf', tipo: '📄' },
  { titolo: 'Lista candidati — Anagrafica', desc: 'Nome, luogo e data di nascita — PDF', link: '/lista-candidati-anagrafica.pdf', tipo: '📄' },
];

const documentiCampagna: DocItem[] = [
  { tipo: 'PDF', titolo: 'Programma Elettorale Integrale', area: 'Generale', stato: 'ok', link: '/programma-elettorale.pdf', data: '2026-04-26', note: 'Versione definitiva' },
  { tipo: 'PDF', titolo: 'Lista Candidati — Professioni', area: 'Generale', stato: 'ok', link: '/lista-candidati.pdf', data: '2026-04-26' },
  { tipo: 'PDF', titolo: 'Lista Candidati — Anagrafica', area: 'Generale', stato: 'ok', link: '/lista-candidati-anagrafica.pdf', data: '2026-04-26' },
  { tipo: 'Immagine', titolo: 'Logo Ufficiale', area: 'Comunicazione', stato: 'ok', link: '/logo-ufficiale.png', data: '2026-04-20' },
  { tipo: 'Immagine', titolo: 'Foto Sindaco — Ritratto', area: 'Comunicazione', stato: 'ok', link: '/sindaco.jpg', data: '2026-04-26' },
  { tipo: 'Immagine', titolo: 'Foto Sindaco — Figura intera', area: 'Comunicazione', stato: 'ok', link: '/sindaco-figura-intera.jpg', data: '2026-04-26' },

  { tipo: 'Documento', titolo: 'Riassunto programma elettorale', area: 'Generale', stato: 'mancante', data: '2026-04-26', note: 'Sintesi del programma per distribuzione rapida' },
  { tipo: 'Documento', titolo: 'Domande scomode — Preparazione risposte', area: 'Generale', stato: 'mancante', data: '2026-04-26', note: 'Domande critiche prevedibili e risposte preparate' },
  { tipo: 'Volantino', titolo: 'Volantino campagna', area: 'Comunicazione', stato: 'mancante', data: '2026-04-26', note: 'Da progettare e stampare' },
  { tipo: 'Documento', titolo: 'Fac simile — Come si vota', area: 'Comunicazione', stato: 'mancante', data: '2026-04-26', note: 'Da mettere anche nel sito pubblico' },
];

const rassegnaStampa: PressItem[] = [
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Elezioni comunali 2026, chi sono gli otto candidati sindaco a Venezia', tipo: 'articolo', link: '/stampa/2026_04_26_Elezioni%20comunali%202026%2C%20chi%20sono%20gli%20otto%20candidati%20sindaco%20a%20Venezia.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Elezioni comune Venezia, otto candidati a nuovo sindaco per il post Brugnaro, chi sono e le liste', tipo: 'articolo', link: '/stampa/2026_04_26_Elezioni%20comune%20Venezia%2C%20otto%20candidati%20a%20nuovo%20sindaco%20per%20il%20post%20Brugnaro%2C%20chi%20sono%20e%20le%20liste.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Grandi comuni al voto, a Reggio Calabria il centrodestra punta su Cannizzaro, a Salerno lo sceriffo De Luca senza il simbolo Dem', tipo: 'articolo', link: '/stampa/2026_04_26_Grandi%20comuni%20al%20voto%2C%20a%20Reggio%20Calabria%20il%20centrodestra%20punta%20su%20Cannizzaro%2C%20a%20Salerno%20lo%20sceriffo%20De%20Luca%20senza%20il%20simbolo%20Dem.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Venezia, è corsa a otto', tipo: 'articolo', link: '/stampa/2026_04_26_Venezia%2C%20%C3%A8%20corsa%20a%20otto.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Assessore uscente Il più votato nel 2020', tipo: 'articolo', link: '/stampa/2026_04_26_Assessore%20uscente%20Il%20pi%C3%B9%20votato%20nel%202020.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Brugnaro si schiera «Giuli posso capirlo ma difendo la Biennale»', tipo: 'articolo', link: '/stampa/2026_04_26_Brugnaro%20si%20schiera%20%C2%ABGiuli%20posso%20capirlo%20ma%20difendo%20la%20Biennale%C2%BB.pdf', tema: 'Cultura', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Da Venezia a Salerno Chiuse le liste in 626 Comuni', tipo: 'articolo', link: '/stampa/2026_04_26_Da%20Venezia%20a%20Salerno%20Chiuse%20le%20liste%20in%20626%20Comuni.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Del Zotto primo sulla scheda Coro secondo. Martini ultimo', tipo: 'articolo', link: '/stampa/2026_04_26_Del%20Zotto%20primo%20sulla%20scheda%20Coro%20secondo.%20Martini%20ultimo.pdf', tema: 'Elezioni', priorita: 'alta' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Depositate liste e candidature Venezia e 50 comuni cercano un nuovo sindaco - Venezia, una sfida sotto i riflettori otto candidati per il post Brugnaro', tipo: 'articolo', link: '/stampa/2026_04_26_Depositate%20liste%20e%20candidature%20Venezia%20e%2050%20comuni%20cercano%20un%20nuovo%20sindaco%20-%20Venezia%2C%20una%20sfida%20sotto%20i%20riflettori%20otto%20candidati%20per%20il%20post%20Brugnaro.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Deputato e senatore Uomo di punta del Pd', tipo: 'articolo', link: '/stampa/2026_04_26_Deputato%20e%20senatore%20Uomo%20di%20punta%20del%20Pd.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Ecco dove si vota da Venezia a Reggio Calabria', tipo: 'articolo', link: '/stampa/2026_04_26_Ecco%20dove%20si%20vota%20da%20Venezia%20a%20Reggio%20Calabria.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Elezioni comunali, le sfide venete per eleggere 51 sindaci', tipo: 'articolo', link: '/stampa/2026_04_26_Elezioni%20comunali%2C%20le%20sfide%20venete%20per%20eleggere%2051%20sindaci.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Elezioni, tutte le liste e i candidati - Ca\' Farsetti, otto in corsa per il sindaco con quasi 700 candidati', tipo: 'articolo', link: '/stampa/2026_04_26_Elezioni%2C%20tutte%20le%20liste%20e%20i%20candidati%20-%20Ca%27%20Farsetti%2C%20otto%20in%20corsa%20per%20il%20sindaco%20con%20quasi%20700%20candidati.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Esperto contabile guida gli ex leghisti', tipo: 'articolo', link: '/stampa/2026_04_26_Esperto%20contabile%20guida%20gli%20ex%20leghisti.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Il professore che lotta contro le locazioni brevi', tipo: 'articolo', link: '/stampa/2026_04_26_Il%20professore%20che%20lotta%20contro%20le%20locazioni%20brevi.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'La campagna elettorale più multietnica di sempre', tipo: 'articolo', link: '/stampa/2026_04_26_La%20campagna%20elettorale%20pi%C3%B9%20multietnica%20di%20sempre.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'La carica dei candidati in 51 Comuni veneti 8 in corsa a Venezia - Comunali, le sfide venete per eleggere 51 sindaci', tipo: 'articolo', link: '/stampa/2026_04_26_La%20carica%20dei%20candidati%20in%2051%20Comuni%20veneti%208%20in%20corsa%20a%20Venezia%20-%20Comunali%2C%20le%20sfide%20venete%20per%20eleggere%2051%20sindaci.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Liste chiuse per le elezioni di maggio', tipo: 'articolo', link: '/stampa/2026_04_26_Liste%20chiuse%20per%20le%20elezioni%20di%20maggio.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Otto candidati sindaco nel dopo-Brugnaro a Venezia', tipo: 'articolo', link: '/stampa/2026_04_26_Otto%20candidati%20sindaco%20nel%20dopo-Brugnaro%20a%20Venezia.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Quindicimila paganti Nelle casse del Comune versati ieri 108940 euro', tipo: 'articolo', link: '/stampa/2026_04_26_Quindicimila%20paganti%20Nelle%20casse%20del%20Comune%20versati%20ieri%20108940%20euro.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Un esercito di 675 candidati per136 scranni di Ca\' Farsetti', tipo: 'articolo', link: '/stampa/2026_04_26_Un%20esercito%20di%20675%20candidati%20per136%20scranni%20di%20Ca%27%20Farsetti.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Venti liste in campo La sfida dei primari il ritorno degli ex e i giovani all\'attacco', tipo: 'articolo', link: '/stampa/2026_04_26_Venti%20liste%20in%20campo%20La%20sfida%20dei%20primari%20il%20ritorno%20degli%20ex%20e%20i%20giovani%20all%27attacco.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-26', testata: 'Quotidiano locale', titolo: 'Venturini-Martella scontro sul Porto tra economia e laguna', tipo: 'articolo', link: '/stampa/2026_04_26_Venturini-Martella%20scontro%20sul%20Porto%20tra%20economia%20e%20laguna.pdf', tema: 'Porto/Logistica', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Boldrin «Sicurezza, basta propaganda»', tipo: 'articolo', link: '/stampa/2026_04_25_Boldrin%20%C2%ABSicurezza%2C%20basta%20propaganda%C2%BB.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Brugnaro sarà interrogato a settembre Cancellata l\'udienza pre-elettorale', tipo: 'articolo', link: '/stampa/2026_04_25_Brugnaro%20sar%C3%A0%20interrogato%20a%20settembre%20Cancellata%20l%27udienza%20pre-elettorale.pdf', tema: 'Amministrazione uscente', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Corò è l`ottavo candidato polemiche sulle firme Lega, spot sui bus, è scontro', tipo: 'articolo', link: '/stampa/2026_04_25_Cor%C3%B2%20%C3%A8%20l%60ottavo%20candidato%20polemiche%20sulle%20firme%20Lega%2C%20spot%20sui%20bus%2C%20%C3%A8%20scontro.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Corò, l\'ottavo candidato sindaco targato Vannacci - La civica vannacciana di Corò Ecco l\'ottavo candidato sindaco', tipo: 'articolo', link: '/stampa/2026_04_25_Cor%C3%B2%2C%20l%27ottavo%20candidato%20sindaco%20targato%20Vannacci%20-%20La%20civica%20vannacciana%20di%20Cor%C3%B2%20Ecco%20l%27ottavo%20candidato%20sindaco.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Domani i nomi dei consiglieri', tipo: 'articolo', link: '/stampa/2026_04_25_Domani%20i%20nomi%20dei%20consiglieri.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Edicole e banchetti poco decorosi Giro di vite della Polizia locale', tipo: 'articolo', link: '/stampa/2026_04_25_Edicole%20e%20banchetti%20poco%20decorosi%20Giro%20di%20vite%20della%20Polizia%20locale.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Le celebrazioni e le tensioni, letame contro FdI - Letame sul ristorante che ospita l\'incontro di Fratelli d\'Italia', tipo: 'articolo', link: '/stampa/2026_04_25_Le%20celebrazioni%20e%20le%20tensioni%2C%20letame%20contro%20FdI%20-%20Letame%20sul%20ristorante%20che%20ospita%20l%27incontro%20di%20Fratelli%20d%27Italia.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Letame al ristorante «Attacco vile» - Letame al ristorante contro il libro di Fdl Polemiche e inchiesta', tipo: 'articolo', link: '/stampa/2026_04_25_Letame%20al%20ristorante%20%C2%ABAttacco%20vile%C2%BB%20-%20Letame%20al%20ristorante%20contro%20il%20libro%20di%20Fdl%20Polemiche%20e%20inchiesta.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Letame davanti al locale che ospita l\'evento di FdI La condanna è unanime', tipo: 'articolo', link: '/stampa/2026_04_25_Letame%20davanti%20al%20locale%20che%20ospita%20l%27evento%20di%20FdI%20La%20condanna%20%C3%A8%20unanime.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Ospita i giovani di FdI, 10 chili di letame fuori dal ristorante', tipo: 'articolo', link: '/stampa/2026_04_25_Ospita%20i%20giovani%20di%20FdI%2C%2010%20chili%20di%20letame%20fuori%20dal%20ristorante.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'Salgono a otto i candidati alla poltrona di sindaco - Ressa perle candidature Un ottavo sfidante nella corsa a sindaco', tipo: 'articolo', link: '/stampa/2026_04_25_Salgono%20a%20otto%20i%20candidati%20alla%20poltrona%20di%20sindaco%20-%20Ressa%20perle%20candidature%20Un%20ottavo%20sfidante%20nella%20corsa%20a%20sindaco.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-25', testata: 'Quotidiano locale', titolo: 'San Marco promosso a patrono del Veneto Il Papa atteso nel 2028', tipo: 'articolo', link: '/stampa/2026_04_25_San%20Marco%20promosso%20a%20patrono%20del%20Veneto%20Il%20Papa%20atteso%20nel%202028.pdf', tema: 'Storia/Ricorrenze', priorita: 'normale' },
  { data: '2026-04-24', testata: 'Quotidiano locale', titolo: 'Alleanza Verdi Sinistra Bettin «I candidati, 18 donne, 18 uomini e tanti giovani»', tipo: 'articolo', link: '/stampa/2026_04_24_Alleanza%20Verdi%20Sinistra%20Bettin%20%C2%ABI%20candidati%2C%2018%20donne%2C%2018%20uomini%20e%20tanti%20giovani%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-24', testata: 'Quotidiano locale', titolo: 'Avs, Bettn e Messinis In testa alla lista Cervo e Ludovici, spazio al ventenni', tipo: 'articolo', link: '/stampa/2026_04_24_Avs%2C%20Bettn%20e%20Messinis%20In%20testa%20alla%20lista%20Cervo%20e%20Ludovici%2C%20spazio%20al%20ventenni.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-24', testata: 'Resegone Online', titolo: 'Celebriamo San Marco e facciamo diventare il 25 Aprile vera festa di liberazione e pacificazione - Resegone online', tipo: 'articolo', link: '/stampa/2026_04_24_Celebriamo%20San%20Marco%20e%20facciamo%20diventare%20il%2025%20Aprile%20vera%20festa%20di%20liberazione%20e%20pacificazione%20-%20Resegone%20online.pdf', tema: 'Storia/Ricorrenze', priorita: 'normale' },
  { data: '2026-04-24', testata: 'Quotidiano locale', titolo: 'I venetisti contro il no del questore Confartigianato «Bocoli abusivi c\'è un racket»', tipo: 'articolo', link: '/stampa/2026_04_24_I%20venetisti%20contro%20il%20no%20del%20questore%20Confartigianato%20%C2%ABBocoli%20abusivi%20c%27%C3%A8%20un%20racket%C2%BB.pdf', tema: 'Categorie economiche', priorita: 'normale' },
  { data: '2026-04-24', testata: 'Quotidiano locale', titolo: 'Martella «Turismo da governare» Venturini «Servono risorse certe»', tipo: 'articolo', link: '/stampa/2026_04_24_Martella%20%C2%ABTurismo%20da%20governare%C2%BB%20Venturini%20%C2%ABServono%20risorse%20certe%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-24', testata: 'Quotidiano locale', titolo: 'Un 25 Aprile di festa e di memoria su tutto il territorio comunale', tipo: 'articolo', link: '/stampa/2026_04_24_Un%2025%20Aprile%20di%20festa%20e%20di%20memoria%20su%20tutto%20il%20territorio%20comunale.pdf', tema: 'Storia/Ricorrenze', priorita: 'normale' },
  { data: '2026-04-23', testata: 'Quotidiano locale', titolo: 'Caso Pelizzato, l\'attacco di Martella «Martini in cambio voleva Boato»', tipo: 'articolo', link: '/stampa/2026_04_23_Caso%20Pelizzato%2C%20l%27attacco%20di%20Martella%20%C2%ABMartini%20in%20cambio%20voleva%20Boato%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-23', testata: 'Quotidiano locale', titolo: 'Imbrattata sede della Lega, gesto vile e stupido', tipo: 'articolo', link: '/stampa/2026_04_23_Imbrattata%20sede%20della%20Lega%2C%20gesto%20vile%20e%20stupido.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-23', testata: 'Quotidiano locale', titolo: 'Ponte, già 33 mila ticket emessi «Hotel pieni al 90 per cento» Potenziati i treni regionali', tipo: 'articolo', link: '/stampa/2026_04_23_Ponte%2C%20gi%C3%A0%2033%20mila%20ticket%20emessi%20%C2%ABHotel%20pieni%20al%2090%20per%20cento%C2%BB%20Potenziati%20i%20treni%20regionali.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Candidati divisi sulla Città metropolitana', tipo: 'articolo', link: '/stampa/2026_04_22_Candidati%20divisi%20sulla%20Citt%C3%A0%20metropolitana.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Candidati presi di mira dalla satira', tipo: 'articolo', link: '/stampa/2026_04_22_Candidati%20presi%20di%20mira%20dalla%20satira.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Domani c\'è il Consiglio comunale', tipo: 'articolo', link: '/stampa/2026_04_22_Domani%20c%27%C3%A8%20il%20Consiglio%20comunale.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Il 21enne Baretta capolista dei Gialli «È una scelta politica»', tipo: 'articolo', link: '/stampa/2026_04_22_Il%2021enne%20Baretta%20capolista%20dei%20Gialli%20%C2%AB%C3%88%20una%20scelta%20politica%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Il Pd presenta la squadra Pellicani in cima, Seibezzi e Faccini le new entry', tipo: 'articolo', link: '/stampa/2026_04_22_Il%20Pd%20presenta%20la%20squadra%20Pellicani%20in%20cima%2C%20Seibezzi%20e%20Faccini%20le%20new%20entry.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Il nuovo sondaggio, Martella avanti al 48% Venturini al 42%, indeciso un elettore su due', tipo: 'articolo', link: '/stampa/2026_04_22_Il%20nuovo%20sondaggio%2C%20Martella%20avanti%20al%2048%25%20Venturini%20al%2042%25%2C%20indeciso%20un%20elettore%20su%20due.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Venturini suona la carica capolista il ventenne Baretta', tipo: 'articolo', link: '/stampa/2026_04_22_Venturini%20suona%20la%20carica%20capolista%20il%20ventenne%20Baretta.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-22', testata: 'Quotidiano locale', titolo: 'Zuin «Pellicani, Largo ai giovani...»...»', tipo: 'articolo', link: '/stampa/2026_04_22_Zuin%20%C2%ABPellicani%2C%20Largo%20ai%20giovani...%C2%BB...%C2%BB.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-21', testata: 'Quotidiano locale', titolo: 'Elezioni, gli artigiani «Non c`é solo Venezia»', tipo: 'articolo', link: '/stampa/2026_04_21_Elezioni%2C%20gli%20artigiani%20%C2%ABNon%20c%60%C3%A9%20solo%20Venezia%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'Biglietti offensivi attaccati alla sede elettorale di Venturini a Venezia', tipo: 'articolo', link: '/stampa/2026_04_19_Biglietti%20offensivi%20attaccati%20alla%20sede%20elettorale%20di%20Venturini%20a%20Venezia.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'Comunali Venezia, chi sono i sette candidati sindaci', tipo: 'articolo', link: '/stampa/2026_04_19_Comunali%20Venezia%2C%20chi%20sono%20i%20sette%20candidati%20sindaci.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'Del Zotto «Puntiamo al 3 per cento Intercettiamo i tanti che si astengono»', tipo: 'articolo', link: '/stampa/2026_04_19_Del%20Zotto%20%C2%ABPuntiamo%20al%203%20per%20cento%20Intercettiamo%20i%20tanti%20che%20si%20astengono%C2%BB.pdf', tema: 'Politica locale', priorita: 'alta' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'Foglietti con offese sulla sede elettorale di Venturini «Vandalismo». Martella condanna', tipo: 'articolo', link: '/stampa/2026_04_19_Foglietti%20con%20offese%20sulla%20sede%20elettorale%20di%20Venturini%20%C2%ABVandalismo%C2%BB.%20Martella%20condanna.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'I candidati di Del Zotto', tipo: 'articolo', link: '/stampa/2026_04_19_I%20candidati%20di%20Del%20Zotto.pdf', tema: 'Elezioni', priorita: 'alta' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'Polizia locale, controlli 65% ma agenti In calo e sempre più senior', tipo: 'articolo', link: '/stampa/2026_04_19_Polizia%20locale%2C%20controlli%2065%25%20ma%20agenti%20In%20calo%20e%20sempre%20pi%C3%B9%20senior.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'Scritte offensive contro la sede di Venturini a Venezia, dura presa di posizione da parte di Martella', tipo: 'articolo', link: '/stampa/2026_04_19_Scritte%20offensive%20contro%20la%20sede%20di%20Venturini%20a%20Venezia%2C%20dura%20presa%20di%20posizione%20da%20parte%20di%20Martella.pdf', tema: 'Episodi di campagna', priorita: 'normale' },
  { data: '2026-04-19', testata: 'Quotidiano locale', titolo: 'Vandali in sede di Venturini E il Pd presenta la sua lista - Pd, Pellicani capolista, Faccini da indipendente', tipo: 'articolo', link: '/stampa/2026_04_19_Vandali%20in%20sede%20di%20Venturini%20E%20il%20Pd%20presenta%20la%20sua%20lista%20-%20Pd%2C%20Pellicani%20capolista%2C%20Faccini%20da%20indipendente.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-18', testata: 'Quotidiano locale', titolo: 'Comunali, le proposte di Simone Venturini per la Venezia del futuro', tipo: 'articolo', link: '/stampa/2026_04_18_Comunali%2C%20le%20proposte%20di%20Simone%20Venturini%20per%20la%20Venezia%20del%20futuro.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-18', testata: 'Quotidiano locale', titolo: 'La sfida globale di Brugnaro tra soft power culturale e pragmatismo metropolitano', tipo: 'articolo', link: '/stampa/2026_04_18_La%20sfida%20globale%20di%20Brugnaro%20tra%20soft%20power%20culturale%20e%20pragmatismo%20metropolitano.pdf', tema: 'Cultura', priorita: 'normale' },
  { data: '2026-04-18', testata: 'Quotidiano locale', titolo: 'Martella «Venezia puo guidare la svolta sumobilità, logistica e Innovazione»', tipo: 'articolo', link: '/stampa/2026_04_18_Martella%20%C2%ABVenezia%20puo%20guidare%20la%20svolta%20sumobilit%C3%A0%2C%20logistica%20e%20Innovazione%C2%BB.pdf', tema: 'Porto/Logistica', priorita: 'normale' },
  { data: '2026-04-18', testata: 'Quotidiano locale', titolo: 'Ticket d\'accesso, Mazzi «Valuteremo se ci sono alternative». Speranzon «Sì al contributo»', tipo: 'articolo', link: '/stampa/2026_04_18_Ticket%20d%27accesso%2C%20Mazzi%20%C2%ABValuteremo%20se%20ci%20sono%20alternative%C2%BB.%20Speranzon%20%C2%ABS%C3%AC%20al%20contributo%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-18', testata: 'Quotidiano locale', titolo: 'Venturini «Costruire un\'area vasta per poter competere con le città europee»', tipo: 'articolo', link: '/stampa/2026_04_18_Venturini%20%C2%ABCostruire%20un%27area%20vasta%20per%20poter%20competere%20con%20le%20citt%C3%A0%20europee%C2%BB.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-17', testata: 'Quotidiano locale', titolo: 'Domani la Lega alla sfida della piazza «Torniamo padroni a casa nostra»', tipo: 'articolo', link: '/stampa/2026_04_17_Domani%20la%20Lega%20alla%20sfida%20della%20piazza%20%C2%ABTorniamo%20padroni%20a%20casa%20nostra%C2%BB.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-17', testata: 'Quotidiano locale', titolo: 'Intervista a Simone Venturini - Rigeneriamo Mestre per riportare le giovani coppie', tipo: 'articolo', link: '/stampa/2026_04_17_Intervista%20a%20Simone%20Venturini%20-%20Rigeneriamo%20Mestre%20per%20riportare%20le%20giovani%20coppie.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-17', testata: 'Quotidiano locale', titolo: 'Intervista a Simone Venturini - «Venezia si ripopolerà con nuovi posti di lavoro e case»', tipo: 'articolo', link: '/stampa/2026_04_17_Intervista%20a%20Simone%20Venturini%20-%20%C2%ABVenezia%20si%20ripopoler%C3%A0%20con%20nuovi%20posti%20di%20lavoro%20e%20case%C2%BB.pdf', tema: 'Casa/Patrimonio', priorita: 'normale' },
  { data: '2026-04-17', testata: 'Quotidiano locale', titolo: 'Tutto il mondo e Venezia', tipo: 'articolo', link: '/stampa/2026_04_17_Tutto%20il%20mondo%20e%20Venezia.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-16', testata: 'Quotidiano locale', titolo: 'I candidati d\'accordo «Alle Fondazioni private serve una regia unica»', tipo: 'articolo', link: '/stampa/2026_04_16_I%20candidati%20d%27accordo%20%C2%ABAlle%20Fondazioni%20private%20serve%20una%20regia%20unica%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-16', testata: 'Quotidiano locale', titolo: 'Insula, le case sfitte calano a 600 su oltre cinquemila', tipo: 'articolo', link: '/stampa/2026_04_16_Insula%2C%20le%20case%20sfitte%20calano%20a%20600%20su%20oltre%20cinquemila.pdf', tema: 'Casa/Patrimonio', priorita: 'normale' },
  { data: '2026-04-16', testata: 'Quotidiano locale', titolo: 'Municipalità, accordo fatto A Mestre sara testa a testa', tipo: 'articolo', link: '/stampa/2026_04_16_Municipalit%C3%A0%2C%20accordo%20fatto%20A%20Mestre%20sara%20testa%20a%20testa.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-16', testata: 'Quotidiano locale', titolo: 'Serve un sindaco metropolitano per rivitalizzare la città di Venezia', tipo: 'articolo', link: '/stampa/2026_04_16_Serve%20un%20sindaco%20metropolitano%20per%20rivitalizzare%20la%20citt%C3%A0%20di%20Venezia.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-16', testata: 'Quotidiano locale', titolo: 'Venturini e Martella ai mercati cittadini', tipo: 'articolo', link: '/stampa/2026_04_16_Venturini%20e%20Martella%20ai%20mercati%20cittadini.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-15', testata: 'Quotidiano locale', titolo: 'Il voto comunale divide anche i candidati rettori', tipo: 'articolo', link: '/stampa/2026_04_15_Il%20voto%20comunale%20divide%20anche%20i%20candidati%20rettori.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-15', testata: 'Quotidiano locale', titolo: 'Prove di alleanza in Laguna', tipo: 'articolo', link: '/stampa/2026_04_15_Prove%20di%20alleanza%20in%20Laguna.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-15', testata: 'Quotidiano locale', titolo: 'Sicurezza e difesa personale Due incontri in Municipio', tipo: 'articolo', link: '/stampa/2026_04_15_Sicurezza%20e%20difesa%20personale%20Due%20incontri%20in%20Municipio.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-15', testata: 'Quotidiano locale', titolo: 'Spese elettorali, i conti, Manildo 68 mila euro, Stefani soltanto 10 mila Per Zaia tutti fondi Lega', tipo: 'articolo', link: '/stampa/2026_04_15_Spese%20elettorali%2C%20i%20conti%2C%20Manildo%2068%20mila%20euro%2C%20Stefani%20soltanto%2010%20mila%20Per%20Zaia%20tutti%20fondi%20Lega.pdf', tema: 'Finanze', priorita: 'normale' },
  { data: '2026-04-15', testata: 'Quotidiano locale', titolo: 'Venezia Riformista, la gamba centrista della Stagione buona', tipo: 'articolo', link: '/stampa/2026_04_15_Venezia%20Riformista%2C%20la%20gamba%20centrista%20della%20Stagione%20buona.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-15', testata: 'Quotidiano locale', titolo: '«Insularità e statuto speciale la nostra sfida per la città»', tipo: 'articolo', link: '/stampa/2026_04_15_%C2%ABInsularit%C3%A0%20e%20statuto%20speciale%20la%20nostra%20sfida%20per%20la%20citt%C3%A0%C2%BB.pdf', tema: 'Casa/Patrimonio', priorita: 'normale' },
  { data: '2026-04-14', testata: 'Quotidiano locale', titolo: 'Elezioni comunali 2026, chi sono i sette candati sindaco a Venezia', tipo: 'articolo', link: '/stampa/2026_04_14_Elezioni%20comunali%202026%2C%20chi%20sono%20i%20sette%20candati%20sindaco%20a%20Venezia.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-14', testata: 'Quotidiano locale', titolo: 'Municipalità, oggi le decisioni Marotta e Pelizzato in pole', tipo: 'articolo', link: '/stampa/2026_04_14_Municipalit%C3%A0%2C%20oggi%20le%20decisioni%20Marotta%20e%20Pelizzato%20in%20pole.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-14', testata: 'Quotidiano locale', titolo: '«Case pubbliche bloccate da 760 giorni famiglie in attesa per colpa del Comune»', tipo: 'articolo', link: '/stampa/2026_04_14_%C2%ABCase%20pubbliche%20bloccate%20da%20760%20giorni%20famiglie%20in%20attesa%20per%20colpa%20del%20Comune%C2%BB.pdf', tema: 'Casa/Patrimonio', priorita: 'normale' },
  { data: '2026-04-13', testata: 'Quotidiano locale', titolo: 'Perché andare via da Venezia', tipo: 'articolo', link: '/stampa/2026_04_13_Perch%C3%A9%20andare%20via%20da%20Venezia.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Com\'è patriarcale la nostra Venezia', tipo: 'articolo', link: '/stampa/2026_04_12_Com%27%C3%A8%20patriarcale%20la%20nostra%20Venezia.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Coniglio sulla sicurezza «Controlli piu efficaci»', tipo: 'articolo', link: '/stampa/2026_04_12_Coniglio%20sulla%20sicurezza%20%C2%ABControlli%20piu%20efficaci%C2%BB.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Elezioni Comune Venezia, la Lega ha presentato la sua lista dei candidati consiglieri', tipo: 'articolo', link: '/stampa/2026_04_12_Elezioni%20Comune%20Venezia%2C%20la%20Lega%20ha%20presentato%20la%20sua%20lista%20dei%20candidati%20consiglieri.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Elezioni comunali a Venezia, svolta dopo il regno di Brugnaro, sette in lizza per la poltrona di sindaco', tipo: 'articolo', link: '/stampa/2026_04_12_Elezioni%20comunali%20a%20Venezia%2C%20svolta%20dopo%20il%20regno%20di%20Brugnaro%2C%20sette%20in%20lizza%20per%20la%20poltrona%20di%20sindaco.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Lega e i 36 candidati «No alla moschea e norme più severe»', tipo: 'articolo', link: '/stampa/2026_04_12_Lega%20e%20i%2036%20candidati%20%C2%ABNo%20alla%20moschea%20e%20norme%20pi%C3%B9%20severe%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Martella lancia Anna Forte per la Municipalità di Mestre', tipo: 'articolo', link: '/stampa/2026_04_12_Martella%20lancia%20Anna%20Forte%20per%20la%20Municipalit%C3%A0%20di%20Mestre.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Municipalità, il centrosinistra non trova ancora la quadra Ma a Mestre lancia Anna Forte', tipo: 'articolo', link: '/stampa/2026_04_12_Municipalit%C3%A0%2C%20il%20centrosinistra%20non%20trova%20ancora%20la%20quadra%20Ma%20a%20Mestre%20lancia%20Anna%20Forte.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Sinistra Futura con Avs e Martella «Posizione chiara,non cambiamo»', tipo: 'articolo', link: '/stampa/2026_04_12_Sinistra%20Futura%20con%20Avs%20e%20Martella%20%C2%ABPosizione%20chiara%2Cnon%20cambiamo%C2%BB.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-12', testata: 'Quotidiano locale', titolo: 'Zitelli, Balistreri e Toffanello Guadagni con i 5 Stelle', tipo: 'articolo', link: '/stampa/2026_04_12_Zitelli%2C%20Balistreri%20e%20Toffanello%20Guadagni%20con%20i%205%20Stelle.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-11', testata: 'Quotidiano locale', titolo: 'Centrosinistra compatto suuna nuova trasparenza «Sindaco, non padrone»', tipo: 'articolo', link: '/stampa/2026_04_11_Centrosinistra%20compatto%20suuna%20nuova%20trasparenza%20%C2%ABSindaco%2C%20non%20padrone%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-11', testata: 'Quotidiano locale', titolo: 'Gli albergatori a Venezia «Ticket anche al veneu per governare i flussi»', tipo: 'articolo', link: '/stampa/2026_04_11_Gli%20albergatori%20a%20Venezia%20%C2%ABTicket%20anche%20al%20veneu%20per%20governare%20i%20flussi%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-11', testata: 'Quotidiano locale', titolo: 'Gli albergatori dell\'Ava «Ticket anche al veneti per governare i flussi»', tipo: 'articolo', link: '/stampa/2026_04_11_Gli%20albergatori%20dell%27Ava%20%C2%ABTicket%20anche%20al%20veneti%20per%20governare%20i%20flussi%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-11', testata: 'Quotidiano locale', titolo: 'Lega, si ricandidano lutti Tomaello guida il Carroccio', tipo: 'articolo', link: '/stampa/2026_04_11_Lega%2C%20si%20ricandidano%20lutti%20Tomaello%20guida%20il%20Carroccio.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-11', testata: 'Quotidiano locale', titolo: 'Venezia svolta dopo il regno di Brugnaro Sette in lizza per la poltrona di sindaco', tipo: 'articolo', link: '/stampa/2026_04_11_Venezia%20svolta%20dopo%20il%20regno%20di%20Brugnaro%20Sette%20in%20lizza%20per%20la%20poltrona%20di%20sindaco.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-11', testata: 'Quotidiano locale', titolo: 'Zecchi sara capolista di Fratelli d\'Italia «Siamo la prima forza»', tipo: 'articolo', link: '/stampa/2026_04_11_Zecchi%20sara%20capolista%20di%20Fratelli%20d%27Italia%20%C2%ABSiamo%20la%20prima%20forza%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-11', testata: 'Quotidiano locale', titolo: '«C\'è bisogno di sicurezza»', tipo: 'articolo', link: '/stampa/2026_04_11_%C2%ABC%27%C3%A8%20bisogno%20di%20sicurezza%C2%BB.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-10', testata: 'Quotidiano locale', titolo: 'Brugnaro «Racconterò in un libro di mille pagine tutto ciò che ho fatto»', tipo: 'articolo', link: '/stampa/2026_04_10_Brugnaro%20%C2%ABRacconter%C3%B2%20in%20un%20libro%20di%20mille%20pagine%20tutto%20ci%C3%B2%20che%20ho%20fatto%C2%BB.pdf', tema: 'Amministrazione uscente', priorita: 'normale' },
  { data: '2026-04-10', testata: 'Quotidiano locale', titolo: 'E Wall Street scommette sulle elezioni veneziane', tipo: 'articolo', link: '/stampa/2026_04_10_E%20Wall%20Street%20scommette%20sulle%20elezioni%20veneziane.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-10', testata: 'Quotidiano locale', titolo: 'Le scommesse premiamo Venturini, ma poche puntate', tipo: 'articolo', link: '/stampa/2026_04_10_Le%20scommesse%20premiamo%20Venturini%2C%20ma%20poche%20puntate.pdf', tema: 'Sondaggi/Media', priorita: 'normale' },
  { data: '2026-04-09', testata: 'Quotidiano locale', titolo: 'Anche Claudio Vernier si candida a sindaco di Venezia', tipo: 'articolo', link: '/stampa/2026_04_09_Anche%20Claudio%20Vernier%20si%20candida%20a%20sindaco%20di%20Venezia.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-09', testata: 'Quotidiano locale', titolo: 'La polizia locale da potenziare', tipo: 'articolo', link: '/stampa/2026_04_09_La%20polizia%20locale%20da%20potenziare.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-09', testata: 'Quotidiano locale', titolo: 'Martella avanti, ma niente civiche Per il centrodestra è l\'opposto', tipo: 'articolo', link: '/stampa/2026_04_09_Martella%20avanti%2C%20ma%20niente%20civiche%20Per%20il%20centrodestra%20%C3%A8%20l%27opposto.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-09', testata: 'Quotidiano locale', titolo: 'Venturini, 4 under trenta e 13 ex Fucsia, «Obiettivo 30% già al primo turno»', tipo: 'articolo', link: '/stampa/2026_04_09_Venturini%2C%204%20under%20trenta%20e%2013%20ex%20Fucsia%2C%20%C2%ABObiettivo%2030%25%20gi%C3%A0%20al%20primo%20turno%C2%BB.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-07', testata: 'Quotidiano locale', titolo: 'Bilancio e verbali seduta in streaming', tipo: 'articolo', link: '/stampa/2026_04_07_Bilancio%20e%20verbali%20seduta%20in%20streaming.pdf', tema: 'Finanze', priorita: 'normale' },
  { data: '2026-04-07', testata: 'Quotidiano locale', titolo: 'Consiglio comunale e municipalità, esercito di duemila candidati', tipo: 'articolo', link: '/stampa/2026_04_07_Consiglio%20comunale%20e%20municipalit%C3%A0%2C%20esercito%20di%20duemila%20candidati.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-07', testata: 'Quotidiano locale', titolo: 'Del Zotto «Ticket, la mia ricetta»', tipo: 'articolo', link: '/stampa/2026_04_07_Del%20Zotto%20%C2%ABTicket%2C%20la%20mia%20ricetta%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'alta' },
  { data: '2026-04-07', testata: 'Quotidiano locale', titolo: 'In 205mila a Venezia per il ponte pasquale Actv, 100 bis al giorno', tipo: 'articolo', link: '/stampa/2026_04_07_In%20205mila%20a%20Venezia%20per%20il%20ponte%20pasquale%20Actv%2C%20100%20bis%20al%20giorno.pdf', tema: 'Mobilita', priorita: 'normale' },
  { data: '2026-04-07', testata: 'Quotidiano locale', titolo: 'In discussione il rendiconto 2025', tipo: 'articolo', link: '/stampa/2026_04_07_In%20discussione%20il%20rendiconto%202025.pdf', tema: 'Finanze', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Boldrin apre la sede Sicurezza e trasporti tra le sue sette priorità', tipo: 'articolo', link: '/stampa/2026_04_05_Boldrin%20apre%20la%20sede%20Sicurezza%20e%20trasporti%20tra%20le%20sue%20sette%20priorit%C3%A0.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Boldrin «Brugnaro. Non ha fatto nulla Basta lavoro povero Regolare il turismo»', tipo: 'articolo', link: '/stampa/2026_04_05_Boldrin%20%C2%ABBrugnaro.%20Non%20ha%20fatto%20nulla%20Basta%20lavoro%20povero%20Regolare%20il%20turismo%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Buongiorno Marghera ai candidati «Istituzionalizzare le passeggiate civiche»', tipo: 'articolo', link: '/stampa/2026_04_05_Buongiorno%20Marghera%20ai%20candidati%20%C2%ABIstituzionalizzare%20le%20passeggiate%20civiche%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'De Martin all\'attacco «Copiate idee di Brugnaro»', tipo: 'articolo', link: '/stampa/2026_04_05_De%20Martin%20all%27attacco%20%C2%ABCopiate%20idee%20di%20Brugnaro%C2%BB.pdf', tema: 'Amministrazione uscente', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Le spese elettorali fanno litigare i candidati', tipo: 'articolo', link: '/stampa/2026_04_05_Le%20spese%20elettorali%20fanno%20litigare%20i%20candidati.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Martella «Rilanceremo le Municipalità»', tipo: 'articolo', link: '/stampa/2026_04_05_Martella%20%C2%ABRilanceremo%20le%20Municipalit%C3%A0%C2%BB.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Pierangelo Del Zotto «Le petizioni devono essere il cuore di una nuova gestione»', tipo: 'articolo', link: '/stampa/2026_04_05_Pierangelo%20Del%20Zotto%20%C2%ABLe%20petizioni%20devono%20essere%20il%20cuore%20di%20una%20nuova%20gestione%C2%BB.pdf', tema: 'Politica locale', priorita: 'alta' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Spot elettorale girato in municipio, il Pd di Favaro contro Mestriner', tipo: 'articolo', link: '/stampa/2026_04_05_Spot%20elettorale%20girato%20in%20municipio%2C%20il%20Pd%20di%20Favaro%20contro%20Mestriner.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Ticket e turismo, scontro elettorale tra i candidati', tipo: 'articolo', link: '/stampa/2026_04_05_Ticket%20e%20turismo%2C%20scontro%20elettorale%20tra%20i%20candidati.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Ticket, 150 mila euro e 83 multe Il pm, regalare i codici non è reato', tipo: 'articolo', link: '/stampa/2026_04_05_Ticket%2C%20150%20mila%20euro%20e%2083%20multe%20Il%20pm%2C%20regalare%20i%20codici%20non%20%C3%A8%20reato.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-05', testata: 'Quotidiano locale', titolo: 'Tre consigli convocati martedì in terraferma', tipo: 'articolo', link: '/stampa/2026_04_05_Tre%20consigli%20convocati%20marted%C3%AC%20in%20terraferma.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-04', testata: 'Quotidiano locale', titolo: 'Claudio Vernier in corsa il sesto candidato sindaco Mercoledì la presentazione', tipo: 'articolo', link: '/stampa/2026_04_04_Claudio%20Vernier%20in%20corsa%20il%20sesto%20candidato%20sindaco%20Mercoled%C3%AC%20la%20presentazione.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-04', testata: 'Quotidiano locale', titolo: 'Sindaco, Vernier è il settimo candidato - Settimo candidato sindaco In pista Claudio Vernier', tipo: 'articolo', link: '/stampa/2026_04_04_Sindaco%2C%20Vernier%20%C3%A8%20il%20settimo%20candidato%20-%20Settimo%20candidato%20sindaco%20In%20pista%20Claudio%20Vernier.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-04', testata: 'Quotidiano locale', titolo: 'Ticket d\'accesso per 13mila Angeli del decoro in Piazza', tipo: 'articolo', link: '/stampa/2026_04_04_Ticket%20d%27accesso%20per%2013mila%20Angeli%20del%20decoro%20in%20Piazza.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-04', testata: 'Quotidiano locale', titolo: 'Ticket, esordio con il doppio di multe', tipo: 'articolo', link: '/stampa/2026_04_04_Ticket%2C%20esordio%20con%20il%20doppio%20di%20multe.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-04-04', testata: 'Quotidiano locale', titolo: 'Tutti i fucsia di Brugnaro nella civica di Venturini La squadra non cambia', tipo: 'articolo', link: '/stampa/2026_04_04_Tutti%20i%20fucsia%20di%20Brugnaro%20nella%20civica%20di%20Venturini%20La%20squadra%20non%20cambia.pdf', tema: 'Amministrazione uscente', priorita: 'normale' },
  { data: '2026-04-03', testata: 'Quotidiano locale', titolo: 'Al futuro sindaco stipendio mensile di quasi 14mila euro lordi, 10mila al vice - Indennità e gettoni, ecco gli stipendi degli eletti', tipo: 'articolo', link: '/stampa/2026_04_03_Al%20futuro%20sindaco%20stipendio%20mensile%20di%20quasi%2014mila%20euro%20lordi%2C%2010mila%20al%20vice%20-%20Indennit%C3%A0%20e%20gettoni%2C%20ecco%20gli%20stipendi%20degli%20eletti.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-03', testata: 'Quotidiano locale', titolo: 'Bazzaro e Bidoia per le Municipalità Martella in tour nei mercati cittadini', tipo: 'articolo', link: '/stampa/2026_04_03_Bazzaro%20e%20Bidoia%20per%20le%20Municipalit%C3%A0%20Martella%20in%20tour%20nei%20mercati%20cittadini.pdf', tema: 'Elezioni', priorita: 'normale' },
  { data: '2026-04-02', testata: 'Quotidiano locale', titolo: 'L\'idea Fabbriche Nuove «Un polo della ricerca legato alla città d\'acqua»', tipo: 'articolo', link: '/stampa/2026_04_02_L%27idea%20Fabbriche%20Nuove%20%C2%ABUn%20polo%20della%20ricerca%20legato%20alla%20citt%C3%A0%20d%27acqua%C2%BB.pdf', tema: 'Politica locale', priorita: 'normale' },
  { data: '2026-04-02', testata: 'Quotidiano locale', titolo: 'Sul ticket lo stop di Brugnaro «I veneti non devono pagare»', tipo: 'articolo', link: '/stampa/2026_04_02_Sul%20ticket%20lo%20stop%20di%20Brugnaro%20%C2%ABI%20veneti%20non%20devono%20pagare%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'normale' },
  { data: '2026-03-29', testata: 'Quotidiano locale', titolo: 'Del Zotto «Flussi, sentiamo la città»', tipo: 'articolo', link: '/stampa/2026_03_29_Del%20Zotto%20%C2%ABFlussi%2C%20sentiamo%20la%20citt%C3%A0%C2%BB.pdf', tema: 'Turismo/Ticket', priorita: 'alta' },
  { data: '2022-12-27', testata: 'Quotidiano locale', titolo: 'Vigili in fuga «Poca serenità» La replica, sono solo illazioni', tipo: 'articolo', link: '/stampa/2022_12_27_Vigili%20in%20fuga%20%C2%ABPoca%20serenit%C3%A0%C2%BB%20La%20replica%2C%20sono%20solo%20illazioni.pdf', tema: 'Sicurezza', priorita: 'normale' },
  { data: '2022-12-23', testata: 'Quotidiano locale', titolo: 'Polizia locale, sos agenti «Tra gli assunti dal 2017 3 su 4 se ne sono andati»', tipo: 'articolo', link: '/stampa/2022_12_23_Polizia%20locale%2C%20sos%20agenti%20%C2%ABTra%20gli%20assunti%20dal%202017%203%20su%204%20se%20ne%20sono%20andati%C2%BB.pdf', tema: 'Sicurezza', priorita: 'normale' },
];

const GestionePage = () => {
  const [activeTab, setActiveTab] = useState('panoramica');
  const [searchDoc, setSearchDoc] = useState('');
  const [searchPress, setSearchPress] = useState('');
  const [searchCand, setSearchCand] = useState('');
  const [filterStato, setFilterStato] = useState('');
  const [filterTestata, setFilterTestata] = useState('');

  const candidates = [
    { pos: 1, nome: 'Corrado Callegari', eta: 65, professione: 'Già parlamentare, pensionato', nascita: 'Venezia, 06/09/1960' },
    { pos: 2, nome: 'Paolo Pizzolato', eta: 68, professione: 'Pensionato, ragioniere e perito commerciale', nascita: 'Mira (VE), 02/07/1957' },
    { pos: 3, nome: 'Lucio Gianni', eta: 68, professione: 'Ragioniere, ex dirigente enti pubblici', nascita: 'Chioggia (VE), 21/05/1958' },
    { pos: 4, nome: 'Lucia Baggio', eta: 51, professione: 'Analista contabile', nascita: 'Padova, 24/09/1974' },
    { pos: 5, nome: 'Carmine Barbaro', eta: 82, professione: 'Pensionato, ex dipendente Enichem', nascita: 'Venezia, 28/01/1944' },
    { pos: 6, nome: 'Fabio Bressanello', eta: 59, professione: 'Addetto in fornace del vetro', nascita: 'Venezia, 12/09/1966' },
    { pos: 7, nome: 'Giulia Buzzo', eta: 40, professione: 'Addetta alla ristorazione', nascita: 'Venezia, 11/03/1986' },
    { pos: 8, nome: 'Lorena Della Togna', eta: 57, professione: 'Operatrice culturale', nascita: 'Venezia, 05/07/1968' },
    { pos: 9, nome: 'Luciana Ferretti', eta: 80, professione: 'Pensionata', nascita: 'Venezia, 07/02/1946' },
    { pos: 10, nome: 'Sonia Franzoi', eta: 60, professione: 'Impiegata amministrativa', nascita: 'Venezia, 17/12/1965' },
    { pos: 11, nome: 'Tiziana Fraticelli', eta: 58, professione: 'Edicolante', nascita: 'Venezia, 04/10/1967' },
    { pos: 12, nome: 'Stefano Gabbanoto', eta: 60, professione: 'Pensionato, ex vetraio e edicolante', nascita: 'Venezia, 25/06/1965' },
    { pos: 13, nome: 'Silvana Gaggio', eta: 76, professione: 'Pensionata, ex impiegata', nascita: 'Napoli, 09/05/1950' },
    { pos: 14, nome: 'Martina Galvani', eta: 61, professione: 'Editor, scrittrice, ghostwriter', nascita: 'Venezia, 23/01/1965' },
    { pos: 15, nome: 'Valentina Garoli', eta: 31, professione: 'Impiegata settore assicurativo', nascita: 'Este (PD), 21/04/1995' },
    { pos: 16, nome: 'Cristina Giacomazzi', eta: 61, professione: 'Addetta vendita, isolamento termico', nascita: 'Vicenza, 22/09/1964' },
    { pos: 17, nome: 'Marzia Lodoli', eta: 59, professione: 'Operaia, Protezione Civile', nascita: 'Noale, 17/03/1967' },
    { pos: 18, nome: 'Vincenzo Marchesi', eta: 73, professione: 'Pensionato, ex artigiano edile', nascita: 'Este (PD), 01/11/1952' },
    { pos: 19, nome: 'Giuseppe Marzato', eta: 62, professione: 'Gestore negozio di tabacchi', nascita: 'Venezia, 09/06/1963' },
    { pos: 20, nome: 'Patrizia Mel', eta: 74, professione: 'Terapista cranio sacrale', nascita: 'Venezia, 05/06/1951' },
    { pos: 21, nome: 'Christian Omiccioli', eta: 52, professione: 'Tecnico artistico e dello spettacolo', nascita: 'Padova, 12/05/1974' },
    { pos: 22, nome: 'Marco Paggiaro', eta: 39, professione: 'Cuoco professionista', nascita: 'Venezia, 15/11/1986' },
    { pos: 23, nome: 'Giovanni Pagotto', eta: 36, professione: 'Consulente assicurativo', nascita: 'Venezia, 09/09/1989' },
    { pos: 24, nome: 'Anna-Maria Palazzi', eta: 71, professione: 'Pensionata, ex dipendente comunale', nascita: 'Venezia, 13/03/1955' },
    { pos: 25, nome: 'Loris Peltrera', eta: 46, professione: 'Autista NCC e motoscafista', nascita: 'Venezia, 17/08/1979' },
    { pos: 26, nome: 'Simonetta Puppa', eta: 64, professione: 'Operatrice culturale e artistica', nascita: 'Vo\' (PD), 10/04/1962' },
    { pos: 27, nome: 'Fulvio Savio', eta: 70, professione: 'Pensionato, ex Querini Stampalia e ACTV', nascita: 'Venezia, 10/07/1955' },
    { pos: 28, nome: 'Giorgio Tana', eta: 83, professione: 'Pensionato, ex dirigente bancario', nascita: 'Venezia, 24/04/1943' },
    { pos: 29, nome: 'Roberta Travaglia', eta: 60, professione: 'Ragioniera, consulente contabile', nascita: 'Este (PD), 11/09/1965' },
    { pos: 30, nome: 'Fiorella Trevisan', eta: 59, professione: 'Autista mezzi pubblici', nascita: 'Venezia, 27/12/1966' },
    { pos: 31, nome: 'Giorgio Tronca', eta: 58, professione: 'Impiegato tecnico, impiantistica', nascita: 'Vicenza, 09/10/1967' },
    { pos: 32, nome: 'Ivana Varagnolo', eta: 52, professione: 'Segretaria e addetta contabilità', nascita: 'Venezia, 02/07/1973' },
    { pos: 33, nome: 'Francesco Vianello', eta: 48, professione: 'Insegnante scuola superiore', nascita: 'Venezia, 03/09/1977' },
    { pos: 34, nome: 'Michele Vio', eta: 60, professione: 'Artigiano e taxista', nascita: 'Venezia, 03/09/1965' },
    { pos: 35, nome: 'Laura Zaniol', eta: 60, professione: 'Imprenditrice, artigianato muranese', nascita: 'Venezia, 09/07/1965' },
    { pos: 36, nome: 'Gianfranco Zennaro', eta: 71, professione: 'Artigiano in pensione', nascita: 'Venezia, 29/12/1954' },
  ];

  const statoBadge = (stato: string) => {
    const colors: Record<string, string> = { ok: 'bg-green-100 text-green-700', bozza: 'bg-gray-100 text-gray-600', prioritario: 'bg-amber-100 text-amber-700', mancante: 'bg-red-100 text-red-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${colors[stato] || colors.bozza}`}>{stato}</span>;
  };

  const prioBadge = (p: string) => {
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${p === 'alta' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{p}</span>;
  };

  const copyToClipboard = (url: string) => {
    const full = url.startsWith('/') ? 'https://delzottosindaco.github.io' + url : url;
    navigator.clipboard.writeText(full);
  };

  const filteredDocs = documentiCampagna.filter(d =>
    (!searchDoc || d.titolo.toLowerCase().includes(searchDoc.toLowerCase())) &&
    (!filterStato || d.stato === filterStato)
  );

  const filteredPress = rassegnaStampa.filter(p =>
    (!searchPress || p.titolo.toLowerCase().includes(searchPress.toLowerCase()) || p.testata.toLowerCase().includes(searchPress.toLowerCase())) &&
    (!filterTestata || p.testata === filterTestata)
  );

  const filteredCands = candidates.filter(c =>
    !searchCand || c.nome.toLowerCase().includes(searchCand.toLowerCase()) || c.professione.toLowerCase().includes(searchCand.toLowerCase())
  );

  const testate = [...new Set(rassegnaStampa.map(p => p.testata))].sort();
  const docsOk = documentiCampagna.filter(d => d.stato === 'ok').length;
  const docsMancanti = documentiCampagna.filter(d => d.stato === 'mancante').length;
  const docsPrioritari = documentiCampagna.filter(d => d.stato === 'prioritario').length;
  const pressOggi = rassegnaStampa.filter(p => p.data === new Date().toISOString().split('T')[0]).length;

  const tabs = [
    { id: 'panoramica', label: 'Panoramica' },
    { id: 'documenti', label: 'Documenti' },
    { id: 'candidati', label: 'Candidati' },
    { id: 'stampa', label: 'Stampa' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'sondaggi', label: 'Sondaggi' },
    { id: 'contatti', label: 'Contatti' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a3a5c] text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Gestione Campagna Elettorale</h1>
          <p className="text-xs text-white/50">Pierangelo Del Zotto — Sindaco di Venezia 2026</p>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-semibold">RISERVATO</span>
      </div>

      {/* Nav */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-8 flex gap-0 sticky top-[56px] z-40 overflow-x-auto scrollbar-hide" style={{WebkitOverflowScrolling:'touch',scrollbarWidth:'none',msOverflowStyle:'none'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 sm:px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-[3px] transition-all whitespace-nowrap ${activeTab === t.id ? 'text-[#1a3a5c] border-[#2e7d6f]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-6">

        {/* PANORAMICA */}
        {activeTab === 'panoramica' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Documenti</p>
                <p className="text-3xl font-black text-[#1a3a5c] mt-1">{documentiCampagna.length}</p>
                <p className="text-xs text-gray-400 mt-1">{docsOk} completi</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prioritari</p>
                <p className="text-3xl font-black text-amber-500 mt-1">{docsPrioritari}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mancanti</p>
                <p className="text-3xl font-black text-red-500 mt-1">{docsMancanti}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uscite stampa</p>
                <p className="text-3xl font-black text-[#2e7d6f] mt-1">{rassegnaStampa.length}</p>
                <p className="text-xs text-gray-400 mt-1">{pressOggi} oggi</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prossimi eventi</p>
                <p className="text-3xl font-black text-[#1a3a5c] mt-1">{calendario.length}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-[#1a3a5c]">Materiali principali</div>
                <div className="divide-y divide-gray-50">
                  {documentiCampagna.filter(d => d.stato === 'ok').slice(0, 6).map((d, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                      <span className="font-medium">{d.titolo}</span>
                      <div className="flex gap-2">
                        {d.link && <a href={d.link} target="_blank" className="text-xs text-[#2e7d6f] hover:underline font-semibold">Apri</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTI */}
        {activeTab === 'documenti' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-sm text-[#1a3a5c]">Documenti Campagna</span>
              <span className="text-xs text-gray-400">{filteredDocs.length} di {documentiCampagna.length}</span>
            </div>
            <div className="px-5 py-3 border-b border-gray-100 flex gap-3 flex-wrap">
              <input type="text" placeholder="Cerca..." value={searchDoc} onChange={e => setSearchDoc(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[200px]" />
              <select value={filterStato} onChange={e => setFilterStato(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Tutti gli stati</option>
                <option value="ok">OK</option><option value="bozza">Bozza</option>
                <option value="prioritario">Prioritario</option><option value="mancante">Mancante</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                    <th className="px-4 py-3 text-left font-bold">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold">Titolo</th>
                    <th className="px-4 py-3 text-left font-bold">Area</th>
                    <th className="px-4 py-3 text-left font-bold">Stato</th>
                    <th className="px-4 py-3 text-left font-bold">Data</th>
                    <th className="px-4 py-3 text-left font-bold">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDocs.map((d, i) => (
                    <tr key={i} className={`${d.stato === 'mancante' ? 'bg-red-50' : d.stato === 'prioritario' ? 'bg-amber-50' : ''} hover:bg-gray-50`}>
                      <td className="px-4 py-3 text-gray-500">{d.tipo}</td>
                      <td className="px-4 py-3 font-semibold">{d.titolo}</td>
                      <td className="px-4 py-3 text-gray-500">{d.area}</td>
                      <td className="px-4 py-3">{statoBadge(d.stato)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{d.data}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {d.link && <>
                            <a href={d.link} target="_blank" className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200" title="Apri">📄</a>
                            <a href={d.link} download className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200" title="Scarica">⬇️</a>
                            <button onClick={() => copyToClipboard(d.link!)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200" title="Copia link">🔗</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CANDIDATI */}
        {activeTab === 'candidati' && (
          <div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1a3a5c]">Candidati Consigliere Comunale</span>
                <span className="text-xs text-gray-400">{filteredCands.length} candidati</span>
              </div>
              <div className="px-5 py-3">
                <input type="text" placeholder="Cerca candidato..." value={searchCand} onChange={e => setSearchCand(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full max-w-xs" />
              </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                    <th className="px-4 py-3 text-left font-bold">N.</th>
                    <th className="px-4 py-3 text-left font-bold">Nome</th>
                    <th className="px-4 py-3 text-left font-bold">Età</th>
                    <th className="px-4 py-3 text-left font-bold">Professione</th>
                    <th className="px-4 py-3 text-left font-bold">Nascita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCands.map(c => (
                    <tr key={c.pos} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-mono">{c.pos}</td>
                      <td className="px-4 py-3 font-semibold">{c.nome}</td>
                      <td className="px-4 py-3 text-center">{c.eta}</td>
                      <td className="px-4 py-3 text-gray-600">{c.professione}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{c.nascita}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAMPA */}
        {activeTab === 'stampa' && (
          <div className="space-y-6">

            {/* 1. MATERIALI PER LA STAMPA */}
            <h2 className="text-lg font-bold text-[#1a3a5c] border-b-2 border-[#2e7d6f] pb-2">1. Materiali per la stampa</h2>

            {/* Mail template */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1a3a5c]">✉️ Mail tipo per il giornale</span>
                <button onClick={() => navigator.clipboard.writeText(mailGiornale)} className="px-3 py-1.5 bg-[#2e7d6f] text-white rounded-lg text-xs font-semibold hover:opacity-90">📋 Copia testo</button>
              </div>
              <div className="p-5">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{mailGiornale}</pre>
              </div>
            </div>

            {/* Biografia */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-[#1a3a5c]">📝 Biografia candidato sindaco</div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Versione breve</h4>
                    <button onClick={() => navigator.clipboard.writeText(biografiaBreve)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 font-semibold">📋 Copia</button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{biografiaBreve}</p>
                </div>
                <hr className="border-gray-100" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Versione molto breve</h4>
                    <button onClick={() => navigator.clipboard.writeText(biografiaMoltoBreve)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 font-semibold">📋 Copia</button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{biografiaMoltoBreve}</p>
                </div>
              </div>
            </div>

            {/* Dichiarazione */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1a3a5c]">📜 Dichiarazione sui motivi della candidatura</span>
                <button onClick={() => navigator.clipboard.writeText(dichiarazioneCandidatura)} className="px-3 py-1.5 bg-[#2e7d6f] text-white rounded-lg text-xs font-semibold hover:opacity-90">📋 Copia testo</button>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed italic">{dichiarazioneCandidatura}</p>
              </div>
            </div>

            {/* Dati essenziali */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1a3a5c]">📊 Dati essenziali</span>
                <button onClick={() => navigator.clipboard.writeText('Nome: Pierangelo Del Zotto\nNato a: Venezia\nProfessione: Commercialista\nLaurea: Economia, Ca\' Foscari Venezia\nLista: Prima il Veneto\nElezioni: Comunali Venezia, 24-25 maggio 2026\nSito: delzottosindaco.github.io')} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 font-semibold">📋 Copia</button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400 text-xs uppercase font-bold">Nome</span><p className="font-semibold">Pierangelo Del Zotto</p></div>
                  <div><span className="text-gray-400 text-xs uppercase font-bold">Nato a</span><p className="font-semibold">Venezia</p></div>
                  <div><span className="text-gray-400 text-xs uppercase font-bold">Professione</span><p className="font-semibold">Commercialista</p></div>
                  <div><span className="text-gray-400 text-xs uppercase font-bold">Laurea</span><p className="font-semibold">Economia, Ca' Foscari Venezia</p></div>
                  <div><span className="text-gray-400 text-xs uppercase font-bold">Lista</span><p className="font-semibold">Prima il Veneto</p></div>
                  <div><span className="text-gray-400 text-xs uppercase font-bold">Elezioni</span><p className="font-semibold">Comunali Venezia, 24-25 maggio 2026</p></div>
                  <div className="col-span-2"><span className="text-gray-400 text-xs uppercase font-bold">Sito</span><p className="font-semibold">delzottosindaco.github.io</p></div>
                </div>
              </div>
            </div>

            {/* Materiali scaricabili */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-[#1a3a5c]">📎 Materiali scaricabili</div>
              <div className="divide-y divide-gray-50">
                {materialiStampa.map((m, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{m.tipo}</span>
                      <div>
                        <p className="text-sm font-semibold">{m.titolo}</p>
                        <p className="text-xs text-gray-400">{m.desc}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={m.link} target="_blank" className="px-2.5 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 font-semibold">Apri</a>
                      <a href={m.link} download className="px-2.5 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 font-semibold">⬇️</a>
                      <button onClick={() => copyToClipboard(m.link)} className="px-2.5 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 font-semibold">🔗</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anteprime foto */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-[#1a3a5c]">🖼️ Anteprime foto</div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <img src="/sindaco.jpg" alt="Primo piano" className="rounded-lg shadow-sm mx-auto mb-2 max-h-48 object-cover" />
                  <p className="text-xs text-gray-500 font-semibold">Primo piano</p>
                  <a href="/sindaco.jpg" download className="text-xs text-[#2e7d6f] font-semibold hover:underline">Scarica</a>
                </div>
                <div className="text-center">
                  <img src="/sindaco-figura-intera.jpg" alt="Figura intera" className="rounded-lg shadow-sm mx-auto mb-2 max-h-48 object-cover" />
                  <p className="text-xs text-gray-500 font-semibold">Figura intera</p>
                  <a href="/sindaco-figura-intera.jpg" download className="text-xs text-[#2e7d6f] font-semibold hover:underline">Scarica</a>
                </div>
                <div className="text-center">
                  <img src="/logo-ufficiale.png" alt="Logo" className="rounded-lg shadow-sm mx-auto mb-2 max-h-48 object-contain" />
                  <p className="text-xs text-gray-500 font-semibold">Logo campagna</p>
                  <a href="/logo-ufficiale.png" download className="text-xs text-[#2e7d6f] font-semibold hover:underline">Scarica</a>
                </div>
              </div>
            </div>

            {/* 2. RASSEGNA STAMPA */}
            <h2 className="text-lg font-bold text-[#1a3a5c] border-b-2 border-[#2e7d6f] pb-2 mt-8">2. Rassegna stampa</h2>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1a3a5c]">Articoli e uscite</span>
                <span className="text-xs text-gray-400">{filteredPress.length} articoli</span>
              </div>
              {rassegnaStampa.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-100 flex gap-3 flex-wrap">
                  <input type="text" placeholder="Cerca..." value={searchPress} onChange={e => setSearchPress(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[200px]" />
                  {testate.length > 0 && (
                    <select value={filterTestata} onChange={e => setFilterTestata(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="">Tutte le testate</option>
                      {testate.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
                {rassegnaStampa.length === 0 ? (
                  <div className="px-5 py-16 text-center text-gray-400">
                    <p className="text-lg mb-2">📰</p>
                    <p className="font-semibold">Nessuna uscita stampa inserita</p>
                    <p className="text-xs mt-1">Invia gli articoli per popolare questa sezione</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                        <th className="px-4 py-3 text-left font-bold">Data</th>
                        <th className="px-4 py-3 text-left font-bold">Testata</th>
                        <th className="px-4 py-3 text-left font-bold">Titolo</th>
                        <th className="px-4 py-3 text-left font-bold">Tipo</th>
                        <th className="px-4 py-3 text-left font-bold">Tema</th>
                        <th className="px-4 py-3 text-left font-bold">Priorità</th>
                        <th className="px-4 py-3 text-left font-bold">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredPress.map((p, i) => (
                        <tr key={i} className={`${p.priorita === 'alta' ? 'bg-amber-50' : ''} hover:bg-gray-50`}>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{p.data}</td>
                          <td className="px-4 py-3">{p.testata}</td>
                          <td className="px-4 py-3 font-semibold">{p.titolo}</td>
                          <td className="px-4 py-3 text-gray-500">{p.tipo}</td>
                          <td className="px-4 py-3 text-gray-500">{p.tema}</td>
                          <td className="px-4 py-3">{prioBadge(p.priorita)}</td>
                          <td className="px-4 py-3">
                            {p.link && <div className="flex gap-1">
                              <a href={p.link} target="_blank" className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">📄</a>
                              <button onClick={() => copyToClipboard(p.link!)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">🔗</button>
                            </div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}

        {/* CALENDARIO */}
        {activeTab === 'calendario' && (
          <div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1a3a5c]">📅 Calendario Campagna</span>
                <span className="text-xs text-gray-400">{calendario.length} eventi</span>
              </div>
              {calendario.length === 0 ? (
                <div className="px-5 py-16 text-center text-gray-400">
                  <p className="text-lg mb-2">📅</p>
                  <p className="font-semibold">Nessun evento in programma</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {calendario.sort((a, b) => a.data.localeCompare(b.data)).map((ev, i) => {
                    const evDate = new Date(ev.data);
                    const isPast = evDate < new Date(new Date().toISOString().split('T')[0]);
                    const isToday = ev.data === new Date().toISOString().split('T')[0];
                    return (
                      <div key={i} className={`p-5 ${isToday ? 'bg-amber-50 border-l-4 border-amber-400' : isPast ? 'opacity-60' : 'border-l-4 border-[#2e7d6f]'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="text-center min-w-[60px]">
                              <div className="text-2xl font-black text-[#1a3a5c]">{evDate.getDate()}</div>
                              <div className="text-xs font-bold text-gray-400 uppercase">{evDate.toLocaleDateString('it-IT', { month: 'short' })}</div>
                              <div className="text-xs text-gray-400">{evDate.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                            </div>
                            <div>
                              <h3 className="font-bold text-[#1a3a5c]">{ev.titolo}</h3>
                              <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-500">
                                <span>🕐 {ev.ora}</span>
                                <span>📍 {ev.luogo}</span>
                                {ev.contatto && <span>👤 {ev.contatto}</span>}
                              </div>
                              {ev.descrizione && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{ev.descrizione}</p>}
                              {ev.note && <p className="text-xs text-[#2e7d6f] font-semibold mt-2">ℹ️ {ev.note}</p>}
                              {/* Materiali allegati (accordion) */}
                              {ev.data === '2026-04-27' && (
                                <details className="mt-3">
                                  <summary className="cursor-pointer text-sm font-semibold text-[#2e7d6f] hover:text-[#1a3a5c] select-none flex items-center gap-1.5">
                                    <span className="text-xs">▶</span> 📎 Materiali allegati (4 file)
                                  </summary>
                                  <div className="mt-2 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    {[
                                      { nome: 'Risposte associazioni ambiente', file: '/stampa/27-04-26-assoc-ambiente.pdf', tipo: 'PDF' },
                                      { nome: 'Il Futuro del Porto Oltre la Laguna', file: '/stampa/infografica-porto.png', tipo: 'PNG' },
                                      { nome: 'Sviluppo Sostenibile o Assalto al Territorio?', file: '/stampa/infografica-sviluppo.png', tipo: 'PNG' },
                                      { nome: 'S.O.S. Laguna — Grandi Navi e Cemento', file: '/stampa/infografica-laguna.png', tipo: 'PNG' },
                                    ].map((m, mi) => (
                                      <div key={mi} className="flex items-center gap-3 px-4 py-2.5">
                                        <span className="text-base">{m.tipo === 'PDF' ? '📄' : '🖼️'}</span>
                                        <span className="flex-1 text-sm text-gray-700">{m.nome}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{m.tipo}</span>
                                        <a href={m.file} target="_blank" className="text-xs text-[#2e7d6f] font-semibold hover:underline">Vedi</a>
                                        <a href={m.file} download className="text-xs text-[#2e7d6f] font-semibold hover:underline">Scarica</a>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                          {isToday && <span className="px-2.5 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-bold uppercase whitespace-nowrap">Oggi</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SONDAGGI */}
        {activeTab === 'sondaggi' && (
          <div className="space-y-6">
            {/* Sondaggio Tecnè */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-[#1a3a5c]">📊 Sondaggio Tecnè per Venezia Today</span>
                  <p className="text-xs text-gray-400 mt-0.5">16-18 aprile 2026 · 1.000 intervistati · Margine ±3,1%</p>
                </div>
                <a href="/stampa/sondaggio-tecne.pdf" target="_blank" className="text-xs text-[#2e7d6f] hover:underline">📄 PDF</a>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                {/* Intenzioni di voto sindaco */}
                <div>
                  <h4 className="text-sm font-bold text-[#1a3a5c] mb-3">Intenzioni di voto — Sindaco</h4>
                  <p className="text-xs text-gray-400 mb-2">Dichiarano il voto 53% · Astensione/incerti 47%</p>
                  <div className="space-y-2">
                    {[
                      { nome: 'Andrea Martella', perc: 48, colore: '#E53E3E' },
                      { nome: 'Simone Venturini', perc: 42, colore: '#3B82F6' },
                      { nome: 'Altri candidati', perc: 10, colore: '#9CA3AF' },
                    ].map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{c.nome}</span>
                          <span className="font-bold">{c.perc}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4">
                          <div className="h-4 rounded-full transition-all" style={{width: c.perc + '%', backgroundColor: c.colore}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Ballottaggio */}
                <div>
                  <h4 className="text-sm font-bold text-[#1a3a5c] mb-3">Ballottaggio Martella vs Venturini</h4>
                  <p className="text-xs text-gray-400 mb-2">Dichiarano il voto 48% · Astensione/incerti 52%</p>
                  <div className="space-y-2">
                    {[
                      { nome: 'Martella', perc: 52, colore: '#E53E3E' },
                      { nome: 'Venturini', perc: 48, colore: '#3B82F6' },
                    ].map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{c.nome}</span>
                          <span className="font-bold">{c.perc}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4">
                          <div className="h-4 rounded-full transition-all" style={{width: c.perc + '%', backgroundColor: c.colore}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Notorietà candidati */}
                <div>
                  <h4 className="text-sm font-bold text-[#1a3a5c] mb-3">Notorietà candidati</h4>
                  <div className="space-y-1.5">
                    {[
                      { nome: 'Andrea Martella', perc: 71 },
                      { nome: 'Simone Venturini', perc: 70 },
                      { nome: 'Giovanni Martini', perc: 63 },
                      { nome: 'Michele Boldrin', perc: 51 },
                      { nome: 'Pierangelo Del Zotto', perc: 45 },
                      { nome: 'Roberto Agirmo', perc: 45 },
                      { nome: 'Claudio Vernier', perc: 42 },
                    ].map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className={c.nome.includes('Del Zotto') ? 'font-bold text-[#2e7d6f]' : ''}>{c.nome}</span>
                          <span className="font-bold">{c.perc}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full" style={{width: c.perc + '%', backgroundColor: c.nome.includes('Del Zotto') ? '#2e7d6f' : '#94A3B8'}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Problemi principali */}
                <div>
                  <h4 className="text-sm font-bold text-[#1a3a5c] mb-3">Principali problemi di Venezia</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { tema: 'Costo della vita', perc: 48 },
                      { tema: 'Sicurezza personale', perc: 39 },
                      { tema: 'Sanità', perc: 21 },
                      { tema: 'Immigrazione clandestina', perc: 18 },
                      { tema: 'Crisi economica', perc: 18 },
                      { tema: 'Lavoro', perc: 18 },
                      { tema: 'Difficoltà trovare casa', perc: 17 },
                      { tema: 'Tutela della laguna', perc: 16 },
                      { tema: 'Degrado del territorio', perc: 15 },
                      { tema: 'Traffico e parcheggi', perc: 13 },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#1a3a5c] w-8 text-right">{p.perc}%</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-[#2e7d6f]" style={{width: (p.perc / 48 * 100) + '%'}}></div>
                        </div>
                        <span className="text-gray-600 w-36">{p.tema}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Giudizio amministrazione */}
                <div>
                  <h4 className="text-sm font-bold text-[#1a3a5c] mb-3">Giudizio amministrazione uscente</h4>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-medium">Insufficiente (1-5): 62%</span>
                    <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg font-medium">Sufficiente (6): 14%</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium">Buono (7-10): 18%</span>
                    <span className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg font-medium">Senza opinione: 6%</span>
                  </div>
                </div>
                {/* Categorie da aiutare */}
                <div>
                  <h4 className="text-sm font-bold text-[#1a3a5c] mb-3">Categorie da aiutare prioritariamente</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { cat: 'Famiglie', perc: 53 },
                      { cat: 'Giovani', perc: 52 },
                      { cat: 'Anziani', perc: 33 },
                      { cat: 'Commercianti/Artigiani', perc: 23 },
                      { cat: 'Pensionati', perc: 21 },
                      { cat: 'Poveri', perc: 21 },
                      { cat: 'Donne', perc: 17 },
                      { cat: 'Lavoratori dipendenti', perc: 16 },
                    ].map((c, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">{c.cat} <b className="text-[#1a3a5c]">{c.perc}%</b></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Comunicato Demetra */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-[#1a3a5c]">📋 Comunicato su Sondaggio Demetra</span>
                  <p className="text-xs text-gray-400 mt-0.5">9 aprile 2026 · Comunicato stampa Del Zotto</p>
                </div>
                <a href="/stampa/sondaggi-demetra.pdf" target="_blank" className="text-xs text-[#2e7d6f] hover:underline">📄 PDF</a>
              </div>
              <div className="p-4 sm:p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900 font-medium mb-2">⚠️ Nota sulla metodologia dei sondaggi</p>
                  <p className="text-sm text-amber-800 leading-relaxed">Del Zotto contesta l'uso del sondaggio Demetra del 27 febbraio (quando c'erano solo 3 candidati principali) come dato attuale. «Utilizzare quel dato oggi, estrapolandolo dal suo contesto originale, significa fornire un'informazione parziale e non aggiornata.»</p>
                  <p className="text-sm text-amber-800 leading-relaxed mt-2">«La priorità non è annunciare vittorie presunte, ma offrire programmi concreti. Solo le urne sanciranno la volontà reale dei cittadini.»</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTATTI */}
        {activeTab === 'contatti' && (
          <div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1a3a5c]">📇 Contatti Campagna Elettorale</span>
                <span className="text-xs text-gray-400">{contattiCampagna.length} contatti</span>
              </div>
              {contattiCampagna.length > 0 && (
                <>
                  {/* Desktop: tabella */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                          <th className="px-4 py-3 text-left font-bold">Nome e Cognome</th>
                          <th className="px-4 py-3 text-left font-bold">Email</th>
                          <th className="px-4 py-3 text-left font-bold">Telefono</th>
                          <th className="px-4 py-3 text-left font-bold">Sito</th>
                          <th className="px-4 py-3 text-left font-bold">Professione</th>
                          <th className="px-4 py-3 text-left font-bold">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {contattiCampagna.map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold">{c.nome}</td>
                            <td className="px-4 py-3">{c.email ? <a href={'mailto:' + c.email} className="text-[#2e7d6f] hover:underline">{c.email}</a> : '—'}</td>
                            <td className="px-4 py-3">{c.tel ? <a href={'tel:' + c.tel} className="text-[#2e7d6f] hover:underline">{c.tel}</a> : '—'}</td>
                            <td className="px-4 py-3">{c.sito ? <a href={c.sito} target="_blank" className="text-[#2e7d6f] hover:underline text-xs">{c.sito}</a> : '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{c.professione || '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{c.note || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile: cards */}
                  <div className="sm:hidden divide-y divide-gray-100">
                    {contattiCampagna.map((c, i) => (
                      <div key={i} className="px-4 py-4">
                        <p className="font-bold text-[#1a3a5c]">{c.nome}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.professione || ''}</p>
                        <div className="mt-2 flex flex-col gap-1.5">
                          {c.email && <a href={'mailto:' + c.email} className="text-sm text-[#2e7d6f] flex items-center gap-1.5">✉️ {c.email}</a>}
                          {c.tel && <a href={'tel:' + c.tel} className="text-sm text-[#2e7d6f] flex items-center gap-1.5">📞 {c.tel}</a>}
                          {c.sito && <a href={c.sito} target="_blank" className="text-sm text-[#2e7d6f] flex items-center gap-1.5">🌐 {c.sito}</a>}
                        </div>
                        {c.note && <p className="text-xs text-gray-400 mt-2">{c.note}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {contattiCampagna.length === 0 && (
                <div className="px-5 py-16 text-center text-gray-400">
                  <p className="text-lg mb-2">📇</p>
                  <p className="font-semibold">Nessun contatto inserito</p>
                  <p className="text-xs mt-1">Invia i contatti per popolare questa sezione</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-300">
        Dashboard riservata — delzottosindaco.github.io
      </div>
    </div>
  );
};

export default function App() {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTransparencyModalOpen, setIsTransparencyModalOpen] = useState(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isInnovationModalOpen, setIsInnovationModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [featuredProjectImage, setFeaturedProjectImage] = useState("");
  const [featuredProjectArticle, setFeaturedProjectArticle] = useState("");
  const [biographyLogo, setBiographyLogo] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "project"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setFeaturedProjectImage(data.url || "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Venice_-_Fabbriche_Nuove_di_Rialto.jpg/1280px-Venice_-_Fabbriche_Nuove_di_Rialto.jpg");
        setFeaturedProjectArticle(data.articleUrl || "");
        if (data.url) localStorage.setItem("projectImage", data.url);
        if (data.articleUrl) localStorage.setItem("projectArticle", data.articleUrl);
      } else {
        const localImg = localStorage.getItem("projectImage");
        const localArt = localStorage.getItem("projectArticle");
        if (localImg) setFeaturedProjectImage(localImg);
        else setFeaturedProjectImage("https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Venice_-_Fabbriche_Nuove_di_Rialto.jpg/1280px-Venice_-_Fabbriche_Nuove_di_Rialto.jpg");
        if (localArt) setFeaturedProjectArticle(localArt);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "biographyLogo"), (doc) => {
      if (doc.exists()) {
        const url = doc.data().url;
        setBiographyLogo(url);
        localStorage.setItem("biographyLogo", url);
      } else {
        const local = localStorage.getItem("biographyLogo");
        if (local) {
          setBiographyLogo(local);
        } else {
          setBiographyLogo("/logo.png");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "siteLogo"), (doc) => {
      if (doc.exists()) {
        const url = doc.data().url;
        setSiteLogo(url);
        localStorage.setItem("siteLogo", url);
      } else {
        const local = localStorage.getItem("siteLogo");
        if (local) {
          setSiteLogo(local);
        } else {
          setSiteLogo("/logo.png");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProjectImageChange = async (url: string) => {
    setFeaturedProjectImage(url);
    localStorage.setItem("projectImage", url);
    try {
      await setDoc(doc(db, "settings", "project"), { 
        url,
        articleUrl: featuredProjectArticle || "" 
      }, { merge: true });
    } catch (err: any) {
      console.error("Error saving project image", err);
    }
  };

  const handleProjectArticleChange = async (url: string) => {
    setFeaturedProjectArticle(url);
    localStorage.setItem("projectArticle", url);
    try {
      await setDoc(doc(db, "settings", "project"), { 
        url: featuredProjectImage || "",
        articleUrl: url 
      }, { merge: true });
    } catch (err: any) {
      console.error("Error saving project article", err);
    }
  };

  const handleBiographyLogoChange = async (url: string) => {
    setBiographyLogo(url);
    localStorage.setItem("biographyLogo", url);
    try {
      await setDoc(doc(db, "settings", "biographyLogo"), { url });
    } catch (err: any) {
      console.error("Error saving biography logo", err);
    }
  };

  const handleSiteLogoChange = async (url: string) => {
    setSiteLogo(url);
    localStorage.setItem("siteLogo", url);
    try {
      await setDoc(doc(db, "settings", "siteLogo"), { url });
    } catch (err: any) {
      console.error("Error saving site logo", err);
      alert(`Errore salvataggio impostazioni: ${err.message || "Non hai i permessi per modificare le impostazioni."}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth State Changed:", u ? { email: u.email, verified: u.emailVerified } : "No User");
      setUser(u);
      setIsAdmin(u?.email?.toLowerCase() === "daniela@coletti.it");
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => auth.signOut();

  // Pagina gestione nascosta
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get('p');
  const isGestione = window.location.pathname === "/gestione" || redirectPath === "/gestione";
  
  if (isGestione) {
    if (redirectPath) window.history.replaceState(null, '', '/gestione');
    return <GestionePage />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Floating Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <motion.img 
          src={siteLogo || undefined}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1.1 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="w-[85vw] max-w-[900px] h-auto grayscale brightness-0 select-none"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>

      <div className="relative z-10">
        <Navbar 
          user={user} 
          isAdmin={isAdmin} 
          onLogin={handleLogin} 
          onLogout={handleLogout} 
          onOpenContact={() => setIsContactModalOpen(true)}
          logo={siteLogo}
          onLogoChange={handleSiteLogoChange}
        />
        <main>
        <Hero isAdmin={isAdmin} onOpenContact={() => setIsContactModalOpen(true)} />
        
        {/* Countdown alle elezioni */}
        <CountdownSection />

        {/* Banner evento in evidenza */}
        <section className="py-6 bg-surface">
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            <a href="/evento-9maggio.jpg" target="_blank" className="block rounded-2xl overflow-hidden shadow-xl border-2 border-[#F5E106] hover:shadow-2xl transition-shadow">
              <img src="/evento-9maggio.jpg" alt="Presentazione Candidati — Sabato 9 Maggio ore 10:00, Hotel Ambasciatori, Corso del Popolo 221, Mestre" className="w-full" />
            </a>
          </div>
        </section>

        <Biography 
          logo={biographyLogo} 
          onLogoChange={handleBiographyLogoChange} 
          isAdmin={isAdmin} 
        />
        <Candidates user={user} isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} devMode={false} />
        <Pillars onOpenInnovation={() => setIsInnovationModalOpen(true)} />
        <Program />
        <ContactCTA onOpenContact={() => setIsContactModalOpen(true)} />
        <FAQSection />
      </main>
      <Footer 
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)} 
        onOpenTransparency={() => setIsTransparencyModalOpen(true)}
        onOpenCookieSettings={() => setIsCookieModalOpen(true)}
        onOpenContact={() => setIsContactModalOpen(true)}
        logo={siteLogo}
        onLogoChange={handleSiteLogoChange}
        isAdmin={isAdmin}
      />
      </div>

      <AnimatePresence>
        {isInnovationModalOpen && (
          <InnovationDetail 
            isOpen={isInnovationModalOpen}
            onClose={() => setIsInnovationModalOpen(false)}
            image={featuredProjectImage} 
            onImageChange={handleProjectImageChange} 
            article={featuredProjectArticle}
            onArticleChange={handleProjectArticleChange}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContactModalOpen && (
          <ContactModal 
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {isAdmin && (
        <div className="fixed bottom-24 right-8 z-40">
          <div className="bg-surface-container-highest p-4 rounded-2xl shadow-2xl border border-outline-variant/30 text-[10px] font-mono max-w-xs">
            <p className="font-bold mb-2 text-primary uppercase">Admin Debug</p>
            <p>Email: {user?.email || "Admin"}</p>
            <p>Admin: SÌ</p>
            
            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={async () => {
                  try {
                    const testData = {
                      name: "Test Admin",
                      email: "test@example.com",
                      type: "TEST_DEBUG",
                      message: "Messaggio di prova generato dal pannello Debug per verifica configurazione email.",
                      createdAt: new Date().toISOString(),
                      status: "test"
                    };

                    // 1. Save to DB
                    const res = await addDoc(collection(db, "contacts"), testData);
                    
                    // 2. Try Email
                    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_qy7zqvm';
                    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_yx6xerq';
                    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'LzW_a7EOSe4fymqxW';
                    const toEmail = import.meta.env.VITE_EMAILJS_TO_EMAIL || 'delzottosindaco@gmail.com';

                    let emailStatus = "";
                    if (serviceId && templateId && publicKey) {
                      try {
                        await emailjs.send(
                          serviceId, 
                          templateId, 
                          {
                            nome_cognome: testData.name,
                            email: testData.email,
                            tipo_messaggio: testData.type,
                            tuo_messaggio: testData.message,
                            to_email: toEmail,
                            firestore_id: res.id
                          },
                          publicKey
                        );
                        emailStatus = "✅ Email inviata con successo!";
                      } catch (err) {
                        emailStatus = "❌ Errore EmailJS: " + (err instanceof Error ? err.message : String(err));
                      }
                    } else {
                      emailStatus = "⚠️ EmailJS non configurato (mancano chiavi in Settings).";
                    }

                    alert(`Test completato:\n1. DB: Salvato (${res.id})\n2. Email: ${emailStatus}`);
                  } catch (e) {
                    alert("Errore generale nel test: " + (e instanceof Error ? e.message : String(e)));
                  }
                }}
                className="bg-primary text-on-primary px-3 py-1 rounded-md font-bold text-[9px]"
              >
                Invia Messaggio Prova (DB + Email)
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-outline text-on-surface px-3 py-1 rounded-md font-bold text-[9px]"
              >
                Pulisci Cache (Reset Locale)
              </button>
            </div>
          </div>
        </div>
      )}
      <PrivacyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
      <TransparencyModal 
        isOpen={isTransparencyModalOpen} 
        onClose={() => setIsTransparencyModalOpen(false)} 
      />
      <CookieModal 
        isOpen={isCookieModalOpen} 
        onClose={() => setIsCookieModalOpen(false)} 
      />
    </div>
  );
}
