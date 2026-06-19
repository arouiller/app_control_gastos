import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gastoBorradorService } from '../services/gastoBorradorService';

export const fetchBorradores = createAsyncThunk(
  'gastoBorradores/fetchBorradores',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.getAll(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar borradores');
    }
  }
);

export const createBorrador = createAsyncThunk(
  'gastoBorradores/createBorrador',
  async (data, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear borrador');
    }
  }
);

export const updateBorrador = createAsyncThunk(
  'gastoBorradores/updateBorrador',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar borrador');
    }
  }
);

export const deleteBorrador = createAsyncThunk(
  'gastoBorradores/deleteBorrador',
  async (id, { rejectWithValue }) => {
    try {
      await gastoBorradorService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar borrador');
    }
  }
);

export const convertirBorrador = createAsyncThunk(
  'gastoBorradores/convertirBorrador',
  async ({ id, categoryId }, { rejectWithValue }) => {
    try {
      const response = await gastoBorradorService.convertir(id, categoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al convertir borrador');
    }
  }
);

const initialState = {
  borradores: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  },
};

const gastoBorradoresSlice = createSlice({
  name: 'gastoBorradores',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetBorradores: (state) => {
      state.borradores = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch borradores
    builder
      .addCase(fetchBorradores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBorradores.fulfilled, (state, action) => {
        state.loading = false;
        state.borradores = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchBorradores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create borrador
    builder
      .addCase(createBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBorrador.fulfilled, (state, action) => {
        state.loading = false;
        state.borradores.unshift(action.payload.data);
      })
      .addCase(createBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update borrador
    builder
      .addCase(updateBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBorrador.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.borradores.findIndex((b) => b.id === action.payload.data.id);
        if (index !== -1) {
          state.borradores[index] = action.payload.data;
        }
      })
      .addCase(updateBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete borrador
    builder
      .addCase(deleteBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBorrador.fulfilled, (state, action) => {
        state.loading = false;
        state.borradores = state.borradores.filter((b) => b.id !== action.payload);
      })
      .addCase(deleteBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Convertir borrador
    builder
      .addCase(convertirBorrador.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(convertirBorrador.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.borradores.findIndex(
          (b) => b.id === action.payload.gasto_borrador_actualizado.id
        );
        if (index !== -1) {
          state.borradores[index] = action.payload.gasto_borrador_actualizado;
        }
      })
      .addCase(convertirBorrador.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetBorradores } = gastoBorradoresSlice.actions;
export default gastoBorradoresSlice.reducer;
