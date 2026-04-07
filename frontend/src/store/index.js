import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import expensesReducer from './expensesSlice'
import categoriesReducer from './categoriesSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expensesReducer,
    categories: categoriesReducer,
  },
})

export default store
