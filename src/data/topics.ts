import {
  ArrowUpDown,
  GitBranch,
  ListOrdered,
  Network,
  Search,
  SquareStack,
  Hash,
  Route,
  GitMerge,
  Binary as TreeBinary,
  Brackets,
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

export interface Section {
  id: string
  title: string
  topics: Topic[]
}

export const sections: Section[] = [
  {
    id: 'linear',
    title: '1. Linear Data Structures',
    topics: [
      {
        id: 'linear-lists',
        title: 'Lists & Linked Lists',
        description: 'List, Singly Linked List, Doubly Linked List, and Circular Linked List with insert/delete operations.',
        path: '/linear-lists',
        icon: ListOrdered,
        color: '#ec4899',
        tags: ['List', 'Singly', 'Doubly', 'Circular'],
      },
      {
        id: 'stack-queue',
        title: 'Stacks & Queues',
        description: 'Stack, Queue, Deque, and Priority Queue with core operations and visual flow.',
        path: '/stack-queue',
        icon: SquareStack,
        color: '#06b6d4',
        tags: ['Stack', 'Queue', 'Deque', 'Priority Queue'],
      },
    ],
  },
  {
    id: 'trees',
    title: '2. Trees',
    topics: [
      {
        id: 'tree-fundamentals',
        title: 'Tree Fundamentals & Types',
        description: 'Explore Tree, Binary Tree, Full, Complete, and Perfect Binary Tree structures.',
        path: '/tree-fundamentals',
        icon: GitBranch,
        color: '#22c55e',
        tags: ['Binary Tree', 'Full', 'Complete', 'Perfect'],
      },
      {
        id: 'binary-tree-ops',
        title: 'Binary Tree Ops & Traversals',
        description: 'Insertion, deletion, and Inorder/Preorder/Postorder traversals on a binary tree.',
        path: '/binary-tree-ops',
        icon: TreeBinary,
        color: '#10b981',
        tags: ['Insert/Delete', 'Inorder', 'Preorder', 'Postorder'],
      },
      {
        id: 'avl-tree',
        title: 'AVL Tree',
        description: 'Self-balancing BST with insertions, deletions, and LL/RR/LR/RL rotations.',
        path: '/avl-tree',
        icon: GitMerge,
        color: '#84cc16',
        tags: ['Balanced', 'Rotations', 'BST'],
      },
      {
        id: 'expression-tree',
        title: 'Expression Tree',
        description: 'Build expression trees from inorder, preorder, and postorder traversals/expressions.',
        path: '/expression-tree',
        icon: Brackets,
        color: '#14b8a6',
        tags: ['Expression', 'Traversals', 'Build'],
      },
    ],
  },
  {
    id: 'graphs',
    title: '3. Graphs',
    topics: [
      {
        id: 'graph-traversal',
        title: 'Graph Traversals (BFS/DFS)',
        description: 'Breadth-First Search and Depth-First Search on interactive graphs.',
        path: '/graph-traversal',
        icon: Network,
        color: '#3b82f6',
        tags: ['BFS', 'DFS', 'Graph'],
      },
      {
        id: 'mst',
        title: 'Minimum Spanning Tree',
        description: 'Prim’s and Kruskal’s algorithms for building minimum spanning trees.',
        path: '/mst',
        icon: GitMerge,
        color: '#6366f1',
        tags: ["Prim's", "Kruskal's", 'MST'],
      },
      {
        id: 'shortest-path',
        title: 'Shortest Path & Connectivity',
        description: 'Dijkstra, Floyd-Warshall, and Warshall algorithms visualized step by step.',
        path: '/shortest-path',
        icon: Route,
        color: '#0ea5e9',
        tags: ['Dijkstra', 'Floyd-Warshall', 'Warshall'],
      },
    ],
  },
  {
    id: 'sorting',
    title: '4. Sorting Algorithms',
    topics: [
      {
        id: 'sorting',
        title: 'Sorting Algorithms',
        description: 'Selection, Insertion, Quick, Merge, and Heap Sort (Min/Max Heap) with step-by-step animation.',
        path: '/sorting',
        icon: ArrowUpDown,
        color: '#8b5cf6',
        tags: ['Selection', 'Insertion', 'Quick', 'Merge', 'Heap'],
      },
    ],
  },
  {
    id: 'searching-hashing',
    title: '5. Searching & Hashing',
    topics: [
      {
        id: 'searching',
        title: 'Searching',
        description: 'Linear Search and Binary Search with step-by-step pointer movement.',
        path: '/searching',
        icon: Search,
        color: '#f97316',
        tags: ['Linear', 'Binary', 'Arrays'],
      },
      {
        id: 'hashing',
        title: 'Hashing',
        description: 'Hash functions, hash tables, collisions, and collision resolution strategies.',
        path: '/hashing',
        icon: Hash,
        color: '#eab308',
        tags: ['Hash Table', 'Collision', 'Chaining', 'Probing'],
      },
    ],
  },
]

export const topics: Topic[] = sections.flatMap(s => s.topics)
