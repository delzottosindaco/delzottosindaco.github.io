import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cookie, ShieldCheck, BarChart3, Target } from 'lucide-react';

interface CookieModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookieModal: React.FC<CookieModalProps> = ({ isOpen, onClose }) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const handleSave = () => {
    // In a real app, we would save these to localStorage or cookies
    console.log('Saving cookie settings:', { analyticsEnabled, marketingEnabled });
    onClose();
  };

  const handleClearAll = () => {
    setAnalyticsEnabled(false);
    setMarketingEnabled(false);
    console.log('Clearing all optional cookies');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-outline-variant/20"
          >
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <Cookie className="text-primary" size={28} />
                <h2 className="text-2xl font-black text-on-surface tracking-tighter">Impostazioni Cookie</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
                aria-label="Chiudi"
              >
                <X size={24} className="text-on-surface/60" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto text-on-surface/80 leading-relaxed space-y-8">
              <p className="text-sm opacity-70">
                Gestisci le tue preferenze relative ai cookie. I cookie ci aiutano a migliorare la tua esperienza sul sito e a misurare l'efficacia della nostra comunicazione politica.
              </p>

              {/* Essential Cookies */}
              <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-on-surface tracking-tight">Cookie Essenziali</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-success/10 text-success px-2 py-1 rounded-md">Sempre Attivi</span>
                    </div>
                    <p className="text-sm opacity-70 mb-3">
                      Necessari per il corretto funzionamento del sito (es. sessione login donatori, sicurezza).
                    </p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      ✅ Art. 122 Codice Privacy - Nessun consenso richiesto
                    </p>
                  </div>
                </div>
              </section>

              {/* Analytical Cookies */}
              <section className="p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-tertiary/10 rounded-xl text-tertiary">
                    <BarChart3 size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-on-surface tracking-tight">Cookie Analitici <span className="text-xs font-normal opacity-50">(opzionali)</span></h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={analyticsEnabled}
                          onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <p className="text-sm opacity-70">
                      Google Analytics (anonimizzato) per raccogliere statistiche aggregate sulle visite alla campagna elettorale.
                    </p>
                    <div className="mt-3 flex gap-4">
                      <button 
                        onClick={() => setAnalyticsEnabled(true)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border transition-all ${analyticsEnabled ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant hover:border-primary'}`}
                      >
                        Attiva
                      </button>
                      <button 
                        onClick={() => setAnalyticsEnabled(false)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border transition-all ${!analyticsEnabled ? 'bg-outline text-on-surface border-outline' : 'border-outline-variant hover:border-outline'}`}
                      >
                        Disattiva
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Marketing Cookies */}
              <section className="p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Target size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-on-surface tracking-tight">Cookie Marketing <span className="text-xs font-normal opacity-50">(opzionali)</span></h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={marketingEnabled}
                          onChange={(e) => setMarketingEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <p className="text-sm opacity-70">
                      Facebook Pixel per propaganda targettizzata e misurazione dell'efficacia degli annunci sui social media.
                    </p>
                    <div className="mt-3 flex gap-4">
                      <button 
                        onClick={() => setMarketingEnabled(true)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border transition-all ${marketingEnabled ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant hover:border-primary'}`}
                      >
                        Attiva
                      </button>
                      <button 
                        onClick={() => setMarketingEnabled(false)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border transition-all ${!marketingEnabled ? 'bg-outline text-on-surface border-outline' : 'border-outline-variant hover:border-outline'}`}
                      >
                        Disattiva
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={handleClearAll}
                className="text-sm font-bold text-on-surface/60 hover:text-error transition-colors px-4 py-2"
              >
                Cancella tutti i cookie
              </button>
              <button
                onClick={handleSave}
                className="bg-primary text-on-primary px-10 py-3.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                Salva impostazioni
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CookieModal;
