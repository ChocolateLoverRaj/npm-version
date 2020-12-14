# npm-version
Workflow that changes npm package version.

## What This Is For
These GitHub actions are for setting up automated npm package versioning and publishing in a GitHub repo.

## Setup
Follow these steps to setup a GitHub repo which uses these actions.

### npm-version
Updates the version to be either major, minor, or patch. It updates the `package.json` `version` field, and if `package-lock.json` exists, it also updates that `version` field.

Create the following branches
- `major`
- `minor`
- `patch`
Create three workflow files in your `.github/workflows` folder
- `major.yml`
- `minor.yml`
- `patch.yml`
This is what the workflows could look like
```yml
name: ${Type}
on:
  push:
    branches: [${type}]
jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update Version
        uses: ChocolateLoverRaj/npm-version@1.0.0
        with:
          version: '${type}'
          token: ${{ secrets.GITHUB_TOKEN }}
```
This workflow runs on the `push` event for the branch. First it checks out the repository, and then it uses the `npm-version` action. Then it merges the branch into the main branch. It needs two inputs. The version input is either `'major'`, `'minor'`, or `'patch'`. The token input is the repo GitHub token, needed for pushing commits and merging branches.

### merging
Since pull requests will be going into all four of the `main`, `major`, `minor`, and `patch` branches, it helps to have all of those branches up to date with each other. 

Create the workflow `merge.yml`:
```yml
name: Merge
on:
  push:
    branches: [main]
jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Merge Branch
        uses: ChocolateLoverRaj/npm-version/merge@1.0.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          bases: 'major,minor,patch'
```
This workflow runs on the `push` event for the `main` branch and merges the `main` branch into the other versioning branches. However, it won't run this workflow when merged by the `npm-version` workflow.

Update your versioning workflows:
```yml
name: ${Type}
on:
  push:
    branches: [${type}]
jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update Version
        uses: ChocolateLoverRaj/npm-version@1.0.0
        with:
          version: '${type}'
          token: ${{ secrets.GITHUB_TOKEN }}
          on-finish: 'on-finish.json'
```
This tells the action to run functions that are specified in the `on-finish.json` file after merging the branch.

In  your `on-finish.json`:
```json
{
    "$schema": "https://raw.githubusercontent.com/ChocolateLoverRaj/npm-version/main/on-finish-schema.json",
    "merge": {
        "bases": "major,minor,patch"
    }
}
```
The `$schema` key goes to the schema, which is a JSONSchema. The merge key tells it to merge the branches, like in `merge.yml`.

Now you are all setup with the basic versioning and merging. When making new features, merge them onto the `minor` branch. If they are breaking changes, merge them onto the `major` branch. If they are bug fixes, merge them onto the `patch` branch. If the changes you are making do not affect the npm package (such as adding tests), then merge it onto the `main` branch. After merging a pull request, you don't have to worry about the versioning and merging. It's all automated.

## Publishing
Another useful feature this action has is publishing the package to npm. Add a key to your `on-finish.json`.
```json
{
    "publish": {}
}
```
Do not put your npm token in your `on-finish.json`, because then it might be publicly visible. Instead, make a repo secret with your token, and set it as your `NPM_TOKEN` env variable when running the `npm-version` action:
```yml
name: ${Type}
on:
  push:
    branches: [${type}]
jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update Version
        uses: ChocolateLoverRaj/npm-version@1.0.0
        with:
          version: '${type}'
          token: ${{ secrets.GITHUB_TOKEN }}
          on-finish: 'on-finish.json'
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```
Create an `automation` npm token and put it in a GitHub secret. Then the package will publish your npm package.

## Releasing
Another nice thing to see in a github repository is the releases. This is also easy to automate with this action.

In your `on-finish.json`, add a `release` key:
```json
{
    "release": {}
}
```
That's it! Nothing else required. Releases will be created using the package version.

## Pull Request Checks
These features are to make pull requests an easier process. These do not modify the repository - they only check.

### Check
The `check` action checks if you've made any changes to npm related files. The `main` branch is not supposed to have changes to npm related files, because adding commits to the main branch do not publish a new version of the package. The other versioning branches *are* supposed to have changes because they publish a new version of the package, and it doesn't make sense to have two identical versions of an npm package.

Create a `check-main.yml`:
```yml
name: Check Same
on:
  pull_request:
    branches: [main]
jobs:
  npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check Npm
        uses: ChocolateLoverRaj/npm-version/check@main
        with:
          same: true
```
Here we use the `/check` action, and it accepts the `same` input. Setting it to `true` will make the test fail if there are changes, and setting it to `false` will make it fail if there aren't changes.

Create another workflow, `check-change.yml`, which is the same as `check-main.yml`, but set the `same` input to `false`.

### Freeze
The `freeze` action checks if any 'frozen' json properties have changed. For example, you could check if a contributor has changed the `version` property in the `package.json` file. You don't want contributors to change the `package.json` `version`, because that happens automatically.

Create a `freeze.yml` workflow:
```yml
name: Check Freeze
on:
  pull_request:
    branches: [main, major, minor, patch]
jobs:
  json:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check Json
        uses: ChocolateLoverRaj/npm-version/freeze@main
        with:
          options: 'freeze.json'
```
This action runs on all four branches (you can make it run on more branches too), and the config is in the `freeze.json` file. 

Create a `freeze.json` file:
```json
{
    "$schema": "https://raw.githubusercontent.com/ChocolateLoverRaj/npm-version/main/freeze/schema.json",
    "files": [
        {
            "file": "package.json",
            "freeze": {
                "name": true,
                "version": true,
                "author": true,
                "license": true
            }
        },
        {
            "file": "package-lock.json",
            "freeze": {
                "name": true,
                "version": true
            }
        }
    ]
}
```
The example above asserts that the `name`, `version`, `author`, and `license` properties have not changed in `package.json`. It also asserts that the `name` and `version` properties have not changed in `package-lock.json`.

This json file also has a schema. The `files` property tells it to check the following files. In each file object, there is a `file` property and a `freeze` property. The `file` property is the name of the json file you want to check. The `freeze` property tells the action which properties should not change. If the frozen properties have been modified, this check fails.
