import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  ChevronRight,
  BookOpen,
  Award,
  Send,
  CheckCircle2,
  AlertCircle,
  Users,
  Settings,
  X,
  ShieldCheck,
  Search,
  Trash2
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, getDocs, doc, getDocFromServer, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// New Image Assets
import jesusHeroImg from './assets/capa.jpg';
import statsInstrutorImg from './assets/perfil.jpg';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Types
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any;
}

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
}

interface Theme {
  chapter: string;
  title: string;
  description: string;
}

const THEMES: Theme[] = [
  { chapter: "Apocalipse 1", title: "A Visão do Cristo Glorificado", description: "O início da revelação no meio da Igreja." },
  { chapter: "Apocalipse 2-3", title: "As Sete Igrejas", description: "Mensagens específicas para o tempo profético." },
  { chapter: "Apocalipse 4-5", title: "O Trono de Deus e o Cordeiro", description: "O Livro Selado e a adoração celestial." },
  { chapter: "Apocalipse 6-7", title: "Os Sete Selos", description: "A história da humanidade e o selamento dos 144.000." },
  { chapter: "Apocalipse 8-9", title: "As Sete Trombetas", description: "Juízos divinos na história humana." },
  { chapter: "Apocalipse 10-11", title: "O Livrinho Aberto", description: "O grande desapontamento e as duas testemunhas." },
  { chapter: "Apocalipse 12", title: "O Grande Conflito", description: "A Mulher, o Dragão e a descendência fiel." },
  { chapter: "Apocalipse 13", title: "As Duas Bestas", description: "O poder que emerge do mar e da terra." },
  { chapter: "Apocalipse 14", title: "As Três Mensagens Angélicas", description: "O convite final de Deus para o mundo." },
  { chapter: "Apocalipse 15-16", title: "As Sete Últimas Pragas", description: "O fim da graça e os juízos finais." },
  { chapter: "Apocalipse 17-18", title: "O Mistério de Babilônia", description: "A queda do sistema religioso falso." },
  { chapter: "Apocalipse 19-20", title: "O Milênio e o Fim do Pecado", description: "A volta de Cristo e os mil anos de paz." },
  { chapter: "Apocalipse 21-22", title: "A Nova Jerusalém", description: "O Lar Eterno e a restauração de todas as coisas." },
];

export default function App() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin and Real-time Counter States
  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regToDelete, setRegToDelete] = useState<Registration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [instructorImageError, setInstructorImageError] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  const ADMIN_PASSWORD = "184477"; // Senha administrada

  // Real-time counter listener
  useEffect(() => {
    const q = query(collection(db, 'registrations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRegistrationCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  // Countdown Logic
  useEffect(() => {
    const targetDate = new Date('2026-04-27T19:00:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string) => {
    console.error(`Firestore error during ${operationType} at ${path}:`, error);
    const errorInfo: FirestoreErrorInfo = {
      error: error.message || 'Unknown error',
      operationType,
      path
    };
    throw new Error(JSON.stringify(errorInfo));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await addDoc(collection(db, 'registrations'), {
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone,
        createdAt: serverTimestamp()
      });
      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '' });
    } catch (error: any) {
      if (error.message.includes('permission-denied')) {
        setErrorMessage("Erro de permissão ao salvar. Por favor, tente novamente mais tarde.");
      } else {
        setErrorMessage("Ocorreu um erro ao processar sua inscrição. Verifique sua conexão.");
      }
      handleFirestoreError(error, 'create', 'registrations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAdminError(null);
      fetchRegistrations();
    } else {
      setAdminError("Senha incorreta.");
    }
  };

  const fetchRegistrations = async () => {
    try {
      const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      setRegistrations(data);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleRegistrationDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'registrations', id));
      setRegistrations(prev => prev.filter(reg => reg.id !== id));
      // No need to decrement registrationCount manually, 
      // the onSnapshot listener handles it automatically.
      setRegToDelete(null);
    } catch (error) {
      console.error("Error deleting registration:", error);
      alert("Erro ao remover inscrito. Verifique as permissões.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reg.email && reg.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    reg.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#050B18] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen overflow-hidden flex flex-col justify-start md:justify-center pt-6 md:pt-0">
        {/* Background Image Container */}
        <div className="absolute top-0 right-0 w-full md:w-[65%] h-full z-[5] overflow-hidden bg-[#050B18]">
          <img
            src="/backgound.png"
            alt="Seminário Apocalipse"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('unsplash')) {
                target.src = "https://images.unsplash.com/photo-1548504769-900b700122e1?auto=format&fit=crop&q=80&w=1200";
              }
            }}
          />
          {/* Subtle light leak */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050B18] via-[#050B18]/40 to-transparent z-[6]" />
          <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-[#050B18] to-transparent z-[6]" />
        </div>

        {/* Hero Content */}
        <section className="relative z-10 px-6 py-4 md:py-20 max-w-7xl mx-auto text-center md:text-left grid md:grid-cols-2 gap-8 md:gap-12 items-center w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4 md:space-y-6"
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-2 md:mb-0">
                Contagem Regressiva para o Fim
              </div>
            </div>

            <h1 className="text-5xl md:text-9xl font-display leading-[0.9] md:leading-[0.85] tracking-tight uppercase text-left">
              Seminário <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-600 font-black">
                Apocalipse
              </span>
            </h1>

            <div className="pt-48 md:pt-8 space-y-6 md:space-y-8">
              <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-[260px] md:max-w-sm mx-auto md:mx-0">
                {Object.entries(timeLeft).map(([unit, value]) => (
                  <div key={unit} className="flex flex-col items-center p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-xl md:text-4xl font-mono font-bold text-orange-500">
                      {value.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white font-bold">
                      {unit === 'days' ? 'Dias' : unit === 'hours' ? 'Horas' : unit === 'minutes' ? 'Min' : 'Seg'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-6 pt-2">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300 justify-start">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    <span>Início: 27 de Abril</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300 justify-start">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    <span>Segundas e Quintas, 19:00</span>
                  </div>
                </div>
                <div className="pt-1 flex flex-row items-center gap-3 md:gap-4 justify-start">
                  <a
                    href="#inscricao"
                    className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-none sm:w-auto bg-orange-600 hover:bg-orange-500 px-4 md:px-6 py-4 rounded-xl text-xs md:text-sm font-black transition-all shadow-xl shadow-orange-900/40 active:scale-95 uppercase tracking-widest h-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Inscrever Agora
                  </a>

                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0px 0px rgba(234, 88, 12, 0)",
                        "0 0 15px 5px rgba(234, 88, 12, 0.2)",
                        "0 0 0px 0px rgba(234, 88, 12, 0)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-orange-600/10 border-2 border-orange-500/30 text-orange-400 p-2 text-center shrink-0"
                  >
                    <Users className="w-4 h-4 md:w-5 md:h-5 mb-0.5" />
                    <span className="text-lg md:text-2xl font-black leading-none">{registrationCount}</span>
                    <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-tighter leading-tight mt-0.5">Inscritos</span>
                  </motion.div>
                </div>
              </div>

              <p className="text-gray-400 text-[10px] md:text-base max-w-md mx-auto md:mx-0 leading-relaxed font-sans opacity-70 text-left italic">
                Uma jornada profunda pelas profecias mais impactantes da Bíblia. Descubra o que o futuro reserva.
              </p>
            </div>
          </motion.div>
        </section>
      </div>

      <main className="relative z-10">
        {/* Features Block */}
        <section className="px-6 py-20 bg-white/5 border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="p-3 bg-orange-500/10 rounded-2xl">
                <Award className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Certificado Incluso</h3>
                <p className="text-gray-400 text-sm leading-snug">Receba um certificado oficial de participação ao concluir o seminário.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">IASD Palmarejo</h3>
                <p className="text-gray-400 text-sm leading-snug">Encontros presenciais na Igreja Adventista do Palmarejo.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="p-3 bg-green-500/10 rounded-2xl">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Instrutor</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 bg-orange-500/20 z-[20] shadow-lg shadow-orange-500/20">
                    <img
                      src="/perfil.png"
                      alt="Instrutor"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('unsplash')) {
                          target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100";
                        }
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-300 font-bold uppercase tracking-wider">Adnilson Medina</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Themes List */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-7xl font-display uppercase tracking-tight text-orange-500">Temas dos Estudos</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Uma análise detalhada de cada capítulo para compreender os sinais dos tempos.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map((theme, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-white/[0.08] transition-all flex items-center justify-between cursor-default"
              >
                <div className="flex items-center gap-5">
                  <span className="text-2xl font-black text-white/5 group-hover:text-orange-500/20 transition-colors">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="font-bold text-orange-400 text-[10px] uppercase tracking-widest mb-1">{theme.chapter}</h4>
                    <p className="font-bold text-base leading-tight">{theme.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Registration Form */}
        <section id="inscricao" className="px-6 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-600/5 backdrop-blur-3xl -z-10" />
          <div className="max-w-xl mx-auto bg-[#0A1120] border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative">
            <div className="text-center mb-10 space-y-2">
              <h2 className="text-4xl font-display uppercase tracking-tight">Garanta sua Vaga</h2>
              <p className="text-gray-400 text-sm">As inscrições são limitadas até 26 de Abril.</p>
            </div>

            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-bold uppercase tracking-widest"
                >
                  <AlertCircle className="w-5 h-5" />
                  <p>{errorMessage}</p>
                </motion.div>
              )}
              {!isSubmitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: João Medina"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 ml-1">E-mail (Opcional)</label>
                    <div className="relative">
                      <Send className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 ml-1">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+238 ..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-orange-900/40 transition-all flex items-center justify-center gap-3 uppercase tracking-widest active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Confirmar Minha Vaga <Send className="w-5 h-5" /></>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10 space-y-6"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 mb-2">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold uppercase">Inscrição Realizada!</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Sua participação foi confirmada. <br /> Nos vemos em breve no Palmarejo.</p>
                  </div>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs text-gray-500 hover:text-white uppercase tracking-widest underline transition-colors"
                  >
                    Fazer outra inscrição
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/5 bg-[#050B18]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <BookOpen className="text-orange-500 w-6 h-6" />
              <span className="font-black tracking-tighter uppercase text-xl">Seminário Apocalipse</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Igreja Adventista do Sétimo Dia - Palmarejo</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-gray-400 group">
                <Phone className="w-4 h-4 group-hover:text-orange-500 transition-colors" />
                <span className="font-bold text-sm">+238 9550168</span>
              </div>
              <button
                onClick={() => setShowAdminModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white transition-all border border-orange-500/20 active:scale-95 group shadow-lg shadow-orange-900/10"
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Painel de Inscritos</span>
              </button>
            </div>
            <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em]">© 2026 Resgatando a Esperança</p>
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#050B18]/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-5xl bg-[#0A1120] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Admin Header */}
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-600/20 rounded-2xl border border-orange-500/20">
                    <ShieldCheck className="w-7 h-7 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Consola Administrativa</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gestão de Participantes</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowAdminModal(false); setIsAdminAuthenticated(false); setAdminPassword(''); }}
                  className="p-3 rounded-full hover:bg-white/5 transition-all active:scale-90"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Admin Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {!isAdminAuthenticated ? (
                  <div className="max-w-sm mx-auto py-20 text-center space-y-10">
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner shadow-blue-500/5">
                        <Settings className="w-10 h-10 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold uppercase">Área Reservada</h4>
                        <p className="text-gray-500 text-xs">Introduza o código de acesso para visualizar os dados</p>
                      </div>
                    </div>

                    <form onSubmit={handleAdminAuth} className="space-y-5">
                      <input
                        autoFocus
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center text-4xl tracking-[0.8em] focus:outline-none focus:border-orange-500 transition-all font-mono"
                      />
                      {adminError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{adminError}</p>}
                      <button className="w-full bg-orange-600 text-white font-black py-4.5 rounded-2xl hover:bg-orange-500 shadow-xl shadow-orange-900/20 transition-all uppercase tracking-widest text-sm active:scale-95">
                        Confirmar Acesso
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
                        <div className="relative z-10">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total de Inscritos</p>
                          <p className="text-5xl font-black text-orange-500">{registrationCount}</p>
                        </div>
                        <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white/[0.02] group-hover:text-orange-500/[0.05] transition-all" />
                      </div>
                      <div className="md:col-span-3">
                        <div className="relative h-full flex flex-col justify-end">
                          <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Pesquisar por nome, email ou telefone..."
                              className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 focus:outline-none focus:border-orange-500 transition-all text-sm font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/[0.01]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/[0.02] text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">
                              <th className="px-8 py-5 border-b border-white/5">Nome do Participante</th>
                              <th className="px-8 py-5 border-b border-white/5">Informação de Contacto</th>
                              <th className="px-8 py-5 border-b border-white/5">Data de Registo</th>
                              <th className="px-8 py-5 border-b border-white/5 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredRegistrations.length > 0 ? (
                              filteredRegistrations.map((reg) => (
                                <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-8 py-6">
                                    <p className="font-black text-sm text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{reg.name}</p>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="space-y-1">
                                      <p className="text-xs text-blue-400 group-hover:text-blue-300 font-mono transition-colors">{reg.email || '-'}</p>
                                      <p className="text-[11px] text-gray-500 font-mono">{reg.phone}</p>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        {reg.createdAt?.toDate().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
                                      </span>
                                      <span className="text-[10px] text-gray-600 font-mono">
                                        {reg.createdAt?.toDate().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <button
                                      onClick={() => setRegToDelete(reg)}
                                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all active:scale-90"
                                      title="Remover Inscrito"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-gray-600 uppercase text-xs font-black tracking-[0.4em] italic">Nenhum registo encontrado...</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {regToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !isDeleting && setRegToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0A1122] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Remover Inscrito?</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Tem certeza que deseja remover <span className="text-white font-bold">{regToDelete.name}</span>?
                  Esta ação é irreversível e o lugar voltará a estar disponível...
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    disabled={isDeleting}
                    onClick={() => handleRegistrationDelete(regToDelete.id)}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        A remover...
                      </>
                    ) : 'Confirmar Remoção'}
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={() => setRegToDelete(null)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
