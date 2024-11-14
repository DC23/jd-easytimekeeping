/**
 * Helper functions I seem to use everywhere.
 *
 * Many started out as class methods, but rather than
 * add class dependencies just to call these functions,
 * I'm moving them here.
 */

import { MODULE_ID, SETTINGS } from './settings.mjs'
import { Constants } from './constants.mjs'

export class Helpers {
    /**
     * Returns the current time of day as a formatted string.
     * Current module settings for 12 or 24 hour time are honoured.
     *
     * @param {Object} time A Timekeeper time object
     * @param {Number} time.totalMinutes total minutes
     * @param {Number} time.days days
     * @param {Number} time.hours The hour of the day in 24 time
     * @param {Number} time.minutes The minute of the hour
     * @param {Object} [options]
     * @param {Boolean} [options.includeDay=false] Whether the day is included, or just the time
     * @param {String} [options.i18nFormatter='JDTIMEKEEPING.timeOfDay'] The formatter to use
     */
    static toTimeString (time, options) {
        const timeOfDay = Helpers.toTimeOfDay(time)
        if (options?.includeDay) {
            const formatter = options?.i18nFormatter || 'JDTIMEKEEPING.timeOfDay'
            return game.i18n.format(formatter, { time: timeOfDay, day: time.days + 1 })
        } else {
            return timeOfDay
        }
    }

    /**
     * Gets the formatted time as a string "hh:mm [AM|PM]"
     * @param {Object} time A Timekeeper time object
     * @param {Boolean} [force12Hour=false] If true, forces an override to the module setting
     */
    static toTimeOfDay (time, force12Hour = false) {
        // time.hours is a value from 0 to 23
        if (force12Hour || !this.is24HourDisplay) {
            const amPm = time.hours >= 12 ? 'PM' : 'AM'
            let hour = time.hours > 12 ? time.hours - 12 : time.hours
            if (hour === 0) hour = 12
            return `${hour}:${time.minutes.toString().padStart(2, '0')} ${amPm}`
        } else {
            return `${time.hours.toString().padStart(2, '0')}:${time.minutes
                .toString()
                .padStart(2, '0')}`
        }
    }

    static get is24HourDisplay () {
        return game.settings.get(MODULE_ID, SETTINGS.DISPLAY_24_HOUR_TIME)
    }
}