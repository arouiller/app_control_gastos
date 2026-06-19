import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import expensesReducer from './expensesSlice'
import categoriesReducer from './categoriesSlice'
import gastoBorradoresReducer from './gastoBorradoresSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expensesReducer,
    categories: categoriesReducer,
    gastoBorradores: gastoBorradoresReducer,
  },
})

export default store
