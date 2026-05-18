export class PaperPage {
  constructor(page) {
    this.page = page;
    this.fileInput = page.locator('input[type="file"]');
    this.titleInput = page.getByLabel(/título|title/i);
    this.submitButton = page.getByRole('button', { name: /enviar|submit|guardar/i });
  }

  async uploadPaper(title, filePath) {
    if (title) await this.titleInput.fill(title);
    await this.fileInput.setInputFiles(filePath);
    await this.submitButton.click();
  }
}
