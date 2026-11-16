import { NavLink } from 'react-router-dom'

type AdminHeaderProps = { title: string; description: string }

// Shared intro + sub-navigation of the admin pages (catalogue / orders)
function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <section className="orders-intro">
      <p className="eyebrow"><span className="eyebrow-dot" /> Administration</p>
      <h1>{title}<em>.</em></h1>
      <p>{description}</p>
      <nav className="admin-nav" aria-label="Administration">
        {/* NavLink sets aria-current="page" on the active link */}
        <NavLink to="/admin" end>Catalogue</NavLink>
        <NavLink to="/admin/orders">Commandes</NavLink>
      </nav>
    </section>
  )
}

export default AdminHeader
