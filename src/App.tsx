import React, { useState, useEffect } from 'react';

// --- Static Data & Configuration ---

// Define types for the data structure to prevent TypeScript errors
type RentRates = [number, number, number]; // [minoré, référence, majoré]
type PiecesData = { [key: string]: RentRates };
type ZoneData = { [key: string]: PiecesData };

interface RentDataStructure {
    'non-meuble': ZoneData;
    'majoration-meuble': number;
}

const rentData: RentDataStructure = {
    'non-meuble': {
        '1': { '1': [10.0, 14.3, 17.2], '2': [8.8, 12.6, 15.1], '3': [7.9, 11.3, 13.6], '4': [7.7, 11.0, 13.2] },
        '2': { '1': [9.1, 13.0, 15.6], '2': [8.0, 11.4, 13.7], '3': [7.2, 10.3, 12.4], '4': [7.0, 10.0, 12.0] },
        '3': { '1': [8.4, 12.0, 14.4], '2': [7.4, 10.5, 12.6], '3': [6.8, 9.7, 11.6], '4': [6.6, 9.4, 11.3] },
        '4': { '1': [7.8, 11.2, 13.4], '2': [6.9, 9.8, 11.8], '3': [6.3, 9.0, 10.8], '4': [6.1, 8.7, 10.4] }
    },
    'majoration-meuble': 1.15 // +15%
};

// --- Main App Component ---
const App: React.FC = () => {
  // --- State Management ---
  const [zone, setZone] = useState('1');
  const [pieces, setPieces] = useState('1');
  const [surface, setSurface] = useState(50);
  const [typeLocation, setTypeLocation] = useState<'meuble' | 'non-meuble'>('non-meuble');
  
  const [results, setResults] = useState({ loyerMinore: 0, loyerRef: 0, loyerMajore: 0 });
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  // --- Calculation Engine ---
  useEffect(() => {
    const baseData = rentData['non-meuble'][zone]?.[pieces];
    if (!baseData) return;

    let [minore, ref, majore] = baseData;
    
    if (typeLocation === 'meuble') {
      const majoration = rentData['majoration-meuble'];
      minore *= majoration;
      ref *= majoration;
      majore *= majoration;
    }

    setResults({
      loyerMinore: minore * surface,
      loyerRef: ref * surface,
      loyerMajore: majore * surface,
    });
  }, [zone, pieces, surface, typeLocation]);

  // --- Email form handler ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setEmailMessage('Veuillez saisir une adresse e-mail valide.');
        return;
    }
    setIsSending(true);
    setEmailMessage('');

    const simulationData = {
        objectifs: {
            zone: `Zone ${zone}`,
            pieces: `${pieces} pièce(s)`,
            surface: `${surface} m²`,
            typeLocation: typeLocation === 'meuble' ? 'Meublé' : 'Non meublé',
        },
        resultats: {
            loyerMinore: results.loyerMinore.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
            loyerRef: results.loyerRef.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
            loyerMajore: results.loyerMajore.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
        }
    };

    try {
        const response = await fetch('/.netlify/functions/send-simulation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, data: simulationData, theme: "Loyer Bordeaux" }),
        });
        if (!response.ok) throw new Error("Erreur lors de l'envoi.");
        setEmailMessage(`Les résultats ont été envoyés à ${email}.`);
        setEmail('');
    } catch (error) {
        console.error('Failed to send simulation:', error);
        setEmailMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
        setIsSending(false);
        setTimeout(() => setEmailMessage(''), 5000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 sm:p-8 font-sans flex items-center justify-center min-h-screen">
      <div className="bg-slate-800/50 backdrop-blur-sm ring-1 ring-white/10 p-6 sm:p-10 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto">
        
        <div className="text-center mb-10">
            <img src="/generique-turquoise.svg" alt="Logo Aeternia Patrimoine" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-100">Encadrement des Loyers à Bordeaux</h1>
            <p className="text-slate-300 mt-2">Estimez le loyer maximum autorisé pour votre logement.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            <div className="bg-slate-700/50 p-6 rounded-lg shadow-inner ring-1 ring-white/10">
                <h2 className="text-2xl font-semibold text-[#00FFD2] mb-6">Caractéristiques du logement</h2>
                <form id="rent-form" className="space-y-6">
                    <div>
                        <label htmlFor="zone" className="block text-sm font-medium text-gray-300 mb-1">Zone géographique</label>
                        <select id="zone" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-[#00FFD2] focus:outline-none">
                            <option value="1">Zone 1 (Hypercentre)</option>
                            <option value="2">Zone 2 (Centre-ville)</option>
                            <option value="3">Zone 3 (Boulevards)</option>
                            <option value="4">Zone 4 (Périphérie)</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Ex: Quinconces (Z1), Chartrons (Z2), Nansouty (Z3)...</p>
                    </div>
                    <div>
                        <label htmlFor="pieces" className="block text-sm font-medium text-gray-300 mb-1">Nombre de pièces</label>
                        <select id="pieces" value={pieces} onChange={(e) => setPieces(e.target.value)} className="w-full p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-[#00FFD2] focus:outline-none">
                            <option value="1">1 pièce</option>
                            <option value="2">2 pièces</option>
                            <option value="3">3 pièces</option>
                            <option value="4">4 pièces et plus</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="surface" className="block text-sm font-medium text-gray-300 mb-1">Surface habitable (m²)</label>
                        <input type="number" id="surface" value={surface} onChange={(e) => setSurface(parseFloat(e.target.value))} min="10" className="w-full p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-[#00FFD2] focus:outline-none" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Type de location</label>
                        <div className="flex gap-4 mt-2">
                           <div className="flex items-center">
                                <input type="radio" id="meuble" name="location-type" value="meuble" checked={typeLocation === 'meuble'} onChange={() => setTypeLocation('meuble')} className="h-4 w-4 text-[#00FFD2] bg-slate-600 border-slate-500 focus:ring-[#00FFD2]" />
                                <label htmlFor="meuble" className="ml-2 block text-sm text-gray-300">Meublé</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" id="non-meuble" name="location-type" value="non-meuble" checked={typeLocation === 'non-meuble'} onChange={() => setTypeLocation('non-meuble')} className="h-4 w-4 text-[#00FFD2] bg-slate-600 border-slate-500 focus:ring-[#00FFD2]" />
                                <label htmlFor="non-meuble" className="ml-2 block text-sm text-gray-300">Non meublé</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div className="p-6 bg-slate-700/50 ring-1 ring-white/10 text-white rounded-lg flex flex-col justify-center">
                <h2 className="text-2xl font-semibold text-[#00FFD2] mb-6 text-center">Estimation du Loyer</h2>
                <div className="space-y-4 text-center">
                    <div className="bg-slate-800/50 p-6 rounded-lg border-2 border-[#00FFD2]">
                        <p className="text-md font-bold text-[#00FFD2]">LOYER MAXIMUM AUTORISÉ</p>
                        <p className="text-4xl font-extrabold mt-1">{results.loyerMajore.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                        <p className="text-xs opacity-80">(Loyer de référence majoré)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <p className="text-sm opacity-80">Loyer de référence</p>
                            <p className="text-2xl font-bold">{results.loyerRef.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <p className="text-sm opacity-80">Loyer minimum</p>
                            <p className="text-xl font-bold">{results.loyerMinore.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                        </div>
                    </div>
                </div>
                 <p className="text-xs text-slate-400 mt-6 text-center">Ces montants s'entendent hors charges.</p>
            </div>
        </div>
        
        <div className="mt-10 pt-8 border-t border-slate-600">
             <h3 className="text-lg font-semibold text-gray-100 mb-4 text-center">Passez à l'étape suivante</h3>
             <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2 mb-4 max-w-lg mx-auto">
                <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse e-mail"
                    className="flex-grow bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#00FFD2]"
                    required
                />
                <button type="submit" disabled={isSending} className="bg-slate-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-slate-500 transition-colors duration-300 disabled:opacity-50">
                    {isSending ? 'Envoi...' : 'Recevoir les résultats'}
                </button>
            </form>
            {emailMessage && <p className="text-sm text-center text-emerald-400 mb-4 h-5">{emailMessage}</p>}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <a href="https://www.aeterniapatrimoine.fr/solutions/" target="_blank" rel="noopener noreferrer" className="bg-[#00FFD2] text-slate-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-white transition-colors duration-300 w-full sm:w-auto">
                    Découvrir nos solutions
                </a>
                <a href="https://www.aeterniapatrimoine.fr/contact/" target="_blank" rel="noopener noreferrer" className="bg-transparent border-2 border-[#00FFD2] text-[#00FFD2] font-bold py-3 px-8 rounded-lg hover:bg-[#00FFD2] hover:text-slate-900 transition-colors duration-300 w-full sm:w-auto">
                    Prendre rendez-vous
                </a>
            </div>
        </div>

        <div className="text-center mt-10">
             <div className="text-xs text-slate-400 p-4 bg-slate-900/50 rounded-lg max-w-3xl mx-auto">
                <h3 className="font-semibold text-slate-300 mb-2">Avertissement</h3>
                <p>Ce simulateur fournit une estimation basée sur les données publiées par l'observatoire des loyers. Les résultats sont donnés à titre indicatif et non contractuel. Pour une analyse personnalisée de votre bien, consultez un de nos conseillers.</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;
