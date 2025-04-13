import { Helpers } from './helpers.mjs'
import { MODULE_ID, SETTINGS } from './settings.mjs'
import { Timekeeper } from './timekeeper.mjs'

/**
 * @typedef {Object} PHASES Enumeration of the phases of the day
 * @property {number} DAWN The dawn phase, when lighting is transitioning between night and day
 * @property {number} DAY The day phase, when lighting is stable at the daytime setting
 * @property {number} DUSK The dusk phase, when lighting is transitioning between day and night
 * @property {number} NIGHT The night phase, when lighting is stable at the nighttime setting
 */
export const PHASES = {
    DAWN: 0,
    DAY: 1,
    DUSK: 2,
    NIGHT: 3,
}

/**
 * @class Implements the 24-hour lighting cycle
 * Implements the daylight cycle.
 *
 * In the cycle, the day is divided into 4 phases:
 * Dawn: darkness levels transition from night settings to day settings at each clock tick
 * Day: darkness levels are set to the day setting
 * Dusk: darkness levels transition from day to night settings at each clock tick
 * Night: darkness levels are set to the night setting
 *
 * The algorithm has two main stages:
 * 1: detect which phase the current time is in
 * 2: handle the lighting updates based on the phase
 *
 * Large jumps in time are handled easily.
 * In the day and night phases, the current scene darkness level is compared
 * directly to the target level and set to the target if it is different.
 * In the dawn and dusk phases, linear interpolation is used to progressively
 * move the scene darkness level towards the target value over the required number of
 * clock ticks.
 */
export class DaylightCycle {
    static init () {
        Hooks.on(Timekeeper.TIME_CHANGE_HOOK, DaylightCycle.timeChangeHandler)
    }

    /**
     * Time changed hook handler
     *
     * @param {import('./datatypes.mjs').timeChangeData} data
     * @public
     */
    static timeChangeHandler (data) {
        const time = data.time
        if (!DaylightCycle.#enabled || !canvas.scene) return

        try {
            switch (DaylightCycle.#detectPhase(time)) {
                case PHASES.DAWN:
                    DaylightCycle.#processDawn(time)
                    break
                default:
                case PHASES.DAY:
                    DaylightCycle.#processDay()
                    break
                case PHASES.DUSK:
                    DaylightCycle.#processDusk(time)
                    break
                case PHASES.NIGHT:
                    DaylightCycle.#processNight()
                    break
            }
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Gets the name of the current phase of the day as a localised string.
     *
     * @param {import('./datatypes.mjs').time} time
     * @returns {string} the localised name of the day phase. This is one of the set [Dawn, Day, Dusk, Night]
     */
    static getPhaseOfDay (time) {
        switch (DaylightCycle.#detectPhase(time)) {
            case PHASES.DAWN:
                return game.i18n.localize('JDTIMEKEEPING.Time.Dawn')
            default:
            case PHASES.DAY:
                return game.i18n.localize('JDTIMEKEEPING.Time.Day')
            case PHASES.DUSK:
                return game.i18n.localize('JDTIMEKEEPING.Time.Dusk')
            case PHASES.NIGHT:
                return game.i18n.localize('JDTIMEKEEPING.Time.Night')
        }
    }

    /**
     * Detects the lighting cycle phase for the given time.
     *
     * @param {import('./datatypes.mjs').time} time
     * @returns {PHASES} the daylight cycle phase for the given time
     */
    static #detectPhase (time) {
        /**
         * Internally, work with the JS Date object since it's much
         * less error prone and will handle all the edge cases for us
         */
        const dawnStart = DaylightCycle.#asDate(DaylightCycle.#dawnStart)
        const dawnEnd = new Date(dawnStart)
        dawnEnd.setMinutes(dawnEnd.getMinutes() + DaylightCycle.#dawnDuration)

        const duskStart = DaylightCycle.#asDate(DaylightCycle.#duskStart)
        const duskEnd = new Date(duskStart)
        duskEnd.setMinutes(duskEnd.getMinutes() + DaylightCycle.#duskDuration)

        // Create now from dawnStart so that it will be on the same day,
        // but with the same hours & minutes as the in-game time
        const now = new Date(dawnStart)
        now.setHours(time.hours)
        now.setMinutes(time.minutes, 0, 0)

        /**
         * to avoid messing with the time roll-over at midnight, test for dawn,
         * day and dusk. It's night when it's not one of those three.
         */
        if (now >= dawnStart && now < dawnEnd) {
            return PHASES.DAWN
        } else if (now >= dawnEnd && now < duskStart) {
            return PHASES.DAY
        } else if (now >= duskStart && now < duskEnd) {
            return PHASES.DUSK
        } else {
            return PHASES.NIGHT
        }
    }

    /**
     * Processes an update for the `PHASES.DAY` phase
     */
    static #processDay () {
        console.debug('JD ETime | Daylight cycle - day')
        if (DaylightCycle.#sceneDarkness != DaylightCycle.#daytimeDarkness) {
            console.debug(
                'JD ETime | Daylight cycle: setting daytime darkness %f',
                DaylightCycle.#daytimeDarkness
            )
            DaylightCycle.#setSceneDarkness(DaylightCycle.#daytimeDarkness)
        }
    }

    /**
     * Processes an update for the `PHASES.NIGHT` phase
     */
    static #processNight () {
        console.debug('JD ETime | Daylight cycle - night')
        if (DaylightCycle.#sceneDarkness != DaylightCycle.#nighttimeDarkness) {
            console.debug(
                'JD ETime | Daylight cycle: setting nighttime darkness %f',
                DaylightCycle.#nighttimeDarkness
            )
            DaylightCycle.#setSceneDarkness(DaylightCycle.#nighttimeDarkness)
        }
    }

    /**
     * Processes an update for the `PHASES.DAWN` phase.
     * Uses linear interpolation between the night and day lighting values
     * to set the scene lighting.
     *
     * @param {import('./datatypes.mjs').time} time the current time in the dawn phase
     */
    static #processDawn (time) {
        console.debug('JD ETime | Daylight cycle - dawn')
        DaylightCycle.#processTwilightPhase(
            time,
            DaylightCycle.#dawnStart,
            DaylightCycle.#dawnDuration,
            DaylightCycle.#nighttimeDarkness,
            DaylightCycle.#daytimeDarkness
        )
    }

    /**
     * Processes an update for the `PHASES.DUSK` phase
     * Uses linear interpolation between the day and night lighting values
     * to set the scene lighting.
     *
     * @param {import('./datatypes.mjs').time} time the current time in the dusk phase
     */
    static #processDusk (time) {
        console.debug('JD ETime | Daylight cycle - dusk')
        DaylightCycle.#processTwilightPhase(
            time,
            DaylightCycle.#duskStart,
            DaylightCycle.#duskDuration,
            DaylightCycle.#daytimeDarkness,
            DaylightCycle.#nighttimeDarkness
        )
    }

    /**
     * Processes one of the twilight (dawn and dusk) phases.
     *
     * @param {import('./datatypes.mjs').time} time the current time
     * @param {import('./datatypes.mjs').time} startTime the start of the twilight phase
     * @param {number} durationMinutes duration of the twilight phase in minutes
     * @param {number} fromDarkness Foundry scene darkness level of the phase we are moving from
     * @param {*} toDarkness  Foundry scene darkness level of the phase we are moving towards
     */
    static #processTwilightPhase (time, startTime, durationMinutes, fromDarkness, toDarkness) {
        /**
         * Given:
         * 1. start, end, & duration in minutes of the phase
         * 2. current minute of the phase
         * 3. start, end, and current darkness levels
         *
         * then it's a linear interpolation problem.
         * The distance moved in minutes between the start and end of the phase
         * as a proportion of the total duration gives the amount to scale the
         * darkness level as it increments between the starting and target values.
         *
         * We don't need to test for overrunning the end of the phase. That's
         * already handled before this method is called.
         */
        const endTime = DaylightCycle.#addMinutes(startTime, durationMinutes)
        const startMinute = startTime.hours * 60 + startTime.minutes
        const endMinute = endTime.hours * 60 + endTime.minutes
        const currentMinute = time.hours * 60 + time.minutes
        const scaleFactor = (currentMinute - startMinute) / (endMinute - startMinute)
        const darkness = DaylightCycle.#scaleVector(scaleFactor, fromDarkness, toDarkness)
        DaylightCycle.#setSceneDarkness(darkness)

        console.debug(
            'JD ETime | twilight (dawn/dusk) phase is running from minute %d \
            to minute %d. Currently at minute %d for scaleFactor = %f. \
            Setting darkness level %f',
            startMinute,
            endMinute,
            currentMinute,
            scaleFactor,
            darkness
        )
    }

    /**
     * Simple linear interpolation between 2 values
     * @param {number} scale scaling factor
     * @param {number} start starting value
     * @param {number} end ending value
     * @returns {number} the interpolated value
     */
    static #scaleVector (scale, start, end) {
        let v = scale * (end - start) + start
        v = Math.min(1, Math.max(0, v))
        return v
    }

    /**
     * Adds a given number of minutes to the time.
     * @param {import('./datatypes.mjs').time} time the time
     * @param {number} minutes the number of minutes to add to the time
     * @returns {import('./datatypes.mjs').time} the new time
     */
    static #addMinutes (time, minutes) {
        const totalMinutes = time.hours * 60 + time.minutes + minutes
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60,
        }
    }

    /**
     * Gets a JS Date object corresponding to the time.
     * Note that the represented real time is arbitrary
     * and is based on the current time and date.
     * This doesn't matter, since we never output this real date to the user
     * and we only use these objects to simplify relative calculations between times
     * and to ensure correct detection of daylight cycle phases when the phases cross
     * the midnight boundary.
     *
     * @param {import('./datatypes.mjs').time} time the time to convert
     * @returns {Date} the time input converted to a date, with seconds and milliseconds set to 0
     */
    static #asDate (time) {
        const date = new Date()
        date.setDate(time.days)
        date.setHours(time.hours)
        date.setMinutes(time.minutes, 0, 0)
        return date
    }

    /**
     * Tests if the Daylight cycle is enabled.
     *
     * @returns {boolean} true if daylight cycle is enabled, otherwise false
     */
    static get #enabled () {
        return game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)[
            'daylight-cycle-enabled'
        ]
    }

    /**
     * Controls the fade duration of a single change in scene lighting.
     *
     * @returns {number} The darkness animation duration in milliseconds
     */
    static get #animateDarkness () {
        return game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)['animate-darkness-ms']
    }

    /**
     * The daytime darkness value.
     *
     * @returns {number} The daytime darkness, range [0..1.0]
     */
    static get #daytimeDarkness () {
        return game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)['day-darkness-level']
    }

    /**
     * The nighttime darkness value.
     *
     * @returns {number} The nighttime darkness, range [0..1.0]
     */
    static get #nighttimeDarkness () {
        return game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)[
            'night-darkness-level'
        ]
    }

    /**
     * The current scene darkness value
     *
     * @returns {number} The current scene darkness, range [0..1.0]
     */
    static get #sceneDarkness () {
        return canvas.scene.environment.darknessLevel
    }

    /**
     * Sets the scene darkness
     *
     * @param {number} darkness the value to set
     */
    static async #setSceneDarkness (darkness) {
        await canvas.scene.update(
            { 'environment.darknessLevel': darkness },
            { animateDarkness: DaylightCycle.#animateDarkness }
        )
    }

    /**
     * Gets the dawn start time
     *
     * @returns {import('./datatypes.mjs').time} the dawn start time
     */
    static get #dawnStart () {
        return Helpers.splitTimeString(
            game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)['dawn-start']
        )
    }

    /**
     * Gets the dawn duration in minutes
     *
     * @returns {number} dawn duration in minutes
     */
    static get #dawnDuration () {
        return game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)['dawn-duration']
    }

    /**
     * Gets the dusk start time
     *
     * @returns {import('./datatypes.mjs').time} the dusk start time
     */
    static get #duskStart () {
        return Helpers.splitTimeString(
            game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)['dusk-start']
        )
    }

    /**
     * Gets the dusk duration in minutes
     *
     * @returns {number} dusk duration in minutes
     */
    static get #duskDuration () {
        return game.settings.get(MODULE_ID, SETTINGS.DAYLIGHT_CYCLE_SETTINGS)['dusk-duration']
    }
}
