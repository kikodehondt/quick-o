import { Shield, Database, Cookie, Mail, FileText, Users, Lock, Home } from 'lucide-react'

interface PrivacyPolicyProps {
  onBack: () => void
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen p-4 md:p-8 text-white relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
        >
          <Home className="w-4 h-4" />
          Terug naar Home
        </button>
        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-12 shadow-xl border border-white/20">
          <div className="flex items-center gap-4 mb-8">
            <Shield className="w-12 h-12 text-white" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacybeleid</h1>
              <p className="text-white/80 text-sm">Laatst bijgewerkt: 1 januari 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-white">
            {/* Introductie */}
            <section>
              <p className="text-white/90 leading-relaxed">
                Quick-O ("wij", "ons" of "de dienst") hecht groot belang aan je privacy. Dit privacybeleid legt uit welke gegevens we verzamelen, hoe we deze gebruiken, en welke rechten je hebt onder de Algemene Verordening Gegevensbescherming (AVG/GDPR).
              </p>
            </section>

            {/* 1. Welke gegevens verzamelen we? */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Database className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">1. Welke gegevens verzamelen we?</h2>
              </div>
              <div className="ml-9 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">1.1 Accountgegevens</h3>
                  <p className="text-white/90 leading-relaxed">
                    Wanneer je een account aanmaakt, verzamelen we:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-white/90 space-y-1">
                    <li><strong>E-mailadres</strong> - voor login en communicatie</li>
                    <li><strong>Naam</strong> (optioneel) - voor personalisatie</li>
                    <li><strong>Wachtwoord</strong> - versleuteld opgeslagen, nooit leesbaar voor ons</li>
                    <li><strong>Google profiel</strong> (bij Google login) - naam, e-mail en profielfoto</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">1.2 Gebruiksgegevens</h3>
                  <p className="text-white/90 leading-relaxed">
                    Om de dienst te leveren, slaan we op:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-white/90 space-y-1">
                    <li><strong>Woordenlijsten</strong> - sets die je aanmaakt of importeert</li>
                    <li><strong>Studiegegevens</strong> - je voortgang, scores en statistieken</li>
                    <li><strong>Metadata</strong> - tijdstempels, instellingen, voorkeuren</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">1.3 Analytische gegevens (Cookies)</h3>
                  <p className="text-white/90 leading-relaxed">
                    We gebruiken Vercel Analytics voor anonieme bezoekersstatistieken:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 text-white/90 space-y-1">
                    <li><strong>Paginaweergaven</strong> - welke pagina's je bezoekt</li>
                    <li><strong>Apparaattype</strong> - desktop, tablet of mobiel</li>
                    <li><strong>Locatie</strong> - land/regio (geen exacte locatie)</li>
                    <li><strong>Verwijzende site</strong> - vanwaar je kwam</li>
                  </ul>
                  <p className="text-white/90 leading-relaxed mt-2">
                    Deze gegevens zijn <strong>volledig anoniem</strong> en bevatten geen persoonlijk identificeerbare informatie.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Waarvoor gebruiken we je gegevens? */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">2. Waarvoor gebruiken we je gegevens?</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">We gebruiken je gegevens uitsluitend voor:</p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>Het leveren en verbeteren van de Quick-O dienst</li>
                  <li>Authenticatie en accountbeheer</li>
                  <li>Opslaan van je woordenlijsten en voortgang</li>
                  <li>Het versturen van belangrijke e-mails (wachtwoord reset, bevestigingen)</li>
                  <li>Anonieme analyse van gebruik voor verbeteringen</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  <strong>We verkopen nooit je gegevens aan derden.</strong> We gebruiken je gegevens niet voor advertenties of marketing.
                </p>
              </div>
            </section>

            {/* 3. Waar worden gegevens opgeslagen? */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">3. Waar worden gegevens opgeslagen?</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Je gegevens worden veilig opgeslagen bij:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-2">
                  <li>
                    <strong>Supabase</strong> (database) - servers in de EU (Frankfurt, Duitsland)
                    <br />
                    <span className="text-sm text-white/70">Supabase is GDPR-compliant en ISO 27001 gecertificeerd</span>
                  </li>
                  <li>
                    <strong>Vercel</strong> (hosting) - servers wereldwijd via CDN
                    <br />
                    <span className="text-sm text-white/70">Vercel Analytics gebruikt geen persoonlijke cookies</span>
                  </li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  Alle communicatie verloopt via <strong>HTTPS</strong> (versleuteld). Wachtwoorden worden <strong>gehashed</strong> met moderne encryptie.
                </p>
              </div>
            </section>

            {/* 4. Cookies */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">4. Gebruik van Cookies</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Quick-O gebruikt de volgende cookies:
                </p>
                <div className="space-y-3 mt-3">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">Essentiële Cookies (Vereist)</h4>
                    <p className="text-sm text-white/80">
                      Authenticatie cookies van Supabase om je ingelogd te houden. Deze zijn technisch noodzakelijk.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">Analytische Cookies (Optioneel)</h4>
                    <p className="text-sm text-white/80">
                      Vercel Analytics voor anonieme bezoekersstatistieken. Je kunt deze accepteren of weigeren via de cookie banner.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">Voorkeurscookies (Lokaal)</h4>
                    <p className="text-sm text-white/80">
                      LocalStorage voor studievoorkeuren en UI-instellingen. Deze blijven lokaal op je apparaat.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Delen met derden */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Users className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">5. Delen we gegevens met derden?</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  We delen <strong>geen persoonlijke gegevens</strong> met derden, behalve:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li><strong>Supabase</strong> - voor database en authenticatie (verwerkersovereenkomst)</li>
                  <li><strong>Vercel</strong> - voor hosting en anonieme analytics</li>
                  <li><strong>Google</strong> - alleen als je kiest voor Google login</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  Deze diensten zijn GDPR-compliant en fungeren als verwerkingsverantwoordelijken.
                </p>
              </div>
            </section>

            {/* 6. Je rechten onder GDPR */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">6. Je rechten onder de AVG (GDPR)</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Onder de AVG heb je de volgende rechten:
                </p>
                <div className="space-y-3 mt-3">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">🔍 Recht op inzage</h4>
                    <p className="text-sm text-white/80">
                      Je kunt opvragen welke gegevens we van je hebben. Stuur een e-mail naar contact@quick-o.be.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">✏️ Recht op correctie</h4>
                    <p className="text-sm text-white/80">
                      Je kunt je gegevens aanpassen via je profielinstellingen in de app.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">🗑️ Recht op verwijdering</h4>
                    <p className="text-sm text-white/80">
                      Je kunt je account en alle gegevens permanent verwijderen. Stuur een verzoek naar contact@quick-o.be.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">📦 Recht op dataportabiliteit</h4>
                    <p className="text-sm text-white/80">
                      Je kunt een export van al je gegevens aanvragen in JSON-formaat.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-1">🚫 Recht op bezwaar</h4>
                    <p className="text-sm text-white/80">
                      Je kunt bezwaar maken tegen gegevensverwerking. Neem contact op voor details.
                    </p>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed mt-4">
                  <strong>Hoe oefen je je rechten uit?</strong><br />
                  Stuur een e-mail naar <a href="mailto:contact@quick-o.be" className="underline hover:text-white/70">contact@quick-o.be</a> met je verzoek. We reageren binnen 30 dagen.
                </p>
              </div>
            </section>

            {/* 7. Bewaartermijn */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">7. Hoe lang bewaren we gegevens?</h2>
              </div>
              <div className="ml-9 space-y-2">
                <ul className="list-disc list-inside text-white/90 space-y-1">
                  <li><strong>Actieve accounts</strong> - zolang je account bestaat</li>
                  <li><strong>Verwijderde accounts</strong> - 30 dagen backup, daarna permanent gewist</li>
                  <li><strong>Anonieme analytics</strong> - maximaal 90 dagen</li>
                  <li><strong>E-maillogs</strong> - 30 dagen voor debugging</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  Na accountverwijdering worden alle persoonlijke gegevens permanent verwijderd, inclusief woordenlijsten en voortgang.
                </p>
              </div>
            </section>

            {/* 8. Beveiliging */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">8. Hoe beveiligen we je gegevens?</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  We nemen beveiliging serieus:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li><strong>HTTPS</strong> - alle communicatie versleuteld</li>
                  <li><strong>Hashed passwords</strong> - nooit leesbaar opgeslagen</li>
                  <li><strong>Row Level Security</strong> - strikte toegangscontrole in database</li>
                  <li><strong>Two-factor authentication</strong> - optioneel beschikbaar</li>
                  <li><strong>Regular security audits</strong> - continue monitoring</li>
                </ul>
              </div>
            </section>

            {/* 9. Kinderen */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Users className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">9. Kinderen en Privacy</h2>
              </div>
              <div className="ml-9">
                <p className="text-white/90 leading-relaxed">
                  Quick-O is geschikt voor alle leeftijden. Voor kinderen onder de 16 jaar is <strong>toestemming van ouders of voogd vereist</strong> onder de AVG. Door een account aan te maken, bevestig je dat je 16+ bent of toestemming hebt.
                </p>
              </div>
            </section>

            {/* 10. Wijzigingen */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">10. Wijzigingen in dit beleid</h2>
              </div>
              <div className="ml-9">
                <p className="text-white/90 leading-relaxed">
                  We kunnen dit privacybeleid aanpassen. Grote wijzigingen communiceren we via e-mail. Check regelmatig deze pagina voor updates. De "laatst bijgewerkt" datum staat bovenaan.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-white/20 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">Contact</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Vragen over dit privacybeleid of je gegevens?
                </p>
                <div className="space-y-1 text-white/90">
                  <p><strong>E-mail:</strong> <a href="mailto:contact@quick-o.be" className="underline hover:text-white/70">contact@quick-o.be</a></p>
                  <p><strong>Website:</strong> <a href="https://www.quick-o.be" className="underline hover:text-white/70">www.quick-o.be</a></p>
                </div>
                <p className="text-white/90 leading-relaxed mt-4">
                  <strong>Klacht indienen?</strong><br />
                  Als je niet tevreden bent met onze reactie, kun je een klacht indienen bij de Belgische Gegevensbeschermingsautoriteit (GBA): <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">www.gegevensbeschermingsautoriteit.be</a>
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer with Legal Links */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/70 text-sm">
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button
                onClick={onBack}
                className="hover:text-white transition-colors underline"
              >
                Home
              </button>
              <a
                href="mailto:contact@quick-o.be"
                className="hover:text-white transition-colors underline"
              >
                Contact
              </a>
            </div>
            <div className="text-center md:text-right">
              © {new Date().getFullYear()} Kiko Dehondt. Alle rechten voorbehouden.
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
