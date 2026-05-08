import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
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
            className="relative w-full max-w-3xl max-h-[80vh] bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-outline-variant/20"
          >
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
              <h2 className="text-2xl font-black text-on-surface tracking-tighter">Informativa Privacy</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
                aria-label="Chiudi"
              >
                <X size={24} className="text-on-surface/60" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto text-on-surface/80 leading-relaxed space-y-6">
              <section>
                <h3 className="text-lg font-black text-primary mb-2 uppercase tracking-widest">Titolare del trattamento</h3>
                <p>
                  Il titolare del trattamento dei dati personali è <strong>Pierangelo Del Zotto</strong>, con sede in San Polo, Venezia, email di contatto: <a href="mailto:privacy@delzotto.it" className="text-primary hover:underline">privacy@delzotto.it</a>.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-primary mb-2 uppercase tracking-widest">Finalità e base giuridica del trattamento</h3>
                <p>I dati personali forniti attraverso questo sito (es. modulo di contatto, iscrizione newsletter, richiesta informazioni) saranno trattati per:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>comunicazioni relative alla campagna elettorale del candidato Del Zotto;</li>
                  <li>informazione politica e inviti ad eventi;</li>
                  <li>invio di materiali di propaganda elettorale via email o altri mezzi digitali.</li>
                </ul>
                <p className="mt-4">
                  La base giuridica del trattamento è il consenso esplicito dell’interessato ai sensi dell’art. 6, par. 1, lett. a) del GDPR.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-primary mb-2 uppercase tracking-widest">Modalità di trattamento</h3>
                <p>
                  I dati vengono trattati con strumenti informatici e telematici, adottando misure di sicurezza idonee a garantire la riservatezza e l’integrità delle informazioni.
                </p>
                <p className="mt-2">
                  I dati non vengono comunicati a terzi né trasferiti al di fuori dello Spazio Economico Europeo.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-primary mb-2 uppercase tracking-widest">Periodo di conservazione</h3>
                <p>
                  I dati saranno conservati per tutto il periodo della campagna elettorale e al massimo entro 6 mesi dalla conclusione delle elezioni, salvo revoca anticipata del consenso.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-primary mb-2 uppercase tracking-widest">Diritti dell’interessato</h3>
                <p>L’interessato può esercitare in ogni momento i diritti previsti dagli artt. 15–22 del GDPR, inclusi:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>diritto di accesso, rettifica o cancellazione dei dati;</li>
                  <li>diritto di limitazione e portabilità;</li>
                  <li>diritto di opposizione al trattamento per finalità di propaganda elettorale.</li>
                </ul>
                <p className="mt-4">
                  Per esercitare i propri diritti o revocare il consenso, è possibile scrivere a <a href="mailto:privacy@delzotto.it" className="text-primary hover:underline">privacy@delzotto.it</a>.
                </p>
              </section>

              <section className="bg-surface-container-highest p-6 rounded-2xl border border-outline-variant/10">
                <h3 className="text-lg font-black text-on-surface mb-2 uppercase tracking-widest">Consenso</h3>
                <p className="text-sm">
                  Compilando i moduli di questo sito o iscrivendosi alle comunicazioni, l’utente dichiara di aver letto la presente informativa e acconsente volontariamente al trattamento dei dati per le finalità di informazione e propaganda elettorale.
                </p>
              </section>
            </div>
            
            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end">
              <button
                onClick={onClose}
                className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                Ho capito
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyModal;
