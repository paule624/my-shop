import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
// Adds the DOM matchers (toBeInTheDocument, toBeDisabled...) to Vitest's expect
import '@testing-library/jest-dom/vitest'

// Unmounts what the previous test rendered (automatic only with Vitest globals, which we do not enable)
afterEach(cleanup)
