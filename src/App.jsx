import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Lock, Award, Download, User, FileText, Key, ExternalLink, FolderOpen, FileSignature } from 'lucide-react';

// --- RECURSOS GRÁFICOS ---
const ASSETS = {
  fondo: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aOtHLJ5xUNkB12hj_FONDO.svg",
  logoSmall: "https://images.prismic.io/seamosgenios2026/aMSzIWGNHVfTPKS1_logosg.png?auto=format,compress",
  logoMain: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg",
  formsUrl: "https://forms.gle/p1FnrAgDKcQkJDLw7"
};

export default function App() {
  const [formData, setFormData] = useState({
    tipoDoc: 'T.I.',
    numeroDoc: ''
  });

  // Estado para la base de datos y la carga inicial
  const [database, setDatabase] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- CARGAR BASE DE DATOS DESDE JSON EXTERNO ---
  useEffect(() => {
    const DB_URL = './estudiantes.json';
    
    console.log("Intentando cargar BD desde:", DB_URL); // Debug en consola

    fetch(DB_URL)
      .then(response => {
        if (!response.ok) throw new Error("No se pudo conectar con la base de datos");
        return response.json();
      })
      .then(data => {
        setDatabase(data);
        setIsDbLoading(false);
      })
      .catch(err => {
        console.error("Error cargando datos:", err);
        setDbError(true);
        setIsDbLoading(false);
      });
  }, []);

  // --- SEGURIDAD (Bloqueo Click Derecho) ---
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
      // CORRECCIÓN CLAVE: Hacemos la comparación de tipoDoc insensible a mayúsculas/minúsculas
      const found = database.find(item => 
        item.id === formData.numeroDoc.trim() && 
        item.tipoDoc.toUpperCase() === formData.tipoDoc.toUpperCase()
      );
      
      if (found) {
        if (found.estado === "Revocado") {
            setError("Tu credencial existe pero se encuentra inactiva. Contacta a soporte.");
        } else {
            setResult(found);
        }
      } else {
        setError("No encontramos registros con esos datos.");
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
        
        {/* Pantalla de Carga de BD Inicial */}
        {isDbLoading && !result && (
          <div className="animate-pulse text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-blue-300 font-medium">Conectando con servidor...</p>
          </div>
        )}

        {/* Error de Conexión BD */}
        {dbError && (
          <div className="bg-red-500/20 backdrop-blur border border-red-500/50 p-6 rounded-xl text-center max-w-md">
             <AlertCircle className="mx-auto text-red-400 mb-2" size={32} />
             <h3 className="text-white font-bold mb-1">Error de Conexión</h3>
             <p className="text-red-200 text-sm">No pudimos cargar la lista de estudiantes. Por favor recarga la página.</p>
          </div>
        )}

        {!result && !isDbLoading && !dbError && (
          <div className="w-full max-w-[320px] md:max-w-[360px] flex flex-col items-center animate-fade-in-up group perspective-1000">
            
            {/* Logo Principal */}
            <div className="mb-3 transition-all duration-500 ease-out transform group-hover:scale-110 group-hover:-translate-y-2 drop-shadow-2xl">
              <img 
                src={ASSETS.logoMain} 
                alt="Services Logo" 
                className="w-24 md:w-36 h-auto mx-auto"
              />
            </div>

            {/* Formulario */}
            <div className="w-full bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-white/20 transition-all duration-500 ease-out transform group-hover:scale-[1.03] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] group-hover:border-white/80 group-hover:bg-slate-900/60">
              
              <div className="text-center mb-4">
                <h1 className="text-base font-bold text-white tracking-tight uppercase transition-colors duration-300 group-hover:text-blue-200">
                  Acceso Seguro
                </h1>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
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
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up">
            
            <div className="w-full max-w-4xl bg-slate-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 overflow-hidden flex flex-col md:flex-row max-h-[95vh]">
              
              {/* Panel Izquierdo (Bienvenida) */}
              <div className={`md:w-1/3 p-6 flex flex-col justify-between relative overflow-hidden ${result.plan === 'Plan Premium' ? 'bg-gradient-to-br from-indigo-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 to-slate-800'}`}>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-3xl"></div>

                 <button 
                  onClick={() => {setResult(null); setFormData({...formData, numeroDoc: ''});}}
                  className="self-start text-[10px] uppercase tracking-wider text-white/50 hover:text-white transition-colors relative z-10 flex items-center gap-1"
                >
                  ← Salir
                </button>

                <div className="flex flex-col items-center justify-center flex-grow text-center z-10 my-8 animate-float">
                   <div className="bg-white/10 p-4 rounded-full mb-4 ring-1 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                     {result.plan === 'Plan Premium' ? <Award className="text-yellow-400" size={40} /> : <CheckCircle className="text-blue-300" size={40} />}
                   </div>
                   <h2 className="text-xl font-bold text-white">¡Hola, {result.nombre.split(" ")[0]}!</h2>
                   <div className="mt-3 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                     <p className="text-white text-[10px] font-medium uppercase tracking-wide">{result.plan}</p>
                   </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 border border-white/5 backdrop-blur-sm z-10 text-center">
                   <p className="text-[9px] text-white/40 uppercase font-bold mb-1">Identificación</p>
                   <p className="text-base font-mono text-white tracking-widest">{result.id}</p>
                </div>
              </div>

              {/* Panel Derecho (Contenido) */}
              <div className="md:w-2/3 p-6 md:p-8 bg-white overflow-y-auto">
                
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 uppercase leading-tight mb-2">
                    {result.nombre}
                  </h3>
                  
                  {/* Alerta de Correo Importante */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg flex items-start gap-3">
                    <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 mt-0.5">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-blue-900 text-xs font-bold">Acceso Restringido</p>
                      <p className="text-blue-800 text-xs mt-0.5 leading-relaxed">
                        Debes iniciar sesión en Google Drive con: <br/>
                        <span className="font-bold underline">{result.email}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  
                  {/* Sección de Botones de Acción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Botón Carpeta */}
                    <a 
                      href={result.url_carpeta} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-6 rounded-xl transition-all group cursor-pointer text-center"
                    >
                      <div className="bg-indigo-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <FolderOpen size={28} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-indigo-900 font-bold text-sm">Material de Estudio</h4>
                        <p className="text-indigo-600 text-[10px] mt-1">Ver mis documentos</p>
                      </div>
                      <ExternalLink size={12} className="text-indigo-400 absolute top-3 right-3" />
                    </a>

                    {/* Botón Formulario */}
                    <a 
                      href={ASSETS.formsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 p-6 rounded-xl transition-all group cursor-pointer text-center"
                    >
                      <div className="bg-green-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <FileSignature size={28} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-green-900 font-bold text-sm">Hoja de Respuestas</h4>
                        <p className="text-green-600 text-[10px] mt-1">Responder simulacro</p>
                      </div>
                      <ExternalLink size={12} className="text-green-400 absolute top-3 right-3" />
                    </a>
                  </div>

                  {/* Sección Contraseña (Informativa) */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-center mt-2">
                     <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                        <Key size={20} />
                     </div>
                     <div className="flex-1">
                        <h4 className="text-amber-900 font-bold text-xs mb-0.5">Contraseña para abrir PDFs</h4>
                        <p className="text-amber-800/70 text-[10px]">Tu clave es tu número de identificación:</p>
                     </div>
                     <div 
                        className="bg-white px-3 py-1.5 rounded border border-amber-200 inline-flex items-center gap-2 cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all active:scale-95"
                        onClick={() => navigator.clipboard.writeText(result.id)}
                      >
                         <code className="font-mono font-bold text-slate-700 text-sm">{result.id}</code>
                         <span className="text-[9px] font-bold text-amber-500 uppercase">Copiar</span>
                      </div>
                  </div>

                </div>
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