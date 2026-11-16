// Widths requested from the image CDN; the browser picks one from `sizes` and the device pixel ratio
const IMAGE_WIDTHS = [240, 360, 480, 720, 960]
// Compression quality: 75 is visually close to 85 at these sizes, for noticeably lighter files
const IMAGE_QUALITY = '75'

// Builds a srcset by rewriting the `w` and `q` query params (supported by Unsplash's image CDN).
// Returns undefined for other hosts, so the original `src` is used as-is.
function buildSrcSet(src: string): string | undefined {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return undefined
  }
  if (url.hostname !== 'images.unsplash.com') return undefined

  url.searchParams.set('q', IMAGE_QUALITY)
  return IMAGE_WIDTHS.map((width) => {
    url.searchParams.set('w', String(width))
    return `${url.toString()} ${width}w`
  }).join(', ')
}

type ProductImageProps = {
  src: string
  alt: string
  // Rendered width of the image per breakpoint, must mirror the CSS layout
  sizes: string
  // Above-the-fold / LCP image: fetched eagerly with high priority instead of lazy-loaded
  priority?: boolean
}

function ProductImage({ src, alt, sizes, priority = false }: ProductImageProps) {
  return (
    <img
      className="product-image"
      src={src}
      srcSet={buildSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  )
}

export default ProductImage
