# npm-version
Workflow that changes npm package version.

## What This Is For
These GitHub actions are for setting up automated npm package versioning and publishing in a GitHub repo.

## Setup
Follow these steps to setup a GitHub repo which uses these actions.

### npm-version
Updates the version to be either major, minor, or patch.
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
This workflow runs on the `push` event for the branch. First it checks out the repository, and then it uses the `npm-version` action.