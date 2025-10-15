'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mockOccurrences, mockRsvps, mockUsers } from '@/lib/mockData'

interface Expense {
  id: string
  description: string
  amount: number
  user: { name: string } | null
  createdAt: Date
}

interface Message {
  id: string
  content: string
  user: { name: string } | null
  createdAt: Date
}

export default function HomePage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newExpenseDesc, setNewExpenseDesc] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const occurrence = mockOccurrences[0]
  
  // Get RSVPs with user info
  const rsvpsWithUsers = mockRsvps.map(rsvp => {
    const user = mockUsers.find(u => u.id === rsvp.userId)
    return {
      ...rsvp,
      userName: user?.name || 'Unknown',
    }
  })

  useEffect(() => {
    fetchExpenses()
    fetchMessages()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpenseDesc || !newExpenseAmount) return

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newExpenseDesc,
          amount: newExpenseAmount,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setExpenses([...expenses, data])
        setNewExpenseDesc('')
        setNewExpenseAmount('')
      }
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const confirmedCount = rsvpsWithUsers.filter(r => r.status === 'confirmed').length
  const perPerson = confirmedCount > 0 ? totalExpenses / confirmedCount : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Peña</h1>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Owner</p>
              <p className="font-semibold text-gray-900">
                {mockUsers.find(u => u.id === occurrence.ownerId)?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(occurrence.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-semibold text-gray-900">{occurrence.time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Place</p>
              <p className="font-semibold text-gray-900">{occurrence.place}</p>
            </div>
          </div>
          {occurrence.buyer && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Buyer</p>
              <p className="font-semibold text-gray-900">{occurrence.buyer}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RSVP List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">RSVP List</h2>
            <div className="space-y-3">
              {rsvpsWithUsers.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <span className="font-medium text-gray-900">{rsvp.userName}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      rsvp.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : rsvp.status === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {rsvp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Expenses</h2>
            
            {/* Add Expense Form */}
            <form onSubmit={handleAddExpense} className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Description"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  step="0.01"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Expense List */}
            <div className="space-y-2 mb-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-600">{expense.user?.name}</p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total:</span>
                <span>${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Per person ({confirmedCount} confirmed):</span>
                <span>${perPerson.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Chat</h2>
          
          {/* Messages */}
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900">{message.user?.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700">{message.content}</p>
              </div>
            ))}
          </div>

          {/* Send Message Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
