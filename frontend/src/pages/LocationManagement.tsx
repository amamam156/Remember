import { useState, useEffect } from 'react'
import { Plus, CheckCircle, AlertCircle, Search, Trash2, Edit2, X, MapPin, ChevronRight, Map, Building2, ChevronLeft } from 'lucide-react'
import { api } from '../services/api'
import { useGeoData } from '../hooks/useGeoData'
import { useNavigate } from 'react-router-dom'

type ViewLevel = 'countries' | 'admin1s' | 'cities';

export default function LocationManagement() {
  const { countries, loadCountries } = useGeoData()
  const navigate = useNavigate()
  
  // 层级导航状态
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('countries')
  const [selectedCountry, setSelectedCountry] = useState<any>(null)
  const [selectedAdmin1, setSelectedAdmin1] = useState<any>(null)
  
  // 列表数据
  const [admin1s, setAdmin1s] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  
  // 搜索与弹窗
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<ViewLevel>('countries')
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    iso2: '',
    latitude: '',
    longitude: '',
    isMunicipality: false
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadCountries()
  }, [loadCountries])

  // 加载子级数据
  useEffect(() => {
    if (selectedCountry) {
      api.getAdmin1s(selectedCountry.id).then(setAdmin1s).catch(console.error)
      api.getCities(selectedCountry.id).then(setCities).catch(console.error)
    }
  }, [selectedCountry])

  useEffect(() => {
    if (selectedAdmin1) {
      api.getCities(selectedCountry.id, selectedAdmin1.id).then(setCities).catch(console.error)
    }
  }, [selectedAdmin1, selectedCountry])

  // 搜索逻辑
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchLocations(searchQuery)
        setSearchResults(results)
      } catch (err) {
        console.error('搜索失败:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const resetForm = () => {
    setFormData({
      name: '',
      iso2: '',
      latitude: '',
      longitude: '',
      isMunicipality: false
    })
    setEditingItem(null)
    setIsEditing(false)
  }

  const openAddModal = (level: ViewLevel) => {
    resetForm()
    setModalType(level)
    setIsEditing(false)
    setShowModal(true)
  }

  const openEditModal = (item: any, level: ViewLevel) => {
    setModalType(level)
    setIsEditing(true)
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      iso2: item.iso2 || '',
      latitude: item.latitude?.toString() || '',
      longitude: item.longitude?.toString() || '',
      isMunicipality: item.isMunicipality || false
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      }

      if (modalType === 'countries') {
        if (isEditing) await api.updateCountry(editingItem.id, data)
        else await api.createCountry(data)
      } else if (modalType === 'admin1s') {
        const payload = { ...data, countryId: selectedCountry.id }
        if (isEditing) await api.updateAdmin1(editingItem.id, payload)
        else await api.createAdmin1(payload)
      } else {
        const payload = { 
          ...data, 
          countryId: selectedCountry.id, 
          admin1Id: selectedAdmin1?.id || undefined 
        }
        if (isEditing) await api.updateCity(editingItem.id, payload)
        else await api.createCity(payload)
      }

      setMessage({ type: 'success', text: isEditing ? 'Updated successfully' : 'Created successfully' })
      setShowModal(false)
      refreshData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'The operation failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, type: ViewLevel) => {
    if (!window.confirm('确定要删除吗？这将无法撤销。')) return
    setLoading(true)
    try {
      if (type === 'countries') await api.deleteCountry(id)
      else if (type === 'admin1s') await api.deleteAdmin1(id)
      else await api.deleteCity(id)
      setMessage({ type: 'success', text: 'Deleted successfully' })
      refreshData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Unable to delete' })
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    loadCountries()
    if (selectedCountry) {
      api.getAdmin1s(selectedCountry.id).then(setAdmin1s)
      api.getCities(selectedCountry.id, selectedAdmin1?.id).then(setCities)
    }
  }

  const navigateToCountry = (country: any) => {
    setSelectedCountry(country)
    setSelectedAdmin1(null)
    setCurrentLevel('admin1s')
  }

  const navigateToAdmin1 = (admin1: any) => {
    setSelectedAdmin1(admin1)
    setCurrentLevel('cities')
  }

  const goBack = () => {
    if (currentLevel === 'cities') {
      setCurrentLevel('admin1s')
      setSelectedAdmin1(null)
    } else if (currentLevel === 'admin1s') {
      setCurrentLevel('countries')
      setSelectedCountry(null)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex flex-col h-screen h-[100dvh] overflow-hidden bg-gray-50 dark:bg-black touch-none">
      {/* 沉浸式顶部导航栏 - 禁止手势以防止整页滚动 */}
      <header className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 z-30 pt-[env(safe-area-inset-top,40px)] px-6 pb-6 shadow-sm flex-shrink-0 touch-none overscroll-none">
        <div className="flex justify-between items-center py-2 mb-6 pointer-events-auto">
          <button 
            onClick={goBack}
            className="w-[44px] h-[44px] bg-gray-200/50 dark:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-gray-300/30 dark:border-white/10 text-gray-700 dark:text-white shadow-sm active:scale-90 transition-transform"
          >
            <ChevronLeft className="h-6 w-6 ml-[-2px]" />
          </button>
          
          <button 
            onClick={() => openAddModal(currentLevel)}
            className="w-[44px] h-[44px] bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Locations</h1>
          
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-gray-400 dark:text-white/30 mt-1 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button 
              onClick={() => { setCurrentLevel('countries'); setSelectedCountry(null); setSelectedAdmin1(null); }}
              className={`hover:text-pink-500 transition-colors ${currentLevel === 'countries' ? 'text-pink-500' : ''}`}
            >
              World
            </button>
            {selectedCountry && (
              <>
                <ChevronRight className="h-2.5 w-2.5 opacity-30" />
                <button 
                  onClick={() => { setCurrentLevel('admin1s'); setSelectedAdmin1(null); }}
                  className={`hover:text-pink-500 transition-colors ${currentLevel === 'admin1s' ? 'text-pink-500' : ''}`}
                >
                  {selectedCountry.name}
                </button>
              </>
            )}
            {selectedAdmin1 && (
              <>
                <ChevronRight className="h-2.5 w-2.5 opacity-30" />
                <span className="text-pink-500">{selectedAdmin1.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 pointer-events-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${selectedAdmin1?.name || selectedCountry?.name || 'World'}...`}
              className="w-full pl-11 pr-4 py-3 bg-gray-100/80 dark:bg-white/5 border-none rounded-2xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-white/20"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-40 w-full mt-2 bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden max-h-[60vh] overflow-y-auto backdrop-blur-xl">
                {searchResults.map(item => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (item.type === 'country') navigateToCountry(item)
                      else if (item.type === 'admin1') { setSelectedCountry(item.country); navigateToAdmin1(item); }
                      else if (item.type === 'city') { 
                        setSelectedCountry(item.country); 
                        if (item.admin1) setSelectedAdmin1(item.admin1);
                        setCurrentLevel('cities');
                      }
                      setSearchQuery('');
                    }}
                    className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group border-b border-gray-50 dark:border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 dark:text-white/40 group-hover:bg-pink-500/10 group-hover:text-pink-500 transition-all overflow-hidden">
                        {item.country?.iso2 ? (
                          <img 
                            src={`/flag/${item.country.iso2.toLowerCase()}.png`} 
                            alt="" 
                            className="w-7 h-5 object-cover rounded-sm shadow-sm border border-black/5 dark:border-white/10"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              // Fallback would show the background/empty space or I could append an icon
                            }}
                          />
                        ) : (
                          <MapPin className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-50">{item.country?.name} {item.admin1?.name && `· ${item.admin1.name}`}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 滚动列表区域 - 仅此处允许垂直滚动 */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-10 touch-pan-y overscroll-contain">
        <div className="space-y-4 max-w-2xl mx-auto">
          {currentLevel === 'countries' && countries.map(c => (
            <LocationItem 
              key={c.id} 
              icon={
                <img 
                  src={`/flag/${c.iso2.toLowerCase()}.png`} 
                  alt={c.name}
                  className="w-10 h-7 object-cover rounded shadow-sm border border-black/5 dark:border-white/10"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    // Show a fallback globe if image fails
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-globe')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-globe text-gray-400';
                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              }
              title={c.name}
              subtitle=""
              onClick={() => navigateToCountry(c)}
              onEdit={() => openEditModal(c, 'countries')}
              onDelete={() => handleDelete(c.id, 'countries')}
            />
          ))}

          {currentLevel === 'admin1s' && admin1s.map(a => (
            <LocationItem 
              key={a.id} 
              icon={<Map className="h-5 w-5 text-green-500" />}
              title={a.name}
              subtitle=""
              onClick={() => navigateToAdmin1(a)}
              onEdit={() => openEditModal(a, 'admin1s')}
              onDelete={() => handleDelete(a.id, 'admin1s')}
            />
          ))}

          {currentLevel === 'cities' && cities.map(city => (
            <LocationItem 
              key={city.id} 
              icon={<Building2 className="h-5 w-5 text-pink-500" />}
              title={city.name}
              subtitle=""
              onEdit={() => openEditModal(city, 'cities')}
              onDelete={() => handleDelete(city.id, 'cities')}
            />
          ))}

          {((currentLevel === 'admin1s' && admin1s.length === 0) || (currentLevel === 'cities' && cities.length === 0)) && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-30 animate-in fade-in duration-700">
              <MapPin className="h-16 w-16 mb-4 stroke-[1px]" />
              <div className="text-xs uppercase tracking-[0.2em] font-black">No places at this level</div>
            </div>
          )}
        </div>
      </main>

      {/* 底部浮动消息 */}
      {message && (
        <div className={`fixed bottom-24 left-4 right-4 p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-6 duration-500 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <span className="text-sm font-black uppercase tracking-wider">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-5 w-5" /></button>
        </div>
      )}

      {/* 弹窗部分 - 弹窗内允许滚动 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md touch-none">
          <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-500 shadow-2xl border border-white/5 touch-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-pink-500">{isEditing ? 'MODIFY' : 'CREATE'}</span>
                <h3 className="text-2xl font-black dark:text-white">
                  {modalType === 'countries' ? '国家' : modalType === 'admin1s' ? 'State or region' : 'City'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-all">
                <X className="h-6 w-6 text-gray-500 dark:text-white/40" />
              </button>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar overscroll-contain">
              <FormInput label="Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="Enter a place name" required />
              
              {modalType === 'countries' && (
                <FormInput label="ISO2 (Code)" value={formData.iso2} onChange={v => setFormData({...formData, iso2: v.toUpperCase()})} placeholder="CN" maxLength={2} required />
              )}


              {modalType === 'cities' && (
                <button 
                  onClick={() => setFormData({...formData, isMunicipality: !formData.isMunicipality})}
                  className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all border-2 ${
                    formData.isMunicipality 
                      ? 'bg-pink-500/10 border-pink-500/50 text-pink-500' 
                      : 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-500 dark:text-white/40'
                  }`}
                >
                  <span className="text-sm font-black uppercase tracking-widest">Mark as a municipality</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${formData.isMunicipality ? 'bg-pink-500 text-white' : 'bg-gray-300 dark:bg-white/10'}`}>
                    {formData.isMunicipality && <CheckCircle className="h-4 w-4" />}
                  </div>
                </button>
              )}

              <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                <div className="text-[10px] font-black text-gray-400 dark:text-white/20 mb-4 uppercase tracking-[0.2em]">Coordinates</div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Latitude (LAT)" value={formData.latitude} onChange={v => setFormData({...formData, latitude: v})} placeholder="0.00" type="number" />
                  <FormInput label="Longitude (LNG)" value={formData.longitude} onChange={v => setFormData({...formData, longitude: v})} placeholder="0.00" type="number" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name}
              className="w-full mt-10 py-5 bg-pink-500 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-pink-500/40 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? <div className="loading-spinner border-white" /> : (isEditing ? <Edit2 className="h-5 w-5" /> : <Plus className="h-6 w-6" />)}
              <span className="uppercase tracking-widest">{isEditing ? 'Save Changes' : 'Confirm Create'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LocationItem({ icon, title, subtitle, onClick, onEdit, onDelete }: { icon: React.ReactNode, title: string, subtitle: string, onClick?: () => void, onEdit: () => void, onDelete: () => void }) {
  return (
    <div 
      className="flex items-center gap-5 p-5 bg-white dark:bg-white/5 rounded-[2rem] group shadow-sm active:scale-[0.97] transition-all cursor-pointer border border-transparent dark:border-white/5 hover:border-pink-500/30" 
      onClick={onClick}
    >
      <div className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-pink-500/10 group-hover:text-pink-500 transition-all duration-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-black text-gray-900 dark:text-white truncate tracking-tight">{title}</div>
        <div className="text-[10px] text-gray-400 dark:text-white/30 font-black uppercase tracking-[0.15em] mt-0.5 truncate">{subtitle}</div>
      </div>
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={onEdit} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-xl transition-all">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
          <Trash2 className="h-4 w-4" />
        </button>
        {onClick && <ChevronRight className="h-5 w-5 text-gray-300 ml-1 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
      </div>
    </div>
  )
}

function FormInput({ label, value, onChange, placeholder, type = 'text', maxLength, required }: { label: string, value: any, onChange: (v: string) => void, placeholder?: string, type?: string, maxLength?: number, required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 dark:text-white/20 ml-2 uppercase tracking-[0.2em]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-6 py-4 bg-gray-100 dark:bg-white/5 border-2 border-transparent focus:border-pink-500/30 rounded-3xl text-sm font-bold text-gray-900 dark:text-white focus:ring-0 transition-all placeholder:text-gray-400 dark:placeholder:text-white/10"
      />
    </div>
  )
}
