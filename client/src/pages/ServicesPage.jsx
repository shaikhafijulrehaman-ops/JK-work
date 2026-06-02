import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { 
  Search, 
  MapPin, 
  Clock, 
  Sparkles,
  ShoppingBag,
  Info,
  CheckCircle,
  X,
  Brush,
  Activity,
  Wrench,
  ChefHat,
  Truck,
  Paintbrush
} from 'lucide-react';
import { catalog as staticCatalog } from '../store/catalog';

export default function ServicesPage() {
  const { addItem, items } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success) {
          // Filter only active services
          const activeServices = data.services.filter(s => s.isActive !== false);
          setCatalog(activeServices);
        } else {
          setCatalog(staticCatalog);
        }
      } catch (err) {
        console.warn('Backend services offline. Falling back to static catalog...', err);
        setCatalog(staticCatalog);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Selected Category filter
  const initialCategory = searchParams.get('category') || '';
  const searchWord = searchParams.get('search') || '';

  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(searchWord);
  const [selectedService, setSelectedService] = useState(null); // Detail modal state
  
  // Custom option for painting
  const [paintingVariant, setPaintingVariant] = useState('2BHK');

  // Filtering Logic
  const filtered = catalog.filter(s => {
    const matchesCat = categoryFilter ? s.category === categoryFilter : true;
    const matchesQuery = searchQuery 
      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCat && matchesQuery;
  });

  const uniqueCategories = [
    { id: '', name: 'All Services', icon: Sparkles },
    { id: 'Cleaning', name: 'Cleaning & Pest', icon: Brush },
    { id: 'Care', name: 'Baby Care & Safety', icon: Activity },
    { id: 'Technical', name: 'Repairs & Technical', icon: Wrench },
    { id: 'Cooking', name: 'Cooking & Chef', icon: ChefHat },
    { id: 'Shifting', name: 'Relocation Shifting', icon: Truck },
    { id: 'Painting', name: 'House Painting', icon: Paintbrush }
  ];

  const getVariantPrice = (service) => {
    if (service.name === 'House Painting') {
      return paintingVariant === '3BHK' ? 23499.0 : 20099.0;
    }
    return service.price;
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-inter py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div>
            <h1 className="font-poppins font-black text-3xl text-slate-800 tracking-tight">Our Service Catalog</h1>
            <p className="text-xs text-slate-500 mt-1">Book verified, certified experts dispatched directly from Anchepalya</p>
          </div>
          
          {/* Autocomplete Search input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search services..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs focus:border-brand transition-colors shadow-sm font-medium"
            />
          </div>
        </div>

        {/* Cohesive Premium Category Chips Bar (replacing cartoonish buttons) */}
        <div className="flex overflow-x-auto flex-nowrap sm:flex-wrap gap-2 mb-8 pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
          {uniqueCategories.map((cat, idx) => {
            const Icon = cat.icon || Sparkles;
            return (
              <button
                key={idx}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-4 py-2.5 rounded-full font-poppins font-bold text-xs shadow-xs hover:shadow-sm transition-all duration-300 flex items-center space-x-2 border flex-shrink-0 ${
                  categoryFilter === cat.id 
                    ? 'bg-brand text-white border-brand shadow-brand/10' 
                    : 'bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${categoryFilter === cat.id ? 'text-white' : 'text-brand'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Grid List with elegant card design & subtle shadows */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-20 text-slate-400 font-medium">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Fetching premium home services...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400 font-medium">
              No matching services found in our catalog. Try searching another package.
            </div>
          ) : (
            filtered.map((s) => {
              return (
                <div 
                  key={s.id}
                  className="bg-white border border-slate-100 hover:border-brand/35 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group h-full"
                >
                  <div>
                    {/* Image banner with gradient overlay - responsive height for clean mobile high-density grids */}
                    <div className="h-16 sm:h-32 md:h-48 w-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
                      {s.imageUrl ? (
                        <img 
                          src={s.imageUrl} 
                          alt={s.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentNode.querySelector('.image-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          className="w-full h-full object-cover transform group-hover:scale-103 transition-transform duration-500"
                        />
                      ) : null}
                      <div 
                        className="image-fallback absolute inset-0 flex items-center justify-center bg-slate-100 text-[10px] sm:text-xs font-semibold text-slate-400"
                        style={{ display: s.imageUrl ? 'none' : 'flex' }}
                      >
                        Image Not Available
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                      
                      {s.packageText && (
                        <span className="absolute top-1 left-1 sm:top-3 sm:left-3 bg-brand/90 backdrop-blur-xs text-white font-poppins font-black text-[5px] sm:text-[7px] md:text-[9px] px-1 py-0.2 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 rounded-sm sm:rounded-lg uppercase tracking-wider shadow-sm">
                          {s.packageText}
                        </span>
                      )}
                    </div>

                    {/* Body Content */}
                    <div className="p-1.5 sm:p-3 md:p-5 text-left space-y-1 sm:space-y-1.5 md:space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-1">
                        <span className="text-[5.5px] sm:text-[8px] md:text-[10px] text-brand font-bold uppercase tracking-wider bg-cyan-50 border border-cyan-100 rounded-full px-1 py-0.2 sm:px-2 sm:py-0.5 md:px-2.5 md:py-0.5 leading-none w-max">
                          {s.category}
                        </span>
                        {s.durationText && (
                          <span className="flex items-center text-[5.5px] sm:text-[8px] md:text-[10px] text-slate-400 font-medium">
                            <Clock className="w-2 h-2 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 mr-0.5 sm:mr-1 text-slate-300" /> {s.durationText}
                          </span>
                        )}
                      </div>
                      <h3 className="font-poppins font-extrabold text-[8px] sm:text-xs md:text-sm lg:text-base text-slate-800 leading-tight line-clamp-1 sm:line-clamp-none">
                        {s.name}
                      </h3>
                      <p className="hidden md:block text-xs text-slate-500 leading-relaxed font-normal">
                        {s.description || s.desc}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & Cart Action Box */}
                  <div className="p-1.5 sm:p-3 md:px-5 md:pb-5 border-t border-slate-50 pt-1.5 sm:pt-3 flex flex-col space-y-1 sm:space-y-2 md:space-y-3">
                    
                    {/* Custom Option selection for House Painting */}
                    {s.name === 'House Painting' && (
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-0.5 sm:p-1 md:p-1.5 text-[5.5px] sm:text-[8px] md:text-[10px] font-semibold text-slate-600 mb-0.5 sm:mb-1 gap-0.5">
                        <span className="hidden sm:inline">Size:</span>
                        <div className="flex space-x-0.5 sm:space-x-1">
                          <button 
                            onClick={() => setPaintingVariant('2BHK')}
                            className={`px-1 py-0.2 sm:px-1.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-md transition-all text-[5.5px] sm:text-[7.5px] md:text-[9px] ${paintingVariant === '2BHK' ? 'bg-brand text-white font-black' : 'bg-transparent text-slate-500'}`}
                          >
                            2BHK
                          </button>
                          <button 
                            onClick={() => setPaintingVariant('3BHK')}
                            className={`px-1 py-0.2 sm:px-1.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-md transition-all text-[5.5px] sm:text-[7.5px] md:text-[9px] ${paintingVariant === '3BHK' ? 'bg-brand text-white font-black' : 'bg-transparent text-slate-500'}`}
                          >
                            3BHK
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[5.5px] sm:text-[8px] md:text-[10px] font-medium text-slate-400">Starting At</span>
                        <span className="font-poppins font-black text-[8px] sm:text-xs md:text-sm lg:text-base text-brand mt-0.5">
                          Rs. {getVariantPrice(s).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex space-x-0.5 sm:space-x-1.5 md:space-x-2">
                        <button 
                          onClick={() => setSelectedService(s)}
                          className="p-0.5 sm:p-1.5 md:p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition-colors flex items-center justify-center flex-shrink-0"
                          title="View inclusions list"
                        >
                          <Info className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => {
                            if (!isAuthenticated) {
                              const { setShowLoginModal } = useAuthStore.getState();
                              setShowLoginModal(true);
                            } else {
                              navigate(`/book?serviceId=${s.id}${s.name === 'House Painting' ? `&variant=${paintingVariant}` : ''}`);
                            }
                          }}
                          className="bg-brand hover:bg-brand-dark text-white font-poppins font-black text-[7px] sm:text-xs px-1 py-1 sm:px-5 sm:py-2.5 rounded-lg shadow-md shadow-brand/10 transition-all uppercase tracking-wider flex items-center justify-center space-x-0.5 sm:space-x-1"
                        >
                          <ShoppingBag className="w-2 h-2 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                          <span className="hidden sm:inline">Book Now</span>
                          <span className="sm:hidden">Book</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ==================== DETAILED INCLUSIONS MODAL ==================== */}
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto relative animate-scale-up">
              <button 
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4 pr-6">
                <h3 className="font-poppins font-extrabold text-lg text-slate-800 leading-tight">
                  {selectedService.name}
                </h3>
                <span className="inline-block text-[10px] font-black text-brand uppercase tracking-wider bg-cyan-50 border border-cyan-100 rounded-full px-2.5 py-1 leading-none mt-2">
                  {selectedService.category}
                </span>
              </div>

              <div className="border-t border-slate-100 py-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Service Description</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{selectedService.description || selectedService.desc}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center"><Sparkles className="w-4 h-4 text-brand mr-1" /> What's Included:</h4>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {selectedService.details ? selectedService.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start font-medium">
                        <CheckCircle className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    )) : (
                      <>
                        <li className="flex items-start font-medium">
                          <CheckCircle className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <span>Double-vetted trained professionals</span>
                        </li>
                        <li className="flex items-start font-medium">
                          <CheckCircle className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <span>All professional equipment included</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => {
                  addItem(selectedService, selectedService.name === 'House Painting' ? paintingVariant : null);
                  setSelectedService(null);
                }}
                className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-xs py-3.5 rounded-xl mt-2 transition-all uppercase tracking-wider shadow-md shadow-brand/10"
              >
                Add to Cart • Rs. {getVariantPrice(selectedService).toLocaleString()}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
