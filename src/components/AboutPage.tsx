import { useEffect } from 'react'
import { BookOpen, Share2, Zap, Lock, BarChart3, Users, Code2, Github, Linkedin } from 'lucide-react'

interface AboutPageProps {
  onClose: () => void
}

export default function AboutPage({ onClose }: AboutPageProps) {
  useEffect(() => {
    // Wait for the page to render, then scroll smoothly with custom timing
    const timer = setTimeout(() => {
      const element = document.getElementById('over-quick-o')
      if (element) {
        // Smooth scroll with the section title at the top
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        
        // Alternative: Use window.scrollTo for more control over the animation
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - 20 // 20px from top for some breathing room
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100) // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen p-4 md:p-8 text-white relative overflow-hidden">
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12" style={{animation: 'fadeInDown 0.6s ease-out'}}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Over Quick-O</h1>
          <p className="text-xl text-white/90">
            De gratis woordenlijsten trainer voor iedereen
          </p>
        </div>

        {/* What is Quick-O */}
        <section id="over-quick-o" className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20 mb-8 transition-all duration-300" style={{animation: 'slideInUp 0.6s ease-out'}}>
          <h2 className="text-3xl font-bold text-white mb-4">Wat is Quick-O?</h2>
          <p className="text-white/90 mb-4 leading-relaxed">
            Quick-O is een moderne, gebruiksvriendelijke woordenlijsten trainer. Of je nu Engels, Frans, Spaans of een ander vak studeert, Quick-O helpt je om snel en effectief te leren.
          </p>
          <p className="text-white/90 leading-relaxed">
            Maak je eigen woordenlijsten, deel ze met klasgenoten, en oefen waar en wanneer je wilt. Geen gedoe, geen abonnement — gewoon gratis leren.
          </p>
        </section>

        {/* Features */}
        <section className="mb-8" style={{animation: 'slideInUp 0.6s ease-out 0.1s backwards'}}>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Waarom Quick-O?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature: Create */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white mb-2">Maak je eigen sets</h3>
                  <p className="text-sm text-white/80">
                    Voeg woorden en definities toe. Organiseer je leerinhoud op jouw manier.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Share */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <Share2 className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white mb-2">Deel met anderen</h3>
                  <p className="text-sm text-white/80">
                    Genereer een link en deel je woordenlijsten met klasgenoten. Leer samen.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Fast */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <Zap className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white mb-2">Snel en efficiënt</h3>
                  <p className="text-sm text-white/80">
                    Meerdere oefenmodi: leren, typen, flashcards. Kies wat voor jou werkt.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Secure */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white mb-2">Veilig & Privé</h3>
                  <p className="text-sm text-white/80">
                    Je gegevens zijn versleuteld. Maak je sets anoniem of persoonlijk.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Track */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white mb-2">Volg je voortgang</h3>
                  <p className="text-sm text-white/80">
                    Zie welke woorden je al beheerst en waar je nog aan kunt werken.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Community */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white mb-2">Community</h3>
                  <p className="text-sm text-white/80">
                    Ontdek sets van anderen, deel tips, en leer samen met de Quick-O community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Developer Section */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20 mb-8 hover:bg-white/20 transition-all duration-300" style={{animation: 'slideInUp 0.6s ease-out 0.2s backwards'}}>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Over de Developer</h2>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <img 
              src="/kiko-dehondt.jpg" 
              alt="Kiko Dehondt" 
              className="w-48 h-48 rounded-full object-cover border-4 border-white/30 shadow-xl"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">Kiko Dehondt</h3>
              <p className="text-white/80 mb-3 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Full-Stack Developer & Student Handelsingenieur
              </p>
              <p className="text-white/90 leading-relaxed mb-4">
                Ik ben Kiko Dehondt, student Handelsingenieur aan KU Leuven Campus Kortrijk. Als developer ben ik gepassioneerd door het bouwen van gebruiksvriendelijke web-applicaties die échte problemen oplossen. Quick-O ontstond uit mijn eigen frustratie met bestaande leer-apps — ik wilde iets eenvoudigs, snel en gratis.
              </p>
              <p className="text-white/90 leading-relaxed mb-4">
                Met een sterke interesse in technologie, bedrijfsbeheer en design, combineer ik technische skills met een oog voor UX. Naast mijn studies werk ik aan verschillende projecten zoals Quick-O om studenten te helpen effectiever te leren.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="https://github.com/kikodehondt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/kiko-dehondt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105"
                >
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20 mb-8 hover:bg-white/20 transition-all duration-300" style={{animation: 'slideInUp 0.6s ease-out 0.3s backwards'}}>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Veelgestelde Vragen</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-white mb-2 text-lg">Is Quick-O echt gratis?</h3>
              <p className="text-white/80 leading-relaxed">
                Ja! Quick-O is volledig gratis. Geen verborgen kosten, geen premiumplan. Maak zo veel woordenlijsten als je wilt.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 text-lg">Hoe deel ik mijn woordenlijsten?</h3>
              <p className="text-white/80 leading-relaxed">
                Nadat je een woordenlijst hebt gemaakt, zie je een "Deel" knop. Copy de link en stuur hem naar vrienden of klasgenoten. Klaar!
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 text-lg">Kan ik mijn woordenlijsten privé houden?</h3>
              <p className="text-white/80 leading-relaxed">
                Absoluut. Je kunt kiezen om je woordenlijsten anoniem te publiceren of ze privé te houden. Alleen mensen met de link kunnen ze zien.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 text-lg">Welke talen ondersteunt Quick-O?</h3>
              <p className="text-white/80 leading-relaxed">
                Alle talen! Engels, Frans, Nederlands, Spaans, Duits, Japans... voeg gewoon de woorden in die je wilt leren.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 text-lg">Hoe kan ik feedback geven?</h3>
              <p className="text-white/80 leading-relaxed">
                We horen graag van je! Stuur een e-mail naar contact@kikodehondt.be met suggesties, vragen of bugs.
              </p>
            </div>
          </div>
        </section>

        {/* Close Button */}
        <div className="text-center pb-8" style={{animation: 'slideInUp 0.6s ease-out 0.4s backwards'}}>
          <button
            onClick={() => {
              // Scroll to top first
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
              
              // Wait for scroll animation to complete before closing
              // Average scroll speed is ~500px/sec with smooth behavior
              // Calculate approximate time based on current scroll position
              const scrollDistance = window.pageYOffset
              const scrollDuration = Math.min(scrollDistance / 500 * 1000, 2000) // Max 2 seconds
              
              setTimeout(() => {
                onClose()
              }, scrollDuration)
            }}
            className="px-8 py-4 rounded-2xl bg-white/20 border-2 border-white/30 text-white font-bold hover:bg-white/30 hover:scale-105 transition-all duration-300 shadow-xl backdrop-blur"
          >
            Terug naar Home
          </button>
        </div>
      </div>
    </div>
  )
}
