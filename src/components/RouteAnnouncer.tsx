import { useEffect } from 'react'

type RouteAnnouncerProps = {
  title: string
}

// Client-side navigation does not reload the page, so screen readers are not told the page changed.
// - document.title is kept in sync with the current route (WCAG 2.4.2 Page Titled)
// - a polite live region announces the new title on each route change (WCAG 4.1.3 Status Messages);
//   its initial content is not announced, only subsequent changes.
function RouteAnnouncer({ title }: RouteAnnouncerProps) {
  useEffect(() => {
    document.title = `${title} — maison moderne`
  }, [title])

  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {title}
    </p>
  )
}

export default RouteAnnouncer
