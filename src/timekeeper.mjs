/**
 * Dragonbane Timekeeping API and core functionality.
 *
 */

import { SETTINGS, MODULE_ID } from './settings.mjs'
import { Constants } from './constants.mjs'
import { DaylightCycle } from './daylightcycle.mjs'
import { Helpers } from './helpers.mjs'
import { TimeTeller } from './timeteller.mjs'

/**
 * The public API for Easy Timekeeping.
 *
 * @public
 */
export class Timekeeper {
    static TIME_CHANGE_HOOK = 'etkTimeChangedHook'

    constructor () {
        console.debug('JD ETime | Timekeeper created')
    }

    init () {
        this.#set(this.#totalElapsedMinutes)
    }

    /**
     * Get the name of the current phase of the day as a localised string.
     * 
     * Not to be confused with the four shifts, the phase of day relates
     * to the daylight cycle. During the day phase, the scene lighting
     * will be set to the day value. During the night, scene lighting is
     * set to the night value. During dawn, lighting is gradually changed
     * from the night to the day values, while during dusk, the lighting
     * changes from the day to night values.
     *
     * @public
     * @returns {string} the localised name of the day phase.
     * This is one of the set `[Dawn, Day, Dusk, Night]`, but localized.
     */
    getPhaseOfDay () {
        return DaylightCycle.getPhaseOfDay(this.factorTime(this.#totalElapsedMinutes))
    }

    /**
     * Increment or decrement the time.
     * You must be a GM to run this function.
     *
     * @public
     * @param {time} time the time step to increment or decrement
     * @returns {timeChangeData} if the time was changed, otherwise `false`.
     */
    increment (time) {
        if (!game.user.isGM) {
            ui.notifications.warn(game.i18n.localize('JDTIMEKEEPING.NoPermission'))
            return false
        }

        if (!time) time = { minutes: 10 }
        return this.#increment(this.#toTotalMinutes(time))
    }

    /**
     * Set the time.
     * You must be a GM to run this function.
     *
     * @public
     * @param {time} time the time to set
     * @returns {timeChangeData} if the time was changed, otherwise `false`.
     */
    set (time) {
        if (!game.user.isGM) {
            ui.notifications.warn(game.i18n.localize('JDTIMEKEEPING.NoPermission'))
            return false
        }

        if (!time) time = 0
        return this.#set(this.#toTotalMinutes(time))
    }

    /**
     * Gets the current time.
     *
     * @public
     * @returns {timeAugmented} the current time
     */
    getTime () {
        if (!Helpers.showExactTime) {
            ui.notifications.warn(game.i18n.localize('JDTIMEKEEPING.NoPermission'))
            return false
        }

        return this.factorTime(this.#totalElapsedMinutes)
    }

    /**
     * Gets the current time as a formatted string.
     *
     * @public
     * @param {boolean} includeDay Determines whether the current day is included in the string
     * @returns {string} the current time as a formatted string suitable for display
     */
    toTimeString (includeDay = false) {
        if (!Helpers.showExactTime) {
            ui.notifications.warn(game.i18n.localize('JDTIMEKEEPING.NoPermission'))
            return false
        }

        return Helpers.toTimeString(this.factorTime(this.#totalElapsedMinutes), includeDay)
    }

    /**
     * Posts the current time to chat.
     *
     * @public
     */
    tellTime () {
        if (!Helpers.showExactTime) {
            ui.notifications.warn(game.i18n.localize('JDTIMEKEEPING.NoPermission'))
            return false
        }

        const currentTime = this.factorTime(this.#totalElapsedMinutes)
        TimeTeller.tellTime(currentTime)
    }

    /**
     * Factors a time object into game turns, shifts and days
     * @property {number} totalMinutes total elapsed minutes since 12am on day 0
     * @returns {gameTurnTime} `totalMinutes` factored into game turns, shifts, days and weeks
     * @public
     */
    factorGameTurns (totalMinutes) {
        // proxy to the static helper to expose the function to the macro API
        return Helpers.factorGameTurns(totalMinutes)
    }

    /**
     * Private method to actually increment the current time.
     *
     * @param {number} minutes The number of minutes to increment.
     * @returns {timeChangeData} if the time was changed, otherwise `false`.
     */
    #increment (minutes = 1) {
        console.debug('JD ETime | incrementing %d minutes', minutes)

        // don't decrement time earlier than time 0
        const newMinutes = Math.max(0, this.#totalElapsedMinutes + minutes)
        const oldTime = this.factorTime(this.#totalElapsedMinutes)
        const newTime = this.factorTime(newMinutes)
        console.debug('JD ETime | Current time %o', oldTime)
        console.log('JD ETime | Incrementing to new time %o', newTime)
        this.#setTotalElapsedMinutes(newMinutes)
        return this.#notify(oldTime, newTime)
    }

    /**
     * Private method to actually set the time.
     *
     * @param {number} totalMinutes The total number of minutes since 0:00 on day 0
     * @returns {timeChangeData} if the time was changed, otherwise `false`.
     */
    #set (totalMinutes = 0) {
        if (totalMinutes >= 0) {
            const oldTime = this.factorTime(this.#totalElapsedMinutes)
            const newTime = this.factorTime(totalMinutes)
            console.debug('JD ETime | Current time %o', oldTime)
            console.log('JD ETime | Setting new time %o', newTime)
            this.#setTotalElapsedMinutes(totalMinutes)
            return this.#notify(oldTime, newTime)
        }
    }

    #toTotalMinutes (time) {
        if (typeof time === 'number') {
            return Math.round(time)
        } else {
            console.debug('JD ETime | toTotalMinutes time: %o', time)
            const total =
                (time.minutes ? Number.parseFloat(time.minutes) : 0) +
                (time.hours ? Number.parseFloat(time.hours) * 60 : 0) +
                (time.days ? Number.parseFloat(time.days) * Constants.minutesPerDay : 0)
            console.debug('JD ETime | toTotalMinutes total: %o', total)
            return Math.round(total)
        }
    }

    /**
     * Notifies of a change in the time.
     *
     * @param {time} oldTime the previous time
     * @param {time} newTime the new time
     * @returns {timeChangeData} if the time was changed, otherwise `false`.
     */
    #notify (oldTime, newTime) {
        const data = { oldTime: oldTime, time: newTime }

        Hooks.callAll(Timekeeper.TIME_CHANGE_HOOK, data)

        /**
         * Macros can't listen to hooks, so if there is a macro registered in the
         * module settings then we'll call it now
         */
        if (game.user.isGM) {
            this.#timeChangeMacro?.execute(data)
        }

        return data
    }

    /**
     * Factors a time in total minutes into a time object. 
     * This API method has no side-effects, and does not change the internal 
     * time state.
     * 
     * @param {number} totalMinutes The total number of minutes since 0:00 on day 0
     * @returns {timeAugmented}
     * @public
     */
    factorTime (totalMinutes) {
        const time = {}

        time.totalMinutes = totalMinutes
        time.days = Math.floor(totalMinutes / Constants.minutesPerDay)
        time.hours = Math.floor((totalMinutes % Constants.minutesPerDay) / 60)
        time.minutes = (totalMinutes % Constants.minutesPerDay) % 60
        time.day = { index: (time.days % Constants.daysPerWeek) + 1 } // 1-based day index for UI
        time.day.name = Helpers.getWeekdayName(time.day.index - 1) // lookup by 0-based index
        time.weekNumber = Math.floor(time.days / Constants.daysPerWeek) + 1 // 1-based week number

        return time
    }

    /**
     * Gets the total elapsed ticks since tick 0 on day 0
     */
    get #totalElapsedMinutes () {
        return game.settings.get(MODULE_ID, SETTINGS.TOTAL_ELAPSED_MINUTES)
        // This uses game time
        // const currentWorldTime = game.time.worldTime
        // const dayTime = Math.abs(Math.trunc((currentWorldTime % 86400) / 60));
        // return dayTime
    }

    /**
     * Sets the total elapsed ticks since tick 0 on day 0
     */
    async #setTotalElapsedMinutes (minutes) {
        await game.settings.set(MODULE_ID, SETTINGS.TOTAL_ELAPSED_MINUTES, Math.round(minutes))
    }

    get #timeChangeMacro () {
        return game.macros.find(
            m => m.uuid === game.settings.get(MODULE_ID, SETTINGS.TIME_CHANGE_MACRO)
        )
    }
}

/**
 * A time object used for inputting time values to the Easy Timekeeping API
 *
 * @public
 * @typedef {Object} time
 * @property {number} days days since day 0
 * @property {number} hours hour of the day in 24-hour time, range [0..23]
 * @property {number} minutes minute of the hour, range [0..59]
 */

/**
 * An augmented time object used when values are returned from the Easy Timekeeping API
 *
 * @public
 * @typedef {Object} timeAugmented
 * @property {number} days days since day 0
 * @property {number} hours hour of the day in 24-hour time, range [0..23]
 * @property {number} minutes minute of the hour, range [0..59]
 * @property {number} totalMinutes total elapsed minutes since 12am on day 0
 * @property {number} weekNumber 1-based number of 7-day weeks that have elapsed, including the current partial week.
 * @property {dayData} day additional metadata about the day of the week
 */

/**
 * Day data
 *
 * @public
 * @typedef {Object} dayData
 * @property {number} index 1-based number of the day of the week, starting with Monday. Each week is fixed at 7 days.
 * @property {string} name the name of the current day of the week, based on the current world settings.
 */

/**
 * Time change object returned from the Easy Timekeeping API
 * @public
 * @typedef {Object} timeChangeData
 * @property {timeAugmented} oldTime the previous time
 * @property {timeAugmented} time the new time
 */

/**
 * Game turn time. This is used by the graphical clocks, and returned from API calls.
 *
 * @public
 * @typedef {Object} gameTurnTime
 * @property {number} totalGameTurns total number of elapsed game turns
 * @property {number} days days since day 0
 * @property {number} shifts the current shift out of the 4 shifts per day. 0-based, range [0..3]
 * @property {number} turns the current game turn within the current shift. 0-based indexing
 * @property {dayData} day additional metadata about the day of the week
 * @property {number} weekNumber 1-based number of 7-day weeks that have elapsed, including the current partial week.
 * @property {string} shiftName the name of the current shift, based on world settings.
 */
