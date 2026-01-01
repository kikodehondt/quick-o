import { BookOpen, Share2, Zap, Lock, BarChart3, Users, Code2, Github, Linkedin, Globe } from 'lucide-react'

export default function AboutPage() {
  return (
    <div id="about-section" className="min-h-screen p-4 md:p-8 text-white relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
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
            Quick-O is een moderne, gebruiksvriendelijke woordenlijsten trainer die gebouwd is voor snelheid, eenvoud en plezier. Of je nu Engels, Frans, Spaans of een ander vak studeert, Quick-O helpt je om woorden sneller te onthouden met oefenmodi zoals leren, typen en flashcards.
          </p>
          <p className="text-white/90 mb-4 leading-relaxed">
            Je maakt in minuten je eigen woordenlijsten, deelt ze via een link met klasgenoten en oefent op elk toestel. Alles is gratis: geen abonnementen, geen paywalls, gewoon direct starten met leren.
          </p>
          <p className="text-white/90 mb-4 leading-relaxed">
            Quick-O bewaart je voortgang, laat je sets anoniem of persoonlijk delen, en werkt soepel op mobiel en desktop. Zo kun je dagelijks korte sessies doen en toch consistent vooruitgang boeken.
          </p>
          <p className="text-white/90 leading-relaxed">
            Daarnaast is Quick-O een PWA: je kunt het installeren als app, ook offline je lijsten bekijken, en het blijft licht en snel. We focussen op privacy (geen trackers, geen verborgen kosten) en op samenwerken: deel je sets met een link, werk samen in de klas en volg precies wat je nog moet herhalen.
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
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-xl border border-white/20 mb-8 hover:bg-white/20 transition-all duration-300" style={{animation: 'slideInUp 0.6s ease-out 0.2s backwards'}}>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">Over de Developer</h2>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <img 
              src="/kiko-dehondt.jpg" 
              alt="Kiko Dehondt" 
              className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-white/30 shadow-xl flex-shrink-0"
            />
            <div className="flex-1 w-full overflow-hidden">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Kiko Dehondt</h3>
              <p className="text-white/80 mb-3 flex items-center gap-2 text-sm md:text-base">
                <Code2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="break-words">Full-Stack Developer & Student Handelsingenieur</span>
              </p>
              <p className="text-white/90 leading-relaxed mb-4 text-sm md:text-base break-words">
                Ik ben Kiko Dehondt, student Handelsingenieur aan KU Leuven Campus Kortrijk. Als developer ben ik gepassioneerd door het bouwen van gebruiksvriendelijke web-applicaties die échte problemen oplossen. Quick-O ontstond uit mijn eigen frustratie met bestaande leer-apps — ik wilde iets eenvoudigs, snel en gratis.
              </p>
              <p className="text-white/90 leading-relaxed mb-4 text-sm md:text-base break-words">
                Met een sterke interesse in technologie, bedrijfsbeheer en design, combineer ik technische skills met een oog voor UX. Naast mijn studies werk ik aan verschillende projecten zoals Quick-O om studenten te helpen effectiever te leren.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6 w-full">
                <a
                  href="https://www.kikodehondt.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105"
                  title="Portfolio"
                >
                  <Globe className="w-5 h-5" />
                  <span className="hidden sm:inline">Portfolio</span>
                </a>
                <a
                  href="https://github.com/kikodehondt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105"
                >
                  <Github className="w-5 h-5" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/kiko-dehondt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105"
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="hidden sm:inline">LinkedIn</span>
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
                We horen graag van je! Stuur een e-mail naar <a href="mailto:contact@quick-o.be" className="text-white font-bold hover:text-white/90 no-underline transition-all">contact@quick-o.be</a> met suggesties, vragen of bugs.
              </p>
            </div>
          </div>
        </section>

        {/* Scroll to Top Button */}
        <div className="text-center pb-2" style={{animation: 'slideInUp 0.6s ease-out 0.4s backwards'}}>
          <button
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
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
