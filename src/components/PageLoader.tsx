// Full-height placeholder while a page is not ready (route chunk or session loading).
// Keeps the footer below the fold, so nothing jumps when the page appears (no layout shift).
function PageLoader() {
  return (
    <main className="route-fallback">
      <p className="fetch-message" role="status">Chargement de la page…</p>
    </main>
  )
}

export default PageLoader
