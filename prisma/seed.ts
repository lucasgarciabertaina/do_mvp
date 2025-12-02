import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const FIRST_EVENT_ID = process.env.FIRST_EVENT_ID || 'default_event_id'
import usersSeed from './users.json';


// --- FECHAS DE VOTACIÓN DE EJEMPLO ---
// Usaremos estas fechas para simular las opciones disponibles.
const VOTE_DATE_OPTION_1 = new Date('2025-11-20T20:00:00.000Z'); // Jueves
const VOTE_DATE_OPTION_2 = new Date('2025-11-21T20:00:00.000Z'); // Viernes
const VOTE_DATE_OPTION_3 = new Date('2025-11-22T20:00:00.000Z'); // Sábado
// ------------------------------------


async function main() {
    console.log('Seeding users...')
    // 1. Crear/Actualizar Usuarios
    for (const u of usersSeed) {
        await prisma.user.upsert({
            where: { username: u.username },
            update: {},
            create: {
                username: u.username,
                password: u.password,
                direction: u.direction,
                name: u.name,
            }
        })
    }
    
    const users = await prisma.user.findMany()

    const userAdmin = users.find(u => u.username === 'admin');
    if (!userAdmin) {
        throw new Error('Admin user not found')
    }
    
    // 2. Crear/Actualizar Evento
    const event = await prisma.event.upsert({
        where: { id: FIRST_EVENT_ID },
        update: {},
        create: {
            id: FIRST_EVENT_ID,
            ownerId: userAdmin.id,
            buyerId: userAdmin.id,
            date: new Date('2025-11-19T20:00:00.000Z'), // Fecha por defecto: Martes
        }
    })

    // 3. Crear Reservas
    for (const u of users) {
        await prisma.reservation.upsert({
            where: { eventId_userId: { eventId: event.id, userId: u.id } },
            update: {},
            create: {
                eventId: event.id,
                userId: u.id,
                // Ejemplo: Confirmar asistencia para Cacho y Juan
                status: (u.username === 'cacho' || u.username === 'juan') ? 'CONFIRMED' : 'PENDING',
            }
        })
    }
    
    console.log('Reservations seeded successfully.')


    // 4. Crear Opciones de Fecha (DateOption) para el evento
    const dateOptionsData = [
        { date: VOTE_DATE_OPTION_1, label: 'Jueves' },
        { date: VOTE_DATE_OPTION_2, label: 'Viernes' },
        { date: VOTE_DATE_OPTION_3, label: 'Sábado' },
    ];

    const createdDateOptions = [];
    for (const option of dateOptionsData) {
        const createdOption = await prisma.dateOption.upsert({
            where: { 
                eventId_date: { 
                    eventId: event.id, 
                    date: option.date 
                } 
            },
            update: { date: option.date },
            create: {
                eventId: event.id,
                date: option.date,
            }
        });
        createdDateOptions.push(createdOption);
    }
    console.log(`${createdDateOptions.length} DateOptions created for the event.`)

    // 5. Crear Votos de Fecha (DateVote) - SOLO PEDRO VOTA
    const option3Id = createdDateOptions.find(opt => opt.date.getTime() === VOTE_DATE_OPTION_3.getTime())?.id;

    const userMondi = users.find(u => u.username === 'mondi');
    
    console.log("userMondi", userMondi);
    console.log("option3Id", option3Id);
    if (userMondi && option3Id) {
        // Pedro vota por la Opción 3 (Sábado)
        await prisma.dateVote.upsert({
            where: { eventId_userId: { eventId: event.id, userId: userMondi.id } },
            update: { dateOptionId: option3Id },
            create: {
                eventId: event.id,
                userId: userMondi.id,
                dateOptionId: option3Id,
            }
        });
    } else {
        console.log('Mondi user or Option 3 not found. Skipping Mondi\'s vote.');
    }

    console.log('DateVotes seeded successfully: 1 vote total (by Mondi for Option 3).')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
