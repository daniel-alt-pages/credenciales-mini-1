import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, Lock, Award, User, FileText, Key, 
  FolderOpen, FileSignature, X, Search, Edit, Trash2, Plus, Save, 
  LogOut, Database, Loader2, ExternalLink
} from 'lucide-react';

// --- CONFIGURACIÓN ---
const GITHUB_CONFIG = {
  OWNER: "daniel-alt-pages",      
  REPO: "credenciales-mini-1",    
  PATH: "public/estudiantes.json" 
};

const ADMIN_ACCESS_CODE = "202699";

const ASSETS = {
  fondo: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aOtHLJ5xUNkB12hj_FONDO.svg",
  logoSmall: "https://images.prismic.io/seamosgenios2026/aMSzIWGNHVfTPKS1_logosg.png?auto=format,compress",
  logoMain: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg",
  formsUrl: "https://forms.gle/p1FnrAgDKcQkJDLw7"
};

// Utilidad para limpiar ID (quita puntos y espacios)
const cleanId = (id) => (!id ? "" : id.toString().replace(/[^a-zA-Z0-9]/g, ""));

// Utilidad para codificar a Base64 (UTF-8 safe) para la API de GitHub
const utf8_to_b64 = (str) => window.btoa(unescape(encodeURIComponent(str)));

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [viewMode, setViewMode] = useState('student'); // 'student', 'login', 'admin'
  const [database, setDatabase] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // --- ESTADOS ESTUDIANTE ---
  const [formData, setFormData] = useState({ tipoDoc: 'T.I.', numeroDoc: '' });
  const [studentResult, setStudentResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // --- ESTADOS ADMIN ---
  const [adminToken, setAdminToken] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // Carga inicial de datos
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Usamos ruta relativa './' para evitar problemas de rutas absolutas en subdominios
      const response = await fetch('./estudiantes.json?t=' + new Date().getTime());
      if (!response.ok) throw new Error("Error cargando datos");
      const data = await response.json();
      setDatabase(data);
    } catch (err) {
      console.error("Error fetching DB:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- VERIFICACIÓN ESTUDIANTE ---
  const handleStudentVerify = (e) => {
    e.preventDefault();
    if (!formData.numeroDoc.trim()) return;

    // Puerta trasera Admin
    if (formData.numeroDoc.trim() === ADMIN_ACCESS_CODE) {
      setSearchLoading(true);
      setTimeout(() => {
        setSearchLoading(false);
        setViewMode('login');
        setFormData({ ...formData, numeroDoc: '' });
      }, 1000);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setStudentResult(null);

    const inputClean = cleanId(formData.numeroDoc);

    setTimeout(() => {
      // Búsqueda insensible a formato (ignora puntos en la BD)
      const found = database.find(s => cleanId(s.id) === inputClean);
      
      if (found) {
        if (found.estado?.toLowerCase() === "revocado") {
          setSearchError("Tu credencial está inactiva.");
        } else {
          setStudentResult(found);
        }
      } else {
        setSearchError("No encontramos ese número de documento.");
      }
      setSearchLoading(false);
    }, 800);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LÓGICA ADMIN (GITHUB API) ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (adminToken.startsWith('ghp_') || adminToken.startsWith('github_pat_')) {
      setViewMode('admin');
    } else {
      alert("Token inválido. Debe empezar con 'ghp_'");
    }
  };

  const saveToGitHub = async (newDatabase) => {
    setIsSaving(true);
    setSaveMessage({ type: 'info', text: 'Guardando en la nube...' });

    try {
      // 1. Obtener SHA del archivo actual
      const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`;
      const getRes = await fetch(getUrl, {
        headers: { 
          'Authorization': `token ${adminToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!getRes.ok) throw new Error("Error de conexión con GitHub.");
      const fileData = await getRes.json();

      // 2. Guardar cambios
      const contentEncoded = utf8_to_b64(JSON.stringify(newDatabase, null, 4));
      
      const putRes = await fetch(getUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Actualización desde Panel Admin",
          content: contentEncoded,
          sha: fileData.sha
        })
      });

      if (!putRes.ok) throw new Error("No se pudo escribir en la base de datos.");

      setDatabase(newDatabase);
      setSaveMessage({ type: 'success', text: '¡Base de datos actualizada!' });
      setShowModal(false);
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error(error);
      setSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    const form = e.target;
    
    const newStudent = {
      nombre: form.nombre.value.toUpperCase(),
      tipoDoc: form.tipoDoc.value,
      id: form.id.value,
      email: form.email.value,
      plan: form.plan.value,
      estado: form.estado.value,
      fechaPago: form.fechaPago.value || "Pendiente",
      url_carpeta: form.url_carpeta.value || "#"
    };

    let updatedDB;
    if (editingStudent) {
      updatedDB = database.map(s => (s.id === editingStudent.id ? newStudent : s));
    } else {
      if (database.some(s => cleanId(s.id) === cleanId(newStudent.id))) {
        setSaveMessage({ type: 'error', text: '¡Este ID ya existe!' });
        return;
      }
      updatedDB = [...database, newStudent];
    }
    saveToGitHub(updatedDB);
  };

  const handleDelete = (idToDelete) => {
    if (confirm("¿Eliminar estudiante permanentemente?")) {
      const updatedDB = database.filter(s => s.id !== idToDelete);
      saveToGitHub(updatedDB);
    }
  };

  const filteredStudents = database.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.includes(searchTerm) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RENDERIZADO ---

  // 1. PANTALLA LOGIN ADMIN
  if (viewMode === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500/20 p-3 rounded-full"><Lock className="text-blue-400" size={32} /></div>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-6">Panel Maestro</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
              placeholder="Token de GitHub (ghp_...)"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              autoFocus
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
              Entrar
            </button>
            <button type="button" onClick={() => setViewMode('student')} className="w-full text-slate-500 text-sm hover:text-white mt-2">
              Cancelar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. PANTALLA DASHBOARD
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
        <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <Database className="text-emerald-400" size={20}/>
            <h1 className="font-bold">Admin Panel</h1>
          </div>
          <button onClick={() => setViewMode('student')} className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg">
            <LogOut size={16} /> Salir
          </button>
        </header>

        <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setEditingStudent(null); setShowModal(true); setSaveMessage({type:'', text:''}); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all"
            >
              <Plus size={18} /> Nuevo
            </button>
          </div>

          {saveMessage.text && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${saveMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
              {saveMessage.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle size={16}/>}
              {saveMessage.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="p-4">Estudiante</th>
                    <th className="p-4">ID</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{s.nombre}</div>
                        <div className="text-slate-400 text-xs">{s.email}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{s.id}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700">{s.plan}</span></td>
                      <td className="p-4 text-xs font-bold text-slate-600">{s.estado}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setEditingStudent(s); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">{editingStudent ? 'Editar' : 'Crear'} Estudiante</h3>
                <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400"/></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="studentForm" onSubmit={handleSaveStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="md:col-span-2"><label className="block font-bold mb-1">Nombre</label><input name="nombre" required defaultValue={editingStudent?.nombre} className="w-full border rounded p-2 uppercase" /></div>
                  <div><label className="block font-bold mb-1">Tipo Doc</label><select name="tipoDoc" defaultValue={editingStudent?.tipoDoc || "T.I."} className="w-full border rounded p-2"><option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option></select></div>
                  <div><label className="block font-bold mb-1">ID</label><input name="id" required defaultValue={editingStudent?.id} readOnly={!!editingStudent} className="w-full border rounded p-2" /></div>
                  <div className="md:col-span-2"><label className="block font-bold mb-1">Email</label><input name="email" type="email" required defaultValue={editingStudent?.email} className="w-full border rounded p-2" /></div>
                  <div><label className="block font-bold mb-1">Plan</label><select name="plan" defaultValue={editingStudent?.plan || "Plan Básico"} className="w-full border rounded p-2"><option>Plan Básico</option><option>Plan Premium</option></select></div>
                  <div><label className="block font-bold mb-1">Estado</label><select name="estado" defaultValue={editingStudent?.estado || "Activo"} className="w-full border rounded p-2"><option>Activo</option><option>Revocado</option></select></div>
                  <div><label className="block font-bold mb-1">Fecha Pago</label><input name="fechaPago" defaultValue={editingStudent?.fechaPago} className="w-full border rounded p-2" /></div>
                  <div className="md:col-span-2"><label className="block font-bold mb-1">URL Carpeta</label><input name="url_carpeta" defaultValue={editingStudent?.url_carpeta} className="w-full border rounded p-2" /></div>
                </form>
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" form="studentForm" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. PANTALLA ESTUDIANTE (Por defecto)
  return (
    <div className="min-h-screen w-full font-sans text-slate-200 bg-[#0f172a] relative flex flex-col">
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-40 md:opacity-60" style={{ backgroundImage: `url('${ASSETS.fondo}')` }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none"></div>

      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/70 border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={ASSETS.logoSmall} alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold tracking-wide text-white/90 uppercase hidden sm:block">Plataforma Estudiantil</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Lock size={10} /> CONEXIÓN SEGURA
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 w-full">
        {!studentResult && (
          <div className="w-full max-w-sm md:max-w-md flex flex-col items-center animate-fade-in-up">
            <div className="mb-8 hover:scale-105 transition-transform duration-500">
              <img src={ASSETS.logoMain} alt="Main Logo" className="w-40 md:w-56 h-auto mx-auto drop-shadow-2xl" />
            </div>
            <div className="w-full bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/5">
              <h1 className="text-lg font-bold text-white text-center mb-6 uppercase tracking-tight">Consulta de Credenciales</h1>
              <form onSubmit={handleStudentVerify} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo Documento</label>
                   <div className="relative">
                      <select name="tipoDoc" value={formData.tipoDoc} onChange={handleInputChange} className="w-full py-3 px-4 pl-10 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white text-sm appearance-none focus:border-blue-500 outline-none cursor-pointer">
                        <option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option>
                      </select>
                      <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none"/>
                   </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Número ID</label>
                    <div className="relative">
                        <input type="number" inputMode="numeric" name="numeroDoc" placeholder="Ej: 100200300" className="w-full py-3 px-4 pl-10 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white text-sm focus:border-blue-500 outline-none placeholder:text-slate-600 font-bold tracking-wider" value={formData.numeroDoc} onChange={handleInputChange} />
                        <User size={16} className="absolute left-3.5 top-3.5 text-slate-500"/>
                    </div>
                </div>
                <button type="submit" disabled={searchLoading || !formData.numeroDoc} className="w-full py-3.5 rounded-xl font-bold text-white text-sm uppercase tracking-widest mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg transition-all active:scale-95 disabled:opacity-70">
                  {searchLoading ? 'Procesando...' : 'Ingresar'}
                </button>
              </form>
              {searchError && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 animate-shake">
                  <AlertCircle className="text-red-400 shrink-0" size={16} />
                  <p className="text-red-200 text-xs">{searchError}</p>
                </div>
              )}
            </div>
            <p className="mt-6 text-slate-500 text-[10px] uppercase tracking-widest opacity-60">© 2025 Seamos Genios</p>
          </div>
        )}

        {studentResult && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-4xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-slide-up">
              <div className={`md:w-2/5 p-8 flex flex-col justify-between relative overflow-hidden ${studentResult.plan.includes('Premium') ? 'bg-gradient-to-br from-indigo-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 to-slate-800'}`}>
                <button onClick={() => {setStudentResult(null); setFormData({...formData, numeroDoc: ''});}} className="self-start text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 relative z-10"><X size={16}/> Cerrar</button>
                <div className="text-center relative z-10 my-8">
                  <div className="inline-flex p-4 bg-white/10 rounded-full mb-4 ring-1 ring-white/20 shadow-xl">
                    {studentResult.plan.includes('Premium') ? <Award size={40} className="text-yellow-300" /> : <CheckCircle size={40} className="text-emerald-300" />}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">Hola, {studentResult.nombre.split(' ')[0]}</h2>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-widest">{studentResult.plan}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl border border-white/10 text-center relative z-10">
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Identificación</p>
                  <p className="text-lg font-mono text-white tracking-widest">{studentResult.id}</p>
                </div>
              </div>
              
              <div className="md:w-3/5 p-8 bg-white text-slate-800 overflow-y-auto">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{studentResult.nombre}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-2"><User size={14}/> {studentResult.email}</p>
                </div>
                <div className="grid gap-4">
                  <a href={studentResult.url_carpeta} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="bg-white p-2 rounded-full text-indigo-600 group-hover:scale-110 transition-transform"><FolderOpen size={24}/></div>
                    <div><h4 className="font-bold text-indigo-900 text-sm">Material de Estudio</h4><p className="text-indigo-600/70 text-xs">Acceder a carpeta Drive</p></div>
                    <ExternalLink size={16} className="ml-auto text-indigo-300"/>
                  </a>
                  <a href={ASSETS.formsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all group">
                    <div className="bg-white p-2 rounded-full text-emerald-600 group-hover:scale-110 transition-transform"><FileSignature size={24}/></div>
                    <div><h4 className="font-bold text-emerald-900 text-sm">Hoja de Respuestas</h4><p className="text-emerald-600/70 text-xs">Responder simulacro</p></div>
                    <ExternalLink size={16} className="ml-auto text-emerald-300"/>
                  </a>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                    <Key className="text-amber-500 shrink-0" size={20}/>
                    <div className="flex-1 text-xs text-amber-800"><span className="font-bold block">Contraseña PDF:</span> Tu número de identificación</div>
                    <button onClick={() => navigator.clipboard.writeText(studentResult.id)} className="bg-white px-3 py-1 text-amber-600 text-xs font-bold border border-amber-200 rounded hover:bg-amber-50">COPIAR</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      `}</style>
    </div>
  );
}
