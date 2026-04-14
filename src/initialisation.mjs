/**
 * Easy Timekeeping module registration functions
 *
 */
import { registerKeybindings, registerSettings, MODULE_ID, SETTINGS } from './settings.mjs'
import { TimeTeller } from './timeteller.mjs'
import { Constants } from './constants.mjs'
import { DaylightCycle } from './daylightcycle.mjs'
import { Timekeeper } from './timekeeper.mjs'
import { UIPanel } from './uipanel.mjs'

Hooks.once('init', () => {
    console.group('JD ETime | init')

    registerKeybindings()
    UIPanel.registerKeybindings()

    console.groupEnd()
})

Hooks.once('i18nInit', () => {
    registerSettings()
})

Hooks.once('ready', async () => {
    console.group('JD ETime | ready')

    const uiPanel = UIPanel.create()
    uiPanel.render(true)
    game.modules.get(MODULE_ID).uiPanel = uiPanel

    TimeTeller.init()
    DaylightCycle.init()

    const timekeeper = new Timekeeper()
    timekeeper.init()

    game.modules.get(MODULE_ID).api = timekeeper
    game.modules.get(MODULE_ID).timeChangeHookName = Timekeeper.TIME_CHANGE_HOOK
    game.modules.get(MODULE_ID).constants = Constants

    // I don't need this for now
    // Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
    //     return arg1 == arg2 ? options.fn(this) : options.inverse(this)
    // })
    // {{#ifEquals sampleString "This is a string"}}
    // Your HTML here
    // {{else}}
    // {{/ifEquals}}

    console.groupEnd()
})
