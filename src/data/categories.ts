import type { ProductCategory } from '../types'
import { pexelsImage } from './images'

export interface CategoryConfig {
  name: ProductCategory
  image: string
  imageAlt: string
  sizes?: string[]
}

export const categories: CategoryConfig[] = [
  { name: 'Flower Pots', image: '/images/categories/flower-pots.jpg', imageAlt: 'Golden firework fountains spraying sparks upward at night', sizes: ['Small', 'Medium', 'Big'] },
  { name: 'Ground Chakkars', image: '/images/categories/ground-chakkars.jpg', imageAlt: 'Circular orange sparks from a spinning wheel firework', sizes: ['Small', 'Medium', 'Big'] },
  { name: 'Sparklers', image: '/images/categories/sparklers.jpg', imageAlt: 'Handheld sparklers throwing golden light trails', sizes: ['7 cm', '15 cm', '30 cm'] },
  { name: 'Rockets', image: pexelsImage(14739749), imageAlt: 'Two firework rockets trailing sparks into an evening sky' },
  { name: 'Kids Special', image: pexelsImage(4226825), imageAlt: 'A child holding a lit sparkler' },
  { name: 'Fancy', image: '/images/categories/fancy.jpg', imageAlt: 'Colorful fireworks blooming across a dark sky' },
  { name: 'Big Sounds', image: pexelsImage(37192050), imageAlt: 'A firecracker bursting with sparks and smoke on the ground', sizes: ['Small', 'Medium', 'Big'] },
  { name: 'Local Desi Special', image: pexelsImage(5882255), imageAlt: 'Crackers going off during a street celebration in India' },
  { name: 'Walas (Laadi)', image: '/images/categories/walas-laadi.jpg', imageAlt: 'Traditional firecracker strings hanging in a line' },
  { name: 'Shots', image: '/images/categories/shots.jpg', imageAlt: 'Multiple colorful fireworks bursting in a dark sky' },
]