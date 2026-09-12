import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { api, Admin1 } from '../services/api'
import { useGeoData } from '../hooks/useGeoData'

interface LocationManagerProps {
  show: boolean
  onClose: () => void
  onLocationAdded?: () => void
}

export default function LocationManager({ show, onClose, onLocationAdded }: LocationManagerProps) {
  const { countries, loadCountries } = useGeoData()
  const [activeTab, setActiveTab] = useState<'country' | 'admin1' | 'city'>('city')
  
  // 国家表单
  const [countryForm, setCountryForm] = useState({
    iso2: '',
    name: ''
  })
  
  // 省份表单
  const [selectedCountryForAdmin1, setSelectedCountryForAdmin1] = useState('')
  const [admin1Form, setAdmin1Form] = useState({
    name: ''
  })
  
  // City表单
  const [selectedCountryForCity, setSelectedCountryForCity] = useState('')
  const [selectedAdmin1ForCity, setSelectedAdmin1ForCity] = useState('')
  const [cityForm, setCityForm] = useState({
    name: '',
    isMunicipality: false
  })
  
  // 状态
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [admin1s, setAdmin1s] = useState<Admin1[]>([])
  
  // 加载国家列表
  useEffect(() => {
    if (show) {
      loadCountries()
    }
  }, [show, loadCountries])
  
  // 当选择国家时，加载省份列表
  useEffect(() => {
    if (selectedCountryForAdmin1) {
      loadAdmin1sForManager(selectedCountryForAdmin1)
    } else {
      setAdmin1s([])
    }
  }, [selectedCountryForAdmin1])
  
  useEffect(() => {
    if (selectedCountryForCity) {
      loadAdmin1sForManager(selectedCountryForCity)
    } else {
      setAdmin1s([])
    }
  }, [selectedCountryForCity])
  
  const loadAdmin1sForManager = async (countryId: string) => {
    try {
      const data = await api.getAdmin1s(countryId)
      setAdmin1s(data)
    } catch (error) {
      console.error('加载省份列表失败:', error)
    }
  }
  
  const handleCreateCountry = async () => {
    if (!countryForm.iso2 || !countryForm.name) {
      setMessage({ type: 'error', text: '请填写ISO2Code和国家Name' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      await api.createCountry({
        iso2: countryForm.iso2.toUpperCase(),
        name: countryForm.name
      })
      
      setMessage({ type: 'success', text: '国家创建成功！' })
      setCountryForm({ iso2: '', name: '' })
      loadCountries()
      onLocationAdded?.()
      
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      let errorMessage = '创建国家失败'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateAdmin1 = async () => {
    if (!selectedCountryForAdmin1 || !admin1Form.name) {
      setMessage({ type: 'error', text: 'Choose a country并填写Name' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      await api.createAdmin1({
        countryId: selectedCountryForAdmin1,
        name: admin1Form.name
      })
      
      setMessage({ type: 'success', text: 'State or region/地区创建成功！' })
      setAdmin1Form({ name: '' })
      loadAdmin1sForManager(selectedCountryForAdmin1)
      onLocationAdded?.()
      
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      let errorMessage = '创建State or region/地区失败'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateCity = async () => {
    if (!selectedCountryForCity || !cityForm.name) {
      setMessage({ type: 'error', text: 'Choose a country并填写CityName' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      await api.createCity({
        countryId: selectedCountryForCity,
        admin1Id: selectedAdmin1ForCity || undefined,
        name: cityForm.name,
        isMunicipality: cityForm.isMunicipality
      })
      
      setMessage({ type: 'success', text: 'City创建成功！' })
      setCityForm({ name: '', isMunicipality: false })
      setSelectedAdmin1ForCity('')
      onLocationAdded?.()
      
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      let errorMessage = '创建City失败'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }
  
  if (!show) return null
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-[#38383A] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add a location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-[#8E8E93]" />
          </button>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b border-gray-200 dark:border-[#38383A]">
          <button
            onClick={() => setActiveTab('city')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'city'
                ? 'text-pink-500 border-b-2 border-pink-500'
                : 'text-gray-500 dark:text-[#8E8E93] hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            Add city
          </button>
          <button
            onClick={() => setActiveTab('admin1')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'admin1'
                ? 'text-pink-500 border-b-2 border-pink-500'
                : 'text-gray-500 dark:text-[#8E8E93] hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            Add state or region
          </button>
          <button
            onClick={() => setActiveTab('country')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'country'
                ? 'text-pink-500 border-b-2 border-pink-500'
                : 'text-gray-500 dark:text-[#8E8E93] hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            Add country
          </button>
        </div>
        
        {/* 消息提示 */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="p-6">
          {/* 添加City */}
          {activeTab === 'city' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCountryForCity}
                  onChange={(e) => {
                    setSelectedCountryForCity(e.target.value)
                    setSelectedAdmin1ForCity('')
                  }}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Choose a country</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
              
              {selectedCountryForCity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
                    State or region
                  </label>
                  <select
                    value={selectedAdmin1ForCity}
                    onChange={(e) => setSelectedAdmin1ForCity(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">No state or region (optional)</option>
                    {admin1s.map(admin1 => (
                      <option key={admin1.id} value={admin1.id}>{admin1.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
                  CityName <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="For example: Seattle"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cityForm.isMunicipality}
                  onChange={(e) => setCityForm({ ...cityForm, isMunicipality: e.target.checked })}
                  className="w-4 h-4 text-pink-500 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700 dark:text-[#8E8E93]">Municipality</span>
              </label>
              
              <button
                onClick={handleCreateCity}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Create city</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* 添加State or region */}
          {activeTab === 'admin1' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCountryForAdmin1}
                  onChange={(e) => {
                    setSelectedCountryForAdmin1(e.target.value)
                    setAdmin1s([])
                  }}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Choose a country</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Code字段已移除 */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={admin1Form.name}
                  onChange={(e) => setAdmin1Form({ ...admin1Form, name: e.target.value })}
                  placeholder="For example: California"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              {/* 地图ID字段已移除 */}
              
              <button
                onClick={handleCreateAdmin1}
                disabled={loading || !selectedCountryForAdmin1}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>创建中...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Create state or region</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* 添加国家 */}
          {activeTab === 'country' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
                  ISO2Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={countryForm.iso2}
                  onChange={(e) => setCountryForm({ ...countryForm, iso2: e.target.value.toUpperCase() })}
                  placeholder="CN"
                  maxLength={2}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              {/* ISO3字段已移除 */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
                  Country name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={countryForm.name}
                  onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                  placeholder="For example: Canada"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <button
                onClick={handleCreateCountry}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>创建中...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Create country</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
