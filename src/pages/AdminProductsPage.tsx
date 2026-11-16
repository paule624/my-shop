import { useState } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import DataTable, { type Column } from '@/components/DataTable'
import Modal from '@/components/Modal'
import AdminHeader from '@/features/admin/AdminHeader'
import ProductForm from '@/features/products/ProductForm'
import { useDeleteProduct, useProducts, useSaveProduct } from '@/hooks/useProducts'
import type { Product } from '@/types/ecommerce'

// Form state: closed, creating, or editing one product
type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; product: Product }

function AdminProductsPage() {
  const products = useProducts()
  const saveProduct = useSaveProduct()
  const deleteProduct = useDeleteProduct()
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [toDelete, setToDelete] = useState<Product | null>(null)

  function closeForm() {
    setForm({ mode: 'closed' })
    saveProduct.reset()
  }

  function closeDelete() {
    setToDelete(null)
    deleteProduct.reset()
  }

  const columns: Column<Product>[] = [
    { header: 'Produit', cell: (product) => <><strong>{product.name}</strong><br /><span className="cell-hint">{product.slug}</span></> },
    { header: 'Catégorie', cell: (product) => product.category ?? '—' },
    { header: 'Prix', cell: (product) => `${product.price} €` },
    { header: 'Stock', cell: (product) => (product.in_stock ? 'En stock' : 'Épuisé') },
    {
      header: 'Actions',
      hiddenHeader: true,
      cell: (product) => (
        <div className="row-actions">
          {/* Product name in the accessible name: "Modifier Lampe Aria", not 6 identical "Modifier" */}
          <button className="add-button" type="button" aria-label={`Modifier ${product.name}`} onClick={() => setForm({ mode: 'edit', product })}>
            Modifier
          </button>
          <button className="add-button danger-button" type="button" aria-label={`Supprimer ${product.name}`} onClick={() => setToDelete(product)}>
            Supprimer
          </button>
        </div>
      ),
    },
  ]

  return (
    <main className="admin-page">
      <AdminHeader title="Catalogue" description="Créez, modifiez et supprimez les produits de la boutique." />
      <section className="orders-content" aria-labelledby="admin-products-title">
        <div className="section-heading">
          <h2 id="admin-products-title" className="account-orders-title">Produits</h2>
          <button className="add-button admin-create" type="button" onClick={() => setForm({ mode: 'create' })}>
            Nouveau produit <span aria-hidden="true">＋</span>
          </button>
        </div>
        {products.isPending ? (
          <p className="fetch-message" role="status">Chargement des produits…</p>
        ) : products.isError ? (
          <p className="fetch-message error-message" role="alert">{products.error.message}</p>
        ) : (
          <DataTable
            caption="Produits du catalogue"
            columns={columns}
            rows={products.data}
            rowKey={(product) => product.id}
            emptyMessage="Aucun produit pour le moment."
          />
        )}
      </section>

      <Modal
        open={form.mode !== 'closed'}
        title={form.mode === 'edit' ? `Modifier « ${form.product.name} »` : 'Nouveau produit'}
        onClose={closeForm}
      >
        <ProductForm
          product={form.mode === 'edit' ? form.product : undefined}
          submitLabel={form.mode === 'edit' ? 'Enregistrer' : 'Créer le produit'}
          pending={saveProduct.isPending}
          error={saveProduct.error?.message ?? null}
          onSubmit={(values, imageFile) =>
            saveProduct.mutate(
              { id: form.mode === 'edit' ? form.product.id : undefined, values, imageFile },
              { onSuccess: closeForm },
            )
          }
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer ce produit ?"
        message={`« ${toDelete?.name} » sera retiré du catalogue. Cette action est définitive.`}
        confirmLabel="Supprimer"
        pending={deleteProduct.isPending}
        error={deleteProduct.error?.message ?? null}
        onConfirm={() => toDelete && deleteProduct.mutate(toDelete.id, { onSuccess: closeDelete })}
        onCancel={closeDelete}
      />
    </main>
  )
}

export default AdminProductsPage
