import {InstallAppButton} from "@/components/install-app-button";

export function Footer() {
  return (
      <footer className="py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Book Creator. Créez des histoires inoubliables.</p>
          <div className="mt-4">
            <InstallAppButton />
          </div>
        </div>
      </footer>
  )
}
