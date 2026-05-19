export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.header = page.getByRole('banner');
    // Fallback selectors in case UI uses generic Vuetify classes
    this.papersList = page.locator('.papers-list').or(page.locator('.v-data-table'));
    this.uploadButton = page.getByRole('button', { name: /subir|nuevo paper|upload/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickUpload() {
    await this.uploadButton.click();
  }
}
