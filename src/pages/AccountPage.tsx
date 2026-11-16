import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyOrders } from '@/hooks/useOrders'
import { labelStatus, orderTotal } from '@/types/orders'

// Protected by <ProtectedRoute> in App: a session always exists here
function AccountPage() {
  const { session } = useAuth()
  const orders = useMyOrders()

  return (
    <main className="account-page">
      <section className="orders-intro">
        <p className="eyebrow"><span className="eyebrow-dot" /> Votre espace</p>
        <h1>Bonjour<em>.</em></h1>
        <p>Vous êtes connecté avec {session?.user.email}.</p>
      </section>
      <section className="orders-content" aria-labelledby="my-orders-title">
        <h2 id="my-orders-title" className="account-orders-title">Mes commandes</h2>
        {orders.isPending ? (
          <p className="fetch-message" role="status">Chargement des commandes…</p>
        ) : orders.isError ? (
          <p className="fetch-message error-message" role="alert">{orders.error.message}</p>
        ) : orders.data.length === 0 ? (
          <p className="fetch-message">
            Aucune commande pour le moment. <Link to="/products">Découvrir la boutique</Link>
          </p>
        ) : (
          // Same semantic structure as the orders page: a list, and label/value pairs per order
          <ul className="order-list">
            {orders.data.map((order) => (
              <li key={order.id}>
                <dl className="order-row">
                  <div><dt>Commande</dt><dd>{order.id.slice(0, 8).toUpperCase()}</dd></div>
                  <div>
                    <dt>Articles</dt>
                    <dd>{order.order_items.map((line) => `${line.products.name} × ${line.quantity}`).join(', ')}</dd>
                  </div>
                  <div><dt>Date</dt><dd>{new Date(order.created_at).toLocaleDateString('fr-FR')}</dd></div>
                  <div><dt>Total</dt><dd>{orderTotal(order)} €</dd></div>
                  <div>
                    <dt className="sr-only">Statut</dt>
                    <dd><span className={`order-status status-${order.status}`}>{labelStatus(order.status)}</span></dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default AccountPage
