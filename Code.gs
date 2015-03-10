/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('Java Syntax Check');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * @return {Array.<string>} The selected text.
 */
function getSelectedText() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var text = [];
    var elements = selection.getSelectedElements();
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();

        text.push(element.getText().substring(startIndex, endIndex + 1));
      } else {
        var element = elements[i].getElement();
        // Only translate elements that can be edited as text; skip images and
        // other non-text elements.
        if (element.editAsText) {
          var elementText = element.asText().getText();
          // This check is necessary to exclude images, which return a blank
          // text element.
          if (elementText != '') {
            text.push(elementText);
          }
        }
      }
    }
    if (text.length == 0) {
      throw 'Please select some text.';
    }
    return text;
  } else {
    throw 'Please select some text.';
  }
}

/**
 * Gets the stored user preferences for the origin and destination languages,
 * if they exist.
 *
 * @return {Object} The user's origin and destination language preferences, if
 *     they exist.
 */
function getPreferences() {
  var userProperties = PropertiesService.getUserProperties();
  var languagePrefs = {
    originLang: userProperties.getProperty('originLang'),
    destLang: userProperties.getProperty('destLang')
  };
  return languagePrefs;
}






function getFilterTexts(origin, dest){
  var obj = {};
  var paras = DocumentApp.getActiveDocument().getBody().getParagraphs();
  
  Logger.log("domain filter1 "+origin+" "+dest);
  
  if(origin == null || origin < 1)
    origin = 1;
  if(dest == null || dest > paras.length)
    dest = paras.length;

  if(origin >= dest){
    // default situation to this error
    origin = 1;
    dest = paras.length;
  }
  
  Logger.log("domain filter2 "+origin+" "+dest);
    
  //obj.originStr = paras[origin].getText();
  //obj.destStr = paras[dest].getText();
  
  for (i=origin-1; i<paras.length; ++i) {
    if(i == origin-1){
      
      
       // obj.originStr = paras[i].getText() + "\n" + paras[i+1].getText() + "\n" + paras[i+2].getText() + "\n" + paras[i+3].getText();
       var pos = i;
      var ctr = 0;
      obj.originStr = "";
      do {
        obj.originStr += paras[pos].getText() + "\n";
        ctr++;
        pos++;
      } while(pos < paras.length && ctr < 5);
      
      // obj.originStr = paras[i].getText();
      obj.originNum = i+1;
    }
    if(i == dest-1){
      // obj.destStr = paras[i].getText();
      
      var pos = i;
      var ctr = 0;
      obj.destStr = "";
      do {
        obj.destStr = paras[pos].getText() + "\n" + obj.destStr;
        ctr++;
        pos--;
      } while(pos >= 0 && ctr < 5);
      
      // obj.destStr = paras[i-2].getText() + "\n" + paras[i-1].getText() + "\n" + paras[i].getText();
      obj.destNum = i+1;
    }
  }
  //Logger.log(paras[origin].getText());
  //Logger.log(paras[dest].getText());
  
  
  
  
  return obj;
}



function getCursorParagraph(){
  var pos = -1;
  Logger.log("yohoo1");
  var cursor = DocumentApp.getActiveDocument().getCursor();
  if(cursor){
    Logger.log("yohoo2");
   var element = cursor.getElement(); 
    Logger.log("yohoo3");
    var parent = element.getParent();
    Logger.log("yohoo4");
    var paragraph = parent.asParagraph();
    Logger.log("yohoo5");
    var att = paragraph.getAttributes();// optional
    Logger.log("yohoo6");
    Logger.log(att); // just out of curiosity... if you want to see
    Logger.log(paragraph.getText());
  }
  Logger.log("yohoo7");
 return pos; 
}



function isAsciiOnly(str) {
  /*var ascii = /^[ -~]+$/;
  return (!ascii.test(str));*/
  
  for (var i = 0; i < str.length; i++)
        if (str.charCodeAt(i) > 127)
            return false;
    return true;
}


function replaceBadAsciiChars(s){
  var aux = s;
  // smart single quotes and apostrophe
  aux = aux.replace(/[\u2018\u2019\u201A]/g, "\'");
  // smart double quotes
  aux = aux.replace(/[\u201C\u201D\u201E]/g, "\"");
  // ellipsis
  aux = aux.replace(/\u2026/g, "...");
  // dashes
  aux = aux.replace(/[\u2013\u2014]/g, "-");
  
  return aux;
  
  
  /*for(var i=0; i<str.length; i++){
    if(str.charCodeAt(i) == 8220 || str.charCodeAt(i) == 8221){
      
    }
  }*/
}


function hasBeginClass(txt){
   return (txt.indexOf("class ") >= 0);
}
function hasEndClass(txt){
   return (txt.indexOf("end class") >= 0);
}


function testStartingClass(txt, currentlyInClass){
  if(!currentlyInClass && hasBeginClass(txt))
    return true;
  
  return currentlyInClass;
}

function testEndingClass(txt, currentlyInClass){
  
  if(currentlyInClass && hasEndClass(txt))
    return false;
  
  return currentlyInClass;
}



function runJavaTranslation(origin, dest) {
  Logger.log("lets translate!!");
  
  
  var translated = [];
  var translatedStr = "";
  var supportingClasses = "";
  var importStr = "";
  
  origin--;
  
  
  var paras = DocumentApp.getActiveDocument().getBody().getParagraphs();
  
  //Logger.log("Num of paras: "+paras.length);
  if(origin == null || origin < 0)
    origin = 0;
  if(dest == null || dest > paras.length)
    dest = paras.length;
  
  //Logger.log("domain "+origin+" "+dest);
  
  var foundMain = false;
  var currentlyInClass = false;

  
  for (i=origin; i<dest; ++i) {
    var txt = paras[i].getText();
    if( !isAsciiOnly(txt) ){
      Logger.log("found nonascii");
      txt = replaceBadAsciiChars( txt );
    }
      //Logger.log( paras[i].getText() );
    translated.push(txt);
    
    if( (txt).indexOf("main(") >= 0)
      foundMain = true;
    
    
    currentlyInClass = testStartingClass(txt, currentlyInClass);
    
    if( currentlyInClass )
      supportingClasses += (txt).replace('\t',' ') + "\n";
    else if( txt.indexOf("import ") >= 0 && txt.indexOf("import ") < 6 )
      importStr += (txt).replace('\t',' ') + "\n";
    else
      translatedStr += (txt).replace('\t',' ') + "\n";
    
    currentlyInClass = testEndingClass(txt, currentlyInClass);
  }
  
  if(!foundMain){
    translatedStr += "public static void main(String[] args){}";
  }
  
  //Logger.log("translatedStr");
  //Logger.log(translatedStr);
   //var text = getSelectedText();
  
  
  //for (var i = 0; i < text.length; i++) {
   // // Logger.log(LanguageApp.translate(text[i], origin, dest));
   // // translated.push(LanguageApp.translate(text[i], origin, dest));
    //translated.push(text[i]);
  //}
 // translated.push("querias facilidades nao era??");
  
  
  
  
  var url = "http://rextester.com/rundotnet/api";
  
  var data = {};
  data.LanguageChoiceWrapper = 4;
  data.Program = "class AA { System.out.println('go'); }";
  data.Program = importStr+supportingClasses+"class Rextester { "+translatedStr+" }";
  
  Logger.log("data.Program");
  Logger.log(data.Program);
  
  
   //var data = '{"LanguageChoiceWrapper": 4,"Program": "class RR { int i = 0; }" }';
  
  Logger.log("code to translate");
  Logger.log( JSON.stringify(data));
  
  var options =
      {
        "method"  : "POST",
        "payload" : JSON.stringify(data),   
        "contentType": "application/json",
      };
  
  var result = UrlFetchApp.fetch(url, options);
  
  //for(i in result) {
   //Logger.log(i + ": " + result[i]);
 //}
  
  Logger.log(result.getContentText());
  
  if (result.getResponseCode() == 200) {
    
    Logger.log("YAYAYYAYAYA");
    
    var params = JSON.parse(result.getContentText());
    
    Logger.log("YAYAYYAYAYA 2");
    
    var keys = Object.keys(params);
    Logger.log("keys lenght: "+keys.length);
    
    Logger.log("PARAMS ERROR: "+params.Error);
    
    if(params[keys[1]] != null)
      return params[keys[1]];
    else
      return "no errors";
  }
  
  
  
  
  //return translated.join('\n');
}

/**
 * Gets the user-selected text and translates it from the origin language to the
 * destination language. The languages are notated by their two-letter short
 * form. For example, English is 'en', and Spanish is 'es'. The origin language
 * may be specified as an empty string to indicate that Google Translate should
 * auto-detect the language.
 *
 * @param {string} origin The two-letter short form for the origin language.
 * @param {string} dest The two-letter short form for the destination language.
 * @param {boolean} savePrefs Whether to save the origin and destination
 *     language preferences.
 * @return {string} The result of the translation.
 */
function runTranslation(origin, dest, savePrefs) {
  var text = getSelectedText();
  if (savePrefs == true) {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('originLang', origin);
    userProperties.setProperty('destLang', dest);
  }

  var translated = [];
  Logger.log("lets translate!!");
  for (var i = 0; i < text.length; i++) {
    // Logger.log(LanguageApp.translate(text[i], origin, dest));
    // translated.push(LanguageApp.translate(text[i], origin, dest));
    translated.push(text[i]);
  }

  return translated.join('\n');
}

/**
 * Replaces the text of the current selection with the provided text, or
 * inserts text at the current cursor location. (There will always be either
 * a selection or a cursor.) If multiple elements are selected, only inserts the
 * translated text in the first element that can contain text and removes the
 * other elements.
 *
 * @param {string} newText The text with which to replace the current selection.
 */
function insertText(newText) {
  
  
  
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var replaced = false;
    var elements = selection.getSelectedElements();
    if (elements.length == 1 &&
        elements[0].getElement().getType() ==
        DocumentApp.ElementType.INLINE_IMAGE) {
      throw "Can't insert text into an image.";
    }
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();

        var remainingText = element.getText().substring(endIndex + 1);
        element.deleteText(startIndex, endIndex);
        if (!replaced) {
          element.insertText(startIndex, newText);
          replaced = true;
        } else {
          // This block handles a selection that ends with a partial element. We
          // want to copy this partial text to the previous element so we don't
          // have a line-break before the last partial.
          var parent = element.getParent();
          parent.getPreviousSibling().asText().appendText(remainingText);
          // We cannot remove the last paragraph of a doc. If this is the case,
          // just remove the text within the last paragraph instead.
          if (parent.getNextSibling()) {
            parent.removeFromParent();
          } else {
            element.removeFromParent();
          }
        }
      } else {
        var element = elements[i].getElement();
        if (!replaced && element.editAsText) {
          // Only translate elements that can be edited as text, removing other
          // elements.
          element.clear();
          element.asText().setText(newText);
          replaced = true;
        } else {
          // We cannot remove the last paragraph of a doc. If this is the case,
          // just clear the element.
          if (element.getNextSibling()) {
            element.removeFromParent();
          } else {
            element.clear();
          }
        }
      }
    }
  } else {
    var cursor = DocumentApp.getActiveDocument().getCursor();
    var surroundingText = cursor.getSurroundingText().getText();
    var surroundingTextOffset = cursor.getSurroundingTextOffset();

    // If the cursor follows or preceds a non-space character, insert a space
    // between the character and the translation. Otherwise, just insert the
    // translation.
    if (surroundingTextOffset > 0) {
      if (surroundingText.charAt(surroundingTextOffset - 1) != ' ') {
        newText = ' ' + newText;
      }
    }
    if (surroundingTextOffset < surroundingText.length) {
      if (surroundingText.charAt(surroundingTextOffset) != ' ') {
        newText += ' ';
      }
    }
    cursor.insertText(newText);
  }
}