export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  requirements: string[];
  acceptanceCriteria: string[];
  impact: string;
  affectedUsers: string;
  storyPoints: number;
  assignee: string;
  dueDate: string;
  artifacts: {
    serviceAffected: string;
    rootCause: string;
    estimatedImpact: string;
  };
}

export const currentTask: Task = {
  id: 'INC-4029',
  title: 'Fix Memory Leak in Ad-Service',
  description: 'The ad-service is consuming unlimited memory causing the process to crash after ~1 hour. This is blocking 10% of users from completing checkout.',
  status: 'in-progress',
  priority: 'p0',
  requirements: [
    'Identify the source of memory accumulation',
    'Implement proper cleanup mechanism',
    'Verify memory stays below 512MB after 1 hour',
    'Add monitoring to prevent regression',
  ],
  acceptanceCriteria: [
    'Service runs for 1+ hour without OOM crash',
    'Heap memory remains stable (<512MB)',
    'Code is reviewed and approved by senior dev',
    'Tests validate the fix',
  ],
  impact: 'CRITICAL - Service Down',
  affectedUsers: 'North America region, ~150K users, checkout flow blocked',
  storyPoints: 5,
  assignee: 'You (Junior Dev)',
  dueDate: '2026-03-30',
  artifacts: {
    serviceAffected: 'ad-service',
    rootCause: 'Data accumulation in global array without cleanup',
    estimatedImpact: '$50K/hour revenue loss',
  },
};

export const dependencies = [
  {
    name: 'ad-service',
    status: 'CRITICAL',
    depends: ['cache-layer', 'payment-api'],
    dependents: ['checkout-service', 'analytics'],
    owner: 'You',
    color: 'red',
  },
  {
    name: 'payment-api',
    status: 'healthy',
    depends: ['fraud-detector'],
    dependents: ['ad-service', 'order-service'],
    owner: 'Payments Team',
    color: 'green',
  },
  {
    name: 'cache-layer',
    status: 'healthy',
    depends: [],
    dependents: ['ad-service', 'search-service'],
    owner: 'Infrastructure',
    color: 'green',
  },
  {
    name: 'checkout-service',
    status: 'degraded',
    depends: ['ad-service', 'payment-api'],
    dependents: [],
    owner: 'Checkout Team',
    color: 'yellow',
  },
];
