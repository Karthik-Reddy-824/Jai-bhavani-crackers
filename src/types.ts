export type ProductCategory =
  | 'Flower Pots'
  | 'Ground Chakkars'
  | 'Sparklers'
  | 'Rockets'
  | 'Kids Special'
  | 'Fancy'
  | 'Big Sounds'
  | 'Local Desi Special'
  | 'Walas (Laadi)'
  | 'Shots'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  size?: string
  packSize?: string
  price: number | null
  variationPrices?: Record<string, number>
  image?: string
  imageAlt?: string
  variations?: string[]
}

export interface ShopLocation {
  id: string
  name: string
  area: string
  address: string
  phone: string
  whatsapp: string
  hours: string
  mapUrl?: string
}

export function getShopDirectionsUrl(shop: Pick<ShopLocation, 'address' | 'mapUrl'>) {
  return shop.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.address}, Hyderabad`)}`
}

export function formatPhone(digits: string) {
  const clean = digits.replace(/\D/g, '')
  return clean.length === 12 && clean.startsWith('91')
    ? `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`
    : `+${clean}`
}

export interface BasketItem {
  kind?: 'product'
  productId: string
  variation?: string
  quantity: number
}

export interface ComboBasketItem {
  kind: 'combo'
  comboId: string
  quantity: number
}

export type BasketEntry = BasketItem | ComboBasketItem
export type Basket = Record<string, BasketEntry>

export interface ComboContentItem {
  product: string
  quantity: number
}

export interface ComboOffer {
  id: string
  name: string
  price: number
  image: string
  imageAlt: string
  contents: ComboContentItem[]
}

export function getBasketLineId(productId: string, variation?: string) {
  return `${productId}::${variation ?? ''}`
}

export function getProductPrice(product: Pick<Product, 'price' | 'variationPrices'>, variation?: string) {
  return variation ? product.variationPrices?.[variation] ?? product.price : product.price
}
