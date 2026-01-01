import { FileText, AlertTriangle, Scale, Shield, Ban, Home } from 'lucide-react'

interface TermsOfServiceProps {
  onBack: () => void
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
            <Scale className="w-12 h-12 text-white" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Algemene Voorwaarden</h1>
              <p className="text-white/80 text-sm">Laatst bijgewerkt: 1 januari 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-white">
            {/* Introductie */}
            <section>
              <p className="text-white/90 leading-relaxed">
                Welkom bij Quick-O! Door gebruik te maken van onze dienst, ga je akkoord met deze algemene voorwaarden. Lees ze aandachtig door.
              </p>
            </section>

            {/* 1. Acceptatie van voorwaarden */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">1. Acceptatie van Voorwaarden</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Door een account aan te maken of Quick-O te gebruiken, ga je akkoord met:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>Deze algemene voorwaarden</li>
                  <li>Ons <a href="#" onClick={(e) => { e.preventDefault(); /* Link naar privacy policy */ }} className="underline hover:text-white/70">privacybeleid</a></li>
                  <li>Alle toepasselijke wet- en regelgeving</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  Als je niet akkoord gaat met deze voorwaarden, mag je de dienst niet gebruiken.
                </p>
              </div>
            </section>

            {/* 2. Beschrijving van de dienst */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">2. Beschrijving van de Dienst</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Quick-O is een <strong>gratis online woordenlijsten trainer</strong> die gebruikers in staat stelt:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>Woordenlijsten (vocabulaire sets) aan te maken en op te slaan</li>
                  <li>Te oefenen met verschillende studiemodi (flashcards, typen, leren, multiple choice)</li>
                  <li>Sets te delen via links met anderen</li>
                  <li>Voortgang bij te houden</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  De dienst is toegankelijk via web browser en kan worden gebruikt als Progressive Web App (PWA).
                </p>
              </div>
            </section>

            {/* 3. Accountregistratie */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">3. Account Registratie</h2>
              </div>
              <div className="ml-9 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">3.1 Leeftijd</h3>
                  <p className="text-white/90 leading-relaxed">
                    Je moet minimaal <strong>16 jaar oud</strong> zijn om een account aan te maken. Gebruikers jonger dan 16 hebben toestemming van een ouder of voogd nodig.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">3.2 Accountbeveiliging</h3>
                  <p className="text-white/90 leading-relaxed">
                    Je bent verantwoordelijk voor:
                  </p>
                  <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                    <li>Het geheimhouden van je wachtwoord</li>
                    <li>Alle activiteiten onder jouw account</li>
                    <li>Het onmiddellijk melden van ongeautoriseerd gebruik</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">3.3 Juiste informatie</h3>
                  <p className="text-white/90 leading-relaxed">
                    Je moet accurate en actuele informatie verstrekken. Het gebruik van valse identiteiten of misleidende informatie is verboden.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Gebruikersverantwoordelijkheden */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">4. Gebruikersverantwoordelijkheden</h2>
              </div>
              <div className="ml-9 space-y-4">
                <p className="text-white/90 leading-relaxed">
                  Bij het gebruik van Quick-O, ga je ermee akkoord dat je <strong>NIET</strong>:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-2">
                  <li><strong>Illegale content</strong> uploadt of deelt (bijvoorbeeld auteursrechtelijk beschermde werken zonder toestemming)</li>
                  <li><strong>Schadelijke content</strong> plaatst (haatzaaiend, beledigend, dreigend, pornografisch, gewelddadig)</li>
                  <li><strong>Spam of malware</strong> verspreidt</li>
                  <li><strong>De dienst misbruikt</strong> voor commerciële doeleinden zonder toestemming</li>
                  <li><strong>Anderen lastigvalt</strong> of hun privacy schendt</li>
                  <li><strong>De beveiliging</strong> probeert te omzeilen of te hacken</li>
                  <li><strong>Bots of geautomatiseerde systemen</strong> gebruikt zonder toestemming</li>
                  <li><strong>Valse of misleidende informatie</strong> verspreidt</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4 bg-red-500/20 border border-red-300/30 rounded-lg p-4">
                  <strong>⚠️ Schending van deze regels kan leiden tot directe verwijdering van je account en content, zonder voorafgaande waarschuwing.</strong>
                </p>
              </div>
            </section>

            {/* 5. Content en intellectueel eigendom */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">5. Content en Intellectueel Eigendom</h2>
              </div>
              <div className="ml-9 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">5.1 Jouw content</h3>
                  <p className="text-white/90 leading-relaxed">
                    <strong>Je behoudt alle rechten</strong> op de woordenlijsten en content die je aanmaakt. Door content te uploaden, geef je Quick-O een <strong>niet-exclusieve licentie</strong> om:
                  </p>
                  <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                    <li>Je content op te slaan en weer te geven</li>
                    <li>Je content te delen als je dat via de deelfunctie toestaat</li>
                    <li>Back-ups te maken voor herstel</li>
                  </ul>
                  <p className="text-white/90 leading-relaxed mt-2">
                    Deze licentie eindigt wanneer je de content verwijdert.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">5.2 Quick-O's intellectueel eigendom</h3>
                  <p className="text-white/90 leading-relaxed">
                    Alle rechten op de Quick-O applicatie, code, design, logo's en merken behoren toe aan Quick-O (Kiko Dehondt). Je mag deze niet kopiëren, modificeren of hergebruiken zonder toestemming.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">5.3 Auteursrechtschending</h3>
                  <p className="text-white/90 leading-relaxed">
                    Als je auteursrechtelijk beschermde content uploadt zonder toestemming, kunnen we je content verwijderen en je account opschorten. Herhaalde schendingen leiden tot permanente verwijdering.
                  </p>
                  <p className="text-white/90 leading-relaxed mt-2">
                    <strong>DMCA-meldingen:</strong> Stuur naar <a href="mailto:contact@quick-o.be" className="underline hover:text-white/70">contact@quick-o.be</a>
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Beschikbaarheid van de dienst */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">6. Beschikbaarheid van de Dienst</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Quick-O wordt geleverd <strong>"as is"</strong> en <strong>"as available"</strong>. We streven naar 99.9% uptime, maar kunnen niet garanderen dat de dienst:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>Altijd beschikbaar is (onderhoud, technische problemen)</li>
                  <li>Foutloos werkt</li>
                  <li>Zonder onderbrekingen verloopt</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  We zijn <strong>niet aansprakelijk</strong> voor:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>Verlies van data door technische storingen</li>
                  <li>Schade door downtime of bugs</li>
                  <li>Verlies van studieresultaten of voortgang</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4 bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-4">
                  <strong>💡 Maak altijd back-ups van belangrijke woordenlijsten!</strong> Export je sets regelmatig.
                </p>
              </div>
            </section>

            {/* 7. Gratis dienst */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">7. Gratis Dienst</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Quick-O is momenteel <strong>100% gratis</strong>. We behouden ons het recht voor om:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>In de toekomst premium features te introduceren</li>
                  <li>Beperkingen in te stellen (bijv. max aantal sets per gebruiker)</li>
                  <li>De dienst te beëindigen (met 30 dagen vooraankondiging)</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  <strong>Bestaande gratis features blijven altijd gratis voor huidige gebruikers.</strong>
                </p>
              </div>
            </section>

            {/* 8. Beëindiging */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Ban className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">8. Beëindiging van Account</h2>
              </div>
              <div className="ml-9 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">8.1 Door jou</h3>
                  <p className="text-white/90 leading-relaxed">
                    Je kunt je account op elk moment verwijderen. Stuur een verzoek naar <a href="mailto:contact@quick-o.be" className="underline hover:text-white/70">contact@quick-o.be</a>. Je gegevens worden binnen 30 dagen permanent verwijderd.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">8.2 Door Quick-O</h3>
                  <p className="text-white/90 leading-relaxed">
                    We kunnen je account opschorten of beëindigen als je:
                  </p>
                  <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                    <li>Deze voorwaarden schendt</li>
                    <li>Illegale activiteiten uitvoert</li>
                    <li>De dienst misbruikt</li>
                    <li>Anderen schaadt of lastigvalt</li>
                  </ul>
                  <p className="text-white/90 leading-relaxed mt-2">
                    Bij ernstige schendingen kunnen we je account <strong>direct verwijderen zonder waarschuwing</strong>.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">8.3 Effect van beëindiging</h3>
                  <p className="text-white/90 leading-relaxed">
                    Bij beëindiging verliezen je toegang tot je account en alle opgeslagen content (woordenlijsten, voortgang). <strong>Verwijderde data kan niet worden hersteld.</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* 9. Aansprakelijkheid */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">9. Beperking van Aansprakelijkheid</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Voor zover toegestaan door de wet, is Quick-O <strong>niet aansprakelijk</strong> voor:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>Indirecte, incidentele of gevolgschade</li>
                  <li>Verlies van data, winst of omzet</li>
                  <li>Schade door het gebruik van de dienst</li>
                  <li>Content van andere gebruikers</li>
                  <li>Technische storingen of bugs</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  <strong>Maximale aansprakelijkheid:</strong> €100 (indien van toepassing).
                </p>
              </div>
            </section>

            {/* 10. Wijzigingen */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">10. Wijzigingen in Voorwaarden</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  We kunnen deze algemene voorwaarden op elk moment wijzigen. Belangrijke wijzigingen communiceren we via:
                </p>
                <ul className="list-disc list-inside ml-4 text-white/90 space-y-1">
                  <li>E-mail naar je geregistreerde adres</li>
                  <li>Melding in de app</li>
                  <li>Update van de "laatst bijgewerkt" datum</li>
                </ul>
                <p className="text-white/90 leading-relaxed mt-4">
                  Voortgezet gebruik na wijziging betekent dat je de nieuwe voorwaarden accepteert.
                </p>
              </div>
            </section>

            {/* 11. Toepasselijk recht */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <Scale className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">11. Toepasselijk Recht</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Deze voorwaarden worden beheerst door <strong>Belgisch recht</strong>. Geschillen worden voorgelegd aan de bevoegde rechtbanken in <strong>België</strong>.
                </p>
                <p className="text-white/90 leading-relaxed mt-4">
                  Voor consumenten binnen de EU gelden ook de consumentenbeschermingswetten van hun woonland.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-white/20 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold">Contact</h2>
              </div>
              <div className="ml-9 space-y-2">
                <p className="text-white/90 leading-relaxed">
                  Vragen over deze voorwaarden?
                </p>
                <div className="space-y-1 text-white/90">
                  <p><strong>E-mail:</strong> <a href="mailto:contact@quick-o.be" className="underline hover:text-white/70">contact@quick-o.be</a></p>
                  <p><strong>Website:</strong> <a href="https://www.quick-o.be" className="underline hover:text-white/70">www.quick-o.be</a></p>
                </div>
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
