import type { ReactNode } from 'react'
import { useFetch } from '@/hooks/useFetch'
import type { Order, OrdersByStatus, OrderStatus, OrderSummary } from '@/types/orders'
import { labelStatus, pluck } from '@/types/orders'

const orderStatuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'cancelled']

function OrderList() {
  const result = useFetch<Order[]>('/data/orders.json')
  let content: ReactNode

  switch (result.status) {
    case 'idle':
    case 'loading':
      content = <p className="fetch-message" role="status">Chargement des commandes…</p>
      break
    case 'error':
      content = <p className="fetch-message error-message" role="alert">{result.message}</p>
      break
    case 'success': {
      const ordersByStatus: OrdersByStatus = {
        pending: [],
        paid: [],
        shipped: [],
        cancelled: [],
      }

      for (const order of result.data) {
        ordersByStatus[order.status].push(order)
      }

      const totalRevenue = pluck(result.data, 'total').reduce((total, amount) => total + amount, 0)

      // Semantic structure for screen readers: headings to navigate, a list of orders,
      // and <dl> label/value pairs (read as "Client, camille@…") instead of anonymous divs
      content = (
        <>
          <section aria-labelledby="orders-summary-title">
            <h2 id="orders-summary-title" className="sr-only">Résumé des commandes</h2>
            <dl className="order-summary-strip">
              {orderStatuses.map((status) => (
                <div className="summary-cell" key={status}>
                  <dt>{labelStatus(status)}</dt>
                  <dd>{ordersByStatus[status].length}</dd>
                </div>
              ))}
            </dl>
            <p className="orders-total">Montant total des commandes : <strong>{totalRevenue} €</strong></p>
          </section>
          <section aria-labelledby="orders-list-title">
            <h2 id="orders-list-title" className="sr-only">Liste des commandes</h2>
            {result.data.length === 0 ? (
              <p className="fetch-message">Aucune commande pour le moment.</p>
            ) : (
              <ul className="order-list">
                {result.data.map((order) => {
                  const summary: OrderSummary = {
                    id: order.id,
                    customerEmail: order.customerEmail,
                    total: order.total,
                  }

                  return (
                    <li key={summary.id}>
                      <dl className="order-row">
                        <div><dt>Commande</dt><dd>{summary.id}</dd></div>
                        <div><dt>Client</dt><dd>{summary.customerEmail}</dd></div>
                        <div><dt>Date</dt><dd>{new Date(String(order.createdAt)).toLocaleDateString('fr-FR')}</dd></div>
                        <div><dt>Total</dt><dd>{summary.total} €</dd></div>
                        <div>
                          {/* Label only for screen readers: the colored badge speaks for itself visually */}
                          <dt className="sr-only">Statut</dt>
                          <dd><span className={`order-status status-${order.status}`}>{labelStatus(order.status)}</span></dd>
                        </div>
                      </dl>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )
      break
    }
    default: {
      const _exhaustive: never = result
      content = _exhaustive
    }
  }

  return <div className="orders-content">{content}</div>
}

export default OrderList
