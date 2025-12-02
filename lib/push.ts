import * as webpush from 'web-push'
import prisma from '@/lib/prisma'

// 1. **Tipo auxiliar** para los datos mínimos que necesitamos de Prisma
// (Asumiendo que así se ve el resultado de tu consulta select)
interface PushSubscriptionPrisma {
  endpoint: string
  p256dh: string
  auth: string
  // Agregamos userId y otras propiedades si son necesarias para el filtro/retorno
  userId?: string 
}

// 2. **Función de mapeo** para convertir el tipo de Prisma al tipo esperado por web-push
const mapToWebPushSubscription = (s: PushSubscriptionPrisma): webpush.PushSubscription => ({
  endpoint: s.endpoint,
  // La librería web-push espera la estructura 'keys'
  keys: {
    p256dh: s.p256dh,
    auth: s.auth
  }
  // No incluimos 'expirationTime' si no lo guardas en la DB, web-push lo permite omitir.
});

// Configuración de las credenciales VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

/**
 * Envía una notificación push a todas las suscripciones de un usuario.
 * Elimina las suscripciones que fallen (expiradas).
 * * @param userId El ID del usuario.
 * @param payload El contenido de la notificación (objeto JSON).
 * @returns Un objeto con el recuento de notificaciones enviadas y eliminadas.
 */
export async function pushToUser(userId: string, payload: any) {
  // Aseguramos que la consulta traiga los campos necesarios
  const subs = await prisma.pushSubscription.findMany({ 
    where: { userId },
    select: { endpoint: true, p256dh: true, auth: true, userId: true } as any // 'as any' solo para evitar error de tipado de prisma si no mapea
  })
  
  if (!subs.length) return { sent: 0, removed: 0 }

  const json = JSON.stringify(payload)
  const bad: string[] = []

  // Usamos el mapeo para tipar la suscripción correctamente
  const results = await Promise.allSettled(
    subs.map(s => webpush.sendNotification(
      mapToWebPushSubscription(s as unknown as PushSubscriptionPrisma), // <--- Tipado Limpio
      json
    ))
  )

  results.forEach((r, i) => { 
    // Los errores 404/410 indican suscripciones expiradas que deben eliminarse
    if (r.status === 'rejected' && (r.reason.statusCode === 404 || r.reason.statusCode === 410)) {
        bad.push(subs[i].endpoint) 
    }
  })
  
  if (bad.length) await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: bad } } })
  
  return { sent: subs.length - bad.length, removed: bad.length }
}

/**
 * Envía una notificación push a todas las suscripciones en la base de datos.
 * Elimina las suscripciones que fallen (expiradas).
 * * @param payload El contenido de la notificación (objeto JSON).
 * @returns Un objeto con el recuento de notificaciones enviadas y eliminadas.
 */
export async function broadcast(payload: any) {
  const subs = await prisma.pushSubscription.findMany({ select: { endpoint: true, p256dh: true, auth: true } as any })
  const json = JSON.stringify(payload)
  const bad: string[] = []
  
  // Usamos el mapeo para tipar la suscripción correctamente
  const results = await Promise.allSettled(
    subs.map(s => webpush.sendNotification(
      mapToWebPushSubscription(s as unknown as PushSubscriptionPrisma), // <--- Tipado Limpio
      json
    ))
  )
  
  results.forEach((r, i) => { 
    // Incluí la lógica de código de estado (404/410) para un manejo de errores más preciso
    if (r.status === 'rejected' && (r.reason.statusCode === 404 || r.reason.statusCode === 410)) {
        bad.push(subs[i].endpoint) 
    }
  })
  
  if (bad.length) await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: bad } } })
  
  return { sent: subs.length - bad.length, removed: bad.length }
}
