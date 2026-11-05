// Shrinks a camera photo so it is cheap to send to the AI and small enough
// to store inside the Firestore document (well under the 1 MB doc limit).
export interface CompressedImage {
  dataUrl: string // "data:image/jpeg;base64,..." for <img src> and Firestore
  base64: string // raw base64 for the AI request
  mediaType: "image/jpeg"
  bytes: number
}

const MAX_SIDE = 800
const QUALITY = 0.72

export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.")
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Your browser can't process images.")

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY)
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)

  return {
    dataUrl,
    base64,
    mediaType: "image/jpeg",
    bytes: Math.round((base64.length * 3) / 4),
  }
}

// SHA-256 of the image, used to spot the same photo being reused
export async function hashImage(base64: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(base64)
  )
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
