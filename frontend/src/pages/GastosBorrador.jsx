import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBorradores,
  createBorrador,
  updateBorrador,
  deleteBorrador,
  convertirBorrador,
  clearError,
} from '../store/gastoBorradoresSlice';
import GastoBorradorForm from '../components/GastoBorradorForm';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { categoryService } from '../services/categoryService';

const GastosBorrador = () => {
  const dispatch = useDispatch();
  const { borradores, loading, error, pagination } = useSelector((state) => state.gastoBorradores);
  const { categories } = useSelector((state) => state.categories);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBorrador, setEditingBorrador] = useState(null);
  const [statusFilter, setStatusFilter] = useState('draft');
  const [convertingId, setConvertingId] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);

  // Load borradores on mount and when filter changes
  useEffect(() => {
    dispatch(fetchBorradores({ status: statusFilter, page: 1, limit: 20 }));
  }, [dispatch, statusFilter]);

  // Clear error when modal closes
  useEffect(() => {
    if (!isFormOpen) {
      setEditingBorrador(null);
    }
  }, [isFormOpen]);

  const handleCreateClick = () => {
    setEditingBorrador(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (borrador) => {
    setEditingBorrador(borrador);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingBorrador) {
        await dispatch(updateBorrador({ id: editingBorrador.id, data })).unwrap();
      } else {
        await dispatch(createBorrador(data)).unwrap();
      }
      setIsFormOpen(false);
      setEditingBorrador(null);
    } catch (err) {
      // Error is in Redux state, already shown
    }
  };

  const handleDeleteClick = async (borrador) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este borrador?')) {
      try {
        await dispatch(deleteBorrador(borrador.id)).unwrap();
      } catch (err) {
        // Error is in Redux state
      }
    }
  };

  const handleConvertClick = (borrador) => {
    setConvertingId(borrador.id);
    setSelectedCategoryId('');
    setShowConvertModal(true);
  };

  const handleConfirmConvert = async () => {
    if (!selectedCategoryId) {
      alert('Por favor selecciona una categoría');
      return;
    }
    try {
      setConvertLoading(true);
      await dispatch(convertirBorrador({ id: convertingId, categoryId: selectedCategoryId })).unwrap();
      setShowConvertModal(false);
      setConvertingId(null);
      setSelectedCategoryId('');
    } catch (err) {
      // Error is in Redux state
    } finally {
      setConvertLoading(false);
    }
  };

  if (loading && borradores.length === 0) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gastos Borrador</h1>
        <p className="text-gray-600">Gestiona tus gastos en estado de borrador</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
          <button onClick={() => dispatch(clearError())} className="ml-2 underline">
            Descartar
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'draft' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('draft')}
          >
            Borradores
          </Button>
          <Button
            variant={statusFilter === 'convertido' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('convertido')}
          >
            Convertidos
          </Button>
        </div>
        <Button variant="primary" onClick={handleCreateClick}>
          + Nuevo Borrador
        </Button>
      </div>

      {/* Table */}
      {borradores.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No hay gastos en estado {statusFilter === 'draft' ? 'borrador' : 'convertido'} aún</p>
          {statusFilter === 'draft' && (
            <Button variant="primary" onClick={handleCreateClick} className="mt-4">
              Crear nuevo
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Descripción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Monto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Cuotas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {borradores.map((borrador) => (
                <tr key={borrador.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{borrador.descripcion}</td>
                  <td className="px-6 py-4 text-sm">
                    {formatCurrency(borrador.monto_total, borrador.moneda)}
                  </td>
                  <td className="px-6 py-4 text-sm">{borrador.cantidad_de_cuotas}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(borrador.expense_date)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      borrador.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {borrador.status === 'draft' ? 'Borrador' : 'Convertido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {borrador.status === 'draft' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditClick(borrador)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleConvertClick(borrador)}
                        >
                          Convertir
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteClick(borrador)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                    {borrador.status === 'convertido' && (
                      <span className="text-gray-500 text-sm">
                        Convertido el {formatDate(borrador.converted_at)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <GastoBorradorForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingBorrador}
        isLoading={loading}
      />

      {/* Convert Confirmation Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setConvertingId(null);
          setSelectedCategoryId('');
        }}
        title="Confirmar Conversión"
      >
        <div className="space-y-4">
          <p>¿Estás seguro que deseas convertir este gasto a definitivo?</p>
          <p className="text-sm text-gray-600">
            Una vez convertido, se crearán las cuotas según lo especificado.
          </p>

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Selecciona una Categoría</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecciona una categoría --</option>
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <option disabled>Cargando categorías...</option>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConvertModal(false);
                setConvertingId(null);
                setSelectedCategoryId('');
              }}
              disabled={convertLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmConvert}
              isLoading={convertLoading}
              disabled={!selectedCategoryId || convertLoading}
            >
              Convertir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GastosBorrador;
