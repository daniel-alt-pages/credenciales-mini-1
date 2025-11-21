import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Lock, Award, Download, User, FileText, Key, ExternalLink, FolderOpen, FileSignature } from 'lucide-react';

// --- CONFIGURACIÓN ---
const ASSETS = {
  fondo: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aOtHLJ5xUNkB12hj_FONDO.svg",
  logoSmall: "https://images.prismic.io/seamosgenios2026/aMSzIWGNHVfTPKS1_logosg.png?auto=format,compress",
  logoMain: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg",
  formsUrl: "https://forms.gle/p1FnrAgDKcQkJDLw7"
};

// --- FUNCIÓN DE LIMPIEZA DE ID ---
// Esta función asegura que "1000" sea igual a "1.000" o "1000 "
// Elimina cualquier cosa que no sea número o letra para evitar errores de formato.
const cleanId = (id) => {
  if (!id) return "";
  return id.toString().replace(/[^a-zA-Z0-9]/g, ""); // Solo deja números y letras
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

  // --- CARGAR BASE DE DATOS ---
  useEffect(() => {
    // Usamos ruta relativa para máxima compatibilidad
    fetch('./estudiantes.json')
      .then(response => {
        if (!response.ok) throw new Error("Error al leer estudiantes.json");
        return response.json();
      })
      .then(data => {
        setDatabase(data);
        setIsDbLoading(false);
        console.log("Base de datos cargada:", data.length, "estudiantes.");
      })
      .catch(err => {
        console.error("Error crítico:", err);
        setDbError(true);
        setIsDbLoading(false);
      });
  }, []);

  // --- SEGURIDAD ---
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LÓGICA DE VERIFICACIÓN CORREGIDA ---
  const handleVerify = (e) => {
    e.preventDefault();
    if (!formData.numeroDoc.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    // 1. Normalizamos el ID que escribió el usuario
    const usuarioIdLimpio = cleanId(formData.numeroDoc);

    setTimeout(() => {
      // 2. Buscamos en la base de datos comparando SOLAMENTE el ID limpio.
      // Esto ignora si el Tipo de Documento seleccionado coincide o no,
      // solucionando el bloqueo que tenías. Si el número es correcto, entra.
      const found = database.find(estudiante => 
        cleanId(estudiante.id) === usuarioIdLimpio
      );
      
      if (found) {
        // Verificación extra de estado si existe la columna
        if (found.estado && found.estado.toString().toLowerCase() === "revocado") {
            setError("Tu credencial aparece como inactiva.");
        } else {
            setResult(found);
        }
      } else {
        setError("No encontramos ese número de documento en el sistema.");
      }
      setLoading(false);
    }, 800); // Pequeña pausa para sensación de proceso
  };

  return (
    <div 
      className="h-screen w-full font-sans text-slate-200 select-none flex flex-col bg-cover bg-center bg-no-repeat overflow-hidden relative"
      style={{ backgroundImage: `url('${ASSETS.fondo}')`, backgroundColor: '#0f172a' }}
    >
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none"></div>
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={ASSETS.logoSmall} alt="Logo" className="h-8 w-auto object-contain drop-shadow-lg" />
          <div className="h-4 w-px bg-white/60 mx-2 hidden sm:block"></div>
          <span className="text-sm font-bold tracking-widest text-white drop-shadow-md hidden sm:block uppercase opacity-90">Plataforma Estudiantil</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
        
        {/* Cargando BD */}
        {isDbLoading && !result && (
          <div className="animate-pulse text-center mb-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-blue-300">Iniciando sistema...</p>
          </div>
        )}

        {/* Error BD */}
        {dbError && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-center max-w-xs mb-4 backdrop-blur-md">
             <AlertCircle className="mx-auto text-red-400 mb-2" size={24} />
             <p className="text-red-200 text-xs">Error de conexión con la base de datos.</p>
          </div>
        )}

        {/* Formulario de Login */}
        {!result && !isDbLoading && !dbError && (
          <div className="w-full max-w-[320px] md:max-w-[360px] flex flex-col items-center animate-fade-in-up">
            
            <div className="mb-4 hover:scale-105 transition-transform duration-500">
              <img src={ASSETS.logoMain} alt="Logo Main" className="w-28 md:w-40 h-auto mx-auto drop-shadow-2xl" />
            </div>

            <div className="w-full bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
              <h1 className="text-center text-base font-bold text-white uppercase mb-4 tracking-wider">Acceso Seguro</h1>

              <form onSubmit={handleVerify} className="space-y-3">
                {/* El selector es visual, la lógica interna ya no depende de que coincida exactamente */}
                <div className="relative">
                   <select name="tipoDoc" value={formData.tipoDoc} onChange={handleInputChange} className="w-full py-3 px-3 pl-10 bg-slate-950/50 border border-white/20 rounded-xl outline-none text-white text-xs appearance-none cursor-pointer hover:border-blue-400 focus:border-blue-500 transition-colors">
                      <option value="T.I.">T.I. - Tarjeta de Identidad</option>
                      <option value="C.C.">C.C. - Cédula de Ciudadanía</option>
                      <option value="C.E.">C.E. - Cédula de Extranjería</option>
                      <option value="PPT">PPT - Permiso Protección</option>
                      <option value="OTRO">Otro Documento</option>
                    </select>
                    <div className="absolute left-3 top-3 text-white/60 pointer-events-none"><FileText size={16} /></div>
                </div>

                <div className="relative">
                    <input type="text" name="numeroDoc" placeholder="Número de Documento" className="w-full py-3 px-3 pl-10 bg-slate-950/50 border border-white/20 rounded-xl outline-none text-white placeholder:text-white/30 text-sm font-bold tracking-widest focus:border-blue-500 transition-colors" value={formData.numeroDoc} onChange={handleInputChange} />
                    <div className="absolute left-3 top-3 text-white/60"><User size={16} /></div>
                </div>

                <button type="submit" disabled={loading || !formData.numeroDoc} className={`w-full py-3.5 rounded-xl font-bold text-white text-xs uppercase tracking-wider mt-2 shadow-lg transition-all ${loading ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95'}`}>
                  {loading ? 'Verificando...' : 'Consultar'}
                </button>
              </form>
            </div>

            {error && !loading && (
              <div className="mt-4 bg-red-500/20 backdrop-blur-md border border-red-500/40 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake w-full">
                <AlertCircle className="text-red-300 shrink-0" size={18} />
                <span className="text-red-100 text-xs font-medium leading-tight">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Vista de Resultados (Credencial) */}
        {!loading && result && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in-up">
            <div className="w-full max-w-4xl bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              
              {/* Lateral Izquierdo */}
              <div className={`md:w-1/3 p-8 flex flex-col justify-between relative ${result.plan === 'Plan Premium' ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-900 via-slate-800 to-black'}`}>
                 <button onClick={() => {setResult(null); setFormData({...formData, numeroDoc: ''});}} className="self-start text-[10px] uppercase tracking-wider text-white/60 hover:text-white flex items-center gap-1 transition-colors">← Volver</button>
                 
                 <div className="flex flex-col items-center text-center my-6">
                   <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur shadow-inner border border-white/20">
                     {result.plan === 'Plan Premium' ? <Award className="text-yellow-400" size={48} /> : <CheckCircle className="text-blue-400" size={48} />}
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-1">Bienvenido/a</h2>
                   <p className="text-white/50 text-xs font-medium uppercase tracking-widest">{result.plan}</p>
                 </div>

                 <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                   <p className="text-[10px] text-white/40 uppercase font-bold mb-1">ID Estudiante</p>
                   <p className="text-lg font-mono text-white tracking-widest">{result.id}</p>
                 </div>
              </div>

              {/* Contenido Derecho */}
              <div className="md:w-2/3 p-8 bg-white overflow-y-auto">
                <div className="mb-8 border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight mb-2">{result.nombre}</h3>
                  <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600 flex gap-3">
                    <User className="text-blue-600 shrink-0" size={20} />
                    <div>
                      <p className="text-blue-900 text-xs font-bold">Cuenta Autorizada</p>
                      <p className="text-blue-700 text-xs mt-0.5">Accede a Google Drive usando: <span className="font-bold">{result.email}</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <a href={result.url_carpeta} target="_blank" rel="noreferrer" className="group bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 p-5 rounded-2xl flex flex-col items-center text-center transition-all hover:-translate-y-1">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><FolderOpen className="text-indigo-600" size={24} /></div>
                      <h4 className="text-slate-800 font-bold text-sm">Carpeta Drive</h4>
                      <p className="text-slate-500 text-[10px]">Material de estudio</p>
                    </a>
                    
                    <a href={ASSETS.formsUrl} target="_blank" rel="noreferrer" className="group bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 p-5 rounded-2xl flex flex-col items-center text-center transition-all hover:-translate-y-1">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><FileSignature className="text-green-600" size={24} /></div>
                      <h4 className="text-slate-800 font-bold text-sm">Simulacro</h4>
                      <p className="text-slate-500 text-[10px]">Hoja de respuestas</p>
                    </a>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/60 flex items-center gap-4">
                   <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Key size={20}/></div>
                   <div className="flex-1">
                      <p className="text-amber-900 text-xs font-bold">Contraseña de Archivos</p>
                      <p className="text-amber-700 text-[10px]">Usa tu número de ID para abrir los PDFs.</p>
                   </div>
                   <button onClick={() => navigator.clipboard.writeText(result.id)} className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 border border-amber-200 shadow-sm hover:bg-amber-50">COPIAR ID</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      `}</style>
    </div>
  );
}