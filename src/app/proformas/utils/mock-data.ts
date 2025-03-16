import { Proforma, ProformaTab } from '../components/types';
import { v4 as uuidv4 } from 'uuid';

const customerNames = [
  'Construcciones Martínez S.L.',
  'Edificaciones Modernas',
  'Obras y Proyectos García',
  'Inmobiliaria Construcción ABC',
  'Desarrollos Urbanos Modernos',
  'Reformas Express',
  'Constructora Hermanos López',
  'Proyectos Arquitectónicos Jiménez'
];

const supplierNames = [
  'Materiales Construcción S.A.',
  'Suministros Industriales López',
  'Cementos y Hormigones del Norte',
  'Ferretería Industrial Pérez',
  'Almacenes de Construcción El Profesional',
  'Maderas y Tableros Torres',
  'Hierros y Aceros Ruiz',
  'Materiales Eléctricos Sánchez'
];

const materials = [
  'Cemento Portland',
  'Ladrillos cerámicos',
  'Azulejos',
  'Madera tratada',
  'Pintura acrílica',
  'Arena fina',
  'Grava',
  'Barras de acero',
  'Tubería PVC',
  'Aislante térmico',
  'Baldosas',
  'Ventanas de aluminio'
];

const generateRandomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toISOString().split('T')[0];
};

export const generateMockProformas = (type: ProformaTab, count: number): Proforma[] => {
  const names = type === 'customer' ? customerNames : supplierNames;
  
  return Array.from({ length: count }).map((_, index) => ({
    id: uuidv4(),
    id_externo: `PRF-${type === 'customer' ? 'C' : 'S'}-${String(index + 1).padStart(4, '0')}`,
    fecha: generateRandomDate(new Date('2023-01-01'), new Date()),
    cliente_nombre: names[Math.floor(Math.random() * names.length)],
    monto: parseFloat((Math.random() * 10000 + 1000).toFixed(2)),
    material: materials[Math.floor(Math.random() * materials.length)]
  }));
}; 