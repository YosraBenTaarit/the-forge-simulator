export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'away';
  expertise: string[];
  personality: string;
  avatar: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: 'sarah',
    name: 'Sarah',
    role: 'Senior Dev',
    status: 'available',
    expertise: ['backend', 'nodejs', 'architecture', 'debugging'],
    personality: 'Patient but expects you to think. Asks counter-questions. Won\'t give the answer directly.',
    avatar: '👩‍💼',
  },
  {
    id: 'mike',
    name: 'Mike',
    role: 'DevOps/Infra',
    status: 'available',
    expertise: ['monitoring', 'performance', 'memory', 'logs', 'deployment'],
    personality: 'Direct and practical. Speaks in metrics and numbers. No fluff.',
    avatar: '👨‍🔧',
  },
  {
    id: 'lisa',
    name: 'Lisa',
    role: 'Tech Lead',
    status: 'busy',
    expertise: ['architecture', 'design', 'strategy', 'planning', 'best-practices'],
    personality: 'High-level thinker. Asks you to zoom out. Focused on the big picture.',
    avatar: '👩‍💻',
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'Junior Developer (+1)',
    status: 'available',
    expertise: ['debugging', 'trial-and-error', 'logs', 'nodejs'],
    personality: 'Sympathetic peer. Been stuck on similar issues. Gives hints instead of answers.',
    avatar: '👨‍💻',
  },
];
