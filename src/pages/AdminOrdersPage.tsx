import DataTable, { type Column } from '@/components/DataTable'
import AdminHeader from '@/features/admin/AdminHeader'
import { useAllOrders } from '@/hooks/useOrders'
import { downloadCsv } from '@/lib/csv'
import { labelStatus, orderTotal, ordersTotal, type AdminOrder, type OrderStatus } from '@/types/orders'

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

// Same columns as the table, as plain text (full order id and ISO date: exact values for a spreadsheet)
function exportOrders(orders: AdminOrder[]) {
  downloadCsv(
    `commandes-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Commande', 'Client', 'Date', 'Articles', 'Total (€)', 'Statut'],
    orders.map((order) => [
      order.id,
      order.email ?? '',
      order.created_at,
      order.order_items.map((line) => `${line.products.name} × ${line.quantity}`).join(', '),
      String(orderTotal(order)),
      labelStatus(order.status),
    ]),
  )
}

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
              <div className="orders-toolbar">
                <p className="orders-total">
                  Montant total des commandes :{' '}
                  <strong>{ordersTotal(orders.data)} €</strong>
                </p>
                <button
                  className="add-button"
                  type="button"
                  disabled={orders.data.length === 0}
                  onClick={() => exportOrders(orders.data)}
                >
                  Exporter en CSV <span aria-hidden="true">↓</span>
                </button>
              </div>
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
