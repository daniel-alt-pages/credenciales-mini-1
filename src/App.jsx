import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, Lock, Award, User, FileText, Key, 
  FolderOpen, FileSignature, X, Search, Edit, Trash2, Plus, Save, 
  LogOut, Database, Loader2 
} from 'lucide-react';

// --- CONFIGURACIÓN DEL PROYECTO ---
// Cambia esto por tus datos reales de GitHub
const GITHUB_CONFIG = {
  OWNER: "daniel-alt-pages",      // Tu usuario de GitHub
  REPO: "credenciales-mini-1",    // El nombre de tu repositorio
  PATH: "public/estudiantes.json" // La ruta del archivo
};

const ASSETS = {
  fondo: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aOtHLJ5xUNkB12hj_FONDO.svg",
  logoSmall: "https://images.prismic.io/seamosgenios2026/aMSzIWGNHVfTPKS1_logosg.png?auto=format,compress",
  logoMain: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg",
  formsUrl: "https://forms.gle/p1FnrAgDKcQkJDLw7"
};

// Utilidad para limpiar ID
const cleanId = (id) => (!id ? "" : id.toString().replace(/[^a-zA-Z0-9]/g, ""));

// Utilidad para codificar a Base64 soportando caracteres latinos (tildes, ñ)
const utf8_to_b64 = (str) => window.btoa(unescape(encodeURIComponent(str)));

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [viewMode, setViewMode] = useState('student'); // 'student', 'login', 'admin'
  const [database, setDatabase] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // --- ESTADOS DE ESTUDIANTE ---
  const [formData, setFormData] = useState({ tipoDoc: 'T.I.', numeroDoc: '' });
  const [studentResult, setStudentResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // --- ESTADOS DE ADMIN ---
  const [adminToken, setAdminToken] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // Carga inicial de datos (Solo lectura)
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Intentamos cargar fresco desde GitHub si es posible, sino local
      const response = await fetch('./estudiantes.json?t=' + new Date().getTime());
      if (!response.ok) throw new Error("Error cargando datos");
      const data = await response.json();
      setDatabase(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // ----------------------------------------------------
  // LÓGICA MODO ESTUDIANTE
  // ----------------------------------------------------
  const handleStudentVerify = (e) => {
    e.preventDefault();
    if (!formData.numeroDoc.trim()) return;
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
        setSearchError("No encontramos ese número de documento.");
      }
      setSearchLoading(false);
    }, 800);
  };

  // ----------------------------------------------------
  // LÓGICA MODO ADMIN (GITHUB API)
  // ----------------------------------------------------
  
  const handleLogin = (e) => {
    e.preventDefault();
    // Validación simple: el token debe tener formato de GitHub
    if (adminToken.startsWith('ghp_') || adminToken.startsWith('github_pat_')) {
      setViewMode('admin');
    } else {
      alert("Token inválido. Debe comenzar con 'ghp_' o 'github_pat_'");
    }
  };

  const saveToGitHub = async (newDatabase) => {
    setIsSaving(true);
    setSaveMessage({ type: 'info', text: 'Conectando con GitHub...' });

    try {
      // 1. Obtener el SHA actual del archivo (necesario para actualizar)
      const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`;
      const getRes = await fetch(getUrl, {
        headers: { 
          'Authorization': `token ${adminToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!getRes.ok) throw new Error("Error al conectar con GitHub. Verifica tu Token.");
      const fileData = await getRes.json();
      const sha = fileData.sha;

      // 2. Preparar el contenido actualizado
      const contentEncoded = utf8_to_b64(JSON.stringify(newDatabase, null, 4));

      // 3. Enviar la actualización (PUT)
      const putRes = await fetch(getUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Actualización desde Panel Admin",
          content: contentEncoded,
          sha: sha
        })
      });

      if (!putRes.ok) throw new Error("No se pudo guardar en GitHub.");

      setDatabase(newDatabase); // Actualizar estado local
      setSaveMessage({ type: 'success', text: '¡Cambios guardados y publicados con éxito!' });
      setShowModal(false);
      
      // Limpiar mensaje después de 3s
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
      // Editar existente
      updatedDB = database.map(s => (s.id === editingStudent.id ? newStudent : s));
    } else {
      // Crear nuevo (validar duplicados)
      if (database.some(s => s.id === newStudent.id)) {
        setSaveMessage({ type: 'error', text: '¡Ese ID ya existe en la base de datos!' });
        return;
      }
      updatedDB = [...database, newStudent];
    }

    saveToGitHub(updatedDB);
  };

  const handleDelete = (idToDelete) => {
    if (confirm("¿Estás seguro de eliminar este estudiante? Esta acción actualizará la base de datos inmediatamente.")) {
      const updatedDB = database.filter(s => s.id !== idToDelete);
      saveToGitHub(updatedDB);
    }
  };

  // Filtrado de tabla
  const filteredStudents = database.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.includes(searchTerm) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ----------------------------------------------------
  // RENDERIZADO
  // ----------------------------------------------------

  if (viewMode === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 p-4 rounded-full"><Lock className="text-blue-400" size={32} /></div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Acceso Administrativo</h2>
          <p className="text-slate-400 text-center text-sm mb-6">Ingresa tu Token de GitHub para gestionar la base de datos.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
              placeholder="ghp_xxxxxxxxxxxx"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
              Autenticar
            </button>
            <button type="button" onClick={() => setViewMode('student')} className="w-full text-slate-500 text-sm hover:text-white mt-2">
              ← Volver a la plataforma
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
        {/* Admin Header */}
        <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-30">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Database className="text-emerald-400" />
              <h1 className="font-bold text-lg">Panel de Control</h1>
              <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300 hidden sm:block">v2.0 Connected</span>
            </div>
            <button onClick={() => setViewMode('student')} className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>

        {/* Admin Content */}
        <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
          
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, ID o correo..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="text-sm text-slate-500 hidden md:block">
                Total: <b>{database.length}</b> estudiantes
              </div>
              <button 
                onClick={() => { setEditingStudent(null); setShowModal(true); setSaveMessage({type:'', text:''}); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                <Plus size={18} /> Nuevo Estudiante
              </button>
            </div>
          </div>

          {/* Alertas de guardado */}
          {saveMessage.text && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${saveMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
              {saveMessage.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          )}

          {/* Tabla de Datos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-semibold">Estudiante</th>
                    <th className="p-4 font-semibold">Documento</th>
                    <th className="p-4 font-semibold">Plan</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{student.nombre}</div>
                        <div className="text-slate-500 text-xs">{student.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{student.tipoDoc} {student.id}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${student.plan.includes('Premium') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {student.plan}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${student.estado === 'Activo' ? 'text-emerald-600' : 'text-red-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${student.estado === 'Activo' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {student.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { setEditingStudent(student); setShowModal(true); setSaveMessage({type:'', text:''}); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        No se encontraron estudiantes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modal de Edición/Creación */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {editingStudent ? <><Edit size={20} className="text-blue-600"/> Editar Estudiante</> : <><Plus size={20} className="text-blue-600"/> Nuevo Estudiante</>}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="studentForm" onSubmit={handleSaveStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                    <input name="nombre" required defaultValue={editingStudent?.nombre} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 uppercase" placeholder="PEPITO PEREZ" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Doc</label>
                    <select name="tipoDoc" defaultValue={editingStudent?.tipoDoc || "T.I."} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500">
                      <option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número ID</label>
                    <input name="id" required defaultValue={editingStudent?.id} readOnly={!!editingStudent} className={`w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 ${editingStudent ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                    <input name="email" type="email" required defaultValue={editingStudent?.email} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan</label>
                    <select name="plan" defaultValue={editingStudent?.plan || "Plan Básico"} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500">
                      <option>Plan Básico</option><option>Plan Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                    <select name="estado" defaultValue={editingStudent?.estado || "Activo"} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500">
                      <option>Activo</option><option>Revocado</option><option>Pendiente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Pago</label>
                    <input name="fechaPago" defaultValue={editingStudent?.fechaPago} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500" placeholder="Ej: 21/11/2025" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Carpeta Drive</label>
                    <input name="url_carpeta" defaultValue={editingStudent?.url_carpeta} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500" placeholder="https://drive.google.com/..." />
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                <button 
                  type="submit" form="studentForm" disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <><Loader2 className="animate-spin" size={18}/> Guardando...</> : <><Save size={18}/> Guardar Cambios</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDERIZADO MODO ESTUDIANTE (ORIGINAL)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen w-full font-sans text-slate-200 bg-[#0f172a] relative flex flex-col">
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-40 md:opacity-60" style={{ backgroundImage: `url('${ASSETS.fondo}')` }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none"></div>

      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/70 border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={ASSETS.logoSmall} alt="Logo" className="h-8 w-auto object-contain drop-shadow-md" />
            <span className="text-sm md:text-base font-bold tracking-wide text-white/90 uppercase hidden sm:block">Plataforma Estudiantil</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Lock size={10} className="md:w-3 md:h-3" /> CONEXIÓN SEGURA
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        {!studentResult && (
          <div className="w-full max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center animate-fade-in-up">
            <div className="mb-8 md:mb-10 hover:scale-105 transition-transform duration-700 ease-out">
              <img src={ASSETS.logoMain} alt="Seamos Genios Logo" className="w-40 md:w-56 lg:w-64 h-auto mx-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="w-full bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/5 relative overflow-hidden group">
              <div className="relative z-10 text-center mb-6">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Consulta de Credenciales</h1>
              </div>
              <form onSubmit={handleStudentVerify} className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Tipo de Documento</label>
                   <div className="relative group/input">
                      <select name="tipoDoc" value={formData.tipoDoc} onChange={handleInputChange} className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white text-sm appearance-none cursor-pointer">
                        <option>T.I.</option><option>C.C.</option><option>C.E.</option><option>PPT</option><option>OTRO</option>
                      </select>
                      <div className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none"><FileText size={18} /></div>
                   </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 tracking-wider">Número de Identificación</label>
                    <div className="relative group/input">
                        <input type="number" inputMode="numeric" name="numeroDoc" placeholder="Ej: 100200300" className="w-full py-3.5 px-4 pl-11 bg-slate-950/50 border border-slate-700/50 rounded-xl outline-none text-white placeholder:text-slate-600 text-sm font-bold tracking-wider" value={formData.numeroDoc} onChange={handleInputChange} />
                        <div className="absolute left-3.5 top-3.5 text-slate-500"><User size={18} /></div>
                    </div>
                </div>
                <button type="submit" disabled={searchLoading || !formData.numeroDoc} className="w-full py-4 rounded-xl font-bold text-white text-sm uppercase tracking-widest shadow-lg transition-all mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
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
          </div>
        )}

        {/* RESULTADO ESTUDIANTE */}
        {studentResult && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up">
                <button onClick={() => {setStudentResult(null); setFormData({...formData, numeroDoc: ''});}} className="absolute top-4 right-4 z-20 p-2 bg-black/20 rounded-full text-white md:hidden"><X size={20}/></button>
                <div className={`md:w-2/5 p-8 md:p-10 flex flex-col justify-between relative ${studentResult.plan.includes('Premium') ? 'bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#581C87]' : 'bg-gradient-to-br from-[#0f172a] to-[#1e293b]'} text-white`}>
                  <div className="relative z-10 text-center">
                    <div className="inline-flex p-4 bg-white/10 rounded-full mb-6 backdrop-blur-md ring-1 ring-white/20 shadow-xl">
                      {studentResult.plan.includes('Premium') ? <Award size={48} className="text-yellow-300" /> : <CheckCircle size={48} className="text-emerald-300" />}
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Hola, {studentResult.nombre.split(' ')[0]}</h2>
                    <p className="text-white/60 text-sm">Bienvenido a tu espacio</p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/5 text-center mt-8">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1 tracking-wider">Identificación</p>
                    <p className="text-xl font-mono font-medium tracking-widest">{studentResult.id}</p>
                  </div>
                </div>
                <div className="md:w-3/5 p-8 md:p-10 bg-white text-slate-800">
                  <div className="mb-8 pb-6 border-b border-slate-100">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase leading-tight mb-4">{studentResult.nombre}</h3>
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-600">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0"><User size={20} /></div>
                      <div className="text-left">
                        <p className="text-blue-900 text-xs font-bold uppercase tracking-wide">Cuenta de Acceso</p>
                        <p className="text-blue-700 text-sm mt-1">Debes iniciar sesión con: <br/><span className="font-bold text-blue-900 select-all">{studentResult.email}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <a href={studentResult.url_carpeta} target="_blank" rel="noopener noreferrer" className="group bg-white border border-slate-200 hover:border-indigo-500/50 p-6 rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mb-4"><FolderOpen className="text-indigo-600" size={24} /></div>
                      <h4 className="font-bold text-slate-800 text-sm">Material de Estudio</h4>
                    </a>
                    <a href={ASSETS.formsUrl} target="_blank" rel="noopener noreferrer" className="group bg-white border border-slate-200 hover:border-emerald-500/50 p-6 rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mb-4"><FileSignature className="text-emerald-600" size={24} /></div>
                      <h4 className="font-bold text-slate-800 text-sm">Hoja de Respuestas</h4>
                    </a>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-center gap-4">
                     <div className="bg-amber-100 p-3 rounded-full text-amber-600"><Key size={24} /></div>
                     <div className="flex-1"><h4 className="text-amber-900 font-bold text-sm">Contraseña PDF</h4><p className="text-amber-700/80 text-xs">Usa tu número de identificación.</p></div>
                     <button onClick={() => navigator.clipboard.writeText(studentResult.id)} className="bg-white hover:bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg text-amber-700 text-xs font-bold shadow-sm">COPIAR</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER CON ACCESO ADMIN */}
      <footer className="relative z-10 py-6 text-center">
        <button 
          onClick={() => setViewMode('login')} 
          className="text-slate-600 text-[10px] font-medium uppercase tracking-widest hover:text-white transition-colors opacity-40 hover:opacity-100"
        >
          Admin Access • © 2025 SG
        </button>
      </footer>
    </div>
  );
}
