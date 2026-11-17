import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { computeCartTotal } from '@/features/cart/cart'
import { selectItemCount, useCartStore } from '@/features/cart/store'
import { usePlaceOrder } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'

function CartPanel() {
  // Cart from the Zustand store (no props from App)
  const cart = useCartStore((state) => state.cart)
  const itemCount = useCartStore(selectItemCount)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const clearCart = useCartStore((state) => state.clearCart)
  // Same cached query as the product list: no extra request, used to show product names
  const { data: products = [] } = useProducts()
  const { session } = useAuth()
  const location = useLocation()
  const placeOrder = usePlaceOrder()
  const lines = Object.values(cart)
  const getProductName = (productId: string) =>
    products.find((product) => product.id === productId)?.name ?? productId

  return (
    <aside className="cart-panel" id="basket" aria-labelledby="cart-title">
      <div className="cart-panel-heading">
        <div>
          <p className="eyebrow">Votre sélection</p>
          <h2 id="cart-title">Le panier <span className="heading-count">{itemCount}</span></h2>
        </div>
        <span className="basket-icon" aria-hidden="true">↗</span>
      </div>
      {lines.length === 0 ? (
        placeOrder.isSuccess ? (
          <div className="empty-cart" role="status">
            <span className="empty-cart-mark" aria-hidden="true">✓</span>
            <p>Commande enregistrée, merci !</p>
            <Link to="/account">Voir mes commandes</Link>
          </div>
        ) : (
          <div className="empty-cart">
            <span className="empty-cart-mark" aria-hidden="true">＋</span>
            <p>Votre panier est encore vide.</p>
            <span>Les belles trouvailles sont juste à côté.</span>
          </div>
        )
      ) : (
        <div className="cart-lines">
          {lines.map((line) => (
            <div key={line.productId} className="cart-line">
              <span className="cart-line-thumb" aria-hidden="true">m.</span>
              <div className="cart-line-info">
                <strong>{getProductName(line.productId)}</strong>
                <span>Quantité : {line.quantity}</span>
              </div>
              <button
                className="remove-button"
                type="button"
                onClick={() => removeFromCart(line.productId)}
                aria-label={`Retirer ${getProductName(line.productId)} du panier`}
              >
                Retirer
              </button>
            </div>
          ))}
          <p className="cart-total">
            Total <strong>{computeCartTotal(lines, products)} €</strong>
          </p>
          {session ? (
            <button
              className="add-button checkout-button"
              type="button"
              disabled={placeOrder.isPending}
              onClick={() => placeOrder.mutate(lines)}
            >
              {placeOrder.isPending ? 'Commande en cours…' : 'Commander'}
            </button>
          ) : (
            // Ordering needs an account: come back to this page after signing in
            <Link className="add-button checkout-button" to="/login" state={{ from: location.pathname }}>
              Se connecter pour commander
            </Link>
          )}
          {placeOrder.isError && (
            <p className="form-message error-message" role="alert">{placeOrder.error.message}</p>
          )}
          <button className="clear-cart" type="button" onClick={clearCart}>
            Vider le panier
          </button>
        </div>
      )}
      <div className="cart-footnote"><span className="footnote-check">✓</span> Livraison offerte dès 80 €</div>
    </aside>
  )
}

export default CartPanel
