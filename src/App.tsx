import { RouterProvider } from '@/providers/RouterProvider'
import { useInitAuth } from '@/hooks/useInitAuth'

function App() {
  useInitAuth()
  return <RouterProvider />
}

export default App
