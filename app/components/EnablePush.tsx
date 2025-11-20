'use client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function EnablePush() {
  const enable = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta Push')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      alert('Permiso denegado')
      return
    }
    const reg = await navigator.serviceWorker.ready
    const resp = await fetch('/api/push/public-key')
    const { publicKey } = await resp.json()
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })
    alert('Notificaciones activadas')
  }

  return (
    <button
      onClick={enable}
      className="px-4 py-2 rounded-xl bg-black text-white"
    >
      Activar notificaciones
    </button>
  )
}
