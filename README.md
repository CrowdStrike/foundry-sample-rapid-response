![CrowdStrike Falcon](/docs/asset/cs-logo.png?raw=true)

# Rapid Response sample Foundry app

The Rapid Response sample Foundry app is a community-driven, open source project which serves as an example of an app which can be built using CrowdStrike's Foundry ecosystem.
`foundry-sample-rapid-response` is not a formal CrowdStrike project and is maintained by the open source developer community.

This app is one of several App Templates included in Foundry that you can use to jumpstart your development.
It comes complete with a set of preconfigured capabilities aligned to its business purpose.

## Description

The Rapid Response sample Foundry app provides a way to orchestrate execution of executables and removal of files
across Windows-based systems, either by targeting specifying specific hosts or by targeting the host groups.

This app illustrates the following functionality amongst other components:
* use of LogScale saved searches
* use of RTR script orchestration via workflows, including scheduling
* use of UI components and extensions
* use of file uploads
* use of functions

## Basic information

### Dependencies

* Foundry CLI
* Go v1.21+ (needed if modifying functions).  See https://go.dev/learn/ for instructions to install.
* YARN (needed if modifying UI).  See https://yarnpkg.com/getting-started for instructions to install.

### Foundry capabilities used

* **Collections.**  Used by the app to store state information, such as metadata about created jobs, execution history, and an audit log.
* **Functions.**  Backend business logic for invoking workflows, normalizing and aggregating data to be returned to the UI, and modifying the state of the collections.
* **LogScale queries.**  Query results of RTR script execution from LogScale to extract metadata about on which hosts the scripts successfully executed.
* **RTR scripts.**  Executes executables on a target system.  Removes files from a targeted system.
* **UI navigation.**  Adds the app to the Falcon navigation for easy access.
* **UI pages.**  Custom UI pages to display results and manage the app.
* **Workflow templates.**  Workflows for orchestrating the execution of the jobs against individual hosts and host groups.

### Languages and frameworks used

* Functions
  * Go
  * CrowdStrike Foundry Function Go SDK (https://github.com/CrowdStrike/foundry-fn-go)
* RTR scripts
  * Powershell
* UI
  * HTML, CSS
  * Typescript, React

### Directory structure

* `collections`.  Schemas used in the collections used by this app.
* `functions`
  * `Func_Jobs`:  Creates and updates jobs, invokes workflows, and manages the audit log.
  * `job_history`:  Manages the job execution history.
* `rtr-scripts`
  * `check_file_exist`:  RTR script which checks if an executable or file is present on a Windows system.
  * `remove_file`:  RTR script which removes a file or executable if the file is present on a Windows system.
* `saved-searches/Query_By_WorkflowRootExecutionID`:  LogScale saved search for retrieving events by a workflow execution ID.
* `ui/pages/rapid-response-react`:  Single Page Application which serves as the frontend of the app.
* `workflows`: Workflow template definitions.  Fusion workflows are created from the templates in this directory.
  * `Install_software_Job_Template.yml`: Workflow to upload and invoke an executable via RTR on hosts. Results are written to LogScale.
  * `Notify_job_execution_template.yml`: Workflow which notifies the `job_history` function to report results of the `Install_software_Job_Template` and `Remove_file_template.yml`.
  * `Remove_file_template.yml`: Workflow to remove files from targeted hosts.  Results are written to LogScale.

## Deploying and installing the app

For detailed info about deploying and installing this app in your CID, see the Falcon Foundry product documentation:

* Deploy an app
  * US-1: [Deploy an app](https://falcon.crowdstrike.com/documentation/page/ofd46a1c/deploy-an-app)
  * US-2: [Deploy an app](https://falcon.us-2.crowdstrike.com/documentation/page/ofd46a1c/deploy-an-app)
  * EU-1: [Deploy an app](https://falcon.eu-1.crowdstrike.com/documentation/page/ofd46a1c/deploy-an-app)
* Create a new app using this app as template
  * US-1: [Create an app from a template](https://falcon.crowdstrike.com/documentation/page/l159717b/create-an-app#c4378b86)
  * US-2: [Create an app from a template](https://falcon.us-2.crowdstrike.com/documentation/page/l159717b/create-an-app#c4378b86)
  * EU-1: [Create an app from a template](https://falcon.eu-1.crowdstrike.com/documentation/page/l159717b/create-an-app#c4378b86)
* Run this app in development mode after deployment
  * US-1: [Iterate in development mode](https://falcon.crowdstrike.com/documentation/page/fb88e442/view-and-manage-apps#d5175ae2)
  * US-2: [Iterate in development mode](https://falcon.us-2.crowdstrike.com/documentation/page/fb88e442/view-and-manage-apps#d5175ae2)
  * EU-1: [Iterate in development mode](https://falcon.eu-1.crowdstrike.com/documentation/page/fb88e442/view-and-manage-apps#d5175ae2)
* Work with the Foundry capabilities of this app
  * US-1: [App capabilities](https://falcon.crowdstrike.com/documentation/category/u0daabab/app-capabilities)
  * US-2: [App capabilities](https://falcon.us-2.crowdstrike.com/documentation/category/u0daabab/app-capabilities)
  * EU-1: [App capabilities](https://falcon.eu-1.crowdstrike.com/documentation/category/u0daabab/app-capabilities)

## Foundry resources

See our product documentation:
* US-1: [Falcon Foundry](https://falcon.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry)
* US-2: [Falcon Foundry](https://falcon.us-2.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry)
* EU-1: [Falcon Foundry](https://falcon.eu-1.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry)

---

<p align="center"><img src="https://raw.githubusercontent.com/CrowdStrike/falconpy/main/docs/asset/cs-logo-footer.png"><BR/><img width="300px" src="https://raw.githubusercontent.com/CrowdStrike/falconpy/main/docs/asset/adversary-goblin-panda.png"></P>
<h3><P align="center">WE STOP BREACHES</P></h3>
