import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { categoryService } from '../services/categoryService'

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await categoryService.getAll()
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al cargar categorías')
  }
})

export const createCategory = createAsyncThunk('categories/create', async (data, { rejectWithValue }) => {
  try {
    const res = await categoryService.create(data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al crear categoría')
  }
})

export const updateCategory = createAsyncThunk('categories/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await categoryService.update(id, data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al actualizar categoría')
  }
})

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
  try {
    await categoryService.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'No se puede eliminar: tiene gastos asociados')
  }
})

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload)
      })
  },
})

export const { clearError } = categoriesSlice.actions
export default categoriesSlice.reducer
