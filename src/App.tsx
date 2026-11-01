import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  Flower2,
  Info,
  MapPin,
  Menu,
  Navigation,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import ProductCard from './components/ProductCard'
import CategoryCard from './components/CategoryCard'
import ComboOffers from './components/ComboOffers'
import LocationModal from './components/LocationModal'
import { categories } from './data/categories'
import { comboOffers } from './data/comboOffers'
import { products } from './data/products'
import { shopLocations } from './data/shops'
import { store } from './data/store'
import { formatPhone, getBasketLineId, getProductPrice, getShopDirectionsUrl } from './types'
import type { Basket, BasketItem, ComboBasketItem, ComboOffer, Product, ProductCategory } from './types'
import { trackEvent, trackPageView } from './utils/analytics'

type CategoryFilter = ProductCategory | 'All products'
type Page = 'home' | 'collection' | 'combos' | 'basket'
type ProductSort = 'featured' | 'price-ascending'
type ResolvedBasketLine =
  | { kind: 'product'; lineId: string; product: Product; item: BasketItem }
  | { kind: 'combo'; lineId: string; combo: ComboOffer; item: ComboBasketItem }

function readSavedBasket(): Basket {
  try {
    const saved = window.localStorage.getItem('diwali-enquiry-basket')
    return saved ? JSON.parse(saved) as Basket : {}
  } catch {
    return {}
  }
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [category, setCategory] = useState<CategoryFilter>('All products')
  const [size, setSize] = useState<string>('All sizes')
  const [query, setQuery] = useState('')
  const [productSort, setProductSort] = useState<ProductSort>('featured')
  const [basket, setBasket] = useState<Basket>(readSavedBasket)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    trackPageView()
  }, [])

  useEffect(() => {
    window.localStorage.setItem('diwali-enquiry-basket', JSON.stringify(basket))
  }, [basket])

  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matches = products.filter((product) => {
      const matchesCategory = category === 'All products' || product.category === category
      const matchesSize = size === 'All sizes' || product.size === size
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.category} ${product.size ?? ''} ${product.packSize ?? ''} ${(product.variations ?? []).join(' ')}`.toLowerCase().includes(normalizedQuery)
      return matchesCategory && matchesSize && matchesQuery
    })
    if (productSort === 'featured') return matches

    return matches
      .map((product, index) => {
        const variationPrices = Object.values(product.variationPrices ?? {})
        const price = product.price ?? (variationPrices.length ? Math.min(...variationPrices) : null)
        return { product, index, price }
      })
      .sort((a, b) => {
        if (a.price === null) return b.price === null ? a.index - b.index : 1
        if (b.price === null) return -1
        return a.price - b.price || a.index - b.index
      })
      .map(({ product }) => product)
  }, [category, productSort, query, size])

  const basketLines = Object.entries(basket).flatMap<ResolvedBasketLine>(([lineId, item]) => {
    if (item.quantity <= 0) return []
    if (item.kind === 'combo') {
      const combo = comboOffers.find((entry) => entry.id === item.comboId)
      return combo ? [{ kind: 'combo' as const, lineId, combo, item }] : []
    }
    const product = products.find((entry) => entry.id === item.productId)
    return product ? [{ kind: 'product' as const, lineId, product, item: { ...item, kind: 'product' as const } }] : []
  })
  const basketCount = basketLines.reduce((sum, line) => sum + line.item.quantity, 0)
  const basketTotal = basketLines.reduce(
    (sum, line) => sum + (line.kind === 'combo'
      ? line.combo.price * line.item.quantity
      : (getProductPrice(line.product, line.item.variation) ?? 0) * line.item.quantity),
    0,
  )
  const hasUnpricedItems = basketLines.some((line) => line.kind === 'product' && getProductPrice(line.product, line.item.variation) === null)
  const totalLabel = hasUnpricedItems
    ? basketTotal > 0 ? `₹${basketTotal.toLocaleString('en-IN')} + price on request` : 'Price on request'
    : `₹${basketTotal.toLocaleString('en-IN')}`

  function scrollToCatalogue() {
    setPage('collection')
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goHome() {
    setPage('home')
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showComboOffers() {
    setPage('combos')
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showPromise() {
    scrollToCatalogue()
    requestAnimationFrame(() => {
      document.getElementById('promise')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  function changeQuantity(product: Product, variation: string | undefined, quantity: number) {
    const lineId = getBasketLineId(product.id, variation)
    const previousQuantity = basket[lineId]?.quantity ?? 0
    const unitPrice = getProductPrice(product, variation)
    if (quantity > previousQuantity) {
      trackEvent('add_to_cart', {
        currency: 'INR',
        ...(unitPrice === null ? {} : { value: unitPrice }),
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          quantity: 1,
          ...(unitPrice === null ? {} : { price: unitPrice }),
          ...(variation ? { item_variant: variation } : {}),
        }],
      })
    }

    setBasket((current) => {
      const next = { ...current }
      if (quantity <= 0) {
        delete next[lineId]
      } else {
        next[lineId] = { kind: 'product', productId: product.id, variation, quantity }
      }
      return next
    })
  }

  function changeComboQuantity(combo: ComboOffer, quantity: number) {
    const lineId = `combo:${combo.id}`
    const previousQuantity = basket[lineId]?.quantity ?? 0
    if (quantity > previousQuantity) {
      trackEvent('add_to_cart', {
        currency: 'INR',
        value: combo.price,
        items: [{ item_id: combo.id, item_name: combo.name, item_category: 'Combo Offers', quantity: 1, price: combo.price }],
      })
    }

    setBasket((current) => {
      const next = { ...current }
      if (quantity <= 0) {
        delete next[lineId]
      } else {
        next[lineId] = { kind: 'combo', comboId: combo.id, quantity }
      }
      return next
    })
  }

  function removeBasketLine(lineId: string) {
    setBasket((current) => {
      const next = { ...current }
      delete next[lineId]
      return next
    })
  }

  function chooseCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory)
    setSize('All sizes')
    trackEvent('view_item_list', { item_list_name: nextCategory })
    document.getElementById('catalogue-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const selectedCategory = categories.find((item) => item.name === category)

  function openShopSelection() {
    trackEvent('buy_crackers_click', { item_count: basketCount })
    if (basketCount === 0) {
      scrollToCatalogue()
      return
    }
    setLocationModalOpen(true)
  }

  function openBasket() {
    setPage('basket')
    setMenuOpen(false)
    trackEvent('view_basket', { item_count: basketCount })
  }

  return (
    <>
      <div className="announcement">
        <Sparkles size={14} aria-hidden="true" />
        <span>Celebrating the festival of lights, together</span>
        <Sparkles size={14} aria-hidden="true" />
      </div>
      <header className="site-header">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); goHome() }} aria-label={`${store.name} home`}>
          <img className="brand-logo" src="/images/jai-bhavani-logo.png" alt="" />
          <span className="brand-copy">
            <strong>{store.name}</strong>
            <small>LIGHT UP THE MOMENT</small>
          </span>
        </a>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#home" onClick={(event) => { event.preventDefault(); goHome() }}>Home</a>
          <a href="#catalogue" onClick={(event) => { event.preventDefault(); scrollToCatalogue() }}>Our collection</a>
          <a href="#combo-offers" onClick={(event) => { event.preventDefault(); showComboOffers() }}>Combo Offers</a>
          <a href="#promise" onClick={(event) => { event.preventDefault(); showPromise() }}>Our promise</a>
          <button type="button" className="nav-shop-button" onClick={scrollToCatalogue}>Shop now <ArrowRight size={15} /></button>
        </nav>
        <div className="header-actions">
          <button
            className="basket-trigger"
            type="button"
            onClick={openBasket}
            aria-label={`View enquiry basket, ${basketCount} items`}
          >
            <ShoppingBag size={19} />
            <span className="basket-label">Enquiry</span>
            <span className="basket-count">{basketCount}</span>
          </button>
          <button
            className="mobile-menu-toggle icon-button"
            type="button"
            onClick={() => {
              const next = !menuOpen
              setMenuOpen(next)
              if (next) trackEvent('menu_view')
            }}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        {page === 'basket' ? (
          <section className="basket-page section-shell" aria-labelledby="basket-page-title">
            <div className="basket-page-heading">
              <div>
                <span className="eyebrow"><span className="eyebrow-line" /> YOUR SELECTION</span>
                <h1 id="basket-page-title">Enquiry basket</h1>
                <p>Review your festive favourites before contacting a shop.</p>
              </div>
              <button type="button" className="button button-outline" onClick={scrollToCatalogue}>
                <ArrowDown size={16} /> Continue shopping
              </button>
            </div>
            {basketLines.length === 0 ? (
              <div className="basket-page-empty">
                <ShoppingBag size={30} aria-hidden="true" />
                <h2>Your basket is waiting</h2>
                <p>Add a few favourites to start an enquiry.</p>
                <button type="button" className="button button-primary" onClick={scrollToCatalogue}>
                  Explore the collection <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="basket-page-layout">
                <div className="basket-page-items">
                  {basketLines.map((line) => line.kind === 'combo' ? (
                    <article className="basket-page-item" key={line.lineId}>
                      <div className="basket-page-item-copy">
                        <span className="basket-page-item-category">Combo offer</span>
                        <h2>{line.combo.name}</h2>
                        <p>₹{line.combo.price.toLocaleString('en-IN')} each</p>
                        <details className="basket-page-combo-contents">
                          <summary>View {line.combo.contents.length} included entries</summary>
                          <ul>{line.combo.contents.map((entry, index) => <li key={`${entry.product}-${index}`}>{entry.product} × {entry.quantity}</li>)}</ul>
                        </details>
                      </div>
                      <div className="basket-page-line-actions">
                        <strong className="basket-page-line-price">₹{(line.combo.price * line.item.quantity).toLocaleString('en-IN')}</strong>
                        <div className="basket-page-quantity">
                          <button type="button" aria-label={`Remove one ${line.combo.name}`} onClick={() => changeComboQuantity(line.combo, line.item.quantity - 1)}>−</button>
                          <span>{line.item.quantity}</span>
                          <button type="button" aria-label={`Add one ${line.combo.name}`} onClick={() => changeComboQuantity(line.combo, line.item.quantity + 1)}>+</button>
                        </div>
                        <button className="basket-page-remove" type="button" onClick={() => removeBasketLine(line.lineId)} aria-label={`Remove ${line.combo.name} from basket`}><Trash2 size={15} /> Remove</button>
                      </div>
                    </article>
                  ) : (
                    <article className="basket-page-item" key={line.lineId}>
                      <div className="basket-page-item-copy">
                        <span className="basket-page-item-category">{line.product.category}</span>
                        <h2>{line.product.name}{line.item.variation ? ` · ${line.item.variation}` : ''}</h2>
                        <p>{[line.product.size, line.product.packSize].filter(Boolean).join(' · ') || line.product.category}</p>
                      </div>
                      <div className="basket-page-line-actions">
                        <strong className="basket-page-line-price">
                          {getProductPrice(line.product, line.item.variation) === null
                            ? 'Price on request'
                            : `₹${((getProductPrice(line.product, line.item.variation) ?? 0) * line.item.quantity).toLocaleString('en-IN')}`}
                        </strong>
                        <div className="basket-page-quantity">
                          <button type="button" aria-label={`Remove one ${line.product.name}`} onClick={() => changeQuantity(line.product, line.item.variation, line.item.quantity - 1)}>−</button>
                          <span>{line.item.quantity}</span>
                          <button type="button" aria-label={`Add one ${line.product.name}`} onClick={() => changeQuantity(line.product, line.item.variation, line.item.quantity + 1)}>+</button>
                        </div>
                        <button className="basket-page-remove" type="button" onClick={() => removeBasketLine(line.lineId)} aria-label={`Remove ${line.product.name} from basket`}><Trash2 size={15} /> Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="basket-page-summary" aria-label="Basket total">
                  <h2>Enquiry summary</h2>
                  <div className="basket-page-summary-line"><span>{basketCount} {basketCount === 1 ? 'item' : 'items'}</span><strong>{totalLabel}</strong></div>
                  <p>Final prices and product availability are confirmed by your selected shop.</p>
                  <button type="button" className="button button-primary full-width" onClick={openShopSelection}>
                    Choose a shop &amp; enquire <ArrowRight size={17} />
                  </button>
                </aside>
              </div>
            )}
          </section>
        ) : page === 'home' ? (
          <>
        <section className="hero" id="home">
          <div className="hero-image" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-kicker"><span /> {store.season} <span /></div>
            <h1>May your Diwali<br />shine <em>brighter.</em></h1>
            <p className="hero-wish">Wishing you a season filled with light, laughter<br className="desktop-break" /> and the warmth of being together.</p>
            <div className="hero-meta">
              <div><span className="meta-label">A FESTIVE OFFER</span><strong>{store.offer}</strong></div>
              <div className="meta-divider" />
              <div><span className="meta-label">WE OPEN</span><strong>{store.openingDate}</strong></div>
            </div>
            <div className="hero-actions">
              <button type="button" className="button button-gold hero-button" onClick={scrollToCatalogue}>
                Shop the collection <ArrowDown size={17} />
              </button>
              <button type="button" className="button button-hero-outline" onClick={showComboOffers}>
                View Combo Offers <ArrowRight size={16} />
              </button>
            </div>
            <span className="hero-caption">A little sparkle goes a long way.</span>
          </div>
          <div className="hero-stamp" aria-label="Happy Diwali">
            <span>HAPPY</span><strong>दीपावली</strong><span>HAPPY DIWALI</span>
          </div>
          <div className="hero-bottom-note"><span>01</span> THE LIGHTS ARE CALLING</div>
        </section>

        <aside className="pricing-banner" aria-label="Negotiable pricing">
          <Sparkles size={18} aria-hidden="true" />
          <div>
            <strong>Prices Are Negotiable – Contact Us for the Best Deal!</strong>
            <p>Get in touch with our stores for special prices and attractive offers.</p>
          </div>
        </aside>

        <section className="intro-strip" aria-label="Welcome">
          <div className="intro-inner">
            <span className="intro-symbol">✳</span>
            <p>Celebrate every little moment.<br /><strong>Make this Diwali yours.</strong></p>
            <span className="intro-small">CURATED WITH CARE · MADE FOR TOGETHERNESS</span>
            <button type="button" className="intro-link" onClick={scrollToCatalogue}>Discover the collection <ArrowDown size={16} /></button>
          </div>
        </section>
          </>
        ) : page === 'combos' ? (
          <ComboOffers offers={comboOffers} onAdd={(combo) => changeComboQuantity(combo, (basket[`combo:${combo.id}`]?.quantity ?? 0) + 1)} />
        ) : (
          <>
        <section className="catalogue section-shell" id="catalogue">
          <div className="section-heading">
            <div className="section-heading-copy">
              <span className="eyebrow"><span className="eyebrow-line" /> THE FESTIVE EDITION</span>
              <h2>A little something<br /><em>for every sparkle.</em></h2>
            </div>
            <div className="catalogue-side-note">
              <p>From the first sparkler to the last firework, find your favourites for the celebration.</p>
              <span><Check size={14} /> Thoughtfully selected</span>
            </div>
          </div>
          <aside className="image-disclaimer" role="note" aria-label="Image disclaimer">
            <Info size={16} aria-hidden="true" />
            <p>Note: The images displayed on this website are for reference and illustration purposes only. They may not represent the actual products available at our stores. Please contact us to confirm product availability and actual product details.</p>
          </aside>
          <div className="category-navigation" role="group" aria-label="Filter products by category">
            <div className="category-navigation-heading">
              <p>Choose a category below to view its products.</p>
              <button
                type="button"
                className={`category-chip all-products-chip ${category === 'All products' ? 'active' : ''}`}
                onClick={() => chooseCategory('All products')}
                aria-pressed={category === 'All products'}
              >
                All products
              </button>
            </div>
            <div className="category-gallery">
              {categories.map((item) => (
                <CategoryCard
                  key={item.name}
                  category={item}
                  active={category === item.name}
                  onSelect={() => chooseCategory(item.name)}
                />
              ))}
            </div>
          </div>
          <div className="catalogue-toolbar">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find your favourite"
                aria-label="Search crackers"
              />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}
            </label>
            <label className="catalogue-sort">
              <span>Sort by</span>
              <select
                value={productSort}
                onChange={(event) => setProductSort(event.target.value === 'price-ascending' ? 'price-ascending' : 'featured')}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-ascending">Price: Low to high</option>
              </select>
            </label>
          </div>
          {selectedCategory?.sizes && (
            <div className="size-filter" role="group" aria-label={`Filter ${category} by size`}>
              {['All sizes', ...selectedCategory.sizes].map((item) => (
                <button key={item} type="button" className={size === item ? 'active' : ''} onClick={() => setSize(item)} aria-pressed={size === item}>{item}</button>
              ))}
            </div>
          )}
          <div className="catalogue-result-bar" id="catalogue-results">
            <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</span>
            <span className="catalogue-sample-note">Prices are negotiable – enquire with a store for the best deal.</span>
          </div>
          {filteredProducts.length ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  basket={basket}
                  onChangeQuantity={changeQuantity}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <Search size={28} />
              <h3>No crackers found just yet</h3>
              <p>Try a different search or explore all of our festive favourites.</p>
              <button type="button" className="button button-outline" onClick={() => { setQuery(''); chooseCategory('All products') }}>Show all products</button>
            </div>
          )}
          <div className="catalogue-footnote">
            <span><Sparkles size={15} /> Price on request unless a price is configured.</span>
            <span>Celebrate responsibly. Follow all product safety instructions.</span>
          </div>
        </section>

        <section className="basket-cta">
          <div className="basket-cta-inner">
            <div className="cta-flower"><Flower2 size={34} strokeWidth={1.3} /></div>
            <div className="cta-copy">
              <span className="eyebrow">READY WHEN YOU ARE</span>
              <h2>Your celebration, <em>your way.</em></h2>
              <p>Choose your nearest shop and send us your enquiry. We&apos;ll help you find just the right sparkle.</p>
            </div>
            <div className="cta-action">
              <button
                type="button"
                className="button button-gold"
                onClick={openShopSelection}
                aria-label={basketCount ? `Buy crackers, ${basketCount} items selected` : 'Buy crackers, choose products first'}
              >
                Buy crackers {basketCount > 0 && <span className="cta-count">{basketCount}</span>} <ArrowRight size={17} />
              </button>
              <span>{basketCount ? `${totalLabel} estimated total` : 'Your favourites, gathered in one place'}</span>
            </div>
          </div>
        </section>

        <section className="promise section-shell" id="promise">
          <div className="promise-intro">
            <span className="eyebrow"><span className="eyebrow-line" /> THE SHUBH PROMISE</span>
            <h2>More than a moment.<br /><em>A memory in the making.</em></h2>
          </div>
          <div className="promise-points">
            <article><span>01</span><h3>Chosen with care</h3><p>A thoughtfully gathered collection for all the little traditions that make Diwali special.</p></article>
            <article><span>02</span><h3>Here, close to home</h3><p>Two neighbourhood shops, ready to help you find the right festive favourites.</p></article>
            <article><span>03</span><h3>Celebrate responsibly</h3><p>Please follow product safety instructions and celebrate with care for everyone around you.</p></article>
          </div>
        </section>

        <section className="closing-banner">
          <div className="closing-ornament" aria-hidden="true">✳</div>
          <span>FROM OUR FAMILY TO YOURS</span>
          <h2>Wishing you a <em>beautiful</em> Diwali.</h2>
          <p>May every light bring you closer to what matters most.</p>
          <button type="button" className="closing-link" onClick={scrollToCatalogue}>Find your festive favourites <ArrowUp size={15} /></button>
        </section>
          </>
        )}
      </main>

      <section className="footer-shops" aria-labelledby="footer-shops-title">
        <div className="footer-shops-inner">
          <div className="footer-shops-heading">
            <span className="eyebrow">VISIT US</span>
            <h2 id="footer-shops-title">Our shops</h2>
          </div>
          <div className="footer-shop-list">
            {shopLocations.map((shop) => (
              <article className="footer-shop" key={shop.id}>
                <h3>{shop.name}</h3>
                <p><MapPin size={14} aria-hidden="true" /> {shop.address}</p>
                <p><Clock size={14} aria-hidden="true" /> {shop.hours}</p>
                {shop.phone && (
                  <p>
                    <Phone size={14} aria-hidden="true" />
                    <a href={`tel:+${shop.phone.replace(/\D/g, '')}`} onClick={() => trackEvent('phone_click', { shop_location: shop.id })}>{formatPhone(shop.phone)}</a>
                  </p>
                )}
                <a className="directions-link" href={getShopDirectionsUrl(shop)} target="_blank" rel="noopener noreferrer">
                  <Navigation size={13} aria-hidden="true" /> Get directions
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home" onClick={(event) => { event.preventDefault(); goHome() }}>
          <img className="brand-logo" src="/images/jai-bhavani-logo.png" alt="" />
          <span className="brand-copy"><strong>{store.name}</strong><small>LIGHT UP THE MOMENT</small></span>
        </a>
        <p>Made for moments that glow. <span>✳</span></p>
        <span className="footer-copy">© {new Date().getFullYear()} {store.name}. Prices are indicative only.</span>
      </footer>

      {basketCount > 0 && page !== 'basket' && (
        <button className="mobile-basket-bar" type="button" onClick={openBasket}>
          <span><ShoppingBag size={18} /> {basketCount} {basketCount === 1 ? 'item' : 'items'} · {totalLabel}</span>
          <span>View basket <ArrowRight size={16} /></span>
        </button>
      )}
      {locationModalOpen && (
        <LocationModal
          locations={shopLocations}
          products={products}
          basket={basket}
          onClose={() => setLocationModalOpen(false)}
        />
      )}
    </>
  )
}

export default App
