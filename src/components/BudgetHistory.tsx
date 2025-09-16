import React, { useState } from 'react';
import { Budget } from '../types';
import { History, Download, FileText, Calendar, User, Hash, Copy, MessageCircle, Eye, RefreshCw } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface Props {
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  companyLogo: string | null;
  onDuplicateBudget?: (budget: Budget) => void;
}

export default function BudgetHistory({ budgets, setBudgets, companyLogo, onDuplicateBudget }: Props) {
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(null), 3000);
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

  const downloadBudgetPDF = async (budget: Budget) => {
    try {
      if (budget.pdfBase64) {
        const link = document.createElement('a');
        link.href = budget.pdfBase64;
        link.download = `presupuesto-${budget.reservationNumber}.pdf`;
        link.click();
        showSuccess('PDF descargado');
        return;
      }
      // Fallback: si no hay PDF, pero hay imagen, genero un PDF simple con esa imagen
      await generatePDFFromBudget(budget);
    } catch (e) {
      console.error(e);
      showSuccess('Error al descargar/generar el PDF');
    }
  };

  // Fallback: arma un PDF básico a partir de imageBase64 y los datos del presupuesto
  const generatePDFFromBudget = async (budget: Budget) => {
    const container = document.createElement('div');
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    container.style.background = '#fff';
    container.style.padding = '16px';
    container.style.fontFamily = "'Segoe UI','Poppins',sans-serif";

    container.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        ${companyLogo ? `<img src="${companyLogo}" style="max-height:60px; object-fit:contain; margin-bottom:12px;" />` : ''}
        <div style="background:linear-gradient(90deg,#ec4899,#f59e0b);color:#fff;padding:12px;border-radius:10px;">
          <div style="font-size:20px;font-weight:700;">PHIA RENTAL MIAMI</div>
          <div style="font-size:15px;font-weight:600;">PRESUPUESTO DE RENTA DE AUTOS</div>
          <div style="margin-top:6px;font-size:12px;">Reserva: ${budget.reservationNumber}</div>
        </div>
      </div>

      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px;">
          <div style="width:90px;font-weight:700;color:#374151;">Cliente:</div>
          <div style="color:#111827;">${budget.clientName}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px;">
          <div style="width:90px;font-weight:700;color:#374151;">Período:</div>
          <div style="color:#111827;">${budget.startDate} al ${budget.endDate}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <div style="width:90px;font-weight:700;color:#374151;">Días:</div>
          <div style="color:#ec4899;font-weight:800;">${budget.days} días</div>
        </div>
      </div>

      ${budget.imageBase64 ? `<img src="${budget.imageBase64}" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;" />` : `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:linear-gradient(90deg,#ec4899,#f59e0b);color:#fff;">
                <th style="border:1px solid #e5e7eb;text-align:left;padding:8px;">Vehículo</th>
                <th style="border:1px solid #e5e7eb;text-align:right;padding:8px;">Precio/Día</th>
                <th style="border:1px solid #e5e7eb;text-align:right;padding:8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${budget.items
                .sort((a,b) => a.pricePerDay - b.pricePerDay)
                .map(it => `
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:8px;">${it.carName}</td>
                    <td style="border:1px solid #e5e7eb;padding:8px;text-align:right;">$${it.pricePerDay.toFixed(2)}</td>
                    <td style="border:1px solid #e5e7eb;padding:8px;text-align:right;">$${(it.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="border:1px solid #e5e7eb;padding:8px;text-align:right;font-weight:700;">TOTAL GENERAL</td>
                <td style="border:1px solid #e5e7eb;padding:8px;text-align:right;font-weight:800;color:#ec4899;">$${budget.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `}
    `;

    // Usa html2pdf para convertir ese HTML en PDF
    await html2pdf()
      .set({
        margin: [10,10,10,10],
        filename: `presupuesto-${budget.reservationNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      })
      .from(container)
      .save();

    showSuccess('PDF generado desde el historial');
  };

  const copyBudgetAsImage = async (budget: Budget) => {
    if (!budget.imageBase64) return;
    try {
      const response = await fetch(budget.imageBase64);
      const blob = await response.blob();

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showSuccess('Imagen copiada al portapapeles');
      } else {
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
  };

  const shareWhatsAppFromHistory = async (budget: Budget) => {
    if (!budget.imageBase64) return;

    const message =
      `🚗 *Te envío el presupuesto de Phia Rental Miami* 🌴\n\n` +
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
  };

  const duplicateBudget = (budget: Budget) => {
    if (onDuplicateBudget) {
      onDuplicateBudget(budget);
      showSuccess('Presupuesto duplicado para edición');
    }
  };

  const sortedBudgets = [...budgets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

      {/* Stats simples */}
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
                  ${sortedBudgets.reduce((sum, b) => sum + b.total, 0).toFixed(0)}
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
                  ${(sortedBudgets.reduce((sum, b) => sum + b.total, 0) / sortedBudgets.length).toFixed(0)}
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
