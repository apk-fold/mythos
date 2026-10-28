// Lightweight, offline-first UI localization shared by the apk-fold applications.
// Source strings remain the French UI text; unknown strings safely fall back to French.
const LOCALES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
];

const ROWS = [
  ['Langue de l’interface','Interface language','Idioma de la interfaz','Sprache der Oberfläche','Lingua dell’interfaccia','Idioma da interface'],
  ['Accueil','Home','Inicio','Startseite','Home','Início'],
  ['Bibliothèque','Library','Biblioteca','Bibliothek','Libreria','Biblioteca'],
  ['Albums','Albums','Álbumes','Alben','Album','Álbuns'],
  ['Artistes','Artists','Artistas','Künstler','Artisti','Artistas'],
  ['Playlists','Playlists','Listas de reproducción','Playlists','Playlist','Playlists'],
  ['Plus','More','Más','Mehr','Altro','Mais'],
  ['Rechercher','Search','Buscar','Suchen','Cerca','Pesquisar'],
  ['Rechercher…','Search…','Buscar…','Suchen…','Cerca…','Pesquisar…'],
  ['Favoris','Favorites','Favoritos','Favoriten','Preferiti','Favoritos'],
  ['Genres','Genres','Géneros','Genres','Generi','Gêneros'],
  ['Radios','Radios','Radios','Radios','Radio','Rádios'],
  ['Hors-ligne','Offline','Sin conexión','Offline','Offline','Offline'],
  ['Réglages','Settings','Ajustes','Einstellungen','Impostazioni','Configurações'],
  ['Paramètres','Settings','Configuración','Einstellungen','Impostazioni','Configurações'],
  ['Personnalisation','Customization','Personalización','Personalisierung','Personalizzazione','Personalização'],
  ['Apparence','Appearance','Apariencia','Erscheinungsbild','Aspetto','Aparência'],
  ['Couleurs','Colors','Colores','Farben','Colori','Cores'],
  ['Police','Font','Fuente','Schriftart','Carattere','Fonte'],
  ['Affichage','Display','Visualización','Anzeige','Visualizzazione','Exibição'],
  ['Données','Data','Datos','Daten','Dati','Dados'],
  ['Sauvegarde','Backup','Copia de seguridad','Sicherung','Backup','Backup'],
  ['Sauvegardes','Backups','Copias de seguridad','Sicherungen','Backup','Backups'],
  ['Synchronisation','Synchronization','Sincronización','Synchronisierung','Sincronizzazione','Sincronização'],
  ['Synchroniser','Sync','Sincronizar','Synchronisieren','Sincronizza','Sincronizar'],
  ['À propos','About','Acerca de','Über','Informazioni','Sobre'],
  ['Enregistrer','Save','Guardar','Speichern','Salva','Salvar'],
  ['Annuler','Cancel','Cancelar','Abbrechen','Annulla','Cancelar'],
  ['Fermer','Close','Cerrar','Schließen','Chiudi','Fechar'],
  ['Supprimer','Delete','Eliminar','Löschen','Elimina','Excluir'],
  ['Modifier','Edit','Editar','Bearbeiten','Modifica','Editar'],
  ['Ajouter','Add','Añadir','Hinzufügen','Aggiungi','Adicionar'],
  ['Créer','Create','Crear','Erstellen','Crea','Criar'],
  ['Importer','Import','Importar','Importieren','Importa','Importar'],
  ['Exporter','Export','Exportar','Exportieren','Esporta','Exportar'],
  ['Historique','History','Historial','Verlauf','Cronologia','Histórico'],
  ['Résumé','Summary','Resumen','Zusammenfassung','Riepilogo','Resumo'],
  ['Missions','Jobs','Misiones','Aufträge','Missioni','Missões'],
  ['Aujourd’hui','Today','Hoy','Heute','Oggi','Hoje'],
  ['Continuer','Continue','Continuar','Weiter','Continua','Continuar'],
  ['Retour','Back','Atrás','Zurück','Indietro','Voltar'],
  ['Oui','Yes','Sí','Ja','Sì','Sim'],
  ['Non','No','No','Nein','No','Não'],
  ['Valider','Confirm','Confirmar','Bestätigen','Conferma','Confirmar'],
  ['Langue','Language','Idioma','Sprache','Lingua','Idioma'],
  ['Thème','Theme','Tema','Thema','Tema','Tema'],
  ['Sombre','Dark','Oscuro','Dunkel','Scuro','Escuro'],
  ['Noir (AMOLED)','Black (AMOLED)','Negro (AMOLED)','Schwarz (AMOLED)','Nero (AMOLED)','Preto (AMOLED)'],
  ['Clair','Light','Claro','Hell','Chiaro','Claro'],
  ['Auto','Auto','Automático','Automatisch','Automatico','Automático'],
  ['Couleur principale','Main color','Color principal','Hauptfarbe','Colore principale','Cor principal'],
  ['Couleurs des majorations','Overtime colors','Colores de recargos','Zuschlagsfarben','Colori delle maggiorazioni','Cores dos adicionais'],
  ['Taille du texte','Text size','Tamaño del texto','Textgröße','Dimensione del testo','Tamanho do texto'],
  ['Animations','Animations','Animaciones','Animationen','Animazioni','Animações'],
  ['Vibrations','Haptics','Vibraciones','Vibrationen','Vibrazioni','Vibrações'],
  ['Confirmer','Confirm','Confirmar','Bestätigen','Conferma','Confirmar'],
  ['Réinitialiser','Reset','Restablecer','Zurücksetzen','Reimposta','Redefinir'],
  ['Réinitialiser l’apparence','Reset appearance','Restablecer apariencia','Erscheinungsbild zurücksetzen','Reimposta aspetto','Redefinir aparência'],
  ['Nom','Name','Nombre','Name','Nome','Nome'],
  ['Date','Date','Fecha','Datum','Data','Data'],
  ['Type','Type','Tipo','Typ','Tipo','Tipo'],
  ['Tout','All','Todo','Alle','Tutto','Tudo'],
  ['Documents','Documents','Documentos','Dokumente','Documenti','Documentos'],
  ['Classeurs','Spreadsheets','Hojas de cálculo','Tabellen','Fogli di calcolo','Planilhas'],
  ['Présentations','Presentations','Presentaciones','Präsentationen','Presentazioni','Apresentações'],
  ['Document','Document','Documento','Dokument','Documento','Documento'],
  ['Classeur','Spreadsheet','Hoja de cálculo','Tabelle','Foglio di calcolo','Planilha'],
  ['Présentation','Presentation','Presentación','Präsentation','Presentazione','Apresentação'],
  ['Traitement de texte','Word processing','Procesador de texto','Textverarbeitung','Elaborazione testi','Processador de texto'],
  ['Tableur et formules','Spreadsheet and formulas','Hoja de cálculo y fórmulas','Tabellenkalkulation und Formeln','Foglio di calcolo e formule','Planilha e fórmulas'],
  ['Diapositives','Slides','Diapositivas','Folien','Diapositive','Slides'],
  ['Aucun résultat.','No results.','Sin resultados.','Keine Ergebnisse.','Nessun risultato.','Nenhum resultado.'],
  ['Aucun fichier pour l’instant.','No files yet.','Todavía no hay archivos.','Noch keine Dateien.','Nessun file per ora.','Nenhum arquivo por enquanto.'],
  ['Aucun fichier pour l\'instant.','No files yet.','Todavía no hay archivos.','Noch keine Dateien.','Nessun file per ora.','Nenhum arquivo por enquanto.'],
  ['Format non pris en charge','Unsupported format','Formato no compatible','Nicht unterstütztes Format','Formato non supportato','Formato não compatível'],
  ['Connexion','Connection','Conexión','Verbindung','Connessione','Conexão'],
  ['Se connecter','Sign in','Iniciar sesión','Anmelden','Accedi','Entrar'],
  ['Serveur','Server','Servidor','Server','Server','Servidor'],
  ['Utilisateur','Username','Usuario','Benutzername','Nome utente','Usuário'],
  ['Mot de passe','Password','Contraseña','Passwort','Password','Senha'],
  ['Mot de passe maître','Master password','Contraseña maestra','Master-Passwort','Password principale','Senha mestra'],
  ['Coffres','Vaults','Bóvedas','Tresore','Cassaforti','Cofres'],
  ['Déverrouillage','Unlock','Desbloqueo','Entsperren','Sblocco','Desbloqueio'],
  ['Biométrie','Biometrics','Biometría','Biometrie','Biometria','Biometria'],
  ['Code PIN','PIN','PIN','PIN-Code','Codice PIN','Código PIN'],
  ['Corbeille','Trash','Papelera','Papierkorb','Cestino','Lixeira'],
  ['Verrouiller maintenant','Lock now','Bloquear ahora','Jetzt sperren','Blocca ora','Bloquear agora'],
  ['Jamais','Never','Nunca','Nie','Mai','Nunca'],
  ['Activé','Enabled','Activado','Aktiviert','Attivo','Ativado'],
  ['Désactivé','Disabled','Desactivado','Deaktiviert','Disattivato','Desativado'],
  ['Reprendre','Resume','Reanudar','Fortsetzen','Riprendi','Retomar'],
  ['Lecture','Playback','Reproducción','Wiedergabe','Riproduzione','Reprodução'],
  ['Téléchargements','Downloads','Descargas','Downloads','Download','Downloads'],
  ['Recherche','Search','Búsqueda','Suche','Ricerca','Pesquisa'],
  ['Nouvel onglet','New tab','Nueva pestaña','Neuer Tab','Nuova scheda','Nova aba'],
  ['Commandes rapides','Quick commands','Comandos rápidos','Schnellbefehle','Comandi rapidi','Comandos rápidos'],
  ['Terminal','Terminal','Terminal','Terminal','Terminale','Terminal'],
  ['Connexions','Connections','Conexiones','Verbindungen','Connessioni','Conexões'],
  ['SSH et clés','SSH and keys','SSH y claves','SSH und Schlüssel','SSH e chiavi','SSH e chaves'],
  ['Shell local','Local shell','Shell local','Lokale Shell','Shell locale','Shell local'],
  ['Clavier','Keyboard','Teclado','Tastatur','Tastiera','Teclado'],
  ['Rappel','Reminder','Recordatorio','Erinnerung','Promemoria','Lembrete'],
  ['Calculs et jours fériés','Calculations and public holidays','Cálculos y festivos','Berechnungen und Feiertage','Calcoli e festività','Cálculos e feriados'],
  ['Heures sup.','Overtime','Horas extra','Überstunden','Straordinari','Horas extras'],
  ['Nuit','Night','Noche','Nacht','Notte','Noite'],
  ['Dimanche','Sunday','Domingo','Sonntag','Domenica','Domingo'],
  ['Jours fériés','Public holidays','Festivos','Feiertage','Festività','Feriados'],
  ['Texte','Text','Texto','Text','Testo','Texto'],
  ['Police des titres','Heading font','Fuente de títulos','Schrift für Überschriften','Carattere dei titoli','Fonte dos títulos'],
  ['Police du texte','Body font','Fuente del texto','Fließtext-Schrift','Carattere del testo','Fonte do texto'],
  ['Formes et mouvements','Shapes and motion','Formas y movimiento','Formen und Bewegung','Forme e movimenti','Formas e movimentos'],
  ['Coins','Corners','Esquinas','Ecken','Angoli','Cantos'],
  ['Arrondis','Rounded','Redondeados','Abgerundet','Arrotondati','Arredondados'],
  ['Très arrondis','Very rounded','Muy redondeados','Stark abgerundet','Molto arrotondati','Muito arredondados'],
  ['Densité','Density','Densidad','Dichte','Densità','Densidade'],
  ['Confortable','Comfortable','Cómoda','Komfortabel','Confortevole','Confortável'],
  ['Compacte','Compact','Compacta','Kompakt','Compatta','Compacta'],
  ['Aucun titre trouvé','No tracks found','No se encontraron pistas','Keine Titel gefunden','Nessun brano trovato','Nenhuma faixa encontrada'],
  ['Changer de serveur','Change server','Cambiar de servidor','Server wechseln','Cambia server','Trocar de servidor'],
  ['Mix aléatoire','Random mix','Mezcla aleatoria','Zufallsmix','Mix casuale','Mix aleatório'],
  ['Bibliothèque vide','Empty library','Biblioteca vacía','Leere Bibliothek','Libreria vuota','Biblioteca vazia'],
  ['Ajoutés récemment','Recently added','Añadidos recientemente','Kürzlich hinzugefügt','Aggiunti di recente','Adicionados recentemente'],
  ['Écoutés récemment','Recently played','Escuchados recientemente','Kürzlich angehört','Ascoltati di recente','Ouvidos recentemente'],
  ['Les plus écoutés','Most played','Los más escuchados','Am häufigsten gespielt','I più ascoltati','Mais ouvidos'],
  ['Au hasard','Random','Al azar','Zufällig','Casuale','Aleatório'],
  ['Tes favoris','Your favorites','Tus favoritos','Deine Favoriten','I tuoi preferiti','Seus favoritos'],
  ['Bienvenue','Welcome','Te damos la bienvenida','Willkommen','Benvenuto','Boas-vindas'],
  ['Connecte-toi à ton serveur Navidrome.','Connect to your Navidrome server.','Conéctate a tu servidor Navidrome.','Verbinde dich mit deinem Navidrome-Server.','Connettiti al tuo server Navidrome.','Conecte-se ao seu servidor Navidrome.'],
  ['Créer mon coffre','Create my vault','Crear mi bóveda','Tresor erstellen','Crea la mia cassaforte','Criar meu cofre'],
  ['Restaurer une sauvegarde','Restore a backup','Restaurar una copia de seguridad','Sicherung wiederherstellen','Ripristina un backup','Restaurar um backup'],
  ['gestionnaire de mots de passe','password manager','gestor de contraseñas','Passwortmanager','gestore di password','gerenciador de senhas'],
  ['Générateur','Generator','Generador','Generator','Generatore','Gerador'],
  ['Générer','Generate','Generar','Generieren','Genera','Gerar'],
  ['Verrouiller','Lock','Bloquear','Sperren','Blocca','Bloquear'],
  ['Déverrouiller','Unlock','Desbloquear','Entsperren','Sblocca','Desbloquear'],
  ['Nom du thème','Theme name','Nombre del tema','Themenname','Nome del tema','Nome do tema'],
  ['Personnaliser les couleurs','Customize colors','Personalizar colores','Farben anpassen','Personalizza i colori','Personalizar cores'],
  ['Importer un thème','Import a theme','Importar un tema','Thema importieren','Importa un tema','Importar um tema'],
  ['Supprimer ce thème','Delete this theme','Eliminar este tema','Dieses Thema löschen','Elimina questo tema','Excluir este tema'],
  ['Thème personnel','Custom theme','Tema personalizado','Benutzerdefiniertes Thema','Tema personalizzato','Tema personalizado'],
  ['Interface','Interface','Interfaz','Oberfläche','Interfaccia','Interface'],
  ['Couleur d’accent','Accent color','Color de acento','Akzentfarbe','Colore accento','Cor de destaque'],
  ['Accent qui suit le thème','Accent follows theme','El acento sigue el tema','Akzent folgt dem Thema','L’accento segue il tema','A cor de destaque acompanha o tema'],
  ['Marge autour du texte','Text margin','Margen del texto','Textabstand','Margine del testo','Margem ao redor do texto'],
  ['Position des onglets','Tab position','Posición de las pestañas','Position der Tabs','Posizione delle schede','Posição das abas'],
  ['En haut','Top','Arriba','Oben','In alto','Em cima'],
  ['En bas','Bottom','Abajo','Unten','In basso','Embaixo'],
  ['Onglet actif, boutons, touches CTRL/ALT…','Active tab, buttons, CTRL/ALT keys…','Pestaña activa, botones, teclas CTRL/ALT…','Aktiver Tab, Schaltflächen, STRG/ALT-Tasten…','Scheda attiva, pulsanti, tasti CTRL/ALT…','Aba ativa, botões, teclas CTRL/ALT…'],
  ['Écrivez, calculez et présentez.','Write, calculate, and present.','Escribe, calcula y presenta.','Schreiben, rechnen und präsentieren.','Scrivi, calcola e presenta.','Escreva, calcule e apresente.'],
  ['Tout reste sur vos appareils et se synchronise sans serveur.','Everything stays on your devices and syncs without a server.','Todo permanece en tus dispositivos y se sincroniza sin servidor.','Alles bleibt auf deinen Geräten und synchronisiert sich ohne Server.','Tutto resta sui tuoi dispositivi e si sincronizza senza server.','Tudo fica nos seus dispositivos e sincroniza sem servidor.'],
  ['Créer un document','Create a document','Crear un documento','Dokument erstellen','Crea un documento','Criar documento'],
  ['Paramètres','Settings','Configuración','Einstellungen','Impostazioni','Configurações'],
  ['Enregistrer les modifications','Save changes','Guardar cambios','Änderungen speichern','Salva modifiche','Salvar alterações'],
  ['Appliquer','Apply','Aplicar','Anwenden','Applica','Aplicar'],
  ['Précédent','Previous','Anterior','Zurück','Precedente','Anterior'],
  ['Suivant','Next','Siguiente','Weiter','Successivo','Próximo'],
  ['Actualiser','Refresh','Actualizar','Aktualisieren','Aggiorna','Atualizar'],
  ['État','Status','Estado','Status','Stato','Status'],
  ['Reconnecter','Reconnect','Volver a conectar','Erneut verbinden','Riconnetti','Reconectar'],
  ['Aperçu','Preview','Vista previa','Vorschau','Anteprima','Pré-visualização'],
  ['Principal','Primary','Principal','Primär','Primario','Principal'],
  ['Secondaire','Secondary','Secundario','Sekundär','Secondario','Secundário'],
  ['Système','System','Sistema','System','Sistema','Sistema'],
  ['Système (Roboto)','System (Roboto)','Sistema (Roboto)','System (Roboto)','Sistema (Roboto)','Sistema (Roboto)'],
  ['Exporter les données','Export data','Exportar datos','Daten exportieren','Esporta dati','Exportar dados'],
  ['Importer des données','Import data','Importar datos','Daten importieren','Importa dati','Importar dados'],
  ['Sauvegarder','Save backup','Crear copia de seguridad','Sicherung erstellen','Crea backup','Fazer backup'],
  ['Annuler les modifications','Discard changes','Descartar cambios','Änderungen verwerfen','Annulla modifiche','Descartar alterações'],
  ['Chargement…','Loading…','Cargando…','Wird geladen…','Caricamento…','Carregando…'],
  ['Réessayer','Retry','Reintentar','Erneut versuchen','Riprova','Tentar novamente'],
  ['Erreur','Error','Error','Fehler','Errore','Erro'],
  ['Langue enregistrée','Language saved','Idioma guardado','Sprache gespeichert','Lingua salvata','Idioma salvo'],
];

const APP_ROWS = [
  ['Disque','Drive','Unidad','Laufwerk','Disco','Disco'],
  ['Découvrir','Discover','Descubrir','Entdecken','Scopri','Descobrir'],
  ['Nouveautés','New releases','Novedades','Neuerscheinungen','Novità','Novidades'],
  ['Écoutes récentes','Recently played','Reproducciones recientes','Kürzlich angehört','Ascoltati di recente','Tocadas recentemente'],
  ['Les plus joués','Most played','Más reproducidos','Am häufigsten gespielt','Più riprodotti','Mais tocados'],
  ['Lire','Play','Reproducir','Abspielen','Riproduci','Reproduzir'],
  ['Pause','Pause','Pausar','Pause','Pausa','Pausar'],
  ['Suivant','Next','Siguiente','Weiter','Successivo','Próximo'],
  ['Précédent','Previous','Anterior','Zurück','Precedente','Anterior'],
  ['Aléatoire','Shuffle','Aleatorio','Zufällig','Casuale','Aleatório'],
  ['Répéter','Repeat','Repetir','Wiederholen','Ripeti','Repetir'],
  ['Égaliseur','Equalizer','Ecualizador','Equalizer','Equalizzatore','Equalizador'],
  ['Paroles','Lyrics','Letras','Liedtexte','Testi','Letras'],
  ['File d’attente','Queue','Cola','Warteschlange','Coda','Fila'],
  ['Ajouter à la file d’attente','Add to queue','Añadir a la cola','Zur Warteschlange hinzufügen','Aggiungi alla coda','Adicionar à fila'],
  ['Mode hors-ligne','Offline mode','Modo sin conexión','Offline-Modus','Modalità offline','Modo offline'],
  ['Titres','Tracks','Pistas','Titel','Brani','Faixas'],
  ['Pistes','Tracks','Pistas','Titel','Brani','Faixas'],
  ['Aucun album','No albums','No hay álbumes','Keine Alben','Nessun album','Nenhum álbum'],
  ['Aucun titre','No tracks','No hay pistas','Keine Titel','Nessun brano','Nenhuma faixa'],
  ['Changer de serveur','Change server','Cambiar de servidor','Server wechseln','Cambia server','Trocar de servidor'],
  ['Bienvenue','Welcome','Te damos la bienvenida','Willkommen','Benvenuto','Boas-vindas'],
  ['Coffre','Vault','Bóveda','Tresor','Cassaforte','Cofre'],
  ['Créer un coffre','Create a vault','Crear una bóveda','Tresor erstellen','Crea una cassaforte','Criar um cofre'],
  ['Créer mon coffre','Create my vault','Crear mi bóveda','Meinen Tresor erstellen','Crea la mia cassaforte','Criar meu cofre'],
  ['Déverrouiller','Unlock','Desbloquear','Entsperren','Sblocca','Desbloquear'],
  ['Mot de passe principal','Master password','Contraseña maestra','Master-Passwort','Password principale','Senha mestra'],
  ['Générateur','Generator','Generador','Generator','Generatore','Gerador'],
  ['Générer un mot de passe','Generate a password','Generar una contraseña','Passwort generieren','Genera una password','Gerar uma senha'],
  ['Identifiants','Logins','Credenciales','Anmeldedaten','Credenziali','Credenciais'],
  ['Carte bancaire','Payment card','Tarjeta bancaria','Zahlungskarte','Carta di pagamento','Cartão bancário'],
  ['Notes sécurisées','Secure notes','Notas seguras','Sichere Notizen','Note sicure','Notas seguras'],
  ['Aucun élément','No items','No hay elementos','Keine Einträge','Nessun elemento','Nenhum item'],
  ['Aucun élément pour l’instant.','No items yet.','Todavía no hay elementos.','Noch keine Einträge.','Ancora nessun elemento.','Nenhum item ainda.'],
  ['Créer un élément','Create item','Crear elemento','Eintrag erstellen','Crea elemento','Criar item'],
  ['Nouveau mot de passe','New password','Nueva contraseña','Neues Passwort','Nuova password','Nova senha'],
  ['Remplissage automatique','Autofill','Autorrelleno','Automatisches Ausfüllen','Compilazione automatica','Preenchimento automático'],
  ['Verrouillage automatique','Auto-lock','Bloqueo automático','Automatische Sperre','Blocco automatico','Bloqueio automático'],
  ['Confidentialité','Privacy','Privacidad','Datenschutz','Privacy','Privacidade'],
  ['Presse-papiers','Clipboard','Portapapeles','Zwischenablage','Appunti','Área de transferência'],
  ['Nouvelle mission','New job','Nueva misión','Neuer Auftrag','Nuova missione','Nova missão'],
  ['Modifier la mission','Edit job','Editar misión','Auftrag bearbeiten','Modifica missione','Editar missão'],
  ['Début','Start','Inicio','Beginn','Inizio','Início'],
  ['Fin','End','Fin','Ende','Fine','Fim'],
  ['Pause','Break','Pausa','Pause','Pausa','Intervalo'],
  ['Heures travaillées','Hours worked','Horas trabajadas','Arbeitsstunden','Ore lavorate','Horas trabalhadas'],
  ['Heures supplémentaires','Overtime','Horas extra','Überstunden','Straordinari','Horas extras'],
  ['Jour férié','Public holiday','Festivo','Feiertag','Festivo','Feriado'],
  ['Montant estimé','Estimated amount','Importe estimado','Geschätzter Betrag','Importo stimato','Valor estimado'],
  ['Taux horaire','Hourly rate','Tarifa por hora','Stundenlohn','Tariffa oraria','Valor por hora'],
  ['Panier repas','Meal allowance','Plus de comida','Essenspauschale','Indennità pasto','Auxílio-alimentação'],
  ['Indemnités','Allowances','Indemnizaciones','Zulagen','Indennità','Adicionais'],
  ['Ajouter des heures','Add hours','Añadir horas','Stunden hinzufügen','Aggiungi ore','Adicionar horas'],
  ['Choisir une date','Choose a date','Elegir una fecha','Datum auswählen','Scegli una data','Escolher uma data'],
  ['Données et sauvegarde','Data and backup','Datos y copia de seguridad','Daten und Sicherung','Dati e backup','Dados e backup'],
  ['Exporter PDF','Export PDF','Exportar PDF','PDF exportieren','Esporta PDF','Exportar PDF'],
  ['Aujourd’hui','Today','Hoy','Heute','Oggi','Hoje'],
  ['Bonne nuit','Good evening','Buenas noches','Gute Nacht','Buona notte','Boa noite'],
  ['Bonjour','Good morning','Buenos días','Guten Morgen','Buongiorno','Bom dia'],
  ['Bon après-midi','Good afternoon','Buenas tardes','Guten Tag','Buon pomeriggio','Boa tarde'],
  ['Bonsoir','Good evening','Buenas tardes','Guten Abend','Buonasera','Boa noite'],
  ['Nouveau document','New document','Nuevo documento','Neues Dokument','Nuovo documento','Novo documento'],
  ['Document vierge','Blank document','Documento en blanco','Leeres Dokument','Documento vuoto','Documento em branco'],
  ['Nouveau classeur','New spreadsheet','Nueva hoja de cálculo','Neue Tabelle','Nuovo foglio di calcolo','Nova planilha'],
  ['Nouvelle présentation','New presentation','Nueva presentación','Neue Präsentation','Nuova presentazione','Nova apresentação'],
  ['Rechercher dans les documents','Search documents','Buscar documentos','Dokumente durchsuchen','Cerca documenti','Pesquisar documentos'],
  ['Aucun fichier pour l’instant.','No files yet.','Todavía no hay archivos.','Noch keine Dateien.','Nessun file per ora.','Nenhum arquivo por enquanto.'],
  ['Sans titre','Untitled','Sin título','Unbenannt','Senza titolo','Sem título'],
  ['Renommer','Rename','Cambiar nombre','Umbenennen','Rinomina','Renomear'],
  ['Dupliquer','Duplicate','Duplicar','Duplizieren','Duplica','Duplicar'],
  ['Tout supprimer','Delete all','Eliminar todo','Alles löschen','Elimina tutto','Excluir tudo'],
  ['Arrière-plan','Background','Fondo','Hintergrund','Sfondo','Plano de fundo'],
  ['Affichage des fichiers','File display','Visualización de archivos','Dateianzeige','Visualizzazione file','Exibição de arquivos'],
  ['Trier par','Sort by','Ordenar por','Sortieren nach','Ordina per','Ordenar por'],
  ['Confirmer avant de supprimer','Confirm before deleting','Confirmar antes de eliminar','Vor dem Löschen bestätigen','Conferma prima di eliminare','Confirmar antes de excluir'],
  ['Terminal','Terminal','Terminal','Terminal','Terminale','Terminal'],
  ['Shell local','Local shell','Shell local','Lokale Shell','Shell locale','Shell local'],
  ['SSH et clés','SSH and keys','SSH y claves','SSH und Schlüssel','SSH e chiavi','SSH e chaves'],
  ['Clé privée','Private key','Clave privada','Privater Schlüssel','Chiave privata','Chave privada'],
  ['Ouvrir une connexion','Open connection','Abrir conexión','Verbindung öffnen','Apri connessione','Abrir conexão'],
  ['Créer une connexion','Create connection','Crear conexión','Verbindung erstellen','Crea connessione','Criar conexão'],
  ['Déconnecter','Disconnect','Desconectar','Trennen','Disconnetti','Desconectar'],
  ['Hôte','Host','Host','Host','Host','Host'],
  ['Port','Port','Puerto','Port','Porta','Porta'],
  ['Copier','Copy','Copiar','Kopieren','Copia','Copiar'],
  ['Coller','Paste','Pegar','Einfügen','Incolla','Colar'],
  ['Effacer','Clear','Borrar','Löschen','Cancella','Limpar'],
  ['Rechercher dans le terminal','Search terminal','Buscar en el terminal','Terminal durchsuchen','Cerca nel terminale','Pesquisar no terminal'],
  ['Touches supplémentaires','Extra keys','Teclas adicionales','Zusatztasten','Tasti aggiuntivi','Teclas extras'],
  ['Afficher le test des couleurs','Show color test','Mostrar prueba de colores','Farbtest anzeigen','Mostra test colori','Mostrar teste de cores'],
  ['Paramètres du coffre','Vault settings','Ajustes de la bóveda','Tresoreinstellungen','Impostazioni cassaforte','Configurações do cofre'],
  ['Importer / Exporter','Import / Export','Importar / Exportar','Importieren / Exportieren','Importa / Esporta','Importar / Exportar'],
  ['Pas de données à afficher','No data to display','No hay datos que mostrar','Keine Daten zum Anzeigen','Nessun dato da visualizzare','Nenhum dado para exibir'],
  ['Chargement…','Loading…','Cargando…','Wird geladen…','Caricamento…','Carregando…'],
  ['Serveur injoignable','Server unreachable','Servidor inaccesible','Server nicht erreichbar','Server non raggiungibile','Servidor inacessível'],
  ['Aperçus','Previews','Vistas previas','Vorschauen','Anteprime','Pré-visualizações'],
  ['Mode tabletop / livre','Tabletop / book mode','Modo mesa / libro','Tisch-/Buchmodus','Modalità tabletop / libro','Modo mesa / livro'],
  // Extra Mythos screen strings
  ["Cliquer pour ajouter un titre","Click to add a title","Haz clic para añadir un título","Klicken, um einen Titel hinzuzufügen","Fai clic per aggiungere un titolo","Clique para adicionar um título"],
  ["Titre de la diapositive","Slide title","Título de diapositiva","Folientitel","Titolo diapositiva","Título do slide"],
  ["Cliquez pour ajouter du texte","Click to add text","Haz clic para añadir texto","Klicken, um Text hinzuzufügen","Fai clic per aggiungere testo","Clique para adicionar texto"],
  ["Colonne de gauche","Left column","Columna izquierda","Linke Spalte","Colonna sinistra","Coluna esquerda"],
  ["Colonne de droite","Right column","Columna derecha","Rechte Spalte","Colonna destra","Coluna direita"],
  ["Titre de section","Section heading","Título de sección","Abschnittsüberschrift","Titolo sezione","Título da seção"],
  ["Notes du présentateur…","Speaker notes…","Notas del presentador…","Sprechernotizen…","Note del relatore…","Notas do apresentador…"],
  ["Titre et contenu","Title and content","Título y contenido","Titel und Inhalt","Titolo e contenuto","Título e conteúdo"],
  ["Diapo de titre","Title slide","Diapositiva de título","Titelfolie","Diapositiva titolo","Slide de título"],
  ["Deux colonnes","Two columns","Dos columnas","Zwei Spalten","Due colonne","Duas colunas"],
  ["Dupliquer la diapositive","Duplicate slide","Duplicar diapositiva","Folie duplizieren","Duplica diapositiva","Duplicar slide"],
  ["Supprimer la diapositive","Delete slide","Eliminar diapositiva","Folie löschen","Elimina diapositiva","Excluir slide"],
  ["Zone de texte","Text box","Cuadro de texto","Textfeld","Casella di testo","Caixa de texto"],
  ["Arrière-plan de la diapositive","Slide background","Fondo de diapositiva","Folienhintergrund","Sfondo diapositiva","Plano de fundo do slide"],
  ["Présenter (F5)","Present (F5)","Presentar (F5)","Präsentieren (F5)","Presenta (F5)","Apresentar (F5)"],
  ["Exporter en .pptx (PowerPoint)","Export to .pptx (PowerPoint)","Exportar a .pptx (PowerPoint)","Als .pptx (PowerPoint) exportieren","Esporta in .pptx (PowerPoint)","Exportar para .pptx (PowerPoint)"],
  ["Format de page","Page format","Formato de página","Seitenformat","Formato pagina","Formato da página"],
  ["Largeur des colonnes","Column width","Ancho de columnas","Spaltenbreite","Larghezza colonne","Largura das colunas"],
  ["Hauteur des lignes","Row height","Altura de filas","Zeilenhöhe","Altezza righe","Altura das linhas"],
  ["Thème des nouvelles présentations","Theme for new presentations","Tema de nuevas presentaciones","Design neuer Präsentationen","Tema delle nuove presentazioni","Tema das novas apresentações"],
  ["Transition en mode présentation","Presentation transition","Transición de presentación","Präsentationsübergang","Transizione presentazione","Transição da apresentação"],
  ["Style de paragraphe","Paragraph style","Estilo de párrafo","Absatzstil","Stile paragrafo","Estilo do parágrafo"],
  ["Adresse (laisser vide pour retirer le lien)","Address (leave blank to remove link)","Dirección (deja vacío para quitar el enlace)","Adresse (leer lassen, um den Link zu entfernen)","Indirizzo (lascia vuoto per rimuovere il link)","Endereço (deixe em branco para remover o link)"],
  ["Annuler (Ctrl+Z)","Undo (Ctrl+Z)","Deshacer (Ctrl+Z)","Rückgängig (Strg+Z)","Annulla (Ctrl+Z)","Desfazer (Ctrl+Z)"],
  ["Rétablir (Ctrl+Y)","Redo (Ctrl+Y)","Rehacer (Ctrl+Y)","Wiederholen (Strg+Y)","Ripristina (Ctrl+Y)","Refazer (Ctrl+Y)"],
  ["Gras (Ctrl+B)","Bold (Ctrl+B)","Negrita (Ctrl+B)","Fett (Strg+B)","Grassetto (Ctrl+B)","Negrito (Ctrl+B)"],
  ["Italique (Ctrl+I)","Italic (Ctrl+I)","Cursiva (Ctrl+I)","Kursiv (Strg+I)","Corsivo (Ctrl+I)","Itálico (Ctrl+I)"],
  ["Souligné (Ctrl+U)","Underline (Ctrl+U)","Subrayado (Ctrl+U)","Unterstrichen (Strg+U)","Sottolineato (Ctrl+U)","Sublinhado (Ctrl+U)"],
  ["Barré","Strikethrough","Tachado","Durchgestrichen","Barrato","Riscado"],
  ["Effacer la mise en forme","Clear formatting","Borrar formato","Formatierung löschen","Cancella formattazione","Limpar formatação"],
  ["Aligner à gauche","Align left","Alinear a la izquierda","Linksbündig","Allinea a sinistra","Alinhar à esquerda"],
  ["Aligner à droite","Align right","Alinear a la derecha","Rechtsbündig","Allinea a destra","Alinhar à direita"],
  ["Liste à puces","Bulleted list","Lista con viñetas","Aufzählungsliste","Elenco puntato","Lista com marcadores"],
  ["Liste numérotée","Numbered list","Lista numerada","Nummerierte Liste","Elenco numerato","Lista numerada"],
  ["Insérer un tableau","Insert table","Insertar tabla","Tabelle einfügen","Inserisci tabella","Inserir tabela"],
  ["Insérer une image","Insert image","Insertar imagen","Bild einfügen","Inserisci immagine","Inserir imagem"],
  ["Saut de page","Page break","Salto de página","Seitenumbruch","Interruzione di pagina","Quebra de página"],
  ["Exporter en .docx (Word)","Export to .docx (Word)","Exportar a .docx (Word)","Als .docx (Word) exportieren","Esporta in .docx (Word)","Exportar para .docx (Word)"],
  ["Imprimer / PDF","Print / PDF","Imprimir / PDF","Drucken / PDF","Stampa / PDF","Imprimir / PDF"],
  ["Ligne en dessous","Row below","Fila debajo","Zeile darunter","Riga sotto","Linha abaixo"],
  ["Ligne +","Add row","Añadir fila","Zeile +","Aggiungi riga","Adicionar linha"],
  ["Supprimer la ligne","Delete row","Eliminar fila","Zeile löschen","Elimina riga","Excluir linha"],
  ["Ligne −","Remove row","Quitar fila","Zeile −","Rimuovi riga","Remover linha"],
  ["Colonne à droite","Column to the right","Columna a la derecha","Spalte rechts","Colonna a destra","Coluna à direita"],
  ["Colonne +","Add column","Añadir columna","Spalte +","Aggiungi colonna","Adicionar coluna"],
  ["Supprimer la colonne","Delete column","Eliminar columna","Spalte löschen","Elimina colonna","Excluir coluna"],
  ["Colonne −","Remove column","Quitar columna","Spalte −","Rimuovi colonna","Remover coluna"],
  ["Fusionner / séparer les cellules","Merge / split cells","Combinar / separar celdas","Zellen verbinden / teilen","Unisci / separa celle","Mesclar / dividir células"],
  ["Supprimer le tableau","Delete table","Eliminar tabla","Tabelle löschen","Elimina tabella","Excluir tabela"],
  ["Insérer une fonction","Insert function","Insertar función","Funktion einfügen","Inserisci funzione","Inserir função"],
  ["Format des nombres","Number format","Formato numérico","Zahlenformat","Formato numeri","Formato numérico"],
  ["Valeur ou formule (ex. =SOMME(A1:A10))","Value or formula (e.g. =SUM(A1:A10))","Valor o fórmula (p. ej. =SUMA(A1:A10))","Wert oder Formel (z. B. =SUMME(A1:A10))","Valore o formula (es. =SOMMA(A1:A10))","Valor ou fórmula (ex.: =SOMA(A1:A10))"],
  ["Insérer une ligne au-dessus","Insert row above","Insertar fila arriba","Zeile darüber einfügen","Inserisci riga sopra","Inserir linha acima"],
  ["Insérer une colonne à gauche","Insert column left","Insertar columna a la izquierda","Spalte links einfügen","Inserisci colonna a sinistra","Inserir coluna à esquerda"],
  ["Trier de A à Z","Sort A to Z","Ordenar de A a Z","Von A bis Z sortieren","Ordina da A a Z","Ordenar de A a Z"],
  ["Trier de Z à A","Sort Z to A","Ordenar de Z a A","Von Z bis A sortieren","Ordina da Z a A","Ordenar de Z a A"],
  ["Somme automatique","Auto sum","Suma automática","Automatische Summe","Somma automatica","Soma automática"],
  ["Exporter la feuille en .csv","Export sheet to .csv","Exportar hoja a .csv","Tabelle als .csv exportieren","Esporta foglio in .csv","Exportar planilha para .csv"],
  ["Nouvelle feuille","New sheet","Nueva hoja","Neues Tabellenblatt","Nuovo foglio","Nova planilha"],
  ["Options de la feuille","Sheet options","Opciones de hoja","Tabellenblattoptionen","Opzioni foglio","Opções da planilha"],
  ["Renommer la feuille","Rename sheet","Cambiar nombre de hoja","Tabellenblatt umbenennen","Rinomina foglio","Renomear planilha"],
  ["Déplacer à gauche","Move left","Mover a la izquierda","Nach links verschieben","Sposta a sinistra","Mover para a esquerda"],
  ["Un classeur doit contenir au moins une feuille","A spreadsheet must contain at least one sheet","Una hoja de cálculo debe contener al menos una hoja","Eine Tabelle muss mindestens ein Tabellenblatt enthalten","Un foglio di calcolo deve contenere almeno un foglio","Uma planilha deve conter pelo menos uma aba"],
  ["Tout","All","Todo","Alle","Tutto","Tudo"],
  ["Classeurs","Spreadsheets","Hojas de cálculo","Tabellen","Fogli di calcolo","Planilhas"],
  ["Présentations","Presentations","Presentaciones","Präsentationen","Presentazioni","Apresentações"],
  ["Créer un dossier","Create folder","Crear carpeta","Ordner erstellen","Crea cartella","Criar pasta"],
  ["Renommer","Rename","Cambiar nombre","Umbenennen","Rinomina","Renomear"],
  ["Dupliquer","Duplicate","Duplicar","Duplizieren","Duplica","Duplicar"],
  ["Supprimer","Delete","Eliminar","Löschen","Elimina","Excluir"],
  ["Impossible d’importer ce fichier","Unable to import this file","No se puede importar este archivo","Diese Datei kann nicht importiert werden","Impossibile importare questo file","Não foi possível importar este arquivo"],
  ["Format non pris en charge","Unsupported format","Formato no compatible","Nicht unterstütztes Format","Formato non supportato","Formato não compatível"],
  ["Aucun résultat.","No results.","Sin resultados.","Keine Ergebnisse.","Nessun risultato.","Nenhum resultado."],
  ["Aucun fichier pour l'instant.","No files yet.","Todavía no hay archivos.","Noch keine Dateien.","Nessun file per ora.","Nenhum arquivo por enquanto."],
  ["Écrivez, calculez et présentez.","Write, calculate, and present.","Escribe, calcula y presenta.","Schreiben, rechnen und präsentieren.","Scrivi, calcola e presenta.","Escreva, calcule e apresente."],
  ["Tout reste sur vos appareils et se synchronise sans serveur.","Everything stays on your devices and syncs without a server.","Todo permanece en tus dispositivos y se sincroniza sin servidor.","Alles bleibt auf deinen Geräten und synchronisiert sich ohne Server.","Tutto resta sui tuoi dispositivi e si sincronizza senza server.","Tudo fica nos seus dispositivos e sincroniza sem servidor."],
  ["Bonjour","Good morning","Buenos días","Guten Morgen","Buongiorno","Bom dia"],
  ["Bon après-midi","Good afternoon","Buenas tardes","Guten Tag","Buon pomeriggio","Boa tarde"],
  ["Bonsoir","Good evening","Buenas tardes","Guten Abend","Buonasera","Boa noite"],
  ["Bonne nuit","Good night","Buenas noches","Gute Nacht","Buona notte","Boa noite"],
  ["Tout effacer","Clear all","Borrar todo","Alles löschen","Cancella tutto","Apagar tudo"],
];

const DICT = new Map([...ROWS, ...APP_ROWS].map((row) => [row[0], Object.fromEntries(LOCALES.map((l, i) => [l.code, i === 0 ? row[0] : (row[i] || row[0])]))]));
const ORDERED = ROWS.slice().sort((a, b) => b[0].length - a[0].length);
const TEXT_STATE = new WeakMap();
const ATTR_STATE = new WeakMap();
let initialized = false;
let locale = 'fr';
let observer = null;
let exclusions = [];
let sourceToLocalized = null;

function escapeRegExp(value) {
  return value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
}

function excluded(element) {
  if (!element || element.nodeType !== 1) return false;
  const selectors = ['script','style','noscript','textarea','input','code','pre','[contenteditable="true"]','[data-no-translate]','.xterm','.xterm-screen','.xterm-rows','.terminal-output','.command-output','.doc-page','.sheet-cell','.sheet-grid','.slides-canvas','.slide-content','.ProseMirror','.tiptap','.editor-content','.credential-name','.secret-value','.passphrase','.item-title','.item-subtitle','.vault-name','.doc-title','.mission-name','.mission-title','.entry-note','.user-text','.song-title','.artist-name','.album-title','.playlist-name','.track-title'].concat(exclusions);
  try { return !!element.closest(selectors.join(',')); } catch { return false; }
}

function capitalizeLike(source, target) {
  if (!source || !target) return target;
  const first = source.charAt(0);
  if (first && first === first.toLowerCase() && first !== first.toUpperCase()) return target.charAt(0).toLowerCase() + target.slice(1);
  return target;
}

function translateText(source, targetLocale) {
  const value = String(source || '');
  if (targetLocale === 'fr' || !value.trim()) return value;
  const leading = (value.match(/^\s*/) || [''])[0];
  const trailing = (value.match(/\s*$/) || [''])[0];
  const trimmed = value.slice(leading.length, value.length - trailing.length);
  const exact = DICT.get(trimmed);
  if (exact) return leading + (exact[targetLocale] || trimmed) + trailing;

  let output = trimmed;
  for (const row of ORDERED) {
    const key = row[0];
    const target = DICT.get(key)?.[targetLocale];
    if (!target || target === key || !output) continue;
    const regex = new RegExp('(^|[^\\p{L}\\p{N}])(' + escapeRegExp(key) + ')(?=$|[^\\p{L}\\p{N}])', 'giu');
    output = output.replace(regex, (_whole, prefix, found) => prefix + capitalizeLike(found, target));
  }
  return leading + output + trailing;
}

function translateTextNode(node) {
  if (!node || !node.parentElement || excluded(node.parentElement)) return;
  const current = node.nodeValue || '';
  let state = TEXT_STATE.get(node);
  if (!state || current !== state.output) {
    state = { source: current, output: current };
    TEXT_STATE.set(node, state);
  }
  const next = translateText(state.source, locale);
  if (next !== current) {
    state.output = next;
    TEXT_STATE.set(node, state);
    node.nodeValue = next;
  } else {
    state.output = current;
    TEXT_STATE.set(node, state);
  }
}

function translateAttributes(element) {
  if (!element || element.nodeType !== 1) return;
  const attributeExclusions = ['script','style','noscript','code','pre','[contenteditable="true"]','[data-no-translate]','.xterm','.xterm-screen','.xterm-rows','.terminal-output','.command-output','.doc-page','.sheet-cell','.sheet-grid','.slides-canvas','.ProseMirror','.tiptap','.editor-content'].concat(exclusions);
  try { if (element.closest(attributeExclusions.join(','))) return; } catch { return; }
  const attrs = ['title', 'placeholder', 'aria-label'];
  let state = ATTR_STATE.get(element);
  if (!state) { state = new Map(); ATTR_STATE.set(element, state); }
  for (const attr of attrs) {
    const current = element.getAttribute(attr);
    if (current === null) continue;
    let item = state.get(attr);
    if (!item || current !== item.output) item = { source: current, output: current };
    const next = translateText(item.source, locale);
    if (next !== current) {
      item.output = next;
      element.setAttribute(attr, next);
    } else item.output = current;
    state.set(attr, item);
  }
}

function translateTree(root) {
  if (!root) return;
  if (root.nodeType === 3) { translateTextNode(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  if (root.nodeType === 1) {
    const formControl = root.matches('input,textarea');
    if (excluded(root) && !formControl) return;
    if (!excluded(root) || formControl) translateAttributes(root);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) translateTextNode(node);
  if (root.querySelectorAll) {
    for (const element of root.querySelectorAll('*')) {
      const formControl = element.matches('input,textarea');
      if (!excluded(element) || formControl) translateAttributes(element);
    }
  }
}

function applyLocale(nextLocale) {
  locale = LOCALES.some((l) => l.code === nextLocale) ? nextLocale : 'fr';
  document.documentElement.lang = locale;
  const select = document.querySelector('#apk-fold-language-picker select');
  if (select) select.value = locale;
  translateTree(document.body);
}

function addPicker(appId) {
  const wrapper = document.createElement('label');
  wrapper.id = 'apk-fold-language-picker';
  wrapper.setAttribute('data-no-translate', '');
  wrapper.setAttribute('aria-label', 'Interface language');
  const icon = document.createElement('span');
  icon.textContent = '🌐';
  icon.setAttribute('aria-hidden', 'true');
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Langue de l’interface');
  for (const item of LOCALES) {
    const option = document.createElement('option');
    option.value = item.code;
    option.textContent = item.label;
    select.appendChild(option);
  }
  wrapper.append(icon, select);
  document.body.appendChild(wrapper);

  const style = document.createElement('style');
  style.id = 'apk-fold-language-picker-style';
  style.textContent = '#apk-fold-language-picker{position:fixed;left:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 92px);z-index:2147483000;display:grid;place-items:center;width:36px;height:36px;box-sizing:border-box;color:#f8f7ff;background:rgba(22,18,32,.94);border:1px solid rgba(255,255,255,.2);border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.24);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font:12px/1.25 system-ui,-apple-system,sans-serif}#apk-fold-language-picker span{font-size:18px;pointer-events:none}#apk-fold-language-picker select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0}#apk-fold-language-picker option{color:#17131e;background:#fff}@media(min-width:800px){#apk-fold-language-picker{left:16px;bottom:16px}}@media(max-width:360px){#apk-fold-language-picker{left:6px;bottom:calc(env(safe-area-inset-bottom,0px) + 82px)}}';
  document.head.appendChild(style);
  select.addEventListener('change', () => {
    try { localStorage.setItem('apk-fold.language.' + appId, select.value); } catch {}
    applyLocale(select.value);
  });
}

export function initI18n(options = {}) {
  if (initialized || !document.body) return;
  initialized = true;
  exclusions = Array.isArray(options.exclude) ? options.exclude : [];
  const appId = String(options.app || 'app').replace(/[^a-z0-9_-]/gi, '-');
  let saved = '';
  try { saved = localStorage.getItem('apk-fold.language.' + appId) || ''; } catch {}
  const browserLanguage = String((navigator.languages && navigator.languages[0]) || navigator.language || 'fr').slice(0, 2).toLowerCase();
  locale = LOCALES.some((l) => l.code === saved) ? saved : (LOCALES.some((l) => l.code === browserLanguage) ? browserLanguage : 'fr');
  addPicker(appId);
  applyLocale(locale);
  observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateTextNode(record.target);
      else if (record.type === 'childList') record.addedNodes.forEach(translateTree);
      else if (record.type === 'attributes') translateAttributes(record.target);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
}
