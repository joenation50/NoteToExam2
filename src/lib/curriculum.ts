import type { Question } from "./types";
import { shuffle, uid } from "./id";

export type Stage = "primary" | "secondary" | "university";
export type SecondaryClass = "JSS1" | "JSS2" | "JSS3" | "SS1" | "SS2" | "SS3";
export type SecondaryDept = "science" | "commercial" | "arts";

const PRIMARY = [
  "English Studies",
  "Mathematics",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Agricultural Science",
  "CRS / IRS",
  "Cultural & Creative Arts",
  "Physical & Health Education",
];

const JSS = [
  "English Language",
  "Mathematics",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Business Studies",
  "Agricultural Science",
  "Home Economics",
  "CRS / IRS",
  "Computer Studies",
  "Physical & Health Education",
];

const SS_CORE = ["English Language", "Mathematics", "Civic Education"];

const SS_DEPT: Record<SecondaryDept, string[]> = {
  science: ["Physics", "Chemistry", "Biology", "Further Mathematics", "Agricultural Science", "Geography", "Computer Studies"],
  commercial: ["Economics", "Accounting", "Commerce", "Government", "Business Management", "Marketing", "Computer Studies"],
  arts: ["Literature-in-English", "Government", "History", "CRS / IRS", "Yoruba / Igbo / Hausa", "Fine Art", "Music"],
};

const UNI: Record<string, string[]> = {
  default: ["Use of English", "General Studies", "Introduction to Computing"],
  engineering: ["Engineering Mathematics", "Physics", "Chemistry", "Technical Drawing", "Workshop Practice", "Thermodynamics", "Strength of Materials"],
  mechanical: ["Engineering Mathematics", "Thermodynamics", "Fluid Mechanics", "Strength of Materials", "Workshop Practice", "Engineering Drawing", "Material Science"],
  electrical: ["Circuit Theory", "Electromagnetism", "Engineering Mathematics", "Electronics", "Electrical Machines", "Control Systems"],
  civil: ["Structural Analysis", "Fluid Mechanics", "Soil Mechanics", "Engineering Mathematics", "Surveying", "Concrete Technology"],
  medicine: ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Community Medicine"],
  law: ["Constitutional Law", "Law of Contract", "Criminal Law", "Torts", "Legal Methods", "Nigerian Legal System"],
  accounting: ["Financial Accounting", "Cost Accounting", "Taxation", "Auditing", "Business Law", "Economics"],
  economics: ["Microeconomics", "Macroeconomics", "Quantitative Methods", "Development Economics", "Statistics", "Money and Banking"],
  computer: ["Programming", "Data Structures", "Operating Systems", "Database Systems", "Computer Networks", "Discrete Mathematics"],
  biology: ["Cell Biology", "Genetics", "Ecology", "Physiology", "Microbiology", "Biochemistry"],
  chemistry: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Industrial Chemistry"],
  physics: ["Mechanics", "Electromagnetism", "Waves and Optics", "Thermodynamics", "Modern Physics", "Mathematical Methods"],
  masscom: ["Introduction to Mass Communication", "News Writing", "Media Law", "Broadcasting", "Public Relations"],
  education: ["Philosophy of Education", "Educational Psychology", "Curriculum Studies", "Measurement and Evaluation"],
  nursing: ["Fundamentals of Nursing", "Anatomy", "Physiology", "Pharmacology", "Community Health"],
  pharmacy: ["Pharmaceutics", "Pharmacology", "Pharmacognosy", "Pharmaceutical Chemistry", "Pharmacy Law"],
};

export function subjectsFor(opts: {
  stage: Stage;
  classLevel?: SecondaryClass;
  department?: SecondaryDept;
  course?: string;
}): string[] {
  if (opts.stage === "primary") return PRIMARY;
  if (opts.stage === "secondary") {
    const cls = opts.classLevel || "SS1";
    if (cls.startsWith("JSS")) return JSS;
    const dept = opts.department || "science";
    return [...SS_CORE, ...SS_DEPT[dept]];
  }
  const course = (opts.course || "").toLowerCase();
  const key =
    (Object.keys(UNI).find((k) => k !== "default" && course.includes(k)) as keyof typeof UNI | undefined) ||
    (course.includes("law") ? "law"
      : course.includes("medic") || course.includes("mbbs") ? "medicine"
      : course.includes("nurs") ? "nursing"
      : course.includes("pharm") ? "pharmacy"
      : course.includes("account") ? "accounting"
      : course.includes("econ") ? "economics"
      : course.includes("comput") || course.includes("software") || course.includes("it") ? "computer"
      : course.includes("mass") || course.includes("journal") ? "masscom"
      : course.includes("educ") ? "education"
      : course.includes("civil") ? "civil"
      : course.includes("electr") ? "electrical"
      : course.includes("mechan") ? "mechanical"
      : course.includes("engine") ? "engineering"
      : course.includes("chem") ? "chemistry"
      : course.includes("physic") ? "physics"
      : course.includes("bio") ? "biology"
      : "default");
  return UNI[key] || UNI.default;
}

type BankQ = { prompt: string; options: [string, string, string, string]; answer: string; explanation: string };

const BANK: Record<string, BankQ[]> = {
  Mathematics: [
    { prompt: "Simplify 3/4 + 5/8.", options: ["11/8", "13/8", "8/12", "15/8"], answer: "11/8", explanation: "LCD is 8: 6/8 + 5/8 = 11/8." },
    { prompt: "The quadratic formula for ax² + bx + c = 0 is", options: ["x = (−b ± √(b²−4ac))/2a", "x = (−b ± √(b²+4ac))/2a", "x = (b ± √(b²−4ac))/2a", "x = −c/a"], answer: "x = (−b ± √(b²−4ac))/2a", explanation: "Standard quadratic formula." },
    { prompt: "If 2x + 5 = 17, x equals", options: ["6", "11", "12", "5"], answer: "6", explanation: "2x = 12, so x = 6." },
    { prompt: "The derivative of x³ is", options: ["3x²", "x²", "3x", "x³/3"], answer: "3x²", explanation: "Power rule: n x^{n−1}." },
    { prompt: "sin²θ + cos²θ equals", options: ["1", "0", "2", "tan θ"], answer: "1", explanation: "Pythagorean identity." },
    { prompt: "The mean of 4, 8, 10, 6 is", options: ["7", "8", "6", "28"], answer: "7", explanation: "Sum 28 ÷ 4 = 7." },
    { prompt: "A triangle with sides 3, 4, 5 is", options: ["Right-angled", "Equilateral", "Obtuse", "Isosceles only"], answer: "Right-angled", explanation: "3²+4²=5², Pythagoras." },
    { prompt: "log₁₀ 1000 equals", options: ["3", "2", "10", "100"], answer: "3", explanation: "10³ = 1000." },
    { prompt: "The gradient of y = 2x + 3 is", options: ["2", "3", "5", "−2"], answer: "2", explanation: "Coefficient of x." },
    { prompt: "P(A) for a fair coin landing heads is", options: ["1/2", "1", "1/6", "2"], answer: "1/2", explanation: "Two equally likely outcomes." },
    { prompt: "5! equals", options: ["120", "25", "60", "720"], answer: "120", explanation: "5×4×3×2×1 = 120." },
    { prompt: "Solve |x| = 4.", options: ["x = 4 or x = −4", "x = 4 only", "x = 0", "no solution"], answer: "x = 4 or x = −4", explanation: "Absolute value is distance from 0." },
  ],
  "English Language": [
    { prompt: "Choose the synonym of “brief”.", options: ["Short", "Long", "Loud", "Heavy"], answer: "Short", explanation: "Brief means short in duration." },
    { prompt: "“Neither the boys nor the girl ___ present.”", options: ["was", "were", "are", "have"], answer: "was", explanation: "Verb agrees with the nearer subject “girl”." },
    { prompt: "A figure of speech that compares using “like” or “as” is a", options: ["Simile", "Metaphor", "Irony", "Hyperbole"], answer: "Simile", explanation: "Simile uses like/as." },
    { prompt: "The past participle of “write” is", options: ["written", "wrote", "writed", "writing"], answer: "written", explanation: "write–wrote–written." },
    { prompt: "Which is a complex sentence?", options: ["I left when the bell rang.", "I sat and I read.", "Go.", "She smiled."], answer: "I left when the bell rang.", explanation: "Independent + dependent clause." },
    { prompt: "Antonym of “scarce” is", options: ["Abundant", "Rare", "Little", "Empty"], answer: "Abundant", explanation: "Scarce means in short supply." },
    { prompt: "“To kick the bucket” is an example of", options: ["Idiom", "Pun", "Alliteration", "Oxymoron"], answer: "Idiom", explanation: "Idiom means to die." },
    { prompt: "The reported form of “He said, ‘I am tired’” is", options: ["He said that he was tired.", "He said that I am tired.", "He said he is tired.", "He said I was tired."], answer: "He said that he was tired.", explanation: "Backshift present to past." },
    { prompt: "A letter to a principal is written in ___ style.", options: ["Formal", "Slang", "Poetic", "Colloquial only"], answer: "Formal", explanation: "Official correspondence is formal." },
    { prompt: "Stress in “PHOtograph” falls on the", options: ["First syllable", "Second", "Third", "Last"], answer: "First syllable", explanation: "PHOto-graph." },
    { prompt: "“The sun smiled on us” is", options: ["Personification", "Simile", "Irony", "Litotes"], answer: "Personification", explanation: "Human quality given to the sun." },
    { prompt: "Choose the correctly spelled word.", options: ["Receive", "Recieve", "Receeve", "Receve"], answer: "Receive", explanation: "i before e except after c." },
  ],
  Physics: [
    { prompt: "SI unit of force is the", options: ["Newton", "Joule", "Watt", "Pascal"], answer: "Newton", explanation: "1 N = 1 kg·m/s²." },
    { prompt: "v = u + at is a equation of", options: ["Linear motion", "Circular motion only", "Simple harmonic only", "Nuclear decay"], answer: "Linear motion", explanation: "First equation of uniformly accelerated motion." },
    { prompt: "Ohm’s law states V =", options: ["IR", "I/R", "I²R", "Q/t"], answer: "IR", explanation: "Voltage equals current times resistance." },
    { prompt: "The speed of light in vacuum is about", options: ["3.0 × 10⁸ m/s", "3.0 × 10⁶ m/s", "340 m/s", "3.0 × 10⁵ km/h"], answer: "3.0 × 10⁸ m/s", explanation: "c ≈ 3×10⁸ m/s." },
    { prompt: "A transformer works on the principle of", options: ["Mutual induction", "Ohm’s law", "Photoelectric effect", "Coulomb’s law"], answer: "Mutual induction", explanation: "Changing flux in one coil induces emf in the other." },
    { prompt: "Kinetic energy is", options: ["½mv²", "mgh", "mv", "Fd"], answer: "½mv²", explanation: "Translational KE formula." },
    { prompt: "Which radiation is most ionizing?", options: ["Alpha", "Beta", "Gamma", "Radio"], answer: "Alpha", explanation: "Alpha particles have high ionizing power, low penetration." },
    { prompt: "Frequency of a wave is", options: ["1/T", "T", "λv", "2πr"], answer: "1/T", explanation: "Frequency is the reciprocal of period." },
    { prompt: "The instrument that measures current is an", options: ["Ammeter", "Voltmeter", "Ohmmeter", "Barometer"], answer: "Ammeter", explanation: "Ammeter is connected in series." },
    { prompt: "Escape velocity from Earth is about", options: ["11.2 km/s", "3 km/s", "300 km/s", "1.6 km/s"], answer: "11.2 km/s", explanation: "√(2GM/R) ≈ 11.2 km/s." },
    { prompt: "Snell’s law relates", options: ["Angles and refractive indices", "Force and mass", "Charge and field", "Work and time"], answer: "Angles and refractive indices", explanation: "n₁ sin i = n₂ sin r." },
    { prompt: "A body in equilibrium has", options: ["Zero net force and torque", "Zero mass", "Infinite speed", "Negative energy"], answer: "Zero net force and torque", explanation: "Translational and rotational equilibrium." },
  ],
  Chemistry: [
    { prompt: "Atomic number is the number of", options: ["Protons", "Neutrons", "Nucleons only", "Electrons in M shell"], answer: "Protons", explanation: "Z = proton count." },
    { prompt: "pH of a neutral solution at 25°C is", options: ["7", "0", "14", "1"], answer: "7", explanation: "[H⁺] = 10⁻⁷ mol/dm³." },
    { prompt: "The gas collected at the cathode in electrolysis of acidified water is", options: ["Hydrogen", "Oxygen", "Chlorine", "Nitrogen"], answer: "Hydrogen", explanation: "H⁺ is reduced at the cathode." },
    { prompt: "NaCl is held by", options: ["Ionic bonds", "Covalent bonds", "Hydrogen bonds", "Metallic bonds"], answer: "Ionic bonds", explanation: "Transfer of electron from Na to Cl." },
    { prompt: "Avogadro’s number is about", options: ["6.02 × 10²³", "3.00 × 10⁸", "1.6 × 10⁻¹⁹", "9.8"], answer: "6.02 × 10²³", explanation: "Particles per mole." },
    { prompt: "Oxidation is", options: ["Loss of electrons", "Gain of electrons", "Loss of protons", "Gain of neutrons"], answer: "Loss of electrons", explanation: "OIL RIG." },
    { prompt: "The most electronegative element is", options: ["Fluorine", "Oxygen", "Chlorine", "Nitrogen"], answer: "Fluorine", explanation: "Top-right of the periodic table." },
    { prompt: "CH₄ is an example of a", options: ["Alkane", "Alkene", "Alkyne", "Alcohol"], answer: "Alkane", explanation: "Saturated hydrocarbon, methane." },
    { prompt: "A catalyst", options: ["Lowers activation energy", "Is consumed", "Changes ΔH", "Stops the reaction"], answer: "Lowers activation energy", explanation: "Provides an alternative path." },
    { prompt: "Hardness of water is mainly due to", options: ["Ca²⁺ and Mg²⁺", "Na⁺", "Cl⁻ only", "OH⁻"], answer: "Ca²⁺ and Mg²⁺", explanation: "Dissolved calcium and magnesium salts." },
    { prompt: "The process of coating iron with zinc is", options: ["Galvanizing", "Annealing", "Sintering", "Vulcanizing"], answer: "Galvanizing", explanation: "Zinc sacrificial protection." },
    { prompt: "An endothermic reaction", options: ["Absorbs heat", "Releases heat", "Has ΔH < 0", "Needs no energy"], answer: "Absorbs heat", explanation: "ΔH is positive." },
  ],
  Biology: [
    { prompt: "The powerhouse of the cell is the", options: ["Mitochondrion", "Nucleus", "Ribosome", "Golgi body"], answer: "Mitochondrion", explanation: "Site of aerobic respiration / ATP." },
    { prompt: "Photosynthesis occurs mainly in the", options: ["Chloroplast", "Lysosome", "Vacuole", "Centriole"], answer: "Chloroplast", explanation: "Contains chlorophyll." },
    { prompt: "DNA is found mainly in the", options: ["Nucleus", "Cell wall", "Cytoplasm only", "Flagellum"], answer: "Nucleus", explanation: "Chromosomes reside in the nucleus." },
    { prompt: "Blood group O is the", options: ["Universal donor", "Universal recipient", "Rarest always", "AB only"], answer: "Universal donor", explanation: "No A/B antigens on RBCs." },
    { prompt: "Osmosis is movement of water from", options: ["High to low water potential", "Low to high water potential", "Solute to solvent only", "Air to soil"], answer: "High to low water potential", explanation: "Through a partially permeable membrane." },
    { prompt: "The functional unit of the kidney is the", options: ["Nephron", "Alveolus", "Neuron", "Villus"], answer: "Nephron", explanation: "Filters blood and forms urine." },
    { prompt: "Mendel’s law of segregation refers to", options: ["Alleles separating at meiosis", "Crossing over", "Mutation", "Cloning"], answer: "Alleles separating at meiosis", explanation: "Each gamete gets one allele." },
    { prompt: "Insulin is produced by the", options: ["Pancreas", "Thyroid", "Liver", "Adrenal cortex"], answer: "Pancreas", explanation: "Islets of Langerhans." },
    { prompt: "A food chain always starts with a", options: ["Producer", "Carnivore", "Decomposer only", "Parasite"], answer: "Producer", explanation: "Autotrophs capture solar energy." },
    { prompt: "Red blood cells lack a nucleus in", options: ["Mature mammals", "Birds", "Fish", "Amphibians"], answer: "Mature mammals", explanation: "More space for haemoglobin." },
    { prompt: "The process of cell division that halves chromosome number is", options: ["Meiosis", "Mitosis", "Binary fission", "Budding"], answer: "Meiosis", explanation: "Produces haploid gametes." },
    { prompt: "Nitrogen-fixing bacteria live in", options: ["Root nodules of legumes", "Leaf cuticle", "Xylem only", "Human bone"], answer: "Root nodules of legumes", explanation: "Rhizobium converts N₂." },
  ],
  "Civic Education": [
    { prompt: "Democracy is government", options: ["Of the people, by the people, for the people", "By the army only", "By one monarch without limits", "Without laws"], answer: "Of the people, by the people, for the people", explanation: "Abraham Lincoln’s definition, widely taught." },
    { prompt: "The Nigerian constitution currently in force is the", options: ["1999 Constitution", "1963 Constitution", "1979 only", "1922 Clifford"], answer: "1999 Constitution", explanation: "Fourth Republic constitution." },
    { prompt: "The rule of law means", options: ["Nobody is above the law", "The president is above the law", "Only judges make laws", "Police make all laws"], answer: "Nobody is above the law", explanation: "Equality before the law." },
    { prompt: "A fundamental human right in Nigeria is the right to", options: ["Life", "Steal", "Ignore tax always", "Defame freely"], answer: "Life", explanation: "Chapter IV of the 1999 Constitution." },
    { prompt: "INEC is responsible for", options: ["Conducting elections", "Printing naira", "Trying criminals", "Foreign policy"], answer: "Conducting elections", explanation: "Independent National Electoral Commission." },
    { prompt: "The three arms of government are", options: ["Executive, legislature, judiciary", "Army, police, customs", "Federal, state, local only", "Senate, House, INEC"], answer: "Executive, legislature, judiciary", explanation: "Separation of powers." },
    { prompt: "Federalism shares power between", options: ["Central and component units", "King and chiefs only", "Church and mosque", "UN and AU"], answer: "Central and component units", explanation: "Nigeria is a federation." },
    { prompt: "A citizen by birth in Nigeria is someone", options: ["Born to Nigerian parents as defined by law", "Who visits Lagos", "With a work visa only", "Over 18 anywhere"], answer: "Born to Nigerian parents as defined by law", explanation: "Citizenship by birth, descent, registration, naturalization." },
    { prompt: "Corruption is best checked by", options: ["Transparency and accountability", "More secrecy", "Ignoring audits", "One-party rule"], answer: "Transparency and accountability", explanation: "Open institutions reduce abuse." },
    { prompt: "The National Youth Service Corps was established in", options: ["1973", "1960", "1999", "1914"], answer: "1973", explanation: "Post-civil war national unity scheme." },
    { prompt: "Local government is the ___ tier.", options: ["Third", "First", "Only", "Fourth"], answer: "Third", explanation: "Federal, state, local." },
    { prompt: "Freedom of the press is part of", options: ["Freedom of expression", "Right to property only", "Fair hearing only", "Movement only"], answer: "Freedom of expression", explanation: "Section 39." },
  ],
  Economics: [
    { prompt: "Opportunity cost is the", options: ["Next best alternative forgone", "Money cost only", "Sunk cost", "Total revenue"], answer: "Next best alternative forgone", explanation: "Core definition of opportunity cost." },
    { prompt: "Demand slopes", options: ["Downward", "Upward always", "Vertically always", "As a circle"], answer: "Downward", explanation: "Law of demand: price up, qty down." },
    { prompt: "GDP measures", options: ["Value of final goods in a country in a period", "Only exports", "Government salaries only", "Population"], answer: "Value of final goods in a country in a period", explanation: "Gross Domestic Product." },
    { prompt: "Inflation is a persistent rise in", options: ["General price level", "Unemployment only", "Exports only", "Rainfall"], answer: "General price level", explanation: "Too much money chasing goods, among other causes." },
    { prompt: "A monopoly has", options: ["One seller", "Many sellers of identical goods", "No barriers", "Perfect information always"], answer: "One seller", explanation: "Single producer of a unique product." },
    { prompt: "CBN is Nigeria’s", options: ["Central bank", "Commercial bank", "Insurance firm", "Stock exchange"], answer: "Central bank", explanation: "Issues currency, banker to government." },
    { prompt: "Elasticity of demand is", options: ["%ΔQd / %ΔP", "P × Q", "TR − TC", "MU/P"], answer: "%ΔQd / %ΔP", explanation: "Responsiveness of quantity to price." },
    { prompt: "A public good is", options: ["Non-rival and non-excludable", "Sold in kiosks only", "Always free of cost to produce", "A Giffen good"], answer: "Non-rival and non-excludable", explanation: "E.g. national defence." },
    { prompt: "Devaluation makes exports", options: ["Cheaper to foreigners", "More expensive always", "Illegal", "Unchanged"], answer: "Cheaper to foreigners", explanation: "Domestic currency buys less foreign currency." },
    { prompt: "The production possibility curve is usually", options: ["Concave to the origin", "A straight vertical line", "A circle", "Upward sloping demand"], answer: "Concave to the origin", explanation: "Increasing opportunity cost." },
    { prompt: "Money as a store of value means it", options: ["Can be saved for later use", "Must be gold", "Cannot be counted", "Is only coins"], answer: "Can be saved for later use", explanation: "One of the functions of money." },
    { prompt: "Structural unemployment is due to", options: ["Mismatch of skills and jobs", "Season of rain only", "Too much holiday", "Inflation only"], answer: "Mismatch of skills and jobs", explanation: "Industry or technology change." },
  ],
  Government: [
    { prompt: "Sovereignty means", options: ["Supreme power of the state", "Local council rates", "A political party", "A court case"], answer: "Supreme power of the state", explanation: "Internal and external sovereignty." },
    { prompt: "A bicameral legislature has", options: ["Two chambers", "One chamber", "No elections", "Only traditional rulers"], answer: "Two chambers", explanation: "Senate and House in Nigeria." },
    { prompt: "The 1960 Independence Constitution made Nigeria a", options: ["Parliamentary system", "Presidential system", "Military junta", "One-party state by law"], answer: "Parliamentary system", explanation: "Westminster model at independence." },
    { prompt: "Checks and balances prevent", options: ["Concentration of power", "Elections", "Federalism", "Citizenship"], answer: "Concentration of power", explanation: "Each arm limits the others." },
    { prompt: "A pressure group seeks to", options: ["Influence government policy", "Form the only party", "Replace INEC", "Print money"], answer: "Influence government policy", explanation: "Not necessarily to win office." },
    { prompt: "The judiciary interprets", options: ["The law", "The budget only", "Foreign trade only", "Party manifestos only"], answer: "The law", explanation: "Courts apply the constitution and statutes." },
    { prompt: "Colonial rule in Nigeria ended in", options: ["1960", "1914", "1963", "1999"], answer: "1960", explanation: "1 October 1960 independence." },
    { prompt: "A referendum is a", options: ["Direct vote on an issue", "Cabinet meeting", "Court judgment", "Census"], answer: "Direct vote on an issue", explanation: "People decide a question." },
    { prompt: "The Nigerian Senate has how many members per state?", options: ["3", "1", "10", "36"], answer: "3", explanation: "Equal state representation plus FCT." },
    { prompt: "Oligarchy is rule by", options: ["A few", "All adults", "One king only", "The poorest"], answer: "A few", explanation: "Power in a small elite." },
    { prompt: "The capital of Nigeria is", options: ["Abuja", "Lagos", "Kaduna", "Enugu"], answer: "Abuja", explanation: "FCT since 1991." },
    { prompt: "Impeachment is a process to", options: ["Remove an elected official", "Appoint a minister", "Create a state", "Dissolve INEC"], answer: "Remove an elected official", explanation: "Legislature holds executive to account." },
  ],
  Accounting: [
    { prompt: "The accounting equation is", options: ["Assets = Liabilities + Equity", "Assets = Expenses", "Revenue = Cash only", "Debit = Profit"], answer: "Assets = Liabilities + Equity", explanation: "Double-entry foundation." },
    { prompt: "A debit increases", options: ["Assets and expenses", "Liabilities only", "Capital only", "Revenue only"], answer: "Assets and expenses", explanation: "Normal debit balances." },
    { prompt: "Depreciation allocates cost of a", options: ["Non-current asset over its life", "Inventory item daily", "Loan interest only", "Share issue"], answer: "Non-current asset over its life", explanation: "Matching concept." },
    { prompt: "A trial balance checks", options: ["Arithmetical accuracy of ledgers", "Fraud always", "Cash in bank only", "Tax rates"], answer: "Arithmetical accuracy of ledgers", explanation: "Debits should equal credits." },
    { prompt: "FIFO means", options: ["First in, first out", "First in, last out", "Free in, free out", "Fixed interest, floating out"], answer: "First in, first out", explanation: "Inventory cost flow." },
    { prompt: "A liability is", options: ["An obligation to pay", "An owned building", "Owner’s drawings", "Gross profit"], answer: "An obligation to pay", explanation: "Present obligation from past events." },
    { prompt: "Bank reconciliation compares", options: ["Cash book and bank statement", "Sales and purchases only", "PAYE and VAT", "Fixed assets"], answer: "Cash book and bank statement", explanation: "Timing and unrecorded items." },
    { prompt: "Gross profit is", options: ["Sales − cost of sales", "Sales − all expenses", "Assets − liabilities", "Capital − drawings"], answer: "Sales − cost of sales", explanation: "Trading account." },
    { prompt: "A petty cash imprest is", options: ["A fixed float topped up", "A long-term loan", "Share capital", "Bad debt"], answer: "A fixed float topped up", explanation: "Imprest system." },
    { prompt: "Accrual concept means", options: ["Record when earned/incurred, not only when cash moves", "Cash only", "Ignore invoices", "No depreciation"], answer: "Record when earned/incurred, not only when cash moves", explanation: "Matching revenues and expenses." },
    { prompt: "Share capital appears in the", options: ["Statement of financial position", "Cash book only", "Petty cash", "Delivery note"], answer: "Statement of financial position", explanation: "Equity section." },
    { prompt: "A suspense account is used when", options: ["A trial balance disagrees", "Profit is high", "VAT is zero", "Stock is finished"], answer: "A trial balance disagrees", explanation: "Temporary holding account." },
  ],
  "Literature-in-English": [
    { prompt: "A tragedy typically ends in", options: ["Catastrophe for the hero", "A wedding always", "A joke", "A census"], answer: "Catastrophe for the hero", explanation: "Classical tragedy structure." },
    { prompt: "Iambic pentameter has", options: ["Five iambs per line", "Ten spondees", "No metre", "Only rhyme"], answer: "Five iambs per line", explanation: "Unstressed-stressed × 5." },
    { prompt: "The narrator who is a character using “I” is", options: ["First-person", "Omniscient third", "Dramatic only", "Chorus"], answer: "First-person", explanation: "Limited to that character’s view." },
    { prompt: "A sonnet has", options: ["14 lines", "10 lines", "3 acts", "No rhyme ever"], answer: "14 lines", explanation: "Petrarchan or Shakespearean." },
    { prompt: "Dramatic irony is when", options: ["Audience knows more than a character", "Two words sound alike", "The setting is a forest", "The hero wins easily"], answer: "Audience knows more than a character", explanation: "Common in tragedy." },
    { prompt: "An epic is a", options: ["Long narrative poem of heroic deeds", "Two-line joke", "Stage direction", "Footnote"], answer: "Long narrative poem of heroic deeds", explanation: "E.g. the Odyssey, Sundiata." },
    { prompt: "Theme is the", options: ["Central idea", "Page number", "Publisher", "Font"], answer: "Central idea", explanation: "What the work is “about”." },
    { prompt: "A round character is", options: ["Complex and developing", "Named only once", "Always evil", "The setting"], answer: "Complex and developing", explanation: "Foerster / Forster distinction." },
    { prompt: "Onomatopoeia is a word that", options: ["Imitates a sound", "Rhymes internally", "Means the opposite", "Is Latin only"], answer: "Imitates a sound", explanation: "Buzz, hiss, crash." },
    { prompt: "The antagonist", options: ["Opposes the protagonist", "Prints the book", "Is always comic relief", "Narrates always"], answer: "Opposes the protagonist", explanation: "Source of conflict." },
    { prompt: "Blank verse is", options: ["Unrhymed iambic pentameter", "Any free tweet", "A haiku", "Prose only"], answer: "Unrhymed iambic pentameter", explanation: "Shakespeare’s plays." },
    { prompt: "A foil character", options: ["Highlights another by contrast", "Sells tickets", "Writes the blurb", "Is the publisher"], answer: "Highlights another by contrast", explanation: "E.g. foil to the hero." },
  ],
  "Use of English": [
    { prompt: "Choose the option nearest in meaning to “candid”.", options: ["Frank", "Secret", "Angry", "Lazy"], answer: "Frank", explanation: "Candid = open, honest." },
    { prompt: "The noun form of “decide” is", options: ["Decision", "Decisive", "Decidedly", "Deciderly"], answer: "Decision", explanation: "Nominalisation." },
    { prompt: "“Each of the students ___ a book.”", options: ["has", "have", "are", "were"], answer: "has", explanation: "Each is singular." },
    { prompt: "A comma splice is", options: ["Joining two sentences with only a comma", "A spelling error", "Missing capital", "Wrong tense only"], answer: "Joining two sentences with only a comma", explanation: "Needs a conjunction or semicolon." },
    { prompt: "Register in language means", options: ["Variety according to situation", "A cash book", "Accent only", "Alphabet"], answer: "Variety according to situation", explanation: "Formal/informal etc." },
    { prompt: "The opposite of “expand” is", options: ["Contract", "Extend", "Enlarge", "Inflate"], answer: "Contract", explanation: "To become smaller." },
    { prompt: "“Between you and ___.”", options: ["me", "I", "myselfs", "we"], answer: "me", explanation: "Object of the preposition." },
    { prompt: "A topic sentence usually", options: ["States the paragraph’s main idea", "Is the last footnote", "Has no verb", "Must be a question"], answer: "States the paragraph’s main idea", explanation: "Often first sentence." },
    { prompt: "JAMB Use of English tests", options: ["Comprehension, lexis, structure", "Only oral Igbo", "Chemistry", "Fine art"], answer: "Comprehension, lexis, structure", explanation: "Standard UTME paper." },
    { prompt: "“Few” is used with", options: ["Countable nouns", "Uncountable only", "Verbs", "Adverbs only"], answer: "Countable nouns", explanation: "Few books; little water." },
    { prompt: "Coherence in an essay is", options: ["Logical flow of ideas", "Many big words", "No paragraphs", "All capitals"], answer: "Logical flow of ideas", explanation: "Links and order." },
    { prompt: "A clause must contain", options: ["A subject and a verb", "A comma", "A quote", "Latin"], answer: "A subject and a verb", explanation: "Finite clause." },
  ],
  "Constitutional Law": [
    { prompt: "The grundnorm in Kelsen’s theory is the", options: ["Basic norm of a legal system", "High Court building", "Police Act", "Local by-law"], answer: "Basic norm of a legal system", explanation: "Validity of norms traces to it." },
    { prompt: "Nigeria operates a ___ constitution.", options: ["Written and rigid", "Unwritten only", "Flexible convention only", "Royal charter"], answer: "Written and rigid", explanation: "Special procedure to amend." },
    { prompt: "Ultra vires means", options: ["Beyond legal power", "Inside the court", "Guilty", "On bail"], answer: "Beyond legal power", explanation: "Act outside authority." },
    { prompt: "Chapter IV of the 1999 Constitution covers", options: ["Fundamental rights", "The military only", "Local government names", "Anthem lyrics"], answer: "Fundamental rights", explanation: "Justiciable rights." },
    { prompt: "Judicial review is the power of courts to", options: ["Invalidate unconstitutional acts", "Make budgets", "Command the army", "Register parties"], answer: "Invalidate unconstitutional acts", explanation: "Marbury-type function, applied locally." },
    { prompt: "The exclusive legislative list belongs to the", options: ["National Assembly", "Local councils only", "Traditional rulers", "INEC alone"], answer: "National Assembly", explanation: "Second Schedule, Part I." },
    { prompt: "A republic has a", options: ["Elected head of state", "Hereditary king as necessary", "No constitution", "Military only"], answer: "Elected head of state", explanation: "Nigeria is a republic." },
    { prompt: "Locus standi means", options: ["Right to sue", "Place of trial only", "Jail term", "Plea bargain"], answer: "Right to sue", explanation: "Sufficient interest." },
    { prompt: "The Attorney-General is the", options: ["Chief law officer", "Chief judge", "IGP", "Senate President"], answer: "Chief law officer", explanation: "Federation or state." },
    { prompt: "Federal character aims at", options: ["Fair representation of sections", "One ethnic monopoly", "Abolishing states", "Ending elections"], answer: "Fair representation of sections", explanation: "S.14(3) 1999 Constitution." },
    { prompt: "A bill becomes an Act after", options: ["Presidential assent (or override)", "Gazette rumour", "Party caucus only", "Newspaper editorial"], answer: "Presidential assent (or override)", explanation: "Legislative process." },
    { prompt: "Ouster clauses try to", options: ["Exclude court jurisdiction", "Create new states", "Fund INEC", "Set tax rates"], answer: "Exclude court jurisdiction", explanation: "Often read narrowly." },
  ],
  Programming: [
    { prompt: "A loop that never ends is", options: ["Infinite", "Recursive only", "Compiled", "Typed"], answer: "Infinite", explanation: "Exit condition never met." },
    { prompt: "HTML is a", options: ["Markup language", "Database", "CPU", "Operating system"], answer: "Markup language", explanation: "HyperText Markup Language." },
    { prompt: "Big-O of binary search is", options: ["O(log n)", "O(n²)", "O(1) always", "O(n!)"], answer: "O(log n)", explanation: "Halves the search space." },
    { prompt: "A stack is", options: ["LIFO", "FIFO", "A tree only", "Random"], answer: "LIFO", explanation: "Last in, first out." },
    { prompt: "SQL is used to", options: ["Query databases", "Style web pages", "Compile C", "Draw circuits"], answer: "Query databases", explanation: "Structured Query Language." },
    { prompt: "OOP encapsulation hides", options: ["Internal state", "The file system always", "TCP ports", "RAM size"], answer: "Internal state", explanation: "Access via methods." },
    { prompt: "Git is a", options: ["Version control system", "Web browser", "CPU brand", "SQL dialect"], answer: "Version control system", explanation: "Tracks source history." },
    { prompt: "An algorithm is", options: ["A finite set of steps to solve a problem", "A computer brand", "A virus", "A cable"], answer: "A finite set of steps to solve a problem", explanation: "Must terminate with output." },
    { prompt: "HTTP status 404 means", options: ["Not found", "OK", "Forbidden always", "Server created"], answer: "Not found", explanation: "Resource missing." },
    { prompt: "A compiler", options: ["Translates source to machine code", "Only runs Python REPL", "Stores cookies", "Draws UI"], answer: "Translates source to machine code", explanation: "Ahead-of-time translation." },
    { prompt: "Primary key uniquely identifies a", options: ["Row", "Column type only", "Database server", "Index file always"], answer: "Row", explanation: "Entity integrity." },
    { prompt: "Recursion is a function that", options: ["Calls itself", "Never returns", "Uses no stack", "Cannot have a base case"], answer: "Calls itself", explanation: "Needs a base case." },
  ],
};

const FALLBACK: BankQ[] = [
  { prompt: "A well-posed exam item should have", options: ["One best answer among the options", "No stem", "Five correct keys", "No topic"], answer: "One best answer among the options", explanation: "Standard MCQ design." },
  { prompt: "Revision is most effective when it is", options: ["Active and spaced", "Only all-nighters", "Copying without thinking", "Avoiding past questions"], answer: "Active and spaced", explanation: "Retrieval practice and spacing." },
  { prompt: "Citing a source in an answer shows", options: ["Evidence", "Guesswork", "Plagiarism of ideas without credit", "Silence"], answer: "Evidence", explanation: "Academic honesty." },
  { prompt: "Time management in CBT means", options: ["Pacing across the paper", "Spending all time on item 1", "Ignoring the clock", "Skipping instructions"], answer: "Pacing across the paper", explanation: "Marks per minute." },
  { prompt: "A hypothesis is", options: ["A testable statement", "A proven law always", "A random number", "A citation style"], answer: "A testable statement", explanation: "Scientific method." },
  { prompt: "Critical thinking asks", options: ["Is this claim supported?", "Who is loudest?", "What is trending?", "Can I copy?"], answer: "Is this claim supported?", explanation: "Evaluate evidence." },
  { prompt: "A syllabus tells you", options: ["What may be examined", "The invigilator’s name", "Wi-Fi password", "Hostel fees"], answer: "What may be examined", explanation: "Scope of the course." },
  { prompt: "Peer teaching helps because", options: ["Explaining strengthens memory", "It replaces sleep", "It bans notes", "It hides weak topics"], answer: "Explaining strengthens memory", explanation: "Protégé effect." },
  { prompt: "An objective test is scored", options: ["Against a marking key", "Only by essay length", "By handwriting beauty", "At random"], answer: "Against a marking key", explanation: "MCQ/true-false." },
  { prompt: "Academic integrity forbids", options: ["Cheating and plagiarism", "Asking the tutor", "Using your notes in study", "Group discussion of ideas"], answer: "Cheating and plagiarism", explanation: "Honest work." },
];

function bankFor(subject: string): BankQ[] {
  const exact = BANK[subject];
  if (exact) return exact;
  const key = Object.keys(BANK).find((k) => subject.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(subject.toLowerCase().split(" ")[0]));
  if (key) return BANK[key];
  return FALLBACK.map((q) => ({
    ...q,
    prompt: `[${subject}] ${q.prompt}`,
  }));
}

export function buildCurriculumQuestions(subjects: string[], total = 40): Question[] {
  const n = subjects.length;
  const per = Math.floor(total / n);
  const extra = total % n;
  const out: Question[] = [];
  subjects.forEach((sub, si) => {
    const need = per + (si < extra ? 1 : 0);
    const bank = shuffle(bankFor(sub));
    for (let i = 0; i < need; i++) {
      const q = bank[i % bank.length];
      const options = shuffle([...q.options]);
      out.push({
        id: uid("q"),
        kind: i % 3 === 0 ? "direct" : i % 3 === 1 ? "rephrased" : "connection",
        format: "mcq",
        prompt: q.prompt,
        options,
        answer: q.answer,
        explanation: q.explanation,
        page: 0,
        topic: sub,
      });
    }
  });
  return shuffle(out);
}
