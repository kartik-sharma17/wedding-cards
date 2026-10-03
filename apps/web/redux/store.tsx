import { configureStore } from '@reduxjs/toolkit'
import { RootApiService } from './service/root'


export const store = configureStore({
  reducer: {
    [RootApiService.reducerPath]: RootApiService.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(RootApiService.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch