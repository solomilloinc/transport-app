'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Building, Bus, Edit, Plus, Search, Trash, TruckIcon, UserPlusIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteLogic, get, post, put } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { SearchFilter } from '@/components/dashboard/search-filter';
import { StatusFilter } from '@/components/dashboard/status-filter';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteDialog } from '@/components/dashboard/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormReducer } from '@/hooks/use-form-reducer';
import { toast } from '@/hooks/use-toast';
import { PagedResponse } from '@/services/types';
import { VehicleType } from '@/interfaces/vehicleType';
import { City } from '@/interfaces/city';

const initialCitiesForm = {
  code: '',
  name: '',
};

export default function CitiesManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCityId, setCurrentCityId] = useState<number | null>(null);
  const addForm = useFormReducer(initialCitiesForm);

  // Form state for editing a vehicle
  const editForm = useFormReducer(initialCitiesForm);

  // State for the paged response
  const [citiesData, setCitiesData] = useState<PagedResponse<City>>({
    Items: [],
    PageNumber: 1,
    PageSize: 8,
    TotalRecords: 0,
    TotalPages: 0,
  });
  // Function to fetch vehicles data
  const fetchCities = async (pageToFetch = currentPage, pageSizeToFetch = pageSize) => {
    setIsLoading(true);
    try {
      const response = await get<any, City>('/city-report', {
        pageNumber: pageToFetch,
        pageSize: pageSizeToFetch,
        sortBy: 'fecha',
        sortDescending: true,
        filters: searchQuery
          ? {
              search: searchQuery,
            }
          : {},
      });
      setCitiesData(response);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    fetchCities(currentPage, pageSize);
  }, [searchQuery, pageSize, currentPage]);

  const submitAddCity = async () => {
    addForm.setLoading(true);
    try {
      const response = await post('/city-create', addForm.state.data);
      if (response) {
        toast({
          title: 'Ciudad creada',
          description: 'La ciudad ha sido creado exitosamente',
          variant: 'success',
        });
        setIsAddModalOpen(false);
        fetchCities(); // Refresh the vehicle list
      } else {
        addForm.setError('Error al crear la ciudad');
        toast({
          title: 'Error',
          description: 'Error al crear la ciudad',
          variant: 'destructive',
        });
      }
    } catch (error) {
      addForm.setError('Ocurrió un error al crear la ciudad');
      toast({
        title: 'Error',
        description: 'Ocurrió un error al crear la ciudad',
        variant: 'destructive',
      });
    } finally {
      addForm.setLoading(false);
    }
  };

  const submitEditCity = async () => {
    editForm.setLoading(true);
    try {
      const response = await put(`/city-update/${currentCityId}`, editForm.state.data);
      if (response) {
        toast({
          title: 'Ciudad editada',
          description: 'La ciudad ha sido editada exitosamente',
          variant: 'success',
        });
        setIsEditModalOpen(false);
        fetchCities(); // Refresh the vehicle list
      } else {
        addForm.setError('Error al editar la ciudad');
        toast({
          title: 'Error',
          description: 'Error al editar la ciudad',
          variant: 'destructive',
        });
      }
    } catch (error) {
      addForm.setError('Ocurrió un error al editar la ciudad');
      toast({
        title: 'Error',
        description: 'Ocurrió un error al editar la ciudad',
        variant: 'destructive',
      });
    } finally {
      addForm.setLoading(false);
    }
  };

  const handleEditCity = (city: City) => {
    setCurrentCityId(city.Id);
    editForm.setForm({
      code: city.Code,
      name: city.Name,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteCity = (id: number) => {
    setCurrentCityId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/vehicle-delete/${currentCityId}`);
    // In a real app, you would delete the vehicle from the database
    setIsDeleteModalOpen(false);
    setCurrentCityId(null);
    fetchCities();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Nombre', accessor: 'Name', width: '30%' },
    { header: 'Código', accessor: 'Code', width: '25%' },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '20%',
      cell: (city: City) => <StatusBadge status={city.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '25%',
      cell: (city: City) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditCity(city)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeleteCity(city.Id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ciudades"
        description="Gestiona y visualiza toda la información de las ciudades."
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Building className="mr-2 h-4 w-4" />
            Añadir ciudad
          </Button>
        }
      />

      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <FilterBar onReset={resetFilters}>
              <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por nombre..." />
            </FilterBar>

            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={citiesData.Items}
                emptyMessage="No se encontraron ciudades."
                isLoading={isLoading}
                skeletonRows={citiesData.PageSize}
              />
            </div>

            {citiesData.Items.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={citiesData.TotalPages}
                totalItems={citiesData.TotalRecords}
                itemsPerPage={citiesData.PageSize}
                onPageChange={setCurrentPage}
                itemName="ciudades"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile view - Card layout */}
      <div className="md:hidden space-y-4 mt-4">
        {isLoading ? (
          // Mobile skeleton loading state
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-card-${index}`} className="w-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, fieldIndex) => (
                    <div key={`skeleton-field-${fieldIndex}`}>
                      <Skeleton className="h-4 w-[80px] mb-1" />
                      <Skeleton className="h-5 w-[120px]" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : citiesData.Items.length > 0 ? (
          citiesData.Items.map((city: City) => (
            <MobileCard
              key={city.Id}
              title={city.Name}
              subtitle={city.Code.toString()}
              badge={<StatusBadge status={city.Status ? 'Activo' : 'Inactivo'} />}
              fields={[]}
              onEdit={() => handleEditCity(city)}
              onDelete={() => handleDeleteCity(city.Id)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron ciudades.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir ciudad"
        description="Crea una nueva ciudad completando el formulario a continuación."
        onSubmit={() => submitAddCity()}
        submitText="Crear Ciudad"
      >
        <FormField label="Código">
          <Input
            id="code"
            placeholder="Código"
            value={addForm.state.data.code}
            onChange={(e) => addForm.setField('code', e.target.value)}
          />
        </FormField>
        <FormField label="Nombre">
          <Input
            id="name"
            placeholder="Nombre"
            value={addForm.state.data.name}
            onChange={(e) => addForm.setField('name', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Edit Customer Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar ciudad"
        description="Realiza cambios en los detalles de la ciudad a continuación."
        onSubmit={() => submitEditCity()}
        submitText="Guardar Cambios"
      >
        <FormField label="Código">
          <Input
            id="edit-code"
            value={editForm.state.data.code}
            onChange={(e) => editForm.setField('code', e.target.value)}
          />
        </FormField>
        <FormField label="Nombre">
          <Input
            id="edit-name"
            value={editForm.state.data.name}
            onChange={(e) => editForm.setField('name', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y todos los datos asociados de nuestros servidores."
      />
    </div>
  );
}
