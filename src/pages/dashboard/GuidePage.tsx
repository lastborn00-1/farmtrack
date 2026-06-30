import { BookOpen, ChevronRight } from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Farming Guide</h2>
        <p className="text-muted-foreground">Resources for commercial layer farming in Nigeria</p>
      </div>

      <div className="premium-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Nigerian Layer Farming Guide</h3>
          </div>
          
          <div className="space-y-4 text-sm">
            <details className="group bg-muted/30 rounded-xl p-3 border border-border/50">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-foreground">
                <span>1. Feeding Program (Commercial)</span>
                <span className="transition group-open:rotate-90">
                  <ChevronRight className="w-5 h-5" />
                </span>
              </summary>
              <div className="text-sm text-muted-foreground mt-3 pl-2 border-l-2 border-primary/50 space-y-3">
                <p><strong>Popular Brands:</strong> Vital Feed, Top Feeds, Amo Byng, Animal Care, Hybrid Feeds</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li><strong>0-8 Weeks:</strong> Chick Mash (High protein 18-20% for early frame growth)</li>
                  <li><strong>9-15 Weeks:</strong> Grower Mash (Lower protein 15-16% to prevent early onset of lay; focus on frame development)</li>
                  <li><strong>16-18 Weeks:</strong> Pre-Layer Mash (Optional transition, 16-17% protein with slightly increased calcium to prepare medullary bone)</li>
                  <li><strong>19+ Weeks (Laying):</strong> Layer Mash Phase 1 (16-18% protein, high calcium 3.5-4% for eggshell quality)</li>
                </ul>
                <p className="italic mt-2">Note: Always provide unlimited access to clean, cool water, especially during hot weather to reduce heat stress.</p>
              </div>
            </details>

            <details className="group bg-muted/30 rounded-xl p-3 border border-border/50">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-foreground">
                <span>2. Standard Vaccination Schedule</span>
                <span className="transition group-open:rotate-90">
                  <ChevronRight className="w-5 h-5" />
                </span>
              </summary>
              <div className="text-sm text-muted-foreground mt-3 pl-2 border-l-2 border-primary/50 space-y-3">
                <ul className="list-disc pl-4 space-y-2">
                  <li><strong>Day 1:</strong> Marek's Disease (Subcutaneous injection at hatchery)</li>
                  <li><strong>Day 7-10:</strong> Newcastle Disease (NDV) + Infectious Bronchitis (IB) - Intraocular or Drinking water</li>
                  <li><strong>Day 14:</strong> Infectious Bursal Disease (IBD/Gumboro) - Drinking water</li>
                  <li><strong>Day 21:</strong> IBD (Gumboro) Booster - Drinking water</li>
                  <li><strong>Day 28:</strong> NDV + IB Booster (Lasota) - Drinking water</li>
                  <li><strong>Week 6:</strong> Fowl Pox - Wing web puncture</li>
                  <li><strong>Week 8:</strong> Coryza (Optional but recommended in endemic areas) - Intramuscular injection</li>
                  <li><strong>Week 12:</strong> Fowl Cholera - Subcutaneous injection</li>
                  <li><strong>Week 16:</strong> NDV + IB + Egg Drop Syndrome (EDS) Killed Vaccine - Intramuscular injection before laying starts</li>
                  <li><strong>Every 6-8 weeks during lay:</strong> NDV (Lasota) Booster - Drinking water to maintain immunity</li>
                </ul>
              </div>
            </details>

            <details className="group bg-muted/30 rounded-xl p-3 border border-border/50">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-foreground">
                <span>3. Common Diseases, Symptoms & Medications</span>
                <span className="transition group-open:rotate-90">
                  <ChevronRight className="w-5 h-5" />
                </span>
              </summary>
              <div className="text-sm text-muted-foreground mt-3 pl-2 border-l-2 border-primary/50 space-y-4">
                
                <div>
                  <h4 className="font-bold text-foreground">Coccidiosis</h4>
                  <p className="text-xs mb-1"><strong>Symptoms:</strong> Bloody droppings, ruffled feathers, huddling, pale comb.</p>
                  <p className="text-xs"><strong>Treatment:</strong> Amprolium (e.g., Amprol 20%), Toltrazuril (e.g., Baycox), Sulfaquinoxaline. Always supplement with Vitamin K to stop intestinal bleeding.</p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Chronic Respiratory Disease (CRD)</h4>
                  <p className="text-xs mb-1"><strong>Symptoms:</strong> Sneezing, coughing, swollen eyes, nasal discharge, rattling breathing.</p>
                  <p className="text-xs"><strong>Treatment:</strong> Tylosin (e.g., Tylo-Dox), Enrofloxacin (e.g., Enrocare), Erythromycin. Ensure proper ventilation in the poultry house.</p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Infectious Coryza</h4>
                  <p className="text-xs mb-1"><strong>Symptoms:</strong> Foul-smelling nasal discharge, facial swelling (especially under eyes), sneezing, drop in egg production.</p>
                  <p className="text-xs"><strong>Treatment:</strong> Oxytetracycline, Erythromycin, or Sulfa drugs. Vaccinate future flocks (Coryza bacterin) to prevent recurrence.</p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Colibacillosis (E. coli)</h4>
                  <p className="text-xs mb-1"><strong>Symptoms:</strong> Diarrhea, unthrifty birds, swollen abdomen, sudden death.</p>
                  <p className="text-xs"><strong>Treatment:</strong> Neomycin, Colistin, Gentamicin, Enrofloxacin. Improve water sanitation (use water sanitizers like chlorine or Aquaguard) and biosecurity.</p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Fowl Cholera</h4>
                  <p className="text-xs mb-1"><strong>Symptoms:</strong> Sudden death, greenish diarrhea, swollen bluish wattles, fever.</p>
                  <p className="text-xs"><strong>Treatment:</strong> Sulfa drugs, Oxytetracycline (e.g., Alamycin LA), Penicillin. Note: Recovered birds remain carriers.</p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Worms (Helminthiasis)</h4>
                  <p className="text-xs mb-1"><strong>Symptoms:</strong> Weight loss, pale combs, drop in egg production, visible worms in droppings.</p>
                  <p className="text-xs"><strong>Treatment:</strong> Deworm every 2-3 months using Piperazine (for roundworms) or Levamisole/Albendazole (broad-spectrum). Do a follow-up dose after 14 days to break the lifecycle.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-foreground">Newcastle Disease (NDV)</h4>
                  <p className="text-xs mb-1"><strong>Symptoms:</strong> Torticollis (twisted neck), green diarrhea, paralysis, sharp drop in egg production.</p>
                  <p className="text-xs"><strong>Treatment:</strong> Viral disease with NO CURE. Administer multivitamins and broad-spectrum antibiotics to prevent secondary bacterial infections. Strictly isolate sick birds and prioritize vaccination for future prevention.</p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                  <p className="italic text-red-600 dark:text-red-400 font-bold text-xs text-center">
                    ⚠️ ALWAYS observe withdrawal periods for antibiotics to avoid drug residues in eggs. Consult a qualified veterinary doctor before administering restricted medications.
                  </p>
                </div>
              </div>
            </details>

            <details className="group bg-muted/30 rounded-xl p-3 border border-border/50">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-foreground">
                <span>4. Nigerian Medicine, Wellness & Feed Products</span>
                <span className="transition group-open:rotate-90">
                  <ChevronRight className="w-5 h-5" />
                </span>
              </summary>
              <div className="text-sm text-muted-foreground mt-3 pl-2 border-l-2 border-primary/50 space-y-4">
                <div>
                  <h4 className="font-bold text-foreground">Common Medicine Types</h4>
                  <ul className="list-disc pl-4 space-y-2 text-xs mt-2">
                    <li><strong>Anticoccidials:</strong> Amprolium products, Toltrazuril products such as Baycox, and sulpha combinations are commonly used for suspected coccidiosis. Use Vitamin K support when bloody droppings are present.</li>
                    <li><strong>Respiratory support:</strong> Tylosin, Doxycycline/Tylosin combinations, Enrofloxacin, Erythromycin, and Oxytetracycline products are often used where CRD, coryza, or bacterial respiratory signs are suspected.</li>
                    <li><strong>Dewormers:</strong> Levamisole, Albendazole, and Piperazine products are used by many farmers for routine worm control, usually followed by vitamins.</li>
                    <li><strong>Wellness and appetite:</strong> Multivitamins, electrolytes, glucose, probiotics, liver tonics, and amino-acid products can help after transport, heat stress, vaccination, poor appetite, or antibiotic treatment.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Products & Companies Seen in Nigerian Poultry Shops</h4>
                  <div className="grid gap-2 mt-2">
                    <p className="text-xs"><strong>Animal Care:</strong> poultry vaccines, vitamins, antibiotics, disinfectants, and feed additives used across many Nigerian farms.</p>
                    <p className="text-xs"><strong>Kepro / Keproceryl range:</strong> antibiotic and vitamin combinations commonly sold for bacterial stress, respiratory signs, and recovery support.</p>
                    <p className="text-xs"><strong>Interchemie products:</strong> veterinary antibiotics, anticoccidials, and supportive medicines available through many agro-vet stores.</p>
                    <p className="text-xs"><strong>Huvepharma / Biopharm style products:</strong> vitamins, enzymes, anticoccidials, and feed additives depending on local distributor availability.</p>
                    <p className="text-xs"><strong>Lasota / NDV, Gumboro, Fowl Pox, Coryza vaccines:</strong> prevention products used according to age, location, disease pressure, and vet schedule.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Feed Products Used by Nigerian Farmers</h4>
                  <ul className="list-disc pl-4 space-y-2 text-xs mt-2">
                    <li><strong>Commercial brands:</strong> Top Feeds, Vital Feed, Amo Byng, Hybrid Feeds, Animal Care, Chikun, and Premier Feed are widely used depending on region and availability.</li>
                    <li><strong>Feed stages:</strong> Chick mash, grower mash, pre-layer mash, layer mash, broiler starter, broiler finisher, and concentrate/premix for farmers mixing their own feed.</li>
                    <li><strong>Common raw materials:</strong> maize, soybean meal, groundnut cake, wheat offal, palm kernel cake, fish meal, bone meal, limestone, salt, methionine, lysine, premix, toxin binder, and enzymes.</li>
                    <li><strong>Appetite support:</strong> clean cool water, electrolytes, multivitamins, probiotics, glucose, and good ventilation usually improve feeding faster than changing feed suddenly.</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                  <p className="text-amber-700 dark:text-amber-300 font-semibold text-xs">
                    Log every medicine, multivitamin, appetite booster, and feed-support product in Health Records with product name, company, purpose, dosage, and duration. Follow the label and observe egg/meat withdrawal periods.
                  </p>
                </div>
              </div>
            </details>

            <details className="group bg-muted/30 rounded-xl p-3 border border-border/50">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-foreground">
                <span>5. Standard Local Feed Formulation (Per 1 Ton / 1000kg)</span>
                <span className="transition group-open:rotate-90">
                  <ChevronRight className="w-5 h-5" />
                </span>
              </summary>
              <div className="text-sm text-muted-foreground mt-3 pl-2 border-l-2 border-primary/50 space-y-5">
                <p className="text-xs italic text-foreground">
                  *While many farmers prefer to buy commercial feed for Day-Old Chicks to guarantee quality, below are standard guidelines commonly used by Nigerian farmers when mixing their own feeds.*
                </p>

                <div>
                  <h4 className="font-bold text-foreground">Chick Mash (0 - 8 Weeks)</h4>
                  <p className="text-[11px] text-primary font-semibold mb-2">Target: ~19-20% Crude Protein (Fast frame development)</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs grid grid-cols-2 gap-x-4">
                    <li><strong>Maize:</strong> 500 kg</li>
                    <li><strong>Soybean Meal:</strong> 200 kg</li>
                    <li><strong>Groundnut Cake (GNC):</strong> 100 kg</li>
                    <li><strong>Wheat Offal:</strong> 120 kg</li>
                    <li><strong>Fish Meal (72%):</strong> 25 kg</li>
                    <li><strong>Bone Meal:</strong> 25 kg</li>
                    <li><strong>Limestone:</strong> 15 kg</li>
                    <li><strong>Chick Premix:</strong> 2.5 kg</li>
                    <li><strong>Salt:</strong> 2.5 kg</li>
                    <li><strong>Methionine:</strong> 1 kg</li>
                    <li><strong>Lysine:</strong> 1 kg</li>
                    <li><strong>Toxin Binder:</strong> 1 kg</li>
                  </ul>
                </div>

                <div className="border-t border-border/50 pt-3">
                  <h4 className="font-bold text-foreground">Grower Mash (9 - 15 Weeks)</h4>
                  <p className="text-[11px] text-primary font-semibold mb-2">Target: ~15-16% Crude Protein (Higher fibre for crop expansion, delayed laying)</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs grid grid-cols-2 gap-x-4">
                    <li><strong>Maize:</strong> 450 kg</li>
                    <li><strong>Soybean Meal:</strong> 100 kg</li>
                    <li><strong>Groundnut Cake (GNC):</strong> 80 kg</li>
                    <li><strong>Wheat Offal:</strong> 280 kg</li>
                    <li><strong>Palm Kernel Cake (PKC):</strong> 40 kg</li>
                    <li><strong>Bone Meal:</strong> 25 kg</li>
                    <li><strong>Limestone:</strong> 15 kg</li>
                    <li><strong>Grower Premix:</strong> 2.5 kg</li>
                    <li><strong>Salt:</strong> 2.5 kg</li>
                    <li><strong>Methionine:</strong> 1 kg</li>
                    <li><strong>Lysine:</strong> 1 kg</li>
                    <li><strong>Toxin Binder:</strong> 1 kg</li>
                  </ul>
                </div>

                <div className="border-t border-border/50 pt-3">
                  <h4 className="font-bold text-foreground">Pre-Layer Mash (16 - 18 Weeks)</h4>
                  <p className="text-[11px] text-primary font-semibold mb-2">Target: ~16.5% Crude Protein (Calcium boost for medullary bone preparation)</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs grid grid-cols-2 gap-x-4">
                    <li><strong>Maize:</strong> 480 kg</li>
                    <li><strong>Soybean Meal:</strong> 120 kg</li>
                    <li><strong>Groundnut Cake (GNC):</strong> 100 kg</li>
                    <li><strong>Wheat Offal:</strong> 200 kg</li>
                    <li><strong>Palm Kernel Cake (PKC):</strong> 30 kg</li>
                    <li><strong>Bone Meal:</strong> 30 kg</li>
                    <li><strong>Limestone:</strong> 30 kg</li>
                    <li><strong>Layer Premix:</strong> 2.5 kg</li>
                    <li><strong>Salt:</strong> 2.5 kg</li>
                    <li><strong>Methionine:</strong> 1.5 kg</li>
                    <li><strong>Lysine:</strong> 1 kg</li>
                    <li><strong>Toxin Binder:</strong> 1 kg</li>
                  </ul>
                </div>

                <div className="border-t border-border/50 pt-3">
                  <h4 className="font-bold text-foreground">Layer Mash (19+ Weeks / Laying Cycle)</h4>
                  <p className="text-[11px] text-primary font-semibold mb-2">Target: 16-17% Crude Protein, ~4.0% Calcium (Peak egg production & strong shells)</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs grid grid-cols-2 gap-x-4">
                    <li><strong>Maize:</strong> 500 kg</li>
                    <li><strong>Soybean Meal:</strong> 150 kg</li>
                    <li><strong>Groundnut Cake (GNC):</strong> 80 kg</li>
                    <li><strong>Wheat Offal:</strong> 140 kg</li>
                    <li><strong>Bone Meal:</strong> 30 kg</li>
                    <li className="text-emerald-600 dark:text-emerald-400 font-bold"><strong>Limestone:</strong> 85 kg</li>
                    <li><strong>Layer Premix:</strong> 2.5 kg</li>
                    <li><strong>Salt:</strong> 2.5 kg</li>
                    <li><strong>Methionine:</strong> 1.5 kg</li>
                    <li><strong>Lysine:</strong> 1 kg</li>
                    <li><strong>Toxin Binder:</strong> 1 kg</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs">
                    Note: Feed quality highly depends on raw material quality. Ensure your maize is dry (moisture &lt;12%) to prevent aflatoxin build-up, and always use a good quality toxin binder.
                  </p>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
