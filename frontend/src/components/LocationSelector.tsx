import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, ChevronRight, X, Search } from 'lucide-react'
import { Country, Admin1, City } from '../services/api'
import { apiService } from '../services/api'

interface LocationSelectorProps {
  countries: Country[]
  admin1s: Admin1[]
  cities: City[]
  selectedCountry: string
  selectedAdmin1: string
  selectedCity: string
  onCountryChange: (countryId: string) => void
  onAdmin1Change: (admin1Id: string) => void
  onCityChange: (cityId: string) => void
  required?: boolean
  compact?: boolean
}

export default function LocationSelector({
  countries,
  admin1s,
  cities,
  selectedCountry,
  selectedAdmin1,
  selectedCity,
  onCountryChange,
  onAdmin1Change,
  onCityChange,
  required = false,
  compact = false
}: LocationSelectorProps) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'country' | 'admin1' | 'city'>('country')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const lastAutoSelectedAdmin1Ref = useRef<string | null>(null)

  // 获取显示文本 - 只显示最下级
  const getDisplayText = () => {
    // 优先显示City
    if (selectedCity && cities.length > 0) {
      const city = cities.find(c => c.id === selectedCity)
      if (city) return city.name
    }

    // 其 visits显示State or region
    if (selectedAdmin1 && admin1s.length > 0) {
      const admin1 = admin1s.find(a => a.id === selectedAdmin1)
      if (admin1) return admin1.name
    }

    // 最后显示国家
    if (selectedCountry) {
      const country = countries.find(c => c.id === selectedCountry)
      if (country) return country.name
    }

    return ''
  }

  const handleCountrySelect = (countryId: string) => {
    onCountryChange(countryId)
    setStep('admin1')
  }

  const handleAdmin1Select = async (admin1Id: string) => {
    onAdmin1Change(admin1Id)
    setStep('city')
  }

  // 监听 cities 变化，如果只有一个City且是直辖市，自动选择
  useEffect(() => {
    if (
      step === 'city' &&
      cities.length === 1 &&
      cities[0].isMunicipality &&
      selectedAdmin1 &&
      lastAutoSelectedAdmin1Ref.current !== selectedAdmin1
    ) {
      const municipality = cities[0]
      lastAutoSelectedAdmin1Ref.current = selectedAdmin1

      setTimeout(() => {
        onCityChange(municipality.id)
        setShowModal(false)
        setStep('country')
      }, 150)
    }
  }, [cities, step, selectedAdmin1, onCityChange])

  const handleCitySelect = (cityId: string) => {
    onCityChange(cityId)
    setShowModal(false)
    setStep('country')
  }

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowModal(false)
    setStep('country')
    setSearchQuery('')
  }

  const handleOpen = () => {
    setShowModal(true)
    setSearchQuery('')
    if (selectedCity) {
      setStep('city')
    } else if (selectedAdmin1) {
      setStep('admin1')
    } else {
      setStep('country')
    }
  }

  interface SearchResult {
    type: 'country' | 'admin1' | 'city'
    id: string
    name: string
    fullPath: string
    country?: { id: string; name: string }
    admin1?: { id: string; name: string }
  }

  const handleSearchResultClick = async (result: SearchResult) => {
    if (result.type === 'country') {
      onCountryChange(result.id)
      setShowModal(false)
      setStep('country')
      setSearchQuery('')
    } else if (result.type === 'admin1' && result.country) {
      onCountryChange(result.country.id)
      setTimeout(() => {
        onAdmin1Change(result.id)
        setShowModal(false)
        setStep('country')
        setSearchQuery('')
      }, 500)
    } else if (result.type === 'city' && result.country) {
      onCountryChange(result.country.id)
      if (result.admin1) {
        setTimeout(() => {
          onAdmin1Change(result.admin1!.id)
          setTimeout(() => {
            onCityChange(result.id)
            setShowModal(false)
            setStep('country')
            setSearchQuery('')
          }, 500)
        }, 500)
      } else {
        setTimeout(() => {
          onCityChange(result.id)
          setShowModal(false)
          setStep('country')
          setSearchQuery('')
        }, 500)
      }
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const searchTimer = setTimeout(async () => {
      try {
        const results = await apiService.searchLocations(searchQuery.trim())
        setSearchResults(results)
      } catch (error) {
        console.error('搜索失败:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(searchTimer)
  }, [searchQuery])

  const getFilteredCountries = () => {
    if (!searchQuery.trim()) return countries
    const query = searchQuery.toLowerCase().trim()
    return countries.filter(c => c.name.toLowerCase().includes(query))
  }

  const getFilteredAdmin1s = () => {
    if (!searchQuery.trim()) return admin1s
    const query = searchQuery.toLowerCase().trim()
    return admin1s.filter(a => a.name.toLowerCase().includes(query))
  }

  const getFilteredCities = () => {
    if (!searchQuery.trim()) return cities
    const query = searchQuery.toLowerCase().trim()
    return cities.filter(c => c.name.toLowerCase().includes(query))
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/90 hover:bg-white/20 transition-all active:scale-95"
        >
          <MapPin className="h-3 w-3 text-pink-400" />
          <span className="text-[11px] font-bold tracking-wider max-w-[100px] truncate">
            {getDisplayText() || 'Choose a location'}
          </span>
        </button>
      ) : (
        <div className="location-section">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-[#8E8E93] mb-2">
            <MapPin className="h-4 w-4 mr-1 text-pink-500 dark:text-pink-400" />
            Location {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button
            type="button"
            onClick={handleOpen}
            className="w-full px-4 py-3 border border-gray-300 dark:border-[#38383A] rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-[#2C2C2E] text-gray-800 dark:text-white flex items-center justify-between"
          >
            <span className={getDisplayText() ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-[#8E8E93]'}>
              {getDisplayText() || '请Choose a location'}
            </span>
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-[#8E8E93]" />
          </button>
        </div>
      )}

      {showModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center animate-fadeIn pointer-events-auto"
          style={{ zIndex: 20000 }}
          onClick={handleClose}
        >
          <div
            className="bg-white dark:bg-[#1C1C1E] rounded-t-3xl w-full max-w-lg max-h-[80vh] flex flex-col animate-slideUp border-t border-white/20 dark:border-[#38383A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#38383A]">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Choose a location</h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-3 -m-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors pointer-events-auto"
              >
                <X className="h-6 w-6 text-gray-500 dark:text-[#8E8E93]" />
              </button>
            </div>

            <div className="flex items-center space-x-2 px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-[#38383A] min-h-[52px]">
              <button
                onClick={() => setStep('country')}
                className={`text-sm ${step === 'country' ? 'text-pink-500 dark:text-pink-400 font-medium' : 'text-gray-600 dark:text-[#8E8E93]'}`}
              >
                Country or region
              </button>
              {selectedCountry && admin1s.length > 0 && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-[#8E8E93] flex-shrink-0" />
                  <button
                    onClick={() => setStep('admin1')}
                    className={`text-sm ${step === 'admin1' ? 'text-pink-500 dark:text-pink-400 font-medium' : 'text-gray-600 dark:text-[#8E8E93]'}`}
                  >
                    State or region
                  </button>
                </>
              )}
              {selectedAdmin1 && cities.length > 0 && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-[#8E8E93] flex-shrink-0" />
                  <button
                    onClick={() => setStep('city')}
                    className={`text-sm ${step === 'city' ? 'text-pink-500 dark:text-pink-400 font-medium' : 'text-gray-600 dark:text-[#8E8E93]'}`}
                  >
                    City
                  </button>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#38383A]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#8E8E93]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countries, regions, or cities..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#38383A] rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {searchQuery.trim() ? (
                isSearching ? (
                  <div className="px-4 py-8 text-center">
                    <div className="loading-spinner mx-auto mb-2"></div>
                    <p className="text-gray-500 dark:text-[#8E8E93]">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-[#38383A]">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id || index}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-gray-800 dark:text-white font-medium">{result.name}</span>
                          <span className="text-xs text-gray-500 dark:text-[#8E8E93] mt-1">{result.fullPath}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-gray-500 dark:text-[#8E8E93]">No matching results</p>
                  </div>
                )
              ) : (
                <>
                  {step === 'country' && (
                    <div className="divide-y divide-gray-100 dark:divide-[#38383A]">
                      {getFilteredCountries().map(country => (
                        <button
                          key={country.id}
                          onClick={() => handleCountrySelect(country.id)}
                          className={`w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors flex items-center justify-between ${selectedCountry === country.id ? 'bg-pink-50 dark:bg-pink-900/30' : ''}`}
                        >
                          <span className={selectedCountry === country.id ? 'text-pink-600 dark:text-pink-400 font-medium' : 'text-gray-800 dark:text-white'}>
                            {country.name}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-[#8E8E93]" />
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 'admin1' && (
                    <div className="divide-y divide-gray-100 dark:divide-[#38383A]">
                      {getFilteredAdmin1s().map(admin1 => (
                        <button
                          key={admin1.id}
                          onClick={() => handleAdmin1Select(admin1.id)}
                          className={`w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors flex items-center justify-between ${selectedAdmin1 === admin1.id ? 'bg-pink-50 dark:bg-pink-900/30' : ''}`}
                        >
                          <span className={selectedAdmin1 === admin1.id ? 'text-pink-600 dark:text-pink-400 font-medium' : 'text-gray-800 dark:text-white'}>
                            {admin1.name}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-[#8E8E93]" />
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 'city' && (
                    <div className="divide-y divide-gray-100 dark:divide-[#38383A]">
                      {getFilteredCities().map(city => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city.id)}
                          className={`w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors ${selectedCity === city.id ? 'bg-pink-50 dark:bg-pink-900/30' : ''}`}
                        >
                          <span className={selectedCity === city.id ? 'text-pink-600 dark:text-pink-400 font-medium' : 'text-gray-800 dark:text-white'}>
                            {city.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
