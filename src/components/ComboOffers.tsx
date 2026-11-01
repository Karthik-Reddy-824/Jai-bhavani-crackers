import { ArrowDown, ArrowRight, PackageCheck, Truck } from 'lucide-react'
import type { ComboOffer } from '../types'

interface ComboOffersProps {
  offers: ComboOffer[]
  onAdd: (offer: ComboOffer) => void
}

export default function ComboOffers({ offers, onAdd }: ComboOffersProps) {
  return (
    <section className="combo-offers" id="combo-offers" aria-labelledby="combo-offers-title">
      <div className="combo-offers-inner">
        <div className="combo-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> FESTIVE COMBINATIONS</span>
            <h2 id="combo-offers-title">More sparkle,<br /><em>already gathered.</em></h2>
          </div>
          <p>Two ready-made selections, each sent as one complete combo enquiry.</p>
        </div>
        <div className="combo-grid">
          {offers.map((offer, index) => (
            <article className={`combo-card ${index === 0 ? 'combo-card-value' : 'combo-card-family'}`} key={offer.id}>
              <div className="combo-image-wrap">
                <img src={offer.image} alt={offer.imageAlt} loading="lazy" decoding="async" />
                <span className="combo-image-index">COMBO 0{index + 1}</span>
              </div>
              <div className="combo-card-content">
                <div className="combo-card-topline">
                  <span><PackageCheck size={14} /> {offer.contents.length} product entries</span>
                  <span>Fixed-price pack</span>
                  <span className="combo-delivery-label"><Truck size={13} aria-hidden="true" /> Home delivery available</span>
                </div>
                <h3>{offer.name}</h3>
                <p className="combo-price">₹{offer.price.toLocaleString('en-IN')}</p>
                <p className="combo-price-note">Special combo price – Ask us for an exclusive deal!</p>
                <details className="combo-contents">
                  <summary>View Full Contents <ArrowDown size={14} /></summary>
                  <ul>
                    {offer.contents.map((item, itemIndex) => (
                      <li key={`${item.product}-${itemIndex}`}>
                        <span>{item.product}</span><strong>× {item.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                </details>
                <button className="button combo-add-button" type="button" onClick={() => onAdd(offer)}>
                  Add Combo to Enquiry Basket <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}