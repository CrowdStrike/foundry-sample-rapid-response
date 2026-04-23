import { test as baseTest } from '@playwright/test';
import {
  FoundryHomePage, AppManagerPage, AppCatalogPage, config,
} from '@crowdstrike/foundry-playwright';
import { RapidResponseHomePage } from './pages/RapidResponseHomePage';
import { AllJobsPage } from './pages/AllJobsPage';
import { RunHistoryPage } from './pages/RunHistoryPage';
import { AuditLogPage } from './pages/AuditLogPage';

type FoundryFixtures = {
  foundryHomePage: FoundryHomePage;
  appManagerPage: AppManagerPage;
  appCatalogPage: AppCatalogPage;
  rapidResponseHomePage: RapidResponseHomePage;
  allJobsPage: AllJobsPage;
  runHistoryPage: RunHistoryPage;
  auditLogPage: AuditLogPage;
  appName: string;
};

export const test = baseTest.extend<FoundryFixtures>({
  foundryHomePage: async ({ page }, use) => { await use(new FoundryHomePage(page)); },
  appManagerPage: async ({ page }, use) => { await use(new AppManagerPage(page)); },
  appCatalogPage: async ({ page }, use) => { await use(new AppCatalogPage(page)); },
  rapidResponseHomePage: async ({ page }, use) => { await use(new RapidResponseHomePage(page)); },
  allJobsPage: async ({ page }, use) => { await use(new AllJobsPage(page)); },
  runHistoryPage: async ({ page }, use) => { await use(new RunHistoryPage(page)); },
  auditLogPage: async ({ page }, use) => { await use(new AuditLogPage(page)); },
  appName: async ({}, use) => { await use(config.appName); },
});

export { expect } from '@playwright/test';
