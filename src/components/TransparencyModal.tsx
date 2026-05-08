import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Calendar, ShieldCheck } from 'lucide-react';

interface TransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransparencyModal: React.FC<TransparencyModalProps> = ({ isOpen, onClose }) => {
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
            className="relative w-full max-w-3xl max-h-[85vh] bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-outline-variant/20"
          >
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary" size={28} />
                <h2 className="text-2xl font-black text-on-surface tracking-tighter">Trasparenza Elettorale</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
                aria-label="Chiudi"
              >
                <X size={24} className="text-on-surface/60" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto text-on-surface/80 leading-relaxed space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="font-black">1</span>
                  </div>
                  <h3 className="text-xl font-black text-on-surface tracking-tight">Impegno alla Trasparenza</h3>
                </div>
                <p className="pl-13">
                  Il comitato elettorale <strong>Del Zotto</strong> garantisce massima trasparenza su dati elettorali, finanziamenti e trattamento dati personali, ai sensi del <strong>D.Lgs. 33/2013 (FOIA)</strong> e del <strong>GDPR</strong>. La nostra missione è un'amministrazione aperta e verificabile dai cittadini.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="font-black">2</span>
                  </div>
                  <h3 className="text-xl font-black text-on-surface tracking-tight">Documentazione disponibile</h3>
                </div>
                <div className="grid gap-4 pl-13">
                  <div className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-colors group">
                    <FileText className="text-primary group-hover:scale-110 transition-transform" size={24} />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Liste elettorali e certificazioni</p>
                      <p className="text-xs opacity-60 italic">Documentazione ufficiale candidati</p>
                    </div>
                    <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Scarica PDF</button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-colors group">
                    <FileText className="text-primary group-hover:scale-110 transition-transform" size={24} />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Bilancio campagna elettorale</p>
                      <p className="text-xs opacity-60 italic">Entrate/uscite aggiornate mensilmente</p>
                    </div>
                    <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Scarica PDF</button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-colors group">
                    <Calendar className="text-primary group-hover:scale-110 transition-transform" size={24} />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Eventi e appuntamenti pubblici</p>
                      <p className="text-xs opacity-60 italic">Calendario completo delle attività</p>
                    </div>
                    <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Apri Google Calendar</button>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-highest p-8 rounded-3xl border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="font-black">3</span>
                  </div>
                  <h3 className="text-xl font-black text-on-surface tracking-tight">Trasparenza Privacy (Art. 5, 12-14 GDPR)</h3>
                </div>
                <div className="space-y-4 text-sm pl-13">
                  <p>
                    Tutti i dati raccolti (email, contatti) sono trattati con consenso esplicito per finalità di propaganda elettorale.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-outline-variant/20">
                    <div>
                      <p className="font-black uppercase text-[10px] tracking-widest text-primary mb-1">Titolare</p>
                      <p className="font-bold">Pierangelo Del Zotto</p>
                      <p className="opacity-70">San Polo, Venezia</p>
                    </div>
                    <div>
                      <p className="font-black uppercase text-[10px] tracking-widest text-primary mb-1">Diritti e Contatti</p>
                      <p className="font-bold">Opposizione e cancellazione</p>
                      <a href="mailto:privacy@delzotto.it" className="text-primary hover:underline">privacy@delzotto.it</a>
                    </div>
                    <div>
                      <p className="font-black uppercase text-[10px] tracking-widest text-primary mb-1">Conservazione</p>
                      <p className="font-bold">Max 6 mesi post-elezioni</p>
                    </div>
                    <div>
                      <p className="font-black uppercase text-[10px] tracking-widest text-primary mb-1">Ultimo Aggiornamento</p>
                      <p className="font-bold">04/04/2026</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end">
              <button
                onClick={onClose}
                className="bg-primary text-on-primary px-10 py-3.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                Chiudi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransparencyModal;
