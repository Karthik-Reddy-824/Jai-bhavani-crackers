import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { CategoryConfig } from '../data/categories'

interface CategoryCardProps {
  category: CategoryConfig
  active: boolean
  onSelect: () => void
}

export default function CategoryCard({ category, active, onSelect }: CategoryCardProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <button
      type="button"
      className={`category-card${active ? ' is-active' : ''}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <span className="category-card-image">
        {imageFailed ? (
          <span className="category-image-fallback" aria-hidden="true"><Sparkles size={28} /></span>
        ) : (
          <img src={category.image} alt={category.imageAlt} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        )}
      </span>
      <span className="category-card-title">{category.name}</span>
    </button>
  )
}