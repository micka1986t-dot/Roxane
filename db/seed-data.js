// Histoires d'exemple du prototype, chargées une seule fois si la base est vide.
const AUTHORS={
  "LuneDeMinuit":{color:"#3B1F5C",bio:"J'écris la nuit, quand la maison dort. Fan de vampires, de brume et de fins qui laissent un frisson.",followers:214,
    posts:[{d:"2026-11-02",t:"Le chapitre 4 des « Sang d'Opale » arrive dimanche ! Vous pensez qu'Aster va trahir Mila ? 👀"},{d:"2026-10-20",t:"Merci pour les 200 abonnés. Je prépare une histoire courte d'Halloween en bonus."}]},
  "PapillonDeVerre":{color:"#D3336A",bio:"Romance, chocolat chaud et carnets à spirale. 15 ans d'âge mental, 15 ans tout court.",followers:132,
    posts:[{d:"2026-10-28",t:"Question : vous préférez une fin heureuse ou une fin ouverte pour « La fille du quai 9 » ?"}]},
  "CapitaineChaussette":{color:"#F28C38",bio:"Je raconte des catastrophes. Surtout les miennes.",followers:88,
    posts:[{d:"2026-10-31",t:"Nouvelle histoire courte en ligne : le jour où mon chat a voté au conseil municipal (presque vrai)."}]},
  "BoussoleÉgarée":{color:"#0F4C5C",bio:"Cartes anciennes, îles qui n'existent pas, et des héros qui se perdent pour mieux se trouver.",followers:167,posts:[{d:"2026-10-15",t:"Je cherche un nom pour un dragon des mers. Proposez en commentaire !"}]},
  "EncreGrise":{color:"#1F6E43",bio:"Polars et souvenirs. J'écris pour ne pas oublier.",followers:301,posts:[{d:"2026-11-01",t:"Partie 2 de « Ce que la rivière garde » en cours d'écriture."}]},
  "Nébuleuse42":{color:"#1D1A33",bio:"Science-fiction douce. Les robots ont aussi des sentiments, c'est prouvé.",followers:59,posts:[]}
};

const P=t=>t.trim().split(/\n\s*\n/).map(x=>x.trim());
const SEED=[
 {id:"s1",title:"Le Sang d'Opale",author:"LuneDeMinuit",section:"jeunesse",genre:"Fantastique",type:"chapitres",date:"2026-11-02",reads:1840,
  summary:"Mila découvre que le nouveau du lycée ne projette aucune ombre. Et qu'il connaît le nom de sa grand-mère, morte il y a cent ans.",
  cover:{bg:"#3B1F5C",bg2:"#7A1E3A",pattern:"gradient",shape:"circle",shapeColor:"#F7D6E0",font:"royal",text:"#F7D6E0"},
  chapters:[{t:"Sans ombre",p:P(`Le soleil de septembre tapait sur la cour et toutes les silhouettes s'étiraient sur le goudron. Toutes, sauf une.

Mila cligna des yeux. Le garçon adossé au portail portait un manteau trop long pour la saison et ne bougeait presque pas. Sous ses pieds, rien. Pas même une tache grise.

« Tu le connais ? » demanda Inès en suivant son regard.

« Non », répondit Mila. Pourtant, quand il tourna la tête vers elle, elle eut la certitude étrange qu'il l'attendait.`)},
   {t:"La photo du grenier",p:P(`Le soir même, Mila monta au grenier chercher les vieux albums de sa mère. Elle ne savait pas vraiment ce qu'elle cherchait. Une preuve, peut-être, qu'elle n'était pas folle.

Sur une photographie jaunie datée de 1926, sa grand-mère souriait devant une fête foraine. Derrière elle, un garçon au manteau trop long regardait l'objectif.

Il n'avait pas vieilli d'un jour.`)},
   {t:"Aster",p:P(`« Je m'appelle Aster », dit-il le lendemain, sans qu'elle ait posé de question. « Et j'ai promis à quelqu'un de veiller sur toi. »

Mila serra la photo dans sa poche. « Ma grand-mère est morte il y a cent ans. »

« Je sais. J'étais là. »`)}],
  reviews:[{who:"Lectrice_Pomme",s:5,t:"J'ai eu des frissons à la fin du chapitre 2. Vite la suite !",d:"2026-11-03"},{who:"Anonyme",s:4,t:"Super ambiance, j'aimerais juste en savoir plus sur Inès.",d:"2026-11-04"}]},
 {id:"s2",title:"La fille du quai 9",author:"PapillonDeVerre",section:"jeunesse",genre:"Romance",type:"chapitres",date:"2026-10-28",reads:1210,
  summary:"Chaque matin, Léna prend le train de 7 h 42. Chaque matin, le garçon au carnet bleu dessine quelqu'un. Un jour, elle découvre que c'est elle.",
  cover:{bg:"#F7D6E0",bg2:"#F28C38",pattern:"gradient",shape:"heart",shapeColor:"#D3336A",font:"script",text:"#7A1E3A"},
  chapters:[{t:"7 h 42",p:P(`Le train avait trois minutes de retard, comme toujours. Léna se colla contre la vitre pour éviter le sac à dos géant d'un collégien.

En face, le garçon au carnet bleu dessinait. Il dessinait tous les jours, la tête penchée, une mèche sur les yeux. Léna ne voyait jamais quoi.

Ce matin-là, le train freina d'un coup. Le carnet glissa jusqu'à ses pieds, ouvert. Sur la page, il y avait une fille qui regardait par la fenêtre, une écharpe jaune autour du cou.

Léna baissa les yeux sur sa propre écharpe jaune.`)},
   {t:"Le carnet",p:P(`Elle aurait pu le lui rendre. Elle aurait pu dire quelque chose de normal. À la place, elle ramassa le carnet, le tendit sans un mot et descendit à la mauvaise station.

Elle marcha vingt minutes sous la bruine en se répétant qu'elle était ridicule. Elle souriait quand même.`)}],
  reviews:[{who:"Mangue_Rêveuse",s:5,t:"Trop mignon. Le passage de l'écharpe m'a tuée.",d:"2026-10-29"},{who:"Anonyme",s:5,t:"J'ai lu les deux chapitres d'une traite.",d:"2026-10-30"},{who:"Biscotte",s:3,t:"Joli mais un peu court, j'attends la suite pour juger.",d:"2026-11-01"}]},
 {id:"s3",title:"Mon chat est maire",author:"CapitaineChaussette",section:"jeunesse",genre:"Humour",type:"courte",date:"2026-10-31",reads:960,
  summary:"Une histoire presque vraie sur un chat, une urne électorale et un village qui aurait dû mieux surveiller ses bulletins.",
  cover:{bg:"#F2C94C",bg2:"#F28C38",pattern:"dots",shape:"none",shapeColor:"#1D1A33",font:"bold",text:"#1D1A33"},
  chapters:[{t:"Histoire courte",p:P(`Tout a commencé quand mon chat, Monsieur Flan, s'est endormi dans l'urne de la salle des fêtes. Personne ne l'a vu. Il est roux, l'urne est en bois, la lumière était mauvaise.

Au moment du dépouillement, le président du bureau de vote a plongé la main pour attraper les bulletins et a sorti un chat. Monsieur Flan a bâillé. Quelqu'un a crié « Il est élu ! » pour rire.

Le problème, c'est que les gens du village ont trouvé ça drôle. Puis logique. Puis souhaitable.

Aujourd'hui, Monsieur Flan préside le conseil depuis un coussin. Il a déjà fait voter la sieste obligatoire à 14 h. Honnêtement, c'est la meilleure décision depuis des années.`)}],
  reviews:[{who:"Anonyme",s:5,t:"J'ai ri tout haut dans le bus.",d:"2026-11-01"}]},
 {id:"s4",title:"L'île qui n'est sur aucune carte",author:"BoussoleÉgarée",section:"jeunesse",genre:"Aventure",type:"chapitres",date:"2026-10-15",reads:1420,
  summary:"Une carte cousue dans la doublure d'un vieux manteau. Trois cousins. Un été pour trouver une île qui recule quand on s'approche.",
  cover:{bg:"#0F4C5C",bg2:"#8FD3E8",pattern:"waves",shape:"mountain",shapeColor:"#1D1A33",font:"typewriter",text:"#EDE6D6"},
  chapters:[{t:"La doublure",p:P(`Le manteau de l'oncle Gaspard sentait le sel et la naphtaline. En glissant la main dans la poche, Théo sentit un papier cousu dans la doublure.

C'était une carte. Une vraie, dessinée à l'encre brune, avec une rose des vents et une île en forme de clé. En dessous, quelqu'un avait écrit : « Elle recule quand on la cherche. »`)},
   {t:"Marée basse",p:P(`Ils partirent à l'aube avec le canot du voisin, deux bouteilles d'eau et un paquet de biscuits déjà entamé.

À midi, Zoé pointa l'horizon. Une tache verte. Ils ramèrent une heure. La tache n'avait pas grossi d'un millimètre.`)}],
  reviews:[{who:"Corsaire_14",s:4,t:"J'adore l'idée de l'île qui recule !",d:"2026-10-18"}]},
 {id:"s5",title:"Ce que la rivière garde",author:"EncreGrise",section:"adulte",genre:"Mystère",type:"chapitres",date:"2026-11-01",reads:2330,
  summary:"Vingt ans après la disparition de sa sœur, une gendarme revient dans le village où tout le monde sait quelque chose.",
  cover:{bg:"#1D1A33",bg2:"#0F4C5C",pattern:"gradient",shape:"arch",shapeColor:"#EDE6D6",font:"display",text:"#EDE6D6"},
  chapters:[{t:"Retour",p:P(`Le panneau du village avait été repeint, mais la rivière, elle, n'avait pas changé. Claire gara la voiture devant le pont et resta un long moment le moteur coupé.

Vingt ans. Elle avait demandé sa mutation ici sans en parler à personne. Ni à sa mère, ni à son ancien chef, ni à elle-même vraiment.

Au café, la serveuse la reconnut tout de suite. Elle ne dit rien. Elle posa simplement deux tasses sur le comptoir, comme si quelqu'un d'autre allait venir.`)}],
  reviews:[{who:"Anonyme",s:5,t:"Atmosphère incroyable, très bien écrit.",d:"2026-11-02"}]},
 {id:"s6",title:"Les étés chez Mamie Jo",author:"EncreGrise",section:"jeunesse",genre:"Autobiographie",type:"courte",date:"2026-09-12",reads:640,
  summary:"Des souvenirs vrais : des confitures ratées, un vélo sans freins et une grand-mère qui trichait au Uno.",
  cover:{bg:"#EDE6D6",bg2:"#F2C94C",pattern:"stripes",shape:"circle",shapeColor:"#F28C38",font:"hand",text:"#1F6E43"},
  chapters:[{t:"Histoire courte",p:P(`Chez Mamie Jo, on avait le droit de manger des tartines de confiture au petit-déjeuner, au goûter, et parfois au dîner si elle était trop fatiguée pour cuisiner. La confiture était toujours trop cuite. On l'adorait quand même.

Elle trichait au Uno sans aucune honte. Quand on la prenait la main dans le sac, elle disait : « À mon âge, on a le droit. » Elle avait cinquante-huit ans.

C'est elle qui m'a offert mon premier carnet. Elle avait écrit sur la première page : « Pour les histoires que tu n'oses pas raconter à voix haute. » C'est un peu pour ça que je suis ici.`)}],
  reviews:[]},
 {id:"s7",title:"Le robot qui collectionnait les couchers de soleil",author:"Nébuleuse42",section:"jeunesse",genre:"Science-fiction",type:"courte",date:"2026-10-05",reads:410,
  summary:"Sur une station abandonnée, un robot de maintenance photographie chaque soir le même soleil. Jusqu'au jour où quelqu'un frappe à la porte.",
  cover:{bg:"#1D1A33",bg2:"#3B1F5C",pattern:"stars",shape:"circle",shapeColor:"#F28C38",font:"display",text:"#8FD3E8"},
  chapters:[{t:"Histoire courte",p:P(`R-7 avait été conçu pour réparer des tuyaux. Mais il n'y avait plus personne sur la station Hélios depuis longtemps, et les tuyaux ne fuyaient plus.

Alors, chaque soir, il montait au hublot du pont 3 et prenait une photo du soleil qui disparaissait derrière la planète orange. Il en avait 4 812. Aucune n'était pareille.

Le soir de la photo 4 813, on frappa à la porte du sas. Trois coups. R-7 n'avait jamais entendu ce bruit. Il rangea soigneusement son appareil et alla ouvrir.`)}],
  reviews:[{who:"Anonyme",s:4,t:"Tout doux, j'aimerais une suite.",d:"2026-10-07"}]},
 {id:"s8",title:"Nos promesses de novembre",author:"PapillonDeVerre",section:"adulte",genre:"Romance",type:"chapitres",date:"2026-10-10",reads:880,
  summary:"Deux amis d'enfance se sont promis de se retrouver à 30 ans s'ils étaient encore seuls. Ils en ont 29 ans et 11 mois.",
  cover:{bg:"#7A1E3A",bg2:"#D3336A",pattern:"gradient",shape:"arch",shapeColor:"#F7D6E0",font:"script",text:"#FFFFFF"},
  chapters:[{t:"Le compte à rebours",p:P(`Le message arriva un mardi, à 23 h 12. « Plus que trente jours. Tu te souviens ? »

Nora posa son téléphone face contre la table. Évidemment qu'elle se souvenait. Ils avaient seize ans, ils étaient assis sur le toit du garage et Sam avait dit ça comme une blague. Elle, elle ne l'avait jamais prise comme une blague.`)}],
  reviews:[{who:"Anonyme",s:4,t:"Le pitch est génial.",d:"2026-10-12"}]},
 {id:"s9",title:"Le dragon qui avait peur du noir",author:"BoussoleÉgarée",section:"jeunesse",genre:"Fantaisie",type:"courte",date:"2026-08-30",reads:1120,
  summary:"Le plus grand dragon du royaume dort avec une veilleuse. Personne ne doit le savoir. Surtout pas les chevaliers.",
  cover:{bg:"#1F6E43",bg2:"#F2C94C",pattern:"gradient",shape:"diamond",shapeColor:"#F2C94C",font:"hand",text:"#FFFFFF"},
  chapters:[{t:"Histoire courte",p:P(`Brasier mesurait vingt mètres de long, crachait du feu bleu et pouvait faire fondre une armure d'un éternuement. Il avait aussi une veilleuse en forme de champignon.

Chaque soir, avant de s'endormir sur son tas d'or, il vérifiait qu'elle était bien allumée. Une fois, la pile était morte. Il avait passé la nuit les yeux grands ouverts, à compter les chauves-souris.

Le jour où une petite écuyère entra dans sa grotte pour le combattre, elle trouva le dragon en train de chercher désespérément des piles. Elle avait des piles. Ils devinrent amis.`)}],
  reviews:[{who:"Petit_Hibou",s:5,t:"Trop chou. Je l'ai lu à mon petit frère.",d:"2026-09-02"},{who:"Anonyme",s:5,t:"La fin avec les piles 😂",d:"2026-09-05"}]}
];


module.exports={AUTHORS,SEED};
