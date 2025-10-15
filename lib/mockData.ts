// Mock data for development (used when DATABASE_URL is not configured)

export const mockUsers = [
  {
    id: 'user1',
    username: 'admin',
    password: 'admin', // In production, this should be hashed
    name: 'Admin User',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user2',
    username: 'lucas',
    password: 'lucas',
    name: 'Lucas García',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user3',
    username: 'maria',
    password: 'maria',
    name: 'María González',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

export const mockMembers = [
  { id: 'member1', userId: 'user1', name: 'Admin User', createdAt: new Date(), updatedAt: new Date() },
  { id: 'member2', userId: 'user2', name: 'Lucas García', createdAt: new Date(), updatedAt: new Date() },
  { id: 'member3', userId: 'user3', name: 'María González', createdAt: new Date(), updatedAt: new Date() },
]

export const mockOccurrences = [
  {
    id: 'occurrence1',
    ownerId: 'user1',
    date: new Date('2025-10-20'),
    time: '20:00',
    place: 'Casa de Lucas',
    buyer: 'Lucas García',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockRsvps = [
  {
    id: 'rsvp1',
    occurrenceId: 'occurrence1',
    userId: 'user1',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'rsvp2',
    occurrenceId: 'occurrence1',
    userId: 'user2',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'rsvp3',
    occurrenceId: 'occurrence1',
    userId: 'user3',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockExpenses = [
  {
    id: 'expense1',
    occurrenceId: 'occurrence1',
    userId: 'user1',
    description: 'Asado y bebidas',
    amount: 15000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'expense2',
    occurrenceId: 'occurrence1',
    userId: 'user2',
    description: 'Carbón',
    amount: 2500,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockMessages = [
  {
    id: 'message1',
    occurrenceId: 'occurrence1',
    userId: 'user1',
    content: '¡Hola a todos! La peña es el sábado.',
    createdAt: new Date('2025-10-15T10:00:00'),
    updatedAt: new Date('2025-10-15T10:00:00'),
  },
  {
    id: 'message2',
    occurrenceId: 'occurrence1',
    userId: 'user2',
    content: '¡Perfecto! Ahí estaré.',
    createdAt: new Date('2025-10-15T10:30:00'),
    updatedAt: new Date('2025-10-15T10:30:00'),
  },
  {
    id: 'message3',
    occurrenceId: 'occurrence1',
    userId: 'user3',
    content: 'Llevo postre 🍰',
    createdAt: new Date('2025-10-15T11:00:00'),
    updatedAt: new Date('2025-10-15T11:00:00'),
  },
]
