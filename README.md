![CrowdStrike Falcon](/docs/asset/cs-logo.png?raw=true)

# Rapid Response sample Foundry app

The Rapid Response sample Foundry app is a community-driven, open source project which serves as an example of an app which can be built using CrowdStrike's Foundry ecosystem.
`foundry-sample-rapid-response` is an open source project, not a CrowdStrike product. As such, it carries no formal support, expressed or implied.

This app is one of several App Templates included in Foundry that you can use to jumpstart your development. It comes complete with a set of 
preconfigured capabilities aligned to its business purpose. Deploy this app from the Templates page with a single click in the Foundry UI, or 
create an app from this template using the CLI.

> [!IMPORTANT]  
> To deploy this sample app, you need access to the Falcon console.

## Description

The Rapid Response sample Foundry app provides a way to orchestrate execution of executables and removal of files
across Windows-based systems, either by targeting specific hosts or by targeting the host groups.

This app illustrates the following functionality amongst other components:
* use of saved searches
* use of RTR script orchestration via workflows, including scheduling
* use of UI components and extensions
* use of file uploads
* use of functions

## Prerequisites

* The Foundry CLI (instructions below).
* Go v1.23+ (needed if modifying the app's functions). See https://go.dev/learn for installation instructions.
* Yarn (needed if modifying the app's UI). See https://yarnpkg.com/getting-started for installation instructions.

### Install the Foundry CLI

You can install the Foundry CLI with Scoop on Windows or Homebrew on Linux/macOS.

**Windows**:

Install [Scoop](https://scoop.sh/). Then, add the Foundry CLI bucket and install the Foundry CLI.

```shell
scoop bucket add foundry https://github.com/crowdstrike/scoop-foundry-cli.git
scoop install foundry
```

Or, you can download the [latest Windows zip file](https://assets.foundry.crowdstrike.com/cli/latest/foundry_Windows_x86_64.zip), expand it, and add the install directory to your PATH environment variable.

**Linux and macOS**:

Install [Homebrew](https://docs.brew.sh/Installation). Then, add the Foundry CLI repository to the list of formulae that Homebrew uses and install the CLI:

```shell
brew tap crowdstrike/foundry-cli
brew install crowdstrike/foundry-cli/foundry
```

Run `foundry version` to verify it's installed correctly.

## Getting Started

Clone this sample to your local system, or [download as a zip file](https://github.com/CrowdStrike/foundry-sample-rapid-response/archive/refs/heads/main.zip).

```shell
git clone https://github.com/CrowdStrike/foundry-sample-rapid-response
cd foundry-sample-rapid-response
```

Log in to Foundry:

```shell
foundry login
```

Select the following permissions:

- [x] Run RTR Scripts
- [x] Run, execute, and test Workflows
- [x] Run, execute, and test API integrations
- [x] Run, execute, and test LogScale queries
- [ ] (optional) Generate mock data to test your app

Deploy the app:

```shell
foundry apps deploy
```

> [!TIP]
> If you get an error that the name already exists, change the name to something unique to your CID in `manifest.yml`.

Once the deployment has finished, you can release the app:

```shell
foundry apps release
```

Next, go to **Foundry** > **App catalog**, find your app, and install it. Select the **Open App** button in the success dialog.

> [!TIP]
> If the app doesn't load, reload the page.

You should be able to create a job and save it.

## About this sample app

### Foundry capabilities used

* **Collections.** Used by the app to store state information, such as metadata about created jobs, execution history, and an audit log.
* **Functions.** Backend business logic for invoking workflows, normalizing and aggregating data to be returned to the UI, and modifying the state of the collections.
* **Queries.** Query results of RTR script execution to extract metadata about on which hosts the scripts successfully executed.
* **RTR scripts.** Executes executables on a target system. Removes files from a targeted system.
* **UI navigation.** Adds the app to the Falcon navigation for easy access.
* **UI pages.** Custom UI pages to display results and manage the app.
* **Workflow templates.** Workflows for orchestrating the execution of the jobs against individual hosts and host groups.

### Languages and frameworks used

* Functions
  * Go
  * CrowdStrike Foundry Function Go SDK (https://github.com/CrowdStrike/foundry-fn-go)
* RTR scripts
  * PowerShell
* UI
  * HTML, CSS
  * TypeScript, React

### Directory structure

* `collections`. Schemas used in the collections used by this app.
* `functions`
  * `Func_Jobs`: Creates and updates jobs, invokes workflows, and manages the audit log.
  * `job_history`: Manages the job execution history.
* `rtr-scripts`
  * `check_file_exist`: RTR script which checks if an executable or file is present on a Windows system.
  * `remove_file`: RTR script which removes a file or executable if the file is present on a Windows system.
* `saved-searches/Query_By_WorkflowRootExecutionID`: Saved search for retrieving events by a workflow execution ID.
* `ui/pages/rapid-response-react`: Single Page Application which serves as the frontend of the app.
* `workflows`: Workflow template definitions. Fusion workflows are created from the templates in this directory.
  * `Install_software_Job_Template.yml`: Workflow to upload and invoke an executable via RTR on hosts. Results are written to LogScale.
  * `Notify_job_execution_template.yml`: Workflow which notifies the `job_history` function to report results of the `Install_software_Job_Template` and `Remove_file_template.yml`.
  * `Remove_file_template.yml`: Workflow to remove files from targeted hosts. Results are written to LogScale.

## Foundry resources

- Foundry documentation: [US-1](https://falcon.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry) | [US-2](https://falcon.us-2.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry) | [EU](https://falcon.eu-1.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry)
- Foundry learning resources: [US-1](https://falcon.crowdstrike.com/foundry/learn) | [US-2](https://falcon.us-2.crowdstrike.com/foundry/learn) | [EU](https://falcon.eu-1.crowdstrike.com/foundry/learn)

---

<p align="center"><img src="https://raw.githubusercontent.com/CrowdStrike/falconpy/main/docs/asset/cs-logo-footer.png"><BR/><img width="300px" src="https://raw.githubusercontent.com/CrowdStrike/falconpy/main/docs/asset/adversary-goblin-panda.png"></P>
<h3><P align="center">WE STOP BREACHES</P></h3>
