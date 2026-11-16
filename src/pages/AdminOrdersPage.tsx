import DataTable, { type Column } from '@/components/DataTable'
import AdminHeader from '@/features/admin/AdminHeader'
import { useAllOrders } from '@/hooks/useOrders'
import { labelStatus, orderTotal, type AdminOrder, type OrderStatus } from '@/types/orders'

const orderStatuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'cancelled']

// Same DataTable as the catalogue, with order columns
const columns: Column<AdminOrder>[] = [
  { header: 'Commande', cell: (order) => order.id.slice(0, 8).toUpperCase() },
  { header: 'Client', cell: (order) => order.email ?? 'Compte supprimé' },
  { header: 'Date', cell: (order) => new Date(order.created_at).toLocaleDateString('fr-FR') },
  { header: 'Articles', cell: (order) => order.order_items.map((line) => `${line.products.name} × ${line.quantity}`).join(', ') },
  { header: 'Total', cell: (order) => `${orderTotal(order)} €` },
  {
    header: 'Statut',
    cell: (order) => <span className={`order-status status-${order.status}`}>{labelStatus(order.status)}</span>,
  },
]

function AdminOrdersPage() {
  const orders = useAllOrders()

  return (
    <main className="admin-page">
      <AdminHeader title="Commandes" description="Toutes les commandes des clients et leur statut." />
      <div className="orders-content">
        {orders.isPending ? (
          <p className="fetch-message" role="status">Chargement des commandes…</p>
        ) : orders.isError ? (
          <p className="fetch-message error-message" role="alert">{orders.error.message}</p>
        ) : (
          <>
            <section aria-labelledby="orders-summary-title">
              <h2 id="orders-summary-title" className="sr-only">Résumé des commandes</h2>
              <dl className="order-summary-strip">
                {orderStatuses.map((status) => (
                  <div key={status} className="summary-cell">
                    <dt>{labelStatus(status)}</dt>
                    <dd>{orders.data.filter((order) => order.status === status).length}</dd>
                  </div>
                ))}
              </dl>
              <p className="orders-total">
                Montant total des commandes :{' '}
                <strong>{orders.data.reduce((total, order) => total + orderTotal(order), 0)} €</strong>
              </p>
            </section>
            <DataTable
              caption="Toutes les commandes"
              columns={columns}
              rows={orders.data}
              rowKey={(order) => order.id}
              emptyMessage="Aucune commande pour le moment."
            />
          </>
        )}
      </div>
    </main>
  )
}

export default AdminOrdersPage
