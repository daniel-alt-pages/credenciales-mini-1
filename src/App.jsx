import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, CheckCircle, Lock, Award, User, FileText, Key, 
  FolderOpen, FileSignature, X, Search, Edit, Trash2, Plus, Save, 
  LogOut, Database, Loader2, ExternalLink, Code, LayoutList, UploadCloud,
  ArrowUpDown, Mail, Filter, Users, Ban, Sparkles, BookOpen, Zap, Activity,
  PieChart // Icono para estadísticas
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
  formsBaseUrl: "https://forms.gle/p1FnrAgDKcQkJDLw7", 
};

const ASIGNATURAS = [
  { id: 'math', name: 'Matemáticas', icon: <Activity size={20}/>, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', link: ASSETS.formsBaseUrl },
  { id: 'lectura', name: 'Lectura Crítica', icon: <BookOpen size={20}/>, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', link: ASSETS.formsBaseUrl },
  { id: 'sociales', name: 'Competencias Ciudadanas', icon: <Users size={20}/>, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', link: ASSETS.formsBaseUrl },
  { id: 'naturales', name: 'Ciencias Naturales', icon: <Zap size={20}/>, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', link: ASSETS.formsBaseUrl },
  { id: 'ingles', name: 'Inglés', icon: <Sparkles size={20}/>, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', link: ASSETS.formsBaseUrl },
];

const cleanId = (id) => (!id ? "" : id.toString().replace(/[^a-zA-Z0-9]/g, ""));
const utf8_to_b64 = (str) => window.btoa(unescape(encodeURIComponent(str)));

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('sg_viewMode') || 'student'); 
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('sg_adminToken') || '');
  const [database, setDatabase] = useState([]);
  const [originalDatabase, setOriginalDatabase] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // --- ESTADOS ESTUDIANTE ---
  const [formData, setFormData] = useState({ tipoDoc: 'T.I.', numeroDoc: '' });
  const [studentResult, setStudentResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // --- ESTADOS ADMIN ---
  const [adminView, setAdminView] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLetter, setFilterLetter] = useState('');
  const [filterPlan, setFilterPlan] = useState('TODOS');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // --- EFECTOS ---
  useEffect(() => {
    localStorage.setItem('sg_viewMode', viewMode);
    localStorage.setItem('sg_adminToken', adminToken);
  }, [viewMode, adminToken]);

  useEffect(() => {
    fetchData();
  }, []);

  const cursorRef = useRef(null);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('./estudiantes.json?t=' + new Date().getTime());
      if (!response.ok) throw new Error("Error cargando datos");
      const data = await response.json();
      setDatabase(data);
      setOriginalDatabase(JSON.parse(JSON.stringify(data)));
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- ESTADÍSTICAS DINÁMICAS ---
  // Esto detecta automáticamente TODOS los planes que existan en el JSON
  const getPlanStats = () => {
    const counts = {};
    database.forEach(s => {
      const plan = s.plan || 'Sin Plan';
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return counts;
  };
  const planStats = getPlanStats();

  const stats = {
    total: database.length,
    active: database.filter(s => s.estado === 'Activo').length,
    revoked: database.filter(s => s.estado === 'Revocado').length,
    ...planStats // Expande los conteos de planes dinámicamente
  };

  // --- LÓGICA ADMIN ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedStudents = () => {
    let filtered = database.filter(s => {
      const matchesSearch = 
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.includes(searchTerm) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLetter = filterLetter === '' || s.nombre.toUpperCase().startsWith(filterLetter);
      const matchesPlan = filterPlan === 'TODOS' || (s.plan && s.plan.toUpperCase().includes(filterPlan.toUpperCase()));
      return matchesSearch && matchesLetter && matchesPlan;
    });

    return filtered.sort((a, b) => {
      const valA = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : '';
      const valB = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const processedStudents = getFilteredAndSortedStudents();

  const updateLocalDatabase = (newData) => {
    setDatabase(newData);
    setHasUnsavedChanges(true);
    setJsonContent(JSON.stringify(newData, null, 2));
  };

  const handleLocalSaveStudent = (e) => {
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
      // Permitir editar ID: Si cambia el ID, verificamos que no choque con otro
      if (editingStudent.id !== newStudent.id && database.some(s => cleanId(s.id) === cleanId(newStudent.id))) {
         alert("¡Error! Ya existe otro estudiante con ese ID.");
         return;
      }
      // Buscamos por referencia del objeto original para reemplazarlo
      updatedDB = database.map(s => s === editingStudent ? newStudent : s);
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
    if (confirm(`¿Eliminar a ${studentToDelete.nombre}?`)) {
      const updatedDB = database.filter(s => s !== studentToDelete);
      updateLocalDatabase(updatedDB);
    }
  };

  const commitToGitHub = async () => {
    if (!confirm("¿Publicar cambios en la plataforma oficial?")) return;
    setIsSavingCloud(true);
    try {
      const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`;
      const getRes = await fetch(getUrl, { headers: { 'Authorization': `token ${adminToken}`, 'Accept': 'application/vnd.github.v3+json' } });
      if (!getRes.ok) throw new Error("Error conectando con GitHub");
      const fileData = await getRes.json();

      const contentEncoded = utf8_to_b64(JSON.stringify(database, null, 4));
      const putRes = await fetch(getUrl, {
        method: 'PUT',
        headers: { 'Authorization': `token ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Update from Admin Panel", content: contentEncoded, sha: fileData.sha })
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

  // --- LÓGICA ESTUDIANTE ---
  const handleStudentVerify = (e) => {
    e.preventDefault();
    if (!formData.numeroDoc.trim()) return;
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
        if (found.estado?.toLowerCase() === "revocado") setSearchError("Tu credencial está inactiva.");
        else setStudentResult(found);
      } else setSearchError("No se encontró ese número de documento.");
      setSearchLoading(false);
    }, 800);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminToken.startsWith('ghp_') || adminToken.startsWith('github_pat_')) {
      setViewMode('admin');
      setJsonContent(JSON.stringify(database, null, 2));
    } else alert("Token inválido");
  };

  const handleLogout = () => {
    setViewMode('student');
    setAdminToken('');
    localStorage.removeItem('sg_viewMode');
    localStorage.removeItem('sg_adminToken');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // --- RENDERIZADO ---

  if (viewMode === 'login') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-md w-full relative z-10 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-cyan-950/50 rounded-full mb-4 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/20 animate-pulse"><Lock className="text-cyan-400" size={32} /></div>
            <h2 className="text-2xl font-bold text-white tracking-wide">ACCESO MAESTRO</h2>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="relative">
              <Key className="absolute left-4 top-3.5 text-cyan-600" size={20}/>
              <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" placeholder="Token GitHub (ghp_...)" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">AUTENTICAR</button>
            <button type="button" onClick={() => setViewMode('student')} className="w-full text-slate-500 text-xs hover:text-white transition-colors">CANCELAR</button>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-200 flex flex-col">
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg shadow-lg"><Database className="text-white" size={20}/></div>
            <div><h1 className="font-bold text-white tracking-wide text-sm md:text-base">PANEL DE CONTROL</h1></div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="bg-slate-800 p-1 rounded-lg flex border border-slate-700">
              <button onClick={() => setAdminView('table')} className={`p-2 rounded-md transition-all ${adminView === 'table' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`} title="Tabla"><LayoutList size={18}/></button>
              <button onClick={() => setAdminView('json')} className={`p-2 rounded-md transition-all ${adminView === 'json' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`} title="JSON"><Code size={18}/></button>
            </div>
            <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"><LogOut size={14}/> SALIR</button>
          </div>
        </header>

        {hasUnsavedChanges && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in sticky top-16 z-20 backdrop-blur-md">
            <div className="flex items-center gap-3 text-yellow-400"><AlertCircle size={20} /><span className="font-bold text-sm">Cambios locales pendientes</span></div>
            <button onClick={commitToGitHub} disabled={isSavingCloud} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95 w-full sm:w-auto justify-center">
              {isSavingCloud ? <Loader2 className="animate-spin" size={18}/> : <UploadCloud size={18}/>} GUARDAR EN NUBE
            </button>
          </div>
        )}

        <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Estadísticas Mejoradas y Dinámicas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:border-blue-500/30 transition-colors">
              <div><p className="text-slate-400 text-[10px] uppercase font-bold">Total Estudiantes</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
              <Users className="text-blue-500" size={24} />
            </div>
            
            {/* Renderizado Dinámico de Planes (Muestra cualquier plan que exista) */}
            {Object.keys(planStats).map((planName, i) => (
               <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:border-purple-500/30 transition-colors">
                  <div><p className="text-slate-400 text-[10px] uppercase font-bold">{planName}</p><p className="text-2xl font-bold text-purple-400">{planStats[planName]}</p></div>
                  <Award className="text-purple-500" size={24} />
               </div>
            ))}
          </div>

          {adminView === 'table' && (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow group">
                    <Search className="absolute left-3 top-3 text-slate-500 group-hover:text-cyan-400 transition-colors" size={18} />
                    <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl shadow-inner outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  
                  {/* Filtro de Plan Dinámico */}
                  <div className="relative min-w-[180px]">
                    <Filter className="absolute left-3 top-3 text-slate-500" size={18} />
                    <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl shadow-inner outline-none focus:border-cyan-500 text-slate-300 cursor-pointer appearance-none">
                      <option value="TODOS">Todos los Planes</option>
                      {Object.keys(planStats).map(plan => <option key={plan} value={plan}>{plan}</option>)}
                    </select>
                  </div>

                  <button onClick={() => { setEditingStudent(null); setShowModal(true); }} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 whitespace-nowrap"><Plus size={18} /> <span className="inline">Nuevo</span></button>
                </div>

                {/* Filtro A-Z */}
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 overflow-x-auto flex gap-1 no-scrollbar">
                  <button onClick={() => setFilterLetter('')} className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${filterLetter === '' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>TODOS</button>
                  {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(char => (
                    <button key={char} onClick={() => setFilterLetter(char)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filterLetter === char ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>{char}</button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4 font-bold cursor-pointer hover:text-white group" onClick={() => handleSort('nombre')}>
                          <div className="flex items-center gap-1">Estudiante <ArrowUpDown size={12} className="opacity-50 group-hover:opacity-100"/></div>
                        </th>
                        <th className="p-4 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('id')}>Doc <ArrowUpDown size={12} className="inline opacity-50 hover:opacity-100"/></th>
                        <th className="p-4 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('plan')}>Plan <ArrowUpDown size={12} className="inline opacity-50 hover:opacity-100"/></th>
                        <th className="p-4 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('estado')}>Estado <ArrowUpDown size={12} className="inline opacity-50 hover:opacity-100"/></th>
                        <th className="p-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {processedStudents.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-800/50 transition-colors group">
                          <td className="p-4 text-center text-slate-600 font-mono text-xs">{i + 1}</td>
                          <td className="p-4">
                            <div className="font-bold text-white mb-0.5">{s.nombre}</div>
                            <div className="text-slate-500 text-xs flex items-center gap-2">{s.email} <a href={`mailto:${s.email}`} className="text-blue-500 hover:text-blue-300"><Mail size={12}/></a></div>
                          </td>
                          <td className="p-4"><div className="flex items-center gap-2"><span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">{s.tipoDoc}</span><span className="font-mono text-cyan-300">{s.id}</span></div></td>
                          <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border bg-slate-800 text-slate-300 border-slate-600`}>{s.plan}</span></td>
                          <td className="p-4"><span className={`flex items-center gap-1.5 text-xs font-bold ${s.estado === 'Activo' ? 'text-emerald-400' : 'text-red-400'}`}><span className={`w-1.5 h-1.5 rounded-full ${s.estado === 'Activo' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>{s.estado}</span></td>
                          <td className="p-4 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => { setEditingStudent(s); setShowModal(true); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg" title="Editar"><Edit size={16} /></button><button onClick={() => handleLocalDelete(s)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="Eliminar"><Trash2 size={16} /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {adminView === 'json' && (
            <div className="h-[calc(100vh-140px)] flex flex-col">
              <div className="bg-slate-900 rounded-t-xl p-4 border border-slate-800 flex justify-between items-center">
                <h3 className="text-slate-300 text-sm font-mono">estudiantes.json</h3>
                {jsonError && <span className="text-red-400 text-xs font-bold bg-red-900/20 px-2 py-1 rounded">{jsonError}</span>}
              </div>
              <textarea className={`w-full flex-grow bg-slate-950 text-slate-300 font-mono text-xs p-4 outline-none border border-t-0 ${jsonError ? 'border-red-500/50' : 'border-slate-800'} rounded-b-xl resize-none`} value={jsonContent} onChange={handleJsonChange} spellCheck="false" />
            </div>
          )}
        </main>

        {/* MODAL EDICIÓN */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">{editingStudent ? <Edit size={18}/> : <Plus size={18}/>} {editingStudent ? 'Editar' : 'Crear'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="studentForm" onSubmit={handleLocalSaveStudent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Nombre</label><input name="nombre" required defaultValue={editingStudent?.nombre} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white uppercase font-bold focus:border-blue-500 outline-none" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tipo Doc</label><select name="tipoDoc" defaultValue={editingStudent?.tipoDoc || "T.I."} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none"><option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">ID (Sin Puntos)</label><input name="id" required defaultValue={editingStudent?.id} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-cyan-300 font-mono focus:border-cyan-500 outline-none" /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Email</label><input name="email" type="email" required defaultValue={editingStudent?.email} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none" /></div>
                  {/* CAMPO PLAN EDITABLE (TEXTO LIBRE O SELECTOR AMPLIADO) */}
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Plan</label><input name="plan" required defaultValue={editingStudent?.plan || "Plan Básico"} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="Ej: Plan Intermedio" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Estado</label><select name="estado" defaultValue={editingStudent?.estado || "Activo"} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none"><option>Activo</option><option>Revocado</option><option>Pendiente</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Fecha Pago</label><input name="fechaPago" defaultValue={editingStudent?.fechaPago} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none" /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">URL Carpeta</label><input name="url_carpeta" defaultValue={editingStudent?.url_carpeta} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-blue-400 text-xs outline-none" /></div>
                </form>
              </div>
              <div className="p-5 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-400 font-bold hover:text-white hover:bg-slate-800 rounded-xl">Cancelar</button>
                <button type="submit" form="studentForm" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. MODO ESTUDIANTE (Futurista & Responsivo)
  return (
    <div className="min-h-screen w-full font-sans text-slate-200 bg-[#0f172a] relative flex flex-col items-center justify-center overflow-x-hidden">
      
      {/* Fondo y Estela */}
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-40 md:opacity-60" style={{ backgroundImage: `url('${ASSETS.fondo}')` }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none"></div>
      <div ref={cursorRef} className="fixed w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0 transform -translate-x-1/2 -translate-y-1/2 hidden md:block transition-transform duration-100"></div>

      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/70 border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={ASSETS.logoSmall} alt="Logo" className="h-8 md:h-12 w-auto object-contain drop-shadow-md" />
            <div className="h-5 w-px bg-white/20 mx-1 hidden sm:block"></div>
            <span className="text-sm md:text-lg font-bold tracking-wide text-white/90 uppercase hidden sm:block">Plataforma Estudiantil</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Lock size={10} className="md:w-3 md:h-3" /> CONEXIÓN SEGURA
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center p-4 w-full max-w-4xl flex-grow">
        {!studentResult && (
          <div className="w-full max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center animate-fade-in-up">
            <div className="mb-8 md:mb-10 hover:scale-105 transition-transform duration-700 ease-out">
              <img src={ASSETS.logoMain} alt="Seamos Genios Logo" className="w-48 md:w-64 lg:w-80 h-auto mx-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
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
                      <select name="tipoDoc" value={formData.tipoDoc} onChange={(e) => setFormData({...formData, tipoDoc: e.target.value})} className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 transition-all appearance-none cursor-pointer">
                        <option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option><option>OTRO</option>
                      </select>
                      <div className="absolute left-3.5 top-3.5 text-slate-500 group-hover/input:text-blue-400 transition-colors"><FileText size={18} /></div>
                   </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Número de Identificación</label>
                    <div className="relative group/input">
                        <input type="number" inputMode="numeric" name="numeroDoc" placeholder="Ej: 100200300" className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white placeholder:text-slate-600 text-sm font-bold tracking-wider focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 transition-all" value={formData.numeroDoc} onChange={(e) => setFormData({...formData, numeroDoc: e.target.value})} />
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

        {/* VISTA RESULTADOS ESTUDIANTE */}
        {studentResult && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up min-h-0 my-auto">
              <button onClick={() => {setStudentResult(null); setFormData({...formData, numeroDoc: ''});}} className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white md:hidden backdrop-blur-sm transition-colors"><X size={20} /></button>
              <div className={`md:w-2/5 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden ${studentResult.plan.includes('Premium') ? 'bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#581C87] text-white' : 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                  <button onClick={() => {setStudentResult(null); setFormData({...formData, numeroDoc: ''});}} className="hidden md:inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors mb-8 group"><span className="group-hover:-translate-x-1 transition-transform">←</span> Nueva Consulta</button>
                  <div className="flex flex-col items-center text-center">
                    <div className="inline-flex p-4 bg-white/10 rounded-full mb-6 backdrop-blur-md ring-1 ring-white/20 shadow-xl animate-pulse-slow">
                      {studentResult.plan.includes('Premium') ? <Award size={48} className="text-yellow-300" /> : <CheckCircle size={48} className="text-emerald-300" />}
                    </div>
                    <div className="px-4 py-1.5 bg-white/10 rounded-full border border-white/10 mb-4"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">{studentResult.plan}</span></div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 leading-tight">Hola, {studentResult.nombre.split(' ')[0]}</h2>
                    <p className="text-white/60 text-sm">Bienvenido a tu espacio</p>
                  </div>
                </div>
                <div className="relative z-10 mt-10 md:mt-0"><div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/5"><p className="text-[10px] uppercase font-bold text-white/40 mb-1 tracking-wider">Identificación</p><p className="text-xl font-mono font-medium tracking-widest">{studentResult.id}</p></div></div>
              </div>
              <div className="md:w-3/5 p-8 md:p-10 bg-white text-slate-800 overflow-y-auto">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase leading-tight mb-4">{studentResult.nombre}</h3>
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-600">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0"><User size={20} /></div>
                    <div className="text-left"><p className="text-blue-900 text-xs font-bold uppercase tracking-wide">Cuenta de Acceso</p><p className="text-blue-700 text-sm mt-1 leading-relaxed">Para ver los archivos, debes iniciar sesión en Google con: <br/><span className="font-bold text-blue-900 select-all">{studentResult.email}</span></p></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  
                  {/* BOTÓN MATERIAL */}
                  <a href={studentResult.url_carpeta} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden bg-white border border-slate-200 hover:border-indigo-500/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={16} className="text-indigo-500" /></div>
                    <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><FolderOpen className="text-indigo-600" size={24} /></div>
                    <h4 className="font-bold text-slate-800 text-sm">Material de Estudio</h4><p className="text-slate-500 text-xs mt-1">Ver carpeta en Drive</p>
                  </a>

                  {/* BOTÓN SIMULACRO CON MODAL */}
                  <button onClick={() => setShowSubjectModal(true)} className="group relative overflow-hidden bg-white border border-slate-200 hover:border-emerald-500/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 text-left">
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={16} className="text-emerald-500" /></div>
                    <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><FileSignature className="text-emerald-600" size={24} /></div>
                    <h4 className="font-bold text-slate-800 text-sm">Hoja de Respuestas</h4><p className="text-slate-500 text-xs mt-1">Responder simulacro</p>
                  </button>

                  {/* BOTÓN RESULTADOS (FUTURO) */}
                  <button onClick={() => alert("¡Próximamente! Estamos trabajando en esta función para que veas tu progreso.")} className="group relative overflow-hidden bg-slate-50 border border-slate-200 hover:border-purple-500/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 text-left opacity-70 hover:opacity-100">
                    <div className="absolute top-2 right-2 bg-purple-100 text-purple-600 text-[9px] font-bold px-2 py-0.5 rounded-full">PRONTO</div>
                    <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><Award className="text-purple-600" size={24} /></div>
                    <h4 className="font-bold text-slate-800 text-sm">Mis Resultados</h4><p className="text-slate-500 text-xs mt-1">Ver puntajes y avance</p>
                  </button>

                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                   <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0"><Key size={24} /></div>
                   <div className="flex-1"><h4 className="text-amber-900 font-bold text-sm">Contraseña para documentos</h4><p className="text-amber-700/80 text-xs mt-0.5">Si un PDF te pide clave, usa tu número de identificación.</p></div>
                   <button onClick={() => navigator.clipboard.writeText(studentResult.id)} className="bg-white hover:bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg text-amber-700 text-xs font-bold shadow-sm active:scale-95 transition-all">COPIAR CLAVE</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ASIGNATURAS */}
        {showSubjectModal && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Selecciona la Asignatura</h3>
                  <p className="text-slate-500 text-sm">Elige el área que deseas responder hoy</p>
                </div>
                <button onClick={() => setShowSubjectModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
              </div>
              <div className="p-6 grid grid-cols-1 gap-3">
                {ASIGNATURAS.map((subject) => (
                  <a 
                    key={subject.id}
                    href={subject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md group active:scale-95 ${subject.bg} ${subject.border} hover:bg-white cursor-pointer`}
                  >
                    <div className={`p-3 rounded-full bg-white shadow-sm ${subject.color}`}>{subject.icon}</div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{subject.name}</h4>
                      <p className="text-xs text-slate-500">Ir al formulario oficial</p>
                    </div>
                    <ExternalLink size={16} className="ml-auto text-slate-300 group-hover:text-indigo-400"/>
                  </a>
                ))}
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
        .animate-pulse-slow { animation: pulse 3s infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
}
