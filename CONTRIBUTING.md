# How to Contribute to the Easy Exalted Timekeeping Project

## Did you find a bug?

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/DC23/jd-easytimekeeping/issues).

- If you're unable to find an open issue addressing the problem, then open a new one, preferrably using one of the templates. Include as much information as possible about the issue, when it occurs, and how to reproduce or find it. The templates provide guidance on exactly what information we find most helpful.

## Do you have ideas for new features, or changes you'd like to see?

- Post a [feature request](https://github.com/DC23/jd-easytimekeeping/issues). Be sure to use the template :)

## Do you intend to add a new feature or change an existing one?

Great!

- It's the standard open-source approach:
  - make an issue for the feature request if it's a new feature, or add a comment to the issue if it's an existing one.
  - make a branch in your fork corresponding to the new feature, bug fix, or change.
  - Submit the Pull Request.
  - Try to restrict it to one feature or bug per PR. Complex Pull Requests containing multiple changes, features, or bug fixes are difficult to review and test and I may decide that it's just too hard to accept.
    - Note that one feature doesn't mean one commit, or one changed file per PR. I'm talking about one logical feature. If you need to make multiple changes in multiple files, but those changes are all logically related and required to support ***The One Thing*** that the pull request is about, that's ok. The key idea is that a PR be focused on one thing: one bug fix, one feature, or one change.
- New translations are always welcome. Please see the note for translators just below. :heart:
- Note PRs consisting entirely or predominantly of cosmetic changes to code - formatting and so on - will not be accepted unless you have a very strong argument for why it's an improvement to the code quality.
  I use [Prettier](https://prettier.io/) in VS Code to do the formatting, with the configuration in the [.prettierrc](./.prettierrc) file. Ideally, any PRs with code will already be formatted but if they are not then
  I will format them after merging.

## Are You Contributing a Translation?

Awesome! :heart: :heart:

But please be aware that since I'm not a polyglot, while I'm overjoyed to accept new translations I am unable to maintain them. And since this module is still in active development, the database of strings is changing over time. Here's the process I use to keep you informed of the changes, which will hopefully streamline the maintenance effort:

- As each new release is in development, I will create a GitHub Issue called **"vX.Y.Z Language String Changes"**, with the `in progress` label.
- During the development of vX.Y.Z, I will keep that Issue updated with a list of the string keys for any changes or additions.
- New/added keys will be added to the bottom of language files with the English text as a placeholder.
- If I delete strings, I will delete those from all language files myself.
- When I finish development on vX.Y.Z, I will remove the `in progress` label and add the `help wanted` label to the
**"vX.Y.Z Language String Changes"** Issue.
- However, as the number of translations grows, I can't delay releases until all translations are updated. Therefore, once a new release is ready, I will release it without updated language files. The module will keep working, but with placeholder English text for new strings.
- As soon as PRs arrive for updates to language support, I'll do my best to merge those and ship a patch release as soon as possible.

## A Note About the API Documentation

The API documentation is built with [documentation.js](https://github.com/documentationjs/documentation). The current setup is a bit old-school,
in that I'm building the documentation at the command-line with Make and then manually committing the updated files to git.
It will make a lot more sense to move this workflow into a GitHub Action, and I will probably do that one day.
But for now, just make sure any code PRs have sensible JSDoc on them and the API docs will work themselves out.

---

Remember, this is a volunteer effort, run by people with lives and committments.

Thanks! :heart: :heart: :heart:
