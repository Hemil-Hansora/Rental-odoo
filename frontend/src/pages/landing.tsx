import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Shield, BadgeCheck, Zap, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-base font-semibold">
            <span className="inline-block size-6 rounded-md bg-primary" />
            RentalHub
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#products" className="hover:underline">Products</a>
            <a href="#about" className="hover:underline">About</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost">Log in</Button></Link>
            <Link to="/signup"><Button>Sign up</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Soft gradient backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-[28rem] rounded-full bg-muted blur-3xl" />
        </div>
        <div className="relative py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-primary" />
                New: Faster booking and verified providers
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold leading-tight tracking-tight gradient-text">
                Rent smarter. Live lighter.
              </h1>
              <p className="mt-4 text-muted-foreground text-lg">
                Find quality items from local providers and pay only for the time you need.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signup"><Button size="lg" className="btn-gradient">Get started</Button></Link>
                <a href="#products"><Button size="lg" variant="outline">Browse products</Button></a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <span>Trusted by 5k+ users</span>
                <span>10k+ items</span>
                <span className="inline-flex items-center gap-1"><Star className="size-4 fill-current" /> 4.9</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border bg-card p-8">
              <div className="absolute -top-10 -left-10 size-40 rounded-full bg-muted" />
              <div className="absolute -bottom-16 -right-16 size-64 rounded-full bg-muted" />
              <div className="relative grid grid-cols-2 gap-4">
                {['Cameras','Tools','Furniture','Gaming'].map((t) => (
                  <div key={t} className="rounded-lg border bg-white p-6 transition-transform hover:-translate-y-1 hover:shadow-sm">
                    <div className="h-24 rounded-md bg-muted" />
                    <div className="mt-3 font-medium">{t}</div>
                    <div className="text-sm text-muted-foreground">From $5/day</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold">Why RentalHub</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">Designed to make renting simple, transparent, and reliable.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-lg border bg-white p-6">
              <div className="size-10 rounded-md bg-primary/10 mb-4 inline-flex items-center justify-center">
                <Shield className="size-5" />
              </div>
              <div className="font-medium text-lg">Verified providers</div>
              <div className="text-sm text-muted-foreground mt-1">Listings are vetted for quality and reliability.</div>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="size-10 rounded-md bg-primary/10 mb-4 inline-flex items-center justify-center">
                <BadgeCheck className="size-5" />
              </div>
              <div className="font-medium text-lg">Clear pricing</div>
              <div className="text-sm text-muted-foreground mt-1">Know the rate upfront. No hidden fees.</div>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="size-10 rounded-md bg-primary/10 mb-4 inline-flex items-center justify-center">
                <Zap className="size-5" />
              </div>
              <div className="font-medium text-lg">Fast booking</div>
              <div className="text-sm text-muted-foreground mt-1">Reserve in seconds and pick up when it suits you.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products teaser */}
      <section id="products" className="py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold">Popular items</h2>
              <p className="mt-2 text-muted-foreground">A quick peek at what people love to rent.</p>
            </div>
            <Link to="/login"><Button variant="outline">See all (login)</Button></Link>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="group rounded-lg border bg-white overflow-hidden transition-shadow hover:shadow-sm">
                <div className="h-36 bg-muted" />
                <div className="p-4">
                  <div className="font-medium">Item #{i}</div>
                  <div className="text-sm text-muted-foreground">From $8/day</div>
                  <div className="mt-3">
                    <Link to="/login"><Button size="sm" variant="outline">View</Button></Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold">What users say</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              {name: 'Jordan P.', text: 'Booking was instant and the drill was in great condition.'},
              {name: 'Alicia R.', text: 'Loved the transparent pricing and quick pickup.'},
              {name: 'Sam K.', text: 'Fantastic variety of items — saved me so much money!'},
            ].map((t) => (
              <div key={t.name} className="rounded-lg border bg-white p-6">
                <div className="flex items-center gap-2 text-yellow-500 mb-3">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">“{t.text}”</p>
                <div className="mt-4 text-sm font-medium">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold">About us</h2>
          <p className="mt-3 text-muted-foreground">
            We’re building a trusted rental marketplace that helps people access more while owning less.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center">Contact</h2>
          <div className="mt-8 rounded-xl border bg-white p-6">
            <form className="grid sm:grid-cols-2 gap-4">
              <Input className="col-span-1" placeholder="Your name" />
              <Input className="col-span-1" placeholder="Email address" type="email" />
              <textarea 
                className="sm:col-span-2 border border-input bg-transparent rounded-md px-3 py-2 min-h-32 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                placeholder="Message"
              />
              <div className="sm:col-span-2"><Button>Send message</Button></div>
            </form>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold">Ready to start renting?</h3>
              <p className="text-muted-foreground mt-1">Join for free and get access to thousands of items.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/signup"><Button size="lg">Create account</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">Log in</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} RentalHub</span>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#about" className="hover:underline">About</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
