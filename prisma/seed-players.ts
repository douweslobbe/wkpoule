/**
 * Fantasy WK 2026 — spelers seed
 * Bekende WK-selecties (geschatte/verwachte opstellingen)
 */
import { PrismaClient } from "@prisma/client"

type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"

type PlayerEntry = {
  name: string
  nameNl?: string
  position: PlayerPosition
  shirtNumber?: number
}

// teamCode → spelers
const SQUADS: Record<string, PlayerEntry[]> = {
  NED: [
    // GK
    { name: "Bart Verbruggen", position: "GK", shirtNumber: 1 },
    { name: "Mark Flekken", position: "GK", shirtNumber: 12 },
    // DEF
    { name: "Virgil van Dijk", position: "DEF", shirtNumber: 4 },
    { name: "Denzel Dumfries", position: "DEF", shirtNumber: 22 },
    { name: "Stefan de Vrij", position: "DEF", shirtNumber: 6 },
    { name: "Matthijs de Ligt", position: "DEF", shirtNumber: 3 },
    { name: "Nathan Aké", position: "DEF", shirtNumber: 5 },
    { name: "Jurriën Timber", position: "DEF", shirtNumber: 2 },
    // MID
    { name: "Frenkie de Jong", position: "MID", shirtNumber: 21 },
    { name: "Tijjani Reijnders", position: "MID", shirtNumber: 14 },
    { name: "Ryan Gravenberch", position: "MID", shirtNumber: 10 },
    { name: "Teun Koopmeiners", position: "MID", shirtNumber: 8 },
    { name: "Georginio Wijnaldum", position: "MID", shirtNumber: 6 },
    // FWD
    { name: "Memphis Depay", position: "FWD", shirtNumber: 10 },
    { name: "Cody Gakpo", position: "FWD", shirtNumber: 11 },
    { name: "Xavi Simons", position: "FWD", shirtNumber: 7 },
    { name: "Donyell Malen", position: "FWD", shirtNumber: 9 },
    { name: "Brian Brobbey", position: "FWD", shirtNumber: 19 },
    { name: "Wout Weghorst", position: "FWD", shirtNumber: 9 },
  ],

  ARG: [
    { name: "Emiliano Martínez", nameNl: "E. Martínez", position: "GK", shirtNumber: 23 },
    { name: "Franco Armani", position: "GK", shirtNumber: 1 },
    { name: "Nahuel Molina", position: "DEF", shirtNumber: 26 },
    { name: "Gonzalo Montiel", position: "DEF", shirtNumber: 4 },
    { name: "Cristian Romero", position: "DEF", shirtNumber: 13 },
    { name: "Nicolás Otamendi", position: "DEF", shirtNumber: 19 },
    { name: "Marcos Acuña", position: "DEF", shirtNumber: 8 },
    { name: "Nicolás Tagliafico", position: "DEF", shirtNumber: 3 },
    { name: "Rodrigo De Paul", position: "MID", shirtNumber: 7 },
    { name: "Enzo Fernández", position: "MID", shirtNumber: 24 },
    { name: "Alexis Mac Allister", position: "MID", shirtNumber: 20 },
    { name: "Giovani Lo Celso", position: "MID", shirtNumber: 21 },
    { name: "Leandro Paredes", position: "MID", shirtNumber: 5 },
    { name: "Lionel Messi", position: "FWD", shirtNumber: 10 },
    { name: "Julián Álvarez", nameNl: "J. Álvarez", position: "FWD", shirtNumber: 9 },
    { name: "Lautaro Martínez", nameNl: "L. Martínez", position: "FWD", shirtNumber: 22 },
    { name: "Ángel Di María", position: "FWD", shirtNumber: 11 },
    { name: "Paulo Dybala", position: "FWD", shirtNumber: 21 },
  ],

  FRA: [
    { name: "Mike Maignan", position: "GK", shirtNumber: 16 },
    { name: "Alphonse Areola", position: "GK", shirtNumber: 23 },
    { name: "Benjamin Pavard", position: "DEF", shirtNumber: 5 },
    { name: "Jules Koundé", position: "DEF", shirtNumber: 21 },
    { name: "Raphaël Varane", position: "DEF", shirtNumber: 4 },
    { name: "Dayot Upamecano", position: "DEF", shirtNumber: 15 },
    { name: "Théo Hernández", position: "DEF", shirtNumber: 22 },
    { name: "Lucas Hernández", position: "DEF", shirtNumber: 3 },
    { name: "Aurélien Tchouaméni", position: "MID", shirtNumber: 8 },
    { name: "Adrien Rabiot", position: "MID", shirtNumber: 14 },
    { name: "Eduardo Camavinga", position: "MID", shirtNumber: 11 },
    { name: "Youssouf Fofana", position: "MID", shirtNumber: 19 },
    { name: "Warren Zaïre-Emery", position: "MID", shirtNumber: 20 },
    { name: "Kylian Mbappé", position: "FWD", shirtNumber: 10 },
    { name: "Antoine Griezmann", position: "FWD", shirtNumber: 7 },
    { name: "Ousmane Dembélé", position: "FWD", shirtNumber: 11 },
    { name: "Marcus Thuram", position: "FWD", shirtNumber: 9 },
    { name: "Randal Kolo Muani", position: "FWD", shirtNumber: 23 },
  ],

  ENG: [
    { name: "Jordan Pickford", position: "GK", shirtNumber: 1 },
    { name: "Aaron Ramsdale", position: "GK", shirtNumber: 12 },
    { name: "Reece James", position: "DEF", shirtNumber: 24 },
    { name: "Kyle Walker", position: "DEF", shirtNumber: 2 },
    { name: "Harry Maguire", position: "DEF", shirtNumber: 6 },
    { name: "John Stones", position: "DEF", shirtNumber: 5 },
    { name: "Luke Shaw", position: "DEF", shirtNumber: 3 },
    { name: "Kieran Trippier", position: "DEF", shirtNumber: 12 },
    { name: "Jude Bellingham", position: "MID", shirtNumber: 22 },
    { name: "Declan Rice", position: "MID", shirtNumber: 4 },
    { name: "Trent Alexander-Arnold", position: "MID", shirtNumber: 8 },
    { name: "Phil Foden", position: "MID", shirtNumber: 20 },
    { name: "Conor Gallagher", position: "MID", shirtNumber: 13 },
    { name: "Harry Kane", position: "FWD", shirtNumber: 9 },
    { name: "Marcus Rashford", position: "FWD", shirtNumber: 11 },
    { name: "Bukayo Saka", position: "FWD", shirtNumber: 17 },
    { name: "Raheem Sterling", position: "FWD", shirtNumber: 10 },
    { name: "Ollie Watkins", position: "FWD", shirtNumber: 19 },
    { name: "Cole Palmer", position: "FWD", shirtNumber: 20 },
  ],

  ESP: [
    { name: "Unai Simón", position: "GK", shirtNumber: 23 },
    { name: "David Raya", position: "GK", shirtNumber: 1 },
    { name: "Dani Carvajal", position: "DEF", shirtNumber: 2 },
    { name: "Aymeric Laporte", position: "DEF", shirtNumber: 14 },
    { name: "Robin Le Normand", position: "DEF", shirtNumber: 6 },
    { name: "Pau Cubarsí", position: "DEF", shirtNumber: 24 },
    { name: "Marc Cucurella", position: "DEF", shirtNumber: 3 },
    { name: "Alejandro Grimaldo", position: "DEF", shirtNumber: 17 },
    { name: "Pedri", position: "MID", shirtNumber: 16 },
    { name: "Rodri", position: "MID", shirtNumber: 16 },
    { name: "Fabián Ruiz", position: "MID", shirtNumber: 8 },
    { name: "Dani Olmo", position: "MID", shirtNumber: 10 },
    { name: "Martín Zubimendi", position: "MID", shirtNumber: 5 },
    { name: "Álvaro Morata", position: "FWD", shirtNumber: 7 },
    { name: "Lamine Yamal", position: "FWD", shirtNumber: 19 },
    { name: "Nico Williams", position: "FWD", shirtNumber: 17 },
    { name: "Mikel Oyarzabal", position: "FWD", shirtNumber: 11 },
    { name: "Ferran Torres", position: "FWD", shirtNumber: 11 },
  ],

  GER: [
    { name: "Manuel Neuer", position: "GK", shirtNumber: 1 },
    { name: "Marc-André ter Stegen", position: "GK", shirtNumber: 22 },
    { name: "Joshua Kimmich", position: "DEF", shirtNumber: 6 },
    { name: "Antonio Rüdiger", position: "DEF", shirtNumber: 2 },
    { name: "Niklas Süle", position: "DEF", shirtNumber: 15 },
    { name: "Nico Schlotterbeck", position: "DEF", shirtNumber: 3 },
    { name: "David Raum", position: "DEF", shirtNumber: 18 },
    { name: "Benjamin Henrichs", position: "DEF", shirtNumber: 23 },
    { name: "Toni Kroos", position: "MID", shirtNumber: 8 },
    { name: "İlkay Gündoğan", position: "MID", shirtNumber: 21 },
    { name: "Florian Wirtz", position: "MID", shirtNumber: 10 },
    { name: "Jamal Musiala", position: "MID", shirtNumber: 14 },
    { name: "Robert Andrich", position: "MID", shirtNumber: 23 },
    { name: "Kai Havertz", position: "FWD", shirtNumber: 7 },
    { name: "Thomas Müller", position: "FWD", shirtNumber: 25 },
    { name: "Leroy Sané", position: "FWD", shirtNumber: 19 },
    { name: "Niclas Füllkrug", position: "FWD", shirtNumber: 9 },
    { name: "Serge Gnabry", position: "FWD", shirtNumber: 10 },
  ],

  BRA: [
    { name: "Alisson", position: "GK", shirtNumber: 1 },
    { name: "Éderson", position: "GK", shirtNumber: 23 },
    { name: "Danilo", position: "DEF", shirtNumber: 2 },
    { name: "Éder Militão", position: "DEF", shirtNumber: 3 },
    { name: "Marquinhos", position: "DEF", shirtNumber: 4 },
    { name: "Bremer", position: "DEF", shirtNumber: 14 },
    { name: "Renan Lodi", position: "DEF", shirtNumber: 11 },
    { name: "Alex Telles", position: "DEF", shirtNumber: 6 },
    { name: "Casemiro", position: "MID", shirtNumber: 5 },
    { name: "Lucas Paquetá", position: "MID", shirtNumber: 10 },
    { name: "Gerson", position: "MID", shirtNumber: 8 },
    { name: "Bruno Guimarães", position: "MID", shirtNumber: 17 },
    { name: "Fred", position: "MID", shirtNumber: 17 },
    { name: "Vinicius Jr.", nameNl: "Vinícius Jr.", position: "FWD", shirtNumber: 20 },
    { name: "Neymar Jr.", nameNl: "Neymar", position: "FWD", shirtNumber: 10 },
    { name: "Rodrygo", position: "FWD", shirtNumber: 19 },
    { name: "Raphinha", position: "FWD", shirtNumber: 17 },
    { name: "Gabriel Jesus", position: "FWD", shirtNumber: 9 },
    { name: "Endrick", position: "FWD", shirtNumber: 9 },
  ],

  POR: [
    { name: "Diogo Costa", position: "GK", shirtNumber: 1 },
    { name: "Rui Patrício", position: "GK", shirtNumber: 22 },
    { name: "João Cancelo", position: "DEF", shirtNumber: 20 },
    { name: "Rúben Dias", position: "DEF", shirtNumber: 4 },
    { name: "Pepe", position: "DEF", shirtNumber: 3 },
    { name: "Danilo Pereira", position: "DEF", shirtNumber: 13 },
    { name: "Raphaël Guerreiro", position: "DEF", shirtNumber: 22 },
    { name: "Nuno Mendes", position: "DEF", shirtNumber: 19 },
    { name: "Bernardo Silva", position: "MID", shirtNumber: 10 },
    { name: "Vitinha", position: "MID", shirtNumber: 16 },
    { name: "Rúben Neves", position: "MID", shirtNumber: 8 },
    { name: "Bruno Fernandes", position: "MID", shirtNumber: 8 },
    { name: "João Palhinha", position: "MID", shirtNumber: 26 },
    { name: "Cristiano Ronaldo", position: "FWD", shirtNumber: 7 },
    { name: "Rafael Leão", position: "FWD", shirtNumber: 17 },
    { name: "Pedro", position: "FWD", shirtNumber: 9 },
    { name: "João Félix", position: "FWD", shirtNumber: 11 },
    { name: "Gonçalo Ramos", position: "FWD", shirtNumber: 9 },
  ],

  ITA: [
    { name: "Gianluigi Donnarumma", position: "GK", shirtNumber: 1 },
    { name: "Alex Meret", position: "GK", shirtNumber: 16 },
    { name: "Giovanni Di Lorenzo", position: "DEF", shirtNumber: 2 },
    { name: "Alessandro Bastoni", position: "DEF", shirtNumber: 23 },
    { name: "Giorgio Scalvini", position: "DEF", shirtNumber: 14 },
    { name: "Federico Dimarco", position: "DEF", shirtNumber: 3 },
    { name: "Davide Calabria", position: "DEF", shirtNumber: 2 },
    { name: "Riccardo Calafiori", position: "DEF", shirtNumber: 15 },
    { name: "Nicolo Barella", nameNl: "Nicolò Barella", position: "MID", shirtNumber: 18 },
    { name: "Jorginho", position: "MID", shirtNumber: 8 },
    { name: "Davide Frattesi", position: "MID", shirtNumber: 11 },
    { name: "Lorenzo Pellegrini", position: "MID", shirtNumber: 10 },
    { name: "Bryan Cristante", position: "MID", shirtNumber: 16 },
    { name: "Gianluca Scamacca", position: "FWD", shirtNumber: 9 },
    { name: "Federico Chiesa", position: "FWD", shirtNumber: 14 },
    { name: "Mateo Retegui", position: "FWD", shirtNumber: 20 },
    { name: "Sandro Tonali", position: "FWD", shirtNumber: 8 },
    { name: "Lorenzo Lucca", position: "FWD", shirtNumber: 19 },
  ],

  BEL: [
    { name: "Thibaut Courtois", position: "GK", shirtNumber: 1 },
    { name: "Koen Casteels", position: "GK", shirtNumber: 23 },
    { name: "Thomas Meunier", position: "DEF", shirtNumber: 2 },
    { name: "Toby Alderweireld", position: "DEF", shirtNumber: 4 },
    { name: "Jan Vertonghen", position: "DEF", shirtNumber: 5 },
    { name: "Arthur Theate", position: "DEF", shirtNumber: 24 },
    { name: "Leander Dendoncker", position: "DEF", shirtNumber: 15 },
    { name: "Timothy Castagne", position: "DEF", shirtNumber: 3 },
    { name: "Kevin De Bruyne", position: "MID", shirtNumber: 7 },
    { name: "Axel Witsel", position: "MID", shirtNumber: 6 },
    { name: "Youri Tielemans", position: "MID", shirtNumber: 8 },
    { name: "Hans Vanaken", position: "MID", shirtNumber: 14 },
    { name: "Amadou Onana", position: "MID", shirtNumber: 20 },
    { name: "Romelu Lukaku", position: "FWD", shirtNumber: 9 },
    { name: "Eden Hazard", position: "FWD", shirtNumber: 10 },
    { name: "Dries Mertens", position: "FWD", shirtNumber: 14 },
    { name: "Lois Openda", position: "FWD", shirtNumber: 17 },
    { name: "Jeremy Doku", position: "FWD", shirtNumber: 11 },
  ],

  URU: [
    { name: "Sergio Rochet", position: "GK", shirtNumber: 1 },
    { name: "Fernando Muslera", position: "GK", shirtNumber: 23 },
    { name: "Nahitan Nández", position: "DEF", shirtNumber: 7 },
    { name: "José María Giménez", position: "DEF", shirtNumber: 2 },
    { name: "Diego Godín", position: "DEF", shirtNumber: 3 },
    { name: "Ronald Araújo", position: "DEF", shirtNumber: 4 },
    { name: "Matías Viña", position: "DEF", shirtNumber: 17 },
    { name: "Martín Cáceres", position: "DEF", shirtNumber: 15 },
    { name: "Federico Valverde", position: "MID", shirtNumber: 8 },
    { name: "Matías Vecino", position: "MID", shirtNumber: 14 },
    { name: "Rodrigo Bentancur", position: "MID", shirtNumber: 19 },
    { name: "Lucas Torreira", position: "MID", shirtNumber: 5 },
    { name: "Manuel Ugarte", position: "MID", shirtNumber: 15 },
    { name: "Darwin Núñez", position: "FWD", shirtNumber: 11 },
    { name: "Luis Suárez", position: "FWD", shirtNumber: 9 },
    { name: "Edinson Cavani", position: "FWD", shirtNumber: 21 },
    { name: "Facundo Torres", position: "FWD", shirtNumber: 18 },
    { name: "Maximiliano Gómez", position: "FWD", shirtNumber: 10 },
  ],

  USA: [
    { name: "Matt Turner", position: "GK", shirtNumber: 1 },
    { name: "Zack Steffen", position: "GK", shirtNumber: 12 },
    { name: "Sergiño Dest", position: "DEF", shirtNumber: 2 },
    { name: "Walker Zimmerman", position: "DEF", shirtNumber: 3 },
    { name: "Miles Robinson", position: "DEF", shirtNumber: 19 },
    { name: "Antonee Robinson", position: "DEF", shirtNumber: 5 },
    { name: "Tim Ream", position: "DEF", shirtNumber: 13 },
    { name: "DeAndre Yedlin", position: "DEF", shirtNumber: 2 },
    { name: "Tyler Adams", position: "MID", shirtNumber: 4 },
    { name: "Weston McKennie", position: "MID", shirtNumber: 8 },
    { name: "Yunus Musah", position: "MID", shirtNumber: 6 },
    { name: "Luca de la Torre", position: "MID", shirtNumber: 7 },
    { name: "Malik Tillman", position: "MID", shirtNumber: 17 },
    { name: "Christian Pulisic", position: "FWD", shirtNumber: 10 },
    { name: "Ricardo Pepi", position: "FWD", shirtNumber: 9 },
    { name: "Josh Sargent", position: "FWD", shirtNumber: 9 },
    { name: "Gio Reyna", position: "FWD", shirtNumber: 7 },
    { name: "Folarin Balogun", position: "FWD", shirtNumber: 14 },
  ],

  MEX: [
    { name: "Guillermo Ochoa", position: "GK", shirtNumber: 13 },
    { name: "Luis Malagón", position: "GK", shirtNumber: 1 },
    { name: "Jorge Sánchez", position: "DEF", shirtNumber: 21 },
    { name: "César Montes", position: "DEF", shirtNumber: 3 },
    { name: "Johan Vásquez", position: "DEF", shirtNumber: 4 },
    { name: "Gerardo Arteaga", position: "DEF", shirtNumber: 22 },
    { name: "Jesús Gallardo", position: "DEF", shirtNumber: 23 },
    { name: "Kevin Álvarez", position: "DEF", shirtNumber: 5 },
    { name: "Edson Álvarez", position: "MID", shirtNumber: 18 },
    { name: "Carlos Rodríguez", position: "MID", shirtNumber: 7 },
    { name: "Orbelín Pineda", position: "MID", shirtNumber: 8 },
    { name: "Luis Romo", position: "MID", shirtNumber: 19 },
    { name: "Chucky Lozano", nameNl: "Hirving Lozano", position: "FWD", shirtNumber: 22 },
    { name: "Raúl Jiménez", position: "FWD", shirtNumber: 9 },
    { name: "Henry Martín", position: "FWD", shirtNumber: 14 },
    { name: "Santiago Giménez", position: "FWD", shirtNumber: 11 },
    { name: "Alexis Vega", position: "FWD", shirtNumber: 11 },
  ],

  MAR: [
    { name: "Yassine Bounou", nameNl: "Bono", position: "GK", shirtNumber: 1 },
    { name: "Munir Mohamedi", position: "GK", shirtNumber: 16 },
    { name: "Achraf Hakimi", position: "DEF", shirtNumber: 2 },
    { name: "Noussair Mazraoui", position: "DEF", shirtNumber: 3 },
    { name: "Nayef Aguerd", position: "DEF", shirtNumber: 5 },
    { name: "Romain Saïss", position: "DEF", shirtNumber: 6 },
    { name: "Yahia Attiyat Allah", position: "DEF", shirtNumber: 17 },
    { name: "Jawad El Yamiq", position: "DEF", shirtNumber: 19 },
    { name: "Sofyan Amrabat", position: "MID", shirtNumber: 4 },
    { name: "Azzedine Ounahi", position: "MID", shirtNumber: 8 },
    { name: "Selim Amallah", position: "MID", shirtNumber: 18 },
    { name: "Bilal El Khannous", position: "MID", shirtNumber: 10 },
    { name: "Hakim Ziyech", position: "FWD", shirtNumber: 7 },
    { name: "Youssef En-Nesyri", position: "FWD", shirtNumber: 19 },
    { name: "Sofiane Boufal", position: "FWD", shirtNumber: 11 },
    { name: "Ayoub El Kaabi", position: "FWD", shirtNumber: 17 },
  ],

  SEN: [
    { name: "Édouard Mendy", position: "GK", shirtNumber: 16 },
    { name: "Alfred Gomis", position: "GK", shirtNumber: 1 },
    { name: "Youssouf Sabaly", position: "DEF", shirtNumber: 26 },
    { name: "Kalidou Koulibaly", position: "DEF", shirtNumber: 3 },
    { name: "Abdou Diallo", position: "DEF", shirtNumber: 15 },
    { name: "Fodé Ballo-Touré", position: "DEF", shirtNumber: 20 },
    { name: "Bouna Sarr", position: "DEF", shirtNumber: 2 },
    { name: "Pape Abou Cissé", position: "DEF", shirtNumber: 5 },
    { name: "Idrissa Gueye", position: "MID", shirtNumber: 13 },
    { name: "Nampalys Mendy", position: "MID", shirtNumber: 6 },
    { name: "Cheikhou Kouyaté", position: "MID", shirtNumber: 8 },
    { name: "Pape Matar Sarr", position: "MID", shirtNumber: 23 },
    { name: "Sadio Mané", position: "FWD", shirtNumber: 10 },
    { name: "Ismaïla Sarr", position: "FWD", shirtNumber: 23 },
    { name: "Bamba Dieng", position: "FWD", shirtNumber: 9 },
    { name: "Nicolas Jackson", position: "FWD", shirtNumber: 11 },
  ],

  JPN: [
    { name: "Shuichi Gonda", position: "GK", shirtNumber: 1 },
    { name: "Zion Suzuki", position: "GK", shirtNumber: 12 },
    { name: "Hiroki Sakai", position: "DEF", shirtNumber: 5 },
    { name: "Maya Yoshida", position: "DEF", shirtNumber: 22 },
    { name: "Ko Itakura", position: "DEF", shirtNumber: 3 },
    { name: "Yuto Nagatomo", position: "DEF", shirtNumber: 5 },
    { name: "Wataru Endo", position: "DEF", shirtNumber: 17 },
    { name: "Miki Yamane", position: "DEF", shirtNumber: 16 },
    { name: "Hidemasa Morita", position: "MID", shirtNumber: 7 },
    { name: "Gaku Shibasaki", position: "MID", shirtNumber: 14 },
    { name: "Takefusa Kubo", position: "MID", shirtNumber: 16 },
    { name: "Ritsu Doan", position: "MID", shirtNumber: 9 },
    { name: "Ao Tanaka", position: "MID", shirtNumber: 6 },
    { name: "Kaoru Mitoma", position: "FWD", shirtNumber: 10 },
    { name: "Daizen Maeda", position: "FWD", shirtNumber: 11 },
    { name: "Ayase Ueda", position: "FWD", shirtNumber: 15 },
    { name: "Koji Miyoshi", position: "FWD", shirtNumber: 17 },
  ],

  KOR: [
    { name: "Seung-gyu Kim", position: "GK", shirtNumber: 1 },
    { name: "Jo Hyeon-woo", position: "GK", shirtNumber: 21 },
    { name: "Kim Moon-hwan", position: "DEF", shirtNumber: 2 },
    { name: "Kim Min-jae", position: "DEF", shirtNumber: 3 },
    { name: "Kim Young-gwon", position: "DEF", shirtNumber: 19 },
    { name: "Kim Jin-su", position: "DEF", shirtNumber: 3 },
    { name: "Yoon Jong-gyu", position: "DEF", shirtNumber: 15 },
    { name: "Na Sang-ho", position: "DEF", shirtNumber: 17 },
    { name: "Hwang In-beom", position: "MID", shirtNumber: 16 },
    { name: "Jung Woo-young", position: "MID", shirtNumber: 6 },
    { name: "Lee Jae-sung", position: "MID", shirtNumber: 7 },
    { name: "Paik Seung-ho", position: "MID", shirtNumber: 14 },
    { name: "Son Heung-min", position: "FWD", shirtNumber: 7 },
    { name: "Hwang Hee-chan", position: "FWD", shirtNumber: 11 },
    { name: "Hwang Ui-jo", position: "FWD", shirtNumber: 9 },
    { name: "Cho Gue-sung", position: "FWD", shirtNumber: 20 },
    { name: "Lee Kang-in", position: "FWD", shirtNumber: 17 },
  ],

  AUS: [
    { name: "Mathew Ryan", position: "GK", shirtNumber: 1 },
    { name: "Danny Vukovic", position: "GK", shirtNumber: 12 },
    { name: "Nathaniel Atkinson", position: "DEF", shirtNumber: 2 },
    { name: "Harry Souttar", position: "DEF", shirtNumber: 5 },
    { name: "Milos Degenek", position: "DEF", shirtNumber: 20 },
    { name: "Aziz Behich", position: "DEF", shirtNumber: 3 },
    { name: "Bailey Wright", position: "DEF", shirtNumber: 14 },
    { name: "Joel King", position: "DEF", shirtNumber: 19 },
    { name: "Aaron Mooy", position: "MID", shirtNumber: 13 },
    { name: "Jackson Irvine", position: "MID", shirtNumber: 8 },
    { name: "Tom Rogic", position: "MID", shirtNumber: 10 },
    { name: "Riley McGree", position: "MID", shirtNumber: 16 },
    { name: "Cameron Devlin", position: "MID", shirtNumber: 6 },
    { name: "Mathew Leckie", position: "FWD", shirtNumber: 7 },
    { name: "Mitch Duke", position: "FWD", shirtNumber: 9 },
    { name: "Jamie Maclaren", position: "FWD", shirtNumber: 11 },
    { name: "Craig Goodwin", position: "FWD", shirtNumber: 11 },
  ],

  CRO: [
    { name: "Dominik Livaković", position: "GK", shirtNumber: 1 },
    { name: "Ivica Ivušić", position: "GK", shirtNumber: 23 },
    { name: "Josip Juranović", position: "DEF", shirtNumber: 2 },
    { name: "Dejan Lovren", position: "DEF", shirtNumber: 6 },
    { name: "Joško Gvardiol", position: "DEF", shirtNumber: 24 },
    { name: "Borna Sosa", position: "DEF", shirtNumber: 22 },
    { name: "Domagoj Vida", position: "DEF", shirtNumber: 21 },
    { name: "Borna Barišić", position: "DEF", shirtNumber: 3 },
    { name: "Luka Modrić", position: "MID", shirtNumber: 10 },
    { name: "Mateo Kovačić", position: "MID", shirtNumber: 8 },
    { name: "Marcelo Brozović", position: "MID", shirtNumber: 11 },
    { name: "Lovro Majer", position: "MID", shirtNumber: 16 },
    { name: "Mario Pašalić", position: "MID", shirtNumber: 19 },
    { name: "Ivan Perišić", position: "FWD", shirtNumber: 4 },
    { name: "Bruno Petković", position: "FWD", shirtNumber: 16 },
    { name: "Andrej Kramarić", position: "FWD", shirtNumber: 9 },
    { name: "Luka Ivanušec", position: "FWD", shirtNumber: 17 },
  ],
}

export async function seedPlayers(prisma: PrismaClient) {
  console.log("⚽ Fantasy WK spelers seeden...")

  let created = 0
  let updated = 0

  for (const [teamCode, players] of Object.entries(SQUADS)) {
    const team = await prisma.team.findUnique({ where: { code: teamCode } })
    if (!team) {
      console.warn(`⚠️  Team niet gevonden: ${teamCode} — spelers overgeslagen`)
      continue
    }

    for (const p of players) {
      // Zoek op naam + teamId (geen externalId beschikbaar voor handmatige seed)
      const existing = await prisma.player.findFirst({
        where: { name: p.name, teamId: team.id },
      })

      if (existing) {
        await prisma.player.update({
          where: { id: existing.id },
          data: {
            nameNl: p.nameNl,
            position: p.position,
            shirtNumber: p.shirtNumber,
            isActive: true,
          },
        })
        updated++
      } else {
        await prisma.player.create({
          data: {
            name: p.name,
            nameNl: p.nameNl,
            teamId: team.id,
            position: p.position,
            shirtNumber: p.shirtNumber,
            isActive: true,
          },
        })
        created++
      }
    }

    console.log(`  ✅ ${teamCode}: ${players.length} spelers`)
  }

  console.log(`✅ Spelers: ${created} aangemaakt, ${updated} bijgewerkt`)
}
