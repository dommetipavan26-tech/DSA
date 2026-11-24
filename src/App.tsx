import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SortingVisualizer from './pages/SortingVisualizer'
import BSTVisualizer from './pages/BSTVisualizer'
import HeapVisualizer from './pages/HeapVisualizer'
import StackQueueVisualizer from './pages/StackQueueVisualizer'
import LinkedListVisualizer from './pages/LinkedListVisualizer'
import GraphVisualizer from './pages/GraphVisualizer'
import SearchingVisualizer from './pages/SearchingVisualizer'
import RecursionVisualizer from './pages/RecursionVisualizer'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sorting" element={<SortingVisualizer />} />
        <Route path="/bst" element={<BSTVisualizer />} />
        <Route path="/heap" element={<HeapVisualizer />} />
        <Route path="/stack-queue" element={<StackQueueVisualizer />} />
        <Route path="/linked-list" element={<LinkedListVisualizer />} />
        <Route path="/graph" element={<GraphVisualizer />} />
        <Route path="/searching" element={<SearchingVisualizer />} />
        <Route path="/recursion" element={<RecursionVisualizer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
