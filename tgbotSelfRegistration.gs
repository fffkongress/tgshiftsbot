// Shift bot, linked with google sheet
var token = "6261822958:AAE51zydr8zOeCT5O0bQBqKFJ3YYaui9ME8";
var webAppUrl = "https://script.google.com/macros/s/AKfycbzBcrvgnuIOmfkXFZ1Wl3uoNQYdz2HKlb8r2M7FSCEIPFswGj1YTODpMxVvP_tzWw3FJg/exec";
var ssId = "1nau2O5iseDYAMGMdX1iLzKvFwSbU2w6BvBWcfsm6vMI"; //spreadsheet id
var canAbort = false; //parallal change bot command description
var shiftsLimited = true; // whether there is a limit of maximum shifts per tgtag
var shiftsLimit = 4; // max amount of shifts per User
var outputGroup = -8.99303125E8;
var logGroup = -8.5373169E8;
var reglemented = false; //avoid more api calls but have no stylish info messages
var boarder = 10800000; //time in ms that reminder is send
var nightboarder = 36360000; //longer reminder time over night


//optimize ideas:
//use pivot table for outgoing reminders

function setWebhook() {
  var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/setWebhook?url=" + webAppUrl);
  Logger.log(response.getContentText());
}

function sendMessage(id, text) {
  var data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(id),
      text: text,
      parse_mode: "HTML",

    }
  };
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}




function doPost(e) {
  var contents = JSON.parse(e.postData.contents);
  var id = contents.message.chat.id;
  var username = contents.message.from.username;
  sendMessage(logGroup, username + "\n" + id + "\n\n" + contents.message.text); // makes log channel
  // id debug
  if (contents.message.text == "/id"){
    sendMessage(id,id);
    return;
  }
  //send start Message
  if (contents.message.text == "/start") {
    sendMessage(id,"Hallo,du findest derzeit offene Schichten unter https://fffutu.re/offeneSchichten . Die Tabelle wird alle 5 min aktualisiert.\n\nBitte schicke /c und dann die ID zum übernehmen der Schicht. \nDie ID findest du hinter der Schicht die du übernehmen willst.\nDie Backupschichten sind zwar länger, allerdings hast du dann Bereitschaft für Dinge die spontan auffallen. Du musst also nur erreichbar sein.\nDie Anleitung was du bei den Schichten machen musst findest du kurz vor Beginn unter https://fffutu.re/1AMfVX .\n Jede*r Teilnehmer*in sollte zwei Schichten übernehmen vor dem Checkin, mit der Awarenesskoordination abgesprochene Awarenessschichten werden angerechnet. ");
    return;
  }
  //claim shifts
  if (contents.message.text.startsWith("/c")) {
    // tests if user is valid:
    var users = SpreadsheetApp.openById(ssId).getSheetByName("Teilnehmende").getDataRange().getValues();
    var userrow = users.findIndex(row => row[2] == username);
    if (userrow == -1){
      sendMessage(id,"Dein Telegram-Account ist uns nicht bekannt, bitte sende uns deine Ticketnummer zu");
      return;
    }
    if (shiftsLimited){
      if (users[userrow][5] >= shiftsLimit) {
        sendMessage(id,"Du kannst momentan nur " + shiftsLimit + " Schichten übernehmen, wir sagen Bescheid, falls sich das ändert.");
        return;
      }
    }
    var sheet = SpreadsheetApp.openById(ssId).getSheetByName("shifts");
    var shiftId = Number(contents.message.text.slice(2));

    var lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000); // wait 30 seconds for others' use of the code section and lock to stop and then proceed
    } catch (e) {
        Logger.log('Could not obtain lock after 30 seconds.');
        return sendMessage(id,"Der Bot ist gerade ausgelastet. Bitte versuche es später noch einmal.");
    }  // note:  if return is run in the catch block above the following will not run as the function will be exited
    var shifts = sheet.getDataRange().getValues();
    var rowId = shifts.findIndex(row => row[0] === shiftId);
    if (rowId == -1){
      sendMessage(id,"Diese Schicht existiert nicht. Verwende /c und dann deine  ID zum übernehmen einer Schicht.");
      lock.releaseLock();
      return;
    }
    if (shifts[rowId][4] == ""){
      //TODO combine to 2 api calls.
      sheet.getRange(rowId +1,5).setValue(username);
      sheet.getRange(rowId +1,6).setValue(id);
      if(reglemented){
        sendMessage(id, "Schicht wurde übernommen!")
      }else{
        var shiftTime = sheet.getRange(rowId +1,3).getDisplayValues();
        var shiftTopic = shifts[rowId][1];
        var shiftDuration = shifts[rowId][3];
        sendMessage(id, "Schicht wurde übernommen!\nSchicht ID: " + shiftId + "\n"+ shiftTime + "\n" + shiftTopic + "\nDauer: " + shiftDuration + " min.");
      }
    }
    else{
      sendMessage(id,"Die Schicht "+ shiftId +" ist bereits vergeben. Bitte wähle eine andere Schicht.");
    }
    SpreadsheetApp.flush(); // applies all pending spreadsheet changes
    lock.releaseLock();
    return;
  }
  // abort shifts
  if (contents.message.text.startsWith("/a")) {
    if (canAbort){
      var sheet = SpreadsheetApp.openById(ssId).getSheetByName("shifts");
      var shiftId = Number(contents.message.text.slice(2));
      var shifts = sheet.getDataRange().getValues()
      var rowId = shifts.findIndex(row => row[0] === shiftId);
      if (rowId == -1){
        sendMessage(id,"Diese Schicht existiert nicht. Verwende /a ID zum absagen einer Schicht.");
        return;
      }
      if (shifts[rowId][4] == username){
        sheet.getRange(rowId +1,5).clearContent(); //Todo: could optimize but is not so relevant
        sheet.getRange(rowId +1,6).clearContent();
        if(reglemented){
          sendMessage(id, "Die Schicht wurde abgesagt! Bitte übenehme stattdessen eine andere Schicht.");
        }else{
          var shiftTime = sheet.getRange(rowId +1,3).getDisplayValues();
          var shiftTopic = shifts[rowId][1];
          var shiftDuration = shifts[rowId][3];
          sendMessage(id, "Die Schicht wurde abgesagt! \nSchicht ID: " + shiftId + "\n"+ shiftTime + "\n" + shiftTopic + "\nDauer: " + shiftDuration + " min.\n Bitte übenehme stattdessen eine andere Schicht.");
        }
      }
      else{
        sendMessage(id,"Schicht "+ shiftId +" hast du nicht übernommen. Bitte wähle eine andere Schicht.");
      }
      SpreadsheetApp.flush(); // applies all pending spreadsheet changes
      return;
    }
    else{
      sendMessage(id, "Schichten können nicht selbstständig abgesagt werden. Schreibe bitte eine Nachricht an diesen Bot, warum du deine Schicht absagen willst und nochmals die ID, dann prüfen wir das manuell. Ggf. kannst du deine Schicht dann trotzdem absagen.");
    }
    return;
  }

  // send Messages from orga to Users
  if (contents.message.text.startsWith("/m")){
    if (id == outputGroup){
      var message = contents.message.text.slice(3).split(";");
      sendMessage(message[0],message[1]);
      sendMessage(id,"Nachricht versucht zu senden");
    }
    else{
      sendMessage(id,"Du hast nicht die nötige Berechtigung für diesen Befehl.")
    }
    return;
  }
  // test if it is a ticket number
  // possible that a tg account uses two ticket numbers?
  var sheet = SpreadsheetApp.openById(ssId).getSheetByName("Teilnehmende");
  var users = sheet.getDataRange().getValues();
  var rowId = users.findIndex(row => row[1] == contents.message.text);
  if (rowId == -1){
        // forward other messages to group
  sendMessage(outputGroup,username + "\n" + id + "\n\n" + contents.message.text);
  sendMessage(id,"Deine Nachricht wurde an die Orga weitergegeben. Wir melden uns bei dir.");
        return;
      }
    // set tgaccoutn to ticketid
 // test if is not already claimed and tg name has no other ticket assigned
 if((users[rowId][2] === "") && (users.findIndex(row => row[2] == username) == -1 )){
  sheet.getRange(rowId +1,3).setValue(username);
  SpreadsheetApp.flush();
  sendMessage(id,"Der Telegramaccount wurde mit deinem Ticket verbunden. Versuche bitte erneut eine Schicht zu übernehmen.");
  return;
 }
  sendMessage(id,"Diese Ticketnummer ist schon an einen anderen Account gekoppelt oder dein Account an ein anderes Ticket. Bitte melde dich bei Jonas.");

  
}

function doGet(e){ // sends reminder
  var sheet = SpreadsheetApp.openById(ssId).getSheetByName("shifts");
  var shifts = sheet.getDataRange().getValues();
  for (lineid in shifts){
    var shift = shifts[lineid];
    if (shift[4] != "" && shift[6] == ""){
      if (Math.floor(new Date(shift[2]) - new Date()) <= boarder){ // reminds between 3 hours and 3 hours - trigger time
        try {
            sendMessage(shift[5],"Reminder: deine Schicht " + shift[1] + " beginnt bald: " + sheet.getRange(Number(lineid) + 1,3).getDisplayValues() + " Uhr.");
        }
        catch{
          console.warn("couldnt send reminder");
        }
        sheet.getRange(Number(lineid) + 1, 7).setValue("x");
      }
    } 
  }
}


// reminds at 22:30 for the next 10.1 h --> to ca 8:30
function remindNight(e){ // sends reminder
  var sheet = SpreadsheetApp.openById(ssId).getSheetByName("shifts");
  var shifts = sheet.getDataRange().getValues();
  for (lineid in shifts){
    var shift = shifts[lineid];
    if (shift[4] != "" && shift[6] == ""){
      if (Math.floor(new Date(shift[2]) - new Date()) <= nightboarder){
        try {
            sendMessage(shift[5],"Reminder: deine Schicht " + shift[1] + " beginnt bald: " + sheet.getRange(Number(lineid) + 1,3).getDisplayValues() + " Uhr.");
        }
        catch{
          console.warn("couldnt send reminder");
        }
        sheet.getRange(Number(lineid) + 1, 7).setValue("x");
      }
    } 
  }
}
