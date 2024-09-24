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

class MercuryModule {
    Start() {} // starts any related listeners and GUI elements related to the module
    Stop() {} // closes and cleans up any listeners and GUI elements related to the module
    Help() {} // returns all help related info including usage and options info.
}

function helpSubcommandHandler() {
    let helpMessageBuilder = Chat.createTextBuilder()
    helpMessageBuilder.append("Usage: ").append("/mercury").withColor(196, 22, 22)
    helpMessageBuilder.append("\nhelp - prints out command usage and info about subcommands. VERY WIP - WILL ADD BETTER FORMATTING AND COLOR LATER.")
    if (!!MERCURY_READER)
        helpMessageBuilder.append(`\nreader <start/stop> - ${MERCURY_READER.Help()}`)
    // print out a helpful chat message!
    // detail the subcommands available

    Chat.log(helpMessageBuilder.build())
}

function readerStartCommandHandler() {
    if (MERCURY_READER == null) {
        Chat.log("MERCURY_READER file missing!")
        return;
    }
    MERCURY_READER.Start()
}

function readerStopCommandHandler() {
    MERCURY_READER.Stop()
}

function graphCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
}

function analyzerCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
}

function iecreatorCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
}

function arbitragerCommandHandler() {
    Chat.log("NOT IMPLEMENTED")
}


function setup() {
    startModules()
    
    Chat.getCommandManager().createCommandBuilder(BASE_COMMAND)
        .literalArg('help').executes(JavaWrapper.methodToJava(helpSubcommandHandler)).otherwise(1)
        .literalArg('reader')
            .literalArg('start').executes(JavaWrapper.methodToJava(readerStartCommandHandler)).otherwise(2)
            .literalArg('stop').executes(JavaWrapper.methodToJava(readerStopCommandHandler)).otherwise(1)
        .literalArg('graph').executes(JavaWrapper.methodToJava(graphCommandHandler)).otherwise(1)
        .literalArg('iecreator')
        .register()

    event.stopListener = JavaWrapper.methodToJava(cleanup)

    Chat.log("setup complete..")
}

function cleanup() {
    Chat.getCommandManager().unregisterCommand(BASE_COMMAND)
    MERCURY_READER.stopTradeReader()
}

function startModules() {
    MERCURY_READER = getModule('./tradeReader')
}

function getModule(path) {
    try {
        return require(path).mercury.instance
    } catch (error) {
        Chat.log(`Error finding module '${path}'`)
        return null
    }
}
setup()