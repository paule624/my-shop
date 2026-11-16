import type { FormEvent } from 'react'
import type { CreateProductInput, Product } from '@/types/ecommerce'

type ProductFormProps = {
  // Product being edited; undefined = creation form
  product?: Product
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (values: CreateProductInput) => void
  onCancel: () => void
}

// Optional text field: empty input is stored as null in the database
const optional = (value: FormDataEntryValue | null) => {
  const text = String(value ?? '').trim()
  return text === '' ? null : text
}

// Same form for creation and edition (uncontrolled fields, read once on submit)
function ProductForm({ product, submitLabel, pending, error, onSubmit, onCancel }: ProductFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    onSubmit({
      name: String(form.get('name')).trim(),
      slug: String(form.get('slug')).trim(),
      price: Number(form.get('price')),
      in_stock: form.get('in_stock') === 'on',
      category: optional(form.get('category')),
      badge: optional(form.get('badge')),
      description: optional(form.get('description')),
      image_url: optional(form.get('image_url')),
      image_alt: optional(form.get('image_alt')),
    })
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <label htmlFor="product-name">Nom</label>
      <input id="product-name" name="name" required defaultValue={product?.name} />

      <label htmlFor="product-slug">Identifiant d’URL <span className="field-hint">(minuscules, chiffres, tirets)</span></label>
      <input id="product-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={product?.slug} />

      <label htmlFor="product-price">Prix (€)</label>
      <input id="product-price" name="price" type="number" min="0" step="0.01" required defaultValue={product?.price} />

      <label htmlFor="product-category">Catégorie</label>
      <input id="product-category" name="category" defaultValue={product?.category ?? ''} />

      <label htmlFor="product-badge">Badge <span className="field-hint">(facultatif)</span></label>
      <input id="product-badge" name="badge" defaultValue={product?.badge ?? ''} />

      <label htmlFor="product-description">Description</label>
      <textarea id="product-description" name="description" rows={3} defaultValue={product?.description ?? ''} />

      <label htmlFor="product-image-url">URL de l’image</label>
      <input id="product-image-url" name="image_url" type="url" defaultValue={product?.image_url ?? ''} />

      <label htmlFor="product-image-alt">Texte alternatif <span className="field-hint">(ce que montre la photo)</span></label>
      <input id="product-image-alt" name="image_alt" defaultValue={product?.image_alt ?? ''} />

      <label className="checkbox-field" htmlFor="product-in-stock">
        <input id="product-in-stock" name="in_stock" type="checkbox" defaultChecked={product?.in_stock ?? true} />
        En stock
      </label>

      {error && <p className="form-message error-message" role="alert">{error}</p>}
      <div className="modal-actions">
        <button className="add-button" type="button" onClick={onCancel}>Annuler</button>
        {/* aria-disabled instead of disabled: keeps the focus while saving (submit ignored meanwhile) */}
        <button className="add-button auth-submit" type="submit" aria-disabled={pending}>
          {pending ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default ProductForm
