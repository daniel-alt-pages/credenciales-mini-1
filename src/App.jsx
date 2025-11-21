import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Lock, Award, User, FileText, Key, FolderOpen, FileSignature, X } from 'lucide-react';

// --- RECURSOS GRÁFICOS ---
const ASSETS = {
  fondo: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aOtHLJ5xUNkB12hj_FONDO.svg",
  logoSmall: "https://images.prismic.io/seamosgenios2026/aMSzIWGNHVfTPKS1_logosg.png?auto=format,compress",
  logoMain: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg",
  formsUrl: "https://forms.gle/p1FnrAgDKcQkJDLw7"
};

// --- FUNCIÓN DE LIMPIEZA DE ID ---
const cleanId = (id) => {
  if (!id) return "";
  return id.toString().replace(/[^a-zA-Z0-9]/g, "");
};

export default function App() {
  const [formData, setFormData] = useState({
    tipoDoc: 'T.I.',
    numeroDoc: ''
  });

  const [database, setDatabase] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetch('./estudiantes.json')
      .then(response => {
        if (!response.ok) throw new Error("Error DB");
        return response.json();
      })
      .then(data => {
        setDatabase(data);
        setIsDbLoading(false);
      })
      .catch(err => {
        console.error(err);
        setDbError(true);
        setIsDbLoading(false);
      });
  }, []);

  // --- LÓGICA DE VERIFICACIÓN ---
  const handleVerify = (e) => {
    e.preventDefault();
    if (!formData.numeroDoc.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    const usuarioIdLimpio = cleanId(formData.numeroDoc);

    setTimeout(() => {
      const found = database.find(estudiante => cleanId(estudiante.id) === usuarioIdLimpio);
      
      if (found) {
        if (found.estado && found.estado.toString().toLowerCase() === "revocado") {
            setError("Tu credencial aparece como inactiva.");
        } else {
            setResult(found);
        }
      } else {
        setError("No encontramos ese número de documento.");
      }
      setLoading(false);
    }, 800);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- VISTA PRINCIPAL ---
  return (
    <div className="min-h-screen w-full font-sans text-slate-200 bg-[#0f172a] relative flex flex-col">
      
      {/* Fondo Fijo */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-40 md:opacity-60"
        style={{ backgroundImage: `url('${ASSETS.fondo}')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none"></div>

      {/* Header Sticky (Estilo App Móvil) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/70 border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={ASSETS.logoSmall} alt="Logo" className="h-8 w-auto object-contain drop-shadow-md" />
            <div className="h-5 w-px bg-white/20 mx-1 hidden sm:block"></div>
            <span className="text-sm md:text-base font-bold tracking-wide text-white/90 uppercase hidden sm:block">
              Plataforma Estudiantil
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Lock size={10} className="md:w-3 md:h-3" />
            CONEXIÓN SEGURA
          </div>
        </div>
      </header>

      {/* Contenido Central */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        
        {!result && (
          <div className="w-full max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center animate-fade-in-up">
            
            {/* Logo Principal */}
            <div className="mb-8 md:mb-10 hover:scale-105 transition-transform duration-700 ease-out">
              <img 
                src={ASSETS.logoMain} 
                alt="Seamos Genios Logo" 
                className="w-40 md:w-56 lg:w-64 h-auto mx-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
              />
            </div>

            {/* Tarjeta de Login (Glassmorphism) */}
            <div className="w-full bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/5 relative overflow-hidden group">
              
              {/* Brillo decorativo */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-1000"></div>
              
              <div className="relative z-10 text-center mb-6">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Consulta de Credenciales</h1>
                <p className="text-slate-400 text-xs md:text-sm mt-1">Ingresa tus datos para acceder al material</p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4 relative z-10">
                
                {/* Select Tipo Doc */}
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Tipo de Documento</label>
                   <div className="relative group/input">
                      <select 
                        name="tipoDoc" 
                        value={formData.tipoDoc} 
                        onChange={handleInputChange} 
                        className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 transition-all appearance-none cursor-pointer"
                      >
                        <option value="T.I.">T.I. - Tarjeta de Identidad</option>
                        <option value="C.C.">C.C. - Cédula de Ciudadanía</option>
                        <option value="C.E.">C.E. - Cédula de Extranjería</option>
                        <option value="PPT">PPT - Permiso Protección</option>
                        <option value="OTRO">Otro Documento</option>
                      </select>
                      <div className="absolute left-3.5 top-3.5 text-slate-500 group-hover/input:text-blue-400 transition-colors">
                        <FileText size={18} />
                      </div>
                   </div>
                </div>

                {/* Input Número */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Número de Identificación</label>
                    <div className="relative group/input">
                        <input 
                          type="number" // Teclado numérico en móviles
                          inputMode="numeric"
                          name="numeroDoc" 
                          placeholder="Ej: 100200300" 
                          className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white placeholder:text-slate-600 text-sm font-bold tracking-wider focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 transition-all" 
                          value={formData.numeroDoc} 
                          onChange={handleInputChange} 
                        />
                        <div className="absolute left-3.5 top-3.5 text-slate-500 group-hover/input:text-blue-400 transition-colors">
                          <User size={18} />
                        </div>
                    </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !formData.numeroDoc} 
                  className={`w-full py-4 rounded-xl font-bold text-white text-sm uppercase tracking-widest shadow-lg transition-all duration-300 transform active:scale-95 mt-2 ${
                    loading || !formData.numeroDoc 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25 border border-transparent'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Procesando
                    </span>
                  ) : 'Ingresar al Sistema'}
                </button>
              </form>

              {error && (
                <div className="mt-6 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3 animate-shake">
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-red-200 text-xs leading-relaxed">{error}</p>
                </div>
              )}
            </div>
            
            {/* Footer pequeño */}
            <p className="mt-8 text-slate-500 text-[10px] font-medium uppercase tracking-widest opacity-60">
              © 2025 Seamos Genios Colombia
            </p>
          </div>
        )}
      </main>

      {/* --- MODAL DE RESULTADOS (Overlay Completo) --- */}
      {result && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center sm:text-left">
            
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up">
              
              {/* Botón Cerrar Flotante (Móvil) */}
              <button 
                onClick={() => {setResult(null); setFormData({...formData, numeroDoc: ''});}}
                className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white md:hidden backdrop-blur-sm transition-colors"
              >
                <X size={20} />
              </button>

              {/* COLUMNA IZQUIERDA: Perfil y Estado */}
              <div className={`md:w-2/5 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden ${
                result.plan.includes('Premium') 
                  ? 'bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#581C87] text-white' 
                  : 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white'
              }`}>
                {/* Patrones de fondo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <button 
                    onClick={() => {setResult(null); setFormData({...formData, numeroDoc: ''});}}
                    className="hidden md:inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors mb-8 group"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Nueva Consulta
                  </button>

                  <div className="flex flex-col items-center text-center">
                    <div className="inline-flex p-4 bg-white/10 rounded-full mb-6 backdrop-blur-md ring-1 ring-white/20 shadow-xl">
                      {result.plan.includes('Premium') ? <Award size={48} className="text-yellow-300" /> : <CheckCircle size={48} className="text-emerald-300" />}
                    </div>
                    
                    <div className="px-4 py-1.5 bg-white/10 rounded-full border border-white/10 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                        {result.plan}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 leading-tight">
                      Hola, {result.nombre.split(' ')[0]}
                    </h2>
                    <p className="text-white/60 text-sm">Bienvenido a tu espacio</p>
                  </div>
                </div>

                <div className="relative z-10 mt-10 md:mt-0">
                  <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1 tracking-wider">Identificación</p>
                    <p className="text-xl font-mono font-medium tracking-widest">{result.id}</p>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Acciones y Datos */}
              <div className="md:w-3/5 p-8 md:p-10 bg-white text-slate-800">
                
                <div className="mb-8 pb-6 border-b border-slate-100">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase leading-tight mb-4">
                    {result.nombre}
                  </h3>
                  
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-600">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                      <User size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-blue-900 text-xs font-bold uppercase tracking-wide">Cuenta de Acceso</p>
                      <p className="text-blue-700 text-sm mt-1 leading-relaxed">
                        Para ver los archivos, debes iniciar sesión en Google con: <br/>
                        <span className="font-bold text-blue-900 select-all">{result.email}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {/* Botón Carpeta */}
                  <a 
                    href={result.url_carpeta} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden bg-white border border-slate-200 hover:border-indigo-500/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FolderOpen size={16} className="text-indigo-500" />
                    </div>
                    <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FolderOpen className="text-indigo-600" size={24} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">Material de Estudio</h4>
                    <p className="text-slate-500 text-xs mt-1">Ver carpeta en Drive</p>
                  </a>

                  {/* Botón Simulacro */}
                  <a 
                    href={ASSETS.formsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden bg-white border border-slate-200 hover:border-emerald-500/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FileSignature size={16} className="text-emerald-500" />
                    </div>
                    <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FileSignature className="text-emerald-600" size={24} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">Hoja de Respuestas</h4>
                    <p className="text-slate-500 text-xs mt-1">Responder simulacro</p>
                  </a>
                </div>

                {/* Info Contraseña */}
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                   <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0">
                      <Key size={24} />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-amber-900 font-bold text-sm">Contraseña para documentos</h4>
                      <p className="text-amber-700/80 text-xs mt-0.5">
                        Si un PDF te pide clave, usa tu número de identificación.
                      </p>
                   </div>
                   <button 
                    onClick={() => navigator.clipboard.writeText(result.id)}
                    className="bg-white hover:bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg text-amber-700 text-xs font-bold shadow-sm active:scale-95 transition-all"
                   >
                     COPIAR CLAVE
                   </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      `}</style>
    </div>
  );
}
