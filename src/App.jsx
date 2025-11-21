import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, Lock, Award, User, FileText, Key, 
  FolderOpen, FileSignature, X, Search, Edit, Trash2, Plus, Save, 
  LogOut, Database, Loader2, ExternalLink, Code, LayoutList, UploadCloud
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

// Utilidad para limpiar ID (quita puntos, espacios)
const cleanId = (id) => (!id ? "" : id.toString().replace(/[^a-zA-Z0-9]/g, ""));

// Base64 seguro para UTF-8
const utf8_to_b64 = (str) => window.btoa(unescape(encodeURIComponent(str)));

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [viewMode, setViewMode] = useState('student'); 
  const [database, setDatabase] = useState([]);
  const [originalDatabase, setOriginalDatabase] = useState([]); // Para comparar cambios
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // --- ESTADOS ESTUDIANTE ---
  const [formData, setFormData] = useState({ tipoDoc: 'T.I.', numeroDoc: '' });
  const [studentResult, setStudentResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // --- ESTADOS ADMIN ---
  const [adminToken, setAdminToken] = useState('');
  const [adminView, setAdminView] = useState('table'); // 'table' o 'json'
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('./estudiantes.json?t=' + new Date().getTime());
      if (!response.ok) throw new Error("Error cargando datos");
      const data = await response.json();
      setDatabase(data);
      setOriginalDatabase(JSON.parse(JSON.stringify(data))); // Copia profunda
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // ----------------------------------------------------
  // LÓGICA DE GESTIÓN DE DATOS (LOCAL)
  // ----------------------------------------------------

  // Actualizar la BD localmente (sin subir a GitHub aún)
  const updateLocalDatabase = (newData) => {
    setDatabase(newData);
    setHasUnsavedChanges(true);
    // Actualizamos también el texto del editor JSON por si cambian de vista
    setJsonContent(JSON.stringify(newData, null, 2));
  };

  const handleLocalSaveStudent = (e) => {
    e.preventDefault();
    const form = e.target;
    
    const newStudent = {
      nombre: form.nombre.value.toUpperCase(),
      tipoDoc: form.tipoDoc.value,
      id: form.id.value, // Permitimos editar ID para corregir errores
      email: form.email.value,
      plan: form.plan.value,
      estado: form.estado.value,
      fechaPago: form.fechaPago.value || "Pendiente",
      url_carpeta: form.url_carpeta.value || "#"
    };

    let updatedDB;
    if (editingStudent) {
      // Mantenemos el índice original o buscamos por ID antiguo si no cambió
      updatedDB = database.map(s => (s.id === editingStudent.id && s.nombre === editingStudent.nombre) ? newStudent : s);
      
      // Si cambió el ID, hay que asegurar que no duplicamos uno existente
      if (editingStudent.id !== newStudent.id) {
         if (database.some(s => cleanId(s.id) === cleanId(newStudent.id))) {
             alert("¡Error! Ya existe otro estudiante con ese ID.");
             return;
         }
         // Si estamos editando el ID, buscamos el registro original para reemplazarlo
         updatedDB = database.map(s => s === editingStudent ? newStudent : s);
      }
    } else {
      if (database.some(s => cleanId(s.id) === cleanId(newStudent.id))) {
        alert("¡Error! Este ID ya existe.");
        return;
      }
      updatedDB = [...database, newStudent];
    }
    
    updateLocalDatabase(updatedDB);
    setShowModal(false);
  };

  const handleLocalDelete = (studentToDelete) => {
    if (confirm(`¿Eliminar a ${studentToDelete.nombre}? (Se guardará localmente hasta que subas a la nube)`)) {
      const updatedDB = database.filter(s => s !== studentToDelete);
      updateLocalDatabase(updatedDB);
    }
  };

  const handleJsonChange = (e) => {
    const val = e.target.value;
    setJsonContent(val);
    try {
      const parsed = JSON.parse(val);
      setDatabase(parsed);
      setHasUnsavedChanges(true);
      setJsonError('');
    } catch (err) {
      setJsonError('JSON Inválido: ' + err.message);
    }
  };

  // ----------------------------------------------------
  // LÓGICA DE PERSISTENCIA (GITHUB API)
  // ----------------------------------------------------

  const commitToGitHub = async () => {
    if (!confirm("¿Estás seguro de publicar estos cambios en la plataforma oficial?")) return;
    
    setIsSavingCloud(true);
    try {
      // 1. Obtener SHA
      const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`;
      const getRes = await fetch(getUrl, {
        headers: { 'Authorization': `token ${adminToken}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!getRes.ok) throw new Error("Error conectando con GitHub");
      const fileData = await getRes.json();

      // 2. Guardar
      const contentEncoded = utf8_to_b64(JSON.stringify(database, null, 4));
      const putRes = await fetch(getUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Actualización masiva desde Admin Panel",
          content: contentEncoded,
          sha: fileData.sha
        })
      });

      if (!putRes.ok) throw new Error("Error al escribir el archivo");

      setOriginalDatabase(JSON.parse(JSON.stringify(database)));
      setHasUnsavedChanges(false);
      alert("¡Cambios publicados con éxito!");

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // ----------------------------------------------------
  // LÓGICA ESTUDIANTE
  // ----------------------------------------------------
  const handleStudentVerify = (e) => {
    e.preventDefault();
    if (!formData.numeroDoc.trim()) return;

    // Puerta trasera
    if (formData.numeroDoc.trim() === ADMIN_ACCESS_CODE) {
      setSearchLoading(true);
      setTimeout(() => { setSearchLoading(false); setViewMode('login'); setFormData({...formData, numeroDoc:''}); }, 1000);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setStudentResult(null);
    const inputClean = cleanId(formData.numeroDoc);

    setTimeout(() => {
      const found = database.find(s => cleanId(s.id) === inputClean);
      if (found) {
        if (found.estado?.toLowerCase() === "revocado") {
          setSearchError("Tu credencial está inactiva.");
        } else {
          setStudentResult(found);
        }
      } else {
        setSearchError("No se encontró ese número de documento.");
      }
      setSearchLoading(false);
    }, 800);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminToken.startsWith('ghp_') || adminToken.startsWith('github_pat_')) {
      setViewMode('admin');
      setJsonContent(JSON.stringify(database, null, 2));
    } else {
      alert("Token inválido");
    }
  };

  const filteredStudents = database.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.includes(searchTerm) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ----------------------------------------------------
  // RENDERIZADO
  // ----------------------------------------------------

  // 1. LOGIN ADMIN
  if (viewMode === 'login') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-cyan-950/50 rounded-full mb-4 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/20">
              <Lock className="text-cyan-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">ACCESO MAESTRO</h2>
            <p className="text-cyan-200/60 text-sm mt-2">Introduce tu Token de GitHub</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="relative">
              <Key className="absolute left-4 top-3.5 text-cyan-600" size={20}/>
              <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" placeholder="ghp_..." value={adminToken} onChange={(e) => setAdminToken(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">
              AUTENTICAR
            </button>
            <button type="button" onClick={() => setViewMode('student')} className="w-full text-slate-500 text-xs hover:text-white transition-colors">CANCELAR</button>
          </form>
        </div>
      </div>
    );
  }

  // 2. PANEL ADMIN (CRUD + JSON)
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-200 flex flex-col">
        
        {/* Navbar Admin */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg shadow-lg">
              <Database className="text-white" size={20}/>
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-sm md:text-base">PANEL DE CONTROL</h1>
              <p className="text-[10px] text-slate-400">Modo Edición: {adminView === 'table' ? 'Visual' : 'Código'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-1 rounded-lg flex border border-slate-700">
              <button onClick={() => setAdminView('table')} className={`p-2 rounded-md transition-all ${adminView === 'table' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`} title="Vista Tabla"><LayoutList size={18}/></button>
              <button onClick={() => setAdminView('json')} className={`p-2 rounded-md transition-all ${adminView === 'json' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`} title="Vista JSON"><Code size={18}/></button>
            </div>
            <button onClick={() => setViewMode('student')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
              <LogOut size={14}/> SALIR
            </button>
          </div>
        </header>

        {/* Barra de Estado "Cambios sin guardar" */}
        {hasUnsavedChanges && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3 text-yellow-400">
              <AlertCircle size={20} />
              <span className="font-bold text-sm">¡Tienes cambios locales sin guardar en la nube!</span>
            </div>
            <button 
              onClick={commitToGitHub}
              disabled={isSavingCloud}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg text-sm shadow-lg shadow-yellow-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isSavingCloud ? <Loader2 className="animate-spin" size={18}/> : <UploadCloud size={18}/>}
              GUARDAR CAMBIOS EN LA NUBE
            </button>
          </div>
        )}

        <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
          
          {/* VISTA TABLA */}
          {adminView === 'table' && (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-3 top-3 text-slate-500 group-hover:text-cyan-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar estudiantes..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl shadow-inner outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => { setEditingStudent(null); setShowModal(true); }}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Plus size={18} /> AÑADIR ESTUDIANTE
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="p-4 font-bold">Nombre / Email</th>
                        <th className="p-4 font-bold">Documento</th>
                        <th className="p-4 font-bold">Plan</th>
                        <th className="p-4 font-bold">Estado</th>
                        <th className="p-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredStudents.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-800/50 transition-colors group">
                          <td className="p-4">
                            <div className="font-bold text-white mb-0.5">{s.nombre}</div>
                            <div className="text-slate-500 text-xs">{s.email}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">{s.tipoDoc}</span>
                              <span className="font-mono text-cyan-300">{s.id}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${s.plan.includes('Premium') ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30'}`}>
                              {s.plan}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center gap-1.5 text-xs font-bold ${s.estado === 'Activo' ? 'text-emerald-400' : 'text-red-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.estado === 'Activo' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                              {s.estado}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setEditingStudent(s); setShowModal(true); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                              <button onClick={() => handleLocalDelete(s)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* VISTA JSON */}
          {adminView === 'json' && (
            <div className="h-[calc(100vh-140px)] flex flex-col">
              <div className="bg-slate-900 rounded-t-xl p-4 border border-slate-800 flex justify-between items-center">
                <h3 className="text-slate-300 text-sm font-mono">estudiantes.json</h3>
                {jsonError && <span className="text-red-400 text-xs font-bold bg-red-900/20 px-2 py-1 rounded">{jsonError}</span>}
              </div>
              <textarea 
                className={`w-full flex-grow bg-slate-950 text-slate-300 font-mono text-xs p-4 outline-none border border-t-0 ${jsonError ? 'border-red-500/50' : 'border-slate-800'} rounded-b-xl resize-none`}
                value={jsonContent}
                onChange={handleJsonChange}
                spellCheck="false"
              />
              <p className="text-slate-500 text-xs mt-2 text-center">Edita el JSON directamente. Los cambios se validan en tiempo real.</p>
            </div>
          )}
        </main>

        {/* MODAL EDICIÓN */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {editingStudent ? <Edit size={18} className="text-blue-400"/> : <Plus size={18} className="text-emerald-400"/>} 
                  {editingStudent ? 'Editar Estudiante' : 'Nuevo Registro'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="studentForm" onSubmit={handleLocalSaveStudent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Nombre Completo</label>
                    <input name="nombre" required defaultValue={editingStudent?.nombre} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 uppercase font-bold" placeholder="NOMBRE APELLIDO" />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tipo Doc</label>
                    <select name="tipoDoc" defaultValue={editingStudent?.tipoDoc || "T.I."} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 cursor-pointer">
                      <option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Número ID (Sin Puntos)</label>
                    <input name="id" required defaultValue={editingStudent?.id} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-cyan-300 font-mono outline-none focus:border-cyan-500" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Email</label>
                    <input name="email" type="email" required defaultValue={editingStudent?.email} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Plan</label>
                    <select name="plan" defaultValue={editingStudent?.plan || "Plan Básico"} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 cursor-pointer">
                      <option>Plan Básico</option><option>Plan Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Estado</label>
                    <select name="estado" defaultValue={editingStudent?.estado || "Activo"} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 cursor-pointer">
                      <option>Activo</option><option>Revocado</option><option>Pendiente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Fecha Pago</label>
                    <input name="fechaPago" defaultValue={editingStudent?.fechaPago} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">URL Carpeta</label>
                    <input name="url_carpeta" defaultValue={editingStudent?.url_carpeta} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-blue-400 text-xs outline-none focus:border-blue-500" />
                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-400 font-bold hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-sm">Cancelar</button>
                <button type="submit" form="studentForm" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm">Confirmar Edición Local</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. MODO ESTUDIANTE (Original y Estilizado)
  return (
    <div className="min-h-screen w-full font-sans text-slate-200 bg-[#0f172a] relative flex flex-col">
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-40 md:opacity-60" style={{ backgroundImage: `url('${ASSETS.fondo}')` }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none"></div>

      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/70 border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={ASSETS.logoSmall} alt="Logo" className="h-8 w-auto object-contain drop-shadow-md" />
            <div className="h-5 w-px bg-white/20 mx-1 hidden sm:block"></div>
            <span className="text-sm md:text-base font-bold tracking-wide text-white/90 uppercase hidden sm:block">Plataforma Estudiantil</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Lock size={10} className="md:w-3 md:h-3" /> CONEXIÓN SEGURA
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 w-full">
        {!studentResult && (
          <div className="w-full max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center animate-fade-in-up">
            <div className="mb-8 md:mb-10 hover:scale-105 transition-transform duration-700 ease-out">
              <img src={ASSETS.logoMain} alt="Seamos Genios Logo" className="w-40 md:w-56 lg:w-64 h-auto mx-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="w-full bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/5 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-1000"></div>
              <div className="relative z-10 text-center mb-6">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Consulta de Credenciales</h1>
                <p className="text-slate-400 text-xs md:text-sm mt-1">Ingresa tus datos para acceder al material</p>
              </div>
              <form onSubmit={handleStudentVerify} className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Tipo de Documento</label>
                   <div className="relative group/input">
                      <select name="tipoDoc" value={formData.tipoDoc} onChange={handleInputChange} className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 transition-all appearance-none cursor-pointer">
                        <option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option><option>OTRO</option>
                      </select>
                      <div className="absolute left-3.5 top-3.5 text-slate-500 group-hover/input:text-blue-400 transition-colors"><FileText size={18} /></div>
                   </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Número de Identificación</label>
                    <div className="relative group/input">
                        <input type="number" inputMode="numeric" name="numeroDoc" placeholder="Ej: 100200300" className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white placeholder:text-slate-600 text-sm font-bold tracking-wider focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 transition-all" value={formData.numeroDoc} onChange={handleInputChange} />
                        <div className="absolute left-3.5 top-3.5 text-slate-500 group-hover/input:text-blue-400 transition-colors"><User size={18} /></div>
                    </div>
                </div>
                <button type="submit" disabled={searchLoading || !formData.numeroDoc} className="w-full py-4 rounded-xl font-bold text-white text-sm uppercase tracking-widest shadow-lg transition-all duration-300 transform active:scale-95 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25 border border-transparent">
                  {searchLoading ? 'Procesando...' : 'Ingresar al Sistema'}
                </button>
              </form>
              {searchError && (
                <div className="mt-6 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3 animate-shake">
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-red-200 text-xs leading-relaxed">{searchError}</p>
                </div>
              )}
            </div>
            <p className="mt-8 text-slate-500 text-[10px] font-medium uppercase tracking-widest opacity-60">© 2025 Seamos Genios Colombia</p>
          </div>
        )}

        {studentResult && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center sm:text-left">
              <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up">
                <button onClick={() => {setStudentResult(null); setFormData({...formData, numeroDoc: ''});}} className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white md:hidden backdrop-blur-sm transition-colors"><X size={20} /></button>
                <div className={`md:w-2/5 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden ${studentResult.plan.includes('Premium') ? 'bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#581C87] text-white' : 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white'}`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="relative z-10">
                    <button onClick={() => {setStudentResult(null); setFormData({...formData, numeroDoc: ''});}} className="hidden md:inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors mb-8 group"><span className="group-hover:-translate-x-1 transition-transform">←</span> Nueva Consulta</button>
                    <div className="flex flex-col items-center text-center">
                      <div className="inline-flex p-4 bg-white/10 rounded-full mb-6 backdrop-blur-md ring-1 ring-white/20 shadow-xl">
                        {studentResult.plan.includes('Premium') ? <Award size={48} className="text-yellow-300" /> : <CheckCircle size={48} className="text-emerald-300" />}
                      </div>
                      <div className="px-4 py-1.5 bg-white/10 rounded-full border border-white/10 mb-4"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">{studentResult.plan}</span></div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-1 leading-tight">Hola, {studentResult.nombre.split(' ')[0]}</h2>
                      <p className="text-white/60 text-sm">Bienvenido a tu espacio</p>
                    </div>
                  </div>
                  <div className="relative z-10 mt-10 md:mt-0"><div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/5"><p className="text-[10px] uppercase font-bold text-white/40 mb-1 tracking-wider">Identificación</p><p className="text-xl font-mono font-medium tracking-widest">{studentResult.id}</p></div></div>
                </div>
                <div className="md:w-3/5 p-8 md:p-10 bg-white text-slate-800">
                  <div className="mb-8 pb-6 border-b border-slate-100">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase leading-tight mb-4">{studentResult.nombre}</h3>
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-600">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0"><User size={20} /></div>
                      <div className="text-left"><p className="text-blue-900 text-xs font-bold uppercase tracking-wide">Cuenta de Acceso</p><p className="text-blue-700 text-sm mt-1 leading-relaxed">Para ver los archivos, debes iniciar sesión en Google con: <br/><span className="font-bold text-blue-900 select-all">{studentResult.email}</span></p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <a href={studentResult.url_carpeta} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden bg-white border border-slate-200 hover:border-indigo-500/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={16} className="text-indigo-500" /></div>
                      <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><FolderOpen className="text-indigo-600" size={24} /></div>
                      <h4 className="font-bold text-slate-800 text-sm">Material de Estudio</h4><p className="text-slate-500 text-xs mt-1">Ver carpeta en Drive</p>
                    </a>
                    <a href={ASSETS.formsUrl} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden bg-white border border-slate-200 hover:border-emerald-500/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={16} className="text-emerald-500" /></div>
                      <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><FileSignature className="text-emerald-600" size={24} /></div>
                      <h4 className="font-bold text-slate-800 text-sm">Hoja de Respuestas</h4><p className="text-slate-500 text-xs mt-1">Responder simulacro</p>
                    </a>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                     <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0"><Key size={24} /></div>
                     <div className="flex-1"><h4 className="text-amber-900 font-bold text-sm">Contraseña para documentos</h4><p className="text-amber-700/80 text-xs mt-0.5">Si un PDF te pide clave, usa tu número de identificación.</p></div>
                     <button onClick={() => navigator.clipboard.writeText(studentResult.id)} className="bg-white hover:bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg text-amber-700 text-xs font-bold shadow-sm active:scale-95 transition-all">COPIAR CLAVE</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        /* Custom Scrollbar para modales */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
}
