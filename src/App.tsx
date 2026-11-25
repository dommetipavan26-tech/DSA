import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SortingVisualizer from './pages/SortingVisualizer'
import StackQueueVisualizer from './pages/StackQueueVisualizer'
import LinearListsVisualizer from './pages/LinearListsVisualizer'
import GraphVisualizer from './pages/GraphVisualizer'
import SearchingVisualizer from './pages/SearchingVisualizer'
import HashingVisualizer from './pages/HashingVisualizer'
import TreeFundamentalsVisualizer from './pages/TreeFundamentalsVisualizer'
import BinaryTreeOpsVisualizer from './pages/BinaryTreeOpsVisualizer'
import AVLTreeVisualizer from './pages/AVLTreeVisualizer'
import ExpressionTreeVisualizer from './pages/ExpressionTreeVisualizer'
import MSTVisualizer from './pages/MSTVisualizer'
import ShortestPathVisualizer from './pages/ShortestPathVisualizer'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/linear-lists" element={<LinearListsVisualizer />} />
        <Route path="/stack-queue" element={<StackQueueVisualizer />} />
        <Route path="/tree-fundamentals" element={<TreeFundamentalsVisualizer />} />
        <Route path="/binary-tree-ops" element={<BinaryTreeOpsVisualizer />} />
        <Route path="/avl-tree" element={<AVLTreeVisualizer />} />
        <Route path="/expression-tree" element={<ExpressionTreeVisualizer />} />
        <Route path="/graph-traversal" element={<GraphVisualizer />} />
        <Route path="/mst" element={<MSTVisualizer />} />
        <Route path="/shortest-path" element={<ShortestPathVisualizer />} />
        <Route path="/sorting" element={<SortingVisualizer />} />
        <Route path="/searching" element={<SearchingVisualizer />} />
        <Route path="/hashing" element={<HashingVisualizer />} />
        {/* legacy redirects */}
        <Route path="/bst" element={<Navigate to="/binary-tree-ops" replace />} />
        <Route path="/heap" element={<Navigate to="/sorting" replace />} />
        <Route path="/linked-list" element={<Navigate to="/linear-lists" replace />} />
        <Route path="/graph" element={<Navigate to="/graph-traversal" replace />} />
        <Route path="/recursion" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
