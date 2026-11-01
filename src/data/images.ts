// Pexels photos are linked directly from images.pexels.com rather than bundled.
// Sources are listed in public/images/README.md.
export function pexelsImage(id: number, size = 900) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${size}&h=${size}&fit=crop`
}
