import { BookOpen, Share2, Zap, Lock, BarChart3, Users } from 'lucide-react'

interface AboutPageProps {
  onClose: () => void
}

export default function AboutPage({ onClose }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Over Quick-O</h1>
          <p className="text-xl text-gray-600">
            De gratis woordenlijsten trainer voor iedereen
          </p>
        </div>

        {/* What is Quick-O */}
        <section className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wat is Quick-O?</h2>
          <p className="text-gray-700 mb-4">
            Quick-O is een moderne, gebruiksvriendelijke woordenlijsten trainer. Of je nu Engels, Frans, Spaans of een ander vak studeert, Quick-O helpt je om snel en effectief te leren.
          </p>
          <p className="text-gray-700">
            Maak je eigen woordenlijsten, deel ze met klasgenoten, en oefen waar en wanneer je wilt. Geen gedoe, geen abonnement — gewoon gratis leren.
          </p>
        </section>

        {/* Features */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Waarom Quick-O?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature: Create */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Maak je eigen sets</h3>
                  <p className="text-sm text-gray-600">
                    Voeg woorden en definities toe. Organiseer je leerinhoud op jouw manier.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Share */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Share2 className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Deel met anderen</h3>
                  <p className="text-sm text-gray-600">
                    Genereer een link en deel je woordenlijsten met klasgenoten. Leer samen.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Fast */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Zap className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Snel en efficiënt</h3>
                  <p className="text-sm text-gray-600">
                    Meerdere oefenmodi: lezen, typen, flashcards. Kies wat voor jou werkt.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Secure */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Veilig & Privé</h3>
                  <p className="text-sm text-gray-600">
                    Je gegevens zijn versleuteld. Maak je sets anoniem of persoonlijk.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Track */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Volg je voortgang</h3>
                  <p className="text-sm text-gray-600">
                    Zie welke woorden je al beheerst en waar je nog aan kunt werken.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature: Community */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Community</h3>
                  <p className="text-sm text-gray-600">
                    Ontdek sets van anderen, deel tips, en leer samen met de Quick-O community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Veelgestelde Vragen</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Is Quick-O echt gratis?</h3>
              <p className="text-gray-700">
                Ja! Quick-O is volledig gratis. Geen verborgen kosten, geen premiumplan. Maak zo veel woordenlijsten als je wilt.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Hoe deel ik mijn woordenlijsten?</h3>
              <p className="text-gray-700">
                Nadat je een woordenlijst hebt gemaakt, zie je een "Deel" knop. Copy de link en stuur hem naar vrienden of klasgenoten. Klaar!
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Kan ik mijn woordenlijsten privé houden?</h3>
              <p className="text-gray-700">
                Absoluut. Je kunt kiezen om je woordenlijsten anoniem te publiceren of ze privé te houden. Alleen mensen met de link kunnen ze zien.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Welke talen ondersteunt Quick-O?</h3>
              <p className="text-gray-700">
                Alle talen! Engels, Frans, Nederlands, Spaans, Duits, Japans... voeg gewoon de woorden in die je wilt leren.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Hoe kan ik feedback geven?</h3>
              <p className="text-gray-700">
                We horen graag van je! Je kunt direct een e-mail sturen naar support@quick-o.com met suggesties, vragen of bugs.
              </p>
            </div>
          </div>
        </section>

        {/* Close Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="btn-gradient text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Terug naar Home
          </button>
        </div>
      </div>
    </div>
  )
}
