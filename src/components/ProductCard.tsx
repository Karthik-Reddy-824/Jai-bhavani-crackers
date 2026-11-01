import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { categories } from '../data/categories'
import { getBasketLineId, getProductPrice } from '../types'
import type { Basket, Product } from '../types'
import { trackOnce } from '../utils/analytics'

interface ProductCardProps {
  product: Product
  basket: Basket
  onChangeQuantity: (product: Product, variation: string | undefined, quantity: number) => void
}

export default function ProductCard({
  product,
  basket,
  onChangeQuantity,
}: ProductCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const [variation, setVariation] = useState(product.variations?.[0] ?? '')
  const [imageFailed, setImageFailed] = useState(false)
  const [fallbackImageFailed, setFallbackImageFailed] = useState(false)
  const selectedVariation = variation || undefined
  const quantity = basket[getBasketLineId(product.id, selectedVariation)]?.quantity ?? 0
  const unitPrice = getProductPrice(product, selectedVariation)
  const productDetails = [product.size, product.packSize].filter(Boolean).join(' · ')
  const categoryConfig = categories.find((category) => category.name === product.category)
  const image = product.image ?? categoryConfig?.image
  const fallbackImage = product.image ? categoryConfig?.image : undefined
  const displayedImage = imageFailed
    ? fallbackImage && !fallbackImageFailed ? fallbackImage : undefined
    : image

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const trackProductView = () => trackOnce('view_item', product.id, {
      currency: 'INR',
      items: [{ item_id: product.id, item_name: product.name, item_category: product.category }],
    })

    if (!('IntersectionObserver' in window)) {
      trackProductView()
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        trackProductView()
        observer.disconnect()
      }
    }, { threshold: 0.35 })
    observer.observe(card)
    return () => observer.disconnect()
  }, [product])

  return (
    <article className="product-card" ref={cardRef}>
      <div className="product-image-wrap">
        {displayedImage ? (
          <img
            src={displayedImage}
            alt={imageFailed || !product.image
              ? categoryConfig?.imageAlt ?? `${product.category} category image`
              : product.imageAlt ?? `${product.name} product`}
            loading="lazy"
            decoding="async"
            onError={() => {
              if (imageFailed) setFallbackImageFailed(true)
              else setImageFailed(true)
            }}
          />
        ) : (
          <div className="product-image-placeholder" aria-label="Product image not provided"><span>IMAGE</span><strong>{product.name}</strong></div>
        )}
        <span className="product-category">{product.category}</span>
      </div>
      <div className="product-details">
        <div className="product-title-row">
          <h3>{product.name}</h3>
          <p className="product-price">{unitPrice === null ? 'Price on request' : `₹${unitPrice.toLocaleString('en-IN')}`}</p>
        </div>
        {productDetails && <div className="product-meta"><span>{productDetails}</span></div>}
        {product.variations && (
          <label className="product-variation">Variation
            <select value={variation} onChange={(event) => setVariation(event.target.value)} aria-label={`Choose variation for ${product.name}`}>
              {product.variations.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )}
        <div className="product-action">
          <span className="quantity-label">Quantity</span>
          {quantity === 0 ? (
            <button
              className="add-button"
              type="button"
              aria-label={`Add ${product.name} to enquiry basket`}
              onClick={() => onChangeQuantity(product, selectedVariation, 1)}
            >
              <Plus size={16} aria-hidden="true" />
              Add to basket
            </button>
          ) : (
            <div className="quantity-control" aria-label={`${quantity} ${product.name} selected`}>
              <button
                type="button"
                aria-label={`Remove one ${product.name}`}
                onClick={() => onChangeQuantity(product, selectedVariation, quantity - 1)}
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                aria-label={`Add one ${product.name}`}
                onClick={() => onChangeQuantity(product, selectedVariation, quantity + 1)}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
