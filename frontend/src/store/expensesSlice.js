import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { expenseService } from '../services/expenseService'

export const fetchExpenses = createAsyncThunk('expenses/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await expenseService.getAll(params)
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al cargar gastos')
  }
})

export const createExpense = createAsyncThunk('expenses/create', async (data, { rejectWithValue }) => {
  try {
    return await expenseService.create(data)
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al crear gasto')
  }
})

export const createInstallmentExpense = createAsyncThunk('expenses/createInstallment', async (data, { rejectWithValue }) => {
  try {
    return await expenseService.createInstallment(data)
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al crear gasto en cuotas')
  }
})

export const updateExpense = createAsyncThunk('expenses/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await expenseService.update(id, data)
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al actualizar gasto')
  }
})

export const deleteExpense = createAsyncThunk('expenses/delete', async (id, { rejectWithValue }) => {
  try {
    await expenseService.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Error al eliminar gasto')
  }
})

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    error: null,
    filters: {
      startDate: '',
      endDate: '',
      categoryId: '',
      paymentMethod: '',
      search: '',
      currency: '',
      displayCurrency: 'original',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = { startDate: '', endDate: '', categoryId: '', paymentMethod: '', search: '', currency: '', displayCurrency: 'original' }
    },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createExpense.fulfilled, (state) => { state.loading = false })
      .addCase(createInstallmentExpense.fulfilled, (state) => { state.loading = false })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload)
      })
  },
})

export const { setFilters, clearFilters, clearError } = expensesSlice.actions
export default expensesSlice.reducer
