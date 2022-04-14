# TGshiftsbot

## Deployment
### Code
Der Telegrambot wird als google Script gehostet (https://script.google.com/), und erfordert den Dienst "shifts". Die AUsführung erfolgt als "ICh, mit zugriffsberechtigter "Jeder"
### TG bot
AUf Telegram t.me/BotFather einen TElegrambot erstellen, das Token im Script einfügen, sowie die Script-URL als "WEbAppUrl" einfügen, anschließend einmalig die Funktion setWebHook aufrufen.
### Logs
Den Bot in eine Telegeram Gruppe hinzufügen, mit /id die Chatid herausfinden und als LogGroup im SCript einsetzen. In diese Gruppe werden alle Nachrichten die an den Bot gehen weitergeschickt

Den Bot in eine Telegramgruppe hinzufügen, mit /id die Chatid herausfinden und als OutputGroup im Script einsetzen. In diese Gruppe werden alle nicht als Befehl erkannten sonstigen Anfragen geschickt, und sie hat die berechtigung mit /m ID;text nachrichten über den Bot zu versenden.

### Google Docs

Der Bot greift auf ein google spreadsheet zu, ein Muster für den AUfbau dazu ist im Repo vorhanden. Die Spreasheet ID (siehe URL) sollte als ssID eingetragen werden



## Betrieb
Die Hauptdaten liegen in den Tabellen shifts und Teilnehmende. ID, Typ, Zeit sowie Dauer benötigt, der Rest wird durch den Bot ausgefüllt. Die ID muss einmalig sein. Die reihenfolge der Schichten ist egal. In "offene SChichten" werden alle Schichten angezeigt, die nicht vergeben sind, automatisch nach der Zeit sortiert. Dieses Sheet kann public geshared werden.

Um die Schichten mit den Teinehmenden zu verbinden, wird im Tabellenblatt "Teilnehmende" der Name, die TicketID sowie der TG Tag hinterlegt. Hieraus wird auch die Schichtenanzahl rausgelesen, auch sonderschichten sind möglich, welche praktiziert aber nicht über das system vergeben wurden. Der Ignore-Flag (z.b. für Orgamenschen) sorgt dafür, dass diese sich trotzdem einchecken dürfen, und bei Helfendenmangel nicht kontaktiert werden. 
Der Telegramtag muss ohne anführendes @ eingegeben werden. FAlls der TGTag nicht bekannt ist erfolgt eine nachricht, dass der richtige TGTAg sowie die TicketID eingegeben werden muss, diese wird dann in den Interaktionskanal geleitet.

Hieraus leitet sich das Tabellenblatt Checkin ab, welche alle Teilnehmenden anzeigt die noch nicht die im Ersten Sheet definierte Mindestanzahl übernommen haben und das Ignoreflag Feld leer ist. Diese werden zur überprüfung mit ticketnummer dem Checkin zur verfügung gestellt. Es empfiehlt sich das sheet über =IMPORTRANGE in eine neue tabelle zu importieren und diese zu teilen, um zu verhindern dass mehr daten als nötig für den Checkin sichtbar sind.
Die "Wer wieviel" Tabelle ist eine Hilfstabelle, die alle Teilnehmenden mit ihrer Anzahl an Schichten anzeigt.Sie kann bei mangel dazu verwendet werden die Teilnehmenden zu finden, welche am ehesten eine weitere Schicht übernehmen sollten.

Der bot unterstützt grundsätzlich die commands /c ID zum übernehmen und /a ID zum Absagen (falls aktiviert). mit /m ID;nachricht kann von einem chat/gruppe aus nachrichten über den Bot an user versand werden.
### Einstellungen
- CanAbort definiert ob schichten selbstständig mit /a abgesagt werden können, es wird empfohlen dies nur im vorhinein zuzulassen und bei der veranstaltung selber zu deaktivieren, und mögliche Absagen von Hand vorzunehmen.

- ShiftsLimited definiert ob es eine Obere Grenze der Schichtmenge pro Teilnehmer*in gibt, sorgt dafür dass nicht zu viele Schichten pro Teilnehmer*in gemacht werden können.
- shiftsLimit definiert die obere Schichtgrenze
- reglemented definiert ob API calls gespart werden sollen, allerdings dafür die angepassten Nachrichten nicht mehr gesendet werden, sondern vereinfachte. Wird nur empfohlen wenn die API-Reglementierung greift
- eventover sendet nur noch eine Dankesnachricht, empfohle kurz nach dem Event zu aktivieren
- boarder definiert die Zeit in ms in denen eine zukünftige Schicht beginnt, damit ein Reminder rausgeht. 
-nightboarder siehe boarder, allerdigs längere Zeit für nachts empfohlen.

### Reminder
Um erinnerungen vor dem Beginn der jeweiligen Schicht zu versenden, müssen Trigger im google Script eingestellt werden.
Der normale Trigger auf doGet erfolgt halbstündlich, der Trigger auf remindNight zwischen 22 und 23 sowie zwischen 23 und 0 Uhr.

Die reminder werden in die Chats anhan der tehnischen ID / ShiftID verteilt. Manuelle übernahmen (Daher ohne tg-account einfach nur ins namensfeld eintragen)

## Bekannte Probleme
- Interaktionsgruppe über antwortfunktion --> erfordert vermutlich Datenbank
- Telegram Tags sind Case sensitive
- Die API von Sheets limitiert die Anzahl der API calls, es sind etwa 20 Schichten pro Minute übernehmbar
