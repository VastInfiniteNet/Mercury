/**
 * Author: _MotokoKusanagi (discord: motokusanagi)
 * Contact for help/assistance.
 * 
 * Coordindates idea/suggestion by Gjum.
 * 
 * How to setup:
 * 1. open JSMacros ui.
 * 2. Go to `Services` tab in bottom lefthand corner.
 * 3. Click `+` top right to add another entry, and name service (i.e. "IEC logger")
 * 4. Click middle File field, navigate to location of this file and select it.
 * 5. Enable and start running the service, you should see a message saying the service has started. 
 * 
 * How to Use:
 * Punch any iec chest while service is running. Check the output file to see the exchange trade csv (comma separated value) appended to the output file.
 * New exchange log entries are appended to the end of the log file. 
 * Need to run /cti to enable location logging while service is running/
 * 
 * Configuration:
 * To change the output logfile location change the below `TRADE_OUTPUT_FILE` variable value.
 * 
 * How it works:
 * Whenever you recieve any chat message the service first checks if the message is formatted like the first `(X/Y) exchanges present.` line.
 * Service then starts to look for the input line; logging the input item name and count, 
 * followed by output line; logging the output item name and count, 
 * followed by the final line of exchanges available line; logging of the number of exchanges left.
 * Service then starts to look for the first `(X/Y) exchanges present` messages again. 
 * Process continues unless stopped by user or when user leaves game.
 * Process cleans up message listener to prevent any zombie listening.
 * CTI location checking and compacted input/output slightly change exact order and add some complexity, but the above is a simplified version of the below.
 */



class TradeReader {
    // #region config
    /***************CONFIG*******************************************/

    // change to where you want output file and with what name.
    // text is appended to the end of the current file there.
    TRADE_OUTPUT_FOLDER = "exchanges/"
    TRADE_OUTPUT_FILE = "trades.csv"

    /****************************************************************/
    // #endregion

    // #region MESSAGE TARGET PARTS CONSTANTS
    // text parts to determine if message is a line in the 
    EXCHANGES_PRESENT_PART = " exchanges present."
    INPUT_PART = "Input: "
    OUTPUT_PART = "Output: "
    COMPACTED_ITEM_PART = "Compacted Item"
    EXCHANGES_AVAILABLE_PART = " exchanges available."
    CTI_MODE_CHANGE_PART = "Toggled reinforcement information mode "
    // #endregion

    OUTPUT_FILE_HEADER = "input_count,input_item,is_compacted,output_count,output_item,is_compacted,exchanges_available,x,y,z"

    currentLine = this.EXCHANGES_PRESENT_PART
    currentCompacted = false
    ctiEnabled = false
    tradeString = ""
    locationString = ""

    name = "TradeReader"
    messageListener

    static #_instance
    static instance = (() => {
        return !!(this.#_instance) ? this.#_instance : new TradeReader()
    })()

    constructor() {
        Object.freeze(this.TRADE_OUTPUT_FILE)
        Object.freeze(this.EXCHANGES_PRESENT_PART)
        Object.freeze(this.INPUT_PART)
        Object.freeze(this.OUTPUT_PART)
        Object.freeze(this.COMPACTED_ITEM_PART)
        Object.freeze(this.EXCHANGES_AVAILABLE_PART)
        Object.freeze(this.CTI_MODE_CHANGE_PART)
        Object.freeze(this.OUTPUT_FILE_HEADER)
    }

    /**
     * Starts an event listener for when the player receives a message to trigger a trade read.
     */
    startTradeReader() {
        if (!!this.messageListener) {
            Chat.log(`${this.name} already running...`)
            return
        }
        Chat.log(`STARTING ${this.name}`)
        if (!FS.exists(this.TRADE_OUTPUT_FOLDER))
            FS.makeDir(this.TRADE_OUTPUT_FOLDER) ? {} : this.TRADE_OUTPUT_FOLDER = "" 
        if (!FS.exists(this.TRADE_OUTPUT_FOLDER + this.TRADE_OUTPUT_FILE))
            FS.open(this.TRADE_OUTPUT_FOLDER + this.TRADE_OUTPUT_FILE).append(this.OUTPUT_FILE_HEADER + '\n')
        this.messageListener = JsMacros.on('RecvMessage', JavaWrapper.methodToJava(TradeReader.HandleReader))
    }

    stopTradeReader() {
        if (!!!this.messageListener)
            return
        JsMacros.off(this.messageListener)
        this.messageListener = null
        Chat.log(`${this.name} STOPPED.`)
    }

    /**
     * Checks provided message is apart of an iec exchange trade chat message. Once all four lines of the exchange trade have been read, logs trade to a file.
     * 
     * Example recvMessage event's text JSON objects:
     * 
     * Exchanges present:
     * In game: `(1/2) exchanges present`
     * Formatted text JSON: `{extra: [{bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, color: "yellow", text: "(1/2) exchanges present."}], text: ""}`
     * 
     * Input:
     * In game: `Input: 11 Iron Ingots`
     * Formatted text JSON: `{extra: [{bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, color: "yellow", text: "Input: "}, {italic: false, color: "white", text: "11 Iron Ingot"}], text: ""}`
     * 
     * Output:
     * In game: `Output: 1 Diamond`
     * Formatted text JSON: `{extra: [{bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, color: "yellow", text: "Output: "}, {italic: false, color: "white", text: "1 Diamond"}], text: ""}`
     * 
     * Compacted items are in Output/Input:
     * In game: `Compacted Item`
     * Formatted text JSON: `{extra: [{bold: false, italic: true, underlined: false, strikethrough: false, obfuscated: false, color: "dark_purple", text: "Compacted Item"}], text: ""}`
     * 
     * Exchanges available:
     * In game: `0 exchanges available.`
     * Formatted text JSON: `{extra: [{bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, color: "yellow", text: "0 exchanges available."}], text: ""}`
     * 
     * CTI hover text:
     * In game: `100% (300/300)` (floating green text)
     * Formatted text JSON: `{hoverEvent: {action: "show_text", contents: {text: "Location: -3807 69 -4307"}}, text: "Reinforced at 100% (300/300) health with Iron"`
     * 
     * CTI command ran:
     * In game: `Toggled reinforcement information mode off`
     * Formatted text JSON: `{extra: [{bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, color: "green", text: "Toggled reinforcement information mode "}, {italic: false, color: "yellow", text: "off"}], text: ""}`
     * 
     * @param {RecvMessage} recvMessageEvent New message player has received
     */
    static HandleReader(recvMessageEvent) {
        const reader = TradeReader.instance
        let msg = JSON.parse(recvMessageEvent.text.getJson()) // get formatted message from the event
        let msgExtraText = msg.extra?.at(0).text // get extra (formatted) text from the message

        if (msg.hoverEvent != null) {
            Chat.log(`'${reader.currentLine}': '${msg.hoverEvent.contents}'`)
            Chat.log(`${reader.currentLine == reader.EXCHANGES_PRESENT_PART}, ${msg.hoverEvent?.contents != null}`)
        }
        
        if (msgExtraText == reader.CTI_MODE_CHANGE_PART) { // check for CTI change
            reader.ctiEnabled = msg.extra[1].text == "on"
        } else if (reader.currentLine == reader.EXCHANGES_PRESENT_PART && msg.hoverEvent?.contents != null) { // check for cti reinforcement message after exchanges available
            let locationArray = msg.hoverEvent.contents.split(' ')
            reader.locationString = `,${locationArray[1]},${locationArray[2]},${locationArray[3]}`
        } else if (reader.currentLine == reader.EXCHANGES_PRESENT_PART && msgExtraText?.split(')')[1] == reader.EXCHANGES_PRESENT_PART) { // exchanges present check
            reader.currentLine = reader.INPUT_PART // just move currentLine to next trade line
        } else if(reader.currentLine == reader.INPUT_PART && msgExtraText == reader.INPUT_PART) { // input line check
            reader.inputOutputLineHelper(msg)
            reader.currentLine = reader.OUTPUT_PART
        } else if (reader.currentLine == reader.OUTPUT_PART && msgExtraText == reader.OUTPUT_PART) { // output line check
            reader.tradeString += `${reader.currentCompacted},` // whether or not input is compacted
            reader.inputOutputLineHelper(msg)
            reader.currentLine = reader.EXCHANGES_AVAILABLE_PART
        } else if (reader.currentLine == reader.EXCHANGES_AVAILABLE_PART && msgExtraText?.slice(msgExtraText?.indexOf(' ')) == reader.EXCHANGES_AVAILABLE_PART) { // available line check
            reader.tradeString += `${reader.currentCompacted},` // whether or not output is compacted
            reader.exchangeAvailable(msgExtraText)
        } else if ((reader.currentLine == reader.OUTPUT_PART || reader.currentLine == reader.EXCHANGES_AVAILABLE_PART)) { // post input/output compacted item check
            reader.currentCompacted = (msgExtraText == reader.COMPACTED_ITEM_PART)
        }
    }

    /**
     * Helper method as the input and output trade lines are identical for our purposes.
     * Gets the first number as the count of items and adds to log string.
     * Gets the rest of string after first number as the name of item in trade and adds to log string.
     * @param {*} msg 
     */
    inputOutputLineHelper(msg) {
        let itemCountString = msg.extra[1].text.split(' ', 1)[0]
        let itemNameString = msg.extra[1].text.substring(itemCountString.length + 1)

        this.tradeString += `${itemCountString},${itemNameString},`
        this.currentCompacted = false // reset compact tracking
    }

    /**
     * Reached when exchanges available line is reached. If cti hasn't been enabled while running
     * trade read is complete.
     * @param {*} msgExtraText 
     */
    exchangeAvailable(msgExtraText) {
        this.tradeString += `${msgExtraText?.split(' ', 1)[0]}` // add exchanges left count
        this.tradeReadComplete()
        this.currentCompacted = false // reset compact tracking
    }

    /**
     * IEC exchange trade is fully read. Logs out the current trade string.
     * Resets this.tradeString and currentLine to prepare for next potential trade.
     */
    tradeReadComplete() {
        this.tradeString += this.locationString 
        if (!FS.exists(this.TRADE_OUTPUT_FOLDER))
            FS.makeDir(this.TRADE_OUTPUT_FOLDER) ? {} : this.TRADE_OUTPUT_FOLDER = "" 
        FS.open(this.TRADE_OUTPUT_FOLDER + this.TRADE_OUTPUT_FILE).append(this.tradeString + '\n') // write trade string to log file
        this.tradeString = '' // reset logger string
        this.locationString = ',,,'
        this.currentLine = this.EXCHANGES_PRESENT_PART // look for start of a new exchange trade
    }

    HelpMessage() {
        return "Logs IEC exchange chat messages to a file. Includes input/output count, input/output item name," +
            " if input/output is compacted, trades available, and location of exchange. CTI needs to be enabled (with /cti) to have location saved."
    }
}

exports.mercury = TradeReader