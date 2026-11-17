import type { Preview } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
// Same fonts and styles as the app (main.tsx, App.tsx): a story shows the component exactly as in the shop
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces/opsz.css'
import '../src/index.css'
import '../src/App.css'

const preview: Preview = {
  // The product card links to its detail page: <Link> needs a router around it
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Accessibility panel (axe-core, the engine of our e2e a11y tests): every story is scanned.
    // "error": a violation counts as a failure, not a mere warning.
    a11y: { test: 'error' },
  },
}

export default preview
