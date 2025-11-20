export const getCookie = (name: string): string | undefined => {
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
  return value ? decodeURIComponent(value.split('=')[1]) : undefined
}
