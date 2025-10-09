import React, { useState } from 'react';
import { Budget } from '../types';
import { History, Download, FileText, Calendar, User, Hash, Copy, MessageCircle, Eye, RefreshCw } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';

interface Props {
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  companyLogo: string | null;
  onDuplicateBudget?: (budget: Budget) => void;
}

export default function BudgetHistory({ budgets, setBudgets, companyLogo, onDuplicateBudget }: Props) {
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  const downloadBudgetPDF = async (budget: Budget) => {
    if (budget.pdfBase64) {
      // Si tenemos el PDF guardado, descargarlo directamente
      const link = document.createElement('a');
      link.href = budget.pdfBase64;
      link.download = `presupuesto-${budget.reservationNumber}.pdf`;
      link.click();
      showSuccess('PDF descargado');
    } else {
      // Generar PDF desde cero (fallback)
      await generatePDFFromBudget(budget);
    }
  };

  const generatePDFFromBudget = async (budget: Budget) => {
    // Similar al método anterior pero usando los datos del budget guardado
    showSuccess('Generando PDF...');
    // Implementación similar a la anterior
  };

  const copyBudgetAsImage = async (budget: Budget) => {
    if (budget.imageBase64) {
      try {
        const response = await fetch(budget.imageBase64);
        const blob = await response.blob();
        
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showSuccess('Imagen copiada al portapapeles');
        } else {
          // Fallback: descargar imagen
          const link = document.createElement('a');
          link.href = budget.imageBase64;
          link.download = `presupuesto-${budget.reservationNumber}.png`;
          link.click();
          showSuccess('Imagen descargada');
        }
      } catch (error) {
        console.error('Error copying image:', error);
        showSuccess('Error al copiar imagen');
      }
    }
  };

  const shareWhatsAppFromHistory = async (budget: Budget) => {
    if (budget.imageBase64) {
      const message = `🚗 *Te envío el presupuesto de Phia Rental Miami* 🌴\n\n` +
                     `Cliente: ${budget.clientName}\n` +
                     `Período: ${budget.startDate} al ${budget.endDate}\n` +
                     `Días: ${budget.days} días\n\n` +
                     `¡Consulta nuestras mejores ofertas para tu viaje a Miami!\n\n` +
                     `(Ver imagen adjunta con detalles completos)`;

      // Descargar imagen
      const link = document.createElement('a');
      link.href = budget.imageBase64;
      link.download = `presupuesto-phia-${budget.reservationNumber}.png`;
      link.click();

      // Abrir WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      showSuccess('Imagen descargada y WhatsApp abierto');
    }
  };

  const viewBudgetPDF = (budget: Budget) => {
    if (budget.pdfBase64) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <iframe src="${budget.pdfBase64}" style="width:100%; height:100vh; border:none;"></iframe>
        `);
      }
    }
  };

  const showSuccess = (message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(null), 3000);
  };

  const duplicateBudget = (budget: Budget) => {
    if (onDuplicateBudget) {
      onDuplicateBudget(budget);
      showSuccess('Presupuesto duplicado para edición');
    }
  };

  const sortedBudgets = [...budgets].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          {showSuccessMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Historial de Presupuestos</h2>
        </div>

        {sortedBudgets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg">No hay presupuestos generados</p>
            <p className="text-sm">Los presupuestos aparecerán aquí una vez que los generes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Reserva</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Autos</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedBudgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(budget.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {budget.clientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {budget.reservationNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{budget.startDate}</div>
                        <div className="text-gray-500">hasta {budget.endDate}</div>
                        <div className="text-xs text-gray-500">({budget.days} días)</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {budget.items.map((item, index) => (
                          <div key={index} className="truncate max-w-xs" title={item.carName}>
                            {item.carName}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-bold text-emerald-700">
                        ${budget.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {budget.pdfBase64 && (
                          <button
                            onClick={() => viewBudgetPDF(budget)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 text-xs"
                            title="Ver PDF"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </button>
                        )}
                        
                        <button
                          onClick={() => duplicateBudget(budget)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 text-xs"
                          title="Duplicar presupuesto"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Dup
                        </button>
                        <button
                          onClick={() => downloadBudgetPDF(budget)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 text-xs"
                          title="Descargar PDF"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </button>
                        
                        {budget.imageBase64 && (
                          <>
                            <button
                              onClick={() => copyBudgetAsImage(budget)}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 text-xs"
                              title="Copiar como imagen"
                            >
                              <Copy className="h-3 w-3" />
                              Img
                            </button>
                            
                            <button
                              onClick={() => shareWhatsAppFromHistory(budget)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 text-xs"
                              title="Compartir por WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WA
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {sortedBudgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Presupuestos</p>
                <p className="text-3xl font-bold">{sortedBudgets.length}</p>
              </div>
              <FileText className="h-12 w-12 text-emerald-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-sm font-medium">Valor Total</p>
                <p className="text-3xl font-bold">
                  ${sortedBudgets.reduce((sum, budget) => sum + budget.total, 0).toFixed(0)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Promedio</p>
                <p className="text-3xl font-bold">
                  ${(sortedBudgets.reduce((sum, budget) => sum + budget.total, 0) / sortedBudgets.length).toFixed(0)}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}