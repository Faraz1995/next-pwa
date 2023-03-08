export const bufferToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
export const base64ToBuffer = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

export const getPublicKey = async (rawId) => {
  const publicKeyArrayBuffer = await subtle.exportKey('spki', rawId)
  const publicKeyPem = arrayBufferToPem(publicKeyArrayBuffer, 'PUBLIC KEY')
  console.log(publicKeyPem)
}

export function arrayBufferToPem(arrayBuffer, label) {
  const base64 = arrayBufferToBase64(arrayBuffer)
  return (
    `-----BEGIN ${label}-----\n` +
    chunkString(base64, 64) +
    `\n-----END ${label}-----\n`
  )
}

function chunkString(str, length) {
  return str.match(new RegExp(`.{1,${length}}`, 'g')).join('\n')
}

function arrayBufferToBase64(arrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}