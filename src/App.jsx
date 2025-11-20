import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Lock, Award, Download, User, FileText, Key } from 'lucide-react';

// --- BASE DE DATOS MAESTRA (Fusionada JSON + CSV) ---
const database = [
  // --- PLAN PREMIUM & BÁSICO (Datos del CSV) ---
  { nombre: "RAIZA DRILLETH PUPO OSORIO", tipoDoc: "T.I.", id: "1102830007", email: "raizadri3@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "05/11/2025" },
  { nombre: "JOSÍAS ACUÑA ARIAS", tipoDoc: "T.I.", id: "1128327871", email: "josiasacunaarias919@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "05/11/2025" },
  { nombre: "MARIA JOSE MARQUEZ", tipoDoc: "T.I.", id: "1054865663", email: "marquezzzz1013@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "05/11/2025" },
  { nombre: "KATHERINE FERNANDEZ MONTILLA", tipoDoc: "T.I.", id: "1107070405", email: "kalefernandezm@gmail.com", plan: "Plan Premium", estado: "Activo", fechaPago: "06/11/2025" },
  { nombre: "JUAN ESTEBAN HOME PAJOY", tipoDoc: "T.I.", id: "1077228978", email: "juanhome091215@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "06/11/2025" },
  { nombre: "SANTIAGO CARRASQUILLA SUAZA", tipoDoc: "T.I.", id: "1063961186", email: "carrasantiago20@gmail.com", plan: "Plan Premium", estado: "Activo", fechaPago: "19/11/2025" },
  { nombre: "SOPHIE ALEJANDRA SUÁREZ MANTILLA", tipoDoc: "T.I.", id: "1097502093", email: "dani.arias848@gmail.com", plan: "Plan Premium", estado: "Activo", fechaPago: "19/11/2025" },
  { nombre: "VALENTINA SOFÍA MOLINA OSPINO", tipoDoc: "T.I.", id: "1082924186", email: "valentinamolina1911@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "19/11/2025" },
  { nombre: "SARA QUINTERO CANO", tipoDoc: "T.I.", id: "1117018996", email: "lussara62@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "19/11/2025" },
  { nombre: "LUIS FELIPE ESCUDERO VILLEGAS", tipoDoc: "T.I.", id: "1013126436", email: "luisfelipe788tam@gmail.com", plan: "Plan Premium", estado: "Activo", fechaPago: "19/11/2025" },

  // --- NUEVOS INGRESOS (Datos del JSON Importado) ---
  // Nota: Se asume T.I. y Plan Básico por defecto si no estaban en el CSV detallado
  { nombre: "ANDERSON AMILKAR BECERRA IMBAJOA", tipoDoc: "T.I.", id: "1089486569", email: "amilkarbecerra05@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "Noviembre 2025" },
  { nombre: "JOSE MIGUEL URREA GÓMEZ", tipoDoc: "T.I.", id: "1114882979", email: "urreamiguel695@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "Noviembre 2025" },
  { nombre: "FRANKLIN AYALA PAVA", tipoDoc: "T.I.", id: "1067901714", email: "franklinayala02@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "Noviembre 2025" },
  { nombre: "DAVID FELIPE MORALES RINCÓN", tipoDoc: "T.I.", id: "1052394278", email: "feliperincon1010@gmail.com", plan: "Plan Básico", estado: "Activo", fechaPago: "Noviembre 2025" },
  // Puedes seguir pegando más estudiantes aquí siguiendo el mismo formato...
];

// --- RECURSOS GRÁFICOS ---
const ASSETS = {
  fondo: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aOtHLJ5xUNkB12hj_FONDO.svg",
  logoSmall: "https://images.prismic.io/seamosgenios2026/aMSzIWGNHVfTPKS1_logosg.png?auto=format,compress",
  logoMain: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg"
};

export default function App() {
  const [formData, setFormData] = useState({
    tipoDoc: 'T.I.', // Valor por defecto
    numeroDoc: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- SEGURIDAD ---
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (!formData.numeroDoc.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    setTimeout(() => {
      // Búsqueda flexible: Coincidencia de ID y Tipo de Documento
      const found = database.find(item => 
        item.id === formData.numeroDoc.trim() && 
        item.tipoDoc === formData.tipoDoc
      );
      
      if (found) {
        if (found.estado === "Revocado") {
            setError("Tu credencial existe pero se encuentra inactiva. Contacta a soporte.");
        } else {
            setResult(found);
        }
      } else {
        setError("No encontramos registros con ese Tipo y Número de documento.");
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div 
      className="h-screen w-full font-sans text-slate-200 select-none flex flex-col bg-cover bg-center bg-no-repeat overflow-hidden relative"
      style={{ backgroundImage: `url('${ASSETS.fondo}')`, backgroundColor: '#0f172a' }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none"></div>
      
      {/* Header Fijo */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-5 flex justify-between items-center">
        <div className="flex items-center space-x-3 group cursor-default">
          <img 
            src={ASSETS.logoSmall} 
            alt="Logo SG" 
            className="h-8 w-auto object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110" 
          />
          <div className="h-4 w-px bg-white/60 mx-2 hidden sm:block"></div>
          <span className="text-sm font-bold tracking-widest text-white drop-shadow-md hidden sm:block uppercase opacity-100">
            Plataforma Estudiantil
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
        
        {!result && (
          // El contenedor principal tiene la clase "group" para controlar animaciones internas al hacer hover
          <div className="w-full max-w-[320px] md:max-w-[360px] flex flex-col items-center animate-fade-in-up group perspective-1000">
            
            {/* Logo Principal - Animado al hacer hover sobre TODO el grupo */}
            <div className="mb-3 transition-all duration-500 ease-out transform group-hover:scale-110 group-hover:-translate-y-2 drop-shadow-2xl">
              <img 
                src={ASSETS.logoMain} 
                alt="Services Logo" 
                className="w-24 md:w-36 h-auto mx-auto"
              />
            </div>

            {/* Formulario - Animaciones de elevación y brillo neón */}
            <div className="w-full bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-white/20 transition-all duration-500 ease-out transform group-hover:scale-[1.03] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] group-hover:border-white/80 group-hover:bg-slate-900/60">
              
              <div className="text-center mb-4">
                <h1 className="text-base font-bold text-white tracking-tight uppercase transition-colors duration-300 group-hover:text-blue-200">
                  Acceso Seguro
                </h1>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                
                {/* Tipo Documento */}
                <div className="relative group/input">
                   <select
                      name="tipoDoc"
                      value={formData.tipoDoc}
                      onChange={handleInputChange}
                      className="w-full py-2.5 px-3 pl-9 bg-slate-950/60 border border-white/30 rounded-lg outline-none text-white text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 appearance-none cursor-pointer hover:border-white hover:bg-slate-900/80"
                    >
                      <option value="T.I.">T.I. - Tarjeta de Identidad</option>
                      <option value="C.C.">C.C. - Cédula de Ciudadanía</option>
                      <option value="C.E.">C.E. - Cédula de Extranjería</option>
                      <option value="PPT">PPT - Permiso Protección Temporal</option>
                      <option value="OTRO">Otro Documento</option>
                    </select>
                    <div className="absolute left-3 top-2.5 text-white/70 pointer-events-none transition-colors duration-300 group-hover/input:text-blue-400">
                      <FileText size={14} />
                    </div>
                </div>

                {/* Número Documento */}
                <div className="relative group/input">
                    <input
                      type="text"
                      name="numeroDoc"
                      placeholder="Número de Identificación"
                      className="w-full py-2.5 px-3 pl-9 bg-slate-950/60 border border-white/30 rounded-lg outline-none text-white placeholder:text-white/40 text-sm font-bold tracking-wide focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 hover:border-white hover:bg-slate-900/80"
                      value={formData.numeroDoc}
                      onChange={handleInputChange}
                    />
                    <div className="absolute left-3 top-2.5 text-white/70 transition-colors duration-300 group-hover/input:text-blue-400">
                      <User size={14} />
                    </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.numeroDoc}
                  className={`w-full py-3 rounded-lg font-bold text-white text-xs uppercase tracking-wider transition-all duration-300 mt-3 shadow-lg transform ${
                    loading || !formData.numeroDoc
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/10' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-[1.02] border border-transparent active:scale-95'
                  }`}
                >
                  {loading ? 'Verificando...' : 'Ingresar'}
                </button>
              </form>
            </div>

            {/* Error Flotante */}
            {error && !loading && (
              <div className="mt-4 bg-red-500/20 backdrop-blur-md border border-red-500/40 px-4 py-2 rounded-lg flex items-center gap-2 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                <AlertCircle className="text-red-300" size={14} />
                <span className="text-red-100 text-xs font-medium">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* --- VISTA DE RESULTADOS --- */}
        {!loading && result && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up">
            
            <div className="w-full max-w-3xl bg-slate-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              
              {/* Panel Izquierdo */}
              <div className={`md:w-2/5 p-6 flex flex-col justify-between relative overflow-hidden ${result.plan === 'Plan Premium' ? 'bg-gradient-to-br from-indigo-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 to-slate-800'}`}>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-3xl"></div>

                 <button 
                  onClick={() => {setResult(null); setFormData({...formData, numeroDoc: ''});}}
                  className="self-start text-[10px] uppercase tracking-wider text-white/50 hover:text-white transition-colors relative z-10 flex items-center gap-1"
                >
                  ← Salir
                </button>

                <div className="flex flex-col items-center justify-center flex-grow text-center z-10 my-8 animate-float">
                   <div className="bg-white/10 p-3 rounded-full mb-4 ring-1 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                     {result.plan === 'Plan Premium' ? <Award className="text-yellow-400" size={32} /> : <CheckCircle className="text-blue-300" size={32} />}
                   </div>
                   <h2 className="text-xl font-bold text-white">Acceso Autorizado</h2>
                   <p className="text-white/60 text-xs mt-2 px-4">Credencial válida para el ciclo académico 2025.</p>
                </div>

                <div className="bg-black/20 rounded-lg p-3 border border-white/5 backdrop-blur-sm z-10">
                   <p className="text-[9px] text-white/40 uppercase font-bold mb-1">ID Estudiante</p>
                   <p className="text-base font-mono text-white tracking-widest">{result.id}</p>
                </div>
              </div>

              {/* Panel Derecho */}
              <div className="md:w-3/5 p-6 bg-white overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">
                    {result.nombre}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 font-medium">{result.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Plan</span>
                      <span className={`text-xs font-bold ${result.plan === 'Plan Premium' ? 'text-purple-700' : 'text-blue-700'}`}>{result.plan}</span>
                   </div>
                   <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Estado</span>
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {result.estado}
                      </span>
                   </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start mb-6 transition-all hover:shadow-md hover:scale-[1.01]">
                   <Key className="text-amber-500 shrink-0 mt-0.5" size={18} />
                   <div>
                      <h4 className="text-amber-900 font-bold text-xs mb-1">Contraseña del Documento</h4>
                      <p className="text-amber-800/70 text-[10px] mb-2">Para abrir el PDF, usa este número:</p>
                      <div 
                        className="bg-white px-3 py-1.5 rounded border border-amber-200 inline-flex items-center gap-2 cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all active:scale-95"
                        onClick={() => navigator.clipboard.writeText(result.id)}
                      >
                         <code className="font-mono font-bold text-slate-700 text-sm">{result.id}</code>
                         <span className="text-[9px] font-bold text-amber-500 uppercase">Copiar</span>
                      </div>
                   </div>
                </div>

                <button 
                    onClick={() => alert(`Descargando...\nClave: ${result.id}`)}
                    className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Download size={16} />
                    Descargar PDF
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}