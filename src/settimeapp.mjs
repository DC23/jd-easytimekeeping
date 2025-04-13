/**
 * The set time application dialog
 */
import { MODULE_ID } from './settings.mjs'
import { Helpers } from './helpers.mjs'
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class SetTimeApplication extends HandlebarsApplicationMixin(ApplicationV2) {
    static ID = 'jd-et-settimeapp'
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['form', 'etk-dialog'],
        id: SetTimeApplication.ID,
        window: {
            icon: 'fa-solid fa-clock',
            title: 'JDTIMEKEEPING.SetTime.title',
            width: 500,
        },
        form: {
            handler: SetTimeApplication.#onSubmit,
            closeOnSubmit: true,
        },
    }

    static PARTS = {
        form: {
            template: `modules/${MODULE_ID}/templates/setTimeDialog.hbs`,
        },
        footer: {
            template: 'templates/generic/form-footer.hbs',
        },
    }

    async _prepareContext (options) {
        const time = await game.modules.get(MODULE_ID).api.getTime()
        const context = {
            setTime: Helpers.toTimeOfDay(time, '24hour'),
            setDay: time.days + 1,
            buttons: [
                {
                    type: 'submit',
                    icon: 'fa-solid fa-save',
                    label: 'SETTINGS.Save',
                },
            ],
        }
        return context
    }

    static async #onSubmit (event, form, formData) {
        const settings = foundry.utils.expandObject(formData.object)
        const time = Helpers.splitTimeString(settings.setTime)
        time.days = settings.setDay - 1
        await game.modules.get(MODULE_ID).api.set(time)
    }
}
