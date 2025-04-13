import { registerAutoTellTimeSettings } from './autotelltimesettings.mjs'
import { registerDaylightCycleSettings } from './daylightcyclesettings.mjs'
import { registerShiftSettings } from './shiftsettings.mjs'
import { registerWeekdaySettings } from './weekdaysettings.mjs'

export const MODULE_ID = 'jd-easytimekeeping'
export const SETTINGS = {
    TOTAL_ELAPSED_MINUTES: 'totalElapsedMinutes',
    TIME_CHANGE_MACRO: 'timeChangeMacro',
    TIME_CHAT_FORMAT_MACRO: 'timeChatFormatMacro',
    AUTO_TELL_TIME_SETTINGS: 'autoTellTimeSettings',
    AUTO_TELL_TIME_MENU: 'autoTellTimeMenu',
    DAYLIGHT_CYCLE_SETTINGS: 'daylightCycleSettings',
    DAYLIGHT_CYCLE_MENU: 'daylightCycleMenu',
    SHIFT_SETTINGS: 'shiftSettings',
    SHIFT_MENU: 'shiftMenu',
    WEEKDAY_SETTINGS: 'weekdaySettings',
    DAYS_PER_WEEK: 'daysPerWeek',
    WEEK_NAME: 'weekName',
    WEEKDAY_MENU: 'weekdayMenu',
    SHOW_LONG_FORMAT_TIME: 'showDayInExactTime',
    DISPLAY_24_HOUR_TIME: 'display24HourTime',
    SMALL_TIME_DELTA: 'smallTimeDelta',
    LARGE_TIME_DELTA: 'largeTimeDelta',
    SHOW_RADIAL_CLOCK: 'showRadialClock',
    SHOW_DRAGONBANE_TIME: 'showDragonbaneTime',
    SHOW_PLAYERS_EXACT_TIME: 'showPlayersExactTime',
    UI_TEXT_COLOR: 'uiTextColor',
    RADIAL_CLOCK_FG_COLOR: 'radialClockColor',
    RADIAL_CLOCK_BG_COLOR: 'radialClockBGColor',
    RADIAL_CLOCK_SPOKE_COLOR: 'radialClockSpokeColor',
    UI_FOCUS_OPACITY: 'uiFocusOpacity',
    UI_UNFOCUSED_OPACITY: 'uiFadeOpacity',
    UI_FOCUSED_OPACITY: 'uiFocusedOpacity',
    UI_BUTTON_COLOR: 'uiButtonColour',
    UI_BUTTON_HOVERED_COLOR: 'uiButtonHoveredColour',
    UI_BUTTON_CLICKED_COLOR: 'uiButtonClickedColour',
    UI_BACKGROUND_COLOR: 'uiBackgroundColour',
    GAME_TURN_NAME: 'gameTurnName',
    FLOATING_UI_PANEL: 'uiInFrame',
    FLOATING_UI_PANEL_POSITION: 'uiPanelPosition',
}

const GM_ONLY_SETTINGS = [
    SETTINGS.SHOW_PLAYERS_EXACT_TIME,
    SETTINGS.SHOW_DRAGONBANE_TIME,
    SETTINGS.SHOW_RADIAL_CLOCK,
    SETTINGS.SMALL_TIME_DELTA,
    SETTINGS.LARGE_TIME_DELTA,
    SETTINGS.TIME_CHANGE_MACRO,
    SETTINGS.TIME_CHAT_FORMAT_MACRO,
    SETTINGS.UI_BUTTON_COLOR,
    SETTINGS.UI_BUTTON_HOVERED_COLOR,
    SETTINGS.UI_BUTTON_CLICKED_COLOR,
]

export function registerSettings () {
    // Register the menus
    registerAutoTellTimeSettings()
    registerDaylightCycleSettings()
    registerShiftSettings()
    registerWeekdaySettings()

    game.settings.register(MODULE_ID, SETTINGS.FLOATING_UI_PANEL, {
        name: 'JDTIMEKEEPING.Settings.ShowUIInFloatingWindow.name',
        hint: 'JDTIMEKEEPING.Settings.ShowUIInFloatingWindow.hint',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: true,
    })

    game.settings.register(MODULE_ID, SETTINGS.FLOATING_UI_PANEL_POSITION, {
        scope: 'client',
        config: false,
        type: foundry.applications.types.ApplicationPosition,
        default: { top: 100, left: 150 },
        requiresReload: false,
    })

    game.settings.register(MODULE_ID, SETTINGS.TIME_CHANGE_MACRO, {
        name: 'JDTIMEKEEPING.Settings.TimeChangeMacro.name',
        hint: 'JDTIMEKEEPING.Settings.TimeChangeMacro.hint',
        scope: 'world',
        config: true,
        type: new foundry.data.fields.DocumentUUIDField({ type: 'Macro' }),
        requiresReload: false,
    })

    game.settings.register(MODULE_ID, SETTINGS.TIME_CHAT_FORMAT_MACRO, {
        name: 'JDTIMEKEEPING.Settings.TimeChatFormatMacro.name',
        hint: 'JDTIMEKEEPING.Settings.TimeChatFormatMacro.hint',
        scope: 'world',
        config: true,
        type: new foundry.data.fields.DocumentUUIDField({ type: 'Macro' }),
        requiresReload: false,
    })

    game.settings.register(MODULE_ID, SETTINGS.UI_FOCUSED_OPACITY, {
        name: 'JDTIMEKEEPING.Settings.UIFocusOpacity.name',
        hint: 'JDTIMEKEEPING.Settings.UIFocusOpacity.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.NumberField({ min: 0.1, max: 1.0 }),
        default: 0.85,
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.UI_UNFOCUSED_OPACITY, {
        name: 'JDTIMEKEEPING.Settings.UIFadeOpacity.name',
        hint: 'JDTIMEKEEPING.Settings.UIFadeOpacity.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.NumberField({ min: 0.1, max: 1.0 }),
        default: 0.6,
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.SHOW_PLAYERS_EXACT_TIME, {
        name: 'JDTIMEKEEPING.Settings.ShowPlayersExactTime.name',
        hint: 'JDTIMEKEEPING.Settings.ShowPlayersExactTime.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: true,
    })

    game.settings.register(MODULE_ID, SETTINGS.SHOW_LONG_FORMAT_TIME, {
        name: 'JDTIMEKEEPING.Settings.ShowLongFormatTime.name',
        hint: 'JDTIMEKEEPING.Settings.ShowLongFormatTime.hint',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.DISPLAY_24_HOUR_TIME, {
        name: 'JDTIMEKEEPING.Settings.Display24HourFormat.name',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.SHOW_DRAGONBANE_TIME, {
        name: 'JDTIMEKEEPING.Settings.ShowDragonbaneTime.name',
        hint: 'JDTIMEKEEPING.Settings.ShowDragonbaneTime.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: true,
        // Not using cosmeticSettingsChanged because it's a world setting, so needs a reload to update all clients
    })

    game.settings.register(MODULE_ID, SETTINGS.SHOW_RADIAL_CLOCK, {
        name: 'JDTIMEKEEPING.Settings.ShowRadialClock.name',
        hint: 'JDTIMEKEEPING.Settings.ShowRadialClock.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: true,
    })

    game.settings.register(MODULE_ID, SETTINGS.GAME_TURN_NAME, {
        name: 'JDTIMEKEEPING.Settings.GameTurnName.name',
        hint: 'JDTIMEKEEPING.Settings.GameTurnName.hint',
        scope: 'world',
        config: true,
        type: String,
        default: game.i18n.localize('JDTIMEKEEPING.Time.Stretch'),
        requiresReload: true,
    })

    // small time delta in minutes
    game.settings.register(MODULE_ID, SETTINGS.SMALL_TIME_DELTA, {
        name: 'JDTIMEKEEPING.Settings.SmallTimeDelta.name',
        hint: 'JDTIMEKEEPING.Settings.SmallTimeDelta.hint',
        scope: 'world',
        config: true,
        type: new foundry.data.fields.StringField({
            choices: {
                5: '5',
                10: '10',
                15: '15',
                20: '20',
                30: '30',
            },
            required: true,
        }),
        default: 15,
        onChange: value => {
            console.log('JD ETime | %s %d', SETTINGS.SMALL_TIME_DELTA, value)
        },
        requiresReload: true,
    })

    // Large time delta in hours
    game.settings.register(MODULE_ID, SETTINGS.LARGE_TIME_DELTA, {
        name: 'JDTIMEKEEPING.Settings.LargeTimeDelta.name',
        hint: 'JDTIMEKEEPING.Settings.LargeTimeDelta.hint',
        scope: 'world',
        config: true,
        type: new foundry.data.fields.StringField({
            choices: {
                1: '1',
                2: '2',
                3: '3',
                4: '4',
                5: '5',
                6: '6',
                12: '12',
            },
            required: true,
        }),
        default: 6,
        onChange: value => {
            console.log('JD ETime | %s %d', SETTINGS.LARGE_TIME_DELTA, value)
        },
        requiresReload: false,
    })

    game.settings.register(MODULE_ID, SETTINGS.UI_BACKGROUND_COLOR, {
        name: 'JDTIMEKEEPING.Settings.UIBackgroundColor.name',
        hint: 'JDTIMEKEEPING.Settings.UIBackgroundColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#000000',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.UI_TEXT_COLOR, {
        name: 'JDTIMEKEEPING.Settings.UITextColor.name',
        hint: 'JDTIMEKEEPING.Settings.UITextColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#ffffff',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.RADIAL_CLOCK_FG_COLOR, {
        name: 'JDTIMEKEEPING.Settings.RadialClockColor.name',
        hint: 'JDTIMEKEEPING.Settings.RadialClockColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#138b37',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.RADIAL_CLOCK_BG_COLOR, {
        name: 'JDTIMEKEEPING.Settings.RadialClockBGColor.name',
        hint: 'JDTIMEKEEPING.Settings.RadialClockBGColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#062811',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.RADIAL_CLOCK_SPOKE_COLOR, {
        name: 'JDTIMEKEEPING.Settings.RadialClockSpokeColor.name',
        hint: 'JDTIMEKEEPING.Settings.RadialClockSpokeColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#000000',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.UI_BUTTON_COLOR, {
        name: 'JDTIMEKEEPING.Settings.UIButtonColor.name',
        hint: 'JDTIMEKEEPING.Settings.UIButtonColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#ffffff',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.UI_BUTTON_HOVERED_COLOR, {
        name: 'JDTIMEKEEPING.Settings.UIButtonHoveredColor.name',
        hint: 'JDTIMEKEEPING.Settings.UIButtonHoveredColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#138b37',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.UI_BUTTON_CLICKED_COLOR, {
        name: 'JDTIMEKEEPING.Settings.UIButtonClickedColor.name',
        hint: 'JDTIMEKEEPING.Settings.UIButtonClickedColor.hint',
        scope: 'client',
        config: true,
        type: new foundry.data.fields.ColorField(),
        default: '#25e45e',
        requiresReload: false,
        onChange: () => {
            game.modules.get(MODULE_ID).uiPanel?.cosmeticSettingsChanged()
        },
    })

    game.settings.register(MODULE_ID, SETTINGS.TOTAL_ELAPSED_MINUTES, {
        scope: 'world',
        config: false,
        type: Number,
        default: 0,
        requiresReload: false,
    })
}

Hooks.on('renderSettingsConfig', (app, [html], context) => {
    if (game.user.isGM) return

    GM_ONLY_SETTINGS.forEach(id => {
        html.querySelector(`.form-group[data-setting-id="${MODULE_ID}.${id}"]`)?.remove()
    })
})

export function registerKeybindings () {
    // Define keybindings for time operations but leave them unbound

    // small increment
    game.keybindings.register(MODULE_ID, 'small-increment', {
        name: 'JDTIMEKEEPING.SmallIncrement',
        precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
        restricted: true,
        onDown: () => {
            game.modules.get(MODULE_ID).api?.increment({
                minutes: game.settings.get(MODULE_ID, SETTINGS.SMALL_TIME_DELTA),
            })
            return true
        },
    })

    // small decrement
    game.keybindings.register(MODULE_ID, 'small-decrement', {
        name: 'JDTIMEKEEPING.SmallDecrement',
        precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
        restricted: true,
        onDown: () => {
            game.modules.get(MODULE_ID).api?.increment({
                minutes: -game.settings.get(MODULE_ID, SETTINGS.SMALL_TIME_DELTA),
            })
            return true
        },
    })

    // large increment
    game.keybindings.register(MODULE_ID, 'large-increment', {
        name: 'JDTIMEKEEPING.LargeIncrement',
        precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
        restricted: true,
        onDown: () => {
            game.modules.get(MODULE_ID).api?.increment({
                hours: game.settings.get(MODULE_ID, SETTINGS.LARGE_TIME_DELTA),
            })
            return true
        },
    })

    // large decrement
    game.keybindings.register(MODULE_ID, 'large-decrement', {
        name: 'JDTIMEKEEPING.LargeDecrement',
        precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
        restricted: true,
        onDown: () => {
            game.modules.get(MODULE_ID).api?.increment({
                hours: -game.settings.get(MODULE_ID, SETTINGS.LARGE_TIME_DELTA),
            })
            return true
        },
    })
}
