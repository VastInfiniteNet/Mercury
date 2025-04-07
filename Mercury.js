/**
 * Author: _MotokoKusanagi (discord: motokusanagi)
 * Contact for help/assistance.
 * 
 * How to setup:
 * 1. xxxx
 * 
 * How to Use:
 * xxxx
 * 
 * Configuration:
 * xxxxx
 * 
 * How it works:
 * xxxxx
 */

// base command name
const BASE_COMMAND = 'mercury'

let MERCURY_READER;
let MERCURY_GRAPHER;
let MERCURY_ANALYZER;
let MERCURY_IECREATOR;
let MERCURY_ARBITRAGER; 

let MERCURY_MODULES = []

class BaseMercuryModule {
    MODULE_MISSING = true
    Start() {} // starts any related listeners and GUI elements related to the module
    Stop() {} // closes and cleans up any listeners and GUI elements related to the module
    Help() {return "\nMISSING MODULE"} // returns all help related info including usage and options info.
}

function helpSubcommandHandler() {
    let helpMessageBuilder = Chat.createTextBuilder()
    helpMessageBuilder.append("Usage: ").append("/mercury").withColor(196, 22, 22)
    helpMessageBuilder.append("\nhelp - prints out command usage and info about subcommands. VERY WIP - WILL ADD BETTER FORMATTING AND COLOR LATER.")
    MERCURY_MODULES.forEach(m => {
        if (!!m)
            helpMessageBuilder.append(m.Help())
    })
    // print out a helpful chat message!
    // detail the subcommands available

    Chat.log(helpMessageBuilder.build())
    return true
}

function readerStartCommandHandler() {
    if (MERCURY_READER == null) {
        Chat.log("MERCURY_READER file missing!")
        return false
    }
    MERCURY_READER.Start()
    return true
}

function readerStopCommandHandler() {
    MERCURY_READER.Stop()
    return true
}

function graphCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
    return false
}

function analyzerCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
    return false
}

function iecreatorCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
    return false
}

function arbitragerCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
    return false
}


function setup() {
    startModules()
    
    var command = Chat.getCommandManager().createCommandBuilder(BASE_COMMAND)
        .literalArg('help').executes(JavaWrapper.methodToJava(helpSubcommandHandler))

    if (!!MERCURY_READER)
        command = command.otherwise(1).literalArg('reader')
            .literalArg('start').executes(JavaWrapper.methodToJava(readerStartCommandHandler)).otherwise(2)
            .literalArg('stop').executes(JavaWrapper.methodToJava(readerStopCommandHandler))
    if (!!MERCURY_GRAPHER)
        command = command.otherwise(1).literalArg('graph')
            .wordArg('file').suggestMatching(FS.list('./exchanges')).executes(JavaWrapper.methodToJava(graphCommandHandler))
    if (!!MERCURY_ANALYZER)
        command = command.otherwise(1).literalArg('analyzer').executes(JavaWrapper.methodToJava(analyzerCommandHandler))
    if (!!MERCURY_IECREATOR)
        command = command.otherwise(1).literalArg('iecreator').executes(JavaWrapper.methodToJava(iecreatorCommandHandler))
    if (!!MERCURY_ARBITRAGER)
        command = command.otherwise(1).literalArg('arbitrager').executes(JavaWrapper.methodToJava(arbitragerCommandHandler))

    command.register()
    event.stopListener = JavaWrapper.methodToJava(cleanup)
    Chat.log("Mercury setup complete..")
}

function cleanup() {
    Chat.getCommandManager().unregisterCommand(BASE_COMMAND)
    MERCURY_MODULES.forEach(m=>{
        if (!!m)
            m.Stop()
    })
}

function startModules() {
    MERCURY_READER = getModule('./tradeReader')
    MERCURY_GRAPHER = getModule('./tradeGrapher')
    MERCURY_ANALYZER = getModule('./tradeAnalyzer')
    MERCURY_IECREATOR = getModule('./IECreator')
    MERCURY_ARBITRAGER = getModule('./tradeArbitrager')
    MERCURY_MODULES = [MERCURY_READER, MERCURY_GRAPHER, MERCURY_ANALYZER, MERCURY_IECREATOR, MERCURY_ARBITRAGER]
}

function getModule(path) {
    try {
        return require(path).mercury.instance
    } catch (_) {
        return null
    }
}
setup()