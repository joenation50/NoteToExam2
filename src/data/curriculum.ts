export const curriculum: Record<string, Record<string, string[]>> = {
  secondary: {
    science: [
      "Mathematics", "English Language", "Physics", "Chemistry", "Biology", 
      "Further Mathematics", "Agricultural Science", "Computer Science", "Technical Drawing",
      "Health Education", "Physical Education", "Food and Nutrition", "Home Management",
      "Basic Science", "Basic Technology", "Civic Education", "Geography",
      "Data Processing", "ICT", "Applied Electricity", "Woodwork", "Metalwork",
      "Auto Mechanics", "Building Construction", "Electronics", "Fishery",
      "Animal Husbandry", "Forestry", "Surveying", "Statistics"
    ],
    commercial: [
      "Mathematics", "English Language", "Financial Accounting", "Commerce", 
      "Economics", "Government", "Office Practice", "Insurance", "Bookkeeping",
      "Business Studies", "Marketing", "Salesmanship", "Entrepreneurship",
      "Typewriting", "Shorthand", "Store Management", "Purchasing and Supply",
      "Taxation", "Auditing", "Banking", "Actuarial Science", "Business Administration",
      "Human Resource Management", "Public Administration", "Secretarial Studies",
      "Cooperative Economics", "Trade", "Advertising", "Public Relations", "Logistics"
    ],
    arts: [
      "Mathematics", "English Language", "Literature-in-English", "Government", 
      "History", "Christian Religious Studies", "Islamic Studies", "Yoruba", 
      "Igbo", "Hausa", "Fine Arts", "Music", "French", "Arabic",
      "Visual Arts", "Theatre Arts", "Mass Communication", "Sociology",
      "Philosophy", "Psychology", "Geography", "Social Studies", "Civic Education",
      "Drama", "Creative Writing", "Linguistics", "International Relations",
      "Peace and Conflict Studies", "Cultural Studies", "Religious Studies"
    ]
  },
  university: {
    engineering: [
      "Engineering Mathematics", "Thermodynamics", "Fluid Mechanics", 
      "Materials Science", "Circuit Analysis", "Statics & Dynamics", "Technical Report Writing",
      "Structural Analysis", "Geotechnical Engineering", "Transportation Engineering",
      "Water Resources Engineering", "Control Systems", "Electromagnetic Fields",
      "Power Systems", "Telecommunications", "Computer Architecture", "Software Engineering",
      "Chemical Engineering", "Petroleum Engineering", "Agricultural Engineering",
      "Biomedical Engineering", "Aerospace Engineering", "Marine Engineering",
      "Mechatronics", "Metallurgical Engineering", "Mining Engineering",
      "Industrial Engineering", "Environmental Engineering", "Surveying & Geoinformatics",
      "Quantity Surveying", "Architecture"
    ],
    law: [
      "Law of Contract", "Constitutional Law", "Criminal Law", "Legal Systems", 
      "Equity & Trusts", "Land Law", "Company Law", "Jurisprudence",
      "International Law", "Human Rights Law", "Environmental Law", "Family Law",
      "Law of Torts", "Commercial Law", "Tax Law", "Intellectual Property Law",
      "Maritime Law", "Oil and Gas Law", "Labour Law", "Administrative Law",
      "Evidence", "Civil Procedure", "Criminal Procedure", "Legal Drafting",
      "Alternative Dispute Resolution", "Islamic Law", "Customary Law",
      "Conflict of Laws", "Banking Law", "Insurance Law", "Criminology"
    ],
    medicine: [
      "Human Anatomy", "Physiology", "Biochemistry", "Medical Ethics", 
      "Pathology", "Pharmacology", "Microbiology", "Community Health",
      "Internal Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynecology",
      "Psychiatry", "Ophthalmology", "ENT", "Dermatology",
      "Radiology", "Anesthesia", "Hematology", "Immunology",
      "Cardiology", "Neurology", "Endocrinology", "Gastroenterology",
      "Nephrology", "Pulmonology", "Rheumatology", "Orthopedics",
      "Urology", "Public Health", "Epidemiology"
    ],
    social_sciences: [
      "Intro to Economics", "Sociology", "Political Science", "Research Methods", 
      "Psychology", "Macroeconomics", "Microeconomics", "International Relations",
      "Anthropology", "Geography", "Demography", "Social Work",
      "Criminology", "Public Administration", "Development Studies", "Gender Studies",
      "Peace Studies", "Media Studies", "Environmental Studies", "Urban Studies",
      "Rural Development", "Labour Studies", "Migration Studies", "Globalization",
      "Comparative Politics", "Public Policy", "Diplomacy", "Conflict Resolution",
      "Social Statistics", "Quantitative Analysis", "Qualitative Analysis"
    ]
  }
};

// 30+ Topics for every subject
export const subjectTopics: Record<string, string[]> = {
  // --- SCIENCE ---
  "Mathematics": ["Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics", "Probability", "Number Theory", "Matrices", "Vectors", "Logarithms", "Sequences", "Set Theory", "Polynomials", "Differentiation", "Integration", "Permutations", "Surds", "Indices", "Coordinate Geometry", "Mensuration", "Bearings", "Inequalities", "Functions", "Graphs", "Complex Numbers", "Binary Operations", "Modulo Arithmetic", "Linear Programming", "Series", "Limits"],
  "English Language": ["Comprehension", "Summary Writing", "Lexis and Structure", "Oral English", "Essay Writing", "Concord", "Tenses", "Idioms", "Figures of Speech", "Phonetics", "Synonyms", "Antonyms", "Prepositions", "Punctuation", "Clauses", "Reported Speech", "Active and Passive Voice", "Conditionals", "Modals", "Phrasal Verbs", "Spelling", "Vocabulary Development", "Paragraph Writing", "Letter Writing", "Speech Writing", "Debate", "Reading Comprehension", "Listening Skills", "Grammar", "Semantics"],
  "Physics": ["Mechanics", "Waves", "Electricity", "Magnetism", "Modern Physics", "Thermodynamics", "Optics", "Sound", "Kinematics", "Dynamics", "Work Energy and Power", "Circular Motion", "Gravitational Fields", "Simple Harmonic Motion", "Fluids", "Heat Transfer", "Gas Laws", "Electric Fields", "Current Electricity", "Electromagnetism", "Electronics", "Atomic Physics", "Nuclear Physics", "Quantum Physics", "Relativity", "Astrophysics", "Geophysics", "Acoustics", "Medical Physics", "Semiconductors"],
  "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Atomic Structure", "Periodic Table", "Chemical Bonding", "Stoichiometry", "Gas Laws", "Thermochemistry", "Chemical Equilibrium", "Acids and Bases", "Redox Reactions", "Electrochemistry", "Chemical Kinetics", "Alkanes", "Alkenes", "Alkynes", "Alcohols", "Carboxylic Acids", "Esters", "Amines", "Polymers", "Metals", "Non-metals", "Transition Metals", "Qualitative Analysis", "Quantitative Analysis", "Environmental Chemistry", "Industrial Chemistry"],
  "Biology": ["Cell Biology", "Genetics", "Ecology", "Evolution", "Human Anatomy", "Plant Biology", "Microbiology", "Biochemistry", "Physiology", "Reproduction", "Nutrition", "Respiration", "Excretion", "Transport Systems", "Nervous System", "Endocrine System", "Immune System", "Heredity", "DNA and RNA", "Protein Synthesis", "Photosynthesis", "Cellular Respiration", "Biodiversity", "Classification", "Adaptation", "Population Ecology", "Conservation", "Biotechnology", "Genetic Engineering", "Human Health"],

  // --- COMMERCIAL ---
  "Financial Accounting": ["Double Entry", "Trial Balance", "Final Accounts", "Depreciation", "Bank Reconciliation", "Control Accounts", "Partnership Accounts", "Company Accounts", "Cash Flow Statements", "Manufacturing Accounts", "Incomplete Records", "Consignment Accounts", "Joint Venture", "Branch Accounts", "Hire Purchase", "Lease Accounting", "Inventory Valuation", "Bills of Exchange", "Non-profit Organizations", "Payroll Accounting", "Cost Accounting", "Marginal Costing", "Standard Costing", "Budgeting", "Capital Budgeting", "Investment Appraisal", "Taxation", "Auditing", "Financial Analysis", "IFRS"],
  "Commerce": ["Trade", "Industry", "Business Units", "Management", "Finance", "Marketing", "Advertising", "Insurance", "Transportation", "Warehousing", "Banking", "Communication", "Consumer Protection", "Business Law", "International Trade", "E-commerce", "Retail Management", "Wholesale Trade", "Supply Chain", "Logistics", "Business Ethics", "Corporate Social Responsibility", "Entrepreneurship", "Business Planning", "Market Research", "Sales Promotion", "Public Relations", "Customer Service", "Inventory Management", "Business Environment"],
  "Economics": ["Microeconomics", "Macroeconomics", "Demand and Supply", "Elasticity", "Market Structures", "National Income", "Inflation", "Unemployment", "Money and Banking", "Fiscal Policy", "Monetary Policy", "International Trade", "Balance of Payments", "Exchange Rates", "Economic Development", "Economic Planning", "Agriculture", "Industry", "Population", "Labour", "Capital", "Entrepreneurship", "Price Mechanism", "Utility", "Production", "Costs", "Revenue", "Perfect Competition", "Monopoly", "Oligopoly"],
  
  // --- ARTS ---
  "Literature-in-English": ["Prose", "Poetry", "Drama", "Literary Devices", "Characterization", "Themes", "Plot", "Setting", "Narrative Techniques", "African Literature", "European Literature", "American Literature", "Shakespeare", "Tragedy", "Comedy", "Satire", "Allegory", "Symbolism", "Imagery", "Metaphor", "Simile", "Personification", "Alliteration", "Rhyme", "Meter", "Sonnet", "Ode", "Elegy", "Ballad", "Epic"],
  "Government": ["Constitution", "Separation of Powers", "Rule of Law", "Federalism", "Democracy", "Elections", "Political Parties", "Pressure Groups", "Public Administration", "Civil Service", "Judiciary", "Legislature", "Executive", "Local Government", "Foreign Policy", "International Organizations", "UN", "AU", "ECOWAS", "Commonwealth", "OPEC", "Political Ideologies", "Capitalism", "Socialism", "Communism", "Feudalism", "Colonialism", "Imperialism", "Nationalism", "Military Rule"],
  "History": ["Pre-colonial Nigeria", "Colonial Nigeria", "Independence", "Civil War", "Military Regimes", "Democratic Transitions", "African History", "World History", "Ancient Civilizations", "Middle Ages", "Renaissance", "Industrial Revolution", "World War I", "World War II", "Cold War", "Decolonization", "Apartheid", "Slave Trade", "Trans-Saharan Trade", "Empires of West Africa", "Benin Kingdom", "Oyo Empire", "Kanem-Bornu", "Sokoto Caliphate", "Nationalism", "Pan-Africanism", "OAU", "African Union", "Globalization", "Modern Africa"],

  // --- UNIVERSITY: ENGINEERING ---
  "Engineering Mathematics": ["Calculus", "Linear Algebra", "Differential Equations", "Fourier Series", "Laplace Transforms", "Complex Analysis", "Numerical Methods", "Vector Calculus", "Probability", "Statistics", "Matrices", "Eigenvalues", "Partial Differential Equations", "Series Solutions", "Boundary Value Problems", "Integral Transforms", "Z-Transforms", "Optimization", "Graph Theory", "Discrete Mathematics", "Set Theory", "Logic", "Number Theory", "Group Theory", "Ring Theory", "Field Theory", "Real Analysis", "Complex Analysis", "Functional Analysis", "Topology"],
  "Thermodynamics": ["First Law", "Second Law", "Entropy", "Enthalpy", "Ideal Gases", "Real Gases", "Thermodynamic Cycles", "Carnot Cycle", "Rankine Cycle", "Brayton Cycle", "Refrigeration", "Heat Engines", "Heat Transfer", "Conduction", "Convection", "Radiation", "Combustion", "Fuels", "Steam Tables", "Psychrometry", "Air Conditioning", "Thermodynamic Relations", "Maxwell Relations", "Clausius Inequality", "Exergy", "Availability", "Phase Equilibrium", "Chemical Equilibrium", "Statistical Thermodynamics", "Kinetic Theory"],
  "Fluid Mechanics": ["Fluid Properties", "Fluid Statics", "Fluid Dynamics", "Bernoulli's Equation", "Continuity Equation", "Momentum Equation", "Laminar Flow", "Turbulent Flow", "Reynolds Number", "Pipe Flow", "Open Channel Flow", "Boundary Layer", "Drag and Lift", "Dimensional Analysis", "Pumps", "Turbines", "Hydraulic Machines", "Flow Measurement", "Viscosity", "Surface Tension", "Capillarity", "Buoyancy", "Hydrostatics", "Hydrodynamics", "Compressible Flow", "Gas Dynamics", "Aerodynamics", "Computational Fluid Dynamics", "Navier-Stokes Equations", "Euler Equations"],

  // --- UNIVERSITY: LAW ---
  "Law of Contract": ["Offer and Acceptance", "Consideration", "Intention to Create Legal Relations", "Capacity", "Privity of Contract", "Terms of Contract", "Exemption Clauses", "Misrepresentation", "Mistake", "Duress", "Undue Influence", "Illegality", "Discharge of Contract", "Remedies for Breach", "Frustration", "Quantum Meruit", "Specific Performance", "Injunction", "Damages", "Restitution", "Agency", "Consumer Contracts", "E-Contracts", "Standard Form Contracts", "Good Faith", "Unconscionability", "Third Party Rights", "Assignment", "Novation", "Breach of Contract"],
  "Constitutional Law": ["Constitutionalism", "Rule of Law", "Separation of Powers", "Federalism", "Fundamental Human Rights", "Judicial Review", "Electoral Law", "Political Parties", "Legislature", "Executive", "Judiciary", "Local Government", "Citizenship", "State Creation", "Emergency Powers", "Military Intervention", "Amendment of Constitution", "Constituent Assembly", "Constitutional Conventions", "Sovereignty", "Delegate Legislation", "Administrative Law", "Public Order", "Freedom of Expression", "Right to Life", "Fair Hearing", "Due Process", "Equality", "Discrimination", "Affirmative Action"],

  // --- UNIVERSITY: MEDICINE ---
  "Human Anatomy": ["Skeletal System", "Muscular System", "Nervous System", "Cardiovascular System", "Respiratory System", "Digestive System", "Urinary System", "Reproductive System", "Endocrine System", "Lymphatic System", "Integumentary System", "Cells and Tissues", "Embryology", "Histology", "Gross Anatomy", "Neuroanatomy", "Regional Anatomy", "Surface Anatomy", "Radiological Anatomy", "Cross-sectional Anatomy", "Thorax", "Abdomen", "Pelvis", "Upper Limb", "Lower Limb", "Head and Neck", "Brain", "Spinal Cord", "Cranial Nerves", "Autonomic Nervous System"],
  "Physiology": ["Cell Physiology", "Neurophysiology", "Cardiovascular Physiology", "Respiratory Physiology", "Renal Physiology", "Gastrointestinal Physiology", "Endocrine Physiology", "Reproductive Physiology", "Muscle Physiology", "Blood Physiology", "Immunology", "Thermoregulation", "Exercise Physiology", "Acid-Base Balance", "Fluid Balance", "Electrolyte Balance", "Metabolism", "Nutrition", "Digestion", "Absorption", "Hormonal Regulation", "Stress Physiology", "Environmental Physiology", "Aviation Physiology", "Diving Physiology", "High Altitude Physiology", "Sleep Physiology", "Circadian Rhythms", "Aging", "Pathophysiology"],

  // --- UNIVERSITY: SOCIAL SCIENCES ---
  "Microeconomics": ["Consumer Behaviour", "Production Theory", "Cost Theory", "Perfect Competition", "Monopoly", "Oligopoly", "Monopolistic Competition", "Factor Markets", "General Equilibrium", "Welfare Economics", "Market Failure", "Externalities", "Public Goods", "Asymmetric Information", "Game Theory", "Price Discrimination", "Elasticity", "Utility Maximization", "Indifference Curves", "Budget Constraints", "Demand Forecasting", "Supply Chain", "Pricing Strategies", "Labour Markets", "Capital Markets", "Risk and Uncertainty", "Behavioural Economics", "Institutional Economics", "Information Economics", "Auctions"],
  "Macroeconomics": ["National Income", "GDP", "Inflation", "Unemployment", "Money Supply", "Monetary Policy", "Fiscal Policy", "Aggregate Demand", "Aggregate Supply", "IS-LM Model", "Phillips Curve", "Economic Growth", "Business Cycles", "International Trade", "Balance of Payments", "Exchange Rates", "Open Economy", "Consumption", "Investment", "Savings", "Government Spending", "Taxation", "Public Debt", "Budget Deficits", "Central Banking", "Financial Markets", "Economic Development", "Poverty", "Inequality", "Sustainable Development"]
};
