/**
 * Encapsulates the Clock view for Dragonbane Timekeeping
 */
import { MODULE_ID, SETTINGS } from './settings.mjs'
import { Helpers } from './helpers.mjs'
import { Timekeeper } from './timekeeper.mjs'

export class TimeTeller {
    static init () {
        Hooks.on(Timekeeper.TIME_CHANGE_HOOK, TimeTeller.timeChangeHandler)
    }

    static timeChangeHandler (data) {
        TimeTeller.#checkAutoTellTime(data.time)
    }

    static async tellTime (time) {
        /**
         * if there is a macro registered in the
         * module settings then we'll call it to format the time,
         * otherwise use the built-in method
         */
        let content = null
        if (game.user.isGM) {
            const formatMacro = TimeTeller.#timeChatFormatMacro
            if (formatMacro) {
                content = await formatMacro.execute({ time: time, includeDay: true })
            }
        }

        if (!content) {
            content = Helpers.toTimeString(time, true)
        }

        console.log('JD ETime | %s', content)
        ChatMessage.create({
            speaker: { actor: game.user.id },
            content: content,
        })
    }

    static #checkAutoTellTime (time) {
        const tellTimeSettings = game.settings.get(MODULE_ID, SETTINGS.AUTO_TELL_TIME_SETTINGS)
        const timeOfDay = Helpers.toTimeOfDay(time, '12hour')
        if (tellTimeSettings[timeOfDay]) this.tellTime(time)
    }

    static get #timeChatFormatMacro () {
        return game.macros.find(
            m => m.uuid === game.settings.get(MODULE_ID, SETTINGS.TIME_CHAT_FORMAT_MACRO)
        )
    }
}
