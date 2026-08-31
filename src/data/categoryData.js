import { Disc, Settings, Wrench, Filter, Zap, ShieldHalf, LayoutGrid } from 'lucide-react'

// The API stores category icons as strings (e.g. 'Disc'); resolve them to
// lucide components on the client. Falls back to LayoutGrid for unknown names.
export const iconMap = { Disc, Settings, Wrench, Filter, Zap, ShieldHalf, LayoutGrid }

export function resolveIcon(icon) {
  // Static data already holds a component; API data holds a string.
  if (typeof icon === 'string') return iconMap[icon] || LayoutGrid
  return icon || LayoutGrid
}

export const allCategory = {
  id: 'all',
  label: 'All Parts',
  icon: LayoutGrid,
  description: 'Browse the full AutoGenuine catalogue — every genuine and OEM-certified part across all categories.',
  image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
}

export const categories = [
  {
    id: 'brakes',
    label: 'Brakes',
    icon: Disc,
    description: 'Brake pads, rotors, calipers and brake fluid — everything to stop safely, every time.',
    image: '/images/categories/brakes.jpg',
  },
  {
    id: 'engine',
    label: 'Engine',
    icon: Settings,
    description: 'Spark plugs, belts, gaskets and engine mounts to keep your engine running smooth.',
    image: '/images/categories/engine.jpg',
  },
  {
    id: 'suspension',
    label: 'Suspension & Steering',
    icon: Wrench,
    description: 'Shock absorbers, control arms and steering components for a smooth, controlled ride.',
    image: '/images/categories/suspension.jpg',
  },
  {
    id: 'filters',
    label: 'Filters',
    icon: Filter,
    description: 'Oil, air, cabin and fuel filters — genuine filtration built to OEM spec.',
    image: '/images/categories/filters.jpg',
  },
  {
    id: 'electrical',
    label: 'Electrical',
    icon: Zap,
    description: 'Batteries, alternators, starters and wiring — keep every system powered.',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'body',
    label: 'Body & Exterior',
    icon: ShieldHalf,
    description: 'Bumpers, mirrors, headlights and trim to keep your Toyota looking factory-fresh.',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80',
  },
]

export function findCategory(id) {
  if (id === 'all') return allCategory
  return categories.find((c) => c.id === id)
}
