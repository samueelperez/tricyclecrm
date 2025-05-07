import { forwardRef } from 'react';
import { CUENTAS_BANCARIAS } from '@/lib/constants';

// Interfaz para los items de factura
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalValue: number;
  weight?: number;
  packaging?: string;
  packagingType?: string;
}

// Interfaz para los datos de factura
interface Invoice {
  id?: string;
  number: string;
  date: string;
  customerName: string;
  taxId: string;
  paymentTerms: string;
  invoiceNotes: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  bankAccount: string;
  estado: string;
  puerto_origen?: string;
  puerto_destino?: string;
  deliveryTerms?: string;
  origen?: string;
  contenedores?: string;
  pesoTotal?: number;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  codigo_postal?: string;
}

// Componente para la vista de impresión de factura
const InvoicePrintView = forwardRef<HTMLDivElement, { invoice: Invoice }>(
  ({ invoice }, ref) => {
    // Extraer fecha formateada
    const formattedDate = new Date(invoice.date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Obtener detalles bancarios a partir de la cuenta seleccionada
    const selectedBank = CUENTAS_BANCARIAS.find(cuenta => cuenta.descripcion === invoice.bankAccount);
    const bankName = selectedBank?.banco || '';
    const iban = selectedBank?.iban || '';
    const swift = selectedBank?.swift || '';
    const currency = selectedBank?.moneda || '';

    return (
      <div ref={ref} className="bg-white p-8 max-w-[21cm] mx-auto shadow-none" style={{ display: 'none' }}>
        {/* Cabecera con logo */}
        <div className="mb-6 flex justify-between items-start border-b pb-4">
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="Logo TriCycle CRM" 
              className="h-16 mr-4" 
              style={{ objectFit: 'contain' }}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-800">TRICYCLE CRM</h1>
              <p className="text-sm text-gray-600">C/ Principal 123</p>
              <p className="text-sm text-gray-600">28001 Madrid, España</p>
              <p className="text-sm text-gray-600">CIF: B12345678</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-800 mb-2">FACTURA</div>
            <table className="ml-auto text-right">
              <tbody>
                <tr key="numero">
                  <td className="pr-2 text-gray-600 font-medium">Número:</td>
                  <td className="font-bold">{invoice.number}</td>
                </tr>
                <tr key="fecha">
                  <td className="pr-2 text-gray-600 font-medium">Fecha:</td>
                  <td>{formattedDate}</td>
                </tr>
                <tr key="estado">
                  <td className="pr-2 text-gray-600 font-medium">Estado:</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      invoice.estado === 'pagada' ? 'bg-green-100 text-green-800' :
                      invoice.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Descripción de Bienes - Posicionada antes para asegurar visibilidad */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 text-gray-800 border-b pb-2">DESCRIPCIÓN DE BIENES</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left border border-gray-800 font-bold uppercase">FULL DESCRIPTION OF GOODS</th>
                <th className="py-2 px-3 text-center border border-gray-800 font-bold uppercase">WEIGHT</th>
                <th className="py-2 px-3 text-center border border-gray-800 font-bold uppercase">PRICE</th>
                <th className="py-2 px-3 text-center border border-gray-800 font-bold uppercase">TOTAL VALUE</th>
              </tr>
            </thead>
            <tbody>
              {/* Si hay items, mostrarlos; de lo contrario mostrar un item de ejemplo */}
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <tr key={index} className="bg-white">
                    <td className="py-2 px-3 border border-gray-800 font-medium">{(item.description || 'PRODUCTO SIN DESCRIPCIÓN').toUpperCase()}</td>
                    <td className="py-2 px-3 text-center border border-gray-800">{(item.weight || 0).toFixed(2)} MT</td>
                    <td className="py-2 px-3 text-center border border-gray-800">{(item.unitPrice || 0).toFixed(2).replace('.', ',')} €</td>
                    <td className="py-2 px-3 text-center border border-gray-800">{(item.totalValue || 0).toFixed(2).replace('.', ',')} €</td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
                  <td className="py-2 px-3 border border-gray-800 font-medium">PP PLASTIC SCRAP - SAMPLE CODE</td>
                  <td className="py-2 px-3 text-center border border-gray-800">20.00 MT</td>
                  <td className="py-2 px-3 text-center border border-gray-800">200,00 €</td>
                  <td className="py-2 px-3 text-center border border-gray-800">4000,00 €</td>
                </tr>
              )}
              {/* Fila de origen y total */}
              <tr className="bg-white">
                <td className="py-2 px-3 border border-gray-800 font-medium">ORIGIN OF GOODS: {(invoice.origen || invoice.puerto_origen || "SPAIN").toUpperCase()}</td>
                <td className="py-2 px-3 text-center border border-gray-800">{(invoice.pesoTotal || 0).toFixed(2)} MT</td>
                <td className="py-2 px-3 text-center border border-gray-800">Total Amount</td>
                <td className="py-2 px-3 text-center border border-gray-800">
                  {invoice.items && invoice.items.length > 0 
                    ? invoice.subtotal.toFixed(2).replace('.', ',') 
                    : '4000,00'} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resumen financiero */}
        <div className="mb-8 flex justify-end">
          <div className="w-48 border border-gray-800 rounded-md overflow-hidden">
            <div className="flex justify-between py-1 px-3 bg-gray-50 border-b text-sm">
              <span className="font-medium">Subtotal:</span>
              <span>{invoice.subtotal.toFixed(2).replace('.', ',')} €</span>
            </div>
            <div className="flex justify-between py-1 px-3 bg-white border-b text-sm">
              <span className="font-medium">IVA:</span>
              <span>{invoice.taxAmount.toFixed(2).replace('.', ',')} €</span>
            </div>
            <div className="flex justify-between py-2 px-3 bg-gray-100 font-bold text-sm">
              <span>Total:</span>
              <span>{invoice.totalAmount.toFixed(2).replace('.', ',')} €</span>
            </div>
          </div>
        </div>

        {/* Información del cliente y términos */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">Cliente</h2>
            <p className="font-medium text-sm">{invoice.customerName}</p>
            {invoice.taxId && <p className="text-xs text-gray-600">CIF/NIF: {invoice.taxId}</p>}
            {invoice.direccion && <p className="text-xs text-gray-600">{invoice.direccion}</p>}
            {(invoice.ciudad || invoice.codigo_postal) && (
              <p className="text-xs text-gray-600">
                {invoice.ciudad}
                {invoice.codigo_postal && invoice.ciudad ? `, ${invoice.codigo_postal}` : invoice.codigo_postal}
              </p>
            )}
            {invoice.pais && <p className="text-xs text-gray-600">{invoice.pais}</p>}
          </div>
          
          {/* Términos de pago y entrega */}
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">Términos</h2>
            <p className="text-xs"><span className="font-medium">Pago:</span> {invoice.paymentTerms || "No especificado"}</p>
            <p className="text-xs"><span className="font-medium">Entrega:</span> {invoice.deliveryTerms || "No especificado"}</p>
            <p className="text-xs"><span className="font-medium">Puerto:</span> {invoice.puerto_destino || "No especificado"}</p>
          </div>
        </div>
        
        {/* Información Bancaria */}
        <div className="mb-6 border border-gray-300 rounded-md p-3 bg-gray-50">
          <h2 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">Información Bancaria</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p><span className="font-medium">Banco:</span> {bankName}</p>
              <p><span className="font-medium">IBAN:</span> {iban}</p>
            </div>
            <div>
              <p><span className="font-medium">SWIFT:</span> {swift}</p>
              <p><span className="font-medium">Moneda:</span> {currency}</p>
            </div>
          </div>
        </div>
        
        {/* Notas */}
        {invoice.invoiceNotes && (
          <div className="mb-6 border-t pt-3">
            <h2 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">Notas</h2>
            <p className="text-xs text-gray-600 whitespace-pre-line">{invoice.invoiceNotes}</p>
          </div>
        )}
        
      </div>
    );
  }
);

InvoicePrintView.displayName = 'InvoicePrintView';

export default InvoicePrintView; 