'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { mockUsers } from '@/lib/mockData' // Asegúrate de que esta ruta sea correcta

// --- INTERFACES ---
interface Expense {
    id: string
    description: string
    amount: number
    userId?: string
    user: { name: string } | null
    createdAt: string
}

interface Message {
    id: string
    content: string
    user: { name: string } | null
    createdAt: string
}

interface DateOption {
    id: string // ID de la DateOption en Prisma
    date: string // La fecha candidata (ISO string)
}

interface DateVote {
    id: string
    dateOptionId: string // Referencia al ID de la opción votada
    userId: string
    createdAt: string
}

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED'

interface DoEvent {
    id: string
    ownerId: string
    buyerId: string | null
    date: string // Fecha por defecto/confirmada
    createdAt: string
    updatedAt: string
    owner?: { name?: string; direction?: string } | null
    buyer?: { name?: string } | null
    dateOptions?: DateOption[] // Opciones de fecha disponibles
}

interface Reservation {
    id: string
    eventId: string
    userId: string
    user: { name: string } | null
    status: ReservationStatus
    createdAt: string
    updatedAt: string
}

interface User {
    id: string
    name: string
}

// --- HELPERS ---

/**
 * Genera opciones para el fetch que fuerzan a no usar caché.
 * Se recomienda encarecidamente revisar la API Route del lado del servidor
 * para que también devuelva Cache-Control: no-store.
 */
const nocache = (): RequestInit => ({
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
})

const normalizeReservations = (list: Reservation[]): Reservation[] =>
    list.map((r) => ({ ...r, status: String(r.status).toUpperCase() as ReservationStatus }))

// Formatear una fecha ISO para la interfaz de usuario (ej: Mié. 20 Nov)
const formatDateLabel = (dateString: string): string => {
    const date: Date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    }).replace('.', '') // Eliminar el punto al final del mes/día
}

// Formatear la hora
const formatTime = (dateString: string): string => {
    const date: Date = new Date(dateString)
    return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}

// Formatear solo la fecha sin hora para detalles
const formatDate = (dateString: string): string => {
    const date: Date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
    })
}

// --- COMPONENTE PRINCIPAL ---

export default function HomePage() {
    const router = useRouter()
    const [doEvent, setDoEvent] = useState<DoEvent | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [dateOptions, setDateOptions] = useState<DateOption[]>([])
    const [dateVotes, setDateVotes] = useState<DateVote[]>([])

    const [newExpenseDesc, setNewExpenseDesc] = useState('')
    const [newExpenseAmount, setNewExpenseAmount] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState<boolean>(true)

    const [votingOpen, setVotingOpen] = useState<boolean>(false)
    const [votingTimeLeftSec, setVotingTimeLeftSec] = useState<number | null>(null)
    // --- FETCHERS (Usamos useCallback para estabilidad en dependencias de useEffect) ---
    // Nota: añadimos credentials: 'same-origin' cuando la API usa cookies

    const fetchDoEvent = useCallback(async (): Promise<void> => {
        const url: string = `/api/event?ts=${Date.now()}`
        try {
            setLoading(true)
            const response: Response = await fetch(url, { ...nocache(), credentials: 'same-origin' })
            if (response.ok) {
                const data: DoEvent = await response.json()
                setDoEvent(data)
                setDateOptions(data.dateOptions || [])
            } else {
                setDoEvent(null)
            }
        } catch (error) {
            console.error('Error al obtener evento:', error)
            setDoEvent(null)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchExpenses = useCallback(async (eventId: string): Promise<void> => {
        try {
            const res: Response = await fetch(`/api/event/${eventId}/expenses?ts=${Date.now()}`, {
                ...nocache(),
                credentials: 'same-origin',
            })
            if (res.ok) {
                const data: Expense[] = await res.json()
                setExpenses(data)
            }
        } catch (error) {
            console.error('Error al obtener gastos:', error)
        }
    }, [])

    const fetchReservations = useCallback(async (eventId: string): Promise<void> => {
        try {
            const res: Response = await fetch(`/api/event/${eventId}/reservations?ts=${Date.now()}`, {
                ...nocache(),
                credentials: 'same-origin',
            })
            if (res.ok) {
                const data: Reservation[] = await res.json()
                setReservations(normalizeReservations(data))
            }
        } catch (error) {
            console.error('Error al obtener reservas:', error)
        }
    }, [])

    const fetchMessages = useCallback(async (eventId: string): Promise<void> => {
        try {
            const res: Response = await fetch(`/api/messages/${eventId}?ts=${Date.now()}`, {
                ...nocache(),
                credentials: 'same-origin',
            })
            if (res.ok) {
                const data: Message[] = await res.json()
                setMessages(data)
            }
        } catch (error) {
            console.error('Error al obtener mensajes:', error)
        }
    }, [])

    const fetchDateVotes = useCallback(async (eventId: string): Promise<void> => {
        try {
            const res: Response = await fetch(`/api/event/${eventId}/datevotes?ts=${Date.now()}`, {
                ...nocache(),
                credentials: 'same-origin',
            })
            if (res.ok) {
                const data: DateVote[] = await res.json()
                setDateVotes(data)
            }
        } catch (error) {
            console.error('Error al obtener votos de fecha:', error)
        }
    }, [])

    // Refetch de TODO en paralelo
    const refreshAll = useCallback(async (eventId: string): Promise<void> => {
        await Promise.all([fetchExpenses(eventId), fetchReservations(eventId), fetchMessages(eventId), fetchDateVotes(eventId)])
    }, [fetchExpenses, fetchReservations, fetchMessages, fetchDateVotes])

    // --- USE EFFECTS ---

    // Efecto 1: Carga inicial del usuario y del evento
    useEffect(() => {
        try {
            const userString: string | null = localStorage.getItem('user')
            if (userString) {
                const userData: User = JSON.parse(userString)
                setUser(userData)
            }
        } catch (err) {
            console.warn('No se pudo parsear user en localStorage', err)
        }
        fetchDoEvent()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Efecto 2: Polling
    useEffect(() => {
        if (!doEvent?.id) return

        // Primer refetch de todo
        refreshAll(doEvent.id)

        // Polling solo de mensajes y votos (más ligeros)
        const id: NodeJS.Timeout = setInterval(() => {
            fetchMessages(doEvent.id)
            fetchDateVotes(doEvent.id)
        }, 2000)

        return () => clearInterval(id)
    }, [doEvent?.id, refreshAll, fetchMessages, fetchDateVotes])

    const getMondayStart = (refDate: Date, offsetWeeks: number = 0): Date => {
        const d: Date = new Date(refDate)
        const day: number = d.getDay() // 0=Dom, 1=Lun...
        // calcular diferencia para llevar al lunes (1)
        const diffToMonday: number = (day + 6) % 7 // si es lun (1)->0, mar(2)->1, dom(0)->6
        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() - diffToMonday + offsetWeeks * 7)
        return d
    }

    useEffect(() => {
        // updater que se corre cada segundo
        const tick = (): void => {
            const now: Date = new Date()
            // lunes de esta semana 00:00
            const mondayStart: Date = getMondayStart(now, 0)
            const votingStart: Date = mondayStart
            const votingEnd: Date = new Date(mondayStart.getTime() + 24 * 60 * 60 * 1000) // +24h

            if (now >= votingStart && now < votingEnd) {
                // ventana abierta
                setVotingOpen(true)
                setVotingTimeLeftSec(Math.max(0, Math.ceil((votingEnd.getTime() - now.getTime()) / 1000)))
            } else {
                // cerrada -> tiempo hasta el siguiente lunes 00:00
                setVotingOpen(false)
                // si ya pasó la ventana de esta semana -> siguiente lunes
                const nextMonday: Date = now < votingStart ? votingStart : getMondayStart(now, 1)
                setVotingTimeLeftSec(Math.max(0, Math.ceil((nextMonday.getTime() - now.getTime()) / 1000)))
            }
        }

        tick()
        const id: NodeJS.Timeout = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])

    // --- ACTIONS ---

    const handleLogout = async (): Promise<void> => {
        try {
            const res: Response = await fetch(`/api/auth/logout`, {
                method: 'POST',
                credentials: 'same-origin',
            })
            if (res.ok) {
                localStorage.removeItem('user')
                router.push('/login')
                router.refresh()
            }
        } catch (error) {
            console.error('Error al deslogear', error)
        }
    }

    const isAdmin = (): boolean => user?.name === 'Cacho' || false

    const handleAddExpense = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        if (!doEvent?.id || !user?.id || !newExpenseDesc || !newExpenseAmount) return

        const amountNum: number = parseFloat(newExpenseAmount)
        if (isNaN(amountNum) || amountNum <= 0) return

        const tempId: string = `temp-${Date.now()}`
        const newExpense: Expense = {
            id: tempId,
            description: newExpenseDesc,
            amount: amountNum,
            userId: user.id,
            user: { name: user.name },
            createdAt: new Date().toISOString(),
        }

        // Optimistic Update
        setExpenses(prev => [...prev, newExpense])
        setNewExpenseDesc('')
        setNewExpenseAmount('')

        try {
            const res: Response = await fetch(`/api/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: doEvent.id, description: newExpense.description, amount: amountNum, userId: user.id }),
                credentials: 'same-origin',
            })

            if (res.ok) {
                await fetchExpenses(doEvent.id) // Refetch para datos reales
            } else {
                throw new Error('Error al agregar gasto')
            }
        } catch (error) {
            console.error('Error al agregar gasto:', error)
            // Rollback
            setExpenses(prev => prev.filter((exp: Expense) => exp.id !== tempId))
            alert('Fallo al agregar gasto. Intente nuevamente.')
        }
    }

    const handleDelete = async (expenseId: string): Promise<void> => {
        if (!doEvent?.id || (!isAdmin() && expenses.find((e: Expense) => e.id === expenseId)?.userId !== user?.id)) return

        const previousExpenses: Expense[] = expenses
        // Optimistic Update: Eliminar
        setExpenses(prev => prev.filter((exp: Expense) => exp.id !== expenseId))

        try {
            const res: Response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            })

            if (res.ok) {
                // opcional: fetchExpenses(doEvent.id)
            } else {
                throw new Error('Error al eliminar gasto')
            }
        } catch (error) {
            console.error('Error al eliminar gasto:', error)
            // Rollback
            setExpenses(previousExpenses)
            alert('Fallo al eliminar gasto. Intente nuevamente.')
        }
    }

    const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        if (!doEvent?.id || !user?.id || !newMessage) return

        const tempId: string = `temp-${Date.now()}`
        const newMessageObj: Message = {
            id: tempId,
            content: newMessage,
            user: { name: user.name },
            createdAt: new Date().toISOString(),
        }

        // Optimistic Update
        setMessages(prev => [...prev, newMessageObj])
        setNewMessage('')

        try {
            const res: Response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: doEvent.id, content: newMessageObj.content, userId: user.id }),
                credentials: 'same-origin',
            })

            if (res.ok) {
                await fetchMessages(doEvent.id)
            } else {
                throw new Error('Error al enviar mensaje')
            }
        } catch (error) {
            console.error('Error al enviar mensaje:', error)
            // Rollback
            setMessages(prev => prev.filter((msg: Message) => msg.id !== tempId))
            alert('Fallo al enviar mensaje.')
        }
    }

    const updateReservationStatus = async (reservationId: string, newStatus: ReservationStatus): Promise<void> => {
        if (!doEvent?.id) return

        const previousReservations: Reservation[] = reservations
        // Optimistic Update: Actualizar estado en el frontend
        setReservations(prev =>
            prev.map((r: Reservation) => r.id === reservationId ? { ...r, status: newStatus } : r)
        )

        try {
            const res: Response = await fetch(`/api/reservations/${reservationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'same-origin',
            })

            if (res.ok) {
                await fetchReservations(doEvent.id)
            } else {
                throw new Error('Error al actualizar reserva')
            }
        } catch (error) {
            console.error('Error al actualizar reserva:', error)
            // Rollback
            setReservations(previousReservations)
            alert('Fallo al actualizar reserva.')
        }
    }

    const handleVoteForDate = async (dateOptionId: string): Promise<void> => {
        console.log("Hi", dateOptionId)
        if (!doEvent?.id || !user?.id) return
        const votedOption: DateOption | undefined = dateOptions.find((opt: DateOption) => opt.id === dateOptionId)
        if (!votedOption) return
        console.log("Voted option:", votedOption)
        const tempId: string = `temp-${Date.now()}`
        const previousVotes: DateVote[] = dateVotes
        const newVotes: DateVote[] = [
            ...previousVotes.filter((v: DateVote) => v.userId !== user.id),
            { id: tempId, dateOptionId, userId: user.id, createdAt: new Date().toISOString() }
        ]
        // Optimistic Update: Elimina el voto anterior del usuario y añade el nuevo
        setDateVotes(newVotes)

        try {
            const res: Response = await fetch('/api/datevotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: doEvent.id, dateOptionId }),
                credentials: 'same-origin',
                // cache control to hint intermediaries
                cache: 'no-store',
            })
            console.log('Vote response:', res)
            if (res.ok) {
                // Refetch inmediato y determinista para evitar depender solo del polling
                await fetchDateVotes(doEvent.id)
                const votes: Record<string, number> = {}
                newVotes.forEach((vote: DateVote) => {
                    votes[vote.dateOptionId] = (votes[vote.dateOptionId] || 0) + 1
                });

                console.log('Votes tally after voting:', votes)

                // check if there is a new winning option
                let winningOption: string | null = null
                let maxVotes: number = -1
                for (const [optionId, votesOfOption] of Object.entries(votes)) {
                    console.log('Checking option:', optionId, 'with votes:', votesOfOption)
                    const count: number = votesOfOption
                    if (count >= maxVotes) {
                        if (count === maxVotes) {
                            winningOption = null
                        } else {
                            console.log('New max votes found:', count, 'for option:', optionId)
                            maxVotes = count
                            winningOption = optionId
                        }
                    }
                }
                console.log('Winning option after vote:', winningOption)
                console.log('Voted option:', votedOption)
                console.log('dateOptionId:', dateOptionId)
                console.log(votedOption.id)
                if (winningOption && winningOption === votedOption.id) {
                    console.log('New winning option:', winningOption)
                    // alert(`¡La fecha ${formatDateLabel(votedOption.date)} es la nueva fecha ganadora!`)
                    await handleUpdateDoEvent({ date: votedOption.date })
                }
            } else {
                throw new Error('No se pudo registrar el voto')
            }
        } catch (error) {
            console.error('Error al votar por fecha:', error)
            setDateVotes(previousVotes) // Rollback si falla
            // alert('Fallo al votar por la fecha.')
        }
    }


    const handleUpdateDoEvent = async ({ date }: { date: string }): Promise<void> => {
        if (!doEvent?.id) return

        console.log('Updating event date to:', date)
        // Optimistic Update (aunque luego se hace refetch)
        setDoEvent({ ...doEvent, date })

        try {
            const res: Response = await fetch(`/api/event/${doEvent.id}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...doEvent, date }),
            })

            if (res.ok) {
                await fetchDoEvent()
            } else {
                throw new Error('Error al actualizar fecha del evento')
            }
        } catch (error) {
            console.error(error)
            // setExpenses(previousExpenses) // No es necesario rollback aquí ya que no hay estado guardado en el componente de fecha
            // alert('Fallo al eliminar gasto. Intente nuevamente.')
        }
    }

    // --- DERIVADOS ---
    const rsvpsWithUsers = reservations.map((rsvp: Reservation) => {
        const u: {name: string} | User | undefined | null = rsvp.user || mockUsers.find((u: User) => u.id === rsvp.userId)
        return {
            ...rsvp,
            userName: u ? u.name : 'Usuario desconocido',
        }
    })

    const totalExpenses: number = expenses.reduce((sum: number, expense: Expense) => sum + Number(expense.amount || 0), 0)
    const confirmedCount: number = rsvpsWithUsers.filter((r: Reservation & { userName: string }) => r.status === 'CONFIRMED').length
    const perPerson: number = confirmedCount > 0 ? totalExpenses / confirmedCount : 0

    // Datos derivados para la votación
    const votesByOption = useMemo(() => {
        // 1. Contar votos por dateOptionId
        const counts: Record<string, number> = dateVotes.reduce((acc: Record<string, number>, vote: DateVote) => {
            acc[vote.dateOptionId] = (acc[vote.dateOptionId] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // 2. Encontrar el voto del usuario actual
        const userVoteOptionId: string | undefined = dateVotes.find((v: DateVote) => v.userId === user?.id)?.dateOptionId

        // 3. Mapear las DateOptions con los votos contados
        return dateOptions.map((option: DateOption) => ({
            ...option,
            label: formatDateLabel(option.date),
            votes: counts[option.id] || 0,
            userHasVoted: option.id === userVoteOptionId
        }))
    }, [dateOptions, dateVotes, user?.id])

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  // Manejar el caso si no hay evento asignado después de cargar
  if (!doEvent) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <h1 className="text-2xl font-bold mb-4 text-red-600">⚠️ Error de Carga</h1>
                  <p className="text-gray-700">No se pudo cargar el evento o no tienes uno asignado.</p>
                  <button
                      onClick={handleLogout}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                      Volver
                  </button>
              </div>
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
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1: Event Details & Date Voting */}
          <div className="lg:col-span-1 space-y-6">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Detalles del evento</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Organizador</p>
                  <p className="font-semibold text-gray-900">{doEvent?.owner?.name || 'Desconocido'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lugar</p>
                  <p className="font-semibold text-gray-900">{doEvent?.owner?.direction || 'Desconocido'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Fecha Actual</p>
                  <p className="text-xl font-bold text-blue-600">
                    {doEvent?.date ? `${formatDate(doEvent.date)} a las ${formatTime(doEvent.date)}` : '—'}
                  </p>
                </div>
              </div>
              {doEvent?.buyerId && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm text-gray-600">Comprador</p>
                  <p className="font-semibold text-gray-900">{doEvent?.buyer?.name || 'Desconocido'}</p>
                </div>
              )}
            </div>

            {/* Date Voting Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">📅 Votación de Fecha</h2>
                  <p className="text-sm text-gray-600">Vota por la fecha que prefieras para cambiar el evento.</p>
                </div>

                <div className="text-right">
                  {votingTimeLeftSec != null && (
                    <>
                      {votingOpen ? (
                        <div className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded">
                          Quedan {Math.floor(votingTimeLeftSec / 3600)
                            .toString()
                            .padStart(2, '0')}:
                          {Math.floor((votingTimeLeftSec % 3600) / 60)
                            .toString()
                            .padStart(2, '0')}:
                          {(votingTimeLeftSec % 60).toString().padStart(2, '0')} para votar
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          Próxima votacion en {Math.floor(votingTimeLeftSec / 86400) > 0 ? `${Math.floor(votingTimeLeftSec / 86400)}d ` : ''}
                          {String(Math.floor((votingTimeLeftSec % 86400) / 3600)).padStart(2, '0')}:
                          {String(Math.floor((votingTimeLeftSec % 3600) / 60)).padStart(2, '0')}:
                          {String(votingTimeLeftSec % 60).padStart(2, '0')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {votesByOption.map((option) => (
                  <div
                    key={option.id} // Usamos el ID de la opción
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      option.userHasVoted
                        ? 'bg-blue-100 border-blue-500 shadow-md'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-600">{formatTime(option.date)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-700">{option.votes} votos</span>
                      <button
                        type="button"
                        onClick={() => handleVoteForDate(option.id)} // Pasamos el ID de la opción
                        disabled={option.userHasVoted}
                        className={`px-4 py-2 rounded-full text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          option.userHasVoted
                            ? 'bg-blue-600'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {option.userHasVoted ? 'Votado' : 'Votar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna 2: RSVP & Chat */}
          <div className="lg:col-span-1 space-y-6">
            {/* RSVP List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Lista de confirmados</h2>
              <div className="space-y-3">
                {rsvpsWithUsers.map((rsvp) => (
                  <div key={rsvp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium text-gray-900">{rsvp.userName}</span>
                      <span
                        className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                          rsvp.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : rsvp.status === 'DECLINED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {rsvp.status === 'CONFIRMED'
                          ? 'Confirmado'
                          : rsvp.status === 'DECLINED'
                          ? 'Rechazado'
                          : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {(isAdmin() || rsvp.userId === user?.id) && (
                        <div className="flex items-center gap-2">
                          {rsvp.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateReservationStatus(rsvp.id, 'CONFIRMED')}
                                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                                aria-label="Confirmar asistencia"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => updateReservationStatus(rsvp.id, 'DECLINED')}
                                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
                                aria-label="Desistir / Declinar"
                              >
                                Desistir
                              </button>
                            </>
                          )}

                          {(rsvp.status === 'CONFIRMED' || rsvp.status === 'DECLINED') && (
                            <button
                              type="button"
                              onClick={() => updateReservationStatus(rsvp.id, rsvp.status === 'CONFIRMED' ? 'DECLINED' : 'CONFIRMED')}
                              className={`px-3 py-1 rounded text-white transition-colors text-sm ${rsvp.status === 'CONFIRMED' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                              aria-label={rsvp.status === 'CONFIRMED' ? "Declinar asistencia" : "Confirmar asistencia"}
                            >
                              {rsvp.status === 'CONFIRMED' ? 'Cancelar' : 'Revertir'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Chat</h2>

              {/* Messages */}
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900">{message.user?.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
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
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>

          {/* Columna 3: Expenses */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Gastos</h2>

              {/* Add Expense Form */}
              <form onSubmit={handleAddExpense} className="mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Descripción"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Monto"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    step="0.01"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Agregar
                  </button>
                </div>
              </form>

              {/* Expense List */}
              <div className="space-y-2 mb-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="relative flex justify-between p-3 bg-gray-50 rounded-md">
                    {(expense.userId === user?.id || isAdmin()) && (
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.user?.name}</p>
                    </div>
                    <span className="font-semibold text-gray-900 mr-4">
                      ${Number(expense.amount).toFixed(2)}
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
                  <span>Por persona ({confirmedCount} confirmados):</span>
                  <span>${perPerson.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
