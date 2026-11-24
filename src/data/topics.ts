import {
  ArrowUpDown,
  Binary,
  GitBranch,
  ListOrdered,
  Network,
  Search,
  SquareStack,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export interface Topic {
  id: string
  title: string
  description: string
  path: string
  icon: LucideIcon
  color: string
  tags: string[]
}

export const topics: Topic[] = [
  {
    id: 'sorting',
    title: 'Sorting Algorithms',
    description: 'Visualize Selection, Insertion, Bubble, Merge, and Quick Sort with step-by-step animation.',
    path: '/sorting',
    icon: ArrowUpDown,
    color: '#8b5cf6',
    tags: ['Arrays', 'Comparison', 'O(n log n)'],
  },
  {
    id: 'bst',
    title: 'Binary Search Tree',
    description: 'Build a BST, insert/delete/search nodes, and explore inorder, preorder, postorder traversals.',
    path: '/bst',
    icon: GitBranch,
    color: '#22c55e',
    tags: ['Trees', 'Search', 'Traversals'],
  },
  {
    id: 'heap',
    title: 'Binary Heap',
    description: 'Interact with Min Heap and Max Heap. Insert, extract root, and watch heapify animations.',
    path: '/heap',
    icon: Binary,
    color: '#f59e0b',
    tags: ['Heap', 'Priority Queue', 'Heapify'],
  },
  {
    id: 'stack-queue',
    title: 'Stack & Queue',
    description: 'Understand LIFO and FIFO with push/pop/enqueue/dequeue operations and visual flow.',
    path: '/stack-queue',
    icon: SquareStack,
    color: '#06b6d4',
    tags: ['LIFO', 'FIFO', 'Linear'],
  },
  {
    id: 'linked-list',
    title: 'Linked List',
    description: 'Visualize singly linked list operations: insert, delete, search, and traversal.',
    path: '/linked-list',
    icon: ListOrdered,
    color: '#ec4899',
    tags: ['Pointers', 'Nodes', 'Dynamic'],
  },
  {
    id: 'graph',
    title: 'Graph Traversal',
    description: 'Explore BFS and DFS on an interactive graph. Watch the frontier expand in real time.',
    path: '/graph',
    icon: Network,
    color: '#3b82f6',
    tags: ['BFS', 'DFS', 'Nodes & Edges'],
  },
  {
    id: 'searching',
    title: 'Searching Algorithms',
    description: 'Compare Linear Search and Binary Search with step-by-step pointer movement.',
    path: '/searching',
    icon: Search,
    color: '#f97316',
    tags: ['Linear', 'Binary', 'Arrays'],
  },
  {
    id: 'recursion',
    title: 'Recursion Tree',
    description: 'See how recursive calls branch out and unwind with a call-stack visualization.',
    path: '/recursion',
    icon: Workflow,
    color: '#a855f7',
    tags: ['Call Stack', 'Divide & Conquer'],
  },
]
