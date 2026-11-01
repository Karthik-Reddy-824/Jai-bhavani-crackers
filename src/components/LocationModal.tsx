import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, MapPin, MessageCircle, Navigation, Phone, Truck, X } from 'lucide-react'
import { comboOffers } from '../data/comboOffers'
import { formatPhone, getProductPrice, getShopDirectionsUrl } from '../types'
import type { Basket, BasketItem, ComboBasketItem, ComboOffer, Product, ShopLocation } from '../types'
import { trackEvent } from '../utils/analytics'

interface LocationModalProps {
  locations: ShopLocation[]
  products: Product[]
  basket: Basket
  onSelectLocation: (shopLocation: string) => void
  onClose: () => void
}

type SelectedBasketLine =
  | { kind: 'product'; lineId: string; product: Product; item: BasketItem }
  | { kind: 'combo'; lineId: string; combo: ComboOffer; item: ComboBasketItem }

function resolveBasketLines(products: Product[], basket: Basket): SelectedBasketLine[] {
  return Object.entries(basket).flatMap<SelectedBasketLine>(([lineId, item]) => {
    if (item.quantity <= 0) return []
    if (item.kind === 'combo') {
      const combo = comboOffers.find((entry) => entry.id === item.comboId)
      return combo ? [{ kind: 'combo' as const, lineId, combo, item }] : []
    }
    const product = products.find((entry) => entry.id === item.productId)
    return product ? [{ kind: 'product' as const, lineId, product, item: { ...item, kind: 'product' as const } }] : []
  })
}

function buildMessage(lines: SelectedBasketLine[], total: number, hasUnpricedItems: boolean) {
  const hasCombos = lines.some((line) => line.kind === 'combo')
  const hasProducts = lines.some((line) => line.kind === 'product')
  const intro = hasCombos && !hasProducts
    ? 'I am interested in the following combo offer:'
    : 'I would like to enquire about these products and combo offers:'
  const messageLines = lines.flatMap((line) => {
    if (line.kind === 'combo') {
      return [
        `${line.combo.name} – ₹${line.combo.price.toLocaleString('en-IN')}`,
        `Quantity: ${line.item.quantity}`,
        'Included products:',
        ...line.combo.contents.map((entry) => `• ${entry.product} × ${entry.quantity}`),
        `Combo total: ₹${(line.combo.price * line.item.quantity).toLocaleString('en-IN')}`,
        '',
      ]
    }
    const details = [line.product.size, line.product.packSize].filter(Boolean).join(', ')
    const variation = line.item.variation ? ` - ${line.item.variation}` : ''
    const unitPrice = getProductPrice(line.product, line.item.variation)
    const price = unitPrice === null ? 'Price on request' : `₹${(unitPrice * line.item.quantity).toLocaleString('en-IN')}`
    return [`• ${line.product.name}${variation}${details ? ` (${details})` : ''} × ${line.item.quantity} — ${price}`]
  })

  return [
    'Hello Jai Bhavani Crackers!',
    '',
    intro,
    ...messageLines,
    '',
    `Estimated total: ${hasUnpricedItems ? (total > 0 ? `₹${total.toLocaleString('en-IN')} + price on request` : 'Price on request') : `₹${total.toLocaleString('en-IN')}`}`,
    '',
    'Please confirm availability and final prices. Thank you!',
  ].join('\n')
}

export default function LocationModal({
  locations,
  products,
  basket,
  onSelectLocation,
  onClose,
}: LocationModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<ShopLocation | null>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    dialogRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const selectedLines = resolveBasketLines(products, basket)
  const total = selectedLines.reduce((sum, line) => sum + (line.kind === 'combo'
    ? line.combo.price * line.item.quantity
    : (getProductPrice(line.product, line.item.variation) ?? 0) * line.item.quantity), 0)
  const hasUnpricedItems = selectedLines.some((line) => line.kind === 'product' && getProductPrice(line.product, line.item.variation) === null)
  const totalLabel = hasUnpricedItems
    ? total > 0 ? `₹${total.toLocaleString('en-IN')} + price on request` : 'Price on request'
    : `₹${total.toLocaleString('en-IN')}`

  function chooseLocation(location: ShopLocation) {
    setSelectedLocation(location)
    onSelectLocation(location.name)
    trackEvent('select_shop_location', { shop_location: location.name })
  }

  function openWhatsApp() {
    if (!selectedLocation?.whatsapp) return
    const message = buildMessage(selectedLines, total, hasUnpricedItems)
    const phone = selectedLocation.whatsapp.replace(/\D/g, '')
    const linkUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    const hasProducts = selectedLines.some((line) => line.kind === 'product')
    const hasCombos = selectedLines.some((line) => line.kind === 'combo')
    const enquiryType = hasProducts && !hasCombos ? 'product' : hasCombos && !hasProducts ? 'combo' : 'general'
    trackEvent('click_whatsapp', {
      shop_location: selectedLocation.name,
      button_location: 'shop card',
      link_url: linkUrl,
      enquiry_type: enquiryType,
    })
    window.open(
      linkUrl,
      '_blank',
      'noopener,noreferrer',
    )
  }

  function callShop() {
    if (!selectedLocation?.phone) return
    const phoneNumber = `+${selectedLocation.phone.replace(/\D/g, '')}`
    trackEvent('click_call', {
      shop_location: selectedLocation.name,
      button_location: 'shop card',
      phone_number: phoneNumber,
    })
    window.location.href = `tel:${phoneNumber}`
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className="location-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button className="modal-close icon-button" type="button" onClick={onClose} aria-label="Close location selection">
          <X size={20} />
        </button>
        {selectedLocation ? (
          <>
            <button className="back-link" type="button" onClick={() => setSelectedLocation(null)}>
              <ArrowLeft size={16} /> Choose a different shop
            </button>
            <div className="modal-eyebrow">YOUR NEAREST SHOP</div>
            <h2 id="location-title">{selectedLocation.name}</h2>
            <div className="selected-shop-info">
              <MapPin size={18} />
              <div>
                <strong>{selectedLocation.area}</strong>
                <span>{selectedLocation.address}</span>
                <span>Call: {selectedLocation.phone ? formatPhone(selectedLocation.phone) : 'Phone number not configured'}</span>
                <span>WhatsApp: {selectedLocation.whatsapp ? formatPhone(selectedLocation.whatsapp) : 'Number not configured'}</span>
                <span>{selectedLocation.hours}</span>
                <a className="directions-link" href={getShopDirectionsUrl(selectedLocation)} target="_blank" rel="noopener noreferrer">
                  <Navigation size={13} /> Get directions
                </a>
              </div>
            </div>
            <div className="basket-summary">
              <h3>Your enquiry · {selectedLines.length} {selectedLines.length === 1 ? 'item' : 'items'}</h3>
              {selectedLines.map((line) => line.kind === 'combo' ? (
                <div className="summary-row combo-summary-row" key={line.lineId}>
                  <span>
                    <strong>{line.combo.name} × {line.item.quantity}</strong>
                    <details className="combo-summary-contents">
                      <summary>View {line.combo.contents.length} included entries</summary>
                      <ul>{line.combo.contents.map((entry, index) => <li key={`${entry.product}-${index}`}>{entry.product} × {entry.quantity}</li>)}</ul>
                    </details>
                  </span>
                  <strong>₹{(line.combo.price * line.item.quantity).toLocaleString('en-IN')}</strong>
                </div>
              ) : (
                <div className="summary-row" key={line.lineId}>
                  <span>{line.product.name}{line.item.variation ? ` · ${line.item.variation}` : ''} · {[line.product.size, line.product.packSize].filter(Boolean).join(' · ') || line.product.category} × {line.item.quantity}</span>
                  <strong>{getProductPrice(line.product, line.item.variation) === null ? 'Price on request' : `₹${((getProductPrice(line.product, line.item.variation) ?? 0) * line.item.quantity).toLocaleString('en-IN')}`}</strong>
                </div>
              ))}
              <div className="summary-total">
                <span>Estimated total</span>
                <strong>{totalLabel}</strong>
              </div>
            </div>
            <p className="confirmation-note">
              Please confirm product availability and final prices directly with the shop.
              Sending an enquiry does not place or complete an order.
            </p>
            <p className="negotiable-enquiry-note">
              Have a price in mind? Contact us – we&apos;re happy to discuss the best possible deal.
            </p>
            <p className="delivery-enquiry-note">
              <Truck size={16} aria-hidden="true" />
              <span>Interested in home delivery? Contact this store to check availability in your area.</span>
            </p>
            <div className="contact-actions">
              {selectedLocation.phone ? (
                <button className="button button-outline" type="button" onClick={callShop}>
                  <Phone size={17} /> Call shop
                </button>
              ) : (
                <button className="button button-outline" type="button" disabled>
                  <Phone size={17} /> Call shop
                </button>
              )}
              {selectedLocation.whatsapp ? (
                <button className="button button-whatsapp" type="button" onClick={openWhatsApp}>
                  <MessageCircle size={18} /> Enquire on WhatsApp <ArrowUpRight size={16} />
                </button>
              ) : (
                <button className="button button-whatsapp" type="button" disabled>
                  <MessageCircle size={18} /> WhatsApp not configured
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="modal-eyebrow">A LITTLE CLOSER TO HOME</div>
            <h2 id="location-title">Choose shop Location for your order</h2>
            <p className="modal-intro">Select the location you&apos;d like to contact about your enquiry.</p>
            <div className="location-options">
              {locations.map((location, index) => (
                <button
                  type="button"
                  className="location-option"
                  key={location.id}
                  onClick={() => chooseLocation(location)}
                >
                  <span className="location-number">0{index + 1}</span>
                  <span className="location-option-copy">
                    <strong>{location.name}</strong>
                    <span><MapPin size={14} /> {location.area}</span>
                  </span>
                  <ArrowUpRight size={18} className="location-arrow" />
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
