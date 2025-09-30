import React, { useState, useEffect, useRef } from 'react';
import { Car, GalleryItem } from '../types';
import { 
  Images, 
  Upload, 
  Trash2, 
  Share2, 
  Copy, 
  FolderOpen, 
  Image as ImageIcon,
  Video,
  X,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Download,
  Check
} from 'lucide-react';

interface Props {
  cars: Car[];
}

export default function Gallery({ cars }: Props) {
  const [galleries, setGalleries] = useState<Record<string, GalleryItem[]>>({});
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar galerías del localStorage
  useEffect(() => {
    const savedGalleries = localStorage.getItem('phia-rental-galleries');
    if (savedGalleries) {
      setGalleries(JSON.parse(savedGalleries));
    }
  }, []);

  // Guardar galerías en localStorage
  useEffect(() => {
    localStorage.setItem('phia-rental-galleries', JSON.stringify(galleries));
  }, [galleries]);

  // Limpiar galerías de autos eliminados
  useEffect(() => {
    const currentCarIds = new Set(cars.map(car => car.id));
    const galleryCarIds = Object.keys(galleries);
    
    const updatedGalleries = { ...galleries };
    let hasChanges = false;

    galleryCarIds.forEach(carId => {
      if (!currentCarIds.has(carId)) {
        delete updatedGalleries[carId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setGalleries(updatedGalleries);
    }
  }, [cars, galleries]);

  const handleFileUpload = (carId: string, files: FileList | null) => {
    if (!files) return;

    const maxFilesPerCar = 50; // Aumentamos el límite

    Array.from(files).forEach(file => {
      const currentItems = galleries[carId] || [];
      if (currentItems.length >= maxFilesPerCar) {
        showSuccess(`Máximo ${maxFilesPerCar} archivos por auto`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        showSuccess(`Formato no soportado: ${file.name}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newItem: GalleryItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          carId,
          type: isImage ? 'image' : 'video',
          url: e.target?.result as string,
          name: file.name,
          uploadedAt: new Date().toISOString(),
          selected: false
        };

        setGalleries(prev => ({
          ...prev,
          [carId]: [...(prev[carId] || []), newItem]
        }));
      };
      reader.readAsDataURL(file);
    });

    showSuccess('Archivos subidos exitosamente');
  };

  const deleteItem = (carId: string, itemId: string) => {
    setGalleries(prev => ({
      ...prev,
      [carId]: (prev[carId] || []).filter(item => item.id !== itemId)
    }));
    // Remover de seleccionados si estaba seleccionado
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    showSuccess('Archivo eliminado');
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = (carId: string) => {
    const carItems = galleries[carId] || [];
    const carItemIds = carItems.map(item => item.id);
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      carItemIds.forEach(id => newSet.add(id));
      return newSet;
    });
    showSuccess(`${carItemIds.length} elementos seleccionados`);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    showSuccess('Selección limpiada');
  };

  const copySelectedAsImages = async () => {
    if (selectedItems.size === 0) {
      showSuccess('No hay elementos seleccionados');
      return;
    }

    const selectedGalleryItems = selectedCarId 
      ? (galleries[selectedCarId] || []).filter(item => selectedItems.has(item.id) && item.type === 'image')
      : [];

    if (selectedGalleryItems.length === 0) {
      showSuccess('No hay imágenes seleccionadas');
      return;
    }

    try {
      if (selectedGalleryItems.length === 1) {
        // Una sola imagen - copiar al portapapeles
        const response = await fetch(selectedGalleryItems[0].url);
        const blob = await response.blob();

        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showSuccess('Imagen copiada al portapapeles');
        } else {
          // Fallback: descargar
          const link = document.createElement('a');
          link.href = selectedGalleryItems[0].url;
          link.download = selectedGalleryItems[0].name;
          link.click();
          showSuccess('Imagen descargada');
        }
      } else {
        // Múltiples imágenes - descargar todas
        selectedGalleryItems.forEach((item, index) => {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = item.url;
            link.download = `${item.name}`;
            link.click();
          }, index * 100); // Pequeño delay entre descargas
        });
        showSuccess(`${selectedGalleryItems.length} imágenes descargadas`);
      }
    } catch (error) {
      console.error('Error copying images:', error);
      showSuccess('Error al copiar imágenes');
    }
  };

  const shareSelectedWhatsApp = async () => {
    if (selectedItems.size === 0) {
      showSuccess('No hay elementos seleccionados');
      return;
    }

    const selectedGalleryItems = selectedCarId 
      ? (galleries[selectedCarId] || []).filter(item => selectedItems.has(item.id) && item.type === 'image')
      : [];

    if (selectedGalleryItems.length === 0) {
      showSuccess('No hay imágenes seleccionadas para compartir');
      return;
    }

    const car = cars.find(c => c.id === selectedCarId);
    const message = `🚗 *Fotos de ${car?.name || 'vehículo'}* 🌴\n\n` +
      `📸 ${selectedGalleryItems.length} imagen${selectedGalleryItems.length > 1 ? 'es' : ''} adjunta${selectedGalleryItems.length > 1 ? 's' : ''}\n\n` +
      `¡Consulta nuestras mejores ofertas en Phia Rental Miami!\n\n` +
      `🌴 Tu mejor opción para rentar autos en Miami 🌴`;

    // Descargar todas las imágenes seleccionadas
    selectedGalleryItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = `phia-${car?.name?.replace(/\s+/g, '-').toLowerCase()}-${index + 1}.jpg`;
        link.click();
      }, index * 100);
    });

    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    showSuccess(`${selectedGalleryItems.length} imágenes descargadas y WhatsApp abierto`);
  };

  const showSuccess = (message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(null), 3000);
  };

  const selectedCar = cars.find(car => car.id === selectedCarId);
  const selectedGallery = selectedCarId ? galleries[selectedCarId] || [] : [];
  const images = selectedGallery.filter(item => item.type === 'image');
  const videos = selectedGallery.filter(item => item.type === 'video');
  const selectedCount = selectedItems.size;

  return (
    <div className="space-y-8">
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Images className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Galería de Vehículos</h2>
        </div>

        {!selectedCarId ? (
          // Vista de carpetas
          <div>
            <p className="text-gray-600 mb-6">
              Selecciona un vehículo para gestionar su galería de fotos y videos
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map(car => {
                const itemCount = (galleries[car.id] || []).length;
                const imageCount = (galleries[car.id] || []).filter(item => item.type === 'image').length;
                const videoCount = (galleries[car.id] || []).filter(item => item.type === 'video').length;

                return (
                  <div
                    key={car.id}
                    onClick={() => setSelectedCarId(car.id)}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 hover:border-indigo-400 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <FolderOpen className="h-8 w-8 text-indigo-600" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{car.name}</h3>
                        <p className="text-xs text-gray-600">{car.type || 'Auto'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Total archivos:</span>
                        <span className="font-bold text-indigo-700">{itemCount}</span>
                      </div>
                      
                      {itemCount > 0 && (
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3 text-green-600" />
                            <span className="text-green-700">{imageCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-700">{videoCount}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {cars.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg">No hay vehículos en el inventario</p>
                <p className="text-sm">Agrega vehículos para crear sus galerías</p>
              </div>
            )}
          </div>
        ) : (
          // Vista de galería específica
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedCarId(null);
                    setSelectedItems(new Set());
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Volver
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedCar?.name}</h3>
                  <p className="text-sm text-gray-600">{selectedCar?.type || 'Auto'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(selectedCarId, e.target.files)}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Subir Archivos
                </button>
              </div>
            </div>

            {/* Controles de selección */}
            {selectedGallery.length > 0 && (
              <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-4 mb-6 border border-pink-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">
                      {selectedCount > 0 ? `${selectedCount} seleccionado${selectedCount > 1 ? 's' : ''}` : 'Ninguno seleccionado'}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectAllItems(selectedCarId)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold transition-all"
                      >
                        Seleccionar Todo
                      </button>
                      
                      {selectedCount > 0 && (
                        <button
                          onClick={clearSelection}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-semibold transition-all"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedCount > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={copySelectedAsImages}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        {selectedCount === 1 ? 'Copiar' : 'Descargar'}
                      </button>
                      
                      <button
                        onClick={shareSelectedWhatsApp}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Galería de imágenes */}
            {images.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-green-600" />
                  Imágenes ({images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {images.map(item => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <div key={item.id} className="relative group">
                        <div 
                          className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-4 transition-all ${
                            isSelected ? 'border-pink-500 shadow-lg' : 'border-transparent'
                          }`}
                          onClick={() => toggleItemSelection(item.id)}
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          
                          {/* Checkbox de selección */}
                          <div className="absolute top-2 left-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected ? 'bg-pink-500 text-white' : 'bg-white bg-opacity-80 text-gray-600'
                            }`}>
                              {isSelected ? <Check className="h-4 w-4" /> : <div className="w-3 h-3 border-2 border-gray-400 rounded-full" />}
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón de eliminar */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(selectedCarId, item.id);
                          }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        {/* Botón de vista previa */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPreview({ type: 'image', url: item.url });
                          }}
                          className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ImageIcon className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Galería de videos */}
            {videos.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  Videos ({videos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map(item => (
                    <div key={item.id} className="relative group">
                      <div 
                        className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative"
                        onClick={() => setShowPreview({ type: 'video', url: item.url })}
                      >
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(selectedCarId, item.id)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedGallery.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg">No hay archivos en esta galería</p>
                <p className="text-sm">Sube imágenes y videos para comenzar</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Subir Primer Archivo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowPreview(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            {showPreview.type === 'image' ? (
              <img
                src={showPreview.url}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <video
                src={showPreview.url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Información de almacenamiento */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-semibold text-yellow-800">Información de Almacenamiento</span>
        </div>
        <div className="text-xs text-yellow-700 space-y-1">
          <p>• Máximo 50 archivos por vehículo</p>
          <p>• Acepta cualquier formato de imagen y video</p>
          <p>• Selecciona las fotos que quieras compartir</p>
          <p>• Copia una imagen al portapapeles o descarga múltiples</p>
          <p>• Comparte directamente por WhatsApp</p>
          <p>• Los archivos se almacenan localmente en tu navegador</p>
        </div>
      </div>
    </div>
  );
}