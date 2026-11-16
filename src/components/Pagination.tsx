import { Link } from 'react-router-dom'

type PaginationProps = {
  page: number
  totalPages: number
  // URL of a given page (keeps the other URL filters)
  hrefFor: (page: number) => string
}

// Previous / next links: real URLs, so a page can be shared, bookmarked, or reached with the back button
function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? <Link to={hrefFor(page - 1)}><span aria-hidden="true">←</span> Précédent</Link> : <span aria-hidden="true" />}
      <p aria-current="page">Page {page} sur {totalPages}</p>
      {page < totalPages ? <Link to={hrefFor(page + 1)}>Suivant <span aria-hidden="true">→</span></Link> : <span aria-hidden="true" />}
    </nav>
  )
}

export default Pagination
