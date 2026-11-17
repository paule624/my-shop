import type { Meta, StoryObj } from '@storybook/react-vite'
import ProductCard from '@/features/products/ProductCard'
import type { Product } from '@/types/ecommerce'

// Real catalogue product (Supabase row), written by hand: a story never calls the database
const lampe: Product = {
  id: 'story-lampe',
  slug: 'lampe-aria',
  name: 'Lampe Aria',
  price: 129,
  in_stock: true,
  category: 'Lumière',
  badge: 'Coup de cœur',
  description: 'Une lumière douce, un pied sculptural en céramique.',
  image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',
  image_alt: 'Lampadaire en métal gris anthracite à abat-jour en dôme, devant un mur blanc',
}

// Catalogue of the product card states, outside the app: each one is visible (and scanned by axe) on its own
const meta = {
  title: 'Catalogue/ProductCard',
  component: ProductCard,
  // Width of one column of the catalogue grid on desktop, so the card has its real proportions
  decorators: [
    (Story) => (
      <div style={{ width: 430, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
  args: { product: lampe },
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

export const Standard: Story = {}

// Layout stress test: a name far longer than the catalogue's must wrap without pushing the price out
export const NomTresLong: Story = {
  name: 'Nom très long',
  args: {
    product: {
      ...lampe,
      name: 'Lampe de chevet Aria en céramique émaillée faite main, abat-jour en lin lavé et variateur tactile',
    },
  },
}

// Out of stock: "Épuisé" status and disabled button (same state as the RTL test)
export const Epuise: Story = {
  name: 'Épuisé',
  args: { product: { ...lampe, in_stock: false, badge: null } },
}
