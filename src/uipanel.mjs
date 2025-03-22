/**
 * The UI panel.
 */
import { Timekeeper } from './timekeeper.mjs'
import { MODULE_ID, SETTINGS } from './settings.mjs'
import { Helpers } from './helpers.mjs'
import { SetTimeApplication } from './settimeapp.mjs'
import { Constants } from './constants.mjs'
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class UIPanel extends HandlebarsApplicationMixin(ApplicationV2) {
    static ID = 'jd-et-uipanel'
    static DEFAULT_OPTIONS = {
        tag: 'div',
        classes: ['ui-panel', 'fade-element', 'receive-pointer-events'],
        id: UIPanel.ID,
        window: {
            frame: false,
            title: 'JDTIMEKEEPING.title',
            icon: 'fa-solid fa-clock',
            resizable: true, // only applies on the undocked UI
            height: 'auto',
            width: 'auto',
        },
        actions: {
            'time-delta': UIPanel.timeDeltaButtonHandler,
            'set-time': UIPanel.setTimeButtonHandler,
            'reset-time': UIPanel.resetTimeButtonHandler,
            'tell-time': UIPanel.tellTime,
        },
    }

    static PARTS = {
        form: {
            template: `modules/${MODULE_ID}/templates/uipanel.hbs`,
        },
    }

    static #hidden = false
    #avDockWhenSettingsOpen = null
    #time = null
    refresh = foundry.utils.debounce(this.render, 100)

    /**
     * Factory method for the UIPanel
     *
     * @returns {UIPanel}
     */
    static create () {
        const position = game.settings.get(MODULE_ID, SETTINGS.FLOATING_UI_PANEL_POSITION)

        if (position) {
            // for the floating panel, reset the auto width so it can resize manually
            if (UIPanel.floatingPanel) {
                if (position.width === 'auto') position.width = '220'
            } else {
                // when docked, restore auto width
                position.width = 'auto'
            }

            // if position if out of bounds for current client view,
            // reset to a safe location in the top left
            if (
                position.top > window.visualViewport.height ||
                position.left > window.visualViewport.width
            ) {
                position.top = 100
                position.left = 150
            }
        }

        const classes = UIPanel.DEFAULT_OPTIONS.classes
        if (UIPanel.floatingPanel) classes.push('floating')

        UIPanel.checkForAVPanel()
        const uiPanel = new UIPanel({
            window: { frame: UIPanel.floatingPanel },
            position: position,
            classes: classes,
        })

        uiPanel.ready()
        return uiPanel
    }

    ready () {
        Hooks.on(Timekeeper.TIME_CHANGE_HOOK, this.timeChangeHandler.bind(this))
        Hooks.on('renderAVConfig', this.renderAVConfigHandler.bind(this))
        Hooks.on('closeAVConfig', this.closeAVConfigHandler.bind(this))
        game.socket.on(`module.${MODULE_ID}`, time => {
            this.#time = time
            this.render()
        })

        if (!UIPanel.floatingPanel) this.#insertAppElement('#players')
    }

    static registerKeybindings () {
        // Set time
        game.keybindings.register(MODULE_ID, 'set-time', {
            name: 'JDTIMEKEEPING.SetTime.hotkey',
            precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
            restricted: true,
            onDown: async () => {
                await UIPanel.setTimeButtonHandler()
                return true
            },
        })

        // Reset time
        game.keybindings.register(MODULE_ID, 'reset-time', {
            name: 'JDTIMEKEEPING.ResetTime.hotkey',
            precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
            restricted: true,
            onDown: async () => {
                await UIPanel.resetTimeButtonHandler()
                return true
            },
        })

        // Show / hide the UI
        game.keybindings.register(MODULE_ID, 'show-hide-ui', {
            name: 'JDTIMEKEEPING.showHideUI',
            precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
            restricted: false,
            onDown: async () => {
                UIPanel.toggleHidden()
                return true
            },
        })
    }

    #insertAppElement (target) {
        /**
         * This creates a DOM element in the ui-left interface div,
         * in between the canvas controls and the players panel.
         * Technique from Global Progress Clocks.
         * */
        const top = document.querySelector(target)
        if (top) {
            const template = document.createElement('template')
            template.setAttribute('id', UIPanel.ID)
            top.insertAdjacentElement('beforebegin', template)
        } else {
            console.error('JD ETime | Could not initialise UI Panel')
        }
    }

    timeChangeHandler (data) {
        this.#time = data.time
        game.socket.emit(`module.${MODULE_ID}`, this.#time)
        this.render()
    }

    renderAVConfigHandler () {
        this.#avDockWhenSettingsOpen = game.webrtc.settings.client.dockPosition
    }

    closeAVConfigHandler () {
        /**
         * if the AV dock position has changed, we need to force a Foundry reload
         * since Foundry is currently inconsistent in when this occurs.
         *
         * Note that game.webrtc.settings.world.mode > 0 indicates that A/V chat is enabled.
         * I might be able to use that to automatically switch to a floating UI
         */

        const after = game.webrtc.settings.client.dockPosition
        if (this.#avDockWhenSettingsOpen != after) SettingsConfig.reloadConfirm({ world: true })
    }

    static checkForAVPanel () {
        if (UIPanel.avEnabled && !UIPanel.floatingPanel) {
            // This is a pathological layout situation: the AV dock disrupts the docked UI
            // todo: I could only do the check for the left & right dock settings, but it's safer to use all.
            // Also, this bug was actually fixed in PR #254, but I needed a commit to get a PR for this bug fix
            // so the release notes workflow will pick this up. Weird.
            ui.notifications.warn(game.i18n.localize('JDTIMEKEEPING.AVDockWarning'))
            game.settings.set(MODULE_ID, SETTINGS.FLOATING_UI_PANEL, true)
        }
    }

    #prepareClocks (time) {
        // prep the time data
        const clocks = [
            {
                id: 'etk-turns',
                value: time.turns + 1,
                max: Constants.turnsPerShift,
                name: game.i18n.format('JDTIMEKEEPING.gameTurnFormat', {
                    gameTurnName: UIPanel.#gameTurnName,
                    gameTurnNumber: (time.turns + 1).toString(),
                }),
                color: UIPanel.#clockFGColor,
                backgroundColor: UIPanel.#clockBGColor,
                spokeColor: UIPanel.#clockSpokeColor,
            },
            {
                id: 'etk-shifts',
                value: time.shifts + 1,
                max: Constants.shiftsPerDay,
                name: time.shiftName,
                color: UIPanel.#clockFGColor,
                backgroundColor: UIPanel.#clockBGColor,
                spokeColor: UIPanel.#clockSpokeColor,
            },
            {
                /**
                 * note that we need to display everything in
                 * 1-based values, but all the calculations
                 * are 0-based. Thus we have +1 all over the place.
                 */
                id: 'etk-days',
                value: time.day.index,
                max: Constants.daysPerWeek,
                name: game.i18n.format('JDTIMEKEEPING.Time.DayAndWeek', {
                    day: time.day.name,
                    weekName: Helpers.weekName,
                    week: time.weekNumber,
                }),
                color: UIPanel.#clockFGColor,
                backgroundColor: UIPanel.#clockBGColor,
                spokeColor: UIPanel.#clockSpokeColor,
            },
        ]
        // derive the radial data
        // const maxSpokes = 36
        const maxSpokes = 28
        return clocks.map(data => ({
            ...data,
            value: Math.clamp(data.value, 0, data.max),
            spokes: data.max > maxSpokes ? [] : Array(data.max).keys(),
        }))
    }

    _onFirstRender (context, options) {
        this.cosmeticSettingsChanged(false)
    }

    _onClose () {
        UIPanel.#hidden = true
        game.settings.set(MODULE_ID, SETTINGS.FLOATING_UI_PANEL_POSITION, this.position)
    }

    setPosition (pos) {
        super.setPosition(pos)
        game.settings.set(MODULE_ID, SETTINGS.FLOATING_UI_PANEL_POSITION, this.position)
    }

    /**
     * Called when cosmetic settings have been changed
     */
    cosmeticSettingsChanged (render = true) {
        this?.element?.style.setProperty('--background-color', UIPanel.#uiBgColor)
        this?.element?.style.setProperty('--opacity-no-focus', UIPanel.#uiUnfocusedOpacity)
        this?.element?.style.setProperty('--opacity-focus', UIPanel.#uiFocusedOpacity)
        if (render) this.render()
    }

    _prepareContext (options) {
        if (this.#time === null) {
            this.#time = game.modules.get(MODULE_ID)?.api?.getTime() || {
                totalMinutes: 0,
                minutes: 0,
                hours: 0,
                days: 0,
                weekNumber: 1,
                day: { index: 1, name: 'Monday' },
            }
        }

        const context = {
            isGM: game.user.isGM,
            textColor: UIPanel.#uiTextColor,
            btn: {
                color: UIPanel.#timeStepButtonColor,
                hoverColor: UIPanel.#timeStepButtonHoveredColor,
                clickColor: UIPanel.#timeStepButtonClickedColor,
            },
        }

        if (UIPanel.#playerSeesNothing) {
            context.time = game.i18n.localize('JDTIMEKEEPING.YouHaveNoIdeaOfTheTime')
        } else {
            if (Helpers.showExactTime) {
                context.time = Helpers.toTimeString(this.#time, UIPanel.#showLongFormatTime)
            }

            // some calculations are common whether we are showing either one or both of these
            if (UIPanel.#showDBTime || UIPanel.#showRadialClocks) {
                const gameTurnData = Helpers.factorGameTurns(this.#time.totalMinutes)
                gameTurnData.textColor = context.textColor // it's the same color for now, but could be different

                if (UIPanel.#showDBTime) {
                    // just pass in a data object and handle layout in the template
                    // make adjustments to the copy, since the original is used for the graphical display
                    context.gameTurnData = foundry.utils.deepClone(gameTurnData)
                    // display as 1-based
                    context.gameTurnData.gameTurnName = UIPanel.#gameTurnName
                    context.gameTurnData.days += 1
                    context.gameTurnData.shifts += 1
                    context.gameTurnData.turns += 1
                    if (Helpers.showExactTime) context.gameTurnData.days = null // hide days if they are already shown in time string
                }

                if (UIPanel.#showRadialClocks) context.clocks = this.#prepareClocks(gameTurnData)
            }
        }

        return context
    }

    /** Action Handlers */

    /**
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
     */
    static timeDeltaButtonHandler (event, target) {
        const dataTarget = target.getAttribute('data-target')
        if (dataTarget) {
            const tk = game.modules.get(MODULE_ID).api
            let scale = 1
            if (event.ctrlKey) scale = 0.5
            else if (event.shiftKey) scale = 2

            if (dataTarget === 'small-increment') {
                tk.increment({ minutes: UIPanel.#smallTimeDelta * scale })
            } else if (dataTarget === 'large-increment') {
                tk.increment({ hours: UIPanel.#largeTimeDelta * scale })
            } else if (dataTarget === 'large-decrement') {
                tk.increment({ hours: UIPanel.#largeTimeDelta * -scale })
            } else if (dataTarget === 'small-decrement') {
                tk.increment({ minutes: UIPanel.#smallTimeDelta * -scale })
            }
        }
    }

    static async setTimeButtonHandler (event, target) {
        new SetTimeApplication().render(true)
    }

    static async resetTimeButtonHandler (event, target) {
        const reset = await foundry.applications.api.DialogV2.confirm({
            window: {
                icon: 'fa-solid fa-clock-rotate-left',
                title: 'JDTIMEKEEPING.ResetTime.title',
            },
            content: game.i18n.localize('JDTIMEKEEPING.ResetTime.content'),
            modal: false,
            rejectClose: false,
        })
        if (reset) {
            await game.modules.get(MODULE_ID).api.set({ days: 0, hours: 0, minutes: 0 })
        }
    }

    static tellTime () {
        game.modules.get(MODULE_ID).api?.tellTime()
    }

    async toggleHidden () {
        // If floating panel and shown, then just close
        if (this.options.window.frame && !UIPanel.#hidden) {
            this.close()
            UIPanel.#hidden = true
            return
        }

        UIPanel.#hidden = !UIPanel.#hidden

        /**
         * When the UI is hidden, stop processing pointer events,
         * and when switching back to shown, process events again.
         */
        if (UIPanel.#hidden) {
            this?.element?.classList.remove('receive-pointer-events')
        } else {
            if (!this?.element?.classList.contains('receive-pointer-events'))
                this?.element?.classList.add('receive-pointer-events')
        }

        this.cosmeticSettingsChanged(false)

        // refresh the UI
        await this.render(true)
    }

    static async toggleHidden () {
        await game.modules.get(MODULE_ID).uiPanel.toggleHidden()
    }

    static get #uiBgColor () {
        return game.settings.get(MODULE_ID, SETTINGS.UI_BACKGROUND_COLOR)
    }

    static get #uiTextColor () {
        return game.settings.get(MODULE_ID, SETTINGS.UI_TEXT_COLOR)
    }

    static get #clockFGColor () {
        return game.settings.get(MODULE_ID, SETTINGS.RADIAL_CLOCK_FG_COLOR)
    }

    static get #clockBGColor () {
        return game.settings.get(MODULE_ID, SETTINGS.RADIAL_CLOCK_BG_COLOR)
    }

    static get #clockSpokeColor () {
        return game.settings.get(MODULE_ID, SETTINGS.RADIAL_CLOCK_SPOKE_COLOR)
    }

    static get #timeStepButtonColor () {
        return game.settings.get(MODULE_ID, SETTINGS.UI_BUTTON_COLOR)
    }

    static get #timeStepButtonHoveredColor () {
        return game.settings.get(MODULE_ID, SETTINGS.UI_BUTTON_HOVERED_COLOR)
    }

    static get #timeStepButtonClickedColor () {
        return game.settings.get(MODULE_ID, SETTINGS.UI_BUTTON_CLICKED_COLOR)
    }

    static get #smallTimeDelta () {
        return game.settings.get(MODULE_ID, SETTINGS.SMALL_TIME_DELTA)
    }

    static get #largeTimeDelta () {
        return game.settings.get(MODULE_ID, SETTINGS.LARGE_TIME_DELTA)
    }

    /**
     * Has the GM chosen to hide all UI elements from players?
     */
    static get #playerSeesNothing () {
        return !UIPanel.#showDBTime && !Helpers.showExactTime && !UIPanel.#showRadialClocks
    }

    static get #showDBTime () {
        return game.settings.get(MODULE_ID, SETTINGS.SHOW_DRAGONBANE_TIME)
    }

    static get #showRadialClocks () {
        return game.settings.get(MODULE_ID, SETTINGS.SHOW_RADIAL_CLOCK)
    }

    static get #uiFocusedOpacity () {
        if (UIPanel.#hidden) return 0
        return game.settings.get(MODULE_ID, SETTINGS.UI_FOCUSED_OPACITY)
    }

    static get #uiUnfocusedOpacity () {
        if (UIPanel.#hidden) return 0
        return game.settings.get(MODULE_ID, SETTINGS.UI_UNFOCUSED_OPACITY)
    }

    static get #showLongFormatTime () {
        return game.settings.get(MODULE_ID, SETTINGS.SHOW_LONG_FORMAT_TIME)
    }

    static get #gameTurnName () {
        return game.settings.get(MODULE_ID, SETTINGS.GAME_TURN_NAME)
    }

    static get floatingPanel () {
        return game.settings.get(MODULE_ID, SETTINGS.FLOATING_UI_PANEL)
    }

    static get avEnabled () {
        return game.webrtc.settings.world.mode > 0
    }
}
