import { Link } from "react-router-dom";

/**
 * Two-pane web auth layout: form on the left, immersive coffee photo on the right.
 * Used by Welcome / SignIn / Join / VerifyEmail when on desktop.
 */
export default function AuthWebShell({ children, image, caption }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Form pane */}
      <div className="flex flex-col">
        <header className="px-10 py-6">
          <Link to="/home" className="font-serif italic text-2xl text-primary">
            Artisan Brew
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-10 pb-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Image pane */}
      <div
        className="relative hidden lg:block"
        style={{
          backgroundImage:
            `linear-gradient(135deg, rgba(39,19,16,0.45) 0%, rgba(39,19,16,0.7) 100%), url('${image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80"}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 flex items-end p-12">
          <div className="text-on-primary max-w-md">
            <p className="text-label-sm uppercase tracking-[0.4em] opacity-80">Artisan Brew</p>
            <p className="font-serif text-3xl mt-3 leading-tight">
              {caption || "A morning ritual, served with intention."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
